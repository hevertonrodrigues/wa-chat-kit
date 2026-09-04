import { useEffect, useRef, type ReactNode } from 'react';
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
  /**
   * Open this conversation once the list has loaded — for hosts that deep-link
   * into a thread (a URL, a search result, a record in another screen).
   * Applied once per id: the user is free to navigate away afterwards, and
   * changing the prop opens the new one.
   */
  initialConversationId?: string | null;
  /** Called whenever the active conversation changes, including on back. */
  onConversationChange?: (conversationId: string | null) => void;
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
  initialConversationId,
  onConversationChange,
  onError,
  className,
}: ChatAppProps) {
  const labels = resolveLabels(locale, labelOverrides);
  const chat = useChatController({ adapter, pageSize, onError });

  const active = chat.activeConversation;
  const { selectConversation, activeId, conversations } = chat;

  // Deep link: open it as soon as the list knows about it, then never again for
  // that id — otherwise pressing back would re-open it on the next render.
  const openedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialConversationId || openedRef.current === initialConversationId) return;
    if (!conversations.some((conversation) => conversation.id === initialConversationId)) return;
    openedRef.current = initialConversationId;
    selectConversation(initialConversationId);
  }, [initialConversationId, conversations, selectConversation]);

  const notifiedRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (notifiedRef.current === activeId) return;
    notifiedRef.current = activeId;
    onConversationChange?.(activeId);
  }, [activeId, onConversationChange]);

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
