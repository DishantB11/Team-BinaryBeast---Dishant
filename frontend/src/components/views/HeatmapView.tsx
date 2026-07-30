import React, { useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useStore } from '../../store/useStore';
import { Activity, Flame, Award, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const HeatmapView: React.FC = () => {
  const { heatmapData, tasks } = useStore();
  const [hoveredData, setHoveredData] = useState<{ date: string; count: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Date Navigation State for Completed Tasks Table
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Stats
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter(t => t.isCompleted).length;
  const activeFlameCount = heatmapData.length; // Focus Streak days

  // Get total tasks completed on a specific day
  const getTasksCompletedOnDay = (dateStr: string) => {
    return tasks.filter(t => t.dueDate === dateStr && t.isCompleted).length;
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const container = event.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: event.clientX - container.left,
      y: event.clientY - container.top - 50,
    });
  };

  const handleMouseEnter = (event: any, value: any) => {
    if (!value || !value.date) {
      return;
    }
    setHoveredData({
      date: value.date,
      count: getTasksCompletedOnDay(value.date),
    });
  };

  const handleMouseLeave = () => {
    setHoveredData(null);
  };

  const getPaddedHeatmapData = () => {
    const dataMap = new Map<string, number>();
    heatmapData.forEach(d => {
      dataMap.set(d.date, d.count);
    });

    const start = new Date('2025-10-01');
    const end = new Date('2026-08-30');
    const loop = new Date(start);
    const padded = [];
    while (loop <= end) {
      const dateStr = loop.toISOString().split('T')[0];
      padded.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0
      });
      loop.setDate(loop.getDate() + 1);
    }
    return padded;
  };

  const paddedData = getPaddedHeatmapData();

  // Date Nav formatting YYYY-MM-DD
  const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const selectedDateStr = formatDateStr(currentDate);

  // Filter completed tasks for the selected date
  const completedTasksForDate = tasks.filter(t => t.dueDate === selectedDateStr && t.isCompleted);

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

  // Streaks Milestone Evaluator
  const milestones = [
    { label: 'Bronze Medal', req: '1 week', days: 7, icon: '🥉', desc: 'Complete 7 days focus streak.' },
    { label: 'Silver Medal', req: '30 days', days: 30, icon: '🥈', desc: 'Complete 30 days focus streak.' },
    { label: 'Gold Medal', req: '2 months', days: 60, icon: '🥇', desc: 'Complete 60 days focus streak.' },
    { label: 'Diamond Badge', req: '90 days', days: 90, icon: '💎', desc: 'Complete 90 days focus streak.' },
    { label: 'Champion Trophy', req: 'Unbroken', days: 120, icon: '🏆', desc: 'Maintain streak without breaks.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Streaks</h1>
        <p className="text-sm text-[#a0a0a0]">Review daily task completion indexes and historical consistency charts.</p>
      </div>

      {/* Stats row details (Centered flex layouts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 bg-[#3d3d3d] rounded-full flex items-center justify-center border border-[#4d4d4d]">
            <Flame className="w-5 h-5 text-[#fbbf24] fill-[#fbbf24]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6b6b6b] tracking-wider uppercase block">Focus Streak</span>
            <span className="text-xl font-bold text-white block mt-0.5">{activeFlameCount} active days</span>
          </div>
        </div>

        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 bg-[#3d3d3d] rounded-full flex items-center justify-center border border-[#4d4d4d]">
            <Activity className="w-5 h-5 text-[#fbbf24]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6b6b6b] tracking-wider uppercase block">Efficiency Rating</span>
            <span className="text-xl font-bold text-white block mt-0.5">
              {totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0}% completion
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Card */}
      <div 
        className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-6 space-y-4 relative"
        onMouseMove={handleMouseMove}
      >
        <h2 className="text-sm font-semibold text-white tracking-tight uppercase border-b border-[#3d3d3d] pb-3">
          🗓️ Session Heatmap
        </h2>

        {hoveredData && (
          <div
            className="absolute z-50 bg-[#1e1e1e] border border-[#3d3d3d] text-white px-2 py-1 rounded shadow-xl text-[10px] pointer-events-none transform -translate-x-1/2 flex flex-col items-center gap-0"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <span className="font-semibold text-white leading-tight">{hoveredData.date}</span>
            <span className="text-[#a0a0a0] font-mono text-[9px] leading-tight">{hoveredData.count} tasks completed</span>
            <div className="w-1 h-1 bg-[#1e1e1e] border-r border-b border-[#3d3d3d] transform rotate-45 mt-0.5 -mb-1" />
          </div>
        )}

        <div className="pt-2">
          <CalendarHeatmap
            startDate={new Date('2025-10-01')}
            endDate={new Date('2026-08-30')}
            values={paddedData}
            classForValue={(value) => {
              if (!value || value.count === 0) {
                return 'color-empty';
              }
              const cap = Math.min(value.count, 4);
              return `color-scale-${cap}`;
            }}
            onMouseOver={(event, value) => handleMouseEnter(event, value)}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        <div className="flex items-center justify-end gap-2 text-[11px] text-[#6b6b6b]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 bg-[#161b22] border border-[#3d3d3d] rounded-sm" />
          <div className="w-2.5 h-2.5 bg-[#0e4429] rounded-sm" />
          <div className="w-2.5 h-2.5 bg-[#006d32] rounded-sm" />
          <div className="w-2.5 h-2.5 bg-[#26a641] rounded-sm" />
          <div className="w-2.5 h-2.5 bg-[#39d353] rounded-sm" />
          <span>More</span>
        </div>
      </div>

      {/* Grid containing Rewards and Completed Tasks side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Table: Streak Rewards */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white tracking-tight uppercase border-b border-[#3d3d3d] pb-2 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#fbbf24]" />
            <span>Streak Milestones</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#3d3d3d] text-[#6b6b6b]">
                  <th className="py-2 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Reward</th>
                  <th className="py-2 font-semibold">Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d3d3d] text-white">
                {milestones.map((m) => {
                  const unlocked = activeFlameCount >= m.days;
                  return (
                    <tr key={m.label} className={unlocked ? 'opacity-100' : 'opacity-40'}>
                      <td className="py-2.5 text-center text-base w-12">{m.icon}</td>
                      <td className="py-2.5">
                        <span className="font-semibold block">{m.label}</span>
                        <span className="text-[10px] text-[#a0a0a0]">{m.desc}</span>
                      </td>
                      <td className="py-2.5 font-mono text-[10px] text-[#fbbf24]">{m.req}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: Completed Tasks */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-[#3d3d3d] pb-2 mb-3">
            <h2 className="text-sm font-semibold text-white tracking-tight uppercase flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#fbbf24]" />
              <span>Completed Log</span>
            </h2>
            
            {/* Date Navigator */}
            <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded px-1.5 py-0.5">
              <button 
                onClick={handlePrevDay}
                className="p-0.5 hover:bg-[#3d3d3d] rounded text-[#a0a0a0] hover:text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-white min-w-[75px] text-center">
                {selectedDateStr}
              </span>
              <button 
                onClick={handleNextDay}
                className="p-0.5 hover:bg-[#3d3d3d] rounded text-[#a0a0a0] hover:text-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto pr-1">
            {completedTasksForDate.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6b6b6b]">
                No completed tasks logged on this date.
              </div>
            ) : (
              <div className="space-y-1.5">
                {completedTasksForDate.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-2.5 rounded border border-[#3d3d3d] bg-[#1e1e1e]/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block leading-tight">{task.title}</span>
                      <span className="text-[10px] text-[#6b6b6b] mt-0.5 block">{task.subject}</span>
                    </div>
                    <span className="text-[10px] bg-[#fbbf24]/10 text-[#fbbf24] px-1.5 py-0.5 rounded font-mono">
                      {task.duration}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HeatmapView;
