// WhatsApp text formatting as TOKENS, never HTML strings — the renderer maps
// tokens to elements (web) and could map to native Text runs, and there is no
// dangerouslySetInnerHTML anywhere. WhatsApp syntax: *bold* _italic_ ~strike~
// ```mono``` plus URL autolinking.

export type FormatToken =
  | string
  | { kind: 'bold' | 'italic' | 'strike'; children: FormatToken[] }
  | { kind: 'mono'; value: string }
  | { kind: 'url'; href: string; label: string };

type Pattern = {
  kind: 'mono' | 'bold' | 'italic' | 'strike' | 'url';
  re: RegExp;
};

// Order matters: mono first so its contents are never further tokenized;
// url before the emphasis rules so *see https://a_b.com* keeps the link whole.
// Like WhatsApp: the marked span must not start or end with whitespace
// (so `5 * 3 * 2` stays literal), and markers must sit on word boundaries.
const PATTERNS: Pattern[] = [
  { kind: 'mono', re: /```([\s\S]+?)```/ },
  { kind: 'url', re: /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/ },
  { kind: 'bold', re: /(?<=^|[\s(])\*(\S(?:[^*\n]*?\S)?)\*(?=$|[\s.,;:!?)])/ },
  { kind: 'italic', re: /(?<=^|[\s(])_(\S(?:[^_\n]*?\S)?)_(?=$|[\s.,;:!?)])/ },
  { kind: 'strike', re: /(?<=^|[\s(])~(\S(?:[^~\n]*?\S)?)~(?=$|[\s.,;:!?)])/ },
];

export function tokenizeWhatsAppText(input: string): FormatToken[] {
  if (!input) return [];
  for (const pattern of PATTERNS) {
    const match = pattern.re.exec(input);
    if (!match || match.index === undefined) continue;
    const inner = match[1] ?? '';
    const before = input.slice(0, match.index);
    const after = input.slice(match.index + match[0].length);
    const token: FormatToken =
      pattern.kind === 'mono'
        ? { kind: 'mono', value: inner }
        : pattern.kind === 'url'
          ? { kind: 'url', href: inner, label: inner }
          : { kind: pattern.kind, children: tokenizeWhatsAppText(inner) };
    return [...tokenizeWhatsAppText(before), token, ...tokenizeWhatsAppText(after)];
  }
  return [input];
}

/** Plain-text projection (for previews) — strips the formatting markers. */
export function stripWhatsAppFormatting(input: string): string {
  return tokensToPlainText(tokenizeWhatsAppText(input));
}

function tokensToPlainText(tokens: FormatToken[]): string {
  return tokens
    .map((token) => {
      if (typeof token === 'string') return token;
      if (token.kind === 'mono') return token.value;
      if (token.kind === 'url') return token.label;
      return tokensToPlainText(token.children);
    })
    .join('');
}
