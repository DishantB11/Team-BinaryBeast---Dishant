import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchClassroomCourses,
  fetchClassroomMaterials,
  fetchClassroomAssignments,
  requestClassroomAccess,
} from '../../api/googleClassroom';
import type { ClassroomCourse, ClassroomMaterial, ClassroomAssignment, ClassroomAttachment } from '../../types';
import {
  BookOpen,
  FileText,
  Presentation,
  FileCode,
  Link as LinkIcon,
  Video,
  CheckSquare,
  Square,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  FolderOpen,
  Clock,
  AlertCircle,
} from 'lucide-react';

type Tab = 'courses' | 'materials' | 'assignments';

export const ClassroomView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [materials, setMaterials] = useState<ClassroomMaterial[]>([]);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<'all' | 'pdf' | 'ppt' | 'doc' | 'link'>('all');

  // Map of courseId -> courseName for quick lookup
  const coursesMap = useMemo(() => {
    const map: Record<string, string> = {};
    courses.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [courses]);

  // Initial load notice (Do not trigger OAuth popups automatically on mount to avoid popup blocker)
  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      loadCourses();
    } else {
      setStatusLog(`Click "Connect Live Google Account" to authorize Google Classroom API access.`);
    }
  }, []);

  // Fetch materials & assignments whenever selected courses change
  useEffect(() => {
    if (selectedCourseIds.length > 0) {
      loadCourseData(selectedCourseIds);
    } else {
      setMaterials([]);
      setAssignments([]);
    }
  }, [selectedCourseIds]);

  const loadCourses = async () => {
    setIsLoading(true);
    setStatusLog('Connecting to Google Classroom API...');
    try {
      const fetchedCourses = await fetchClassroomCourses();
      setCourses(fetchedCourses);

      // Default to none selected — user picks which courses to sync
      setSelectedCourseIds([]);

      setStatusLog(`✅ Loaded ${fetchedCourses.length} courses. Select the classes you want to sync.`);
    } catch (error: any) {
      console.warn('Google Classroom load error:', error.message);
      setStatusLog(`Click "Connect Live Google Account" to authorize Google Classroom API access.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectOAuth = async () => {
    setIsLoading(true);
    setStatusLog('Requesting Google Classroom OAuth permissions...');
    try {
      await requestClassroomAccess(true);
      await loadCourses();
      setStatusLog('✅ Successfully authorized with Google Classroom API!');
    } catch (error: any) {
      console.error('OAuth authorization error:', error);
      setStatusLog(`OAuth error: ${error.message || 'Permission denied.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseData = async (courseIds: string[]) => {
    setIsLoading(true);
    setStatusLog('Syncing course materials (PDFs/PPTs) and assignments for selected classes...');
    try {
      const [fetchedMaterials, fetchedAssignments] = await Promise.all([
        fetchClassroomMaterials(courseIds, coursesMap),
        fetchClassroomAssignments(courseIds, coursesMap),
      ]);

      console.log('[FocusFlow Classroom Debug] Fetched Raw Materials:', fetchedMaterials);
      console.log('[FocusFlow Classroom Debug] Fetched Assignments:', fetchedAssignments);

      setMaterials(fetchedMaterials);
      setAssignments(fetchedAssignments);
      setStatusLog(
        `Loaded ${fetchedMaterials.length} course material(s) and ${fetchedAssignments.length} assignment(s) for selected classes.`
      );
    } catch (error: any) {
      console.error('Error fetching course data:', error);
      setStatusLog(`Sync error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const toggleSelectAllCourses = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(courses.map((c) => c.id));
    }
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (materialTypeFilter === 'all') return true;
      if (materialTypeFilter === 'pdf') {
        return (
          m.attachments.some((att) => att.type === 'pdf') ||
          m.title.toLowerCase().includes('pdf') ||
          m.title.toLowerCase().includes('syllabus') ||
          m.title.toLowerCase().includes('guide') ||
          m.title.toLowerCase().includes('notes')
        );
      }
      return m.attachments.some((att) => att.type === materialTypeFilter);
    });
  }, [materials, searchQuery, materialTypeFilter]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      return (
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [assignments, searchQuery]);

  // Helper for rendering file icons & badges
  const renderAttachmentIcon = (type: ClassroomAttachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />;
      case 'ppt':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'doc':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      default:
        return <LinkIcon className="w-4 h-4 text-emerald-400" />;
    }
  };

  // Helper for assignment status badge
  const renderAssignmentStatus = (assign: ClassroomAssignment) => {
    const isCompleted = assign.submissionState === 'TURNED_IN' || assign.submissionState === 'RETURNED';

    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    }

    // Check if due date is far away (more than 7 days from now)
    if (assign.dueDate) {
      const dueDate = new Date(assign.dueDate);
      const now = new Date();
      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > 7) {
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Upcoming
          </span>
        );
      }
    }

    // Default: pending (due soon or past due)
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30 px-3 py-1 rounded-full">
        <AlertCircle className="w-3.5 h-3.5" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & OAuth Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Google Classroom Hub</span>
          </h1>
          <p className="text-sm text-[#a0a0a0]">
            Select your active classes, view uploaded PPTs/PDFs, and track course assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleConnectOAuth}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#fbbf24] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Connect Live Google Account</span>
          </button>
        </div>
      </div>

      {/* Status Log Panel */}
      {statusLog && (
        <div className="bg-[#2d2d2d] border border-[#fbbf24]/30 rounded-lg p-3.5 flex gap-3 items-center text-xs text-gray-200">
          <Sparkles className="w-4 h-4 text-[#fbbf24] shrink-0" />
          <span className="font-mono">{statusLog}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs & Global Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3d3d3d] pb-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-[#1e1e1e] p-1 rounded-lg border border-[#3d3d3d]">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'courses'
                ? 'bg-[#fbbf24] text-black shadow'
                : 'text-[#a0a0a0] hover:text-white hover:bg-[#2d2d2d]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Class Selector ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'materials'
                ? 'bg-[#fbbf24] text-black shadow'
                : 'text-[#a0a0a0] hover:text-white hover:bg-[#2d2d2d]'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Course Materials (PDFs/PPTs) ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'assignments'
                ? 'bg-[#fbbf24] text-black shadow'
                : 'text-[#a0a0a0] hover:text-white hover:bg-[#2d2d2d]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Assignments ({assignments.length})</span>
          </button>
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#6b6b6b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials, slides, tasks..."
            className="w-full bg-[#2d2d2d] border border-[#3d3d3d] rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#fbbf24] transition-colors"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COURSE SELECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#a0a0a0]">
              Toggle the classes you want to include in your workspace. Only materials & assignments from selected classes will be shown.
            </p>
            <button
              onClick={toggleSelectAllCourses}
              className="text-xs font-semibold text-[#fbbf24] hover:underline flex items-center gap-1"
            >
              {selectedCourseIds.length === courses.length ? 'Deselect All' : 'Select All Classes'}
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="bg-[#2d2d2d] border border-dashed border-[#3d3d3d] rounded-lg p-12 text-center text-[#a0a0a0] text-sm space-y-3">
              <BookOpen className="w-10 h-10 text-[#6b6b6b] mx-auto" />
              <p className="font-semibold text-white">No active Google Classroom courses loaded.</p>
              <p className="text-xs text-[#6b6b6b] max-w-md mx-auto">
                Authorize your Google account to fetch your enrolled classes directly from the Google Classroom API.
              </p>
              <button
                onClick={handleConnectOAuth}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-[#fbbf24] text-black font-semibold px-4 py-2 rounded-lg text-xs transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Connect Live Google Account</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {courses.map((course) => {
              const isSelected = selectedCourseIds.includes(course.id);
              return (
                <div
                  key={course.id}
                  onClick={() => toggleCourseSelection(course.id)}
                  className={`flex items-center justify-between bg-[#2d2d2d] border rounded-md p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#fbbf24] bg-[#fbbf24]/5 shadow-sm'
                      : 'border-[#3d3d3d] opacity-70 hover:opacity-100 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#fbbf24] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#6b6b6b] shrink-0" />
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-white">{course.name}</h3>
                      <div className="text-[11px] text-[#8b8b8b] flex gap-2 mt-0.5">
                         <span>ID: {course.id}</span>
                         {course.section && <span>• {course.section}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* ========================================================================= */}
      {/* TAB 2: COURSE MATERIALS (PDFs / PPTs / Docs) */}
      {/* ========================================================================= */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* File Type Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#a0a0a0] flex items-center gap-1 font-semibold mr-2">
              <Filter className="w-3.5 h-3.5 text-[#fbbf24]" /> Filter Files:
            </span>
            {(['all', 'pdf', 'ppt', 'doc', 'link'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMaterialTypeFilter(type)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                  materialTypeFilter === type
                    ? 'bg-[#fbbf24] text-black font-semibold'
                    : 'bg-[#2d2d2d] border border-[#3d3d3d] text-[#a0a0a0] hover:text-white'
                }`}
              >
                {type === 'all'
                  ? 'All Materials'
                  : type === 'pdf'
                  ? '📄 PDFs'
                  : type === 'ppt'
                  ? '📊 PPT Slides'
                  : type === 'doc'
                  ? '📝 Documents'
                  : '🔗 Links & Videos'}
              </button>
            ))}
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="bg-[#2d2d2d] border border-dashed border-[#3d3d3d] rounded-lg p-12 text-center text-[#a0a0a0] text-sm">
              <FolderOpen className="w-10 h-10 text-[#6b6b6b] mx-auto mb-2" />
              <p>No course materials found for the selected classes.</p>
              <p className="text-xs text-[#6b6b6b] mt-1">
                Make sure at least one course is selected in the "Class Selector" tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 space-y-3 hover:border-[#fbbf24]/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded border border-[#fbbf24]/20">
                        {mat.courseName}
                      </span>
                      <span className="text-[11px] text-[#6b6b6b]">
                        {new Date(mat.creationTime).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white leading-snug">{mat.title}</h3>

                    {mat.description && (
                      <p className="text-xs text-[#a0a0a0] line-clamp-2 leading-relaxed">{mat.description}</p>
                    )}
                  </div>

                  {/* Attachment Files List */}
                  {mat.attachments && mat.attachments.length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-[#3d3d3d] space-y-2">
                      <span className="text-[11px] font-semibold text-[#a0a0a0] block uppercase tracking-wider">
                        Attached Files ({mat.attachments.length})
                      </span>
                      <div className="space-y-1.5">
                        {mat.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded bg-[#1e1e1e] border border-[#3d3d3d] hover:border-[#fbbf24] text-xs text-gray-200 transition-all group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {renderAttachmentIcon(att.type)}
                              <span className="truncate font-medium group-hover:text-[#fbbf24] transition-colors">
                                {att.title}
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-[#6b6b6b] group-hover:text-[#fbbf24] shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : mat.alternateLink ? (
                    <div className="mt-3 pt-3 border-t border-[#3d3d3d]">
                      <a
                        href={mat.alternateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded bg-[#1e1e1e] border border-[#3d3d3d] hover:border-[#fbbf24] text-xs text-gray-200 transition-all group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-red-400" />
                          <span className="truncate font-medium group-hover:text-[#fbbf24] transition-colors">
                            {mat.title}.pdf
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#6b6b6b] group-hover:text-[#fbbf24] shrink-0 ml-2" />
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ASSIGNMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-[#2d2d2d] border border-dashed border-[#3d3d3d] rounded-lg p-12 text-center text-[#a0a0a0] text-sm">
              <CheckCircle2 className="w-10 h-10 text-[#6b6b6b] mx-auto mb-2" />
              <p>No assignments found for the selected classes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssignments.map((assign) => (
                <div
                  key={assign.id}
                  className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-md p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#fbbf24]/40 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold text-[#fbbf24] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded border border-[#fbbf24]/20 truncate max-w-[150px]">
                        {assign.courseName}
                      </span>
                      {assign.maxPoints && (
                        <span className="text-[9px] text-gray-400 bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#3d3d3d]">
                          {assign.maxPoints} pts
                        </span>
                      )}
                    </div>

                    <h3 className="text-[13px] font-semibold text-white truncate">{assign.title}</h3>

                    {/* Attachments preview */}
                    {assign.attachments.length > 0 && (
                      <div className="flex gap-1.5 items-center flex-wrap pt-1.5">
                        {assign.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] bg-[#1e1e1e] border border-[#3d3d3d] px-1.5 py-0.5 rounded text-gray-300 hover:border-[#fbbf24] transition-all"
                          >
                            {renderAttachmentIcon(att.type)}
                            <span className="truncate max-w-[120px]">{att.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Badge, Due Date & Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 gap-2 mt-2 md:mt-0">
                    {renderAssignmentStatus(assign)}

                    {assign.dueDate && (
                      <div className="text-right flex md:flex-col items-center md:items-end gap-1 md:gap-0">
                        <span className="text-[9px] text-[#6b6b6b] uppercase tracking-wider hidden md:block">Due Date</span>
                        <span className="text-[11px] font-semibold text-[#fbbf24]">
                          {assign.dueDate} {assign.dueTime ? `@ ${assign.dueTime}` : ''}
                        </span>
                      </div>
                    )}

                    {assign.alternateLink && (
                      <a
                        href={assign.alternateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#fbbf24] hover:underline"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
