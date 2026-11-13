// [AI-GENERATED]
// Running inside the CineGrade desktop app's WebView. The app adds "CineGradeDesktop/<version>" to the user
// agent before the first page loads, so this is known from the start. The bridge object comes later: Java
// sets window.cinegradeDesktop only once a page has finished loading, so always look it up at the moment
// you need it (desktopBridge()), never once at startup.

/** What the desktop app exposes on window.cinegradeDesktop (public methods of DesktopBridge.java). */
export interface CineGradeDesktopBridge {
  /** JSON of a {@link DesktopDownloadRequest}. The app shows a save dialog and downloads the file itself. */
  download(json: string): void;
  /** Reloads the site, used by the offline page. */
  retry(): void;
  version(): string;
  /**
   * JSON of a {@link DesktopShareDraft}: what the preset menu's Share prepared. Null or "" when there is none.
   * A plain string on purpose: a Java object (e.g. Gson's JsonObject) would arrive here as an opaque handle.
   */
  shareDraft(): string | null;
  /**
   * JSON of a {@link DesktopPublishRequest}. The app posts it with the share draft's files, because the WebView
   * can't upload a FormData with files made in JavaScript. Answers with a {@link DesktopPublishEvent}.
   */
  publish(json: string): void;
}

/** The text part of a post published from the app; the files are the share draft's. */
export interface DesktopPublishRequest {
  title: string;
  description?: string;
  tags: string[];
}

/** cg-desktop event after {@link CineGradeDesktopBridge.publish}; postId is set when status is 'done'. */
export interface DesktopPublishEvent {
  type: 'publish';
  status: 'done' | 'signin' | 'offline' | 'failed';
  postId: number;
}

/** One exported file. `base64` is the file's bytes, no "data:" prefix. */
export interface DesktopShareFile {
  name: string;
  type: string;
  base64: string;
}

/** Returned by {@link CineGradeDesktopBridge.shareDraft}. The images are required, lut/cgedit at least one. */
export interface DesktopShareDraft {
  title: string;
  description?: string;
  before: DesktopShareFile;
  after: DesktopShareFile;
  lut?: DesktopShareFile;
  cgedit?: DesktopShareFile;
}

/** The query flag the app opens /upload with, so the page knows to ask for the draft. */
export const SHARE_DRAFT_PARAM = 'from';
export const SHARE_DRAFT_VALUE = 'desktop';

export type DownloadKind = 'lut' | 'cgedit';

/** Sent to {@link CineGradeDesktopBridge.download} as JSON. Matches DownloadRequest.java. */
export interface DesktopDownloadRequest {
  postId: number;
  kind: DownloadKind;
  /** Suggested name for the save dialog, with the extension. */
  fileName: string;
}

/**
 * The app answers with `window.dispatchEvent(new CustomEvent('cg-desktop', { detail }))`.
 * A download always ends with exactly one of these statuses, including when the dialog is cancelled.
 */
export interface DesktopDownloadEvent {
  type: 'download';
  postId: number;
  kind: DownloadKind;
  status: 'done' | 'cancelled' | 'signin' | 'offline' | 'failed';
}

export const DESKTOP_EVENT = 'cg-desktop';

declare global {
  interface Window {
    cinegradeDesktop?: CineGradeDesktopBridge;
  }
}

const DESKTOP_AGENT = 'CineGradeDesktop';

export function isDesktop(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes(DESKTOP_AGENT);
}

/** The bridge, or null outside the app or before the app has attached it. */
export function desktopBridge(): CineGradeDesktopBridge | null {
  return typeof window !== 'undefined' ? (window.cinegradeDesktop ?? null) : null;
}

/**
 * Waits for the bridge: Java attaches it only after the page finished loading, which can be after this page's
 * component started. Resolves null if it doesn't show up in time (not in the app, or still loading).
 */
export function waitForBridge(timeoutMs = 5000): Promise<CineGradeDesktopBridge | null> {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const bridge = desktopBridge();
      if (bridge || Date.now() - start >= timeoutMs) {
        resolve(bridge);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

/** Parses the bridge's JSON; null when it's empty or broken. */
export function parseShareDraft(json: string | null | undefined): DesktopShareDraft | null {
  if (!json) {
    return null;
  }
  try {
    const draft = JSON.parse(json) as DesktopShareDraft;
    return draft?.before && draft.after && (draft.lut || draft.cgedit) ? draft : null;
  } catch {
    return null;
  }
}

/** A real File from the bridge's base64, so the form treats it like a picked file. */
export function toFile(file: DesktopShareFile): File {
  const binary = atob(file.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], file.name, { type: file.type });
}

/** "Teal & Orange #2" + lut -> "teal-orange-2.cube". Falls back to "cinegrade" when nothing is left. */
export function downloadFileName(title: string | undefined, kind: DownloadKind): string {
  const base =
    (title ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')       // é -> e, so Windows paths stay simple
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'cinegrade';
  return `${base}.${kind === 'lut' ? 'cube' : 'cgedit'}`;
}
