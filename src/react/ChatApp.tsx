import type { ReactNode } from 'react';
import type { ChatAdapter, ChatMessage, Conversation } from '../core/types';
import { resolveLabels, type ChatLabels } from '../core/i18n';
import { useChatController } from './useChatController';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';

export type ChatAppProps = {
  adapter: ChatAdapter;
  /** 'pt-BR' (default) | 'en' | 'es' — or any BCP-47 tag for date formatting */
  locale?: string;
  /** Override any built-in label (host i18n wins) */
  labels?: Partial<ChatLabels>;
  /** Messages per page (default 30) */
  pageSize?: number;
  /** Rendered inside the composer area when the 24h window is closed */
  renderSessionClosedAction?: (conversation: Conversation) => ReactNode;
  /** Extra header content for the active conversation (e.g. profile link) */
  renderHeaderExtra?: (conversation: Conversation) => ReactNode;
  /** Rendered in the list header, above the search input (e.g. "new chat"). */
  listHeaderExtra?: ReactNode;
  onError?: (error: unknown) => void;
  className?: string;
};

/** The batteries-included two-pane WhatsApp inbox. */
export function ChatApp({
  adapter,
  locale = 'pt-BR',
  labels: labelOverrides,
  pageSize,
  renderSessionClosedAction,
  renderHeaderExtra,
  listHeaderExtra,
  onError,
  className,
}: ChatAppProps) {
  const labels = resolveLabels(locale, labelOverrides);
  const chat = useChatController({ adapter, pageSize, onError });

  const active = chat.activeConversation;

  return (
    <div
      className={`wck-root${active ? ' wck-has-active' : ''}${className ? ` ${className}` : ''}`}
    >
      <ConversationList
        conversations={chat.conversations}
        activeId={chat.activeId}
        loading={chat.listLoading}
        query={chat.query}
        labels={labels}
        locale={locale}
        headerExtra={listHeaderExtra}
        onQueryChange={chat.setQuery}
        onSelect={chat.selectConversation}
      />
      {active ? (
        <ConversationView
          conversation={active}
          messages={chat.messages}
          hasMore={chat.hasMore}
          threadLoading={chat.threadLoading}
          loadingOlder={chat.loadingOlder}
          labels={labels}
          locale={locale}
          onBack={() => chat.selectConversation(null)}
          onLoadOlder={() => void chat.loadOlder()}
          onSend={(input) => void chat.send(input)}
          replyTo={chat.replyTo}
          onSetReply={chat.setReplyTo}
          onReact={(message: ChatMessage, emoji: string) => {
            if (message.externalId) {
              void chat.send({ kind: 'reaction', targetExternalId: message.externalId, emoji });
            }
          }}
          resolveMediaUrl={chat.resolveMediaUrl}
          onRetry={adapter.retryMessage ? (message) => void chat.retry(message) : undefined}
          composerDisabledSlot={renderSessionClosedAction?.(active)}
          headerExtra={renderHeaderExtra?.(active)}
        />
      ) : (
        <section className="wck-thread wck-thread-placeholder">
          <p>{labels.selectConversation}</p>
        </section>
      )}
    </div>
  );
}
