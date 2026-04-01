import React, { useRef, useCallback } from 'react';

interface Props {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

const TOTAL = 50;

const SalaryRangeSlider: React.FC<Props> = ({ min, max, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const getVal = useCallback((clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(pct * TOTAL);
  }, []);

  const startDrag = (thumb: 'min' | 'max') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const move = (ev: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const v = getVal(clientX);
      if (thumb === 'min') onChange(Math.min(v, max - 1), max);
      else onChange(min, Math.max(v, min + 1));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
  };

  const minPct = (min / TOTAL) * 100;
  const maxPct = (max / TOTAL) * 100;

  return (
    <div ref={trackRef} className="relative h-5 flex items-center cursor-pointer select-none">
      {/* Base track */}
      <div className="absolute inset-x-0 h-1.5 bg-gray-200 rounded-full" />
      {/* Active fill */}
      <div
        className="absolute h-1.5 bg-blue-500 rounded-full"
        style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
      />
      {/* Min thumb */}
      <div
        className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-grab active:cursor-grabbing"
        style={{ left: `calc(${minPct}% - 8px)`, zIndex: min >= max - 1 ? 4 : 3 }}
        onMouseDown={startDrag('min')}
        onTouchStart={startDrag('min')}
      />
      {/* Max thumb */}
      <div
        className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-grab active:cursor-grabbing"
        style={{ left: `calc(${maxPct}% - 8px)`, zIndex: 3 }}
        onMouseDown={startDrag('max')}
        onTouchStart={startDrag('max')}
      />
    </div>
  );
};

export default SalaryRangeSlider;
