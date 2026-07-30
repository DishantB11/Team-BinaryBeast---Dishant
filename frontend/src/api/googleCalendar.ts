import type { Task } from '../types';

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

type TokenResponse = {
  access_token?: string;
  error?: string;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let gisScriptPromise: Promise<void> | null = null;
let cachedAccessToken: string | null = null;

const getGoogleClientId = () => import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Google sign-in.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Google sign-in.'));
    document.head.appendChild(script);
  });

  return gisScriptPromise;
};

const requestGoogleCalendarAccess = async () => {
  if (cachedAccessToken) return cachedAccessToken;

  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID. Add it to frontend/.env.local.');
  }

  await loadGoogleIdentityServices();

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Google Calendar permission was not granted.'));
          return;
        }

        cachedAccessToken = response.access_token;
        resolve(response.access_token);
      },
    });

    if (!tokenClient) {
      reject(new Error('Google sign-in is unavailable in this browser session.'));
      return;
    }

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

const taskToCalendarEvent = (task: Task) => {
  const start = new Date(`${task.dueDate}T09:00:00`);
  const end = new Date(start.getTime() + task.duration * 60 * 60 * 1000);

  return {
    summary: `${task.subject}: ${task.title}`,
    description: [
      `Focusflow task type: ${task.type}`,
      `Priority: ${task.priority}`,
      task.module ? `Module: ${task.module}` : null,
      `Estimated hours: ${task.estimatedHours}`,
    ].filter(Boolean).join('\n'),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 },
        { method: 'email', minutes: 60 },
      ],
    },
  };
};

export const createGoogleCalendarEvents = async (tasks: Task[]) => {
  const accessToken = await requestGoogleCalendarAccess();

  return Promise.all(
    tasks.map(async (task) => {
      const response = await fetch(GOOGLE_CALENDAR_EVENTS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskToCalendarEvent(task)),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Google Calendar rejected "${task.title}": ${details || response.statusText}`);
      }

      return response.json() as Promise<{ id: string; htmlLink?: string }>;
    })
  );
};

export const fetchGoogleCalendarEvents = async (): Promise<Task[]> => {
  const accessToken = await requestGoogleCalendarAccess();
  const now = new Date();
  // Fetch events from 30 days ago up to 90 days in the future
  const minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const url = `${GOOGLE_CALENDAR_EVENTS_URL}?timeMin=${encodeURIComponent(minDate)}&singleEvents=true&orderBy=startTime&maxResults=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to fetch Google Calendar events: ${details || response.statusText}`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items
    .filter((item: any) => item.summary && (item.start?.dateTime || item.start?.date))
    .map((item: any, idx: number): Task => {
      const startDateStr = (item.start.dateTime || item.start.date).split('T')[0];
      let subject = 'Google Calendar';
      let title = item.summary;

      if (item.summary.includes(':')) {
        const parts = item.summary.split(':');
        subject = parts[0].trim();
        title = parts.slice(1).join(':').trim();
      }

      return {
        id: `gcal-${item.id || idx}`,
        subject,
        title,
        type: item.description?.includes('Exam') ? 'Exam' : 'Assignment',
        dueDate: startDateStr,
        duration: 1,
        priority: 2,
        isCompleted: false,
        estimatedHours: 2,
        module: 'Synced from Google Calendar',
      };
    });
};

