/** Shared schema for static picture questions; no runtime image or source fetching. */
export interface PictureQuestion {
  id: string;
  /** Correct country's ISO 3166-1 alpha-2 code, following QUIZ_COUNTRIES. */
  iso2: string;
  level: 1 | 2 | 3;
  prompt: string;
  options: readonly [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  /** Two to five words for a Wikimedia Commons search, not an image URL or caption. */
  picture: string;
  /** Reviewed exact Commons filename, including File:; omit when not verified. */
  pictureFile?: string;
  /** Licence offered on that file's Commons page; supplied with pictureFile. */
  pictureLicense?: string;
  fact: string;
  sourceUrl: string;
}
