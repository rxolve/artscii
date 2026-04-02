export interface ArtEntry {
  id: string;
  name: string;
  category: string;
  tags: string[];
  file: string;
  width: number;
  height: number;
}

export interface ArtResult {
  id: string;
  name: string;
  category: string;
  tags: string[];
  art: string;
}
