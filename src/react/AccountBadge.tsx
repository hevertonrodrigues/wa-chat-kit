import type { CSSProperties } from 'react';
import type { Conversation } from '../core/types';

/**
 * The multi-account badge: the number's label, plus a colour dot when the host
 * assigns one (`accountColor`) so rows of the same number read as a group.
 */
export function AccountBadge({ conversation }: { conversation: Conversation }) {
  if (!conversation.accountLabel) return null;
  const color = conversation.accountColor ?? null;
  return (
    <span
      className={`wck-account-badge${color ? ' wck-account-badge-colored' : ''}`}
      style={color ? ({ '--wck-account-color': color } as CSSProperties) : undefined}
    >
      {color && <span className="wck-account-dot" aria-hidden />}
      {conversation.accountLabel}
    </span>
  );
}
