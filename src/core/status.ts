import type { MessageStatus } from './types';

// Statuses only upgrade: sending < sent < delivered < read; failed terminal.
const RANK: Record<MessageStatus, number> = {
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4,
  received: 99,
};

/** Merge an incoming status with what we already show — never regress. */
export function mergeStatus(current: MessageStatus, incoming: MessageStatus): MessageStatus {
  if (current === 'received') return current;
  if ((current === 'delivered' || current === 'read') && incoming === 'failed') return current;
  return RANK[incoming] > RANK[current] ? incoming : current;
}
