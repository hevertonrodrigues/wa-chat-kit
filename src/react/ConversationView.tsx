import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from 'react';
import type { ChatMessage, Conversation, SendDraft } from '../core/types';
import type { ChatLabels } from '../core/i18n';
import { buildThreadItems } from '../core/grouping';
import { formatDayLabel } from '../core/time';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { AccountBadge } from './AccountBadge';

const TOP_LOAD_THRESHOLD_PX = 80;
const NEAR_BOTTOM_PX = 120;

export function ConversationView({
  conversation,
  messages,
  hasMore,
  threadLoading,
  loadingOlder,
  labels,
  locale,
  onBack,
  onLoadOlder,
  onSend,
  replyTo,
  onSetReply,
  onReact,
  onRetry,
  resolveMediaUrl,
  composerDisabledSlot,
  headerExtra,
}: {
  conversation: Conversation;
  messages: ChatMessage[];
  hasMore: boolean;
  threadLoading: boolean;
  loadingOlder: boolean;
  labels: ChatLabels;
  locale: string;
  onBack: () => void;
  onLoadOlder: () => void;
  onSend: (input: SendDraft) => void;
  replyTo: ChatMessage | null;
  onSetReply: (message: ChatMessage | null) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onRetry?: (message: ChatMessage) => void;
  resolveMediaUrl: (message: ChatMessage) => Promise<string | null>;
  composerDisabledSlot?: ReactNode;
  headerExtra?: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const restorationRef = useRef<{ height: number; top: number } | null>(null);
  const stickToBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const lastCountRef = useRef(0);

  const items = useMemo(() => buildThreadItems(messages), [messages]);
  const byExternalId = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of messages) if (m.externalId) map.set(m.externalId, m);
    return map;
  }, [messages]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollerRef.current;
    if (!el) return;
    // jsdom has no scrollTo(); plain assignment covers it
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // Prepend anchoring: restore BEFORE paint so loading history never jumps;
  // otherwise stick to bottom when the user was at the bottom. The setState
  // here is deliberate post-measurement work — it depends on live scroll
  // geometry, which cannot be derived during render.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const restoration = restorationRef.current;
    if (restoration) {
      el.scrollTop = restoration.top + (el.scrollHeight - restoration.height);
      restorationRef.current = null;
      lastCountRef.current = messages.length;
      return;
    }
    if (messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length;
      if (stickToBottomRef.current) scrollToBottom();
      else setShowJump(true);
    }
  }, [messages, scrollToBottom]);

  // Fresh conversation: open at the bottom.
  useLayoutEffect(() => {
    stickToBottomRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowJump(false);
    lastCountRef.current = -1;
  }, [conversation.id]);

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distanceFromBottom < NEAR_BOTTOM_PX;
      if (stickToBottomRef.current) setShowJump(false);
      if (el.scrollTop < TOP_LOAD_THRESHOLD_PX && hasMore && !loadingOlder && !threadLoading) {
        restorationRef.current = { height: el.scrollHeight, top: el.scrollTop };
        onLoadOlder();
      }
    },
    [hasMore, loadingOlder, onLoadOlder, threadLoading],
  );

  const jumpToQuoted = useCallback(
    (externalId: string) => {
      const target = byExternalId.get(externalId);
      if (!target) return;
      const el = document.getElementById(`wck-msg-${target.id}`);
      if (!el) return;
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      el.classList.add('wck-highlight');
      window.setTimeout(() => el.classList.remove('wck-highlight'), 1500);
    },
    [byExternalId],
  );

  const sessionOpen =
    !conversation.sessionExpiresAt || new Date(conversation.sessionExpiresAt) > new Date();

  return (
    <section className="wck-thread">
      <header className="wck-thread-header">
        <button type="button" className="wck-back" aria-label="←" onClick={onBack}>
          ←
        </button>
        <div className="wck-thread-id">
          <h2 className="wck-thread-title">{conversation.title}</h2>
          <p className="wck-thread-sub">
            +{conversation.phone}
            <AccountBadge conversation={conversation} />
          </p>
        </div>
        <div className="wck-thread-header-right">
          {!sessionOpen && <span className="wck-session-pill">{labels.sessionClosed}</span>}
          {headerExtra}
        </div>
      </header>

      <div className="wck-scroller" ref={scrollerRef} onScroll={onScroll}>
        {!hasMore && messages.length > 0 && (
          <p className="wck-thread-start">{labels.startOfConversation}</p>
        )}
        {loadingOlder && <p className="wck-thread-start">…</p>}
        {threadLoading && messages.length === 0 ? (
          <p className="wck-thread-empty">…</p>
        ) : messages.length === 0 ? (
          <p className="wck-thread-empty">{labels.emptyThread}</p>
        ) : (
          items.map((item) =>
            item.kind === 'day' ? (
              <div key={item.key} className="wck-day-row">
                <span className="wck-day">
                  {(() => {
                    const label = formatDayLabel(item.iso, locale);
                    return label.kind === 'today'
                      ? labels.today
                      : label.kind === 'yesterday'
                        ? labels.yesterday
                        : label.label;
                  })()}
                </span>
              </div>
            ) : (
              <MessageBubble
                key={item.key}
                message={item.message}
                first={item.first}
                last={item.last}
                labels={labels}
                locale={locale}
                quotedLookup={(externalId) => byExternalId.get(externalId) ?? null}
                onQuoteClick={jumpToQuoted}
                onReply={(message) => onSetReply(message)}
                onReact={onReact}
                onRetry={onRetry}
                resolveMediaUrl={resolveMediaUrl}
              />
            ),
          )
        )}
      </div>

      {showJump && (
        <button
          type="button"
          className="wck-jump"
          onClick={() => {
            stickToBottomRef.current = true;
            setShowJump(false);
            scrollToBottom(true);
          }}
        >
          ↓ {labels.newMessages}
        </button>
      )}

      <Composer
        labels={labels}
        disabled={!sessionOpen}
        disabledSlot={composerDisabledSlot}
        replyTo={replyTo}
        onCancelReply={() => onSetReply(null)}
        onSend={onSend}
      />
    </section>
  );
}
