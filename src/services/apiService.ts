import { ProfileData } from '../types/bio';
import { ChatMessage } from '../types/chat';
import { AuditLogEntry } from '../utils/auditLogger';
import { NewsPost } from '../types/news';
import { AppNotification } from '../types/notifications';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Local in-memory caches for instant UI updates & fallback
const localUsersCache: Record<string, ProfileData> = {};
let localMessagesCache: ChatMessage[] = [];
let localAuditLogsCache: AuditLogEntry[] = [];
let localRiggedCache: string[] = [];
let localNewsCache: NewsPost[] = [];
const localNotificationsCache: Record<string, AppNotification[]> = {};

// Helper fetch wrapper
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`API Fetch error (${endpoint}):`, err);
    return null;
  }
}

// ----------------------------------------------------
// 1. USERS
// ----------------------------------------------------
export async function saveUserToFirestore(profile: ProfileData): Promise<void> {
  if (!profile || !profile.username) return;
  const key = profile.username.toLowerCase().trim();
  localUsersCache[key] = profile;

  await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export async function getUserFromFirestore(username: string): Promise<ProfileData | null> {
  if (!username) return null;
  const key = username.toLowerCase().trim();
  const remote = await apiFetch<ProfileData>(`/api/users/${encodeURIComponent(key)}`);
  if (remote) {
    localUsersCache[key] = remote;
    return remote;
  }
  return localUsersCache[key] || null;
}

export async function getAllUsersFromFirestore(): Promise<ProfileData[]> {
  const remoteMap = await apiFetch<Record<string, ProfileData>>('/api/users');
  if (remoteMap) {
    Object.assign(localUsersCache, remoteMap);
    return Object.values(remoteMap);
  }
  return Object.values(localUsersCache);
}

export function subscribeToUsers(callback: (users: Record<string, ProfileData>) => void): () => void {
  let isMounted = true;

  const fetchUsers = async () => {
    const map = await apiFetch<Record<string, ProfileData>>('/api/users');
    if (map && isMounted) {
      Object.assign(localUsersCache, map);
      callback({ ...localUsersCache });
    } else if (isMounted) {
      callback({ ...localUsersCache });
    }
  };

  fetchUsers();
  const interval = setInterval(fetchUsers, 2000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

export async function deleteUserFromFirestore(username: string): Promise<void> {
  if (!username) return;
  const key = username.toLowerCase().trim();
  delete localUsersCache[key];

  await apiFetch(`/api/users/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
}

// ----------------------------------------------------
// 2. MESSAGES
// ----------------------------------------------------
export function subscribeToMessages(callback: (messages: ChatMessage[]) => void): () => void {
  let isMounted = true;

  const fetchMessages = async () => {
    const list = await apiFetch<ChatMessage[]>('/api/messages');
    if (list && isMounted) {
      localMessagesCache = list;
      callback([...localMessagesCache]);
    } else if (isMounted) {
      callback([...localMessagesCache]);
    }
  };

  fetchMessages();
  const interval = setInterval(fetchMessages, 1500);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

export async function sendMessageToFirestore(message: ChatMessage): Promise<void> {
  if (!message || !message.id) return;
  localMessagesCache.push(message);

  await apiFetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify(message),
  });
}

export async function deleteMessageFromFirestore(messageId: string): Promise<void> {
  localMessagesCache = localMessagesCache.filter((m) => m.id !== messageId);

  await apiFetch(`/api/messages/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
  });
}

export async function clearAllMessagesInFirestore(announcementMessage?: ChatMessage): Promise<void> {
  localMessagesCache = announcementMessage ? [announcementMessage] : [];

  await apiFetch('/api/messages', {
    method: 'DELETE',
    body: JSON.stringify({ announcementMessage }),
  });
}

// ----------------------------------------------------
// 3. AUDIT LOGS
// ----------------------------------------------------
export function subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void): () => void {
  let isMounted = true;

  const fetchLogs = async () => {
    const list = await apiFetch<AuditLogEntry[]>('/api/audit-logs');
    if (list && isMounted) {
      localAuditLogsCache = list;
      callback([...localAuditLogsCache]);
    } else if (isMounted) {
      callback([...localAuditLogsCache]);
    }
  };

  fetchLogs();
  const interval = setInterval(fetchLogs, 3000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

export async function addAuditLogToFirestore(entry: AuditLogEntry): Promise<void> {
  if (!entry || !entry.id) return;
  localAuditLogsCache.unshift(entry);

  await apiFetch('/api/audit-logs', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function clearAuditLogsInFirestore(): Promise<void> {
  localAuditLogsCache = [];

  await apiFetch('/api/audit-logs', {
    method: 'DELETE',
  });
}

// ----------------------------------------------------
// 4. RIGGED USERS
// ----------------------------------------------------
export function subscribeToRiggedUsers(callback: (rigged: string[]) => void): () => void {
  let isMounted = true;

  const fetchRigged = async () => {
    const list = await apiFetch<string[]>('/api/config/rigged');
    if (list && isMounted) {
      localRiggedCache = list;
      callback([...localRiggedCache]);
    } else if (isMounted) {
      callback([...localRiggedCache]);
    }
  };

  fetchRigged();
  const interval = setInterval(fetchRigged, 3000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

export async function setRiggedUserInFirestore(username: string, rigged: boolean): Promise<void> {
  const cleanName = username.trim().toLowerCase();
  localRiggedCache = localRiggedCache.filter((u) => u.toLowerCase() !== cleanName);
  if (rigged) {
    localRiggedCache.push(cleanName);
  }

  await apiFetch('/api/config/rigged', {
    method: 'POST',
    body: JSON.stringify({ username, rigged }),
  });
}

// ----------------------------------------------------
// 5. NEWS
// ----------------------------------------------------
export function subscribeToNews(callback: (posts: NewsPost[]) => void): () => void {
  let isMounted = true;

  const fetchNews = async () => {
    const list = await apiFetch<NewsPost[]>('/api/news');
    if (list && isMounted) {
      localNewsCache = list;
      callback([...localNewsCache]);
    } else if (isMounted) {
      callback([...localNewsCache]);
    }
  };

  fetchNews();
  const interval = setInterval(fetchNews, 3000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

export async function createNewsPostInFirestore(post: NewsPost): Promise<void> {
  if (!post || !post.id) return;
  localNewsCache.unshift(post);

  await apiFetch('/api/news', {
    method: 'POST',
    body: JSON.stringify(post),
  });
}

export async function deleteNewsPostFromFirestore(postId: string): Promise<void> {
  localNewsCache = localNewsCache.filter((p) => p.id !== postId);

  await apiFetch(`/api/news/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });
}

export async function updateNewsPostInFirestore(post: NewsPost): Promise<void> {
  if (!post || !post.id) return;
  const idx = localNewsCache.findIndex((p) => p.id === post.id);
  if (idx >= 0) {
    localNewsCache[idx] = post;
  }

  await apiFetch(`/api/news/${encodeURIComponent(post.id)}`, {
    method: 'PUT',
    body: JSON.stringify(post),
  });
}

// ----------------------------------------------------
// 6. NOTIFICATIONS
// ----------------------------------------------------
export async function sendNotificationToFirestore(notification: AppNotification): Promise<void> {
  if (!notification || !notification.id) return;

  await apiFetch('/api/notifications', {
    method: 'POST',
    body: JSON.stringify(notification),
  });
}

export function subscribeToUserNotifications(
  username: string,
  callback: (notifications: AppNotification[]) => void
): () => void {
  let isMounted = true;
  const cleanName = username.trim().toLowerCase();

  const fetchNotifs = async () => {
    const list = await apiFetch<AppNotification[]>(`/api/notifications/${encodeURIComponent(cleanName)}`);
    if (list && isMounted) {
      localNotificationsCache[cleanName] = list;
      callback(list);
    } else if (isMounted) {
      callback(localNotificationsCache[cleanName] || []);
    }
  };

  fetchNotifs();
  const interval = setInterval(fetchNotifs, 3000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

export async function deleteNotificationFromFirestore(notificationId: string): Promise<void> {
  await apiFetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
    method: 'DELETE',
  });
}

export async function clearAllNotificationsForUser(username: string): Promise<void> {
  const cleanName = username.trim().toLowerCase();
  delete localNotificationsCache[cleanName];

  await apiFetch(`/api/notifications/user/${encodeURIComponent(cleanName)}`, {
    method: 'DELETE',
  });
}
