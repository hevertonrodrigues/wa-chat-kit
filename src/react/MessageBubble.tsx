import { useState } from 'react';
import type { ChatMessage } from '../core/types';
import type { ChatLabels } from '../core/i18n';
import { previewLabelFor } from '../core/i18n';
import { formatClock } from '../core/time';
import { StatusTicks } from './StatusTicks';
import {
  TextBody,
  LocationBody,
  ContactsBody,
  TemplateBody,
  InteractiveBody,
  UnsupportedBody,
} from './bodies/OtherBodies';
import { ImageBody, VideoBody, StickerBody, DocumentBody } from './bodies/MediaBodies';
import { AudioBody } from './bodies/AudioBody';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏'];

export type BubbleProps = {
  message: ChatMessage;
  first: boolean;
  last: boolean;
  labels: ChatLabels;
  locale: string;
  quotedLookup: (externalId: string) => ChatMessage | null;
  onQuoteClick: (externalId: string) => void;
  onReply?: (message: ChatMessage) => void;
  onReact?: (message: ChatMessage, emoji: string) => void;
  onRetry?: (message: ChatMessage) => void;
  resolveMediaUrl: (message: ChatMessage) => Promise<string | null>;
};

function ReplyQuote({
  message,
  labels,
  quotedLookup,
  onQuoteClick,
}: Pick<BubbleProps, 'message' | 'labels' | 'quotedLookup' | 'onQuoteClick'>) {
  if (!message.replyTo) return null;
  const quoted = quotedLookup(message.replyTo);
  const author = quoted
    ? quoted.direction === 'out'
      ? labels.you
      : (quoted.authorName ?? '')
    : '';
  const excerpt = quoted ? (quoted.text ?? previewLabelFor(labels, quoted.type)) : '…';
  return (
    <button
      type="button"
      className="wck-quote"
      onClick={() => message.replyTo && onQuoteClick(message.replyTo)}
    >
      {author && <span className="wck-quote-author">{author}</span>}
      <span className="wck-quote-text">{excerpt}</span>
    </button>
  );
}

function Body(props: {
  message: ChatMessage;
  labels: ChatLabels;
  resolveMediaUrl: BubbleProps['resolveMediaUrl'];
}) {
  const { message, labels, resolveMediaUrl } = props;
  switch (message.type) {
    case 'image':
      return <ImageBody message={message} labels={labels} resolveMediaUrl={resolveMediaUrl} />;
    case 'sticker':
      return <StickerBody message={message} labels={labels} resolveMediaUrl={resolveMediaUrl} />;
    case 'video':
      return <VideoBody message={message} labels={labels} resolveMediaUrl={resolveMediaUrl} />;
    case 'audio':
      return <AudioBody message={message} labels={labels} resolveMediaUrl={resolveMediaUrl} />;
    case 'document':
      return <DocumentBody message={message} labels={labels} resolveMediaUrl={resolveMediaUrl} />;
    case 'location':
      return <LocationBody message={message} labels={labels} />;
    case 'contacts':
      return <ContactsBody message={message} labels={labels} />;
    case 'template':
      return <TemplateBody message={message} labels={labels} />;
    case 'interactive':
      return <InteractiveBody message={message} labels={labels} />;
    case 'unsupported':
    case 'unknown':
      return <UnsupportedBody labels={labels} />;
    default:
      // text, button (tapped quick-reply), order, request_welcome → text projection
      return <TextBody message={message} />;
  }
}

export function MessageBubble(props: BubbleProps) {
  const { message, first, last, labels, locale, onReply, onReact, onRetry } = props;
  const [pickerOpen, setPickerOpen] = useState(false);
  const outbound = message.direction === 'out';

  if (message.type === 'system') {
    return (
      <div className="wck-system-row">
        <span className="wck-system">{message.text}</span>
      </div>
    );
  }

  const hasCaptionText =
    message.text &&
    (message.type === 'image' || message.type === 'video' || message.type === 'document');
  const bare = message.type === 'sticker';
  // WhatsApp look: visual media sits edge-to-edge in a thin frame; without a
  // caption the time/ticks overlay the media on a soft gradient.
  const visualMedia = message.type === 'image' || message.type === 'video';
  const mediaBare = visualMedia && !message.text;

  return (
    <div
      id={`wck-msg-${message.id}`}
      className={[
        'wck-msg',
        outbound ? 'wck-out' : 'wck-in',
        first ? 'wck-first' : '',
        last ? 'wck-last' : '',
        bare ? 'wck-bare' : '',
        visualMedia ? 'wck-has-media' : '',
        mediaBare ? 'wck-media-bare' : '',
        message.status === 'failed' ? 'wck-failed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="wck-bubble">
        {!outbound && first && message.authorName && (
          <span className="wck-author">{message.authorName}</span>
        )}
        <ReplyQuote
          message={message}
          labels={labels}
          quotedLookup={props.quotedLookup}
          onQuoteClick={props.onQuoteClick}
        />
        <Body message={message} labels={labels} resolveMediaUrl={props.resolveMediaUrl} />
        {hasCaptionText && <TextBody message={{ ...message, type: 'text' }} />}
        <span className="wck-meta">
          <time dateTime={message.timestamp}>{formatClock(message.timestamp, locale)}</time>
          {outbound && <StatusTicks status={message.status} labels={labels} />}
          {outbound && message.status === 'failed' && onRetry && (
            <button
              type="button"
              className="wck-retry"
              onClick={() => onRetry(message)}
              aria-label={labels.retry}
            >
              ↻ {labels.retry}
            </button>
          )}
        </span>
        {message.status === 'failed' && message.errorMessage && (
          <p className="wck-error">{message.errorMessage}</p>
        )}
        {message.reactions && message.reactions.length > 0 && (
          <div className="wck-reactions" aria-label={labels.react}>
            {message.reactions.map((reaction, index) => (
              <span key={`${reaction.from}-${index}`} className="wck-reaction">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
      {(onReply || onReact) && (
        <div className="wck-actions">
          {onReply && (
            <button
              type="button"
              className="wck-action"
              aria-label={labels.reply}
              title={labels.reply}
              onClick={() => onReply(message)}
            >
              ↩
            </button>
          )}
          {onReact && message.externalId && (
            <span className="wck-react-wrap">
              <button
                type="button"
                className="wck-action"
                aria-label={labels.react}
                title={labels.react}
                onClick={() => setPickerOpen((v) => !v)}
              >
                🙂
              </button>
              {pickerOpen && (
                <span className="wck-react-picker" role="menu">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      role="menuitem"
                      className="wck-react-option"
                      onClick={() => {
                        setPickerOpen(false);
                        onReact(message, emoji);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
