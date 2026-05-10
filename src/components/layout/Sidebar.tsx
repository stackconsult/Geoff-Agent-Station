import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import {
  Files,
  GitBranch,
  Inbox,
  Activity,
  FolderTree,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  vaultName?: string;
  currentFilter?: string;
  onFilterChange?: (filter: string) => void;
  className?: string;
}

/**
 * Sidebar Component
 * 
 * Features:
 * - Top-level filters (All Notes, Changes, Pulse, Inbox)
 * - Folder tree navigation
 * - Type-based sections (Projects, Experiments, etc.)
 */
export function Sidebar({
  vaultName = 'Vault',
  currentFilter = 'all',
  onFilterChange,
  className,
}: SidebarProps) {
  const filters = [
    { id: 'all', label: 'All Notes', icon: Files },
    { id: 'changes', label: 'Changes', icon: GitBranch },
    { id: 'pulse', label: 'Pulse', icon: Activity },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
  ];

  const sections = [
    { id: 'projects', label: 'Projects' },
    { id: 'experiments', label: 'Experiments' },
    { id: 'responsibilities', label: 'Responsibilities' },
    { id: 'people', label: 'People' },
    { id: 'events', label: 'Events' },
    { id: 'topics', label: 'Topics' },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-[var(--color-bg-secondary)]", className)}>
      {/* Vault Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border-primary)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {vaultName}
        </h2>
      </div>

      {/* Filter Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2">
          <ul className="space-y-1">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = currentFilter === filter.id;
              
              return (
                <li key={filter.id}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 h-8",
                      isActive && "bg-[var(--color-bg-elevated)]"
                    )}
                    onClick={() => onFilterChange?.(filter.id)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{filter.label}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Section Groups */}
        <div className="px-2 py-2">
          <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-2">
            Sections
          </div>
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <span>{section.label}</span>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Folder Tree */}
        <div className="px-2 py-2 border-t border-[var(--color-border-primary)]">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Folders
            </div>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 text-sm text-[var(--color-text-secondary)]">
            <FolderTree className="h-4 w-4" />
            <span>{vaultName}</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
