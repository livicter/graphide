use graphide_ir::{FlowHint, HintFile};
use serde::Deserialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum HintError {
    #[error("toml parse: {0}")]
    Toml(#[from] toml::de::Error),
}

#[derive(Debug, Deserialize)]
struct RawHintFile {
    #[serde(default, rename = "flow")]
    flows: Vec<RawFlow>,
}

#[derive(Debug, Deserialize)]
struct RawFlow {
    name: String,
    hits: Vec<String>,
}

pub fn parse_flows_toml(text: &str) -> Result<HintFile, HintError> {
    let raw: RawHintFile = toml::from_str(text)?;
    Ok(HintFile {
        flows: raw
            .flows
            .into_iter()
            .map(|f| FlowHint {
                name: f.name,
                hits: f.hits,
            })
            .collect(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_default_shape() {
        let text = r#"
[[flow]]
name = "data-subscription"
hits = ["crate::sub::subscribe", "crate::bus::Bus"]
"#;
        let h = parse_flows_toml(text).unwrap();
        assert_eq!(h.flows.len(), 1);
        assert_eq!(h.flows[0].name, "data-subscription");
        assert_eq!(h.flows[0].hits.len(), 2);
    }

    #[test]
    fn invalid_toml_is_error_not_panic() {
        assert!(parse_flows_toml("[[flow").is_err());
        assert!(parse_flows_toml("").is_ok());
    }
}
