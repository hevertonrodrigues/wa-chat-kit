import { useState } from 'react';
import type { ChatMessage } from '../../core/types';
import type { ChatLabels } from '../../core/i18n';
import { useMediaUrl } from './useMediaUrl';

type BodyProps = {
  message: ChatMessage;
  labels: ChatLabels;
  resolveMediaUrl: (message: ChatMessage) => Promise<string | null>;
};

function MediaNote({ state, labels }: { state: 'loading' | 'unavailable'; labels: ChatLabels }) {
  return (
    <p className={`wck-media-note${state === 'unavailable' ? ' wck-media-failed' : ''}`}>
      {state === 'loading' ? labels.mediaPending : labels.mediaFailed}
    </p>
  );
}

export function ImageBody({ message, labels, resolveMediaUrl }: BodyProps) {
  const media = useMediaUrl(message, resolveMediaUrl);
  const [expanded, setExpanded] = useState(false);
  if (media.state !== 'ready') return <MediaNote state={media.state} labels={labels} />;
  return (
    <>
      <button
        type="button"
        className="wck-image-button"
        onClick={() => setExpanded(true)}
        aria-label={labels.previewImage}
      >
        <img
          className="wck-image"
          src={media.url}
          alt={message.text ?? labels.previewImage}
          loading="lazy"
        />
      </button>
      {expanded && (
        <div
          className="wck-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpanded(false)}
        >
          <img src={media.url} alt={message.text ?? labels.previewImage} />
        </div>
      )}
    </>
  );
}

export function StickerBody({ message, labels, resolveMediaUrl }: BodyProps) {
  const media = useMediaUrl(message, resolveMediaUrl);
  if (media.state !== 'ready') return <MediaNote state={media.state} labels={labels} />;
  return <img className="wck-sticker" src={media.url} alt={labels.previewSticker} loading="lazy" />;
}

export function VideoBody({ message, labels, resolveMediaUrl }: BodyProps) {
  const media = useMediaUrl(message, resolveMediaUrl);
  if (media.state !== 'ready') return <MediaNote state={media.state} labels={labels} />;
  return <video className="wck-video" src={media.url} controls preload="metadata" />;
}

export function DocumentBody({ message, labels, resolveMediaUrl }: BodyProps) {
  const media = useMediaUrl(message, resolveMediaUrl);
  const filename = message.media?.filename ?? labels.previewDocument;
  const size = message.media?.sizeBytes;
  const sizeLabel =
    typeof size === 'number' && size > 0
      ? size >= 1024 * 1024
        ? `${(size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(size / 1024))} KB`
      : null;
  if (media.state !== 'ready') {
    return (
      <div className="wck-document">
        <span className="wck-document-icon" aria-hidden>
          📄
        </span>
        <span className="wck-document-name">{filename}</span>
        <MediaNote state={media.state} labels={labels} />
      </div>
    );
  }
  return (
    <a
      className="wck-document"
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      download={filename}
    >
      <span className="wck-document-icon" aria-hidden>
        📄
      </span>
      <span className="wck-document-name">{filename}</span>
      {sizeLabel && <span className="wck-document-size">{sizeLabel}</span>}
      <span className="wck-document-download">⬇ {labels.download}</span>
    </a>
  );
}
