// The ONE time formatter — reference projects grew three inconsistent ones.

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatClock(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** Conversation-list style: today → HH:mm, <7 days → weekday, else short date. */
export function formatListTime(iso: string, locale: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (dayDiff <= 0) return formatClock(iso, locale);
  if (dayDiff < 7) return date.toLocaleDateString(locale, { weekday: 'short' });
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
}

export type DayLabel = { kind: 'today' } | { kind: 'yesterday' } | { kind: 'date'; label: string };

export function formatDayLabel(iso: string, locale: string, now: Date = new Date()): DayLabel {
  const date = new Date(iso);
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (dayDiff <= 0) return { kind: 'today' };
  if (dayDiff === 1) return { kind: 'yesterday' };
  return {
    kind: 'date',
    label: date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }),
  };
}

export function sameDay(aIso: string, bIso: string): boolean {
  return startOfDay(new Date(aIso)) === startOfDay(new Date(bIso));
}
