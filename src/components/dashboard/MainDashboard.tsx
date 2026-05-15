import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Cpu, 
  Network, 
  Bot, 
  Settings, 
  Activity,
  Zap,
  Database,
  Shield,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Share2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Bell,
  User,
  LogOut,
} from 'lucide-react';

/**
 * Main Dashboard Component
 * Central hub for all system monitoring and control
 */
export function MainDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<null | {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    services: ServiceHealth[];
  }>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSystemHealth({
        status: 'healthy',
        uptime: 99.95,
        services: [
          { id: 'api', name: 'API Server', status: 'healthy', responseTime: 45, uptime: 99.98 },
          { id: 'database', name: 'Database', status: 'healthy', responseTime: 12, uptime: 99.99 },
          { id: 'cache', name: 'Redis Cache', status: 'healthy', responseTime: 8, uptime: 99.95 },
          { id: 'ai', name: 'AI Service', status: 'degraded', responseTime: 234, uptime: 98.5 },
        ],
      });
      setAlerts([
        { id: '1', type: 'warning', message: 'AI Service response time elevated', timestamp: new Date() },
        { id: '2', type: 'info', message: 'Scheduled maintenance in 2 hours', timestamp: new Date() },
      ]);
      setNotifications([
        { id: '1', title: 'New deployment', message: 'Version 2.1.0 deployed successfully', timestamp: new Date() },
        { id: '2', title: 'Security alert', message: 'New vulnerability detected in dependency', timestamp: new Date() },
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const sections = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'monitoring', name: 'Monitoring', icon: Activity },
    { id: 'agents', name: 'AI Agents', icon: Bot },
    { id: 'workflows', name: 'Workflows', icon: Network },
    { id: 'tracing', name: 'Tracing', icon: Globe },
    { id: 'mcp', name: 'MCP Servers', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[var(--color-primary)]" />
          <p className="text-[var(--color-text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] transition-all duration-300"
      >
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                Tolaria
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'hover:bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
              }`}
            >
              <section.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{section.name}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Admin</p>
                <p className="text-xs text-[var(--color-text-secondary)]">admin@tolaria.ai</p>
              </div>
              <button className="p-2 hover:bg-[var(--color-bg-primary)] rounded-lg transition-colors">
                <LogOut className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {sections.find(s => s.id === activeSection)?.name}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  systemHealth?.status === 'healthy' ? 'bg-green-500' :
                  systemHealth?.status === 'degraded' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {systemHealth?.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors">
                  <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 bg-[var(--color-bg-primary)] rounded-lg px-4 py-2">
                <Search className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] w-48"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'overview' && <OverviewSection systemHealth={systemHealth} alerts={alerts} />}
          {activeSection === 'monitoring' && <MonitoringSection />}
          {activeSection === 'agents' && <AgentsSection />}
          {activeSection === 'workflows' && <WorkflowsSection />}
          {activeSection === 'tracing' && <TracingSection />}
          {activeSection === 'mcp' && <MCPSection />}
          {activeSection === 'settings' && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}

/**
 * Overview Section
 */
function OverviewSection({ systemHealth, alerts }: { systemHealth: any, alerts: Alert[] }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="System Uptime"
          value={`${systemHealth?.uptime.toFixed(2)}%`}
          icon={Activity}
          color="green"
          trend="+0.5%"
        />
        <StatCard
          title="Active Agents"
          value="12"
          icon={Bot}
          color="blue"
          trend="+2"
        />
        <StatCard
          title="Running Workflows"
          value="8"
          icon={Network}
          color="purple"
          trend="+1"
        />
        <StatCard
          title="API Requests/min"
          value="1,234"
          icon={Zap}
          color="orange"
          trend="+12%"
        />
      </div>

      {/* Alerts */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Recent Alerts
        </h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      {/* Service Health */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Service Health
        </h3>
        <div className="space-y-4">
          {systemHealth?.services.map((service: ServiceHealth) => (
            <ServiceHealthItem key={service.id} service={service} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-sm text-green-500 font-medium">{trend}</span>
      </div>
      <p className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">{title}</p>
    </div>
  );
}

/**
 * Alert Item Component
 */
function AlertItem({ alert }: { alert: Alert }) {
  const iconClasses = {
    warning: 'text-yellow-500 bg-yellow-500/10',
    error: 'text-red-500 bg-red-500/10',
    info: 'text-blue-500 bg-blue-500/10',
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-[var(--color-bg-primary)] rounded-lg">
      <div className={`p-2 rounded-lg ${iconClasses[alert.type as keyof typeof iconClasses]}`}>
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[var(--color-text-primary)]">{alert.message}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {alert.timestamp.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Service Health Item Component
 */
function ServiceHealthItem({ service }: { service: ServiceHealth }) {
  const statusColors = {
    healthy: 'text-green-500',
    degraded: 'text-yellow-500',
    unhealthy: 'text-red-500',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--color-bg-primary)] rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${statusColors[service.status as keyof typeof statusColors]}`} />
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{service.name}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {service.responseTime}ms response time
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{service.uptime.toFixed(2)}%</p>
        <p className="text-xs text-[var(--color-text-secondary)]">uptime</p>
      </div>
    </div>
  );
}

/**
 * Monitoring Section
 */
function MonitoringSection() {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          System Metrics
        </h3>
        <div className="h-64 bg-[var(--color-bg-primary)] rounded-lg flex items-center justify-center">
          <p className="text-[var(--color-text-secondary)]">Metrics chart placeholder</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Agents Section
 */
function AgentsSection() {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          AI Agent Crew
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AgentCard key={i} id={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Agent Card Component
 */
function AgentCard({ id }: { id: number }) {
  const statuses = ['idle', 'working', 'completed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[var(--color-primary)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Agent {id}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          status === 'idle' ? 'bg-gray-500/10 text-gray-500' :
          status === 'working' ? 'bg-blue-500/10 text-blue-500' :
          'bg-green-500/10 text-green-500'
        }`}>
          {status}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--color-text-secondary)]">Tasks Completed</span>
          <span className="text-[var(--color-text-primary)]">{Math.floor(Math.random() * 100)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--color-text-secondary)]">Memory Usage</span>
          <span className="text-[var(--color-text-primary)]">{Math.floor(Math.random() * 500)}MB</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Workflows Section
 */
function WorkflowsSection() {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Active Workflows
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <WorkflowItem key={i} id={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Workflow Item Component
 */
function WorkflowItem({ id }: { id: number }) {
  const statuses = ['running', 'completed', 'failed', 'pending'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--color-bg-primary)] rounded-lg">
      <div className="flex items-center gap-3">
        <Network className="w-5 h-5 text-[var(--color-primary)]" />
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Workflow {id}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {Math.floor(Math.random() * 10)} steps • {Math.floor(Math.random() * 60)}s ago
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full ${
          status === 'running' ? 'bg-blue-500/10 text-blue-500' :
          status === 'completed' ? 'bg-green-500/10 text-green-500' :
          status === 'failed' ? 'bg-red-500/10 text-red-500' :
          'bg-gray-500/10 text-gray-500'
        }`}>
          {status}
        </span>
        <button className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </button>
      </div>
    </div>
  );
}

/**
 * Tracing Section
 */
function TracingSection() {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Distributed Tracing
        </h3>
        <div className="h-64 bg-[var(--color-bg-primary)] rounded-lg flex items-center justify-center">
          <p className="text-[var(--color-text-secondary)]">Trace visualization placeholder</p>
        </div>
      </div>
    </div>
  );
}

/**
 * MCP Section
 */
function MCPSection() {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            MCP Servers
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            <span>Add Server</span>
          </button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <MCPServerItem key={i} id={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * MCP Server Item Component
 */
function MCPServerItem({ id }: { id: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--color-bg-primary)] rounded-lg">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-[var(--color-primary)]" />
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">MCP Server {id}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Connected • {Math.floor(Math.random() * 100)} tools available
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <button className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </button>
      </div>
    </div>
  );
}

/**
 * Settings Section
 */
function SettingsSection() {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          System Settings
        </h3>
        <div className="space-y-4">
          <SettingItem
            title="Dark Mode"
            description="Enable dark theme for the dashboard"
            type="toggle"
          />
          <SettingItem
            title="Notifications"
            description="Enable system notifications"
            type="toggle"
          />
          <SettingItem
            title="Auto-refresh"
            description="Automatically refresh dashboard data"
            type="toggle"
          />
          <SettingItem
            title="Refresh Interval"
            description="How often to refresh data (seconds)"
            type="number"
            value={30}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Setting Item Component
 */
function SettingItem({ title, description, type, value }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--color-bg-primary)] rounded-lg">
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">{description}</p>
      </div>
      <div>
        {type === 'toggle' && (
          <button className="w-12 h-6 bg-[var(--color-primary)] rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </button>
        )}
        {type === 'number' && (
          <input
            type="number"
            value={value}
            className="w-20 px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)]"
          />
        )}
      </div>
    </div>
  );
}

// Types
interface ServiceHealth {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  uptime: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
  trend: string;
}

interface SettingItemProps {
  title: string;
  description: string;
  type: 'toggle' | 'number';
  value?: number;
}
