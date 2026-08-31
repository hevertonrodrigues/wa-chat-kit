import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { ChatMessage, SendDraft } from '../core/types';
import type { ChatLabels } from '../core/i18n';
import { previewLabelFor } from '../core/i18n';
import { useAudioRecorder } from './useAudioRecorder';

type PendingFile = { file: File; url: string };

function mediaTypeFor(file: File | Blob): 'image' | 'video' | 'audio' | 'document' {
  const mime = file.type;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

export function Composer({
  labels,
  disabled,
  disabledSlot,
  replyTo,
  onCancelReply,
  onSend,
}: {
  labels: ChatLabels;
  /** 24h window closed (or no conversation) — composer swaps to disabledSlot */
  disabled: boolean;
  /** Host-provided call-to-action for the closed window (e.g. template picker) */
  disabledSlot?: ReactNode;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (input: SendDraft) => void;
}) {
  const [text, setText] = useState('');
  const [pending, setPending] = useState<PendingFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingRef = useRef<PendingFile[]>([]);

  // Object URLs are revoked on removal AND unmount — reference projects leaked them.
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(
    () => () => {
      for (const item of pendingRef.current) URL.revokeObjectURL(item.url);
    },
    [],
  );

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const recorder = useAudioRecorder((blob, mime) => {
    onSend({
      kind: 'media',
      file: blob,
      mediaType: 'audio',
      voice: true,
      filename: `voice.${mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm'}`,
      replyTo: replyTo?.externalId ?? null,
    });
    onCancelReply();
  });

  const doSend = useCallback(() => {
    const trimmed = text.trim();
    const reply = replyTo?.externalId ?? null;
    if (pending.length > 0) {
      pending.forEach((item, index) => {
        onSend({
          kind: 'media',
          file: item.file,
          mediaType: mediaTypeFor(item.file),
          filename: item.file.name,
          // Caption goes on the FIRST file only — one message, one caption.
          caption: index === 0 && trimmed ? trimmed : null,
          replyTo: index === 0 ? reply : null,
        });
        URL.revokeObjectURL(item.url);
      });
      setPending([]);
      setText('');
      onCancelReply();
      return;
    }
    if (!trimmed) return;
    onSend({ kind: 'text', text: trimmed, replyTo: reply });
    setText('');
    onCancelReply();
    requestAnimationFrame(autoGrow);
  }, [autoGrow, onCancelReply, onSend, pending, replyTo, text]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      // IME guard: Enter mid-composition must not send (CJK/accent input).
      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        doSend();
      }
    },
    [doSend],
  );

  if (disabled) {
    return (
      <div className="wck-composer wck-composer-disabled">
        <div className="wck-session-closed">
          <p className="wck-session-closed-title">{labels.sessionClosed}</p>
          <p className="wck-session-closed-hint">{labels.sessionClosedHint}</p>
        </div>
        {disabledSlot}
      </div>
    );
  }

  if (recorder.state === 'recording') {
    const seconds = Math.floor(recorder.elapsedMs / 1000);
    return (
      <div className="wck-composer wck-recording">
        <button
          type="button"
          className="wck-icon-button"
          aria-label={labels.cancelRecording}
          onClick={recorder.cancel}
        >
          🗑
        </button>
        <span className="wck-rec-dot" aria-hidden />
        <span className="wck-rec-timer">
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </span>
        <button
          type="button"
          className="wck-send-button"
          aria-label={labels.stopRecording}
          onClick={recorder.stop}
        >
          ➤
        </button>
      </div>
    );
  }

  const showSend = text.trim().length > 0 || pending.length > 0;

  return (
    <div className="wck-composer-wrap">
      {replyTo && (
        <div className="wck-reply-banner">
          <div className="wck-reply-banner-body">
            <span className="wck-reply-banner-title">
              {labels.replyingTo}{' '}
              {replyTo.direction === 'out' ? labels.you : (replyTo.authorName ?? '')}
            </span>
            <span className="wck-reply-banner-text">
              {replyTo.text ?? previewLabelFor(labels, replyTo.type)}
            </span>
          </div>
          <button
            type="button"
            className="wck-icon-button"
            aria-label={labels.cancelReply}
            onClick={onCancelReply}
          >
            ✕
          </button>
        </div>
      )}
      {pending.length > 0 && (
        <div className="wck-attachments">
          {pending.map((item, index) => (
            <span key={item.url} className="wck-attachment">
              {item.file.type.startsWith('image/') ? (
                <img src={item.url} alt={item.file.name} />
              ) : (
                <span className="wck-attachment-icon">📄</span>
              )}
              <span className="wck-attachment-name">{item.file.name}</span>
              <button
                type="button"
                className="wck-attachment-remove"
                aria-label={`✕ ${item.file.name}`}
                onClick={() => {
                  URL.revokeObjectURL(item.url);
                  setPending((prev) => prev.filter((_, i) => i !== index));
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      {recorder.state === 'denied' && <p className="wck-mic-denied">{labels.micDenied}</p>}
      <div className="wck-composer">
        <button
          type="button"
          className="wck-icon-button"
          aria-label={labels.attach}
          title={labels.attach}
          onClick={() => fileInputRef.current?.click()}
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []).slice(0, 5);
            setPending((prev) => [
              ...prev,
              ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
            ]);
            event.target.value = '';
          }}
        />
        <textarea
          ref={textareaRef}
          className="wck-input"
          rows={1}
          placeholder={labels.composerPlaceholder}
          enterKeyHint="send"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            autoGrow();
          }}
          onKeyDown={onKeyDown}
        />
        {showSend ? (
          <button
            type="button"
            className="wck-send-button"
            aria-label={labels.send}
            title={labels.send}
            onClick={doSend}
          >
            ➤
          </button>
        ) : (
          <button
            type="button"
            className="wck-send-button wck-mic-button"
            aria-label={labels.recordAudio}
            title={labels.recordAudio}
            onClick={() => void recorder.start()}
          >
            🎙
          </button>
        )}
      </div>
    </div>
  );
}
