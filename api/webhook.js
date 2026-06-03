const { createMollieClient } = require('@mollie/api-client');
const admin = require('firebase-admin');

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { id } = req.body;

  try {
    const betaling = await mollie.payments.get(id);

    if (betaling.status === 'paid') {
      const { userId, credits } = betaling.metadata;
      const creditsAantal = parseInt(credits);

      await db.collection('users').doc(userId).set({
        credits: admin.firestore.FieldValue.increment(creditsAantal),
        laatstBetaald: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send(error.message);
  }
};
