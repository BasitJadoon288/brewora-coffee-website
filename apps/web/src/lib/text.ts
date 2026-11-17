/** Admin-entered text is rendered as plain paragraphs (never as HTML). */
export const paragraphs = (s?: string) => (s ?? '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
