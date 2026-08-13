use graphide_ir::{Bubble, BubbleId, Graph, NodeId};
use indexmap::{IndexMap, IndexSet};
use std::collections::{HashMap, HashSet, VecDeque};

const LEAF_MAX: usize = 4;

/// Recursive agglomerative clustering on weighted edges. Contains excluded.
pub fn cluster(graph: &Graph) -> Vec<Bubble> {
    let node_ids: Vec<NodeId> = graph.nodes.iter().map(|n| n.id).collect();
    if node_ids.is_empty() {
        return Vec::new();
    }
    let adj = build_adj(graph);
    let fqn: HashMap<NodeId, String> = graph.nodes.iter().map(|n| (n.id, n.fqn.clone())).collect();
    let mut bubbles = Vec::new();
    let mut next_id = 1u64;
    // First cut under the program => coarse bubbles (parent == None).
    let parts = if node_ids.len() <= LEAF_MAX || !can_split(&node_ids, &adj) {
        vec![node_ids.clone()]
    } else {
        let p = partition(&node_ids, &adj);
        if p.len() <= 1 {
            vec![node_ids.clone()]
        } else {
            p
        }
    };
    for part in parts {
        cluster_rec(&part, None, &adj, &fqn, graph, &mut bubbles, &mut next_id);
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
        return;
    }

    let parts = partition(members, adj);
    if parts.len() <= 1 {
        let id = BubbleId(*next_id);
        *next_id += 1;
        out.push(Bubble {
            id,
            parent,
            members: members.to_vec(),
            label: label_for(members, fqn, graph),
        });
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
        cluster_rec(&part, Some(id), adj, fqn, graph, out, next_id);
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

/// Greedy: sort unique undirected edges by weight, union until >=2 communities remain
/// with balanced sizes; fall back to connected components.
fn partition(
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
        while p[&r] != r {
            r = p[&r];
        }
        let mut c = x;
        while p[&c] != r {
            let n = p[&c];
            p.insert(c, r);
            c = n;
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
        (
            b.parent.is_some(),
            std::cmp::Reverse(b.members.len()),
        )
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
