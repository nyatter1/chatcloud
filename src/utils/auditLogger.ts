import { addAuditLogToFirestore, clearAuditLogsInFirestore } from '../services/firestoreService';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  actor: string;
  action: string;
  details?: string;
  category: 'chat' | 'user' | 'command' | 'admin';
}

const STORAGE_KEY = 'chatcloud_system_logs';

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 'log-init-1',
      timestamp: Date.now() - 3600000,
      formattedTime: new Date(Date.now() - 3600000).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
      actor: 'System',
      action: 'System Initialized',
      details: 'chatlaxy server and database engine booted successfully.',
      category: 'admin',
    },
    {
      id: 'log-init-2',
      timestamp: Date.now() - 1800000,
      formattedTime: new Date(Date.now() - 1800000).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
      actor: 'Null',
      action: 'System Boot',
      details: 'Developer Null logged in.',
      category: 'user',
    },
  ];
}

export function addAuditLog(
  actor: string,
  action: string,
  details?: string,
  category: 'chat' | 'user' | 'command' | 'admin' = 'admin'
): AuditLogEntry {
  const now = new Date();
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    formattedTime: now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }),
    actor,
    action,
    details,
    category,
  };

  try {
    const logs = getAuditLogs();
    const updated = [entry, ...logs].slice(0, 200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  // Sync to Firestore in background
  try {
    addAuditLogToFirestore(entry).catch((err) =>
      console.warn('Could not sync log to firestore:', err)
    );
  } catch {}

  return entry;
}

export function clearAuditLogs(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch {}

  try {
    clearAuditLogsInFirestore().catch((err) =>
      console.warn('Could not clear logs in firestore:', err)
    );
  } catch {}
}
