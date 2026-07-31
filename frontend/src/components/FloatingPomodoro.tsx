import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';

export const FloatingPomodoro: React.FC = () => {
  const {
    pomodoroSeconds,
    isPomodoroRunning,
    togglePomodoroTimer,
    resetPomodoroTimer,
    tickPomodoro,
  } = useStore();

  const [position, setPosition] = useState({ x: 300, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Centralized tick loop
  useEffect(() => {
    let interval: any = null;
    if (isPomodoroRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => { tickPomodoro(); }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroSeconds, tickPomodoro]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX + position.x, y: e.clientY + position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      let newX = Math.max(10, Math.min(dragStart.current.x - e.clientX, window.innerWidth - 270));
      let newY = Math.max(10, Math.min(dragStart.current.y - e.clientY, window.innerHeight - 80));
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `${position.y}px`,
        right: `${position.x}px`,
        zIndex: 999999,
        width: '260px',
        backgroundColor: '#131412',
        border: '1px solid #2a2a2a',
        borderRadius: '4px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Icon */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '4px',
          backgroundColor: '#2a2a2a',
          border: '1px solid #333333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '15px',
            color: '#8ea091',
            fontVariationSettings: isPomodoroRunning ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          timer
        </span>
      </div>

      {/* Timer Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#e4e2e0', fontFamily: 'monospace', margin: 0, lineHeight: 1.1 }}>
          {formatTimer(pomodoroSeconds)}
        </p>
        <p style={{ fontSize: '10px', color: '#6b6b6b', margin: '2px 0 0 0' }}>
          {isPomodoroRunning ? 'Focus Session Active' : 'Focus Timer'}
        </p>
      </div>

      {/* Controls */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => togglePomodoroTimer()}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#8ea091',
            border: 'none',
            color: '#121212',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title={isPomodoroRunning ? 'Pause' : 'Start Focus'}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '14px', color: '#121212', fontVariationSettings: "'FILL' 1" }}
          >
            {isPomodoroRunning ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button
          onClick={() => resetPomodoroTimer()}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#2a2a2a',
            border: '1px solid #333333',
            color: '#a0a0a0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title="Reset Timer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>restart_alt</span>
        </button>
      </div>

      {/* Drag handle indicator */}
      <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#6b6b6b', flexShrink: 0, opacity: 0.6 }}>
        drag_indicator
      </span>
    </div>
  );
};

export default FloatingPomodoro;
