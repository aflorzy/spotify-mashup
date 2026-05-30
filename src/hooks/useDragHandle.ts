import { useCallback, useEffect, useRef } from 'react';

interface DragHandleOptions {
  onDrag: (x: number, containerWidth: number) => void;
  onDragEnd?: () => void;
}

export function useDragHandle({ onDrag, onDragEnd }: DragHandleOptions) {
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getX = (e: MouseEvent | TouchEvent, container: HTMLElement): number => {
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(clientX - rect.left, rect.width));
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging.current || !containerRef.current) return;
      e.preventDefault();
      const x = getX(e, containerRef.current);
      onDrag(x, containerRef.current.offsetWidth);
    },
    [onDrag],
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
    onDragEnd?.();
  }, [onDragEnd]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startDrag = useCallback((container: HTMLDivElement) => {
    dragging.current = true;
    containerRef.current = container;
  }, []);

  return { startDrag };
}
