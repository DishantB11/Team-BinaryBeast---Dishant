import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, Music, Move } from 'lucide-react';

const tracks = [
  {
    title: 'Brown noise',
    src: '/cosmic-scapes-soft-brown-noise-compressed.mp3',
  },
  {
    title: 'Lofi Beats',
    src: '/mondamusic-lofi-lofi-girl-542555.mp3',
  },
];

export const AudioPlayer: React.FC = () => {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Position coordinates state (offset from bottom right)
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const currentTrack = tracks[trackIndex];

  useEffect(() => {
    audioRef.current = new Audio(currentTrack.src);
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = isPlaying;
    audioRef.current.pause();
    audioRef.current.src = currentTrack.src;
    audioRef.current.loop = true;

    if (wasPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [trackIndex]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackIndex((prev) => (prev + 1) % tracks.length);
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

      // Keep within bounds
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
      {/* Drag Indicator / Icon */}
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
        <Music
          size={15}
          color="#fbbf24"
          style={isPlaying ? { animation: 'pulse 1.5s infinite' } : {}}
        />
      </div>

      {/* Track Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', items: 'center', gap: '4px' }}>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.title}
          </p>
        </div>
        <p
          style={{
            fontSize: '10px',
            color: '#6b6b6b',
            margin: '1px 0 0 0',
          }}
        >
          Ambient Player
        </p>
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
            backgroundColor: '#3d3d3d',
            border: '1px solid #4d4d4d',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={13} color="#fbbf24" fill="#fbbf24" />
          ) : (
            <Play size={13} color="#ffffff" fill="#ffffff" />
          )}
        </button>
        <button
          onClick={handleSkip}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#2d2d2d',
            border: '1px solid #3d3d3d',
            color: '#a0a0a0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title="Next Track"
        >
          <SkipForward size={13} />
        </button>
      </div>

      <Move size={12} color="#6b6b6b" style={{ flexShrink: 0, opacity: 0.6 }} />
    </div>
  );
};

export default AudioPlayer;
