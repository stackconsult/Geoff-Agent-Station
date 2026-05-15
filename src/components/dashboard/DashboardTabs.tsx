import { DashboardConfig } from '../../stores/dashboardStore';

interface DashboardTabsProps {
  dashboards: DashboardConfig[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: 'editor' | 'ai' | 'automation') => void;
  onRemove: (id: string) => void;
}

export function DashboardTabs({
  dashboards,
  activeId,
  onSelect,
  onAdd,
  onRemove,
}: DashboardTabsProps) {
  return (
    <div className="h-12 border-b border-[var(--color-border)] flex items-center px-4 gap-2 bg-[var(--color-bg-secondary)]">
      {dashboards.map(dashboard => (
        <button
          key={dashboard.id}
          onClick={() => onSelect(dashboard.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeId === dashboard.id
              ? 'bg-[var(--color-accent)] text-white'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          <span>{dashboard.icon}</span>
          <span>{dashboard.title}</span>
          {dashboards.length > 1 && (
            <span
              onClick={e => {
                e.stopPropagation();
                onRemove(dashboard.id);
              }}
              className="ml-1 hover:text-red-400"
            >
              ×
            </span>
          )}
        </button>
      ))}
      <div className="ml-auto flex gap-2">
        <button
          onClick={() => onAdd('ai')}
          className="px-3 py-1.5 text-sm rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
        >
          + AI
        </button>
        <button
          onClick={() => onAdd('automation')}
          className="px-3 py-1.5 text-sm rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
        >
          + Automation
        </button>
      </div>
    </div>
  );
}
