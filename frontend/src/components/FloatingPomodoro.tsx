import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Move } from 'lucide-react';
import { useStore } from '../store/useStore';

export const FloatingPomodoro: React.FC = () => {
  const { 
    pomodoroSeconds, 
    isPomodoroRunning, 
    togglePomodoroTimer, 
    resetPomodoroTimer, 
    tickPomodoro 
  } = useStore();

  // Position coordinates state (offset from bottom right)
  const [position, setPosition] = useState({ x: 300, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Centralized Pomodoro Tick Timer Loop
  useEffect(() => {
    let interval: any = null;
    if (isPomodoroRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        tickPomodoro();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroSeconds, tickPomodoro]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX + position.x,
      y: e.clientY + position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      let newX = dragStart.current.x - e.clientX;
      let newY = dragStart.current.y - e.clientY;

      newX = Math.max(10, Math.min(newX, window.innerWidth - 270));
      newY = Math.max(10, Math.min(newY, window.innerHeight - 80));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

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
        backgroundColor: '#2d2d2d',
        border: '1px solid #3d3d3d',
        borderRadius: '12px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
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
          borderRadius: '6px',
          backgroundColor: '#3d3d3d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Timer
          size={15}
          color="#fbbf24"
          style={isPomodoroRunning ? { animation: 'pulse 1.5s infinite' } : {}}
        />
      </div>

      {/* Timer Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'monospace',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {formatTimer(pomodoroSeconds)}
        </p>
        <p
          style={{
            fontSize: '10px',
            color: '#6b6b6b',
            margin: '2px 0 0 0',
          }}
        >
          {isPomodoroRunning ? 'Focus Session Active' : 'Focus Timer'}
        </p>
      </div>

      {/* Controls */}
      <div
        style={{ display: 'flex', items: 'center', gap: '6px', flexShrink: 0 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => togglePomodoroTimer()}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#fbbf24',
            border: 'none',
            color: '#1e1e1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title={isPomodoroRunning ? 'Pause' : 'Start Focus'}
        >
          {isPomodoroRunning ? (
            <Pause size={13} color="#1e1e1e" fill="#1e1e1e" />
          ) : (
            <Play size={13} color="#1e1e1e" fill="#1e1e1e" style={{ marginLeft: '1px' }} />
          )}
        </button>
        <button
          onClick={() => resetPomodoroTimer()}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#3d3d3d',
            border: '1px solid #4d4d4d',
            color: '#a0a0a0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title="Reset Timer"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      <Move size={12} color="#6b6b6b" style={{ flexShrink: 0, opacity: 0.6 }} />
    </div>
  );
};

export default FloatingPomodoro;
