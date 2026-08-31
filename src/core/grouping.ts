import type { ChatMessage } from './types';
import { sameDay } from './time';

export type ThreadItem =
  | { kind: 'day'; key: string; iso: string }
  | {
      kind: 'message';
      key: string;
      message: ChatMessage;
      /** First/last of a consecutive same-direction run — drives bubble corners/tail */
      first: boolean;
      last: boolean;
    };

const RUN_BREAK_MS = 10 * 60 * 1000;

// Key by LOCAL date — sameDay() compares local days, and a UTC slice would
// collide across the midnight offset.
function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `day-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Day separators + consecutive-sender grouping in one chronological pass. */
export function buildThreadItems(messages: ChatMessage[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!;
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || !sameDay(prev.timestamp, msg.timestamp)) {
      items.push({ kind: 'day', key: localDayKey(msg.timestamp), iso: msg.timestamp });
    }
    const joinsPrev =
      !!prev &&
      prev.direction === msg.direction &&
      sameDay(prev.timestamp, msg.timestamp) &&
      new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime() < RUN_BREAK_MS;
    const joinsNext =
      !!next &&
      next.direction === msg.direction &&
      sameDay(next.timestamp, msg.timestamp) &&
      new Date(next.timestamp).getTime() - new Date(msg.timestamp).getTime() < RUN_BREAK_MS;
    items.push({
      kind: 'message',
      key: msg.id,
      message: msg,
      first: !joinsPrev,
      last: !joinsNext,
    });
  }
  return items;
}
