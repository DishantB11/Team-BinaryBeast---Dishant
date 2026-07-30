export interface Task {
  id: string;
  subject: string;
  title: string;
  type: 'Exam' | 'Assignment' | 'Self-Study' | 'Lecture';
  dueDate: string; // YYYY-MM-DD
  duration: number; // hours
  priority: 1 | 2 | 3; // 1 = highest priority
  isCompleted: boolean;
  estimatedHours: number;
  module?: string; // e.g., "Module 1"
}

export interface Subject {
  name: string;
  totalModules: number;
  totalPages: number;
  estimatedHours: number;
  progress: number; // 0-100
}

export interface UserPreferences {
  focusTime: 'Morning' | 'Evening' | 'Night';
  attendance: number; // 0-100
  goal: 'Finish Early' | 'Mastery' | 'Just Pass';
}

export interface PlanResponse {
  tasks: Task[];
  reasoning: string; // The "why" behind the schedule
}

export interface RescheduleResponse {
  tasks: Task[];
  reasoning: string;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  courseGroupEmail?: string;
  alternateLink?: string;
  isSelected?: boolean;
}

export interface ClassroomAttachment {
  title: string;
  url: string;
  type: 'pdf' | 'ppt' | 'doc' | 'drive' | 'link' | 'video';
  thumbnailUrl?: string;
}

export interface ClassroomMaterial {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  creationTime: string;
  alternateLink?: string;
  attachments: ClassroomAttachment[];
}

export interface ClassroomAssignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  maxPoints?: number;
  alternateLink?: string;
  attachments: ClassroomAttachment[];
  state?: 'PUBLISHED' | 'DRAFT';
  submissionState?: 'TURNED_IN' | 'RETURNED' | 'NEW' | 'CREATED' | 'RECLAIMED_BY_STUDENT';
}

