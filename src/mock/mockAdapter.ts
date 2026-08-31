// In-memory ChatAdapter: powers the demo, doubles as a fixture factory for
// host-app tests and design work. Covers every message type the kit renders.
import type {
  ChatAdapter,
  ChatMessage,
  Conversation,
  SendMessageInput,
  SubscribeHandlers,
} from '../core/types';

let seq = 0;
const id = (prefix: string) => `${prefix}-${++seq}`;

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function textMsg(
  conversationId: string,
  direction: 'in' | 'out',
  text: string,
  minsAgo: number,
  extra: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: id('m'),
    externalId: id('wamid'),
    conversationId,
    direction,
    type: 'text',
    status: direction === 'in' ? 'received' : 'read',
    text,
    timestamp: minutesAgo(minsAgo),
    ...extra,
  };
}

export type MockAdapterOptions = {
  /** Simulated network delay in ms (default 120) */
  latencyMs?: number;
  /** Auto-reply to outbound messages (default true) */
  echo?: boolean;
};

export function createMockAdapter(options: MockAdapterOptions = {}): ChatAdapter {
  const latency = options.latencyMs ?? 120;
  const echo = options.echo ?? true;
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const conversations: Conversation[] = [
    {
      id: 'conv-maria',
      title: 'Maria Souza',
      phone: '5511988887777',
      unreadCount: 2,
      lastMessagePreview: 'Perfeito, *obrigada*!',
      lastMessageType: 'text',
      lastMessageDirection: 'in',
      lastMessageAt: minutesAgo(4),
      sessionExpiresAt: new Date(Date.now() + 20 * 3_600_000).toISOString(),
      accountLabel: 'Loja Centro',
    },
    {
      id: 'conv-joao',
      title: 'João Pereira',
      phone: '5521977776666',
      unreadCount: 0,
      lastMessagePreview: '🎤 Áudio',
      lastMessageType: 'audio',
      lastMessageDirection: 'in',
      lastMessageAt: minutesAgo(60 * 5),
      sessionExpiresAt: new Date(Date.now() + 2 * 3_600_000).toISOString(),
    },
    {
      id: 'conv-ana',
      title: 'Ana Lima',
      phone: '5531966665555',
      unreadCount: 0,
      lastMessagePreview: '📋 Template',
      lastMessageType: 'template',
      lastMessageDirection: 'out',
      lastMessageAt: minutesAgo(60 * 30),
      // 24h window closed — showcases the template CTA state
      sessionExpiresAt: minutesAgo(60 * 6),
    },
  ];

  const IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#0e7a5f"/><circle cx="90" cy="80" r="40" fill="#ffd279"/><rect x="150" y="60" width="130" height="80" rx="10" fill="#eaf6f0"/></svg>`,
    );

  const messages = new Map<string, ChatMessage[]>([
    [
      'conv-maria',
      [
        textMsg('conv-maria', 'in', 'Oi! Vocês têm o produto em estoque?', 60 * 26, {
          authorName: 'Maria Souza',
        }),
        textMsg('conv-maria', 'out', 'Temos sim! Chega *amanhã* para retirada.', 60 * 25),
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-maria',
          direction: 'in',
          type: 'image',
          status: 'received',
          text: 'É esse aqui?',
          authorName: 'Maria Souza',
          media: { status: 'ready', mime: 'image/svg+xml', url: IMG },
          timestamp: minutesAgo(60 * 24),
        },
        textMsg('conv-maria', 'out', 'Esse mesmo! ~R$ 250~ *R$ 199* essa semana.', 60 * 23),
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-maria',
          direction: 'in',
          type: 'location',
          status: 'received',
          text: null,
          authorName: 'Maria Souza',
          location: {
            latitude: -23.5614,
            longitude: -46.6559,
            name: 'Loja Paulista',
            address: 'Av. Paulista, 1000 — São Paulo',
          },
          timestamp: minutesAgo(30),
        },
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-maria',
          direction: 'in',
          type: 'contacts',
          status: 'received',
          text: null,
          authorName: 'Maria Souza',
          contacts: [{ name: 'Carlos (marido)', phones: ['5511955554444'] }],
          timestamp: minutesAgo(20),
        },
        (() => {
          const m = textMsg('conv-maria', 'in', 'Perfeito, *obrigada*!', 4, {
            authorName: 'Maria Souza',
          });
          m.reactions = [{ emoji: '👍', from: 'me' }];
          return m;
        })(),
      ],
    ],
    [
      'conv-joao',
      [
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-joao',
          direction: 'in',
          type: 'audio',
          status: 'received',
          text: null,
          authorName: 'João Pereira',
          media: { status: 'failed', mime: 'audio/ogg', voice: true },
          timestamp: minutesAgo(60 * 5),
        },
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-joao',
          direction: 'out',
          type: 'document',
          status: 'delivered',
          text: 'Segue o contrato.',
          media: {
            status: 'ready',
            mime: 'application/pdf',
            filename: 'contrato-2026.pdf',
            sizeBytes: 184_320,
            url: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCg==',
          },
          timestamp: minutesAgo(60 * 4),
        },
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-joao',
          direction: 'out',
          type: 'interactive',
          status: 'read',
          text: 'Podemos agendar a instalação?',
          interactive: {
            text: 'Podemos agendar a instalação?',
            options: [
              { id: 'yes', title: 'Sim, pode' },
              { id: 'later', title: 'Semana que vem' },
            ],
          },
          timestamp: minutesAgo(60 * 3),
        },
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-joao',
          direction: 'in',
          type: 'button',
          status: 'received',
          text: 'Sim, pode',
          authorName: 'João Pereira',
          timestamp: minutesAgo(60 * 2),
        },
      ],
    ],
    [
      'conv-ana',
      [
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-ana',
          direction: 'out',
          type: 'template',
          status: 'sent',
          text: 'Olá Ana! Seu pedido 4512 foi enviado.',
          template: { name: 'order_shipped' },
          timestamp: minutesAgo(60 * 30),
        },
        {
          id: id('m'),
          externalId: id('wamid'),
          conversationId: 'conv-ana',
          direction: 'in',
          type: 'sticker',
          status: 'received',
          text: null,
          authorName: 'Ana Lima',
          media: { status: 'ready', mime: 'image/webp', url: IMG },
          timestamp: minutesAgo(60 * 29),
        },
        {
          id: id('m'),
          conversationId: 'conv-ana',
          direction: 'in',
          type: 'unknown',
          status: 'received',
          text: null,
          timestamp: minutesAgo(60 * 28),
        },
      ],
    ],
  ]);

  // Threads reply oldest-first; give replies quoted context sometimes.
  const handlers: SubscribeHandlers[] = [];
  const emitMessage = (message: ChatMessage) => {
    for (const h of handlers) h.onMessage?.(message);
    const conv = conversations.find((c) => c.id === message.conversationId);
    if (conv) {
      conv.lastMessageAt = message.timestamp;
      conv.lastMessageType = message.type;
      conv.lastMessageDirection = message.direction;
      conv.lastMessagePreview = message.text ?? null;
      for (const h of handlers) h.onConversation?.({ ...conv });
    }
  };

  return {
    async listConversations({ query }) {
      await wait(latency);
      const q = query?.trim().toLowerCase();
      const list = q
        ? conversations.filter(
            (c) => c.title.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, '')),
          )
        : conversations;
      return list.map((c) => ({ ...c }));
    },

    async listMessages({ conversationId, before, limit = 30 }) {
      await wait(latency);
      const all = messages.get(conversationId) ?? [];
      const cutoff = before ? new Date(before).getTime() : Infinity;
      const older = all.filter((m) => new Date(m.timestamp).getTime() < cutoff);
      const page = older.slice(-limit);
      return { messages: page.map((m) => ({ ...m })), hasMore: older.length > page.length };
    },

    async sendMessage(input: SendMessageInput) {
      await wait(latency * 2);
      if (input.kind === 'reaction') {
        const all = messages.get(input.conversationId) ?? [];
        const target = all.find((m) => m.externalId === input.targetExternalId);
        if (target) {
          target.reactions = [
            ...(target.reactions ?? []).filter((r) => r.from !== 'me'),
            ...(input.emoji ? [{ emoji: input.emoji, from: 'me' }] : []),
          ];
          for (const h of handlers) h.onMessageUpdate?.({ ...target });
        }
        return {};
      }
      const rowId = id('m');
      const externalId = id('wamid');
      const row: ChatMessage = {
        id: rowId,
        externalId,
        conversationId: input.conversationId,
        direction: 'out',
        type: input.kind === 'text' ? 'text' : input.mediaType,
        status: 'sent',
        text: input.kind === 'text' ? input.text : (input.caption ?? null),
        replyTo: input.replyTo ?? null,
        media:
          input.kind === 'media'
            ? {
                status: 'ready',
                mime: input.file.type,
                filename: input.filename ?? null,
                sizeBytes: input.file.size,
                voice: input.voice ?? false,
                url: URL.createObjectURL(input.file),
              }
            : null,
        timestamp: new Date().toISOString(),
      };
      messages.get(input.conversationId)?.push(row);

      // Simulate delivery→read upgrades and an echo reply.
      setTimeout(() => {
        row.status = 'delivered';
        for (const h of handlers) h.onMessageUpdate?.({ ...row });
      }, 900);
      setTimeout(() => {
        row.status = 'read';
        for (const h of handlers) h.onMessageUpdate?.({ ...row });
      }, 1800);
      if (echo && input.kind === 'text') {
        setTimeout(() => {
          const reply: ChatMessage = {
            id: id('m'),
            externalId: id('wamid'),
            conversationId: input.conversationId,
            direction: 'in',
            type: 'text',
            status: 'received',
            text: `Recebi: "${input.text}" ✅`,
            replyTo: externalId,
            authorName:
              conversations.find((c) => c.id === input.conversationId)?.title ?? 'Cliente',
            timestamp: new Date().toISOString(),
          };
          messages.get(input.conversationId)?.push(reply);
          emitMessage(reply);
        }, 2600);
      }
      return { id: rowId, externalId };
    },

    async markRead(conversationId) {
      await wait(latency);
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) conv.unreadCount = 0;
    },

    async resolveMediaUrl(message) {
      await wait(latency);
      return message.media?.url ?? null;
    },

    subscribe(h) {
      handlers.push(h);
      return () => {
        const index = handlers.indexOf(h);
        if (index >= 0) handlers.splice(index, 1);
      };
    },
  };
}
