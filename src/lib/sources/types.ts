/** Private source-discovery contracts. Never project these objects wholesale. */

export type SearchTab = 'web' | 'images' | 'news';

export interface SearchRequest {
  query: string;
  tab: SearchTab;
  page: number;
}

export interface SourceResult {
  id: string;
  title: string;
  url: string;
  description: string;
  publisher: string | null;
  publishedAt: string | null;
  imageUrl: string | null;
}

export interface SearchResponse {
  query: string;
  tab: SearchTab;
  page: number;
  results: SourceResult[];
  nextPage: number | null;
  strictFiltering: true;
  filtered: boolean;
  retrievedAt: string;
}

export interface ReaderResponse {
  originalUrl: string;
  finalUrl: string;
  title: string;
  text: string;
  publisher: string | null;
  publishedAt: string | null;
  retrievedAt: string;
  status: 'plain-text' | 'extracted' | 'unavailable';
  reason: string | null;
}
