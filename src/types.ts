export type ArtType = 'art' | 'kaomoji';
export type ArtSize = 16 | 32 | 64;

export interface ArtEntry {
  id: string;
  type?: ArtType;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  size: ArtSize;
  file: string;
  width: number;
  height: number;
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

export interface ArtResult {
  id: string;
  type?: ArtType;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  size: ArtSize;
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
