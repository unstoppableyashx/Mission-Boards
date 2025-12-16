// Mission Boards Configuration
// Using your provided keys

const firebaseConfig = {
    apiKey: "AIzaSyAyRRVQfHoe75C875yV9kxhs0G6cd4zuBI",
    authDomain: "mission-boards.firebaseapp.com",
    projectId: "mission-boards",
    storageBucket: "mission-boards.firebasestorage.app",
    messagingSenderId: "66256633472",
    appId: "1:66256633472:web:56169a07342e117a24b065",
    measurementId: "G-Y0MGLQ4QVN"
};

// Initialize Firebase (Compat mode for simple HTML)
firebase.initializeApp(firebaseConfig);

// Export services globally so other files can use them
const auth = firebase.auth();
const db = firebase.firestore();

console.log("System: Firebase Connected");