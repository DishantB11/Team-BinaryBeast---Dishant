import type { ClassroomCourse, ClassroomMaterial, ClassroomAssignment, ClassroomAttachment } from '../types';

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1';

let gisScriptPromise: Promise<void> | null = null;
let cachedAccessToken: string | null = null;

const getGoogleClientId = () => import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const loadGoogleIdentityServices = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity script.'));
    document.head.appendChild(script);
  });

  return gisScriptPromise;
};

export const resetClassroomAccessToken = () => {
  cachedAccessToken = null;
};

export const requestClassroomAccess = async (forcePrompt = false): Promise<string> => {
  if (cachedAccessToken) return cachedAccessToken;

  const clientId = getGoogleClientId();
  if (!clientId || clientId.includes('your-google-oauth-client-id')) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID in .env.local file.');
  }

  await loadGoogleIdentityServices();

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: CLASSROOM_SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Google Classroom OAuth permission not granted.'));
          return;
        }

        cachedAccessToken = response.access_token;
        resolve(response.access_token);
      },
    });

    if (!tokenClient) {
      reject(new Error('Google OAuth client unavailable.'));
      return;
    }

    if (forcePrompt) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

/**
 * Helper to determine attachment file type (PDF, PPT, Doc, Link, Video)
 */
const parseAttachment = (mat: any): ClassroomAttachment | null => {
  const fileObj = mat.driveFile?.driveFile || mat.driveFile || mat.file || mat;
  if (fileObj) {
    const title = fileObj.title || fileObj.name || mat.title || 'Attached Document';
    const url = fileObj.alternateLink || fileObj.url || fileObj.webViewLink || mat.alternateLink || '#';
    const mime = (fileObj.mimeType || '').toLowerCase();
    const lowerTitle = title.toLowerCase();

    let type: ClassroomAttachment['type'] = 'pdf';

    if (
      lowerTitle.endsWith('.ppt') ||
      lowerTitle.endsWith('.pptx') ||
      mime.includes('presentation') ||
      mime.includes('powerpoint') ||
      lowerTitle.includes('slide') ||
      lowerTitle.includes('presentation')
    ) {
      type = 'ppt';
    } else if (
      lowerTitle.endsWith('.doc') ||
      lowerTitle.endsWith('.docx') ||
      mime.includes('document') ||
      mime.includes('word')
    ) {
      type = 'doc';
    } else if (
      lowerTitle.endsWith('.pdf') ||
      mime.includes('pdf') ||
      lowerTitle.includes('pdf') ||
      lowerTitle.includes('syllabus') ||
      lowerTitle.includes('guide') ||
      lowerTitle.includes('notes') ||
      lowerTitle.includes('manual') ||
      lowerTitle.includes('chapter') ||
      lowerTitle.includes('unit') ||
      lowerTitle.includes('assignment')
    ) {
      type = 'pdf';
    }

    // Fallback: if no specific mimeType matched, treat generic files as 'pdf' or 'doc' so they are displayed
    if (!type) {
      type = 'pdf';
    }

    return {
      title,
      url,
      type,
      thumbnailUrl: fileObj.thumbnailUrl,
    };
  }

  if (mat.link) {
    const title = mat.link.title || mat.link.url || 'Web Link';
    const url = mat.link.url || '#';
    const lower = (title + ' ' + url).toLowerCase();
    let type: ClassroomAttachment['type'] = 'link';

    if (lower.includes('.pdf') || lower.includes('pdf')) {
      type = 'pdf';
    } else if (lower.includes('.ppt') || lower.includes('presentation') || lower.includes('slides')) {
      type = 'ppt';
    }

    return {
      title,
      url,
      type,
      thumbnailUrl: mat.link.thumbnailUrl,
    };
  }

  if (mat.youtubeVideo) {
    return {
      title: mat.youtubeVideo.title || 'YouTube Video',
      url: mat.youtubeVideo.alternateLink || '#',
      type: 'video',
      thumbnailUrl: mat.youtubeVideo.thumbnailUrl,
    };
  }

  if (mat.form) {
    return {
      title: mat.form.title || 'Google Form',
      url: mat.form.formUrl || mat.form.responseUrl || '#',
      type: 'link',
      thumbnailUrl: mat.form.thumbnailUrl,
    };
  }

  return null;
};

// ============================================================
// REAL GOOGLE CLASSROOM API FETCH FUNCTIONS
// ============================================================

/**
 * Fetch list of enrolled active Google Classroom courses directly from Google API.
 */
export const fetchClassroomCourses = async (): Promise<ClassroomCourse[]> => {
  const accessToken = await requestClassroomAccess();
  const response = await fetch(`${CLASSROOM_API_BASE}/courses?studentId=me&courseStates=ACTIVE`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Classroom API error (${response.status}): ${details || response.statusText}`);
  }

  const data = await response.json();
  const courses: any[] = data.courses || [];

  return courses.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
    descriptionHeading: c.descriptionHeading,
    room: c.room,
    alternateLink: c.alternateLink,
    isSelected: true,
  }));
};

/**
 * Fetch course materials (PPTs, PDFs, Docs, Links) from:
 * 1. /courseWorkMaterials
 * 2. /announcements (Stream posts with attached PDFs/PPTs)
 * 3. /courseWork attachments (Assignment PDFs & lab guides)
 */
export const fetchClassroomMaterials = async (
  courseIds: string[],
  coursesMap: Record<string, string>
): Promise<ClassroomMaterial[]> => {
  const accessToken = await requestClassroomAccess();
  const allMaterials: ClassroomMaterial[] = [];

  for (const courseId of courseIds) {
    const courseName = coursesMap[courseId] || 'Classroom Course';

    // 1. Fetch /courseWorkMaterials
    try {
      const resMat = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/courseWorkMaterials`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (resMat.ok) {
        const data = await resMat.json();
        const items: any[] = data.courseWorkMaterials || [];
        items.forEach((item) => {
          let attachments: ClassroomAttachment[] = (item.materials || [])
            .map(parseAttachment)
            .filter(Boolean) as ClassroomAttachment[];

          if (attachments.length === 0) {
            attachments = [
              {
                title: item.title ? `${item.title}` : 'Classroom Material',
                url: item.alternateLink || '#',
                type: 'pdf',
              },
            ];
          }

          allMaterials.push({
            id: `mat-${item.id}`,
            courseId,
            courseName,
            title: item.title || 'Untitled Material',
            description: item.description,
            creationTime: item.creationTime || new Date().toISOString(),
            alternateLink: item.alternateLink,
            attachments,
          });
        });
      } else {
        const errorText = await resMat.text().catch(() => '');
        console.warn(
          `[Google Classroom API] courseWorkMaterials returned status ${resMat.status} for course ${courseId}.`,
          resMat.status === 403
            ? '403 Forbidden: Ensure https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly is enabled in Google Cloud Console & re-authenticate.'
            : errorText
        );
      }
    } catch (e) {
      console.warn(`Error fetching courseWorkMaterials for course ${courseId}:`, e);
    }

    // 2. Fetch /announcements (Stream posts with attached PDFs/PPTs)
    try {
      const resAnn = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/announcements`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (resAnn.ok) {
        const data = await resAnn.json();
        const announcements: any[] = data.announcements || [];
        announcements.forEach((item) => {
          let attachments: ClassroomAttachment[] = (item.materials || [])
            .map(parseAttachment)
            .filter(Boolean) as ClassroomAttachment[];

          if (attachments.length === 0 && item.alternateLink) {
            attachments = [
              {
                title: item.text ? `${item.text.slice(0, 30)}.pdf` : 'Announcement PDF',
                url: item.alternateLink,
                type: 'pdf',
              },
            ];
          }

          allMaterials.push({
            id: `ann-${item.id}`,
            courseId,
            courseName,
            title: item.text ? item.text.split('\n')[0] : 'Classroom Announcement Resource',
            description: item.text,
            creationTime: item.creationTime || new Date().toISOString(),
            alternateLink: item.alternateLink,
            attachments,
          });
        });
      }
    } catch (e) {
      console.warn(`Error fetching announcements for course ${courseId}:`, e);
    }

    // 3. Extract attachments from /courseWork (Assignments with PDFs/PPTs)
    try {
      const resWork = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (resWork.ok) {
        const data = await resWork.json();
        const courseWorkItems: any[] = data.courseWork || [];
        courseWorkItems.forEach((item) => {
          if (item.materials && item.materials.length > 0) {
            const attachments: ClassroomAttachment[] = item.materials
              .map(parseAttachment)
              .filter(Boolean) as ClassroomAttachment[];

            if (attachments.length > 0) {
              allMaterials.push({
                id: `cw-mat-${item.id}`,
                courseId,
                courseName,
                title: item.title ? `[Assignment Material] ${item.title}` : 'Assignment Attached Document',
                description: item.description,
                creationTime: item.creationTime || new Date().toISOString(),
                alternateLink: item.alternateLink,
                attachments,
              });
            }
          }
        });
      }
    } catch (e) {
      console.warn(`Error extracting courseWork attachments for course ${courseId}:`, e);
    }
  }

  return allMaterials;
};

/**
 * Fetch assignments for selected courses directly from Google API.
 */
export const fetchClassroomAssignments = async (
  courseIds: string[],
  coursesMap: Record<string, string>
): Promise<ClassroomAssignment[]> => {
  const accessToken = await requestClassroomAccess();
  const allAssignments: ClassroomAssignment[] = [];

  for (const courseId of courseIds) {
    const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.ok) {
      const data = await response.json();
      const items: any[] = data.courseWork || [];
      const courseName = coursesMap[courseId] || 'Classroom Course';

      items.forEach((item) => {
        const attachments: ClassroomAttachment[] = (item.materials || [])
          .map(parseAttachment)
          .filter(Boolean) as ClassroomAttachment[];

        let dueDateStr: string | undefined = undefined;
        if (item.dueDate) {
          const y = item.dueDate.year;
          const m = String(item.dueDate.month).padStart(2, '0');
          const d = String(item.dueDate.day).padStart(2, '0');
          dueDateStr = `${y}-${m}-${d}`;
        }

        let dueTimeStr: string | undefined = undefined;
        if (item.dueTime) {
          const h = String(item.dueTime.hours || 0).padStart(2, '0');
          const min = String(item.dueTime.minutes || 0).padStart(2, '0');
          dueTimeStr = `${h}:${min}`;
        }

        allAssignments.push({
          id: item.id,
          courseId,
          courseName,
          title: item.title || 'Untitled Assignment',
          description: item.description,
          dueDate: dueDateStr,
          dueTime: dueTimeStr,
          maxPoints: item.maxPoints,
          alternateLink: item.alternateLink,
          attachments,
          state: item.state,
        });
      });
    }
  }

  return allAssignments;
};
