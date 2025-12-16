const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');

if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        authError.textContent = "Verifying...";
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => { console.log("Success"); })
            .catch((err) => { authError.textContent = err.message; });
    });
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
    auth.signOut().then(() => location.reload());
});
