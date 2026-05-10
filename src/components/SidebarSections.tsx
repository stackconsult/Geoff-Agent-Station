import { useState } from 'react';

export function SidebarSections() {
  const [inboxCount] = useState(0);

  return (
    <div className="sidebar-sections">
      <div className="inbox">
        <h3>Inbox</h3>
        <span>{inboxCount} notes</span>
      </div>
    </div>
  );
}
