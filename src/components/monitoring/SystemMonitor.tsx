import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface SystemSpecs {
  os: string;
  cpu_cores: number;
  total_memory_gb: number;
  available_memory_gb: number;
  cpu_usage: number;
  memory_usage: number;
}

export function SystemMonitor() {
  const [specs, setSpecs] = useState<SystemSpecs | null>(null);

  useEffect(() => {
    loadSystemSpecs();
    const interval = setInterval(loadSystemSpecs, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemSpecs = async () => {
    try {
      const result = await invoke<SystemSpecs>('get_machine_specs');
      setSpecs(result);
    } catch (error) {
      console.error('Failed to load system specs:', error);
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-500';
    if (usage < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[var(--color-bg-primary)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
        System Monitor
      </h2>

      {specs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* OS Info */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              💻 System Info
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Operating System
                </div>
                <div className="text-lg font-medium text-[var(--color-text-primary)]">
                  {specs.os}
                </div>
              </div>
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  CPU Cores
                </div>
                <div className="text-lg font-medium text-[var(--color-text-primary)]">
                  {specs.cpu_cores}
                </div>
              </div>
            </div>
          </div>

          {/* CPU Usage */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              ⚡ CPU Usage
            </h3>
            <div className="text-center">
              <div
                className={`text-5xl font-bold ${getUsageColor(specs.cpu_usage)}`}
              >
                {specs.cpu_usage.toFixed(1)}%
              </div>
              <div className="mt-4 bg-[var(--color-bg-primary)] rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    specs.cpu_usage < 50
                      ? 'bg-green-500'
                      : specs.cpu_usage < 80
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{
                    width: `var(--progress-width, ${specs.cpu_usage.toFixed(1)}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              🧠 Memory Usage
            </h3>
            <div className="text-center">
              <div
                className={`text-5xl font-bold ${getUsageColor(specs.memory_usage)}`}
              >
                {specs.memory_usage.toFixed(1)}%
              </div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-2">
                {specs.available_memory_gb.toFixed(1)} GB /{' '}
                {specs.total_memory_gb.toFixed(1)} GB
              </div>
              <div className="mt-4 bg-[var(--color-bg-primary)] rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    specs.memory_usage < 50
                      ? 'bg-green-500'
                      : specs.memory_usage < 80
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{
                    width: `var(--progress-width, ${specs.memory_usage.toFixed(1)}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Performance Status */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              📈 Performance Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--color-bg-primary)] rounded-md text-center">
                <div className="text-2xl mb-2">
                  {specs.cpu_usage < 50 && specs.memory_usage < 50
                    ? '🟢'
                    : specs.cpu_usage < 80 && specs.memory_usage < 80
                      ? '🟡'
                      : '🔴'}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Overall Status
                </div>
              </div>
              <div className="p-4 bg-[var(--color-bg-primary)] rounded-md text-center">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {specs.cpu_cores} Core CPU
                </div>
              </div>
              <div className="p-4 bg-[var(--color-bg-primary)] rounded-md text-center">
                <div className="text-2xl mb-2">💾</div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {specs.total_memory_gb.toFixed(0)} GB RAM
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-[var(--color-text-secondary)]">
            Loading system information...
          </p>
        </div>
      )}
    </div>
  );
}
