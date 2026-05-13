type EventCallback = (data: unknown) => void;

interface EventBus {
  on(event: string, callback: EventCallback): () => void;
  emit(event: string, data: unknown): void;
  off(event: string, callback: EventCallback): void;
}

class EventBusImpl implements EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => this.off(event, callback);
  }

  emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus error in ${event}:`, error);
        }
      });
    }
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
}

export const eventBus = new EventBusImpl();

export type DashboardEvent =
  | { type: 'note_selected'; noteId: string; notePath: string }
  | { type: 'note_updated'; noteId: string; content: string }
  | { type: 'vault_changed'; vaultPath: string }
  | { type: 'agent_started'; agentId: string }
  | { type: 'agent_completed'; agentId: string; result: unknown }
  | { type: 'workflow_started'; workflowId: string }
  | { type: 'workflow_completed'; workflowId: string; result: unknown };
