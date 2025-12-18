// js/app.js - Final Synced Version (Full Features + Anti-Spam Validation)

// ==========================================
// --- 1. DOM ELEMENTS & GLOBAL VARIABLES ---
// ==========================================

// Screens
const uiLoading = document.getElementById('loading-screen');
const uiAuth = document.getElementById('auth-container');
const uiApp = document.getElementById('app-container');
const uiContent = document.getElementById('content-area');

// Stats & Profile UI (Elements might be missing in HTML, handled safely below)
const uiDayBadge = document.getElementById('day-badge');
const uiProgVal = document.getElementById('prog-val');
const uiProgBar = document.getElementById('progress-bar');
const uiStreak = document.getElementById('streak-count');

// Profile Data Elements
const uiName = document.getElementById('profile-name');
const uiAvatar = document.getElementById('profile-avatar');
const uiModalAvatar = document.getElementById('modal-profile-avatar'); 

// Notifications & Modals
const uiAnnModal = document.getElementById('announce-modal');
const uiAnnBody = document.getElementById('modal-announce-body');
const uiBadge = document.getElementById('badge');

// Global State
let currentUserDoc = null; 
let players = {}; 
let notifList = []; 
// Fallback if external variables are missing
let globalCurriculum = (typeof curriculum !== 'undefined') ? curriculum : [];
let globalMaths = (typeof mathsCurriculum !== 'undefined') ? mathsCurriculum : {};

// ==========================================
// --- 2. AUTHENTICATION & STRICT VERIFICATION ---
// ==========================================

auth.onAuthStateChanged(async (user) => {
    if (user) {
        // --- STRICT SECURITY CHECK: Email Verification ---
        if (!user.emailVerified && user.providerData.length > 0 && user.providerData[0].providerId === 'password') {
            await auth.signOut();
            alert("⚠️ Login Blocked: Email not verified.\n\nPlease check your inbox/spam folder for the verification link.");
            
            if(uiLoading) uiLoading.classList.add('hidden');
            if(uiAuth) uiAuth.classList.remove('hidden');
            return;
        }

        // Proceed if Verified
        await syncDatabase(); 
        subscribeToNotifications(); 
        
        if(uiLoading) uiLoading.classList.add('hidden');
        if(uiAuth) uiAuth.classList.add('hidden');
        if(uiApp) uiApp.classList.remove('hidden'); 
        
        loadUserProgress(user.uid);
    } else {
        // User Logged Out
        if(uiLoading) uiLoading.classList.add('hidden');
        if(uiAuth) uiAuth.classList.remove('hidden');
        if(uiApp) uiApp.classList.add('hidden');
    }
});

// Login Form Submit Handler
const loginForm = document.getElementById('login-form');
if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const errBox = document.getElementById('auth-error');
        
        if(errBox) errBox.innerText = "Verifying credentials...";
        
        auth.signInWithEmailAndPassword(email, pass).catch(err => {
            let msg = "Invalid Credentials";
            if(err.code === 'auth/user-not-found') msg = "Account not found. Please Sign Up.";
            if(err.code === 'auth/wrong-password') msg = "Incorrect password.";
            if(err.code === 'auth/too-many-requests') msg = "Too many attempts. Try later.";
            if(errBox) errBox.innerText = msg;
        });
    });
}

// Google Login Handler
window.handleGoogleLogin = async function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try { 
        await auth.signInWithPopup(provider); 
    } catch (e) { 
        alert("Google Login Error: " + e.message); 
    }
}

// Forgot Password Handler
window.forgotPassword = function() {
    const email = prompt("Enter your registered email address:");
    if(email && email.includes('@')) {
        auth.sendPasswordResetEmail(email)
            .then(() => alert("✅ Password reset link sent to " + email + "\nCheck your Inbox/Spam."))
            .catch(e => alert("Error: " + e.message));
    }
}

// Logout Handler
const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to logout?")) {
            auth.signOut().then(() => location.reload());
        }
    });
}

// ==========================================
// --- 3. DATA SYNC ---
// ==========================================
async function syncDatabase() {
    try {
        const cSnap = await db.collection('curriculum').orderBy('day').get();
        if (!cSnap.empty) globalCurriculum = cSnap.docs.map(d => d.data());
        
        const mSnap = await db.collection('maths_curriculum').get();
        if (!mSnap.empty) { 
            globalMaths = {}; 
            mSnap.forEach(d => { globalMaths[d.id] = d.data(); }); 
        }
    } catch (e) { 
        console.warn("Offline Mode / Data Sync Error: ", e); 
    }
}

// ==========================================
// --- 4. PROFILE MANAGEMENT & EDIT ---
// ==========================================

window.openProfileModal = function() {
    if(!currentUserDoc) return;

    const nameInput = document.getElementById('edit-name');
    const mobileInput = document.getElementById('edit-mobile');
    const emailInput = document.getElementById('edit-email');

    if(nameInput) nameInput.value = currentUserDoc.name || "";
    if(mobileInput) mobileInput.value = currentUserDoc.mobile || "";
    if(emailInput) emailInput.value = currentUserDoc.email || auth.currentUser.email;
    
    if(uiModalAvatar) {
        uiModalAvatar.innerText = (currentUserDoc.name || "S").charAt(0).toUpperCase();
    }
    
    toggleModal('profile-modal');
}

window.saveProfile = async function() {
    const nameInput = document.getElementById('edit-name');
    const mobileInput = document.getElementById('edit-mobile');

    if(!nameInput) return; // Safety check

    const newName = nameInput.value;
    const newMobile = mobileInput ? mobileInput.value : "";
    
    if(!newName.trim()) return alert("Name cannot be empty.");
    
    // --- NEW: ADVANCED MOBILE VALIDATION ---
    if(newMobile) {
        if(newMobile.length !== 10) return alert("Mobile number must be 10 digits.");
        // Check for repeated digits like 9999999999, 0000000000
        if(/^(\d)\1{9}$/.test(newMobile)) {
            return alert("Please enter a valid mobile number (Repeated digits not allowed).");
        }
    }

    const btn = event.target; 
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        await db.collection('users').doc(auth.currentUser.uid).update({
            name: newName,
            mobile: newMobile
        });
        
        currentUserDoc.name = newName;
        currentUserDoc.mobile = newMobile;
        updateUI(auth.currentUser.uid);
        
        toggleModal('profile-modal');
        alert("✅ Profile Updated!"); 
    } catch(e) {
        alert("Error updating profile: " + e.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// --- 5. REPORT FORM AUTO-FILL (NEW) ---
// ==========================================

// Listen for clicks to open the Help & Support modal
document.addEventListener('click', function(e) {
    // Check if user clicked the "Help & Support" nav item
    if(e.target.closest('.nav-item') && e.target.closest('.nav-item').innerText.includes('Help & Support')) {
        prefillReportForm();
    }
});

function prefillReportForm() {
    if(!currentUserDoc) return;
    
    const form = document.getElementById('ajax-report-form');
    if(form) {
        const nameField = form.querySelector('input[name="name"]');
        const emailField = form.querySelector('input[name="email"]');
        const mobileField = form.querySelector('input[name="mobile"]');
        
        // Only fill if empty to avoid overwriting user changes
        if(nameField && !nameField.value) nameField.value = currentUserDoc.name || "";
        
        // Email: DB value OR Auth Value
        if(emailField && !emailField.value) {
            emailField.value = currentUserDoc.email || auth.currentUser.email || "";
        }
        
        if(mobileField && !mobileField.value) mobileField.value = currentUserDoc.mobile || "";
    }
}

// ==========================================
// --- 6. NOTIFICATIONS SYSTEM ---
// ==========================================
function subscribeToNotifications() {
    db.collection('config').doc('announcements').onSnapshot((doc) => {
        if (doc.exists && doc.data().list) {
            const newList = doc.data().list;
            if (JSON.stringify(newList) !== JSON.stringify(notifList)) {
                notifList = newList;
                if(uiBadge) uiBadge.style.display = "block";
                if(uiAnnModal && !uiAnnModal.classList.contains('hidden')) renderNotificationList();
            }
        } else {
            notifList = [];
            if(uiBadge) uiBadge.style.display = "none";
        }
    });
}

window.showAnnouncement = function(openModal) {
    if(openModal && uiAnnModal) { 
        toggleModal('announce-modal');
        if(uiBadge) uiBadge.style.display = "none"; 
    }
    renderNotificationList();
}

function renderNotificationList() {
    if(!uiAnnBody) return;
    
    if (notifList.length > 0) {
        let html = "";
        notifList.forEach(item => {
            html += `
            <div class="notif-item">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-size:0.7rem; color:var(--primary); font-weight:700;">${item.date}</span>
                </div>
                <div style="color:var(--text-main); font-size:0.9rem; line-height:1.4;">${item.text}</div>
            </div>`;
        });
        uiAnnBody.innerHTML = html;
    } else {
        uiAnnBody.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No new notifications.</div>`;
    }
}

// ==========================================
// --- 7. DASHBOARD LOGIC (Streak & Progress) ---
// ==========================================
window.loadUserProgress = async function(uid) {
    if(uiContent) {
        uiContent.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; color:var(--primary);"></i>
            <p style="margin-top:10px;">Syncing Progress...</p>
        </div>`;
    }

    const doc = await db.collection('users').doc(uid).get();
    
    if (!doc.exists) {
        const user = auth.currentUser;
        const defaultData = { 
            name: user.displayName || "Student", 
            email: user.email, 
            mobile: "",
            currentDay: 1, 
            mathsChapter: 1, 
            progress: 0, 
            streakCount: 1, 
            lastLoginDate: new Date().toDateString()
        };
        await db.collection('users').doc(uid).set(defaultData);
        currentUserDoc = defaultData;
    } else {
        currentUserDoc = doc.data();
        await calculateStreak(uid);
    }
    
    updateUI(uid); 
}

async function calculateStreak(uid) {
    const today = new Date().toDateString();
    const yesterday = new Date(new Date().setDate(new Date().getDate()-1)).toDateString();
    const lastLogin = currentUserDoc.lastLoginDate;
    
    let newStreak = currentUserDoc.streakCount || 0;

    if (lastLogin !== today) {
        if (lastLogin === yesterday) {
            newStreak += 1; 
        } else {
            newStreak = 1; 
        }
        
        db.collection('users').doc(uid).update({
            lastLoginDate: today,
            streakCount: newStreak
        });
        
        currentUserDoc.streakCount = newStreak;
    }
}

// ==========================================
// --- 8. UPDATE UI (SAFE & CRASH PROOF) ---
// ==========================================
function updateUI(uid) {
    if (!currentUserDoc) return;

    // --- Safe Profile Updates ---
    if(uiName) uiName.innerText = currentUserDoc.name || "Student";
    
    // Check if elements exist before setting innerText
    const uiMobileDisplay = document.getElementById('profile-mobile'); // Sometimes missing in new HTML
    if(uiMobileDisplay) {
        uiMobileDisplay.innerText = currentUserDoc.mobile 
            ? "+91 " + currentUserDoc.mobile 
            : (currentUserDoc.email || "");
    }

    if(uiAvatar) {
        uiAvatar.innerText = (currentUserDoc.name || "S").charAt(0).toUpperCase();
    }
    
    // --- Stats Updates ---
    const day = currentUserDoc.currentDay || 1;
    const prog = Math.round(currentUserDoc.progress || 0);
    
    if(uiDayBadge) uiDayBadge.innerText = (day < 10 ? '0' : '') + day;
    if(uiProgVal) uiProgVal.innerText = prog + "%";
    if(uiProgBar) uiProgBar.style.width = prog + "%";
    
    if(uiStreak) uiStreak.innerText = currentUserDoc.streakCount || 1;

    // --- Content Rendering ---
    if(!uiContent) return;

    const today = new Date();
    
    // Sunday Logic
    if (today.getDay() === 0) {
        uiContent.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-coffee" style="font-size:3rem; margin-bottom:15px; color:var(--warning);"></i>
            <h3>Sunday Break</h3>
            <p>New content is locked. Use the <b>Revision Vault</b> to practice.</p>
        </div>`;
        return;
    }

    // Cooldown Logic
    if (currentUserDoc.lastCompletedAt) {
        const diff = (today - currentUserDoc.lastCompletedAt.toDate()) / 36e5; 
        if (diff < 2) {
            const unlockTime = new Date(currentUserDoc.lastCompletedAt.toDate().getTime() + 2*3600000)
                                    .toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            uiContent.innerHTML = `
            <div style="text-align:center; padding:30px; background:var(--bg-card); border-radius:16px; border:1px solid var(--border);">
                <i class="fas fa-check-circle" style="font-size:3rem; color:var(--success); margin-bottom:15px;"></i>
                <h3 style="color:white;">Day Completed!</h3>
                <p style="color:var(--text-muted); margin-bottom:20px;">Next content unlocks automatically.</p>
                <div style="background:rgba(59,130,246,0.1); color:var(--primary); padding:10px; border-radius:8px; display:inline-block; font-weight:600;">
                    Unlocks at: ${unlockTime}
                </div>
            </div>`;
            return;
        }
    }

    renderDailyContent(day, currentUserDoc.mathsChapter || 1, uid);
}

// ==========================================
// --- 9. CONTENT RENDERER ---
// ==========================================
function renderDailyContent(day, mathCh, uid) {
    uiContent.innerHTML = `<div class="section-label">Today's Targets • Day ${day}</div>`;
    
    const dayData = globalCurriculum.find(d => d.day === day);
    
    if (dayData) {
        ['physics', 'chemistry'].forEach(sub => {
            if(dayData.videos && dayData.videos[sub]) {
                uiContent.innerHTML += createVideoCard(sub, dayData.videos[sub].title, dayData.videos[sub].id);
            }
        });
    } else {
        uiContent.innerHTML += `<div style="text-align:center; padding:20px; color:var(--text-muted);">Content Loading...</div>`;
    }

    if (globalMaths[mathCh]) {
        const m = globalMaths[mathCh];
        uiContent.innerHTML += `
        <div class="video-card">
            <div class="video-meta">
                <div class="video-tag">Maths • Ch ${mathCh}</div>
                <div class="video-title">${m.title}</div>
            </div>
            <div style="padding:20px; text-align:center;">
                <button class="btn btn-primary" onclick="renderMathPlaylist('${uid}', '${mathCh}')">
                    <i class="fas fa-play"></i> Start Chapter
                </button>
            </div>
        </div>`;
    }

    const btnDiv = document.createElement('div');
    btnDiv.innerHTML = `<button class="btn btn-outline" style="margin-top:15px; border-color:var(--success); color:var(--success);">
        <i class="fas fa-check"></i> Mark Day Complete
    </button>`;
    btnDiv.onclick = () => completeDay(uid, day);
    uiContent.appendChild(btnDiv);
}

window.renderMathPlaylist = function(uid, ch) {
    uiContent.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <div class="section-label" style="margin:0;">Maths • ${globalMaths[ch].title}</div>
        <button class="btn btn-outline" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="loadUserProgress('${uid}')">Back</button>
    </div>`;

    if(globalMaths[ch].videos) {
        globalMaths[ch].videos.forEach((v, i) => {
            uiContent.innerHTML += createVideoCard(`Part ${i+1}`, v.title, v.id);
        });
    }

    const finishBtn = document.createElement('button');
    finishBtn.className = "btn btn-primary";
    finishBtn.style.marginTop = "20px";
    finishBtn.innerHTML = "Finish Chapter <i class='fas fa-arrow-right'></i>";
    finishBtn.onclick = () => completeMaths(uid, ch);
    uiContent.appendChild(finishBtn);
}

// ==========================================
// --- 10. VIDEO PLAYER (CINEMA MODE) ---
// ==========================================
function createVideoCard(tag, title, id) {
    const cardId = 'card-'+id;
    return `
    <div class="video-card" id="${cardId}">
        <div class="video-meta">
            <div class="video-tag">${tag}</div>
            <div class="video-title">${title}</div>
        </div>
        <div class="thumbnail-area" onclick="playVideo('${id}', '${cardId}')">
            <img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" style="position:absolute; width:100%; height:100%; object-fit:cover; opacity:0.6;">
            <div class="play-btn"><i class="fas fa-play" style="margin-left:4px;"></i></div>
            <div id="wrapper-${id}" style="position:absolute; inset:0; display:none; background:black;"></div>
        </div>
        <button class="close-cinema" id="close-${id}" onclick="closeVideo('${id}', '${cardId}')">
            <i class="fas fa-arrow-left"></i> Back
        </button>
    </div>`;
}

window.playVideo = function(vid, cardId) {
    const card = document.getElementById(cardId);
    const wrapper = document.getElementById(`wrapper-${vid}`);
    const closeBtn = document.getElementById(`close-${vid}`);

    if(card && window.innerWidth < 768) {
        card.classList.add('cinema-mode');
        if(closeBtn) closeBtn.style.display = 'block';
    }

    if(wrapper) {
        wrapper.style.display = 'block';
        wrapper.innerHTML = `<div id="yt-${vid}"></div>`;

        players[vid] = new YT.Player(`yt-${vid}`, {
            height: '100%', width: '100%', videoId: vid,
            playerVars: { 'modestbranding': 1, 'rel': 0, 'fs': 0, 'autoplay': 1, 'playsinline': 1 }
        });
    }
}

window.closeVideo = function(vid, cardId) {
    const card = document.getElementById(cardId);
    if(card) card.classList.remove('cinema-mode');
    
    const closeBtn = document.getElementById(`close-${vid}`);
    if(closeBtn) closeBtn.style.display = 'none';
    
    const wrapper = document.getElementById(`wrapper-${vid}`);
    if(wrapper) {
        wrapper.innerHTML = ""; 
        wrapper.style.display = "none";
    }
}

// ==========================================
// --- 11. REVISION & COMPLETION ---
// ==========================================
window.renderPreviousDays = function() {
    uiContent.innerHTML = `<div class="section-label">Revision History</div>`;
    
    if(!currentUserDoc || currentUserDoc.currentDay <= 1) {
         uiContent.innerHTML += `<div style="text-align:center; padding:30px; color:var(--text-muted);">No history available. Complete Day 1 first.</div>`;
         return;
    }

    for(let i=1; i<currentUserDoc.currentDay; i++) {
        const d = globalCurriculum.find(x => x.day === i);
        uiContent.innerHTML += `
        <div class="notif-item" onclick="renderDailyContent(${i}, 0, '${auth.currentUser.uid}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <span style="color:var(--success); font-weight:bold; font-size:0.8rem;">DAY ${i}</span> 
                <span style="color:white; margin-left:8px;">${d?.title || 'Topic'}</span>
            </div>
            <i class="fas fa-chevron-right" style="color:var(--text-muted);"></i>
        </div>`;
    }
}

async function completeDay(uid, day) {
    if(!confirm("Did you complete all videos for today?")) return;
    
    await db.collection('users').doc(uid).update({ 
        currentDay: day + 1, 
        progress: Math.min(((day)/30)*100, 100), 
        lastCompletedAt: new Date() 
    });
    location.reload();
}

async function completeMaths(uid, ch) {
    if(!confirm("Are you sure you finished this chapter?")) return;
    await db.collection('users').doc(uid).update({ 
        mathsChapter: parseInt(ch)+1 
    });
    location.reload();
}
