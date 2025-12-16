// js/auth.js - Clean Version

const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');

// 1. Sirf Login Button ka logic yahan rakhen
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Error message reset karein
        authError.textContent = "Verifying Credentials...";
        authError.style.color = "#94a3b8"; // Grey text

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Success! App.js apne aap detect kar lega
                console.log("Login Action Successful");
                authError.textContent = "Success! Entering System...";
                authError.style.color = "#10b981"; // Green text
            })
            .catch((error) => {
                console.error("Login Failed:", error);
                authError.textContent = "Error: " + error.message;
                authError.style.color = "#ef4444"; // Red text
            });
    });
}

// 2. Logout Button Logic
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if(confirm("Confirm Abort Mission? (Logout)")) {
            auth.signOut().then(() => {
                console.log("Logged Out");
                location.reload(); 
            });
        }
    });
}
