import { AppLayout, Sidebar, NoteList, Editor, StatusBar } from '../layout';
import { useVaultStore } from '../../stores/vaultStore';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { eventBus } from '../../utils/eventBus';

export function EditorDashboard() {
  const { vaultPath, notes, currentNote, loadNotes, selectNote } = useVaultStore();
  const { sidebarSelection, setSidebarSelection } = useUIStore();
  const { content, setContent } = useEditorStore();

  const handleNoteSelect = async (note: any) => {
    selectNote(note);
    eventBus.emit('note_selected', { type: 'note_selected', noteId: note.path, notePath: note.path });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (currentNote) {
      eventBus.emit('note_updated', { type: 'note_updated', noteId: currentNote.path, content: newContent });
    }
  };

  return (
    <AppLayout
      sidebar={
        <Sidebar
          vaultName={vaultPath?.split(/[\\/]/).pop() || 'Vault'}
          entries={notes}
          selection={sidebarSelection}
          onSelect={setSidebarSelection}
        />
      }
      noteList={
        <NoteList
          notes={notes}
          selectedNotePath={currentNote?.path}
          onSelectNote={handleNoteSelect}
          onCreateNote={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
        />
      }
      editor={
        <Editor
          note={currentNote ? { id: currentNote.path, title: currentNote.title, content, path: currentNote.path.split(/[\\/]/), isLoading: false } : null}
          mode="markdown"
          onModeChange={() => {}}
          onContentChange={handleContentChange}
          onSave={() => {}}
        />
      }
      aiPanel={<div />}
      statusBar={<StatusBar noteCount={notes.length} vaultPath={vaultPath || ''} syncStatus="idle" lastSyncTime="" isVaultReloading={false} onSync={() => {}} onOpenVault={() => {}} onOpenSettings={() => {}} onToggleAutomation={() => {}} onOpenBackups={() => {}} healthStatus={null} onHealthCheck={() => {}} />}
    />
  );
}
