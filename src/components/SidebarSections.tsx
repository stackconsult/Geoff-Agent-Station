import { useMemo } from 'react';
import type { VaultEntry } from '../types';

interface SidebarSectionsProps {
  notes: VaultEntry[];
}

export function SidebarSections({ notes }: SidebarSectionsProps) {
  const inboxCount = useMemo(() => {
    return notes.filter(note => 
      note.frontmatter.type === 'inbox' || 
      !note.frontmatter.type
    ).length;
  }, [notes]);

  return (
    <div className="sidebar-sections">
      <div className="inbox">
        <h3>Inbox</h3>
        <span>{inboxCount} notes</span>
      </div>
    </div>
  );
}
