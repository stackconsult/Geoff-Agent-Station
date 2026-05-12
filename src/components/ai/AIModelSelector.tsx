import { useState } from 'react';

export interface AIModel {
  id: string;
  name: string;
  provider: 'ollama' | 'openai' | 'claude' | 'local';
  capabilities: string[];
  contextWindow: number;
}

const AVAILABLE_MODELS: AIModel[] = [
  { id: 'ollama-llama3', name: 'Llama 3 (Ollama)', provider: 'ollama', capabilities: ['chat', 'code', 'analysis'], contextWindow: 8192 },
  { id: 'ollama-mistral', name: 'Mistral (Ollama)', provider: 'ollama', capabilities: ['chat', 'code'], contextWindow: 8192 },
  { id: 'openai-gpt4', name: 'GPT-4 (OpenAI)', provider: 'openai', capabilities: ['chat', 'code', 'analysis', 'vision'], contextWindow: 128000 },
  { id: 'claude-3', name: 'Claude 3 (Anthropic)', provider: 'claude', capabilities: ['chat', 'code', 'analysis', 'vision'], contextWindow: 200000 },
];

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function AIModelSelector({ selectedModel, onModelChange }: AIModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModelData = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-sm text-[var(--color-text-primary)] border border-[var(--color-border)]"
      >
        <span>🤖</span>
        <span>{selectedModelData?.name || 'Select Model'}</span>
        <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md shadow-lg z-50">
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-hover)] flex flex-col ${
                selectedModel === model.id ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">{model.provider === 'ollama' ? '🦙' : model.provider === 'openai' ? '🔵' : model.provider === 'claude' ? '🟣' : '💻'}</span>
                <span className="font-medium">{model.name}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">
                {model.capabilities.join(', ')} • {model.contextWindow} tokens
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
