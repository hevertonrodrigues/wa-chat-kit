import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatAdapter, ChatMessage, Conversation, SendDraft } from '../core/types';
import { mergeStatus } from '../core/status';

const DEFAULT_PAGE_SIZE = 30;
const MARK_READ_DEBOUNCE_MS = 800;
const MEDIA_URL_TTL_MS = 55 * 60 * 1000; // signed URLs are minted for 1h

let clientSeq = 0;
function nextClientId(): string {
  clientSeq += 1;
  return `local-${Date.now().toString(36)}-${clientSeq}`;
}

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime(),
  );
}

/**
 * Merge an incoming (server) message into the list. Reconciliation order:
 * row id → externalId → clientId → optimistic content match (an outbound
 * 'sending' local row with the same text, for backends whose realtime insert
 * can land before the send HTTP call returns).
 */
export function mergeIncomingMessage(list: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const index = list.findIndex(
    (m) =>
      m.id === incoming.id ||
      (incoming.externalId && m.externalId === incoming.externalId) ||
      (incoming.clientId && m.clientId === incoming.clientId),
  );
  if (index >= 0) {
    const current = list[index]!;
    const next = [...list];
    next[index] = {
      ...current,
      ...incoming,
      clientId: current.clientId ?? incoming.clientId,
      status: mergeStatus(current.status, incoming.status),
      reactions: incoming.reactions ?? current.reactions,
      media: incoming.media ?? current.media,
    };
    return next;
  }
  if (incoming.direction === 'out') {
    const optimistic = list.findIndex(
      (m) =>
        m.direction === 'out' &&
        m.status === 'sending' &&
        m.clientId != null &&
        (m.text ?? '') === (incoming.text ?? '') &&
        m.type === incoming.type,
    );
    if (optimistic >= 0) {
      const next = [...list];
      next[optimistic] = { ...incoming, clientId: list[optimistic]!.clientId };
      return next;
    }
  }
  return [...list, incoming].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

export type ChatController = ReturnType<typeof useChatController>;

export function useChatController(options: {
  adapter: ChatAdapter;
  pageSize?: number;
  onError?: (error: unknown) => void;
}) {
  const { adapter, onError } = options;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const activeIdRef = useRef<string | null>(null);
  const messagesCache = useRef(new Map<string, { messages: ChatMessage[]; hasMore: boolean }>());
  const mediaUrlCache = useRef(new Map<string, { url: string | null; expires: number }>());
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorRef = useRef(onError);
  errorRef.current = onError;

  const report = useCallback((error: unknown) => {
    errorRef.current?.(error);
  }, []);

  const refreshConversations = useCallback(
    async (search?: string) => {
      try {
        const list = await adapter.listConversations({ query: search || undefined });
        setConversations(sortConversations(list));
      } catch (error) {
        report(error);
      } finally {
        setListLoading(false);
      }
    },
    [adapter, report],
  );

  // Debounced server-side search; empty query refreshes the full list.
  useEffect(() => {
    const handle = setTimeout(() => void refreshConversations(query), query ? 350 : 0);
    return () => clearTimeout(handle);
  }, [query, refreshConversations]);

  const upsertConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === conversation.id);
      const next = index >= 0 ? [...prev] : [...prev, conversation];
      if (index >= 0) next[index] = { ...prev[index]!, ...conversation };
      return sortConversations(next);
    });
  }, []);

  const scheduleMarkRead = useCallback(
    (conversationId: string) => {
      if (markReadTimer.current) clearTimeout(markReadTimer.current);
      markReadTimer.current = setTimeout(() => {
        adapter.markRead(conversationId).catch(report);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
        );
      }, MARK_READ_DEBOUNCE_MS);
    },
    [adapter, report],
  );

  // Realtime: write payloads straight into state — never refetch-per-event.
  useEffect(() => {
    const unsubscribe = adapter.subscribe({
      onMessage: (message) => {
        if (message.conversationId === activeIdRef.current) {
          setMessages((prev) => mergeIncomingMessage(prev, message));
          if (message.direction === 'in') scheduleMarkRead(message.conversationId);
        }
        const cached = messagesCache.current.get(message.conversationId);
        if (cached) {
          cached.messages = mergeIncomingMessage(cached.messages, message);
        }
      },
      onMessageUpdate: (message) => {
        if (message.conversationId === activeIdRef.current) {
          setMessages((prev) => mergeIncomingMessage(prev, message));
        }
        const cached = messagesCache.current.get(message.conversationId);
        if (cached) cached.messages = mergeIncomingMessage(cached.messages, message);
      },
      onConversation: upsertConversation,
    });
    return unsubscribe;
  }, [adapter, scheduleMarkRead, upsertConversation]);

  const selectConversation = useCallback(
    (conversationId: string | null) => {
      activeIdRef.current = conversationId;
      setActiveId(conversationId);
      setReplyTo(null);
      if (!conversationId) {
        setMessages([]);
        setHasMore(false);
        return;
      }
      const cached = messagesCache.current.get(conversationId);
      if (cached) {
        setMessages(cached.messages);
        setHasMore(cached.hasMore);
      } else {
        setMessages([]);
        setThreadLoading(true);
      }
      adapter
        .listMessages({ conversationId, limit: pageSize })
        .then((page) => {
          if (activeIdRef.current !== conversationId) return;
          const ordered = [...page.messages].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );
          messagesCache.current.set(conversationId, {
            messages: ordered,
            hasMore: page.hasMore,
          });
          setMessages(ordered);
          setHasMore(page.hasMore);
        })
        .catch(report)
        .finally(() => setThreadLoading(false));
      scheduleMarkRead(conversationId);
    },
    [adapter, pageSize, report, scheduleMarkRead],
  );

  const loadOlder = useCallback(async () => {
    const conversationId = activeIdRef.current;
    const oldest = messages[0];
    if (!conversationId || !oldest || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    try {
      const page = await adapter.listMessages({
        conversationId,
        before: oldest.timestamp,
        limit: pageSize,
      });
      if (activeIdRef.current !== conversationId) return;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const older = page.messages
          .filter((m) => !known.has(m.id))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const next = [...older, ...prev];
        messagesCache.current.set(conversationId, { messages: next, hasMore: page.hasMore });
        return next;
      });
      setHasMore(page.hasMore);
    } catch (error) {
      report(error);
    } finally {
      setLoadingOlder(false);
    }
  }, [adapter, hasMore, loadingOlder, messages, pageSize, report]);

  const send = useCallback(
    async (input: SendDraft) => {
      const conversationId = activeIdRef.current;
      if (!conversationId) return;

      if (input.kind === 'reaction') {
        // Reactions attach to the target bubble; optimistic append there.
        setMessages((prev) =>
          prev.map((m) =>
            m.externalId === input.targetExternalId
              ? {
                  ...m,
                  reactions: [
                    ...(m.reactions ?? []).filter((r) => r.from !== 'me'),
                    ...(input.emoji ? [{ emoji: input.emoji, from: 'me' }] : []),
                  ],
                }
              : m,
          ),
        );
        try {
          await adapter.sendMessage({ ...input, conversationId });
        } catch (error) {
          report(error);
        }
        return;
      }

      const clientId = nextClientId();
      const now = new Date().toISOString();
      const optimistic: ChatMessage = {
        id: clientId,
        clientId,
        conversationId,
        direction: 'out',
        type: input.kind === 'text' ? 'text' : input.mediaType,
        status: 'sending',
        text: input.kind === 'text' ? input.text : (input.caption ?? null),
        replyTo: input.replyTo ?? null,
        media:
          input.kind === 'media'
            ? {
                status: 'ready',
                mime: input.file.type || null,
                filename: input.filename ?? (input.file instanceof File ? input.file.name : null),
                sizeBytes: input.file.size,
                voice: input.voice ?? false,
                url: URL.createObjectURL(input.file),
              }
            : null,
        timestamp: now,
      };
      setMessages((prev) => [...prev, optimistic]);
      setReplyTo(null);

      try {
        const result = await adapter.sendMessage({ ...input, conversationId });
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId
              ? {
                  ...m,
                  id: result.id ?? m.id,
                  externalId: result.externalId ?? m.externalId,
                  status: mergeStatus(m.status, 'sent'),
                }
              : m,
          ),
        );
      } catch (error) {
        report(error);
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId
              ? {
                  ...m,
                  status: 'failed',
                  errorMessage: error instanceof Error ? error.message : 'send failed',
                }
              : m,
          ),
        );
      }
    },
    [adapter, report],
  );

  const resolveMediaUrl = useCallback(
    async (message: ChatMessage): Promise<string | null> => {
      if (message.media?.url) return message.media.url;
      const hit = mediaUrlCache.current.get(message.id);
      if (hit && hit.expires > Date.now()) return hit.url;
      try {
        const url = await adapter.resolveMediaUrl(message);
        mediaUrlCache.current.set(message.id, { url, expires: Date.now() + MEDIA_URL_TTL_MS });
        return url;
      } catch (error) {
        report(error);
        return null;
      }
    },
    [adapter, report],
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  return {
    conversations,
    listLoading,
    query,
    setQuery,
    refreshConversations,
    activeConversation,
    activeId,
    selectConversation,
    messages,
    hasMore,
    threadLoading,
    loadingOlder,
    loadOlder,
    send,
    replyTo,
    setReplyTo,
    resolveMediaUrl,
  };
}
