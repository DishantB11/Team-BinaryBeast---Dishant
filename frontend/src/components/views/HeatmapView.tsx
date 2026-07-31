import React, { useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useStore } from '../../store/useStore';

export const HeatmapView: React.FC = () => {
  const { heatmapData, tasks } = useStore();
  const [hoveredData, setHoveredData] = useState<{ date: string; count: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const activeFlameCount = heatmapData.length;

  const getTasksCompletedOnDay = (dateStr: string) =>
    tasks.filter((t) => t.dueDate === dateStr && t.isCompleted).length;

  const handleMouseMove = (event: React.MouseEvent) => {
    const container = event.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: event.clientX - container.left, y: event.clientY - container.top - 50 });
  };

  const handleMouseEnter = (event: any, value: any) => {
    if (!value || !value.date) return;
    setHoveredData({ date: value.date, count: getTasksCompletedOnDay(value.date) });
  };

  const handleMouseLeave = () => setHoveredData(null);

  const getPaddedHeatmapData = () => {
    const dataMap = new Map<string, number>();
    heatmapData.forEach((d) => dataMap.set(d.date, d.count));
    const start = new Date('2025-10-01');
    const end = new Date('2026-08-30');
    const loop = new Date(start);
    const padded = [];
    while (loop <= end) {
      const dateStr = loop.toISOString().split('T')[0];
      padded.push({ date: dateStr, count: dataMap.get(dateStr) || 0 });
      loop.setDate(loop.getDate() + 1);
    }
    return padded;
  };

  const paddedData = getPaddedHeatmapData();
  const formatDateStr = (date: Date) => date.toISOString().split('T')[0];
  const selectedDateStr = formatDateStr(currentDate);
  const completedTasksForDate = tasks.filter((t) => t.dueDate === selectedDateStr && t.isCompleted);

  const handlePrevDay = () =>
    setCurrentDate((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
  const handleNextDay = () =>
    setCurrentDate((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });

  const milestones = [
    { label: 'Bronze Medal',    req: '1 week',   days: 7,   icon: 'workspace_premium', color: '#cd7f32', desc: 'Complete 7 days focus streak.'    },
    { label: 'Silver Medal',    req: '30 days',  days: 30,  icon: 'military_tech',     color: '#c0c0c0', desc: 'Complete 30 days focus streak.'   },
    { label: 'Gold Medal',      req: '2 months', days: 60,  icon: 'emoji_events',      color: '#ffd700', desc: 'Complete 60 days focus streak.'   },
    { label: 'Diamond Badge',   req: '90 days',  days: 90,  icon: 'diamond',           color: '#7dd3fc', desc: 'Complete 90 days focus streak.'   },
    { label: 'Champion Trophy', req: 'Unbroken', days: 120, icon: 'social_leaderboard',color: '#f0abfc', desc: 'Maintain streak without breaks.'  },
  ];

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div>
        <h2 className="font-headline font-bold text-[40px] leading-tight tracking-tight text-[#e4e2e0]">
          Analytics &amp; Streaks
        </h2>
        <p className="text-[#a0a0a0] mt-1 text-base">
          Review daily task completion indexes and historical consistency charts.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 flex items-center gap-5">
          <div className="w-12 h-12 bg-[#2a2a2a] rounded-full flex items-center justify-center border border-[#333333] shrink-0">
            <span className="material-symbols-outlined icon-lg text-[#8ea091]" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6b6b6b] tracking-widest uppercase font-label block">
              Focus Streak
            </span>
            <span className="text-2xl font-bold font-headline text-[#e4e2e0] block mt-0.5">
              {activeFlameCount} active days
            </span>
          </div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 flex items-center gap-5">
          <div className="w-12 h-12 bg-[#2a2a2a] rounded-full flex items-center justify-center border border-[#333333] shrink-0">
            <span className="material-symbols-outlined icon-lg text-[#8ea091]">insights</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6b6b6b] tracking-widest uppercase font-label block">
              Efficiency Rating
            </span>
            <span className="text-2xl font-bold font-headline text-[#e4e2e0] block mt-0.5">
              {totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0}% completion
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div
        className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-6 space-y-4 relative"
        onMouseMove={handleMouseMove}
      >
        <h3 className="text-sm font-semibold text-[#e4e2e0] tracking-tight uppercase border-b border-[#2a2a2a] pb-3 flex items-center gap-2 font-label">
          <span className="material-symbols-outlined icon-sm text-[#8ea091]">grid_on</span>
          Session Heatmap
        </h3>

        {hoveredData && (
          <div
            className="absolute z-50 bg-[#2a2a2a] border border-[#333333] text-[#e4e2e0] px-3 py-1.5 rounded-sm shadow-xl text-[10px] pointer-events-none -translate-x-1/2 flex flex-col items-center gap-0"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <span className="font-semibold leading-tight">{hoveredData.date}</span>
            <span className="text-[#a0a0a0] font-mono text-[9px] leading-tight">{hoveredData.count} tasks completed</span>
          </div>
        )}

        <div className="pt-2">
          <CalendarHeatmap
            startDate={new Date('2025-10-01')}
            endDate={new Date('2026-08-30')}
            values={paddedData}
            classForValue={(value) => {
              if (!value || value.count === 0) return 'color-empty';
              return `color-scale-${Math.min(value.count, 4)}`;
            }}
            onMouseOver={(event, value) => handleMouseEnter(event, value)}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        <div className="flex items-center justify-end gap-2 text-[11px] text-[#6b6b6b]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 bg-[#161b22] border border-[#2a2a2a] rounded-sm" />
          <div className="w-2.5 h-2.5 bg-[#0e4429] rounded-sm" />
          <div className="w-2.5 h-2.5 bg-[#006d32] rounded-sm" />
          <div className="w-2.5 h-2.5 bg-[#26a641] rounded-sm" />
          <div className="w-2.5 h-2.5 bg-[#39d353] rounded-sm" />
          <span>More</span>
        </div>
      </div>

      {/* Milestones + Completed Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Milestones Table */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5">
          <h3 className="text-sm font-semibold text-[#e4e2e0] tracking-tight uppercase border-b border-[#2a2a2a] pb-3 mb-3 flex items-center gap-2 font-label">
            <span className="material-symbols-outlined icon-sm text-[#8ea091]">emoji_events</span>
            Streak Milestones
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-[#6b6b6b]">
                  <th className="py-2 font-semibold font-label">Status</th>
                  <th className="py-2 font-semibold font-label">Reward</th>
                  <th className="py-2 font-semibold font-label">Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {milestones.map((m) => {
                  const unlocked = activeFlameCount >= m.days;
                  return (
                    <tr key={m.label} className={unlocked ? 'opacity-100' : 'opacity-40'}>
                      <td className="py-2.5 text-center w-10">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '18px', color: m.color, fontVariationSettings: "'FILL' 1" }}
                        >
                          {m.icon}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold text-[#e4e2e0] block">{m.label}</span>
                        <span className="text-[10px] text-[#a0a0a0]">{m.desc}</span>
                      </td>
                      <td className="py-2.5 font-mono text-[10px] text-[#8ea091]">{m.req}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Completed Tasks Log */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3 mb-3">
            <h3 className="text-sm font-semibold text-[#e4e2e0] tracking-tight uppercase flex items-center gap-2 font-label">
              <span className="material-symbols-outlined icon-sm text-[#8ea091]" style={{ fontVariationSettings: "'FILL' 1" }}>
                task_alt
              </span>
              Completed Log
            </h3>

            {/* Date Navigator */}
            <div className="flex items-center gap-1 bg-[#2a2a2a] border border-[#333333] rounded-sm px-1.5 py-0.5">
              <button onClick={handlePrevDay} className="p-0.5 hover:bg-[#333] rounded-sm text-[#a0a0a0] hover:text-[#e4e2e0]">
                <span className="material-symbols-outlined icon-sm">chevron_left</span>
              </button>
              <span className="text-[10px] font-mono text-[#e4e2e0] min-w-[75px] text-center">
                {selectedDateStr}
              </span>
              <button onClick={handleNextDay} className="p-0.5 hover:bg-[#333] rounded-sm text-[#a0a0a0] hover:text-[#e4e2e0]">
                <span className="material-symbols-outlined icon-sm">chevron_right</span>
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
                    className="p-2.5 rounded-sm border border-[#2a2a2a] bg-[#2a2a2a]/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#e4e2e0] block leading-tight">{task.title}</span>
                      <span className="text-[10px] text-[#6b6b6b] mt-0.5 block">{task.subject}</span>
                    </div>
                    <span className="text-[10px] bg-[#222824] text-[#8ea091] px-1.5 py-0.5 rounded-sm font-mono border border-[#3a4b3e]">
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
