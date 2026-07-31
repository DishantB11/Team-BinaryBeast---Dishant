import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useStore } from '../../store/useStore';
import { rescheduleTask } from '../../api/client';
import { createGoogleCalendarEvents, fetchGoogleCalendarEvents } from '../../api/googleCalendar';

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
    backgroundColor: task.priority === 1 ? '#8ea091' : '#2a2a2a',
    borderColor:     task.priority === 1 ? '#8ea091' : '#333333',
    textColor:       task.priority === 1 ? '#121212' : '#e4e2e0',
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

  // Sync to/from Google Calendar
  const handleSyncGoogleCalendar = async () => {
    setIsSyncingGoogle(true);
    setReplanningLog('Connecting to Google Calendar & fetching remote events...');

    try {
      const remoteTasks = await fetchGoogleCalendarEvents();
      const existingTaskTitles = new Set(tasks.map((t) => `${t.dueDate}:${t.title.toLowerCase()}`));
      const newImportedTasks = remoteTasks.filter(
        (rt) => !existingTaskTitles.has(`${rt.dueDate}:${rt.title.toLowerCase()}`) && !tasks.some((t) => t.id === rt.id)
      );
      const mergedTasks = [...tasks, ...newImportedTasks];
      const localTasksToExport = tasks.filter((t) => !t.id.startsWith('gcal-'));
      let exportedCount = 0;
      if (localTasksToExport.length > 0) {
        const synced = await createGoogleCalendarEvents(localTasksToExport);
        exportedCount = synced.length;
      }
      setTasks(mergedTasks);
      setReplanningLog(`✅ Bidirectional Sync Complete! Imported ${newImportedTasks.length} Google Calendar event(s) & exported ${exportedCount} study session(s).`);
    } catch (error: any) {
      console.error('Google Calendar sync error:', error);
      setReplanningLog(`⚠️ Google Calendar sync: ${error.message || 'Permission requested or failed.'}`);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-[40px] leading-tight tracking-tight text-[#e4e2e0]">
            Interactive Calendar
          </h2>
          <p className="text-[#a0a0a0] mt-1 text-base">
            Drag and drop scheduled sessions. Conflicts resolve automatically.
          </p>
        </div>

        <button
          onClick={handleSyncGoogleCalendar}
          disabled={isSyncingGoogle}
          className="flex items-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#8ea091] text-[#e4e2e0] px-4 py-2 rounded-sm text-sm font-medium transition-all shrink-0 disabled:opacity-50 cursor-pointer mt-2"
        >
          <span
            className={`material-symbols-outlined icon-sm text-[#8ea091] ${isSyncingGoogle ? 'animate-spin' : ''}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isSyncingGoogle ? 'sync' : 'calendar_month'}
          </span>
          <span>{isSyncingGoogle ? 'Syncing...' : 'Sync to Google Calendar'}</span>
        </button>
      </div>

      {/* Reasoning panel */}
      {replanningLog && (
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-4 transition-all duration-200">
          <div className="flex items-center gap-2 mb-3 border-b border-[#2a2a2a] pb-2">
            <span className="material-symbols-outlined icon-sm text-[#8ea091] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              smart_toy
            </span>
            <span className="text-[10px] font-semibold text-[#8ea091] tracking-widest uppercase font-label">
              Reasoning Engine
            </span>
          </div>

          {parsedTaskInfo ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-[#2a2a2a] p-2.5 rounded-sm border border-[#333333]">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold font-label">Subject</div>
                <div className="font-bold text-[#e4e2e0] truncate mt-0.5">{parsedTaskInfo.subject}</div>
              </div>
              <div className="bg-[#2a2a2a] p-2.5 rounded-sm border border-[#333333] col-span-2 md:col-span-1">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold font-label">Topic</div>
                <div className="font-bold text-[#e4e2e0] truncate mt-0.5" title={parsedTaskInfo.topic}>{parsedTaskInfo.topic}</div>
              </div>
              <div className="bg-[#2a2a2a] p-2.5 rounded-sm border border-[#333333]">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold font-label">Priority</div>
                <div className="font-bold text-[#8ea091] mt-0.5">{parsedTaskInfo.priority}</div>
              </div>
              <div className="bg-[#2a2a2a] p-2.5 rounded-sm border border-[#333333]">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold font-label">Due Date</div>
                <div className="font-bold text-[#e4e2e0] mt-0.5">{parsedTaskInfo.dueDate}</div>
              </div>
              <div className="bg-[#2a2a2a] p-2.5 rounded-sm border border-[#333333]">
                <div className="text-[10px] text-[#a0a0a0] uppercase font-semibold font-label">Estimated Time</div>
                <div className="font-bold text-[#e4e2e0] mt-0.5">{parsedTaskInfo.estTime}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#c8c6c5] leading-relaxed font-mono">{replanningLog}</p>
          )}
        </div>
      )}

      {/* Calendar Wrap */}
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-6 relative">
        {isUpdating && (
          <div className="absolute inset-0 bg-[#121212]/70 rounded-sm flex items-center justify-center z-50">
            <div className="flex items-center gap-3 bg-[#1e1e1e] border border-[#2a2a2a] px-4 py-2.5 rounded-sm text-sm text-[#e4e2e0]">
              <span className="material-symbols-outlined icon-sm text-[#8ea091] animate-spin">sync</span>
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
