export interface ArtEntry {
  id: string;
  name: string;
  category: string;
  tags: string[];
  file: string;
  width: number;
  height: number;
  file32: string;
  width32: number;
  height32: number;
}

export type ArtWidth = 64 | 32;

export interface ArtResult {
  id: string;
  name: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  art: string;
}
