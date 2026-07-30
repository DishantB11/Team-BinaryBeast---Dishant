import axios, { AxiosInstance } from 'axios';
import { Task, PlanResponse, RescheduleResponse } from '../types';

// ============================================================
// 🔌 REAL AXIOS INSTANCE (for when backend is ready)
// ============================================================
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// 🎭 MOCK FUNCTIONS (with setTimeout to simulate network)
// ============================================================

const delay = (ms: number = 800) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * MOCK: Upload PDF and extract syllabus info
 * Expects FormData with 'file' and 'modules' field
 */
export const uploadPDF = async (formData: FormData): Promise<{ tasks: Task[]; subjects: any[] }> => {
  await delay(1200); // Simulate parsing delay

  const modulesCount = parseInt(formData.get('modules') as string) || 5;

  // Return extracted tasks (normally the backend would parse this)
  return {
    tasks: [
      {
        id: `extracted-${Date.now()}-1`,
        subject: 'Computer Networks',
        title: 'OSI Model',
        type: 'Self-Study',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        duration: 2,
        priority: 2,
        isCompleted: false,
        estimatedHours: 4,
        module: `Module 1 of ${modulesCount}`,
      },
      {
        id: `extracted-${Date.now()}-2`,
        subject: 'Computer Networks',
        title: 'TCP/IP Quiz',
        type: 'Assignment',
        dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        duration: 1.5,
        priority: 1,
        isCompleted: false,
        estimatedHours: 3,
        module: `Module 2 of ${modulesCount}`,
      },
    ],
    subjects: [
      { name: 'Computer Networks', totalModules: modulesCount, totalPages: 150, estimatedHours: 20, progress: 0 },
    ],
  };
};

/**
 * MOCK: Generate a study plan from tasks + preferences
 */
export const generatePlan = async (tasks: Task[], preferences: any): Promise<PlanResponse> => {
  await delay(1500);

  // Simulate AI planning: just return the tasks with a reasoning string
  const sorted = [...tasks].sort((a, b) => a.priority - b.priority);
  
  return {
    tasks: sorted.map((t, idx) => ({
      ...t,
      // Spread them across the next 7 days
      dueDate: new Date(Date.now() + (idx + 1) * 86400000).toISOString().split('T')[0],
    })),
    reasoning:
      `I've prioritized subjects based on your "${preferences.goal || 'Mastery'}" goal. ` +
      `Morning focus hours allocated to high-priority tasks. ` +
      `Attendance at ${preferences.attendance || 80}% suggests you need to attend lectures for low-attendance subjects.`,
  };
};

/**
 * MOCK: Reschedule a task (Adaptive Replanning)
 */
export const rescheduleTask = async (taskId: string, newDate: string, currentTasks: Task[]): Promise<RescheduleResponse> => {
  await delay(1000);

  // Update the task's due date
  const updatedTasks = currentTasks.map((t) =>
    t.id === taskId ? { ...t, dueDate: newDate } : t
  );

  // If there's a conflict at the new date, shift the conflicting task by +1 day
  const conflicting = updatedTasks.find((t) => t.id !== taskId && t.dueDate === newDate);
  if (conflicting) {
    const newDateObj = new Date(newDate);
    newDateObj.setDate(newDateObj.getDate() + 1);
    const shiftedDate = newDateObj.toISOString().split('T')[0];
    updatedTasks.forEach((t) => {
      if (t.id === conflicting.id) {
        t.dueDate = shiftedDate;
      }
    });
  }

  return {
    tasks: updatedTasks,
    reasoning:
      `Moved "${currentTasks.find(t => t.id === taskId)?.title}" to ${newDate}. ` +
      `Detected a conflict, so I shifted "${conflicting?.title}" to the next day. ` +
      `Your schedule is now conflict-free.`,
  };
};

/**
 * MOCK: Update task progress (toggle complete)
 */
export const updateProgress = async (taskId: string, isCompleted: boolean): Promise<{ success: boolean }> => {
  await delay(500);
  return { success: true };
};

/**
 * MOCK: Import from Google Classroom (fake pasted data)
 */
export const importFromClassroom = async (pastedText: string): Promise<{ tasks: Task[] }> => {
  await delay(800);

  // Simple parser: expect "Title, YYYY-MM-DD" per line
  const lines = pastedText.split('\n').filter((line) => line.trim() !== '');
  const tasks: Task[] = lines.map((line, idx) => {
    const [title, date] = line.split(',').map((s) => s.trim());
    return {
      id: `classroom-${Date.now()}-${idx}`,
      subject: 'Imported',
      title: title || 'Untitled Assignment',
      type: 'Assignment',
      dueDate: date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      duration: 2,
      priority: 2,
      isCompleted: false,
      estimatedHours: 3,
      module: 'Imported',
    };
  });

  return { tasks };
};

// ============================================================
// 📡 REAL API CALLS (for when backend is ready - just uncomment)
// ============================================================
/*
export const uploadPDF = async (formData: FormData) => {
  const response = await apiClient.post('/upload_pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const generatePlan = async (tasks: Task[], preferences: any) => {
  const response = await apiClient.post('/generate_plan', { tasks, preferences });
  return response.data;
};

export const rescheduleTask = async (taskId: string, newDate: string, currentTasks: Task[]) => {
  const response = await apiClient.post('/reschedule', { taskId, newDate, currentTasks });
  return response.data;
};

export const updateProgress = async (taskId: string, isCompleted: boolean) => {
  const response = await apiClient.post('/update_progress', { taskId, isCompleted });
  return response.data;
};

export const importFromClassroom = async (pastedText: string) => {
  const response = await apiClient.post('/import_classroom', { pastedText });
  return response.data;
};
*/
