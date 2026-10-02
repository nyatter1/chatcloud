import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from '../lib/firebase';
import { ProfileData } from '../types/bio';
import { ChatMessage } from '../types/chat';
import { AuditLogEntry } from '../utils/auditLogger';

// ----------------------------------------------------
// 1. USERS COLLECTION
// ----------------------------------------------------
const USERS_COLLECTION = 'users';

export async function saveUserToFirestore(profile: ProfileData): Promise<void> {
  const docId = profile.username.toLowerCase().trim();
  const userRef = doc(db, USERS_COLLECTION, docId);
  await setDoc(
    userRef,
    {
      ...profile,
      usernameKey: docId,
      lastActive: Date.now(),
    },
    { merge: true }
  );
}

export async function getUserFromFirestore(username: string): Promise<ProfileData | null> {
  const docId = username.toLowerCase().trim();
  const userRef = doc(db, USERS_COLLECTION, docId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as ProfileData;
  }
  return null;
}

export async function getAllUsersFromFirestore(): Promise<ProfileData[]> {
  const q = query(collection(db, USERS_COLLECTION));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ProfileData);
}

export function subscribeToUsers(callback: (users: Record<string, ProfileData>) => void) {
  const q = query(collection(db, USERS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const usersMap: Record<string, ProfileData> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ProfileData;
        if (data.username) {
          usersMap[data.username.toLowerCase().trim()] = data;
        }
      });
      callback(usersMap);
    },
    (error) => {
      console.error('Firestore users subscription error:', error);
    }
  );
}

export async function deleteUserFromFirestore(username: string): Promise<void> {
  const docId = username.toLowerCase().trim();
  await deleteDoc(doc(db, USERS_COLLECTION, docId));
}

// ----------------------------------------------------
// 2. LIVE MESSAGES COLLECTION
// ----------------------------------------------------
const MESSAGES_COLLECTION = 'messages';

export function subscribeToMessages(callback: (messages: ChatMessage[]) => void) {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    orderBy('timestamp', 'asc'),
    limit(250)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push(docSnap.data() as ChatMessage);
      });
      callback(msgs);
    },
    (error) => {
      console.error('Firestore messages subscription error:', error);
    }
  );
}

export async function sendMessageToFirestore(message: ChatMessage): Promise<void> {
  const msgRef = doc(db, MESSAGES_COLLECTION, message.id);
  await setDoc(msgRef, message);
}

export async function deleteMessageFromFirestore(messageId: string): Promise<void> {
  await deleteDoc(doc(db, MESSAGES_COLLECTION, messageId));
}

export async function clearAllMessagesInFirestore(announcementMessage?: ChatMessage): Promise<void> {
  const q = query(collection(db, MESSAGES_COLLECTION));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  if (announcementMessage) {
    await sendMessageToFirestore(announcementMessage);
  }
}

// ----------------------------------------------------
// 3. AUDIT LOGS COLLECTION
// ----------------------------------------------------
const AUDIT_COLLECTION = 'audit_logs';

export function subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void) {
  const q = query(
    collection(db, AUDIT_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(150)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const entries: AuditLogEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as AuditLogEntry);
      });
      callback(entries);
    },
    (error) => {
      console.error('Firestore audit logs subscription error:', error);
    }
  );
}

export async function addAuditLogToFirestore(entry: AuditLogEntry): Promise<void> {
  const ref = doc(db, AUDIT_COLLECTION, entry.id);
  await setDoc(ref, entry);
}

export async function clearAuditLogsInFirestore(): Promise<void> {
  const q = query(collection(db, AUDIT_COLLECTION));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}

// ----------------------------------------------------
// 4. RIGGED USERS CONFIG
// ----------------------------------------------------
const CONFIG_COLLECTION = 'system_config';
const RIGGED_DOC = 'rigged_users';

export function subscribeToRiggedUsers(callback: (rigged: string[]) => void) {
  const ref = doc(db, CONFIG_COLLECTION, RIGGED_DOC);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback(data?.users || []);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error('Firestore rigged users subscription error:', error);
    }
  );
}

export async function setRiggedUserInFirestore(username: string, rigged: boolean): Promise<void> {
  const ref = doc(db, CONFIG_COLLECTION, RIGGED_DOC);
  const snap = await getDoc(ref);
  const currentList: string[] = snap.exists() ? snap.data()?.users || [] : [];
  const cleanName = username.trim().toLowerCase();
  const filtered = currentList.filter((u) => u.toLowerCase() !== cleanName);
  if (rigged) {
    filtered.push(cleanName);
  }
  await setDoc(ref, { users: filtered });
}
