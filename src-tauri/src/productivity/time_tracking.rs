pub fn categorize_app(app_name: &str) -> &str {
    match app_name.to_lowercase().as_str() {
        name if name.contains("code") || name.contains("visual studio") => "development",
        name if name.contains("chrome") || name.contains("firefox") || name.contains("edge") => "browser",
        name if name.contains("slack") || name.contains("teams") || name.contains("discord") => "communication",
        name if name.contains("spotify") || name.contains("youtube") => "entertainment",
        _ => "other",
    }
}

pub fn is_productive(app_name: &str) -> bool {
    matches!(categorize_app(app_name), "development" | "communication")
}
