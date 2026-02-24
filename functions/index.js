const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const VALID_TIERS = ['free', 'pro', 'vip', 'admin', 'assessor'];

/**
 * syncRoleTier — Sync user tier to Firebase custom claims (role).
 *
 * Triggers on users/{uid} document write.
 * Sets custom claim { role: tier } so frontend can access via getIdTokenResult().
 *
 * Why needed: Frontend AssessorDashboard checks role custom claim, but it was never set.
 * This function keeps claims in sync with Firestore tier field.
 */
exports.syncRoleTier = functions.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const newData = change.after.data();
    const oldData = change.before.data();

    // Skip if same tier (no change)
    if (oldData?.tier === newData?.tier) {
      return null;
    }

    try {
      const tier = newData?.tier || 'free';

      // Validate tier value
      if (!VALID_TIERS.includes(tier)) {
        console.error(
          JSON.stringify({
            level: 'error',
            function: 'syncRoleTier',
            userId: uid,
            error: 'Invalid tier value',
            tier,
            validTiers: VALID_TIERS,
            timestamp: new Date().toISOString(),
          })
        );
        return null;
      }

      // Set custom claim: role = tier
      await admin.auth().setCustomUserClaims(uid, { role: tier });

      console.log(
        JSON.stringify({
          level: 'info',
          function: 'syncRoleTier',
          userId: uid,
          oldTier: oldData?.tier,
          newTier: tier,
          action: 'custom_claim_set',
          timestamp: new Date().toISOString(),
        })
      );

      return null;
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          function: 'syncRoleTier',
          userId: uid,
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString(),
        })
      );
      throw error; // Let Firebase retry
    }
  });

/**
 * initializeUserRole — Initialize role claim when user account is created.
 *
 * Triggers on Firebase Auth user creation.
 * Sets initial custom claim { role: 'free' } so users can use frontend immediately.
 */
exports.initializeUserRole = functions.auth
  .user()
  .onCreate(async (user) => {
    try {
      // Set initial role claim
      await admin.auth().setCustomUserClaims(user.uid, { role: 'free' });

      console.log(
        JSON.stringify({
          level: 'info',
          function: 'initializeUserRole',
          userId: user.uid,
          action: 'initial_claim_set',
          role: 'free',
          timestamp: new Date().toISOString(),
        })
      );

      return null;
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          function: 'initializeUserRole',
          userId: user.uid,
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString(),
        })
      );
      throw error;
    }
  });
