import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { updateProgress } from '../../api/client';
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
    setActivePomodoroTaskId,
  } = useStore();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [newDuration, setNewDuration] = useState('1');
  const [showConfetti, setShowConfetti] = useState(false);

  const formatDateStr = (date: Date) => date.toISOString().split('T')[0];
  const selectedDateStr = formatDateStr(currentDate);
  const filteredTasks = tasks.filter((t) => t.dueDate === selectedDateStr);

  const handlePrevDay = () =>
    setCurrentDate((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
  const handleNextDay = () =>
    setCurrentDate((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask({
      id: `task-${Date.now()}`,
      subject: newSubject.trim() || 'General',
      title: newTitle.trim(),
      type: 'Self-Study' as const,
      dueDate: selectedDateStr,
      duration: parseFloat(newDuration) || 1,
      priority: 2 as const,
      isCompleted: false,
      estimatedHours: parseFloat(newDuration) || 1,
    });
    setNewTitle('');
  };

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

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const triggerDesktopNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('📚 Session Completed!', { body: 'Well done! Time for a short break.', icon: '/favicon.ico' });
    }
  };

  const handleSelectTask = (taskId: string) => {
    setActivePomodoroTaskId(taskId);
    setPomodoroSeconds(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentFocusedTask = tasks.find((t) => t.id === activePomodoroTaskId);

  return (
    <div className="space-y-6 font-body relative">
      {showConfetti && <Confetti width={window.innerWidth - 300} height={window.innerHeight} recycle={false} />}

      {/* Header */}
      <div>
        <h2 className="font-headline font-bold text-[40px] leading-tight tracking-tight text-[#e4e2e0]">
          Focus Hub
        </h2>
        <p className="text-[#a0a0a0] mt-1 text-base">
          Sync focus states, track today's assignments, and complete study targets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Task List */}
        <div className="lg:col-span-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 flex flex-col justify-between min-h-[480px]">
          <div>
            {/* Date Nav Header */}
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3 mb-4">
              <h3 className="text-sm font-semibold text-[#e4e2e0] tracking-tight uppercase font-label flex items-center gap-2">
                <span className="material-symbols-outlined icon-sm text-[#8ea091]">checklist</span>
                Scheduled Agenda
              </h3>
              <div className="flex items-center gap-1 bg-[#2a2a2a] border border-[#333333] rounded-sm px-2 py-1">
                <button
                  onClick={handlePrevDay}
                  className="p-1 hover:bg-[#333] rounded-sm text-[#a0a0a0] hover:text-[#e4e2e0] transition-colors"
                  title="Previous Day"
                >
                  <span className="material-symbols-outlined icon-sm">chevron_left</span>
                </button>
                <span className="text-xs font-mono text-[#e4e2e0] min-w-[90px] text-center">
                  {selectedDateStr}
                </span>
                <button
                  onClick={handleNextDay}
                  className="p-1 hover:bg-[#333] rounded-sm text-[#a0a0a0] hover:text-[#e4e2e0] transition-colors"
                  title="Next Day"
                >
                  <span className="material-symbols-outlined icon-sm">chevron_right</span>
                </button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#2a2a2a] rounded-sm min-h-[220px] gap-3">
                <span className="material-symbols-outlined text-[#6b6b6b]" style={{ fontSize: '40px' }}>
                  event_available
                </span>
                <p className="text-sm text-[#a0a0a0]">No tasks scheduled for this date.</p>
                <p className="text-xs text-[#6b6b6b]">Use the quick add tool below to populate tasks.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredTasks.map((task) => {
                  const isActive = activePomodoroTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 rounded-sm border transition-all ${
                        isActive
                          ? 'border-[#8ea091] bg-[#222824]'
                          : 'border-[#2a2a2a] bg-[#2a2a2a]/40 hover:bg-[#2a2a2a]/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => {
                            toggleTaskComplete(task.id);
                            await updateProgress(task.id, !task.isCompleted);
                          }}
                          className={`w-5 h-5 rounded-sm flex items-center justify-center border transition-colors ${
                            task.isCompleted
                              ? 'bg-[#8ea091] border-[#8ea091] text-[#121212]'
                              : 'border-[#434843] hover:border-[#8ea091]'
                          }`}
                        >
                          {task.isCompleted && (
                            <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                              check
                            </span>
                          )}
                        </button>

                        <div>
                          <span className={`text-sm font-medium block text-[#e4e2e0] ${task.isCompleted ? 'line-through text-[#6b6b6b]' : ''}`}>
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
                          className={`px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wide transition-all ${
                            isActive
                              ? 'bg-[#8ea091] text-[#121212]'
                              : 'bg-[#2a2a2a] border border-[#333333] text-[#e4e2e0] hover:border-[#8ea091]'
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

          {/* Quick Add */}
          <form onSubmit={handleAddTask} className="mt-6 pt-4 border-t border-[#2a2a2a] flex gap-2 flex-wrap items-center">
            <input
              type="text"
              placeholder="Task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 min-w-[150px] bg-[#2a2a2a] border border-[#333333] rounded-sm px-3 py-1.5 text-xs text-[#e4e2e0] placeholder-[#6b6b6b] focus:outline-none focus:border-[#8ea091] transition-colors"
              required
            />
            <input
              type="text"
              placeholder="Subject..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-24 bg-[#2a2a2a] border border-[#333333] rounded-sm px-3 py-1.5 text-xs text-[#e4e2e0] placeholder-[#6b6b6b] focus:outline-none focus:border-[#8ea091] transition-colors"
            />
            <input
              type="number"
              step="0.5"
              placeholder="Hours"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-16 bg-[#2a2a2a] border border-[#333333] rounded-sm px-3 py-1.5 text-xs text-[#e4e2e0] placeholder-[#6b6b6b] focus:outline-none focus:border-[#8ea091] transition-colors"
            />
            <button
              type="submit"
              className="bg-[#8ea091] text-[#121212] hover:bg-[#9eb0a1] transition-all font-semibold rounded-sm px-3 py-1.5 text-xs flex items-center justify-center gap-1"
              title="Add Task to Date"
            >
              <span className="material-symbols-outlined icon-sm">add</span>
              <span>Add Task</span>
            </button>
          </form>
        </div>

        {/* Pomodoro Timer */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#e4e2e0] tracking-tight uppercase text-center border-b border-[#2a2a2a] pb-3 font-label flex items-center justify-center gap-2">
              <span className="material-symbols-outlined icon-sm text-[#8ea091]">timer</span>
              Focus Timer
            </h3>

            {currentFocusedTask && (
              <div className="bg-[#2a2a2a] border border-[#333333] p-3 rounded-sm text-center">
                <span className="text-[10px] text-[#8ea091] tracking-widest font-bold uppercase font-label block">
                  Active Target
                </span>
                <span className="text-xs text-[#e4e2e0] font-medium truncate block mt-0.5">
                  {currentFocusedTask.title}
                </span>
              </div>
            )}

            {/* Timer Display */}
            <div className="text-center py-6">
              <span className="text-5xl font-bold font-mono tracking-wider text-[#e4e2e0]">
                {formatTime(pomodoroSeconds)}
              </span>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex gap-3">
              <button
                onClick={() => togglePomodoroTimer()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-semibold text-sm transition-all bg-[#8ea091] text-[#121212] hover:bg-[#9eb0a1]"
              >
                <span className="material-symbols-outlined icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPomodoroRunning ? 'pause' : 'play_arrow'}
                </span>
                <span>{isPomodoroRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button
                onClick={() => resetPomodoroTimer()}
                className="px-3.5 py-2.5 rounded-sm border border-[#333333] bg-[#2a2a2a] text-[#c8c6c5] hover:border-[#8ea091] transition-all"
              >
                <span className="material-symbols-outlined icon-sm">restart_alt</span>
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
