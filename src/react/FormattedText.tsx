import type { ReactNode } from 'react';
import { tokenizeWhatsAppText, type FormatToken } from '../core/format';

function renderTokens(tokens: FormatToken[], keyPrefix: string): ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof token === 'string') return token;
    switch (token.kind) {
      case 'bold':
        return <strong key={key}>{renderTokens(token.children, key)}</strong>;
      case 'italic':
        return <em key={key}>{renderTokens(token.children, key)}</em>;
      case 'strike':
        return <del key={key}>{renderTokens(token.children, key)}</del>;
      case 'mono':
        return <code key={key}>{token.value}</code>;
      case 'url':
        return (
          <a key={key} href={token.href} target="_blank" rel="noopener noreferrer">
            {token.label}
          </a>
        );
    }
  });
}

/** WhatsApp-formatted text (*bold* _italic_ ~strike~ ```mono``` + links), token-rendered. */
export function FormattedText({ text }: { text: string }) {
  return <span className="wck-formatted">{renderTokens(tokenizeWhatsAppText(text), 't')}</span>;
}
