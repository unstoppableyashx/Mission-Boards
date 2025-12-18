// js/app.js - Final Production Version
// Features: Custom Popups, Strict Timer (1Hr), Watched Tracking, Anti-Spam, Security

// ==========================================
// --- 0. CUSTOM POPUP SYSTEM (REPLACES ALERTS) ---
// ==========================================

const uiPopup = document.getElementById('custom-popup');
const popTitle = document.getElementById('popup-title');
const popMsg = document.getElementById('popup-msg');
const popIcon = document.getElementById('popup-icon');
const popInputDiv = document.getElementById('popup-input-container');
const popInput = document.getElementById('popup-input');
const btnConfirm = document.getElementById('btn-confirm');
const btnCancel = document.getElementById('btn-cancel');

// 1. Custom Alert (Async - Waits for User)
window.showAlert = function(msg, type = "info") {
    return new Promise((resolve) => {
        setupPopup(type);
        popMsg.innerHTML = msg; 
        btnCancel.classList.add('hidden');
        popInputDiv.classList.add('hidden');
        
        showPopup();
        
        // Remove old listeners to prevent stacking
        const newBtn = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
        
        newBtn.onclick = () => {
            hidePopup();
            resolve(true);
        };
    });
};

// 2. Custom Confirm (Async - Returns true/false)
window.showConfirm = function(msg) {
    return new Promise((resolve) => {
        setupPopup("warning");
        popTitle.innerText = "Confirmation";
        popMsg.innerHTML = msg;
        btnCancel.classList.remove('hidden');
        popInputDiv.classList.add('hidden');
        
        // Update Button Text
        const confirmBtn = document.getElementById('btn-confirm');
        confirmBtn.innerText = "Yes, Proceed";
        
        showPopup();

        // Handle Yes
        const newConfirm = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        newConfirm.onclick = () => { hidePopup(); resolve(true); };

        // Handle No
        const newCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newCancel, btnCancel);
        newCancel.onclick = () => { hidePopup(); resolve(false); };
    });
};

// 3. Custom Prompt (Async - Returns value or null)
window.showPrompt = function(msg, placeholder = "") {
    return new Promise((resolve) => {
        setupPopup("info");
        popTitle.innerText = "Input Required";
        popMsg.innerText = msg;
        btnCancel.classList.remove('hidden');
        popInputDiv.classList.remove('hidden');
        popInput.value = "";
        popInput.placeholder = placeholder;
        
        const confirmBtn = document.getElementById('btn-confirm');
        confirmBtn.innerText = "Submit";
        
        showPopup();
        setTimeout(() => popInput.focus(), 100);

        // Handle Submit
        const newConfirm = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        
        newConfirm.onclick = () => { 
            const val = popInput.value;
            if(!val) return; 
            hidePopup(); 
            resolve(val); 
        };

        // Handle Cancel
        const newCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newCancel, btnCancel);
        newCancel.onclick = () => { hidePopup(); resolve(null); };
    });
};

// Popup Helper Functions
function setupPopup(type) {
    let iconHtml = '';
    let titleText = '';
    const confirmBtn = document.getElementById('btn-confirm');
    
    // Icon Logic
    if(type === 'success') { 
        iconHtml = '<i class="fas fa-check-circle"></i>'; 
        titleText = "Success"; 
        popIcon.className = 'success'; 
    }
    else if(type === 'error') { 
        iconHtml = '<i class="fas fa-times-circle"></i>'; 
        titleText = "Error"; 
        popIcon.className = 'error'; 
    }
    else if(type === 'warning') { 
        iconHtml = '<i class="fas fa-exclamation-triangle"></i>'; 
        titleText = "Warning"; 
        popIcon.className = 'warning'; 
    }
    else { 
        iconHtml = '<i class="fas fa-info-circle"></i>'; 
        titleText = "Information"; 
        popIcon.className = 'info'; 
    }

    popIcon.innerHTML = iconHtml;
    popTitle.innerText = titleText;
    confirmBtn.innerText = "OK";
}

function showPopup() { if(uiPopup) uiPopup.classList.remove('hidden'); }
function hidePopup() { if(uiPopup) uiPopup.classList.add('hidden'); }


// ==========================================
// --- 1. DOM ELEMENTS & GLOBAL VARIABLES ---
// ==========================================

// Screens
const uiLoading = document.getElementById('loading-screen');
const uiAuth = document.getElementById('auth-container');
const uiApp = document.getElementById('app-container');
const uiContent = document.getElementById('content-area');

// Stats & Profile UI
const uiDayBadge = document.getElementById('day-badge');
const uiProgVal = document.getElementById('prog-val');
const uiProgBar = document.getElementById('progress-bar');
const uiStreak = document.getElementById('streak-count');

// Profile Data Elements
const uiName = document.getElementById('profile-name');
const uiMobile = document.getElementById('profile-mobile');
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

// New Tracking Variables
let mathsTimerInterval = null; 
let isMathsPlaying = false; 

// Data Fallback
let globalCurriculum = (typeof curriculum !== 'undefined') ? curriculum : [];
let globalMaths = (typeof mathsCurriculum !== 'undefined') ? mathsCurriculum : {};

// ==========================================
// --- 2. AUTHENTICATION & SECURITY ---
// ==========================================

auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Strict Verification Check
        if (!user.emailVerified && user.providerData.length > 0 && user.providerData[0].providerId === 'password') {
            await auth.signOut();
            await showAlert("⚠️ <b>Login Blocked:</b> Email not verified.<br>Please check your inbox.", "error");
            
            if(uiLoading) uiLoading.classList.add('hidden');
            if(uiAuth) uiAuth.classList.remove('hidden');
            return;
        }

        // Load App
        await syncDatabase(); 
        subscribeToNotifications(); 
        
        if(uiLoading) uiLoading.classList.add('hidden');
        if(uiAuth) uiAuth.classList.add('hidden');
        if(uiApp) uiApp.classList.remove('hidden'); 
        
        loadUserProgress(user.uid);
    } else {
        // Logout State
        if(uiLoading) uiLoading.classList.add('hidden');
        if(uiAuth) uiAuth.classList.remove('hidden');
        if(uiApp) uiApp.classList.add('hidden');
    }
});

// Login Form Handler
const loginForm = document.getElementById('login-form');
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const errBox = document.getElementById('auth-error');
        if(errBox) errBox.innerText = "Verifying credentials...";
        
        try {
            await auth.signInWithEmailAndPassword(email, pass);
        } catch(err) {
            let msg = "Invalid Credentials";
            if(err.code === 'auth/user-not-found') msg = "Account not found.";
            if(err.code === 'auth/wrong-password') msg = "Incorrect password.";
            if(errBox) errBox.innerText = msg;
            await showAlert(msg, "error");
        }
    });
}

// Google Login
window.handleGoogleLogin = async function() {
    try { 
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); 
    } catch (e) { 
        await showAlert("Google Login Error: " + e.message, "error"); 
    }
}

// Forgot Password
window.forgotPassword = async function() {
    const email = await showPrompt("Enter your registered email address:", "student@example.com");
    if(email && email.includes('@')) {
        auth.sendPasswordResetEmail(email)
            .then(() => showAlert("✅ Password reset link sent.", "success"))
            .catch(e => showAlert("Error: " + e.message, "error"));
    }
}

// Logout
const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if(await showConfirm("Are you sure you want to logout?")) {
            auth.signOut().then(() => location.reload());
        }
    });
}

// ==========================================
// --- 3. DATA SYNC & TRACKING LOGIC ---
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
    } catch (e) { console.warn("Sync Error: ", e); }
}

// --- MATHS TIMER LOGIC (1 Hour Check) ---
function startMathsTimer() {
    if (isMathsPlaying) return;
    isMathsPlaying = true;
    
    mathsTimerInterval = setInterval(() => {
        // Initialize if missing
        if (!currentUserDoc.mathsSeconds) currentUserDoc.mathsSeconds = 0;
        currentUserDoc.mathsSeconds += 1;

        // Auto-save every 1 minute
        if (currentUserDoc.mathsSeconds % 60 === 0) {
            saveProgressToDB();
        }
    }, 1000);
}

function stopMathsTimer() {
    isMathsPlaying = false;
    clearInterval(mathsTimerInterval);
    saveProgressToDB();
}

async function saveProgressToDB() {
    if (!auth.currentUser) return;
    await db.collection('users').doc(auth.currentUser.uid).update({
        mathsSeconds: currentUserDoc.mathsSeconds || 0
    });
}

// --- VIDEO WATCHED TRACKER ---
async function markVideoAsWatched(videoId) {
    if (!currentUserDoc.watchedVideos) currentUserDoc.watchedVideos = [];
    
    if (!currentUserDoc.watchedVideos.includes(videoId)) {
        currentUserDoc.watchedVideos.push(videoId);
        await db.collection('users').doc(auth.currentUser.uid).update({
            watchedVideos: firebase.firestore.FieldValue.arrayUnion(videoId)
        });
    }
}

// ==========================================
// --- 4. PROFILE HANDLERS ---
// ==========================================
window.openProfileModal = function() {
    if(!currentUserDoc) return;
    const nameInput = document.getElementById('edit-name');
    const mobileInput = document.getElementById('edit-mobile');
    const emailInput = document.getElementById('edit-email');

    if(nameInput) nameInput.value = currentUserDoc.name || "";
    if(mobileInput) mobileInput.value = currentUserDoc.mobile || "";
    if(emailInput) emailInput.value = currentUserDoc.email || auth.currentUser.email;
    if(uiModalAvatar) uiModalAvatar.innerText = (currentUserDoc.name || "S").charAt(0).toUpperCase();
    
    toggleModal('profile-modal');
}

window.saveProfile = async function() {
    const nameInput = document.getElementById('edit-name');
    const mobileInput = document.getElementById('edit-mobile');
    if(!nameInput) return;

    const newName = nameInput.value;
    const newMobile = mobileInput ? mobileInput.value : "";
    
    if(!newName.trim()) return showAlert("Name cannot be empty.", "warning");
    
    if(newMobile) {
        if(newMobile.length !== 10) return showAlert("Mobile number must be 10 digits.", "warning");
        if(/^(\d)\1{9}$/.test(newMobile)) return showAlert("Invalid mobile number.", "warning");
    }

    const btn = event.target; 
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        await db.collection('users').doc(auth.currentUser.uid).update({ name: newName, mobile: newMobile });
        currentUserDoc.name = newName;
        currentUserDoc.mobile = newMobile;
        updateUI(auth.currentUser.uid);
        toggleModal('profile-modal');
        await showAlert("✅ Profile Updated!", "success"); 
    } catch(e) { await showAlert("Error: " + e.message, "error"); } 
    finally { btn.innerText = originalText; btn.disabled = false; }
}

// Report Auto-fill Listener
document.addEventListener('click', function(e) {
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
        
        if(nameField && !nameField.value) nameField.value = currentUserDoc.name || "";
        if(emailField && !emailField.value) emailField.value = currentUserDoc.email || auth.currentUser.email || "";
        if(mobileField && !mobileField.value) mobileField.value = currentUserDoc.mobile || "";
    }
}

// ==========================================
// --- 5. NOTIFICATIONS & UI ---
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
            if(uiBadge) uiBadge.style.display = "none";
        }
    });
}

window.showAnnouncement = function(openModal) {
    if(openModal) { toggleModal('announce-modal'); if(uiBadge) uiBadge.style.display = "none"; }
    renderNotificationList();
}

function renderNotificationList() {
    if(!uiAnnBody) return;
    if (notifList.length > 0) {
        uiAnnBody.innerHTML = notifList.map(item => `
            <div class="notif-item">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-size:0.7rem; color:var(--primary); font-weight:700;">${item.date}</span>
                </div>
                <div style="color:var(--text-main); font-size:0.9rem; line-height:1.4;">${item.text}</div>
            </div>`).join('');
    } else { uiAnnBody.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No new notifications.</div>`; }
}

// ==========================================
// --- 6. DASHBOARD LOGIC ---
// ==========================================
window.loadUserProgress = async function(uid) {
    if(uiContent) uiContent.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; color:var(--primary);"></i>
            <p style="margin-top:10px;">Syncing Progress...</p></div>`;

    const doc = await db.collection('users').doc(uid).get();
    
    if (!doc.exists) {
        const user = auth.currentUser;
        const defaultData = { 
            name: user.displayName || "Student", email: user.email, mobile: "",
            currentDay: 1, mathsChapter: 1, progress: 0, streakCount: 1, 
            lastLoginDate: new Date().toDateString(),
            mathsSeconds: 0, watchedVideos: [] 
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
    let newStreak = currentUserDoc.streakCount || 0;

    if (currentUserDoc.lastLoginDate !== today) {
        newStreak = (currentUserDoc.lastLoginDate === yesterday) ? newStreak + 1 : 1;
        db.collection('users').doc(uid).update({ lastLoginDate: today, streakCount: newStreak });
        currentUserDoc.streakCount = newStreak;
    }
}

function updateUI(uid) {
    if (!currentUserDoc) return;

    if(uiName) uiName.innerText = currentUserDoc.name || "Student";
    if(uiMobile) {
        const mob = currentUserDoc.mobile ? "+91 " + currentUserDoc.mobile : (currentUserDoc.email || "");
        if(uiMobile) uiMobile.innerText = mob;
    }
    if(uiAvatar) uiAvatar.innerText = (currentUserDoc.name || "S").charAt(0).toUpperCase();
    
    const day = currentUserDoc.currentDay || 1;
    const prog = Math.round(currentUserDoc.progress || 0);
    
    if(uiDayBadge) uiDayBadge.innerText = (day < 10 ? '0' : '') + day;
    if(uiProgVal) uiProgVal.innerText = prog + "%";
    if(uiProgBar) uiProgBar.style.width = prog + "%";
    if(uiStreak) uiStreak.innerText = currentUserDoc.streakCount || 1;

    if(!uiContent) return;
    const today = new Date();
    
    // Sunday Logic
    if (today.getDay() === 0) {
        uiContent.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-coffee" style="font-size:3rem; margin-bottom:15px; color:var(--warning);"></i>
            <h3>Sunday Break</h3><p>New content is locked. Use the <b>Revision Vault</b>.</p></div>`;
        return;
    }

    // Cooldown Logic
    if (currentUserDoc.lastCompletedAt) {
        const diff = (today - currentUserDoc.lastCompletedAt.toDate()) / 36e5; 
        if (diff < 2) {
            const unlockTime = new Date(currentUserDoc.lastCompletedAt.toDate().getTime() + 2*3600000)
                                    .toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            uiContent.innerHTML = `<div style="text-align:center; padding:30px; background:var(--bg-card); border-radius:16px; border:1px solid var(--border);">
                <i class="fas fa-check-circle" style="font-size:3rem; color:var(--success); margin-bottom:15px;"></i>
                <h3 style="color:white;">Day Completed!</h3>
                <p style="color:var(--text-muted);">Next content unlocks automatically.</p>
                <div style="background:rgba(59,130,246,0.1); color:var(--primary); padding:10px; border-radius:8px; display:inline-block; font-weight:600; margin-top:10px;">
                    Unlocks at: ${unlockTime}
                </div></div>`;
            return;
        }
    }
    renderDailyContent(day, currentUserDoc.mathsChapter || 1, uid);
}

// ==========================================
// --- 7. VIDEO PLAYER & CONTENT ---
// ==========================================
function renderDailyContent(day, mathCh, uid) {
    uiContent.innerHTML = `<div class="section-label">Today's Targets • Day ${day}</div>`;
    const dayData = globalCurriculum.find(d => d.day === day);
    
    if (dayData) {
        ['physics', 'chemistry'].forEach(sub => {
            if(dayData.videos && dayData.videos[sub]) {
                // Pass category 'science' to track Watched Status
                uiContent.innerHTML += createVideoCard(sub, dayData.videos[sub].title, dayData.videos[sub].id, 'science');
            }
        });
    } else {
        uiContent.innerHTML += `<div style="text-align:center; padding:20px; color:var(--text-muted);">Content Loading...</div>`;
    }

    if (globalMaths[mathCh]) {
        const m = globalMaths[mathCh];
        uiContent.innerHTML += `<div class="video-card">
            <div class="video-meta"><div class="video-tag">Maths • Ch ${mathCh}</div><div class="video-title">${m.title}</div></div>
            <div style="padding:20px; text-align:center;">
                <button class="btn btn-primary" onclick="renderMathPlaylist('${uid}', '${mathCh}')"><i class="fas fa-play"></i> Start Chapter</button>
            </div></div>`;
    }

    const btnDiv = document.createElement('div');
    btnDiv.innerHTML = `<button class="btn btn-outline" style="margin-top:15px; border-color:var(--success); color:var(--success);"><i class="fas fa-check"></i> Mark Day Complete</button>`;
    btnDiv.onclick = () => completeDay(uid, day);
    uiContent.appendChild(btnDiv);
}

window.renderMathPlaylist = function(uid, ch) {
    uiContent.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <div class="section-label" style="margin:0;">Maths • ${globalMaths[ch].title}</div>
        <button class="btn btn-outline" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="loadUserProgress('${uid}')">Back</button>
    </div>`;

    if(globalMaths[ch].videos) {
        globalMaths[ch].videos.forEach((v, i) => {
            // Pass category 'maths' for Timer
            uiContent.innerHTML += createVideoCard(`Part ${i+1}`, v.title, v.id, 'maths');
        });
    }

    const finishBtn = document.createElement('button');
    finishBtn.className = "btn btn-primary";
    finishBtn.style.marginTop = "20px";
    finishBtn.innerHTML = "Finish Chapter <i class='fas fa-arrow-right'></i>";
    finishBtn.onclick = () => completeMaths(uid, ch);
    uiContent.appendChild(finishBtn);
}

function createVideoCard(tag, title, id, category = 'science') {
    const cardId = 'card-'+id;
    return `<div class="video-card" id="${cardId}">
        <div class="video-meta"><div class="video-tag">${tag}</div><div class="video-title">${title}</div></div>
        <div class="thumbnail-area" onclick="playVideo('${id}', '${cardId}', '${category}')">
            <img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" style="position:absolute; width:100%; height:100%; object-fit:cover; opacity:0.6;">
            <div class="play-btn"><i class="fas fa-play" style="margin-left:4px;"></i></div>
            <div id="wrapper-${id}" style="position:absolute; inset:0; display:none; background:black;"></div>
        </div>
        <button class="close-cinema" id="close-${id}" onclick="closeVideo('${id}', '${cardId}')"><i class="fas fa-arrow-left"></i> Back</button>
    </div>`;
}

// --- VIDEO PLAYER LOGIC (TRACKING) ---
window.playVideo = function(vid, cardId, category) {
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
            playerVars: { 'modestbranding': 1, 'rel': 0, 'fs': 0, 'autoplay': 1, 'playsinline': 1 },
            events: {
                'onStateChange': (event) => onPlayerStateChange(event, vid, category)
            }
        });
    }
}

function onPlayerStateChange(event, vid, category) {
    // 1. Maths Timer
    if (event.data == YT.PlayerState.PLAYING) {
        if (category === 'maths') startMathsTimer();
    } else if (event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.ENDED) {
        if (category === 'maths') stopMathsTimer();
        
        // 2. Science Watched Status
        if (event.data == YT.PlayerState.ENDED) markVideoAsWatched(vid);
    }
}

window.closeVideo = function(vid, cardId) {
    const card = document.getElementById(cardId);
    if(card) card.classList.remove('cinema-mode');
    if(document.getElementById(`close-${vid}`)) document.getElementById(`close-${vid}`).style.display = 'none';
    const wrapper = document.getElementById(`wrapper-${vid}`);
    if(wrapper) { wrapper.innerHTML = ""; wrapper.style.display = "none"; }
}

// ==========================================
// --- 8. REVISION & COMPLETION (STRICT MODE) ---
// ==========================================
window.renderPreviousDays = function() {
    uiContent.innerHTML = `<div class="section-label">Revision History</div>`;
    if(!currentUserDoc || currentUserDoc.currentDay <= 1) {
         uiContent.innerHTML += `<div style="text-align:center; padding:30px; color:var(--text-muted);">No history available. Complete Day 1 first.</div>`;
         return;
    }
    for(let i=1; i<currentUserDoc.currentDay; i++) {
        const d = globalCurriculum.find(x => x.day === i);
        uiContent.innerHTML += `<div class="notif-item" onclick="renderDailyContent(${i}, 0, '${auth.currentUser.uid}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <div><span style="color:var(--success); font-weight:bold; font-size:0.8rem;">DAY ${i}</span> 
            <span style="color:white; margin-left:8px;">${d?.title || 'Topic'}</span></div>
            <i class="fas fa-chevron-right" style="color:var(--text-muted);"></i></div>`;
    }
}

async function completeDay(uid, day) {
    const dayData = globalCurriculum.find(d => d.day === day);
    const userWatched = currentUserDoc.watchedVideos || [];
    const mathsTime = currentUserDoc.mathsSeconds || 0;
    
    // 1. Check Physics/Chem Videos
    let pendingVideos = [];
    if (dayData) {
        ['physics', 'chemistry'].forEach(sub => {
            if(dayData.videos && dayData.videos[sub]) {
                if (!userWatched.includes(dayData.videos[sub].id)) {
                    pendingVideos.push(sub.toUpperCase());
                }
            }
        });
    }

    if (pendingVideos.length > 0) {
        await showAlert(`⚠️ <b>Incomplete:</b> Finish these videos first:<br>- ${pendingVideos.join('<br>- ')}`, "warning");
        return;
    }

    // 2. Check Maths Timer (1 Hour = 3600 Seconds)
    const REQUIRED_SECONDS = 3600; 
    if (mathsTime < REQUIRED_SECONDS) {
        const remainingMins = Math.ceil((REQUIRED_SECONDS - mathsTime) / 60);
        await showAlert(`⚠️ <b>Maths Incomplete!</b><br>Study Maths for at least 1 hour.<br>Remaining: ${remainingMins} mins.`, "warning");
        return;
    }

    // 3. Confirmation & Save
    if(await showConfirm("Did you create notes and complete assignments?")) {
        await db.collection('users').doc(uid).update({ 
            currentDay: day + 1, progress: Math.min(((day)/30)*100, 100), lastCompletedAt: new Date() 
        });
        location.reload();
    }
}

async function completeMaths(uid, ch) {
    if(await showConfirm("Are you sure you finished this chapter?")) {
        await db.collection('users').doc(uid).update({ mathsChapter: parseInt(ch)+1 });
        location.reload();
    }
}

// Helpers
function switchNav(el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    if(window.innerWidth < 768) toggleSidebar();
}

function toggleModal(id) { 
    const el = document.getElementById(id);
    if(el) {
        el.classList.toggle('hidden');
        if(id === 'report-modal' && el.classList.contains('hidden')) {
            setTimeout(resetReportForm, 300);
        }
    }
}

function toggleSidebar() { 
    document.getElementById('main-sidebar').classList.toggle('active');
    const overlay = document.getElementById('sidebar-overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
}

function resetReportForm() {
    const reportForm = document.getElementById('ajax-report-form');
    const successMsg = document.getElementById('report-success-msg');
    const reportError = document.getElementById('rep-error');
    if(reportForm && successMsg) {
        reportForm.style.display = 'block';
        successMsg.classList.add('hidden');
        reportForm.reset();
        reportError.style.display = 'none';
    }
}
