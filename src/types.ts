export type ArtType = 'art' | 'kaomoji';

export interface ArtEntry {
  id: string;
  type?: ArtType;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  file: string;
  width: number;
  height: number;
  file32: string;
  width32: number;
  height32: number;
  userSubmitted?: boolean;
}

export interface KaomojiEntry {
  id: string;
  type: 'kaomoji';
  name: string;
  category: string;
  tags: string[];
  text: string;
}

export type ArtWidth = 64 | 32;

export interface ArtResult {
  id: string;
  type?: ArtType;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  art: string;
}

export interface KaomojiResult {
  id: string;
  type: 'kaomoji';
  name: string;
  category: string;
  tags: string[];
  text: string;
}
