use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::Timelike;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Condition {
    FileExists {
        path: PathBuf,
    },
    FileSize {
        path: PathBuf,
        operator: ComparisonOperator,
        size_bytes: u64,
    },
    TimeRange {
        start_hour: u8,
        end_hour: u8,
    },
    DayOfWeek {
        days: Vec<Weekday>,
    },
    ProcessRunning {
        process_name: String,
    },
    NetworkConnected,
    BatteryLevel {
        operator: ComparisonOperator,
        percentage: u8,
    },
    EnvironmentVariable {
        name: String,
        value: String,
    },
    Custom {
        expression: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComparisonOperator {
    Equal,
    NotEqual,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Weekday {
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday,
}

impl Condition {
    pub fn evaluate(&self) -> Result<bool, String> {
        match self {
            Condition::FileExists { path } => {
                Ok(path.exists())
            },
            
            Condition::FileSize { path, operator, size_bytes } => {
                if !path.exists() {
                    return Ok(false);
                }
                
                let metadata = std::fs::metadata(path)
                    .map_err(|e| format!("Failed to get file metadata: {}", e))?;
                
                let actual_size = metadata.len();
                Ok(Self::compare(actual_size, *size_bytes, operator))
            },
            
            Condition::TimeRange { start_hour, end_hour } => {
                use chrono::Local;
                let now = Local::now();
                let current_hour = now.hour() as u8;
                Ok(current_hour >= *start_hour && current_hour < *end_hour)
            },
            
            Condition::DayOfWeek { days } => {
                use chrono::{Local, Datelike};
                let now = Local::now();
                let current_day = match now.weekday() {
                    chrono::Weekday::Mon => Weekday::Monday,
                    chrono::Weekday::Tue => Weekday::Tuesday,
                    chrono::Weekday::Wed => Weekday::Wednesday,
                    chrono::Weekday::Thu => Weekday::Thursday,
                    chrono::Weekday::Fri => Weekday::Friday,
                    chrono::Weekday::Sat => Weekday::Saturday,
                    chrono::Weekday::Sun => Weekday::Sunday,
                };
                Ok(days.iter().any(|d| matches!((d, &current_day), 
                    (Weekday::Monday, Weekday::Monday) |
                    (Weekday::Tuesday, Weekday::Tuesday) |
                    (Weekday::Wednesday, Weekday::Wednesday) |
                    (Weekday::Thursday, Weekday::Thursday) |
                    (Weekday::Friday, Weekday::Friday) |
                    (Weekday::Saturday, Weekday::Saturday) |
                    (Weekday::Sunday, Weekday::Sunday)
                )))
            },
            
            Condition::ProcessRunning { process_name } => {
                use sysinfo::System;
                let mut sys = System::new_all();
                sys.refresh_all();
                
                Ok(sys.processes().values().any(|p| 
                    p.name().to_string().to_lowercase().contains(&process_name.to_lowercase())
                ))
            },
            
            Condition::NetworkConnected => {
                // Placeholder - would need platform-specific implementation
                Ok(true)
            },
            
            Condition::BatteryLevel { operator, percentage } => {
                // Placeholder - would need platform-specific implementation
                Ok(true)
            },
            
            Condition::EnvironmentVariable { name, value } => {
                match std::env::var(name) {
                    Ok(actual_value) => Ok(actual_value == *value),
                    Err(_) => Ok(false),
                }
            },
            
            Condition::Custom { expression } => {
                // Placeholder for custom expression evaluation
                Err("Custom expressions not yet implemented".to_string())
            },
        }
    }
    
    fn compare<T: PartialOrd>(a: T, b: T, operator: &ComparisonOperator) -> bool {
        match operator {
            ComparisonOperator::Equal => a == b,
            ComparisonOperator::NotEqual => a != b,
            ComparisonOperator::GreaterThan => a > b,
            ComparisonOperator::LessThan => a < b,
            ComparisonOperator::GreaterThanOrEqual => a >= b,
            ComparisonOperator::LessThanOrEqual => a <= b,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_exists_condition() {
        let temp_file = std::env::temp_dir().join("test_condition.txt");
        std::fs::write(&temp_file, "test").unwrap();
        
        let condition = Condition::FileExists { path: temp_file.clone() };
        assert!(condition.evaluate().unwrap());
        
        std::fs::remove_file(&temp_file).unwrap();
        assert!(!condition.evaluate().unwrap());
    }
}
