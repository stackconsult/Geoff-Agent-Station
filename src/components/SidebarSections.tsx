import { calculateInboxNotes } from '../hooks/useNoteActions';
import { useState, useEffect } from 'react';

export function SidebarSections({ vaultPath }: { vaultPath: string }) {
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    const updateInboxCount = async () => {
      const inboxNotes = await calculateInboxNotes(vaultPath);
      setInboxCount(inboxNotes.length);
    };

    updateInboxCount();
  }, [vaultPath]);

  return (
    <div className="sidebar-sections">
      <div className="inbox">
        <h3>Inbox</h3>
        <span>{inboxCount} notes</span>
      </div>
    </div>
  );
}
