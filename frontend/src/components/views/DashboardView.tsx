import React from 'react';
import { useStore } from '../../store/useStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, Calendar, BookOpen, Clock, CheckCircle } from 'lucide-react';

const extraQuotes = [
  "The only bad study session is the one that didn't happen.",
  "Make it simple, but significant.",
  "Energy flows where attention goes.",
  "Focus is a muscle, build it daily.",
];

export const DashboardView: React.FC = () => {
  const { tasks, subjects, getTotalStudyHours, getCompletedTasksCount, preferences } = useStore();

  const totalTasks = tasks.length;
  const completedTasks = getCompletedTasksCount();
  const upcomingExams = tasks.filter(t => t.type === 'Exam' && !t.isCompleted).length;
  const totalHours = getTotalStudyHours();

  // Prepare custom dark/yellow/gray palette for Pie
  const subjectHours = subjects.map(s => ({
    name: s.name,
    value: s.estimatedHours,
  }));

  // Notion-inspired custom palette
  const COLORS = ['#fbbf24', '#e2e8f0', '#a0a0a0', '#6b6b6b', '#3d3d3d'];

  const randomQuote = React.useMemo(() => {
    return extraQuotes[Math.floor(Math.random() * extraQuotes.length)];
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Workspace Dashboard</span>
        </h1>
        <p className="text-sm text-[#a0a0a0]">Track your academic progress, scheduling estimates, and focus targets.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: totalTasks, icon: BookOpen },
          { label: 'Completed Tasks', value: completedTasks, icon: CheckCircle },
          { label: 'Upcoming Exams', value: upcomingExams, icon: Calendar },
          { label: 'Total Study Hours', value: `${totalHours}h`, icon: Clock },
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

      {/* Details / Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recharts Pie Chart */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white mb-4 tracking-tight uppercase">📊 Study Distribution (Hours)</h2>
          {subjectHours.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-[#6b6b6b] text-sm">
              No subjects registered yet.
            </div>
          ) : (
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectHours}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    fill="#3d3d3d"
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {subjectHours.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2d2d2d', 
                      borderColor: '#3d3d3d', 
                      color: '#ffffff',
                      borderRadius: '6px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">{totalHours}h</span>
                <span className="text-[10px] text-[#6b6b6b] uppercase tracking-wider font-semibold">Total</span>
              </div>
            </div>
          )}
        </div>

        {/* Subjects list and details */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white mb-4 tracking-tight uppercase">📈 Subject Mastery Track</h2>
            <div className="space-y-4">
              {subjects.map((sub) => (
                <div key={sub.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">{sub.name}</span>
                    <span className="text-[#fbbf24] font-mono">{sub.progress}%</span>
                  </div>
                  <div className="w-full bg-[#3d3d3d] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#fbbf24] h-full rounded-full transition-all duration-500"
                      style={{ width: `${sub.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#3d3d3d] flex items-center justify-between text-xs text-[#a0a0a0]">
            <div>Goal: <span className="text-white font-semibold">{preferences.goal}</span></div>
            <div>Focus: <span className="text-white font-semibold">{preferences.focusTime}</span></div>
            <div>Attendance Target: <span className="text-white font-semibold">{preferences.attendance}%</span></div>
          </div>
        </div>
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
