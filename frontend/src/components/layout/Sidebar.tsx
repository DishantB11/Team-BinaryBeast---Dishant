import React from 'react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
  { id: 'planner', label: 'Planner', icon: 'event_note' },
  { id: 'focus', label: 'Focus Hub', icon: 'center_focus_strong' },
  { id: 'classroom', label: 'Classroom', icon: 'school' },
  { id: 'heatmap', label: 'Heatmap', icon: 'insights' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="fixed top-0 left-0 w-[260px] h-screen bg-[#131412] border-r border-[#2a2a2a] flex flex-col z-20 font-body">

      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-[#2a2a2a]">
        <h1 className="font-headline font-bold text-xl tracking-tight text-[#b9cbbb]">
          Study Agent
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-6 px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-[#8ea091] text-[#121212]'
                  : 'text-[#c8c6c5] hover:bg-[#1f201f] hover:text-[#e4e2e0]'
                }`}
            >
              <span
                className={`material-symbols-outlined icon-sm transition-all ${isActive ? 'filled' : ''
                  }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-body">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="mt-auto border-t border-[#2a2a2a] px-3 pt-3 pb-4 space-y-0.5">
        <button className="w-full flex items-center gap-6 px-4 py-2.5 rounded-sm text-sm text-[#c8c6c5] hover:bg-[#1f201f] hover:text-[#e4e2e0] transition-colors duration-200 group">
          <span className="material-symbols-outlined icon-sm">settings</span>
          <span className="font-body">Settings</span>
        </button>

        {/* User pill */}
        <div className="flex items-center gap-3 px-4 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full bg-[#8ea091] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined icon-sm text-[#121212] filled" style={{ fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#e4e2e0] leading-tight">Alex Mercer</span>
            <span className="text-[10px] text-[#a0a0a0]">Student</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
