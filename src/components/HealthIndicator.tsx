import { Activity, AlertCircle, Check } from 'lucide-react';

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  vault_accessible: boolean;
  vault_note_count: number;
  ollama_reachable: boolean;
  ollama_version?: string;
  disk_space_gb: number;
  disk_space_status: 'ok' | 'warning' | 'critical';
  checks: HealthCheckDetail[];
}

export interface HealthCheckDetail {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  latency_ms: number;
}

interface HealthIndicatorProps {
  status: HealthStatus | null;
  onClick?: () => void;
}

export function HealthIndicator({ status, onClick }: HealthIndicatorProps) {
  if (!status) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <Activity className="h-3 w-3 animate-pulse" />
        <span className="text-xs">Checking...</span>
      </div>
    );
  }

  const config = {
    healthy: {
      icon: Check,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      label: 'Healthy',
    },
    degraded: {
      icon: Activity,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      label: 'Degraded',
    },
    unhealthy: {
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      label: 'Unhealthy',
    },
  };

  const { icon: Icon, color, bg, label } = config[status.overall];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${bg} ${color} hover:opacity-80 transition-opacity`}
      title={`Vault: ${status.vault_accessible ? '✓' : '✗'} ${status.vault_note_count} notes | Ollama: ${status.ollama_reachable ? '✓' : '✗'} | Disk: ${status.disk_space_gb.toFixed(1)}GB`}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
