// Auth Controller

const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');
const loadingScreen = document.getElementById('loading-screen');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

// 1. Listen for Auth State Changes (Login hone par kya karein)
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User detected:", user.email);
        // User is logged in -> Show App
        loadingScreen.classList.add('hidden');
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Load User Data (Hum baad me App.js me banayenge)
        // loadUserData(user.uid); 
    } else {
        console.log("No user found");
        // User is logged out -> Show Login
        loadingScreen.classList.add('hidden');
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// 2. Handle Login Form Submit
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    authError.textContent = "Authenticating...";

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Success
            authError.textContent = "";
            console.log("Login Successful");
        })
        .catch((error) => {
            // Error
            console.error(error);
            authError.textContent = "Error: " + error.message;
        });
});

// 3. Handle Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
});