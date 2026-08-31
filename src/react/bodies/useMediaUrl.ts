import { useEffect, useState } from 'react';
import type { ChatMessage } from '../../core/types';

export type MediaUrlState =
  { state: 'loading' } | { state: 'ready'; url: string } | { state: 'unavailable' };

/** Resolve (signed) media URLs lazily; controller caches per message id. */
export function useMediaUrl(
  message: ChatMessage,
  resolve: (message: ChatMessage) => Promise<string | null>,
): MediaUrlState {
  const [state, setState] = useState<MediaUrlState>(
    message.media?.url ? { state: 'ready', url: message.media.url } : { state: 'loading' },
  );

  const mediaStatus = message.media?.status ?? 'none';
  const presetUrl = message.media?.url ?? null;

  useEffect(() => {
    // Deliberate sync resets when the message identity/media status changes.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (presetUrl) {
      setState({ state: 'ready', url: presetUrl });
      return;
    }
    if (mediaStatus !== 'ready') {
      setState({ state: mediaStatus === 'pending' ? 'loading' : 'unavailable' });
      return;
    }
    let cancelled = false;
    setState({ state: 'loading' });
    /* eslint-enable react-hooks/set-state-in-effect */
    resolve(message).then((url) => {
      if (cancelled) return;
      setState(url ? { state: 'ready', url } : { state: 'unavailable' });
    });
    return () => {
      cancelled = true;
    };
    // message identity: id + media status are what matter for re-resolution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id, mediaStatus, presetUrl, resolve]);

  return state;
}
