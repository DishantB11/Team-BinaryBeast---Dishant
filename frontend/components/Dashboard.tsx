import React from 'react';
import { useStore } from '../store/useStore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { tasks, subjects, getTotalStudyHours, getCompletedTasksCount, preferences } = useStore();

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = getCompletedTasksCount();
  const upcomingExams = tasks.filter(t => t.type === 'Exam' && !t.isCompleted).length;
  const totalHours = getTotalStudyHours();

  // Prepare data for Pie Chart (Hours per Subject)
  const subjectHours = subjects.map(s => ({
    name: s.name,
    value: s.estimatedHours,
    progress: s.progress,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📚 Study Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-2xl font-bold">{totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">{completedTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Upcoming Exams</p>
          <p className="text-2xl font-bold">{upcomingExams}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Total Study Hours</p>
          <p className="text-2xl font-bold">{totalHours}h</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-4">📊 Hours per Subject</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={subjectHours}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label
              >
                {subjectHours.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Progress Bars */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-4">📈 Subject Progress</h3>
          <div className="space-y-3">
            {subjects.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span>{s.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${s.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          {/* Preferences Display */}
          <div className="mt-4 text-xs text-gray-500 border-t pt-2">
            <span>Goal: {preferences.goal} | Focus: {preferences.focusTime} | Attendance: {preferences.attendance}%</span>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg text-center italic text-gray-700">
        "✨ {['Stay consistent, you\'ve got this!', 'Small steps lead to big results.', 'Discipline over motivation.', 'Your future self will thank you.'][Math.floor(Math.random() * 4)]}"
      </div>
    </div>
  );
};
