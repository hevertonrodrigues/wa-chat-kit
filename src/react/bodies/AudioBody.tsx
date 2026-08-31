import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../core/types';
import type { ChatLabels } from '../../core/i18n';
import { useMediaUrl } from './useMediaUrl';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Custom audio player: play/pause, click-and-keyboard seek, and — the
 * pragmatic part — a decode error flips to a download link so the user always
 * gets the audio (browsers disagree about ogg/opus/amr).
 */
export function AudioBody({
  message,
  labels,
  resolveMediaUrl,
}: {
  message: ChatMessage;
  labels: ChatLabels;
  resolveMediaUrl: (message: ChatMessage) => Promise<string | null>;
}) {
  const media = useMediaUrl(message, resolveMediaUrl);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [broken, setBroken] = useState(false);

  useEffect(() => () => audioRef.current?.pause(), []);

  if (media.state === 'loading') {
    return <p className="wck-media-note">{labels.mediaPending}</p>;
  }
  if (media.state === 'unavailable') {
    return <p className="wck-media-note wck-media-failed">{labels.mediaFailed}</p>;
  }
  if (broken) {
    return (
      <a className="wck-audio-fallback" href={media.url} download>
        ⬇ {labels.download} · {labels.previewAudio}
      </a>
    );
  }

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const seekTo = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * duration;
  };

  return (
    <div className={`wck-audio${message.media?.voice ? ' wck-audio-voice' : ''}`}>
      <audio
        ref={audioRef}
        src={media.url}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => setBroken(true)}
      />
      <button
        type="button"
        className="wck-audio-toggle"
        aria-label={playing ? labels.stopRecording : labels.previewAudio}
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (playing) audio.pause();
          else void audio.play().catch(() => setBroken(true));
        }}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <div
        className="wck-audio-track"
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seekTo((e.clientX - rect.left) / rect.width);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seekTo(progress + 0.05);
          if (e.key === 'ArrowLeft') seekTo(progress - 0.05);
        }}
      >
        <div className="wck-audio-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      {/* WhatsApp-accurate: elapsed while playing, total when idle */}
      <span className="wck-audio-time">
        {formatDuration(playing ? currentTime : duration || currentTime)}
      </span>
    </div>
  );
}
