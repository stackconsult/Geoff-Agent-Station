export interface VaultEntry {
  id: string;
  title: string;
  path: string;
  content?: string;
  snippet?: string;
  modifiedAt?: string;
  frontmatter: VaultFrontmatter;
  links: string[];
  type?: string;
}

export interface VaultFrontmatter {
  type?: string;
  tags?: string[];
  created?: string;
  modified?: string;
}

export interface AppState {
  vaultPath: string;
  notes: VaultEntry[];
  currentNote: VaultEntry | null;
  isLoading: boolean;
  error: string | null;
}

