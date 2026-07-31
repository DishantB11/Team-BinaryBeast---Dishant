import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchClassroomCourses,
  fetchClassroomMaterials,
  fetchClassroomAssignments,
  requestClassroomAccess,
  resetClassroomAccessToken,
} from '../../api/googleClassroom';
import type { ClassroomCourse, ClassroomMaterial, ClassroomAssignment, ClassroomAttachment } from '../../types';

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
      // Auto-select all courses after connecting (consistent with reference project)
      const activeIds = fetchedCourses.filter((c) => c.isSelected !== false).map((c) => c.id);
      setSelectedCourseIds(activeIds.length > 0 ? activeIds : fetchedCourses.map((c) => c.id));
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
      // Clear any stale/expired cached token so the Google Account picker is always shown
      resetClassroomAccessToken();
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

  // Helper for rendering file type icon
  const getAttachmentIcon = (type: ClassroomAttachment['type']) => {
    switch (type) {
      case 'pdf': return { icon: 'picture_as_pdf', color: '#f87171' };
      case 'ppt': return { icon: 'slideshow', color: '#fbbf24' };
      case 'doc': return { icon: 'description', color: '#60a5fa' };
      case 'video': return { icon: 'play_circle', color: '#c084fc' };
      default: return { icon: 'link', color: '#34d399' };
    }
  };

  // Helper for assignment status badge
  const renderAssignmentStatus = (assign: ClassroomAssignment) => {
    const isCompleted = assign.submissionState === 'TURNED_IN' || assign.submissionState === 'RETURNED';

    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-sm"
          style={{ backgroundColor: '#d5e7d7', color: '#0f1f15', border: '1px solid #8ea091' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          Completed
        </span>
      );
    }

    if (assign.dueDate) {
      const dueDate = new Date(assign.dueDate);
      const now = new Date();
      const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays > 7) {
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-sm"
            style={{ backgroundColor: '#252525', color: '#c8c6c5', border: '1px solid #434843' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
            Upcoming
          </span>
        );
      }
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-sm"
        style={{ backgroundColor: '#ffdad6', color: '#690005', border: '1px solid #ffb4ab' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>warning</span>
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6 font-body">
      {/* Top Header & OAuth Bar */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-[40px] leading-tight tracking-tight text-[#e4e2e0]">
            Google Classroom Hub
          </h2>
          <p className="text-[#a0a0a0] mt-1 text-base">
            Select your active classes, view uploaded PPTs/PDFs, and track course assignments.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleConnectOAuth}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#8ea091] text-[#121212] font-semibold px-4 py-2 rounded-sm text-sm transition-all hover:bg-[#9eb0a1] disabled:opacity-50 cursor-pointer shrink-0"
          >
            <span className={`material-symbols-outlined icon-sm ${isLoading ? 'animate-spin' : ''}`}>
              {isLoading ? 'sync' : 'account_circle'}
            </span>
            <span>Connect Live Google Account</span>
          </button>
        </div>
      </div>

      {/* Status Log Panel */}
      {statusLog && (
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-3.5 flex gap-3 items-center">
          <span className="material-symbols-outlined icon-sm text-[#8ea091] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            smart_toy
          </span>
          <span className="text-xs text-[#c8c6c5] font-mono">{statusLog}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs & Global Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2a2a2a] pb-4">
        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-[#1e1e1e] p-1 rounded-sm border border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-semibold transition-all ${activeTab === 'courses'
                ? 'bg-[#8ea091] text-[#121212]'
                : 'text-[#a0a0a0] hover:text-[#e4e2e0] hover:bg-[#2a2a2a]'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>menu_book</span>
            <span>Class Selector ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-semibold transition-all ${activeTab === 'materials'
                ? 'bg-[#8ea091] text-[#121212]'
                : 'text-[#a0a0a0] hover:text-[#e4e2e0] hover:bg-[#2a2a2a]'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>folder_open</span>
            <span>Materials ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-semibold transition-all ${activeTab === 'assignments'
                ? 'bg-[#8ea091] text-[#121212]'
                : 'text-[#a0a0a0] hover:text-[#e4e2e0] hover:bg-[#2a2a2a]'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>checklist</span>
            <span>Assignments ({assignments.length})</span>
          </button>
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined icon-sm text-[#6b6b6b] absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials, slides, tasks..."
            className="w-full bg-[#2a2a2a] border border-[#333333] rounded-sm py-1.5 pl-9 pr-3 text-xs text-[#e4e2e0] placeholder-[#6b6b6b] focus:outline-none focus:border-[#8ea091] transition-colors"
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
              Toggle the classes you want to include in your workspace. Only materials &amp; assignments from selected classes will be shown.
            </p>
            <button
              onClick={toggleSelectAllCourses}
              className="text-xs font-semibold text-[#8ea091] hover:underline flex items-center gap-1 shrink-0 ml-4"
            >
              {selectedCourseIds.length === courses.length ? 'Deselect All' : 'Select All Classes'}
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="bg-[#1e1e1e] border border-dashed border-[#2a2a2a] rounded-sm p-12 text-center text-[#a0a0a0] text-sm space-y-3">
              <span className="material-symbols-outlined text-[#6b6b6b] block mx-auto" style={{ fontSize: '40px' }}>school</span>
              <p className="font-semibold text-[#e4e2e0]">No active Google Classroom courses loaded.</p>
              <p className="text-xs text-[#6b6b6b] max-w-md mx-auto">
                Authorize your Google account to fetch your enrolled classes directly from the Google Classroom API.
              </p>
              <button
                onClick={handleConnectOAuth}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-[#8ea091] text-[#121212] font-semibold px-4 py-2 rounded-sm text-xs transition-all hover:bg-[#9eb0a1] disabled:opacity-50 cursor-pointer"
              >
                <span className={`material-symbols-outlined icon-sm ${isLoading ? 'animate-spin' : ''}`}>
                  {isLoading ? 'sync' : 'account_circle'}
                </span>
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
                    className={`flex items-center justify-between bg-[#1e1e1e] border rounded-sm p-3 cursor-pointer transition-all ${isSelected
                        ? 'border-[#8ea091] bg-[#222824]'
                        : 'border-[#2a2a2a] opacity-70 hover:opacity-100 hover:border-[#333333]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="material-symbols-outlined shrink-0"
                        style={{
                          fontSize: '18px',
                          color: isSelected ? '#8ea091' : '#6b6b6b',
                          fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-[#e4e2e0]">{course.name}</h3>
                        <div className="text-[11px] text-[#6b6b6b] flex gap-2 mt-0.5">
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
            <span className="text-[#a0a0a0] flex items-center gap-1 font-semibold mr-2 font-label uppercase tracking-wider">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#8ea091' }}>filter_list</span>
              Filter Files:
            </span>
            {(['all', 'pdf', 'ppt', 'doc', 'link'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMaterialTypeFilter(type)}
                className={`px-3 py-1 rounded-sm capitalize font-medium transition-all ${materialTypeFilter === type
                    ? 'bg-[#8ea091] text-[#121212] font-semibold'
                    : 'bg-[#2a2a2a] border border-[#333333] text-[#a0a0a0] hover:text-[#e4e2e0]'
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
            <div className="bg-[#1e1e1e] border border-dashed border-[#2a2a2a] rounded-sm p-12 text-center text-[#a0a0a0] text-sm">
              <span className="material-symbols-outlined text-[#6b6b6b] block mx-auto mb-2" style={{ fontSize: '40px' }}>folder_open</span>
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
                  className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 space-y-3 hover:border-[#8ea091]/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm font-label"
                        style={{ backgroundColor: '#222824', color: '#8ea091', border: '1px solid #3a4b3e' }}
                      >
                        {mat.courseName}
                      </span>
                      <span className="text-[11px] text-[#6b6b6b]">
                        {new Date(mat.creationTime).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[#e4e2e0] leading-snug">{mat.title}</h3>

                    {mat.description && (
                      <p className="text-xs text-[#a0a0a0] line-clamp-2 leading-relaxed">{mat.description}</p>
                    )}
                  </div>

                  {/* Attachment Files List */}
                  {mat.attachments && mat.attachments.length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a] space-y-2">
                      <span className="text-[11px] font-semibold text-[#a0a0a0] block uppercase tracking-wider font-label">
                        Attached Files ({mat.attachments.length})
                      </span>
                      <div className="space-y-1.5">
                        {mat.attachments.map((att, i) => {
                          const { icon, color } = getAttachmentIcon(att.type);
                          return (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 rounded-sm bg-[#2a2a2a] border border-[#333333] hover:border-[#8ea091] text-xs text-[#c8c6c5] transition-all group"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="material-symbols-outlined shrink-0" style={{ fontSize: '16px', color, fontVariationSettings: "'FILL' 1" }}>
                                  {icon}
                                </span>
                                <span className="truncate font-medium group-hover:text-[#8ea091] transition-colors">
                                  {att.title}
                                </span>
                              </div>
                              <span className="material-symbols-outlined text-[#6b6b6b] group-hover:text-[#8ea091] shrink-0 ml-2" style={{ fontSize: '14px' }}>
                                open_in_new
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : mat.alternateLink ? (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                      <a
                        href={mat.alternateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-sm bg-[#2a2a2a] border border-[#333333] hover:border-[#8ea091] text-xs text-[#c8c6c5] transition-all group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="material-symbols-outlined shrink-0" style={{ fontSize: '16px', color: '#f87171', fontVariationSettings: "'FILL' 1" }}>
                            picture_as_pdf
                          </span>
                          <span className="truncate font-medium group-hover:text-[#8ea091] transition-colors">
                            {mat.title}.pdf
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-[#6b6b6b] group-hover:text-[#8ea091] shrink-0 ml-2" style={{ fontSize: '14px' }}>
                          open_in_new
                        </span>
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
            <div className="bg-[#1e1e1e] border border-dashed border-[#2a2a2a] rounded-sm p-12 text-center text-[#a0a0a0] text-sm">
              <span className="material-symbols-outlined text-[#6b6b6b] block mx-auto mb-2" style={{ fontSize: '40px' }}>task_alt</span>
              <p>No assignments found for the selected classes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssignments.map((assign) => (
                <div
                  key={assign.id}
                  className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#333333] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-label truncate max-w-[150px]"
                        style={{ backgroundColor: '#222824', color: '#8ea091', border: '1px solid #3a4b3e' }}
                      >
                        {assign.courseName}
                      </span>
                      {assign.maxPoints && (
                        <span className="text-[9px] text-[#6b6b6b] bg-[#2a2a2a] px-1.5 py-0.5 rounded-sm border border-[#333333]">
                          {assign.maxPoints} pts
                        </span>
                      )}
                    </div>

                    <h3 className="text-[13px] font-semibold text-[#e4e2e0] truncate">{assign.title}</h3>

                    {/* Attachments preview */}
                    {assign.attachments.length > 0 && (
                      <div className="flex gap-1.5 items-center flex-wrap pt-1.5">
                        {assign.attachments.map((att, idx) => {
                          const { icon, color } = getAttachmentIcon(att.type);
                          return (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-[#2a2a2a] border border-[#333333] px-1.5 py-0.5 rounded-sm text-[#a0a0a0] hover:border-[#8ea091] transition-all"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '12px', color, fontVariationSettings: "'FILL' 1" }}>
                                {icon}
                              </span>
                              <span className="truncate max-w-[120px]">{att.title}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Status Badge, Due Date & Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 gap-2 mt-2 md:mt-0">
                    {renderAssignmentStatus(assign)}

                    {assign.dueDate && (
                      <div className="text-right flex md:flex-col items-center md:items-end gap-1 md:gap-0">
                        <span className="text-[9px] text-[#6b6b6b] uppercase tracking-wider hidden md:block">Due Date</span>
                        <span className="text-[11px] font-semibold text-[#8ea091]">
                          {assign.dueDate} {assign.dueTime ? `@ ${assign.dueTime}` : ''}
                        </span>
                      </div>
                    )}

                    {assign.alternateLink && (
                      <a
                        href={assign.alternateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8ea091] hover:underline"
                      >
                        <span>Open</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
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
