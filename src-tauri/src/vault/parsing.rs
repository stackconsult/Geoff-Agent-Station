use crate::vault::VaultFrontmatter;
use yaml_rust::YamlLoader;

pub fn parse_frontmatter(content: &str) -> (VaultFrontmatter, String) {
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
    (VaultFrontmatter::default(), content.to_string())
}

fn yaml_to_frontmatter(yaml: &yaml_rust::Yaml) -> VaultFrontmatter {
    // Helper to parse string arrays
    let parse_string_array = |key: &str| -> Option<Vec<String>> {
        yaml[key].as_vec().map(|v| {
            v.iter()
                .filter_map(|y| y.as_str().map(|s| s.to_string()))
                .collect()
        })
    };

    // Helper to parse all extra fields into HashMap
    let mut extra = std::collections::HashMap::new();
    if let Some(hash) = yaml.as_hash() {
        for (key, value) in hash {
            if let Some(key_str) = key.as_str() {
                // Skip known fields
                if !matches!(
                    key_str,
                    "type" | "created" | "modified" | "archived" | "organized" | "favorite"
                        | "visible" | "tags" | "aliases" | "status" | "icon" | "color"
                        | "order" | "belongs_to" | "related_to"
                ) {
                    // Convert YAML value to serde_json::Value
                    if let Ok(json_str) = serde_json::to_string(&yaml_to_json(value)) {
                        if let Ok(json_value) = serde_json::from_str(&json_str) {
                            extra.insert(key_str.to_string(), json_value);
                        }
                    }
                }
            }
        }
    }

    VaultFrontmatter {
        r#type: yaml["type"].as_str().map(|s| s.to_string()),
        created: yaml["created"].as_str().map(|s| s.to_string()),
        modified: yaml["modified"].as_str().map(|s| s.to_string()),
        archived: yaml["archived"].as_bool(),
        organized: yaml["organized"].as_bool(),
        favorite: yaml["favorite"].as_bool(),
        visible: yaml["visible"].as_bool(),
        tags: parse_string_array("tags"),
        aliases: parse_string_array("aliases"),
        status: yaml["status"].as_str().map(|s| s.to_string()),
        icon: yaml["icon"].as_str().map(|s| s.to_string()),
        color: yaml["color"].as_str().map(|s| s.to_string()),
        order: yaml["order"].as_i64().map(|i| i as i32),
        belongs_to: parse_string_array("belongs_to"),
        related_to: parse_string_array("related_to"),
        extra,
    }
}

// Helper to convert YAML to JSON Value
fn yaml_to_json(yaml: &yaml_rust::Yaml) -> serde_json::Value {
    match yaml {
        yaml_rust::Yaml::Real(s) | yaml_rust::Yaml::String(s) => {
            serde_json::Value::String(s.clone())
        }
        yaml_rust::Yaml::Integer(i) => serde_json::Value::Number((*i).into()),
        yaml_rust::Yaml::Boolean(b) => serde_json::Value::Bool(*b),
        yaml_rust::Yaml::Array(arr) => {
            serde_json::Value::Array(arr.iter().map(yaml_to_json).collect())
        }
        yaml_rust::Yaml::Hash(hash) => {
            let map: serde_json::Map<String, serde_json::Value> = hash
                .iter()
                .filter_map(|(k, v)| {
                    k.as_str().map(|key| (key.to_string(), yaml_to_json(v)))
                })
                .collect();
            serde_json::Value::Object(map)
        }
        yaml_rust::Yaml::Null | yaml_rust::Yaml::BadValue => serde_json::Value::Null,
        _ => serde_json::Value::Null,
    }
}
