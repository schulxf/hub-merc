/**
 * Assessor service — Firestore queries for assessor-client relationships.
 * All functions are pure async utilities; not tied to React lifecycle.
 */
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AssessorClientSchema, UserProfileSchema } from '../schemas/userProfile.schema';

/**
 * getAssessorClients — fetch all clients assigned to this assessor.
 * Queries Firestore: users where assessorIds array-contains assessorUid.
 *
 * @param {string} assessorUid - The UID of the assessor.
 * @returns {Promise<import('../schemas/userProfile.schema').AssessorClient[]>} Array of validated client profiles.
 */
export async function getAssessorClients(assessorUid) {
  if (!assessorUid) {
    console.error('[assessorService] getAssessorClients: assessorUid is required');
    return [];
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('assessorIds', 'array-contains', assessorUid));
    const snapshot = await getDocs(q);

    const clients = [];
    snapshot.forEach((docSnap) => {
      const raw = { uid: docSnap.id, ...docSnap.data() };
      const result = AssessorClientSchema.safeParse(raw);
      if (result.success) {
        clients.push(result.data);
      } else {
        console.error(
          `[assessorService] Invalid client data for uid "${docSnap.id}":`,
          result.error.flatten(),
        );
      }
    });

    return clients;
  } catch (error) {
    console.error('[assessorService] getAssessorClients failed:', error);
    return [];
  }
}

/**
 * isAssessorForClient — verify that an assessor has access to a specific client.
 * Reads the client's user document and checks if assessorUid is in their assessorIds array.
 *
 * @param {string} assessorUid - The UID of the assessor.
 * @param {string} clientUid - The UID of the client.
 * @returns {Promise<boolean>} True if the assessor is assigned to this client.
 */
export async function isAssessorForClient(assessorUid, clientUid) {
  if (!assessorUid || !clientUid) {
    console.error('[assessorService] isAssessorForClient: both assessorUid and clientUid are required');
    return false;
  }

  try {
    const clientRef = doc(db, 'users', clientUid);
    const clientSnap = await getDoc(clientRef);

    if (!clientSnap.exists()) {
      return false;
    }

    const result = UserProfileSchema.safeParse(clientSnap.data());
    if (!result.success) {
      console.error(
        `[assessorService] Invalid profile data for client "${clientUid}":`,
        result.error.flatten(),
      );
      return false;
    }

    return result.data.assessorIds.includes(assessorUid);
  } catch (error) {
    console.error('[assessorService] isAssessorForClient failed:', error);
    return false;
  }
}
