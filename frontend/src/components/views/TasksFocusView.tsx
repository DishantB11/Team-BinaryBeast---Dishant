import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { updateProgress } from '../../api/client';
import { Check, Play, Pause, RotateCcw, Award } from 'lucide-react';
import Confetti from 'react-confetti';

export const TasksFocusView: React.FC = () => {
  const { tasks, toggleTaskComplete, subjects, updateSubjectProgress } = useStore();
  const [activeTask, setActiveTask] = useState<string | null>(null);

  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Filter tasks due today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);

  // Pomodoro tick
  useEffect(() => {
    let timer: any;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      triggerDesktopNotification();
      
      // Trigger confetti and update stats if an active task was completed
      if (activeTask) {
        toggleTaskComplete(activeTask);
        updateProgress(activeTask, true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, activeTask]);

  // Request browser Notification API permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const triggerDesktopNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('📚 Session Completed!', {
        body: 'Well done! Time for a short break.',
        icon: '/favicon.ico',
      });
    }
  };

  const handleSelectTask = (taskId: string) => {
    setActiveTask(taskId);
    setTimeLeft(25 * 60); // Reset timer for the newly focused task
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(25 * 60);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find currently focused task details
  const currentFocusedTask = tasks.find(t => t.id === activeTask);

  return (
    <div className="space-y-6 relative">
      {showConfetti && <Confetti width={window.innerWidth - 300} height={window.innerHeight} recycle={false} />}
      
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Planner & Focus Hub</h1>
        <p className="text-sm text-[#a0a0a0]">Sync focus states, track todays assignments, and complete study targets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Today's Tasks */}
        <div className="lg:col-span-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-white tracking-tight uppercase mb-4">📅 Scheduled Today</h2>
          
          {todayTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#3d3d3d] rounded-lg">
              <Award className="w-10 h-10 text-[#6b6b6b] mb-2" />
              <p className="text-sm text-[#a0a0a0]">No sessions scheduled for today.</p>
              <p className="text-xs text-[#6b6b6b] mt-1">Use the calendar tab to schedule tasks or trigger AI planning.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {todayTasks.map((task) => {
                const isActive = activeTask === task.id;
                return (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                      isActive 
                        ? 'border-[#fbbf24] bg-[#fbbf24]/5' 
                        : 'border-[#3d3d3d] bg-[#1e1e1e]/40 hover:bg-[#1e1e1e]/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          toggleTaskComplete(task.id);
                          await updateProgress(task.id, !task.isCompleted);
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          task.isCompleted 
                            ? 'bg-[#fbbf24] border-[#fbbf24] text-black' 
                            : 'border-[#6b6b6b] hover:border-[#fbbf24]'
                        }`}
                      >
                        {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div>
                        <span className={`text-sm font-medium block text-white ${task.isCompleted ? 'line-through text-[#6b6b6b]' : ''}`}>
                          {task.title}
                        </span>
                        <div className="flex gap-2 items-center text-[11px] text-[#6b6b6b] mt-0.5">
                          <span className="text-[#a0a0a0] font-semibold">{task.subject}</span>
                          <span>•</span>
                          <span>{task.duration}h duration</span>
                        </div>
                      </div>
                    </div>

                    {!task.isCompleted && (
                      <button
                        onClick={() => handleSelectTask(task.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                          isActive 
                            ? 'bg-[#fbbf24] text-black' 
                            : 'bg-[#2d2d2d] border border-[#3d3d3d] text-white hover:border-[#fbbf24]'
                        }`}
                      >
                        Focus Focus
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1/3: Pomodoro Focus Timer */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white tracking-tight uppercase text-center border-b border-[#3d3d3d] pb-3">
              ⏱️ Focus Timer
            </h2>

            {currentFocusedTask && (
              <div className="bg-[#1e1e1e] border border-[#3d3d3d] p-3 rounded-lg text-center">
                <span className="text-[10px] text-[#fbbf24] tracking-widest font-bold uppercase block">Active Target</span>
                <span className="text-xs text-white font-medium truncate block mt-0.5">{currentFocusedTask.title}</span>
              </div>
            )}

            {/* Giant Timer Display */}
            <div className="text-center py-6">
              <span className="text-5xl font-bold font-mono tracking-wider text-white">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex gap-3">
              <button
                onClick={toggleTimer}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold text-sm transition-all bg-[#fbbf24] text-black hover:opacity-90"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black" />
                    <span>Start</span>
                  </>
                )}
              </button>
              <button
                onClick={resetTimer}
                className="px-3.5 py-2.5 rounded-md border border-[#3d3d3d] bg-[#1e1e1e] text-white hover:border-[#fbbf24] transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-[#6b6b6b] text-center leading-relaxed">
              Completing this session automatically marks your selected target as complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
