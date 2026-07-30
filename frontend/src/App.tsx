import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/views/DashboardView';
import { CalendarView } from './components/views/CalendarView';
import { TasksFocusView } from './components/views/TasksFocusView';
import { FocusHubView } from './components/views/FocusHubView';
import { ClassroomView } from './components/views/ClassroomView';
import { HeatmapView } from './components/views/HeatmapView';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'calendar':
        return <CalendarView />;
      case 'planner':
        return <TasksFocusView />;
      case 'focus':
        return <FocusHubView />;
      case 'classroom':
        return <ClassroomView />;
      case 'heatmap':
        return <HeatmapView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex">
      {/* Notion Sidebar Layout */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col pl-[260px]">
        {/* Top Header bar */}
        <Topbar />

        {/* Inner Content scroll layout */}
        <main className="flex-1 mt-[60px] p-8 overflow-y-auto max-w-[1200px] w-full mx-auto pb-20">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;
