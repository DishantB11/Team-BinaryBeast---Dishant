import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { updateProgress } from '../../api/client';
import { Check, Play, Pause, RotateCcw, Award, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Confetti from 'react-confetti';

export const FocusHubView: React.FC = () => {
  const { 
    tasks, 
    toggleTaskComplete, 
    addTask,
    pomodoroSeconds,
    isPomodoroRunning,
    activePomodoroTaskId,
    togglePomodoroTimer,
    resetPomodoroTimer,
    setPomodoroSeconds,
    setActivePomodoroTaskId
  } = useStore();

  // Date Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // New Task Inputs
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [newDuration, setNewDuration] = useState('1');

  const [showConfetti, setShowConfetti] = useState(false);

  // Format date helper: YYYY-MM-DD
  const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const selectedDateStr = formatDateStr(currentDate);

  // Filter tasks for the selected date
  const filteredTasks = tasks.filter(t => t.dueDate === selectedDateStr);

  // Navigate dates
  const handlePrevDay = () => {
    setCurrentDate(prev => {
      const nextDate = new Date(prev);
      nextDate.setDate(nextDate.getDate() - 1);
      return nextDate;
    });
  };

  const handleNextDay = () => {
    setCurrentDate(prev => {
      const nextDate = new Date(prev);
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    });
  };

  // Add a task to the active date
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      subject: newSubject.trim() || 'General',
      title: newTitle.trim(),
      type: 'Self-Study' as const,
      dueDate: selectedDateStr,
      duration: parseFloat(newDuration) || 1,
      priority: 2 as const,
      isCompleted: false,
      estimatedHours: parseFloat(newDuration) || 1,
    };

    addTask(newTask);
    setNewTitle('');
  };

  // Handle completion confetti & notifications on timer completion
  useEffect(() => {
    if (pomodoroSeconds === 0) {
      triggerDesktopNotification();
      if (activePomodoroTaskId) {
        updateProgress(activePomodoroTaskId, true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [pomodoroSeconds, activePomodoroTaskId]);

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
    setActivePomodoroTaskId(taskId);
    setPomodoroSeconds(25 * 60); // Reset timer for the newly focused task
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find currently focused task details
  const currentFocusedTask = tasks.find(t => t.id === activePomodoroTaskId);

  return (
    <div className="space-y-6 relative">
      {showConfetti && <Confetti width={window.innerWidth - 300} height={window.innerHeight} recycle={false} />}
      
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Focus Hub</h1>
        <p className="text-sm text-[#a0a0a0]">Sync focus states, track today's assignments, and complete study targets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Today's Tasks */}
        <div className="lg:col-span-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex flex-col justify-between min-h-[480px]">
          <div>
            {/* Header with Date Navigation */}
            <div className="flex items-center justify-between border-b border-[#3d3d3d] pb-3 mb-4">
              <h2 className="text-sm font-semibold text-white tracking-tight uppercase">📋 Scheduled Agenda</h2>
              <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#3d3d3d] rounded-md px-2 py-1">
                <button 
                  onClick={handlePrevDay} 
                  className="p-1 hover:bg-[#3d3d3d] rounded text-[#a0a0a0] hover:text-white transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-[#e2e8f0] min-w-[90px] text-center">
                  {selectedDateStr}
                </span>
                <button 
                  onClick={handleNextDay} 
                  className="p-1 hover:bg-[#3d3d3d] rounded text-[#a0a0a0] hover:text-white transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {filteredTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#3d3d3d] rounded-lg min-h-[220px]">
                <Award className="w-10 h-10 text-[#6b6b6b] mb-2" />
                <p className="text-sm text-[#a0a0a0]">No tasks scheduled for this date.</p>
                <p className="text-xs text-[#6b6b6b] mt-1">Use the quick add tool below to populate tasks.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredTasks.map((task) => {
                  const isActive = activePomodoroTaskId === task.id;
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
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
                          Focus
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddTask} className="mt-6 pt-4 border-t border-[#3d3d3d] flex gap-2 flex-wrap items-center">
            <input
              type="text"
              placeholder="Task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 min-w-[150px] bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-1.5 text-xs text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#fbbf24]"
              required
            />
            <input
              type="text"
              placeholder="Subject..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-24 bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-1.5 text-xs text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#fbbf24]"
            />
            <input
              type="number"
              step="0.5"
              placeholder="Hours"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-16 bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-1.5 text-xs text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#fbbf24]"
            />
            <button
              type="submit"
              className="bg-[#fbbf24] text-black hover:opacity-90 transition-all font-semibold rounded p-1.5 text-xs flex items-center justify-center gap-1"
              title="Add Task to Date"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </form>
        </div>

        {/* Right 1/3: Pomodoro Focus Timer (Synced with Store) */}
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
                {formatTime(pomodoroSeconds)}
              </span>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex gap-3">
              <button
                onClick={() => togglePomodoroTimer()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold text-sm transition-all bg-[#fbbf24] text-black hover:opacity-90"
              >
                {isPomodoroRunning ? (
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
                onClick={() => resetPomodoroTimer()}
                className="px-3.5 py-2.5 rounded-md border border-[#3d3d3d] bg-[#1e1e1e] text-white hover:border-[#fbbf24] transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-[#6b6b6b] text-center leading-relaxed">
              Synced live with your floating widget across all pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusHubView;
