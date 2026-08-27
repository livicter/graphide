//! Engine: link, cluster, Steiner, stamps, coverage, hints.

#![cfg_attr(
    not(test),
    deny(
        clippy::unwrap_used,
        clippy::expect_used,
        clippy::panic,
        clippy::todo,
        clippy::unimplemented
    )
)]

mod cluster;
mod coverage;
mod enter;
mod flowchart;
mod hints;
mod link;
mod programs;
mod review;
mod stamp;
mod steiner;

pub use cluster::{cluster, cluster_with, coarse_bubbles, node_coarse_bubble, sticky_match};
pub use coverage::{changed_nodes, changed_nodes_with_sources, coverage};
pub use enter::enter_bubble;
pub use flowchart::build_flowchart;
pub use hints::parse_flows_toml;
pub use programs::{assign_file, is_entry, package_of, programs_from_graph};
pub use link::link;
pub use review::{
    default_review_hints, derive_repo, hints_from_toml, progress_pct, resolve_fqn, PreviewFlow,
    PreviewGraph, PreviewNode, ProgressEvent, ReviewInput, ReviewOptions, ReviewPreview,
};
pub use stamp::{
    apply_saved_stamps, make_stamp, recheck_stamp, recheck_stamp_on, stamp_filename,
    stamp_from_graph,
};
pub use steiner::steiner_tree;
