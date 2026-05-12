import { useDashboardStore } from '../../stores/dashboardStore';
import { DashboardTabs } from './DashboardTabs';
import { EditorDashboard } from './EditorDashboard';
import { AIDashboard } from './AIDashboard';
import { AutomationDashboard } from './AutomationDashboard';

export function DashboardManager() {
  const { activeDashboardId, dashboards, setActiveDashboard, addDashboard, removeDashboard } = useDashboardStore();

  const activeDashboard = dashboards.find(d => d.id === activeDashboardId);

  const renderDashboard = (type: string) => {
    switch (type) {
      case 'editor':
        return <EditorDashboard />;
      case 'ai':
        return <AIDashboard />;
      case 'automation':
        return <AutomationDashboard />;
      default:
        return <div className="p-4 text-gray-500">Unknown dashboard type</div>;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      <DashboardTabs
        dashboards={dashboards}
        activeId={activeDashboardId}
        onSelect={setActiveDashboard}
        onAdd={(type) => addDashboard(type as any)}
        onRemove={removeDashboard}
      />
      <div className="flex-1 overflow-hidden">
        {activeDashboard ? renderDashboard(activeDashboard.type) : <div className="p-4">No dashboard selected</div>}
      </div>
    </div>
  );
}
