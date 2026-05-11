import { useState } from 'react';
import { organizeSelectedNotes } from '../hooks/useNoteActions';
import type { VaultEntry } from '../types';

interface NoteListProps {
  notes: VaultEntry[];
  currentNote: VaultEntry | null;
  onNoteSelect: (note: VaultEntry) => void;
}

export function NoteList({ notes, currentNote, onNoteSelect }: NoteListProps) {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]); // uses path as ID

  const handleOrganize = async () => {
    await organizeSelectedNotes(selectedNotes, {
      tags: ['organized'],
      type: 'processed'
    });
    setSelectedNotes([]);
  };

  return (
    <div className="note-list">
      {notes.length === 0 && (
        <div className="empty-notes">No notes found in vault</div>
      )}
      {notes.map((note) => (
        <div
          key={note.path}
          className={`note-item ${currentNote?.path === note.path ? 'active' : ''}`}
          onClick={() => onNoteSelect(note)}
        >
          <input
            type="checkbox"
            id={`note-${note.path}`}
            checked={selectedNotes.includes(note.path)}
            onChange={(e) => {
              e.stopPropagation();
              if (e.target.checked) {
                setSelectedNotes([...selectedNotes, note.path]);
              } else {
                setSelectedNotes(selectedNotes.filter(p => p !== note.path));
              }
            }}
          />
          <label htmlFor={`note-${note.path}`}>{note.title}</label>
        </div>
      ))}
      {selectedNotes.length > 0 && (
        <button onClick={handleOrganize}>Organize Selected</button>
      )}
    </div>
  );
}

