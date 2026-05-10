use serde::{Deserialize, Serialize};
use yaml_rust::YamlLoader;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Frontmatter {
    #[serde(default)]
    pub r#type: Option<String>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub created: Option<String>,
    #[serde(default)]
    pub modified: Option<String>,
}

pub fn parse_frontmatter(content: &str) -> (Frontmatter, String) {
    if content.starts_with("---") {
        let parts: Vec<&str> = content.splitn(3, "---").collect();
        if parts.len() >= 2 {
            if let Ok(docs) = YamlLoader::load_from_str(parts[1]) {
                if let Some(yaml) = docs.first() {
                    let frontmatter = yaml_to_frontmatter(yaml);
                    let body = if parts.len() >= 3 { parts[2].to_string() } else { String::new() };
                    return (frontmatter, body);
                }
            }
        }
    }
    (Frontmatter::default(), content.to_string())
}

fn yaml_to_frontmatter(yaml: &yaml_rust::Yaml) -> Frontmatter {
    Frontmatter {
        r#type: yaml["type"].as_str().map(|s| s.to_string()),
        tags: yaml["tags"].as_vec().map(|v| v.iter().filter_map(|y| y.as_str().map(|s| s.to_string())).collect()),
        created: yaml["created"].as_str().map(|s| s.to_string()),
        modified: yaml["modified"].as_str().map(|s| s.to_string()),
    }
}
