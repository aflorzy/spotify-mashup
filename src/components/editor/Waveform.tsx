import { useCallback, useEffect, useRef } from 'react';
import { useDragHandle } from '../../hooks/useDragHandle';
import TrimHandle from './TrimHandle';
import { msToDisplay } from '../../utils/time';

interface WaveformProps {
  waveform: number[]; // 0-1 normalized amplitude, ~200 points
  durationMs: number; // total track duration
  startMs: number; // trim start
  endMs: number; // trim end
  onStartChange: (ms: number) => void;
  onEndChange: (ms: number) => void;
}

const CANVAS_HEIGHT = 64;

export default function Waveform({
  waveform,
  durationMs,
  startMs,
  endMs,
  onStartChange,
  onEndChange,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Which handle is being dragged: 'start' | 'end' | null
  const activeHandle = useRef<'start' | 'end' | null>(null);

  const { startDrag: startDragStart } = useDragHandle({
    onDrag: useCallback(
      (x: number, containerWidth: number) => {
        if (activeHandle.current !== 'start') return;
        const newMs = Math.max(0, Math.min((x / containerWidth) * durationMs, endMs - 1000));
        onStartChange(newMs);
      },
      [durationMs, endMs, onStartChange],
    ),
    onDragEnd: useCallback(() => {
      activeHandle.current = null;
    }, []),
  });

  const { startDrag: startDragEnd } = useDragHandle({
    onDrag: useCallback(
      (x: number, containerWidth: number) => {
        if (activeHandle.current !== 'end') return;
        const newMs = Math.max(startMs + 1000, Math.min((x / containerWidth) * durationMs, durationMs));
        onEndChange(newMs);
      },
      [durationMs, startMs, onEndChange],
    ),
    onDragEnd: useCallback(() => {
      activeHandle.current = null;
    }, []),
  });

  // Draw waveform canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.offsetWidth;
    const height = CANVAS_HEIGHT;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bars = waveform.length > 0 ? waveform : Array(200).fill(0.1);
    const barWidth = (width / bars.length) * 0.8;
    const barGap = (width / bars.length) * 0.2;
    const startFrac = durationMs > 0 ? startMs / durationMs : 0;
    const endFrac = durationMs > 0 ? endMs / durationMs : 1;

    bars.forEach((amp, i) => {
      const frac = i / bars.length;
      const x = i * (barWidth + barGap);
      const barH = Math.max(2, amp * height);
      const y = (height - barH) / 2;

      if (frac >= startFrac && frac < endFrac) {
        ctx.fillStyle = '#22c55e'; // green-500
      } else {
        ctx.fillStyle = '#1f2937'; // gray-800
      }

      ctx.fillRect(x, y, barWidth, barH);
    });
  }, [waveform, durationMs, startMs, endMs]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // ResizeObserver for responsive redraw
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => drawCanvas());
    observer.observe(container);
    return () => observer.disconnect();
  }, [drawCanvas]);

  // Handle pointer events for start handle
  const onStartMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      activeHandle.current = 'start';
      startDragStart(containerRef.current);
    },
    [startDragStart],
  );

  const onStartTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!containerRef.current) return;
      activeHandle.current = 'start';
      startDragStart(containerRef.current);
    },
    [startDragStart],
  );

  const onStartKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const nudge = e.shiftKey ? 1000 : 100;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onStartChange(Math.max(0, startMs - nudge));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onStartChange(Math.min(startMs + nudge, endMs - 1000));
      }
    },
    [startMs, endMs, onStartChange],
  );

  // Handle pointer events for end handle
  const onEndMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      activeHandle.current = 'end';
      startDragEnd(containerRef.current);
    },
    [startDragEnd],
  );

  const onEndTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!containerRef.current) return;
      activeHandle.current = 'end';
      startDragEnd(containerRef.current);
    },
    [startDragEnd],
  );

  const onEndKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const nudge = e.shiftKey ? 1000 : 100;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onEndChange(Math.max(startMs + 1000, endMs - nudge));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onEndChange(Math.min(endMs + nudge, durationMs));
      }
    },
    [startMs, endMs, durationMs, onEndChange],
  );

  const startPos = durationMs > 0 ? startMs / durationMs : 0;
  const endPos = durationMs > 0 ? endMs / durationMs : 1;

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ height: CANVAS_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full rounded"
          style={{ height: CANVAS_HEIGHT }}
        />
        <TrimHandle
          position={startPos}
          color="green"
          label={msToDisplay(startMs)}
          onMouseDown={onStartMouseDown}
          onTouchStart={onStartTouchStart}
          onKeyDown={onStartKeyDown}
        />
        <TrimHandle
          position={endPos}
          color="red"
          label={msToDisplay(endMs)}
          onMouseDown={onEndMouseDown}
          onTouchStart={onEndTouchStart}
          onKeyDown={onEndKeyDown}
        />
      </div>
      <div className="relative" style={{ height: 16 }}>
        <span
          className="absolute text-xs text-gray-400 font-mono"
          style={{ left: `${startPos * 100}%`, transform: 'translateX(-50%)' }}
        >
          {msToDisplay(startMs)}
        </span>
        <span
          className="absolute text-xs text-gray-400 font-mono"
          style={{ left: `${endPos * 100}%`, transform: 'translateX(-50%)' }}
        >
          {msToDisplay(endMs)}
        </span>
      </div>
    </div>
  );
}
