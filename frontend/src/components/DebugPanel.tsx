import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  uploadPDF,
  generatePlan,
  rescheduleTask,
  updateProgress,
  importFromClassroom,
} from '../api/client';
import { createGoogleCalendarEvents } from '../api/googleCalendar';
import type { Task } from '../types';

// ─── small helpers ────────────────────────────────────────────
const badge = (type: Task['type']) => {
  const map: Record<string, string> = {
    Exam: '#ef4444',
    Assignment: '#f97316',
    'Self-Study': '#3b82f6',
    Lecture: '#8b5cf6',
  };
  return (
    <span
      style={{
        background: map[type] ?? '#6b7280',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        marginLeft: 6,
      }}
    >
      {type}
    </span>
  );
};

const priorityLabel = (p: 1 | 2 | 3) =>
  p === 1 ? '🔴 High' : p === 2 ? '🟡 Medium' : '🟢 Low';

// ─── main component ───────────────────────────────────────────
export const DebugPanel: React.FC = () => {
  const {
    tasks,
    subjects,
    preferences,
    isLoading,
    error,
    heatmapData,
    toggleTaskComplete,
    clearAll,
    setTasks,
    setSubjects,
    setError,
    getTodayTasks,
    getUpcomingExams,
    getTotalStudyHours,
    getCompletedTasksCount,
  } = useStore();

  const [log, setLog] = useState<string[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [classroomInput, setClassroomInput] = useState(
    'Linear Algebra Revision, 2026-08-05\nOOP Assignment, 2026-08-10\nNetworks Quiz, 2026-08-12'
  );

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));

  // ── API testers ───────────────────────────────────────────────
  const handleUploadPDF = async () => {
    setApiLoading(true);
    addLog('📤 Calling uploadPDF (mock)…');
    const fd = new FormData();
    fd.append('modules', '4');
    try {
      const res = await uploadPDF(fd);
      setTasks([...tasks, ...res.tasks]);
      setSubjects([...subjects, ...res.subjects]);
      addLog(`✅ uploadPDF returned ${res.tasks.length} tasks, ${res.subjects.length} subjects`);
    } catch (e: any) {
      addLog(`❌ uploadPDF error: ${e.message}`);
      setError(e.message);
    } finally {
      setApiLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setApiLoading(true);
    addLog('🤖 Calling generatePlan (mock)…');
    try {
      const res = await generatePlan(tasks, preferences);
      setTasks(res.tasks);
      addLog(`✅ generatePlan reasoning: "${res.reasoning.slice(0, 80)}…"`);
    } catch (e: any) {
      addLog(`❌ generatePlan error: ${e.message}`);
    } finally {
      setApiLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (tasks.length === 0) { addLog('⚠️ No tasks to reschedule.'); return; }
    const target = tasks[0];
    const newDate = new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0];
    setApiLoading(true);
    addLog(`🔄 Rescheduling "${target.title}" → ${newDate}…`);
    try {
      const res = await rescheduleTask(target.id, newDate, tasks);
      setTasks(res.tasks);
      addLog(`✅ Reschedule reasoning: "${res.reasoning.slice(0, 80)}…"`);
    } catch (e: any) {
      addLog(`❌ reschedule error: ${e.message}`);
    } finally {
      setApiLoading(false);
    }
  };

  const handleUpdateProgress = async (taskId: string, done: boolean) => {
    addLog(`🔁 updateProgress(${taskId}, ${done})`);
    try {
      const res = await updateProgress(taskId, done);
      addLog(`✅ updateProgress: success=${res.success}`);
    } catch (e: any) {
      addLog(`❌ updateProgress error: ${e.message}`);
    }
  };

  const handleImportClassroom = async () => {
    setApiLoading(true);
    addLog('📥 Calling importFromClassroom (mock)…');
    try {
      const res = await importFromClassroom(classroomInput);
      setTasks([...tasks, ...res.tasks]);
      addLog(`✅ Imported ${res.tasks.length} tasks from classroom`);
    } catch (e: any) {
      addLog(`❌ importFromClassroom error: ${e.message}`);
    } finally {
      setApiLoading(false);
    }
  };

  // ── computed ──────────────────────────────────────────────────
  const todayTasks = getTodayTasks();
  const upcomingExams = getUpcomingExams();
  const totalHours = getTotalStudyHours();
  const completedCount = getCompletedTasksCount();

  // ── styles ────────────────────────────────────────────────────
  const S: Record<string, React.CSSProperties> = {
    root: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: '#0f172a',
      color: '#e2e8f0',
      minHeight: '100vh',
      padding: 24,
      boxSizing: 'border-box',
    },
    header: {
      fontSize: 22,
      fontWeight: 700,
      marginBottom: 4,
      background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subtitle: { fontSize: 13, color: '#64748b', marginBottom: 24 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 },
    card: {
      background: '#1e293b',
      borderRadius: 12,
      padding: 16,
      border: '1px solid #334155',
    },
    cardTitle: { fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' as const },
    statRow: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 12 },
    stat: {
      background: '#0f172a',
      borderRadius: 8,
      padding: '8px 14px',
      flex: 1,
      minWidth: 100,
      textAlign: 'center' as const,
      border: '1px solid #334155',
    },
    statNum: { fontSize: 24, fontWeight: 800, color: '#38bdf8' },
    statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
    btn: {
      background: '#6366f1',
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      marginRight: 8,
      marginBottom: 8,
      transition: 'opacity 0.15s',
    },
    btnDanger: { background: '#ef4444' },
    btnSecondary: { background: '#334155' },
    taskRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 0',
      borderBottom: '1px solid #1e293b',
      fontSize: 13,
    },
    log: {
      background: '#020617',
      borderRadius: 8,
      padding: 12,
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#4ade80',
      maxHeight: 180,
      overflowY: 'auto' as const,
      border: '1px solid #1e293b',
    },
    textarea: {
      width: '100%',
      background: '#0f172a',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: 10,
      fontFamily: 'monospace',
      fontSize: 12,
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const,
      marginBottom: 8,
    },
    pill: {
      background: '#1e3a5f',
      color: '#38bdf8',
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
    },
  };

  return (
    <div style={S.root}>
      <div style={S.header}>🧪 Study Planner — Debug Panel</div>
      <div style={S.subtitle}>
        Dev panel to test Zustand store + all mock API functions. Remove before production.
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div style={S.statRow}>
        {[
          { num: tasks.length, label: 'Total Tasks' },
          { num: completedCount, label: 'Completed' },
          { num: `${totalHours}h`, label: 'Study Hours' },
          { num: upcomingExams.length, label: 'Upcoming Exams' },
          { num: todayTasks.length, label: "Due Today" },
          { num: subjects.length, label: 'Subjects' },
        ].map((s) => (
          <div key={s.label} style={S.stat}>
            <div style={S.statNum}>{s.num}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={S.grid}>
        {/* ── Task List ─────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>📋 All Tasks ({tasks.length})</div>
          {tasks.length === 0 && <div style={{ color: '#64748b', fontSize: 13 }}>No tasks. Try "Generate Plan".</div>}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {tasks.map((t) => (
              <div key={t.id} style={S.taskRow}>
                <input
                  type="checkbox"
                  checked={t.isCompleted}
                  onChange={() => {
                    toggleTaskComplete(t.id);
                    handleUpdateProgress(t.id, !t.isCompleted);
                  }}
                  style={{ accentColor: '#6366f1', width: 16, height: 16, cursor: 'pointer' }}
                />
                <div style={{ flex: 1, opacity: t.isCompleted ? 0.4 : 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, textDecoration: t.isCompleted ? 'line-through' : 'none' }}>
                    {t.title}
                    {badge(t.type)}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>
                    {t.subject} · {t.dueDate} · {priorityLabel(t.priority)} · {t.duration}h
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Subjects ──────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>📚 Subjects</div>
          {subjects.map((s) => (
            <div key={s.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <strong>{s.name}</strong>
                <span style={S.pill}>{s.progress}%</span>
              </div>
              <div style={{ background: '#0f172a', borderRadius: 9999, height: 6, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${s.progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
                    borderRadius: 9999,
                    transition: 'width 0.4s',
                  }}
                />
              </div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>
                {s.totalModules} modules · {s.estimatedHours}h estimated · {s.totalPages} pages
              </div>
            </div>
          ))}

          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #334155' }}>
            <div style={S.cardTitle}>⚙️ Preferences</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              <div>Focus time: <strong style={{ color: '#e2e8f0' }}>{preferences.focusTime}</strong></div>
              <div>Attendance: <strong style={{ color: '#e2e8f0' }}>{preferences.attendance}%</strong></div>
              <div>Goal: <strong style={{ color: '#38bdf8' }}>{preferences.goal}</strong></div>
            </div>
          </div>
        </div>

        {/* ── API Mock Testers ──────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>🔌 API Mock Testers</div>
          {apiLoading && (
            <div style={{ color: '#f97316', fontSize: 12, marginBottom: 8 }}>⏳ Loading…</div>
          )}
          {error && (
            <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>⚠️ {error}</div>
          )}

          <button style={S.btn} onClick={handleUploadPDF} disabled={apiLoading}>
            📤 uploadPDF
          </button>
          <button style={S.btn} onClick={handleGeneratePlan} disabled={apiLoading}>
            🤖 generatePlan
          </button>
          <button style={S.btn} onClick={handleReschedule} disabled={apiLoading}>
            🔄 rescheduleTask
          </button>
          <button
            style={{ ...S.btn, ...S.btnDanger }}
            onClick={() => { clearAll(); addLog('🗑️ Store cleared & reset to mock data'); }}
          >
            🗑️ clearAll
          </button>

          <div style={{ marginTop: 12 }}>
            <div style={{ ...S.cardTitle, marginBottom: 6 }}>📥 Import from Classroom</div>
            <textarea
              style={S.textarea}
              rows={4}
              value={classroomInput}
              onChange={(e) => setClassroomInput(e.target.value)}
              placeholder="Title, YYYY-MM-DD (one per line)"
            />
            <button style={{ ...S.btn, ...S.btnSecondary }} onClick={handleImportClassroom} disabled={apiLoading}>
              📥 importFromClassroom
            </button>
          </div>
        </div>

        {/* ── Heatmap Data ──────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>🗓️ Heatmap Data (last 7 entries)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {heatmapData.slice(-7).map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} sessions`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: `rgba(99, 102, 241, ${Math.min(d.count / 8, 1)})`,
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: '#e2e8f0',
                  cursor: 'default',
                }}
              >
                {d.count}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Hover squares to see date. Opacity = intensity.
          </div>

          {/* Today / Upcoming Exams quick view */}
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #334155' }}>
            <div style={S.cardTitle}>📅 Due Today ({todayTasks.length})</div>
            {todayTasks.length === 0
              ? <div style={{ color: '#64748b', fontSize: 12 }}>Nothing due today 🎉</div>
              : todayTasks.map((t) => (
                  <div key={t.id} style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 2 }}>
                    • {t.subject}: {t.title}
                  </div>
                ))}
          </div>

          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #334155' }}>
            <div style={S.cardTitle}>🎯 Upcoming Exams ({upcomingExams.length})</div>
            {upcomingExams.map((t) => (
              <div key={t.id} style={{ fontSize: 12, color: '#fbbf24', marginBottom: 2 }}>
                📌 {t.subject}: {t.title} — {t.dueDate}
              </div>
            ))}
          </div>
        </div>

        {/* ── Log ───────────────────────────────────────────── */}
        <div style={{ ...S.card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={S.cardTitle}>🖥️ Console Log</div>
            <button style={{ ...S.btn, ...S.btnSecondary, padding: '4px 10px', marginBottom: 0 }} onClick={() => setLog([])}>
              Clear
            </button>
          </div>
          <div style={S.log}>
            {log.length === 0
              ? <div style={{ color: '#334155' }}>No logs yet. Click an API button above.</div>
              : log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
