import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

const extraQuotes = [
  "The only bad study session is the one that didn't happen.",
  "Make it simple, but significant.",
  "Energy flows where attention goes.",
  "Focus is a muscle, build it daily.",
];

/* ─── Priority / status badge config ─────────────────── */
type BadgeVariant = 'high' | 'inprogress' | 'todo' | 'exam' | 'assignment' | 'study';

const BADGES: Record<BadgeVariant, { bg: string; text: string; border: string; label: string }> = {
  high:       { bg: '#ffdad6', text: '#690005', border: '#ffb4ab', label: 'High Priority' },
  inprogress: { bg: '#d5e7d7', text: '#0f1f15', border: '#8ea091', label: 'In Progress'   },
  todo:       { bg: '#2a2a2a', text: '#a0a0a0', border: '#333333', label: 'To Do'         },
  exam:       { bg: '#ffdad6', text: '#690005', border: '#ffb4ab', label: 'Exam'          },
  assignment: { bg: '#252525', text: '#c8c6c5', border: '#434843', label: 'Assignment'    },
  study:      { bg: '#222824', text: '#8ea091', border: '#3a4b3e', label: 'Self-Study'    },
};

function taskTypeBadge(type: string): BadgeVariant {
  if (type === 'Exam')       return 'exam';
  if (type === 'Assignment') return 'assignment';
  return 'study';
}

function taskTypeIcon(type: string): string {
  if (type === 'Exam')       return 'school';
  if (type === 'Assignment') return 'assignment';
  return 'menu_book';
}

/* ─── Reward milestones ───────────────────────────────── */
const REWARDS = [
  { name: 'Bronze Focus Badge',      desc: '5 hours of deep focus this week.', icon: 'workspace_premium', color: '#cd7f32', days: 5  },
  { name: 'Silver Consistency',      desc: '7 day streak maintained.',          icon: 'military_tech',     color: '#c0c0c0', days: 7  },
  { name: 'Gold Mastery Trophy',     desc: 'Complete all assignments early.',   icon: 'emoji_events',      color: '#ffd700', days: 30 },
  { name: 'Diamond Dedication',      desc: 'Study 90 days in a row.',           icon: 'diamond',           color: '#7dd3fc', days: 90 },
  { name: 'Champion Crown',          desc: 'Achieve 120 day streak.',           icon: 'social_leaderboard',color: '#f0abfc', days: 120},
];

/* ─────────────────────────────────────────────────────── */

export const DashboardView: React.FC = () => {
  const { tasks, addTask, heatmapData, getCompletedTasksCount } = useStore();

  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    addTask({
      id: `task-${Date.now()}`,
      title: quickTitle.trim(),
      subject: 'General',
      type: 'Self-Study',
      dueDate: todayStr,
      duration: 1,
      priority: 2,
      isCompleted: false,
      estimatedHours: 1,
      module: 'General',
    });
    setQuickTitle('');
  };

  /* Stats */
  const totalTasks     = tasks.length;
  const completedTasks = getCompletedTasksCount();
  const activeStreak   = heatmapData.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const upcomingEvents = tasks
    .filter((t) => !t.isCompleted && t.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const upcomingExamsCount = upcomingEvents.filter((t) => t.type === 'Exam').length;

  const nextExam = upcomingEvents.find((t) => t.type === 'Exam');

  const daysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  const statCards = [
    { label: 'Total Tasks',     value: totalTasks,            icon: 'checklist',        accent: '#8ea091',  sub: `${completedTasks} completed`,      subColor: '#8ea091'  },
    { label: 'Focus Time',      value: `${activeStreak * 2}h`,icon: 'timer',            accent: '#8ea091',  sub: 'This week',                        subColor: '#a0a0a0'  },
    { label: 'Upcoming Exams',  value: upcomingExamsCount,    icon: 'assignment_late',  accent: '#ffb4ab',  sub: nextExam ? `Next: ${nextExam.subject}` : 'None scheduled', subColor: upcomingExamsCount > 0 ? '#ffb4ab' : '#a0a0a0' },
    { label: 'Active Streak',   value: `${activeStreak}d`,    icon: 'local_fire_department', accent: '#8ea091', sub: 'Keep it up!',                  subColor: '#8ea091'  },
  ];

  return (
    <div className="space-y-6 font-body">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-[40px] leading-tight tracking-tight text-[#e4e2e0]">
            Dashboard
          </h2>
          <p className="text-[#a0a0a0] mt-1 text-base">
            Overview of your academic progress.
          </p>
        </div>

        {/* Quick Add */}
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2 mt-2">
          <div className="flex items-center bg-[#2a2a2a] border border-[#333333] rounded-sm px-3 py-2 focus-within:border-[#8ea091] transition-colors w-60 gap-2">
            <span className="material-symbols-outlined icon-sm text-[#8ea091]">add</span>
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Quick add task..."
              className="w-full bg-transparent text-sm text-[#e4e2e0] placeholder-[#6b6b6b] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="text-sm bg-[#8ea091] hover:bg-[#9eb0a1] text-[#121212] px-4 py-2 rounded-sm font-semibold transition-colors shrink-0"
          >
            Add
          </button>
        </form>
      </div>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 flex flex-col gap-3 hover:border-[#333] transition-colors"
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-semibold tracking-widest text-[#a0a0a0] uppercase font-label">
                {stat.label}
              </span>
              <span
                className="material-symbols-outlined icon-lg"
                style={{ color: stat.accent }}
              >
                {stat.icon}
              </span>
            </div>
            <div className="font-headline font-bold text-[40px] leading-none text-[#e4e2e0]">
              {stat.value}
            </div>
            <div className="text-xs flex items-center gap-1" style={{ color: stat.subColor }}>
              {i === 0 && <span className="material-symbols-outlined icon-sm">trending_up</span>}
              <span>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bento Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Upcoming Tasks — spans 2 cols */}
        <div className="lg:col-span-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 flex flex-col">
          <div className="flex justify-between items-center border-b border-[#2a2a2a] pb-4 mb-4">
            <h3 className="font-headline font-semibold text-2xl text-[#e4e2e0]">
              Upcoming Academic Tasks
            </h3>
            <button className="text-sm text-[#8ea091] hover:text-[#b9cbbb] transition-colors font-medium">
              View All
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {upcomingEvents.length === 0 ? (
              <div className="py-10 text-center text-[#6b6b6b] text-sm">
                No upcoming tasks. You're all caught up! 🎉
              </div>
            ) : (
              upcomingEvents.slice(0, 6).map((event) => {
                const badgeKey = taskTypeBadge(event.type);
                const badge    = BADGES[badgeKey];
                const icon     = taskTypeIcon(event.type);
                const countdown = daysUntil(event.dueDate);
                const isUrgent  = countdown === 'Today' || countdown === 'Tomorrow';

                return (
                  <div
                    key={event.id}
                    className="group flex items-center justify-between p-3 rounded-sm hover:bg-[#2a2a2a] transition-colors border border-transparent hover:border-[#333333] cursor-pointer"
                  >
                    {/* Left: icon + info */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-sm bg-[#2a2a2a] group-hover:bg-[#333] flex items-center justify-center border border-[#333333] shrink-0 transition-colors">
                        <span className="material-symbols-outlined icon-sm text-[#a0a0a0]">
                          {icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#e4e2e0] leading-snug">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-xs"
                            style={{ color: isUrgent ? '#ffb4ab' : '#a0a0a0' }}
                          >
                            {countdown}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#2a2a2a]" />
                          <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-[#2a2a2a] text-[#a0a0a0] border border-[#333]">
                            {event.subject}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: type badge */}
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm shrink-0 font-label"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rewards Panel — 1 col */}
        <div className="lg:col-span-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 flex flex-col">
          <div className="border-b border-[#2a2a2a] pb-4 mb-4 flex items-center justify-between">
            {/* Title + info tooltip */}
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-semibold text-2xl text-[#e4e2e0]">Rewards</h3>
              <div className="relative group/info flex items-center">
                <span className="material-symbols-outlined text-[14px] text-[#6b6b6b] cursor-default select-none"
                  style={{ fontSize: '14px', lineHeight: 1 }}>
                  info
                </span>
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  opacity-0 group-hover/info:opacity-100 transition-opacity duration-200 z-50
                  w-56 bg-[#1e1e1e] border border-[#333333] rounded-sm shadow-xl p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a0a0a0] mb-2 font-label">Streak milestones</p>
                  <div className="flex flex-col gap-1.5">
                    {REWARDS.map((r) => (
                      <div key={r.name} className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined shrink-0"
                          style={{ fontSize: '14px', color: r.color, fontVariationSettings: "'FILL' 1" }}
                        >
                          {r.icon}
                        </span>
                        <span className="text-xs text-[#c8c6c5] truncate flex-1">{r.name}</span>
                        <span className="text-[10px] text-[#6b6b6b] font-label shrink-0">{r.days}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <span className="text-xs text-[#8ea091] flex items-center gap-1 font-label font-semibold">
              <span className="material-symbols-outlined icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
              {activeStreak}d streak
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {REWARDS.map((r) => {
              const isUnlocked = activeStreak >= r.days;
              return (
                <div
                  key={r.name}
                  className={`flex items-center gap-4 p-3 rounded-sm border transition-all ${
                    isUnlocked
                      ? 'bg-[#2a2a2a] border-[#333333]'
                      : 'bg-[#2a2a2a] border-[#333333] opacity-40 grayscale'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-[#1e1e1e] border border-[#434843] flex items-center justify-center shrink-0">
                    <span
                      className="material-symbols-outlined icon-xl"
                      style={{
                        color: r.color,
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      {r.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#e4e2e0] leading-snug truncate">
                      {r.name}
                    </p>
                    <p className="text-[11px] text-[#a0a0a0] mt-0.5">
                      {isUnlocked ? '✓ Unlocked' : r.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardView;
