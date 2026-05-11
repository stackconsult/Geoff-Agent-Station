use super::PomodoroSession;

pub fn calculate_remaining_time(session: &PomodoroSession) -> i64 {
    let elapsed = chrono::Utc::now()
        .signed_duration_since(session.start_time)
        .num_seconds();
    
    let target_duration = if session.is_break {
        if session.current_session % session.sessions_until_long_break == 0 {
            session.long_break_duration
        } else {
            session.break_duration
        }
    } else {
        session.work_duration
    };

    (target_duration - elapsed).max(0)
}

pub fn should_switch_phase(session: &PomodoroSession) -> bool {
    calculate_remaining_time(session) == 0
}
