import React from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  ListTodo, 
  GraduationCap, 
  Activity,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'planner', label: 'Planner', icon: ListTodo },
    { id: 'classroom', label: 'Classroom', icon: GraduationCap },
    { id: 'heatmap', label: 'Heatmap', icon: Activity },
  ];

  return (
    <aside className="fixed top-0 left-0 w-[260px] h-screen bg-[#2d2d2d] border-r border-[#3d3d3d] flex flex-col z-20">
      {/* Brand Header */}
      <div className="h-[60px] border-b border-[#3d3d3d] flex items-center px-6 gap-3">
        <Sparkles className="w-5 h-5 text-[#fbbf24] fill-[#fbbf24] animate-pulse" />
        <span className="font-bold text-lg tracking-tight text-white">StudyAgent</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all group relative ${
                isActive 
                  ? 'bg-[#3d3d3d] text-[#fbbf24]' 
                  : 'text-[#a0a0a0] hover:bg-[#3d3d3d] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-[#fbbf24]' : 'text-[#6b6b6b] group-hover:text-[#a0a0a0]'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-[#fbbf24] rounded-l" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#3d3d3d] text-center">
        <div className="text-[11px] text-[#6b6b6b]">HackWithIndia 2026</div>
        <div className="text-[10px] text-[#a0a0a0] font-semibold mt-1">Track 2 — Problem 1</div>
      </div>
    </aside>
  );
};
