import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { invoke } from '@tauri-apps/api/core';
import { AIChat } from './AIChat';

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: ai_initialize succeeds, ai_chat returns a reply
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'ai_initialize') return Promise.resolve();
    if (cmd === 'ai_chat') return Promise.resolve('Hello back!');
    if (cmd === 'ai_get_history') return Promise.resolve([]);
    return Promise.resolve();
  });
});

describe('AIChat', () => {
  it('renders the send button and input field', () => {
    render(<AIChat />);
    expect(screen.getByPlaceholderText('Type your message...')).toBeDefined();
    expect(screen.getByText('Send')).toBeDefined();
  });

  it('shows Initializing... then Connected after ai_initialize resolves', async () => {
    render(<AIChat />);
    await waitFor(() => {
      expect(screen.getByText('Connected to Ollama')).toBeDefined();
    });
  });

  it('sends a message and renders user bubble', async () => {
    render(<AIChat />);
    await waitFor(() => screen.getByText('Connected to Ollama'));

    const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement;
    await userEvent.type(input, 'Hello AI');
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeDefined();
    });
  });

  it('shows assistant reply in a message bubble', async () => {
    render(<AIChat />);
    await waitFor(() => screen.getByText('Connected to Ollama'));

    const input = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(input, 'Hello AI');
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(screen.getByText('Hello back!')).toBeDefined();
    });
  });

  it('rate limiter: two rapid sends in sequence only invoke ai_chat once', async () => {
    render(<AIChat />);
    await waitFor(() => screen.getByText('Connected to Ollama'));

    const input = screen.getByPlaceholderText('Type your message...');

    // First send
    await userEvent.type(input, 'First message');
    fireEvent.click(screen.getByText('Send'));

    // Second send immediately (lastRequestTimeRef was just set, delta < 500ms)
    await userEvent.type(input, 'Second');
    fireEvent.click(screen.getByText('Send'));

    // Wait for the first send to complete
    await waitFor(() => {
      expect(screen.getByText('Hello back!')).toBeDefined();
    });

    // ai_chat should have been called exactly once — rate limiter blocked the second
    const chatCalls = mockInvoke.mock.calls.filter((args) => args[0] === 'ai_chat');
    expect(chatCalls.length).toBe(1);
  });
});
