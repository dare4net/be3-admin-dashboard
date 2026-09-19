// Firebase Messaging Service Worker — Admin Dashboard
// Served at /firebase-messaging-sw.js (must be in /public)
// Handles background push notifications when the admin tab is closed/hidden

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config must be hardcoded — service workers cannot read Next.js env vars at runtime
firebase.initializeApp({
    apiKey:            "AIzaSyAETaB00pbSAE6YZv3z9DM5LUki1ZZRnSE",
    authDomain:        "be3-shop-1b763.firebaseapp.com",
    projectId:         "be3-shop-1b763",
    storageBucket:     "be3-shop-1b763.firebasestorage.app",
    messagingSenderId: "463785293034",
    appId:             "1:463785293034:web:774e4c8773d4afbd74d393",
});

const messaging = firebase.messaging();

// Handle background messages
// Note: We only log here. Because the backend payload includes 'notification' and 'webpush.fcmOptions.link',
// the Firebase SDK automatically displays the OS notification and handles click navigation for us.
messaging.onBackgroundMessage((payload) => {
    console.log('[AdminSW] Background message received:', payload);
});

