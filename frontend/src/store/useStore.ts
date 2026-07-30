import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Subject, UserPreferences } from '../types';

interface AppState {
  // --- State ---
  tasks: Task[];
  subjects: Subject[];
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  selectedTaskId: string | null;
  heatmapData: { date: string; count: number }[];

  // --- Actions ---
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskComplete: (id: string) => void;
  setSubjects: (subjects: Subject[]) => void;
  updateSubjectProgress: (subjectName: string, progress: number) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTask: (id: string | null) => void;
  clearAll: () => void;

  // --- Computed (selectors in zustand v4+) ---
  getTodayTasks: () => Task[];
  getUpcomingExams: () => Task[];
  getTotalStudyHours: () => number;
  getCompletedTasksCount: () => number;
}

// 🧪 MOCK DATA GENERATOR
const generateMockTasks = (): Task[] => {
  const today = new Date();
  const formatDate = (daysFromNow: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'task-1',
      subject: 'Data Structures',
      title: 'Arrays and Linked Lists',
      type: 'Self-Study',
      dueDate: formatDate(2),
      duration: 2,
      priority: 1,
      isCompleted: false,
      estimatedHours: 4,
      module: 'Module 1',
    },
    {
      id: 'task-2',
      subject: 'Data Structures',
      title: 'Trees and Graphs Quiz',
      type: 'Assignment',
      dueDate: formatDate(5),
      duration: 1.5,
      priority: 2,
      isCompleted: false,
      estimatedHours: 3,
      module: 'Module 2',
    },
    {
      id: 'task-3',
      subject: 'Algorithms',
      title: 'Dynamic Programming',
      type: 'Self-Study',
      dueDate: formatDate(3),
      duration: 3,
      priority: 1,
      isCompleted: false,
      estimatedHours: 6,
      module: 'Module 3',
    },
    {
      id: 'task-4',
      subject: 'Algorithms',
      title: 'Final Exam Prep',
      type: 'Exam',
      dueDate: formatDate(10),
      duration: 4,
      priority: 1,
      isCompleted: false,
      estimatedHours: 12,
      module: 'All Modules',
    },
    {
      id: 'task-5',
      subject: 'Operating Systems',
      title: 'Process Scheduling',
      type: 'Self-Study',
      dueDate: formatDate(1),
      duration: 1.5,
      priority: 2,
      isCompleted: false,
      estimatedHours: 3,
      module: 'Module 1',
    },
    {
      id: 'task-6',
      subject: 'Operating Systems',
      title: 'Memory Management Assignment',
      type: 'Assignment',
      dueDate: formatDate(7),
      duration: 2.5,
      priority: 3,
      isCompleted: false,
      estimatedHours: 5,
      module: 'Module 2',
    },
    {
      id: 'task-7',
      subject: 'Math',
      title: 'Linear Algebra Review',
      type: 'Self-Study',
      dueDate: formatDate(4),
      duration: 2,
      priority: 1,
      isCompleted: true, // ✅ Already completed
      estimatedHours: 3,
      module: 'Module 1',
    },
    {
      id: 'task-8',
      subject: 'Math',
      title: 'Probability Quiz',
      type: 'Exam',
      dueDate: formatDate(12),
      duration: 3,
      priority: 1,
      isCompleted: false,
      estimatedHours: 8,
      module: 'Module 2',
    },
  ];
};

const defaultPreferences: UserPreferences = {
  focusTime: 'Morning',
  attendance: 80,
  goal: 'Mastery',
};

// 🏪 THE ZUSTAND STORE
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- Initial State ---
      tasks: generateMockTasks(),
      subjects: [
        { name: 'Data Structures', totalModules: 3, totalPages: 120, estimatedHours: 15, progress: 30 },
        { name: 'Algorithms', totalModules: 4, totalPages: 180, estimatedHours: 22, progress: 20 },
        { name: 'Operating Systems', totalModules: 3, totalPages: 100, estimatedHours: 12, progress: 40 },
        { name: 'Math', totalModules: 2, totalPages: 80, estimatedHours: 10, progress: 60 },
      ],
      preferences: defaultPreferences,
      isLoading: false,
      error: null,
      selectedTaskId: null,
      heatmapData: [
        { date: '2026-07-20', count: 3 },
        { date: '2026-07-21', count: 5 },
        { date: '2026-07-22', count: 2 },
        { date: '2026-07-23', count: 7 },
        { date: '2026-07-24', count: 4 },
        { date: '2026-07-25', count: 6 },
        { date: '2026-07-26', count: 1 },
      ],

      // --- Actions ---
      setTasks: (tasks) => set({ tasks }),
      
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      toggleTaskComplete: (id) =>
        set((state) => {
          const updatedTasks = state.tasks.map((t) =>
            t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
          );
          // Also update the heatmap when a task is completed
          const task = updatedTasks.find((t) => t.id === id);
          if (task && task.isCompleted) {
            const today = new Date().toISOString().split('T')[0];
            const existing = state.heatmapData.find((d) => d.date === today);
            if (existing) {
              existing.count += 1;
            } else {
              state.heatmapData.push({ date: today, count: 1 });
            }
          }
          return { tasks: updatedTasks };
        }),

      setSubjects: (subjects) => set({ subjects }),
      
      updateSubjectProgress: (subjectName, progress) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.name === subjectName ? { ...s, progress } : s
          ),
        })),

      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setSelectedTask: (selectedTaskId) => set({ selectedTaskId }),
      
      clearAll: () =>
        set({
          tasks: generateMockTasks(),
          subjects: [],
          preferences: defaultPreferences,
          error: null,
          selectedTaskId: null,
        }),

      // --- Selectors (Computed Properties) ---
      getTodayTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().tasks.filter((t) => t.dueDate === today && !t.isCompleted);
      },

      getUpcomingExams: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().tasks.filter((t) => t.type === 'Exam' && t.dueDate >= today);
      },

      getTotalStudyHours: () => {
        return get().tasks.reduce((sum, t) => sum + t.duration, 0);
      },

      getCompletedTasksCount: () => {
        return get().tasks.filter((t) => t.isCompleted).length;
      },
    }),
    {
      name: 'study-planner-storage', // Key in localStorage
      partialize: (state) => ({
        tasks: state.tasks,
        subjects: state.subjects,
        preferences: state.preferences,
        heatmapData: state.heatmapData,
      }), // Only persist these fields (don't persist isLoading/error)
    }
  )
);
