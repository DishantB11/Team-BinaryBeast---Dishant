import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventDragStopArg } from '@fullcalendar/interaction';
import { useStore } from '../../store/useStore';
import { rescheduleTask } from '../../api/client';
import { Sparkles, RefreshCw } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { tasks, setTasks } = useStore();
  const [replanningLog, setReplanningLog] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Convert tasks to FullCalendar event format
  const events = tasks.map((task) => ({
    id: task.id,
    title: `[${task.subject}] ${task.title}`,
    start: task.dueDate,
    allDay: true,
    // Custom color styling matching requirements: yellow for priority 1, gray border/bg for others
    backgroundColor: task.priority === 1 ? '#fbbf24' : '#2d2d2d',
    borderColor: task.priority === 1 ? '#fbbf24' : '#3d3d3d',
    textColor: task.priority === 1 ? '#000000' : '#ffffff',
    extendedProps: { ...task },
  }));

  // Handle Event Drag-and-Drop (Adaptive Replanning)
  const handleEventDrop = async (info: any) => {
    const { event } = info;
    const newDateStr = event.startStr;
    const taskId = event.id;

    setIsUpdating(true);
    setReplanningLog(`Recalculating plan for target: "${event.title}"...`);

    try {
      const response = await rescheduleTask(taskId, newDateStr, tasks);
      
      // Update state with newly planned conflict-free task list
      setTasks(response.tasks);
      setReplanningLog(response.reasoning);
    } catch (error: any) {
      console.error('Failed to reschedule task:', error);
      setReplanningLog(`Conflict resolution failed: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Interactive Calendar</h1>
          <p className="text-sm text-[#a0a0a0]">Drag and drop scheduled sessions. AI conflicts resolve automatically.</p>
        </div>
      </div>

      {/* AI Reasoner panel */}
      {replanningLog && (
        <div className="bg-[#2d2d2d] border border-[#fbbf24]/30 rounded-lg p-4 flex gap-3 items-start animate-fadeIn">
          <Sparkles className="w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#fbbf24] tracking-wider uppercase block">AI Reasoning Engine</span>
            <p className="text-sm text-gray-200 leading-relaxed font-sans">{replanningLog}</p>
          </div>
        </div>
      )}

      {/* Calendar Wrap */}
      <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-6 relative">
        {isUpdating && (
          <div className="absolute inset-0 bg-[#1e1e1e]/60 rounded-lg flex items-center justify-center z-50">
            <div className="flex items-center gap-3 bg-[#2d2d2d] border border-[#3d3d3d] px-4 py-2.5 rounded-lg text-sm text-white">
              <RefreshCw className="w-4 h-4 text-[#fbbf24] animate-spin" />
              <span>Recalculating conflict-free timeline...</span>
            </div>
          </div>
        )}
        
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          height="auto"
        />
      </div>
    </div>
  );
};
