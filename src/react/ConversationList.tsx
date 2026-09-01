import type { ReactNode } from 'react';
import type { Conversation } from '../core/types';
import type { ChatLabels } from '../core/i18n';
import { previewLabelFor } from '../core/i18n';
import { formatListTime } from '../core/time';
import { stripWhatsAppFormatting } from '../core/format';

function initials(title: string): string {
  const parts = title.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * One list row. Anatomy (grid: avatar | main):
 *   .wck-row
 *     .wck-avatar
 *     .wck-row-main
 *       .wck-row-head  → title · time
 *       .wck-row-sub   → direction mark + preview · badges
 */
export function ConversationRow({
  conversation,
  active,
  labels,
  locale,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  labels: ChatLabels;
  locale: string;
  onSelect: (conversationId: string) => void;
}) {
  const unread = conversation.unreadCount > 0;
  const preview = conversation.lastMessagePreview
    ? stripWhatsAppFormatting(conversation.lastMessagePreview)
    : previewLabelFor(labels, conversation.lastMessageType);
  return (
    <button
      type="button"
      className={`wck-row${active ? ' wck-row-active' : ''}`}
      onClick={() => onSelect(conversation.id)}
    >
      <span className="wck-avatar" aria-hidden>
        {conversation.avatarUrl ? (
          <img src={conversation.avatarUrl} alt="" />
        ) : (
          initials(conversation.title)
        )}
      </span>
      <span className="wck-row-main">
        <span className="wck-row-head">
          <span className={`wck-row-title${unread ? ' wck-unread' : ''}`}>
            {conversation.title}
          </span>
          {conversation.lastMessageAt && (
            <time
              className={`wck-row-time${unread ? ' wck-unread-time' : ''}`}
              dateTime={conversation.lastMessageAt}
            >
              {formatListTime(conversation.lastMessageAt, locale)}
            </time>
          )}
        </span>
        <span className="wck-row-sub">
          <span className="wck-row-preview">
            {conversation.lastMessageDirection === 'out' && (
              <span className="wck-row-out-mark" aria-hidden>
                ✓
              </span>
            )}
            {preview}
          </span>
          <span className="wck-row-badges">
            {conversation.accountLabel && (
              <span className="wck-account-badge">{conversation.accountLabel}</span>
            )}
            {unread && (
              <span className="wck-unread-badge">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            )}
          </span>
        </span>
      </span>
    </button>
  );
}

export function ConversationList({
  conversations,
  activeId,
  loading,
  query,
  labels,
  locale,
  headerExtra,
  onQueryChange,
  onSelect,
}: {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  query: string;
  labels: ChatLabels;
  locale: string;
  /** Host content beside the title, above the search input (e.g. "new chat"). */
  headerExtra?: ReactNode;
  onQueryChange: (query: string) => void;
  onSelect: (conversationId: string) => void;
}) {
  return (
    <aside className="wck-list">
      <div className="wck-list-header">
        <div className="wck-list-header-top">
          <h2 className="wck-list-title">{labels.conversationsTitle}</h2>
          {headerExtra && <div className="wck-list-header-extra">{headerExtra}</div>}
        </div>
        <input
          type="search"
          className="wck-search"
          placeholder={labels.searchPlaceholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      {conversations.length === 0 ? (
        <p className="wck-list-empty">{loading ? '…' : labels.emptyList}</p>
      ) : (
        <ul className="wck-rows">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <ConversationRow
                conversation={conversation}
                active={conversation.id === activeId}
                labels={labels}
                locale={locale}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
