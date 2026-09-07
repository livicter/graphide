use graphide_ir::{Bubble, BubbleId, ClusterDeltaKind, ClusterFact, Graph, NodeId};
use indexmap::{IndexMap, IndexSet};
use std::collections::{HashMap, HashSet, VecDeque};

const LEAF_MAX: usize = 4;

/// Recursive agglomerative clustering on weighted edges. Contains excluded.
pub fn cluster(graph: &Graph) -> Vec<Bubble> {
    cluster_with(graph, None)
}

/// Same as [`cluster`], reporting leaf-assigned nodes as work completes.
pub fn cluster_with(graph: &Graph, progress: Option<&dyn Fn(usize, usize)>) -> Vec<Bubble> {
    let node_ids: Vec<NodeId> = graph.nodes.iter().map(|n| n.id).collect();
    if node_ids.is_empty() {
        return Vec::new();
    }
    let adj = build_adj(graph);
    let fqn: HashMap<NodeId, String> = graph.nodes.iter().map(|n| (n.id, n.fqn.clone())).collect();
    let mut bubbles = Vec::new();
    let mut next_id = 1u64;
    let total = node_ids.len();
    let assigned = std::cell::Cell::new(0usize);
    let on_leaf = |n: usize| {
        assigned.set(assigned.get() + n);
        if let Some(p) = progress {
            p(assigned.get(), total);
        }
    };
    // First cut under the program => coarse bubbles (parent == None).
    let parts = if node_ids.len() <= LEAF_MAX || !can_split(&node_ids, &adj) {
        vec![node_ids.clone()]
    } else {
        let p = partition(&node_ids, &adj, graph);
        if p.len() <= 1 {
            vec![node_ids.clone()]
        } else {
            p
        }
    };
    for part in parts {
        cluster_rec(
            &part,
            None,
            &adj,
            &fqn,
            graph,
            &mut bubbles,
            &mut next_id,
            &on_leaf,
        );
    }
    bubbles
}

fn build_adj(graph: &Graph) -> HashMap<NodeId, Vec<(NodeId, f64)>> {
    let mut adj: HashMap<NodeId, Vec<(NodeId, f64)>> = HashMap::new();
    for n in &graph.nodes {
        adj.entry(n.id).or_default();
    }
    // Strongest kind wins. TypeUses + Imports on the same pair must stay 0.25,
    // not 0.50, or communities collapse (SPEC weights are per kind, not stacked).
    let mut best: HashMap<(u64, u64), f64> = HashMap::new();
    for e in &graph.edges {
        let w = e.kind.cluster_weight();
        if w <= 0.0 {
            continue;
        }
        let (a, b) = if e.from.0 <= e.to.0 {
            (e.from.0, e.to.0)
        } else {
            (e.to.0, e.from.0)
        };
        let slot = best.entry((a, b)).or_insert(0.0);
        if w > *slot {
            *slot = w;
        }
    }
    for ((a, b), w) in best {
        let a = NodeId(a);
        let b = NodeId(b);
        adj.entry(a).or_default().push((b, w));
        adj.entry(b).or_default().push((a, w));
    }
    adj
}

fn cluster_rec(
    members: &[NodeId],
    parent: Option<BubbleId>,
    adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
    fqn: &HashMap<NodeId, String>,
    graph: &Graph,
    out: &mut Vec<Bubble>,
    next_id: &mut u64,
    on_leaf: &dyn Fn(usize),
) {
    if members.is_empty() {
        return;
    }
    if members.len() <= LEAF_MAX || !can_split(members, adj) {
        let id = BubbleId(*next_id);
        *next_id += 1;
        out.push(Bubble {
            id,
            parent,
            members: members.to_vec(),
            label: label_for(members, fqn, graph),
        });
        on_leaf(members.len());
        return;
    }

    let parts = partition(members, adj, graph);
    if parts.len() <= 1 {
        let id = BubbleId(*next_id);
        *next_id += 1;
        out.push(Bubble {
            id,
            parent,
            members: members.to_vec(),
            label: label_for(members, fqn, graph),
        });
        on_leaf(members.len());
        return;
    }

    // Coarse / inner bubble for this community, then recurse children.
    let id = BubbleId(*next_id);
    *next_id += 1;
    out.push(Bubble {
        id,
        parent,
        members: members.to_vec(),
        label: label_for(members, fqn, graph),
    });
    for part in parts {
        if part.len() == members.len() {
            continue;
        }
        cluster_rec(&part, Some(id), adj, fqn, graph, out, next_id, on_leaf);
    }
}

fn can_split(members: &[NodeId], adj: &HashMap<NodeId, Vec<(NodeId, f64)>>) -> bool {
    let set: HashSet<_> = members.iter().copied().collect();
    let mut edge_count = 0;
    for &n in members {
        if let Some(ns) = adj.get(&n) {
            for (m, _) in ns {
                if set.contains(m) && m.0 > n.0 {
                    edge_count += 1;
                }
            }
        }
    }
    edge_count > 0
}

/// Prefer a balanced articulation-point cut (endpoint sitting between
/// publisher and subscriber), then MST light-edge cut, then components.
fn partition(
    members: &[NodeId],
    adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
    graph: &Graph,
) -> Vec<Vec<NodeId>> {
    if let Some(parts) = split_at_articulation(members, adj, graph) {
        if parts.len() >= 2 {
            return parts;
        }
    }
    mst_partition(members, adj)
}

fn split_at_articulation(
    members: &[NodeId],
    adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
    graph: &Graph,
) -> Option<Vec<Vec<NodeId>>> {
    let aps = articulation_points(members, adj);
    let mut best: Option<(i64, NodeId, Vec<Vec<NodeId>>)> = None;
    for ap in aps {
        let comps = components_without(members, adj, ap);
        if comps.len() < 2 {
            continue;
        }
        let mut sizes: Vec<usize> = comps.iter().map(|c| c.len()).collect();
        sizes.sort_unstable_by(|a, b| b.cmp(a));
        let score = match (sizes.first(), sizes.get(1)) {
            (Some(&a), Some(&b)) => (a as i64) * (b as i64),
            (Some(&a), None) => a as i64,
            _ => continue,
        };
        if score < 2 {
            continue;
        }
        // Endpoint joints stay their own coarse bubble so Steiner can cross runs.
        let is_endpoint = graph
            .nodes
            .iter()
            .any(|n| n.id == ap && n.kind == graphide_ir::NodeKind::Endpoint);
        let mut parts = comps;
        if is_endpoint || parts.iter().all(|c| c.len() >= 2) {
            parts.push(vec![ap]);
        } else {
            // Tie the AP to the largest remaining component.
            if let Some(largest) = parts.iter_mut().max_by_key(|c| c.len()) {
                largest.push(ap);
            }
        }
        if best
            .as_ref()
            .map(|(s, id, _)| score > *s || (score == *s && ap.0 < id.0))
            .unwrap_or(true)
        {
            best = Some((score, ap, parts));
        }
    }
    best.map(|(_, _, parts)| parts)
}

fn articulation_points(
    members: &[NodeId],
    adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
) -> Vec<NodeId> {
    let set: HashSet<_> = members.iter().copied().collect();
    let mut time = 0u32;
    let mut disc: HashMap<NodeId, u32> = HashMap::new();
    let mut low: HashMap<NodeId, u32> = HashMap::new();
    let mut parent: HashMap<NodeId, NodeId> = HashMap::new();
    let mut aps = HashSet::new();

    fn visit(
        u: NodeId,
        set: &HashSet<NodeId>,
        adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
        time: &mut u32,
        disc: &mut HashMap<NodeId, u32>,
        low: &mut HashMap<NodeId, u32>,
        parent: &mut HashMap<NodeId, NodeId>,
        aps: &mut HashSet<NodeId>,
    ) {
        *time += 1;
        disc.insert(u, *time);
        low.insert(u, *time);
        let mut children = 0;
        if let Some(ns) = adj.get(&u) {
            for &(v, _) in ns {
                if !set.contains(&v) {
                    continue;
                }
                if !disc.contains_key(&v) {
                    children += 1;
                    parent.insert(v, u);
                    visit(v, set, adj, time, disc, low, parent, aps);
                    if let (Some(&lu), Some(&lv)) = (low.get(&u), low.get(&v)) {
                        low.insert(u, lu.min(lv));
                    }
                    if parent.get(&u).is_none() && children > 1 {
                        aps.insert(u);
                    }
                    if parent.get(&u).is_some() {
                        if let (Some(&lv), Some(&du)) = (low.get(&v), disc.get(&u)) {
                            if lv >= du {
                                aps.insert(u);
                            }
                        }
                    }
                } else if parent.get(&u) != Some(&v) {
                    if let (Some(&lu), Some(&dv)) = (low.get(&u), disc.get(&v)) {
                        low.insert(u, lu.min(dv));
                    }
                }
            }
        }
    }

    for &n in members {
        if !disc.contains_key(&n) {
            visit(
                n,
                &set,
                adj,
                &mut time,
                &mut disc,
                &mut low,
                &mut parent,
                &mut aps,
            );
        }
    }
    aps.into_iter().collect()
}

fn components_without(
    members: &[NodeId],
    adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
    skip: NodeId,
) -> Vec<Vec<NodeId>> {
    let set: HashSet<_> = members.iter().copied().filter(|n| *n != skip).collect();
    let remain: Vec<NodeId> = members.iter().copied().filter(|n| *n != skip).collect();
    let mut seen = HashSet::new();
    let mut out = Vec::new();
    for &start in &remain {
        if !seen.insert(start) {
            continue;
        }
        let mut q = VecDeque::from([start]);
        let mut comp = vec![start];
        while let Some(n) = q.pop_front() {
            if let Some(ns) = adj.get(&n) {
                for &(m, _) in ns {
                    if set.contains(&m) && seen.insert(m) {
                        q.push_back(m);
                        comp.push(m);
                    }
                }
            }
        }
        out.push(comp);
    }
    out
}

fn mst_partition(
    members: &[NodeId],
    adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
) -> Vec<Vec<NodeId>> {
    let set: IndexSet<_> = members.iter().copied().collect();
    let mut edges = Vec::new();
    for &a in &set {
        if let Some(ns) = adj.get(&a) {
            for &(b, w) in ns {
                if set.contains(&b) && b.0 > a.0 {
                    edges.push((w, a, b));
                }
            }
        }
    }
    edges.sort_by(|x, y| y.0.partial_cmp(&x.0).unwrap_or(std::cmp::Ordering::Equal));

    // Start fully connected via heaviest edges; cut lightest half of MST-ish links.
    let mut parent: HashMap<NodeId, NodeId> = members.iter().map(|&n| (n, n)).collect();
    fn find(p: &mut HashMap<NodeId, NodeId>, x: NodeId) -> NodeId {
        let mut r = x;
        loop {
            match p.get(&r).copied() {
                Some(parent) if parent != r => r = parent,
                Some(_) => break,
                None => {
                    p.insert(r, r);
                    break;
                }
            }
        }
        let mut c = x;
        while let Some(parent) = p.get(&c).copied() {
            if parent == r {
                break;
            }
            p.insert(c, r);
            c = parent;
        }
        r
    }
    fn union(p: &mut HashMap<NodeId, NodeId>, a: NodeId, b: NodeId) -> bool {
        let ra = find(p, a);
        let rb = find(p, b);
        if ra == rb {
            return false;
        }
        p.insert(ra, rb);
        true
    }

    let mut used = Vec::new();
    for &(_, a, b) in &edges {
        if union(&mut parent, a, b) {
            used.push((a, b));
        }
    }
    if used.len() < 1 {
        return vec![members.to_vec()];
    }

    // Remove lightest used edges until we get 2+ components (up to sqrt(n) parts).
    let target_parts = (members.len() as f64).sqrt().ceil().max(2.0) as usize;
    let cut = used.clone();
    // Rebuild without last k lightest — used was heaviest-first, so reverse cut from end.
    let mut k = 1;
    loop {
        parent = members.iter().map(|&n| (n, n)).collect();
        let keep = cut.len().saturating_sub(k);
        for &(a, b) in cut.iter().take(keep) {
            union(&mut parent, a, b);
        }
        let mut groups: IndexMap<NodeId, Vec<NodeId>> = IndexMap::new();
        for &n in members {
            let r = find(&mut parent, n);
            groups.entry(r).or_default().push(n);
        }
        if groups.len() >= 2 && groups.len() <= target_parts.max(2) {
            return groups.into_values().collect();
        }
        if keep == 0 || k > cut.len() {
            // Connected components of full adj.
            return connected_components(members, adj);
        }
        k += 1;
    }
}

fn connected_components(
    members: &[NodeId],
    adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
) -> Vec<Vec<NodeId>> {
    let set: HashSet<_> = members.iter().copied().collect();
    let mut seen = HashSet::new();
    let mut out = Vec::new();
    for &start in members {
        if !seen.insert(start) {
            continue;
        }
        let mut q = VecDeque::from([start]);
        let mut comp = vec![start];
        while let Some(n) = q.pop_front() {
            if let Some(ns) = adj.get(&n) {
                for &(m, _) in ns {
                    if set.contains(&m) && seen.insert(m) {
                        q.push_back(m);
                        comp.push(m);
                    }
                }
            }
        }
        out.push(comp);
    }
    out
}

fn label_for(members: &[NodeId], fqn: &HashMap<NodeId, String>, graph: &Graph) -> String {
    // Lightweight PageRank-ish: highest weighted degree inside the bubble.
    let set: HashSet<_> = members.iter().copied().collect();
    let mut score: HashMap<NodeId, f64> = members.iter().map(|&n| (n, 0.0)).collect();
    let mut best: HashMap<(u64, u64), f64> = HashMap::new();
    for e in &graph.edges {
        let w = e.kind.cluster_weight();
        if w <= 0.0 {
            continue;
        }
        if !set.contains(&e.from) || !set.contains(&e.to) {
            continue;
        }
        let (a, b) = if e.from.0 <= e.to.0 {
            (e.from.0, e.to.0)
        } else {
            (e.to.0, e.from.0)
        };
        let slot = best.entry((a, b)).or_insert(0.0);
        if w > *slot {
            *slot = w;
        }
    }
    for ((a, b), w) in best {
        *score.entry(NodeId(a)).or_default() += w;
        *score.entry(NodeId(b)).or_default() += w;
    }
    let best = members
        .iter()
        .max_by(|a, b| {
            score
                .get(a)
                .unwrap_or(&0.0)
                .partial_cmp(score.get(b).unwrap_or(&0.0))
                .unwrap_or(std::cmp::Ordering::Equal)
        })
        .copied();
    best.and_then(|id| fqn.get(&id).cloned())
        .unwrap_or_else(|| "bubble".into())
}

/// Match new bubbles to previous by member overlap. Outer stickier (already ordered).
pub fn sticky_match(previous: &[Bubble], current: &mut [Bubble]) {
    let mut used_prev = HashSet::new();
    let mut matched = vec![false; current.len()];
    // Prefer matching coarse (parent None) first, then by size descending.
    let mut order: Vec<usize> = (0..current.len()).collect();
    order.sort_by_key(|&i| {
        let b = &current[i];
        (b.parent.is_some(), std::cmp::Reverse(b.members.len()))
    });
    for i in order {
        let members: HashSet<_> = current[i].members.iter().copied().collect();
        let mut best: Option<(usize, f64)> = None;
        for (j, prev) in previous.iter().enumerate() {
            if used_prev.contains(&j) {
                continue;
            }
            if prev.parent.is_none() != current[i].parent.is_none() {
                continue;
            }
            let prev_set: HashSet<_> = prev.members.iter().copied().collect();
            let inter = members.intersection(&prev_set).count() as f64;
            let union = members.union(&prev_set).count() as f64;
            if union == 0.0 {
                continue;
            }
            let jaccard = inter / union;
            if jaccard > 0.0 && best.map(|(_, s)| jaccard > s).unwrap_or(true) {
                best = Some((j, jaccard));
            }
        }
        if let Some((j, _)) = best {
            current[i].id = previous[j].id;
            used_prev.insert(j);
            matched[i] = true;
        }
    }
    // Clustering assigns sequential ids that often equal a previous BubbleId.
    // An unmatched current that still holds a claimed sticky id must get a
    // fresh one, or two communities share an identity.
    let claimed: HashSet<u64> = current
        .iter()
        .enumerate()
        .filter(|(i, _)| matched[*i])
        .map(|(_, b)| b.id.0)
        .collect();
    let mut next_id = current
        .iter()
        .map(|b| b.id.0)
        .chain(previous.iter().map(|b| b.id.0))
        .max()
        .unwrap_or(0)
        + 1;
    let mut remaps = Vec::new();
    for (i, b) in current.iter_mut().enumerate() {
        if matched[i] || !claimed.contains(&b.id.0) {
            continue;
        }
        let old = b.id;
        b.id = BubbleId(next_id);
        next_id += 1;
        remaps.push((old, b.id));
    }
    for (old, new) in remaps {
        for b in current.iter_mut() {
            if b.parent == Some(old) {
                b.parent = Some(new);
            }
        }
    }
}

/// Coarse-community facts after [`sticky_match`]. Nested bubbles are
/// ignored — Map LOD is parent-null. Kind is stable / split / merge /
/// relabel when a previous `BubbleId` stuck; added / removed otherwise.
pub fn cluster_delta(previous: &[Bubble], current: &[Bubble]) -> Vec<ClusterFact> {
    let prev = coarse_bubbles(previous);
    let curr = coarse_bubbles(current);
    let prev_by_id: HashMap<u64, &Bubble> = prev.iter().map(|b| (b.id.0, *b)).collect();
    let curr_ids: HashSet<u64> = curr.iter().map(|b| b.id.0).collect();

    let member_set = |b: &Bubble| -> HashSet<NodeId> { b.members.iter().copied().collect() };

    let dests_of = |p: &Bubble| -> usize {
        let set = member_set(p);
        curr.iter()
            .filter(|c| c.members.iter().any(|m| set.contains(m)))
            .count()
    };
    let srcs_of = |c: &Bubble| -> usize {
        let set = member_set(c);
        prev.iter()
            .filter(|p| p.members.iter().any(|m| set.contains(m)))
            .count()
    };

    let mut facts = Vec::new();
    let mut used_prev = HashSet::new();
    for c in &curr {
        if let Some(p) = prev_by_id.get(&c.id.0) {
            used_prev.insert(c.id.0);
            let dests = dests_of(p);
            let srcs = srcs_of(c);
            let kind = if dests > 1 {
                ClusterDeltaKind::Split
            } else if srcs > 1 {
                ClusterDeltaKind::Merge
            } else if c.label != p.label {
                ClusterDeltaKind::Relabel
            } else {
                ClusterDeltaKind::Stable
            };
            let detail = match kind {
                ClusterDeltaKind::Stable => format!("kept bubble {}", c.id.0),
                ClusterDeltaKind::Relabel => {
                    format!("bubble {} · {} → {}", c.id.0, p.label, c.label)
                }
                ClusterDeltaKind::Split => {
                    format!("bubble {} split · {dests} communities share members", c.id.0)
                }
                ClusterDeltaKind::Merge => {
                    format!("bubble {} merged · {srcs} parent communities", c.id.0)
                }
                ClusterDeltaKind::Added | ClusterDeltaKind::Removed => {
                    format!("bubble {}", c.id.0)
                }
            };
            facts.push(ClusterFact {
                kind,
                bubble: c.id,
                label: c.label.clone(),
                previous_label: Some(p.label.clone()),
                detail,
            });
        } else {
            facts.push(ClusterFact {
                kind: ClusterDeltaKind::Added,
                bubble: c.id,
                label: c.label.clone(),
                previous_label: None,
                detail: format!("new community · bubble {}", c.id.0),
            });
        }
    }
    for p in &prev {
        if used_prev.contains(&p.id.0) || curr_ids.contains(&p.id.0) {
            continue;
        }
        facts.push(ClusterFact {
            kind: ClusterDeltaKind::Removed,
            bubble: p.id,
            label: p.label.clone(),
            previous_label: None,
            detail: format!("gone community · bubble {}", p.id.0),
        });
    }
    facts.sort_by(|a, b| {
        cluster_kind_ord(a.kind)
            .cmp(&cluster_kind_ord(b.kind))
            .then(a.bubble.0.cmp(&b.bubble.0))
            .then(a.label.cmp(&b.label))
    });
    facts
}

fn cluster_kind_ord(k: ClusterDeltaKind) -> u8 {
    match k {
        ClusterDeltaKind::Stable => 0,
        ClusterDeltaKind::Relabel => 1,
        ClusterDeltaKind::Split => 2,
        ClusterDeltaKind::Merge => 3,
        ClusterDeltaKind::Added => 4,
        ClusterDeltaKind::Removed => 5,
    }
}

/// Coarse communities = bubbles with parent == null.
pub fn coarse_bubbles(bubbles: &[Bubble]) -> Vec<&Bubble> {
    bubbles.iter().filter(|b| b.parent.is_none()).collect()
}

pub fn node_coarse_bubble(bubbles: &[Bubble], node: NodeId) -> Option<BubbleId> {
    bubbles
        .iter()
        .filter(|b| b.parent.is_none() && b.members.contains(&node))
        .map(|b| b.id)
        .next()
}

/// Members of the coarse bubble with this sticky `BubbleId`. Empty when
/// the id is missing or only a nested (`parent != null`) bubble.
pub fn bubble_members(bubbles: &[Bubble], id: BubbleId) -> Vec<NodeId> {
    bubbles
        .iter()
        .find(|b| b.id == id && b.parent.is_none())
        .map(|b| b.members.clone())
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn bubble(id: u64, parent: Option<u64>, members: &[u64], label: &str) -> Bubble {
        Bubble {
            id: BubbleId(id),
            parent: parent.map(BubbleId),
            members: members.iter().copied().map(NodeId).collect(),
            label: label.into(),
        }
    }

    #[test]
    fn sticky_match_keeps_id_when_membership_overlaps() {
        let prev = vec![bubble(7, None, &[1, 2, 3, 4], "keep")];
        let mut curr = vec![bubble(99, None, &[1, 2, 3, 5], "keep")];
        sticky_match(&prev, &mut curr);
        assert_eq!(curr[0].id.0, 7);
    }

    #[test]
    fn sticky_match_leaves_fresh_id_on_unrelated_community() {
        let prev = vec![bubble(7, None, &[1, 2, 3], "a")];
        let mut curr = vec![
            bubble(99, None, &[1, 2, 3], "a"),
            bubble(100, None, &[10, 11], "new"),
        ];
        sticky_match(&prev, &mut curr);
        assert_eq!(curr[0].id.0, 7);
        assert_eq!(curr[1].id.0, 100);
    }

    #[test]
    fn sticky_match_does_not_pair_coarse_with_nested() {
        let prev = vec![bubble(7, None, &[1, 2, 3, 4], "coarse")];
        let mut curr = vec![
            bubble(99, None, &[10, 11], "other"),
            bubble(100, Some(99), &[1, 2, 3, 4], "nested"),
        ];
        sticky_match(&prev, &mut curr);
        assert_eq!(curr[0].id.0, 99);
        assert_eq!(curr[1].id.0, 100);
        assert_eq!(curr[1].parent, Some(BubbleId(99)));
    }

    #[test]
    fn sticky_match_pairs_coarse_to_coarse_and_nested_to_nested() {
        let prev = vec![
            bubble(7, None, &[1, 2, 3, 4], "coarse"),
            bubble(8, Some(7), &[1, 2], "inner"),
        ];
        let mut curr = vec![
            bubble(99, None, &[1, 2, 3, 4], "coarse"),
            bubble(100, Some(99), &[1, 2], "inner"),
        ];
        sticky_match(&prev, &mut curr);
        assert_eq!(curr[0].id.0, 7);
        assert_eq!(curr[1].id.0, 8);
    }

    #[test]
    fn sticky_match_uniquifies_unmatched_id_collision() {
        let prev = vec![bubble(4, None, &[10, 11], "prev")];
        let mut curr = vec![
            bubble(4, None, &[1, 2], "unrelated"),
            bubble(40, Some(4), &[1], "child"),
            bubble(5, None, &[10, 11], "match"),
        ];
        sticky_match(&prev, &mut curr);
        assert_eq!(curr[2].id.0, 4);
        assert_ne!(curr[0].id.0, 4);
        assert_ne!(curr[0].id.0, curr[2].id.0);
        assert_eq!(curr[1].parent, Some(curr[0].id));
    }

    #[test]
    fn cluster_delta_stable_when_id_sticks() {
        let prev = vec![bubble(7, None, &[1, 2, 3], "bus")];
        let mut curr = vec![bubble(99, None, &[1, 2, 3], "bus")];
        sticky_match(&prev, &mut curr);
        let facts = cluster_delta(&prev, &curr);
        assert_eq!(facts.len(), 1);
        assert_eq!(facts[0].kind, ClusterDeltaKind::Stable);
        assert_eq!(facts[0].bubble.0, 7);
        assert!(facts[0].detail.contains("kept bubble 7"));
    }

    #[test]
    fn cluster_delta_relabel_when_pagerank_name_moves() {
        let prev = vec![bubble(7, None, &[1, 2, 3], "old")];
        let mut curr = vec![bubble(99, None, &[1, 2, 3], "new")];
        sticky_match(&prev, &mut curr);
        let facts = cluster_delta(&prev, &curr);
        assert_eq!(facts[0].kind, ClusterDeltaKind::Relabel);
        assert_eq!(facts[0].bubble.0, 7);
        assert_eq!(facts[0].previous_label.as_deref(), Some("old"));
    }

    #[test]
    fn cluster_delta_added_fresh_community() {
        let prev = vec![bubble(7, None, &[1, 2], "a")];
        let mut curr = vec![
            bubble(99, None, &[1, 2], "a"),
            bubble(100, None, &[9, 10], "fresh"),
        ];
        sticky_match(&prev, &mut curr);
        let facts = cluster_delta(&prev, &curr);
        assert!(
            facts
                .iter()
                .any(|f| f.kind == ClusterDeltaKind::Stable && f.bubble.0 == 7),
            "{facts:?}"
        );
        assert!(
            facts
                .iter()
                .any(|f| f.kind == ClusterDeltaKind::Added && f.bubble.0 == 100),
            "{facts:?}"
        );
    }

    #[test]
    fn cluster_delta_split_when_members_fan_out() {
        let prev = vec![bubble(7, None, &[1, 2, 3, 4], "all")];
        let mut curr = vec![
            bubble(99, None, &[1, 2, 3], "keep"),
            bubble(100, None, &[4, 5], "shard"),
        ];
        sticky_match(&prev, &mut curr);
        assert_eq!(curr[0].id.0, 7);
        let facts = cluster_delta(&prev, &curr);
        assert!(
            facts
                .iter()
                .any(|f| f.kind == ClusterDeltaKind::Split && f.bubble.0 == 7),
            "{facts:?}"
        );
        assert!(
            facts
                .iter()
                .any(|f| f.kind == ClusterDeltaKind::Added && f.bubble.0 == 100),
            "{facts:?}"
        );
    }

    #[test]
    fn bubble_members_is_coarse_only() {
        let bubbles = vec![
            bubble(7, None, &[1, 2, 3], "keep"),
            bubble(8, Some(7), &[1], "nested"),
        ];
        assert_eq!(
            bubble_members(&bubbles, BubbleId(7)),
            vec![NodeId(1), NodeId(2), NodeId(3)]
        );
        assert!(bubble_members(&bubbles, BubbleId(8)).is_empty());
        assert!(bubble_members(&bubbles, BubbleId(99)).is_empty());
    }

    #[test]
    fn cluster_delta_ignores_nested_parent_some() {
        let prev = vec![
            bubble(7, None, &[1, 2, 3], "coarse"),
            bubble(8, Some(7), &[1], "inner"),
        ];
        let mut curr = vec![
            bubble(99, None, &[1, 2, 3], "coarse"),
            bubble(100, Some(99), &[1], "inner"),
        ];
        sticky_match(&prev, &mut curr);
        let facts = cluster_delta(&prev, &curr);
        assert_eq!(facts.len(), 1);
        assert_eq!(facts[0].kind, ClusterDeltaKind::Stable);
        assert_eq!(facts[0].bubble.0, 7);
    }
}
