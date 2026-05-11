import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Message {
  role: string;
  content: string;
}

interface AISettings {
  provider: 'ollama' | 'openai' | 'custom';
  model: string;
  baseUrl: string;
  temperature: number;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'ollama',
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434',
    temperature: 0.7,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const MIN_REQUEST_INTERVAL_MS = 500;

  useEffect(() => {
    // Load AI settings from localStorage
    const savedSettings = localStorage.getItem('tolaria_ai_settings');
    if (savedSettings) {
      setAiSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    if (aiSettings.model) {
      initializeAI();
    }
  }, [aiSettings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeAI = async () => {
    try {
      const providerConfig = aiSettings.provider === 'ollama'
        ? { Ollama: { model: aiSettings.model, base_url: aiSettings.baseUrl } }
        : aiSettings.provider === 'openai'
        ? { OpenAI: { model: aiSettings.model, base_url: aiSettings.baseUrl } }
        : { Custom: { model: aiSettings.model, base_url: aiSettings.baseUrl } };

      await invoke('ai_initialize', {
        config: {
          provider: providerConfig,
          temperature: aiSettings.temperature,
          max_tokens: 2048,
          system_prompt: 'You are a helpful desktop automation assistant.',
        },
      });
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize AI:', error);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const now = Date.now();
    if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL_MS) return;
    lastRequestTimeRef.current = now;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await invoke<string>('ai_chat', { message: input });
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const clearHistory = async () => {
    try {
      await invoke('ai_clear_history');
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              AI Assistant
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isInitialized ? 'Connected to Ollama' : 'Initializing...'}
            </p>
          </div>
          <button
            onClick={clearHistory}
            className="px-3 py-1.5 text-sm rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--color-text-secondary)]">
            <div className="text-center max-w-md">
              <p className="text-lg mb-2">👋 Hello! I'm your AI assistant</p>
              <p className="text-sm">
                Ask me anything about automation, coding, or productivity. I can help you:
              </p>
              <ul className="text-sm mt-4 space-y-2 text-left">
                <li>• Create and debug workflows</li>
                <li>• Write and review code</li>
                <li>• Analyze data and generate insights</li>
                <li>• Plan tasks and optimize productivity</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            disabled={!isInitialized || isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!isInitialized || isLoading || !input.trim()}
            className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
