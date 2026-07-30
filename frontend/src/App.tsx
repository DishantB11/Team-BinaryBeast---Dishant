import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/views/DashboardView';
import { CalendarView } from './components/views/CalendarView';
import { TasksFocusView } from './components/views/TasksFocusView';
import { ClassroomView } from './components/views/ClassroomView';
import { HeatmapView } from './components/views/HeatmapView';
import { DebugPanel } from './components/DebugPanel';
import { Terminal } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [showDebug, setShowDebug] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'calendar':
        return <CalendarView />;
      case 'planner':
        return <TasksFocusView />;
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

      {/* Secret Dev Debug Trigger floating button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 z-50 bg-[#2d2d2d] border border-[#3d3d3d] text-[#fbbf24] hover:bg-[#3d3d3d] p-2.5 rounded-full transition-all shadow-lg"
        title="Toggle Debug Sandbox"
      >
        <Terminal className="w-5 h-5" />
      </button>

      {/* Overlay Modal for Debug Panel */}
      {showDebug && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-lg max-w-5xl w-full p-4 relative border border-slate-800">
            <button
              onClick={() => setShowDebug(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              Close Sandbox
            </button>
            <div className="pt-8">
              <DebugPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
