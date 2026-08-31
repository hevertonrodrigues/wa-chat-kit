import type { MessageStatus } from '../core/types';
import type { ChatLabels } from '../core/i18n';

const PATHS = {
  clock: (
    <path d="M8 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8Zm6.75-3v2.94l1.9 1.9-1.06 1.07L7.25 8.56V5h1.5Z" />
  ),
  check: <path d="m5.6 10.9-3-3L1.5 9l4.1 4.1 8-8L12.5 4l-6.9 6.9Z" />,
  checkCheck: (
    <>
      <path d="m4.3 10.9-2.9-2.9L.3 9.1 4.3 13l7.6-7.6-1.1-1.1-6.5 6.6Z" />
      <path d="m8.4 11.6 1 1.4 6.3-7.6-1.2-1L9.4 10l-.1-.1-.9 1.7Z" />
    </>
  ),
  alert: <path d="M8 1.5 15 14H1L8 1.5Zm-.75 4.5v4h1.5V6h-1.5Zm0 5.5V13h1.5v-1.5h-1.5Z" />,
};

/** Outbound-only ticks: sending → clock, sent → ✓, delivered → ✓✓, read → blue ✓✓, failed → ⚠. */
export function StatusTicks({ status, labels }: { status: MessageStatus; labels: ChatLabels }) {
  if (status === 'received') return null;
  const label =
    status === 'sending'
      ? labels.statusSending
      : status === 'sent'
        ? labels.statusSent
        : status === 'delivered'
          ? labels.statusDelivered
          : status === 'read'
            ? labels.statusRead
            : labels.statusFailed;
  const icon =
    status === 'sending'
      ? PATHS.clock
      : status === 'sent'
        ? PATHS.check
        : status === 'failed'
          ? PATHS.alert
          : PATHS.checkCheck;
  return (
    <svg
      className={`wck-ticks wck-ticks-${status}`}
      viewBox="0 0 16 16"
      width="15"
      height="15"
      fill="currentColor"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {icon}
    </svg>
  );
}
