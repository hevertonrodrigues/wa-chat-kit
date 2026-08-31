import { describe, expect, it } from 'vitest';
import { tokenizeWhatsAppText, stripWhatsAppFormatting } from '../src/core/format';
import { buildThreadItems } from '../src/core/grouping';
import { mergeStatus } from '../src/core/status';
import { formatDayLabel, formatListTime } from '../src/core/time';
import { mergeIncomingMessage } from '../src/react/useChatController';
import type { ChatMessage } from '../src/core/types';

function msg(partial: Partial<ChatMessage> & { id: string }): ChatMessage {
  return {
    conversationId: 'c1',
    direction: 'in',
    type: 'text',
    status: 'received',
    text: 'hello',
    timestamp: '2026-09-01T10:00:00.000Z',
    ...partial,
  };
}

describe('tokenizeWhatsAppText', () => {
  it('parses WhatsApp syntax: *bold* _italic_ ~strike~ ```mono```', () => {
    expect(tokenizeWhatsAppText('oi *tudo* _bem_ ~riscado~')).toEqual([
      'oi ',
      { kind: 'bold', children: ['tudo'] },
      ' ',
      { kind: 'italic', children: ['bem'] },
      ' ',
      { kind: 'strike', children: ['riscado'] },
    ]);
  });

  it('mono wins first and its contents are not re-tokenized', () => {
    expect(tokenizeWhatsAppText('x ```*raw*``` y')).toEqual([
      'x ',
      { kind: 'mono', value: '*raw*' },
      ' y',
    ]);
  });

  it('supports nesting and autolinks URLs', () => {
    expect(tokenizeWhatsAppText('*bold _both_*')).toEqual([
      { kind: 'bold', children: ['bold ', { kind: 'italic', children: ['both'] }] },
    ]);
    const tokens = tokenizeWhatsAppText('veja https://nivox.dev/x_y agora');
    expect(tokens).toContainEqual({
      kind: 'url',
      href: 'https://nivox.dev/x_y',
      label: 'https://nivox.dev/x_y',
    });
  });

  it('does not bold mid-word asterisks (5 * 3 * 2)', () => {
    expect(tokenizeWhatsAppText('5 * 3 * 2 = 30')).toEqual(['5 * 3 * 2 = 30']);
  });

  it('strips formatting for previews', () => {
    expect(stripWhatsAppFormatting('*a* _b_ ~c~ ```d```')).toBe('a b c d');
  });
});

describe('buildThreadItems', () => {
  it('inserts day separators and groups consecutive same-direction runs', () => {
    const items = buildThreadItems([
      msg({ id: '1', timestamp: '2026-08-31T10:00:00.000Z' }),
      msg({ id: '2', timestamp: '2026-09-01T10:00:00.000Z' }),
      msg({ id: '3', timestamp: '2026-09-01T10:01:00.000Z' }),
      msg({ id: '4', direction: 'out', status: 'sent', timestamp: '2026-09-01T10:02:00.000Z' }),
    ]);
    expect(items.map((i) => i.kind)).toEqual([
      'day',
      'message',
      'day',
      'message',
      'message',
      'message',
    ]);
    const [, , , m2, m3, m4] = items;
    expect(m2).toMatchObject({ first: true, last: false });
    expect(m3).toMatchObject({ first: false, last: true });
    expect(m4).toMatchObject({ first: true, last: true });
  });
});

describe('mergeStatus', () => {
  it('upgrades and never regresses', () => {
    expect(mergeStatus('sent', 'delivered')).toBe('delivered');
    expect(mergeStatus('read', 'delivered')).toBe('read');
    expect(mergeStatus('read', 'failed')).toBe('read');
    expect(mergeStatus('sending', 'failed')).toBe('failed');
    expect(mergeStatus('received', 'read')).toBe('received');
  });
});

describe('mergeIncomingMessage', () => {
  it('reconciles a server row with the optimistic local row by clientId', () => {
    const local = msg({
      id: 'local-1',
      clientId: 'local-1',
      direction: 'out',
      status: 'sending',
      text: 'oi',
    });
    const merged = mergeIncomingMessage([local], {
      ...local,
      id: 'row-9',
      clientId: 'local-1',
      externalId: 'wamid.9',
      status: 'sent',
    });
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'row-9', externalId: 'wamid.9', status: 'sent' });
  });

  it('falls back to content-matching an outbound sending row (realtime before HTTP)', () => {
    const local = msg({
      id: 'local-2',
      clientId: 'local-2',
      direction: 'out',
      status: 'sending',
      text: 'fala',
    });
    const merged = mergeIncomingMessage([local], {
      ...msg({ id: 'row-1', direction: 'out', status: 'sent', text: 'fala' }),
      clientId: null,
      externalId: 'wamid.1',
    });
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'row-1', clientId: 'local-2' });
  });

  it('appends unknown rows in timestamp order and never downgrades status', () => {
    const a = msg({ id: 'a', direction: 'out', status: 'read', timestamp: '2026-09-01T10:00:00Z' });
    const merged = mergeIncomingMessage([a], { ...a, status: 'delivered' });
    expect(merged[0]!.status).toBe('read');
    const appended = mergeIncomingMessage([a], msg({ id: 'b', timestamp: '2026-09-01T09:00:00Z' }));
    expect(appended.map((m) => m.id)).toEqual(['b', 'a']);
  });
});

describe('time', () => {
  const now = new Date('2026-09-01T12:00:00.000Z');
  it('labels days (timezone-safe midday fixtures)', () => {
    expect(formatDayLabel('2026-09-01T08:00:00.000Z', 'pt-BR', now)).toEqual({ kind: 'today' });
    expect(formatDayLabel('2026-08-31T10:00:00.000Z', 'pt-BR', now)).toEqual({
      kind: 'yesterday',
    });
    expect(formatDayLabel('2026-08-20T10:00:00.000Z', 'pt-BR', now).kind).toBe('date');
  });
  it('list times fall back to weekday then date', () => {
    expect(formatListTime('2026-09-01T09:30:00.000Z', 'en', now)).toMatch(/\d{2}:\d{2}/);
    expect(formatListTime('2026-08-29T09:30:00.000Z', 'en', now)).toMatch(/[A-Za-z]/);
  });
});
