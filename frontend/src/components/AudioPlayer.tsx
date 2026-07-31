import React, { useState, useRef, useEffect } from 'react';

const tracks = [
  { title: 'Brown noise',  src: '/cosmic-scapes-soft-brown-noise-compressed.mp3' },
  { title: 'Lofi Beats',   src: '/mondamusic-lofi-lofi-girl-542555.mp3' },
];

export const AudioPlayer: React.FC = () => {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const currentTrack = tracks[trackIndex];

  useEffect(() => {
    audioRef.current = new Audio(currentTrack.src);
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = isPlaying;
    audioRef.current.pause();
    audioRef.current.src = currentTrack.src;
    audioRef.current.loop = true;
    if (wasPlaying) audioRef.current.play().catch(() => {});
  }, [trackIndex]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackIndex((prev) => (prev + 1) % tracks.length);
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
      {/* Music icon */}
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
          style={{ fontSize: '15px', color: '#8ea091', fontVariationSettings: isPlaying ? "'FILL' 1" : "'FILL' 0" }}
        >
          music_note
        </span>
      </div>

      {/* Track info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#e4e2e0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentTrack.title}
        </p>
        <p style={{ fontSize: '10px', color: '#6b6b6b', margin: '1px 0 0 0' }}>Ambient Player</p>
      </div>

      {/* Controls */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={togglePlay}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: isPlaying ? '#8ea091' : '#2a2a2a',
            border: isPlaying ? 'none' : '1px solid #333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '14px', color: isPlaying ? '#121212' : '#e4e2e0', fontVariationSettings: "'FILL' 1" }}
          >
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button
          onClick={handleSkip}
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
          title="Next Track"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>skip_next</span>
        </button>
      </div>

      {/* Drag handle */}
      <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#6b6b6b', flexShrink: 0, opacity: 0.6 }}>
        drag_indicator
      </span>
    </div>
  );
};

export default AudioPlayer;
