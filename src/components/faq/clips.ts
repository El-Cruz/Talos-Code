export interface ClipSource { readonly webm?: string; readonly mp4?: string; readonly poster?: string }

/**
 * Drop the real demo files in `public/media/` and register them by FAQ item id,
 * e.g. `loyalty: { webm: "/media/loyalty.webm", mp4: "/media/loyalty.mp4", poster: "/media/loyalty.jpg" }`.
 * Ids without an entry render the animated placeholder.
 */
export const CLIPS: Readonly<Record<string, ClipSource | undefined>> = {};
