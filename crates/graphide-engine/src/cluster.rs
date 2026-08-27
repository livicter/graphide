use graphide_ir::{Bubble, BubbleId, Graph, NodeId};
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
    for e in &graph.edges {
        let w = e.kind.cluster_weight();
        if w <= 0.0 {
            continue;
        }
        adj.entry(e.from).or_default().push((e.to, w));
        adj.entry(e.to).or_default().push((e.from, w));
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
    for e in &graph.edges {
        let w = e.kind.cluster_weight();
        if w <= 0.0 {
            continue;
        }
        if set.contains(&e.from) && set.contains(&e.to) {
            *score.entry(e.from).or_default() += w;
            *score.entry(e.to).or_default() += w;
        }
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
        }
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
