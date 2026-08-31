import { useCallback, useEffect, useRef, useState } from 'react';

// Meta voice notes want audio/ogg;codecs=opus. Firefox records it natively;
// Chrome only does webm/opus — that still sends fine as a regular audio
// message, so we negotiate the best supported mime instead of shipping a wasm
// encoder. Hosts that need true voice notes everywhere can transcode
// server-side (or pass their own recorded Blob to send()).
const PREFERRED_MIMES = [
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
];

export function pickRecordingMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return PREFERRED_MIMES.find((mime) => MediaRecorder.isTypeSupported(mime));
}

export type AudioRecorderState = 'idle' | 'recording' | 'denied';

export function useAudioRecorder(onFinish: (blob: Blob, mime: string) => void) {
  const [state, setState] = useState<AudioRecorderState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState('denied');
      return;
    }
    const mime = pickRecordingMime();
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    discardRef.current = false;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      // stop() fires a final dataavailable BEFORE onstop — chunks are complete here.
      stream.getTracks().forEach((track) => track.stop());
      cleanupTimer();
      setState('idle');
      setElapsedMs(0);
      recorderRef.current = null;
      if (!discardRef.current && chunksRef.current.length > 0) {
        const type = recorder.mimeType || mime || 'audio/webm';
        onFinishRef.current(new Blob(chunksRef.current, { type }), type);
      }
      chunksRef.current = [];
    };
    recorderRef.current = recorder;
    recorder.start(250);
    setState('recording');
    const startedAt = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
  }, [cleanupTimer]);

  const stop = useCallback(() => {
    discardRef.current = false;
    recorderRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    discardRef.current = true;
    recorderRef.current?.stop();
  }, []);

  useEffect(
    () => () => {
      discardRef.current = true;
      recorderRef.current?.stop();
      cleanupTimer();
    },
    [cleanupTimer],
  );

  return { state, elapsedMs, start, stop, cancel };
}
