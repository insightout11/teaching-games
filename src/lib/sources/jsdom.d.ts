/** Narrow declarations for this adapter's jsdom usage; no extra type dependency. */
declare module 'jsdom' {
  export class VirtualConsole {
  }
  export class JSDOM {
    constructor(html: string, options: {
      url: string;
      contentType: string;
      virtualConsole: VirtualConsole;
    });
    window: {
      document: Document;
      close(): void;
    };
  }
}
