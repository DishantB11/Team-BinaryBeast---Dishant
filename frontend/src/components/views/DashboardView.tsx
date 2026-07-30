import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Sparkles, Calendar, BookOpen, CheckCircle, AlertTriangle, 
  FileText, GraduationCap, Plus, Flame, Award
} from 'lucide-react';

const extraQuotes = [
  "The only bad study session is the one that didn't happen.",
  "Make it simple, but significant.",
  "Energy flows where attention goes.",
  "Focus is a muscle, build it daily.",
];

export const DashboardView: React.FC = () => {
  const { tasks, addTask, heatmapData, getCompletedTasksCount } = useStore();

  // Quick Task Capture State
  const [quickTitle, setQuickTitle] = useState('');

  // Quick Task Handler
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

  // Stats & Dates
  const totalTasks = tasks.length;
  const completedTasks = getCompletedTasksCount();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const upcomingEvents = tasks
    .filter((t) => !t.isCompleted && t.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const upcomingExamsCount = upcomingEvents.filter((t) => t.type === 'Exam').length;
  const activeStreak = heatmapData.length;

  const randomQuote = React.useMemo(() => {
    return extraQuotes[Math.floor(Math.random() * extraQuotes.length)];
  }, []);

  const daysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'Exam':
        return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', icon: GraduationCap };
      case 'Assignment':
        return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', icon: FileText };
      default:
        return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: BookOpen };
    }
  };

  // Reward Milestones
  const rewards = [
    { name: 'Bronze Medal', req: '7d streak', days: 7, icon: '🥉' },
    { name: 'Silver Medal', req: '30d streak', days: 30, icon: '🥈' },
    { name: 'Gold Medal', req: '60d streak', days: 60, icon: '🥇' },
    { name: 'Diamond Badge', req: '90d streak', days: 90, icon: '💎' },
    { name: 'Champion Trophy', req: '120d streak', days: 120, icon: '🏆' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with inline Quick Add Input at the rightmost corner */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#a0a0a0] mt-0.5">Track your academic progress, scheduling estimates, and focus targets.</p>
        </div>

        {/* Small Quick Add Task input box in line with header */}
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
          <div className="flex items-center bg-[#2d2d2d] border border-[#3d3d3d] rounded-md px-3 py-1.5 focus-within:border-[#fbbf24] transition-colors w-60">
            <Plus className="w-3.5 h-3.5 text-[#fbbf24] mr-2 shrink-0" />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Quick add task..."
              className="w-full bg-transparent text-xs text-white placeholder-[#6b6b6b] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="text-xs bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 border border-[#4d4d4d]"
          >
            Add
          </button>
        </form>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: totalTasks, icon: BookOpen },
          { label: 'Completed Tasks', value: completedTasks, icon: CheckCircle },
          { label: 'Upcoming Exams', value: upcomingExamsCount, icon: AlertTriangle },
          { label: 'Upcoming Events', value: upcomingEvents.length, icon: Calendar },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex items-center justify-between">
              <div>
                <span className="text-[12px] font-semibold tracking-wider text-[#6b6b6b] uppercase block">
                  {stat.label}
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {stat.value}
                </span>
              </div>
              <div className="w-10 h-10 bg-[#3d3d3d] rounded-full flex items-center justify-center border border-[#4d4d4d]">
                <Icon className="w-5 h-5 text-[#fbbf24]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Streak & Trophy Showcase Full Width */}
      <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-[#3d3d3d] pb-3 mb-4">
          <h2 className="text-sm font-semibold text-white tracking-tight uppercase flex items-center gap-2">
            <Award className="w-4 h-4 text-[#fbbf24]" />
            <span>Streak & Reward Showcase</span>
          </h2>
          <span className="text-xs font-mono text-[#fbbf24] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-[#fbbf24]" />
            {activeStreak} Days Streak
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          {rewards.map((r) => {
            const isUnlocked = activeStreak >= r.days;
            return (
              <div
                key={r.name}
                className={`p-3.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                  isUnlocked
                    ? 'bg-[#1e1e1e] border-[#fbbf24]/40 text-white shadow-md'
                    : 'bg-[#252525]/50 border-[#3d3d3d] text-[#6b6b6b] opacity-40'
                }`}
              >
                <span className="text-3xl mb-1.5">{r.icon}</span>
                <span className="text-xs font-semibold block leading-tight truncate w-full">
                  {r.name}
                </span>
                <span className="text-[10px] text-[#a0a0a0] mt-1">{r.req}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white mb-4 tracking-tight uppercase flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#fbbf24]" />
          Upcoming Events
        </h2>
        {upcomingEvents.length === 0 ? (
          <div className="py-8 text-center text-[#6b6b6b] text-sm">
            No upcoming events. You're all caught up! 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 8).map((event) => {
              const badge = typeBadge(event.type);
              const BadgeIcon = badge.icon;
              const countdown = daysUntil(event.dueDate);
              const isUrgent = countdown === 'Today' || countdown === 'Tomorrow';

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-4 bg-[#252525] border border-[#333] rounded-lg px-4 py-3 hover:border-[#4d4d4d] transition-colors"
                >
                  <div className={`w-8 h-8 rounded-md ${badge.bg} border ${badge.border} flex items-center justify-center shrink-0`}>
                    <BadgeIcon className={`w-4 h-4 ${badge.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                    <p className="text-[11px] text-[#6b6b6b] mt-0.5">{event.subject}</p>
                  </div>

                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${badge.bg} ${badge.text} border ${badge.border} shrink-0`}>
                    {event.type}
                  </span>

                  <div className="text-right shrink-0 min-w-[70px]">
                    <span className={`text-xs font-bold ${isUrgent ? 'text-red-400' : 'text-[#a0a0a0]'}`}>
                      {countdown}
                    </span>
                    <p className="text-[10px] text-[#6b6b6b] mt-0.5">
                      {new Date(event.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspirational Quote Card */}
      <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-6 flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 bg-[#3d3d3d] border border-[#4d4d4d] rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#fbbf24]" />
        </div>
        <div>
          <p className="text-white font-medium text-sm italic">"{randomQuote}"</p>
          <span className="text-[11px] text-[#6b6b6b] uppercase tracking-wider font-semibold block mt-1">Study Guide Assistant</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
