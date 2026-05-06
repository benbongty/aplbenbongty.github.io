import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export async function getUserProfile() {
  if (!auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  try {
    const d = await getDoc(doc(db, 'users', uid));
    if (d.exists()) {
      return d.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users`);
  }
}

export async function saveUserProfile(data: any) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', uid), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users`);
  }
}

export async function getCustomLists() {
  if (!auth.currentUser) return [];
  const uid = auth.currentUser.uid;
  try {
    const snap = await getDocs(collection(db, `users/${uid}/customLists`));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/customLists`);
    return [];
  }
}

export async function saveCustomList(listId: string, data: any) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, `users/${uid}/customLists`, listId), payload);
  } catch(err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/customLists`);
  }
}

export async function deleteCustomListDb(listId: string) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    await deleteDoc(doc(db, `users/${uid}/customLists`, listId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/customLists`);
  }
}

export async function getCalendarNotes() {
  if (!auth.currentUser) return [];
  const uid = auth.currentUser.uid;
  try {
    const snap = await getDocs(collection(db, `users/${uid}/calendarNotes`));
    return snap.docs.map(d => ({ date: d.id, ...d.data() }));
  } catch(err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/calendarNotes`);
    return [];
  }
}

export async function saveCalendarNote(date: string, note: string) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    if (!note.trim()) {
      await deleteDoc(doc(db, `users/${uid}/calendarNotes`, date));
    } else {
      await setDoc(doc(db, `users/${uid}/calendarNotes`, date), {
        note,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/calendarNotes`);
  }
}
