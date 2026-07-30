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
let cachedAccessToken: string | null = localStorage.getItem('google_access_token');

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
  localStorage.removeItem('google_access_token');
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
        localStorage.setItem('google_access_token', response.access_token);
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
 * Helper to resolve the actual Drive file object from various API response shapes.
 * Google Classroom API wraps drive files differently depending on the endpoint:
 *   - courseWorkMaterials: { driveFile: { driveFile: { id, title, alternateLink, thumbnailUrl }, shareMode } }
 *   - courseWork:          { driveFile: { driveFile: { id, title, alternateLink, thumbnailUrl }, shareMode } }
 *   - announcements:      { driveFile: { driveFile: { id, title, alternateLink }, shareMode } }
 * This helper normalises all shapes into a single flat file object.
 */
const resolveDriveFile = (mat: any): { title: string; url: string; mime: string; thumbnailUrl?: string } | null => {
  // SharedDriveFile wrapper: mat.driveFile.driveFile holds the real DriveFile resource
  const innerDrive = mat?.driveFile?.driveFile;
  if (innerDrive && (innerDrive.id || innerDrive.title || innerDrive.alternateLink)) {
    return {
      title: innerDrive.title || innerDrive.name || 'Attached Document',
      url: innerDrive.alternateLink || innerDrive.webViewLink || '#',
      mime: (innerDrive.mimeType || '').toLowerCase(),
      thumbnailUrl: innerDrive.thumbnailUrl,
    };
  }

  // Flat driveFile (some older / non-standard responses)
  const flatDrive = mat?.driveFile;
  if (flatDrive && (flatDrive.id || flatDrive.title || flatDrive.alternateLink) && !flatDrive.driveFile) {
    return {
      title: flatDrive.title || flatDrive.name || 'Attached Document',
      url: flatDrive.alternateLink || flatDrive.webViewLink || '#',
      mime: (flatDrive.mimeType || '').toLowerCase(),
      thumbnailUrl: flatDrive.thumbnailUrl,
    };
  }

  // mat.file fallback
  const fileObj = mat?.file;
  if (fileObj && (fileObj.id || fileObj.title || fileObj.alternateLink)) {
    return {
      title: fileObj.title || fileObj.name || 'Attached Document',
      url: fileObj.alternateLink || fileObj.webViewLink || fileObj.url || '#',
      mime: (fileObj.mimeType || '').toLowerCase(),
      thumbnailUrl: fileObj.thumbnailUrl,
    };
  }

  return null;
};

/**
 * Helper to determine attachment file type (PDF, PPT, Doc, Link, Video)
 */
const parseAttachment = (mat: any): ClassroomAttachment | null => {
  // --- Drive file attachments ---
  const driveFile = resolveDriveFile(mat);
  if (driveFile) {
    const { title, url, mime, thumbnailUrl } = driveFile;
    const lowerTitle = title.toLowerCase();

    let type: ClassroomAttachment['type'] = 'pdf'; // default

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

    return { title, url, type, thumbnailUrl };
  }

  // --- Web link attachments ---
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

  // --- YouTube video attachments ---
  if (mat.youtubeVideo) {
    return {
      title: mat.youtubeVideo.title || 'YouTube Video',
      url: mat.youtubeVideo.alternateLink || '#',
      type: 'video',
      thumbnailUrl: mat.youtubeVideo.thumbnailUrl,
    };
  }

  // --- Google Form attachments ---
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
// PAGINATED FETCH HELPER
// ============================================================
/**
 * Generic paginated fetch — follows `nextPageToken` until all pages are collected.
 * Tries both `dataKey` and common alternate forms (singular/plural) to handle
 * Google Classroom API inconsistencies in response key naming.
 */
const fetchAllPages = async (
  baseUrl: string,
  accessToken: string,
  dataKey: string,
): Promise<{ items: any[]; ok: true } | { ok: false; status: number; errorText: string }> => {
  const allItems: any[] = [];
  let pageToken: string | undefined;

  do {
    const url = pageToken ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}pageToken=${pageToken}` : baseUrl;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return { ok: false, status: response.status, errorText };
    }

    const data = await response.json();
    // Try the provided key first, then try singular/plural variants
    const items: any[] =
      data[dataKey] ||
      data[dataKey + 's'] ||                          // singular → plural (e.g. courseWorkMaterial → courseWorkMaterials)
      data[dataKey.replace(/s$/, '')] ||              // plural → singular (e.g. courseWorkMaterials → courseWorkMaterial)
      [];
    allItems.push(...items);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return { ok: true, items: allItems };
};

// ============================================================
// REAL GOOGLE CLASSROOM API FETCH FUNCTIONS
// ============================================================

/**
 * Fetch list of enrolled active Google Classroom courses directly from Google API.
 */
export const fetchClassroomCourses = async (): Promise<ClassroomCourse[]> => {
  const accessToken = await requestClassroomAccess();

  const result = await fetchAllPages(
    `${CLASSROOM_API_BASE}/courses?studentId=me&courseStates=ACTIVE`,
    accessToken,
    'courses',
  );

  if (!result.ok) {
    throw new Error(`Google Classroom API error (${result.status}): ${result.errorText || 'Unknown error'}`);
  }

  return result.items.map((c: any) => ({
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
 * 1. /courseWorkMaterials  (dedicated course material resources)
 * 2. /announcements        (stream posts with attached PDFs/PPTs)
 * 3. /courseWork attachments (assignment PDFs & lab guides)
 *
 * All endpoints are fetched with full pagination support.
 */
export const fetchClassroomMaterials = async (
  courseIds: string[],
  coursesMap: Record<string, string>
): Promise<ClassroomMaterial[]> => {
  const accessToken = await requestClassroomAccess();
  const allMaterials: ClassroomMaterial[] = [];

  for (const courseId of courseIds) {
    const courseName = coursesMap[courseId] || 'Classroom Course';

    // 1. Fetch /courseWorkMaterials (paginated)
    try {
      const result = await fetchAllPages(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWorkMaterials`,
        accessToken,
        'courseWorkMaterial',
      );

      if (result.ok) {
        result.items.forEach((item: any) => {
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
        console.warn(
          `[Google Classroom API] courseWorkMaterials returned status ${result.status} for course ${courseId}.`,
          result.status === 403
            ? '403 Forbidden: Ensure https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly is enabled in Google Cloud Console & re-authenticate.'
            : result.errorText,
        );

        // Retry with the alternate response key in case the API uses plural form
        // (Google API docs show both 'courseWorkMaterial' and 'courseWorkMaterials' depending on version)
      }
    } catch (e) {
      console.warn(`Error fetching courseWorkMaterials for course ${courseId}:`, e);
    }

    // 2. Fetch /announcements (paginated)
    try {
      const result = await fetchAllPages(
        `${CLASSROOM_API_BASE}/courses/${courseId}/announcements`,
        accessToken,
        'announcements',
      );

      if (result.ok) {
        result.items.forEach((item: any) => {
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
  }

  return allMaterials;
};

/**
 * Fetch assignments for selected courses directly from Google API (paginated).
 */
export const fetchClassroomAssignments = async (
  courseIds: string[],
  coursesMap: Record<string, string>
): Promise<ClassroomAssignment[]> => {
  const accessToken = await requestClassroomAccess();
  const allAssignments: ClassroomAssignment[] = [];

  for (const courseId of courseIds) {
    const result = await fetchAllPages(
      `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`,
      accessToken,
      'courseWork',
    );

    if (result.ok) {
      const courseName = coursesMap[courseId] || 'Classroom Course';

      // Build a map of courseWorkId → student submission state
      const submissionStateMap: Record<string, string> = {};
      try {
        const subResult = await fetchAllPages(
          `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/-/studentSubmissions?userId=me`,
          accessToken,
          'studentSubmissions',
        );
        if (subResult.ok) {
          subResult.items.forEach((sub: any) => {
            if (sub.courseWorkId && sub.state) {
              submissionStateMap[sub.courseWorkId] = sub.state;
            }
          });
        }
      } catch (e) {
        console.warn(`Could not fetch student submissions for course ${courseId}:`, e);
      }

      result.items.forEach((item: any) => {
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
          submissionState: submissionStateMap[item.id] as ClassroomAssignment['submissionState'],
        });
      });
    }
  }

  return allAssignments;
};
