import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useStore } from '../../store/useStore';
import { rescheduleTask } from '../../api/client';
import { createGoogleCalendarEvents, fetchGoogleCalendarEvents } from '../../api/googleCalendar';
import { Sparkles, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { tasks, setTasks } = useStore();
  const [replanningLog, setReplanningLog] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  const [parsedTaskInfo, setParsedTaskInfo] = useState<{
    subject: string;
    topic: string;
    priority: string;
    dueDate: string;
    estTime: string;
  } | null>(null);

  // Convert tasks to FullCalendar event format
  const events = tasks.map((task) => ({
    id: task.id,
    title: `[${task.subject}] ${task.title}`,
    start: task.dueDate,
    allDay: true,
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
    setParsedTaskInfo(null);
    setReplanningLog(`Recalculating plan for target: "${event.title}"...`);

    try {
      const response = await rescheduleTask(taskId, newDateStr, tasks);
      setTasks(response.tasks);
      setReplanningLog(response.reasoning);
    } catch (error: any) {
      console.error('Failed to reschedule task:', error);
      setReplanningLog(`Conflict resolution failed: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Event Click to show formatted details in AI Reasoning panel
  const handleEventClick = (clickInfo: any) => {
    const task = clickInfo.event.extendedProps;
    const priorityLabel = task.priority === 1 ? 'High' : task.priority === 2 ? 'Medium' : 'Low';
    const estTime = task.estimatedHours || task.duration || 2;

    setParsedTaskInfo({
      subject: task.subject || 'N/A',
      topic: task.title || 'N/A',
      priority: priorityLabel,
      dueDate: task.dueDate || 'N/A',
      estTime: `${estTime} hrs`,
    });

    setReplanningLog(
      `1) Subject: ${task.subject || 'N/A'} | 2) Topic: ${task.title || 'N/A'} | 3) Priority: ${priorityLabel} | 4) Due Date: ${task.dueDate || 'N/A'} | 5) Estimated Time: ${estTime} hrs`
    );
  };

  // Sync tasks directly to/from user's Google Calendar via OAuth 2.0
  const handleSyncGoogleCalendar = async () => {
    setIsSyncingGoogle(true);
    setReplanningLog('Connecting to Google Calendar & fetching remote events...');

    try {
      // 1. Fetch remote events from Google Calendar
      const remoteTasks = await fetchGoogleCalendarEvents();
      
      // Merge remote events into existing tasks store avoiding duplicates
      const existingTaskTitles = new Set(tasks.map((t) => `${t.dueDate}:${t.title.toLowerCase()}`));
      const newImportedTasks = remoteTasks.filter(
        (rt) => !existingTaskTitles.has(`${rt.dueDate}:${rt.title.toLowerCase()}`) && !tasks.some((t) => t.id === rt.id)
      );

      const mergedTasks = [...tasks, ...newImportedTasks];

      // 2. Export unsynced local study sessions to Google Calendar
      const localTasksToExport = tasks.filter((t) => !t.id.startsWith('gcal-'));
      let exportedCount = 0;
      if (localTasksToExport.length > 0) {
        const synced = await createGoogleCalendarEvents(localTasksToExport);
        exportedCount = synced.length;
      }

      setTasks(mergedTasks);
      setReplanningLog(
        `✅ Bidirectional Sync Complete! Imported ${newImportedTasks.length} Google Calendar event(s) into your planner & exported ${exportedCount} study session(s) to Google Calendar.`
      );
    } catch (error: any) {
      console.error('Google Calendar sync error:', error);
      setReplanningLog(`⚠️ Google Calendar sync: ${error.message || 'Permission requested or failed.'}`);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Interactive Calendar</h1>
          <p className="text-sm text-[#a0a0a0]">Drag and drop scheduled sessions. AI conflicts resolve automatically.</p>
        </div>

        <button
          onClick={handleSyncGoogleCalendar}
          disabled={isSyncingGoogle}
          className="flex items-center gap-2 bg-[#2d2d2d] border border-[#3d3d3d] hover:border-[#fbbf24] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <CalendarIcon className={`w-4 h-4 text-[#fbbf24] ${isSyncingGoogle ? 'animate-spin' : ''}`} />
          <span>{isSyncingGoogle ? 'Syncing...' : 'Sync to Google Calendar'}</span>
        </button>
      </div>

      {/* AI Reasoner panel - Clean Minimal Metadata Grid */}
      {replanningLog && (
        <div className="bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg p-4 transition-all duration-200 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 border-b border-[#2d2d2d] pb-2">
            <Sparkles className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <span className="text-xs font-semibold text-[#fbbf24] tracking-wider uppercase">AI Reasoning Engine</span>
          </div>

          {parsedTaskInfo ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-[#2d2d2d] p-2.5 rounded border border-[#3d3d3d]">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold">Subject</div>
                <div className="font-bold text-white truncate mt-0.5">{parsedTaskInfo.subject}</div>
              </div>
              <div className="bg-[#2d2d2d] p-2.5 rounded border border-[#3d3d3d] col-span-2 md:col-span-1">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold">Topic</div>
                <div className="font-bold text-white truncate mt-0.5" title={parsedTaskInfo.topic}>{parsedTaskInfo.topic}</div>
              </div>
              <div className="bg-[#2d2d2d] p-2.5 rounded border border-[#3d3d3d]">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold">Priority</div>
                <div className="font-bold text-[#fbbf24] mt-0.5">{parsedTaskInfo.priority}</div>
              </div>
              <div className="bg-[#2d2d2d] p-2.5 rounded border border-[#3d3d3d]">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold">Due Date</div>
                <div className="font-bold text-white mt-0.5">{parsedTaskInfo.dueDate}</div>
              </div>
              <div className="bg-[#2d2d2d] p-2.5 rounded border border-[#3d3d3d]">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold">Estimated Time</div>
                <div className="font-bold text-white mt-0.5">{parsedTaskInfo.estTime}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-300 leading-relaxed font-mono">{replanningLog}</p>
          )}
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
          eventClick={handleEventClick}
          eventContent={(eventInfo) => {
            const task = eventInfo.event.extendedProps;
            const isHighPriority = task.priority === 1;

            return (
              <div
                className="w-full h-[24px] px-2 flex items-center text-xs rounded border transition-all duration-200 ease-out cursor-pointer overflow-hidden transform hover:translate-y-1 hover:brightness-125 hover:shadow-md"
                style={{
                  backgroundColor: isHighPriority ? '#fbbf24' : '#2d2d2d',
                  color: isHighPriority ? '#000000' : '#ffffff',
                  borderColor: isHighPriority ? '#f59e0b' : '#4d4d4d',
                }}
                title={eventInfo.event.title}
              >
                <span className="truncate font-medium text-[11px] leading-none">
                  {eventInfo.event.title}
                </span>
              </div>
            );
          }}
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

