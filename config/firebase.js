const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account key
const serviceAccount = require('./dailyseed-2febe-firebase-adminsdk-fbsvc-1f0e1d6b10.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;