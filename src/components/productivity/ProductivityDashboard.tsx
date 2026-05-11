import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface PomodoroSession {
  id: string;
  work_duration: number;
  break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  current_session: number;
  is_break: boolean;
  start_time: string;
  end_time: string | null;
}

interface ProductivityStats {
  total_time_seconds: number;
  productive_time_seconds: number;
  distracting_time_seconds: number;
  top_apps: Array<[string, number]>;
  top_projects: Array<[string, number]>;
}

export function ProductivityDashboard() {
  const [pomodoroSession, setPomodoroSession] = useState<PomodoroSession | null>(null);
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    loadPomodoroStatus();
    loadStats();
  }, []);

  const loadPomodoroStatus = async () => {
    try {
      const session = await invoke<PomodoroSession | null>('productivity_get_pomodoro_status');
      setPomodoroSession(session);
    } catch (error) {
      console.error('Failed to load pomodoro status:', error);
    }
  };

  const loadStats = async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    try {
      const result = await invoke<ProductivityStats>('productivity_get_stats', {
        start: startOfDay.toISOString(),
        end: now.toISOString(),
      });
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const startPomodoro = async () => {
    try {
      await invoke('productivity_start_pomodoro', {
        workDuration: 25 * 60,
        breakDuration: 5 * 60,
        longBreakDuration: 15 * 60,
        sessionsUntilLongBreak: 4,
      });
      await loadPomodoroStatus();
    } catch (error) {
      console.error('Failed to start pomodoro:', error);
    }
  };

  const stopPomodoro = async () => {
    try {
      await invoke('productivity_stop_pomodoro');
      setPomodoroSession(null);
    } catch (error) {
      console.error('Failed to stop pomodoro:', error);
    }
  };

  const startTracking = async () => {
    try {
      await invoke('productivity_start_tracking', {
        appName: 'Tolaria Automation',
        windowTitle: 'Productivity Dashboard',
        project: null,
      });
      setIsTracking(true);
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const stopTracking = async () => {
    try {
      await invoke('productivity_stop_tracking');
      setIsTracking(false);
      await loadStats();
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[var(--color-bg-primary)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
        Productivity Dashboard
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pomodoro Timer */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            🍅 Pomodoro Timer
          </h3>
          
          {pomodoroSession ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--color-accent)] mb-2">
                  {pomodoroSession.is_break ? 'Break Time' : 'Focus Time'}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Session {pomodoroSession.current_session} of {pomodoroSession.sessions_until_long_break}
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                <button
                  onClick={stopPomodoro}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Stop
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-[var(--color-text-secondary)]">
                Start a Pomodoro session to boost your focus
              </p>
              <button
                onClick={startPomodoro}
                className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90"
              >
                Start Pomodoro
              </button>
            </div>
          )}
        </div>

        {/* Time Tracking */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            ⏱️ Time Tracking
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">Status:</span>
              <span className={`font-medium ${isTracking ? 'text-green-500' : 'text-gray-500'}`}>
                {isTracking ? 'Tracking' : 'Stopped'}
              </span>
            </div>
            
            <div className="flex gap-2">
              {isTracking ? (
                <button
                  onClick={stopTracking}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Stop Tracking
                </button>
              ) : (
                <button
                  onClick={startTracking}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Start Tracking
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            📊 Today's Activity
          </h3>
          
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[var(--color-bg-primary)] rounded-md">
                <div className="text-2xl font-bold text-[var(--color-accent)]">
                  {formatTime(stats.total_time_seconds)}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Total Time
                </div>
              </div>
              
              <div className="text-center p-4 bg-[var(--color-bg-primary)] rounded-md">
                <div className="text-2xl font-bold text-green-500">
                  {formatTime(stats.productive_time_seconds)}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Productive Time
                </div>
              </div>
              
              <div className="text-center p-4 bg-[var(--color-bg-primary)] rounded-md">
                <div className="text-2xl font-bold text-red-500">
                  {formatTime(stats.distracting_time_seconds)}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Distracting Time
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-[var(--color-text-secondary)]">
              No activity data for today
            </p>
          )}

          {stats && stats.top_apps.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-3">
                Top Applications
              </h4>
              <div className="space-y-2">
                {stats.top_apps.slice(0, 5).map(([app, time], idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-[var(--color-bg-primary)] rounded">
                    <span className="text-sm text-[var(--color-text-primary)]">{app}</span>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {formatTime(time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
