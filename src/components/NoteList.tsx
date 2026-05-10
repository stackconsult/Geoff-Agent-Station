import { useState } from 'react';
import { organizeSelectedNotes } from '../hooks/useNoteActions';
import type { VaultEntry } from '../types';

interface NoteListProps {
  notes: VaultEntry[];
  currentNote: VaultEntry | null;
  onNoteSelect: (note: VaultEntry) => void;
}

export function NoteList({ notes, currentNote, onNoteSelect }: NoteListProps) {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

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
          key={note.id}
          className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
          onClick={() => onNoteSelect(note)}
        >
          <input
            type="checkbox"
            id={`note-${note.id}`}
            checked={selectedNotes.includes(note.id)}
            onChange={(e) => {
              e.stopPropagation();
              if (e.target.checked) {
                setSelectedNotes([...selectedNotes, note.id]);
              } else {
                setSelectedNotes(selectedNotes.filter(id => id !== note.id));
              }
            }}
          />
          <label htmlFor={`note-${note.id}`}>{note.title}</label>
        </div>
      ))}
      {selectedNotes.length > 0 && (
        <button onClick={handleOrganize}>Organize Selected</button>
      )}
    </div>
  );
}

