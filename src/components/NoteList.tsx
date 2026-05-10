import { useState } from 'react';
import { organizeSelectedNotes } from '../hooks/useNoteActions';

export function NoteList({ notes }: { notes: any[] }) {
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
      {notes.map((note) => (
        <div key={note.id} className="note-item">
          <input
            type="checkbox"
            id={`note-${note.id}`}
            checked={selectedNotes.includes(note.id)}
            onChange={(e) => {
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
