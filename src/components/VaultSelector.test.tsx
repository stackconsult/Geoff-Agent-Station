import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VaultSelector } from './VaultSelector';

describe('VaultSelector', () => {
  it('renders vault selection UI when no vault is selected', () => {
    render(<VaultSelector onVaultSelect={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /select your obsidian vault/i }))
      .toBeInTheDocument();
  });
});
