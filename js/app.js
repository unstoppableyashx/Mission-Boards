// js/app.js - FULL FEATURED (Streak, Google Auth, PWA Ready)

// --- 1. DOM ELEMENTS ---
const uiLoading = document.getElementById('loading-screen');
const uiAuth = document.getElementById('auth-container');
const uiApp = document.getElementById('app-container');
const uiContent = document.getElementById('content-area');

// Stats Elements
const uiDayBadge = document.getElementById('day-badge');
const uiProgVal = document.getElementById('prog-val');
const uiProgBar = document.getElementById('progress-bar');
const uiStreak = document.getElementById('streak-count'); // NEW STREAK UI

// Profile Elements
const uiName = document.getElementById('profile-name');
const uiMobile = document.getElementById('profile-mobile');
const uiAvatar = document.getElementById('profile-avatar');

// Notification Elements
const uiAnnModal = document.getElementById('announce-modal');
const uiAnnBody = document.getElementById('modal-announce-body');
const uiBadge = document.getElementById('badge');

// Global State
let currentUserDoc = null; 
let players = {}; 
let notifList = []; 
let globalCurriculum = (typeof curriculum !== 'undefined') ? curriculum : [];
let globalMaths = (typeof mathsCurriculum !== 'undefined') ? mathsCurriculum : {};

// --- 2. AUTHENTICATION & STARTUP ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User Logged In
        await syncDatabase(); 
        subscribeToNotifications(); 
        
        uiLoading.classList.add('hidden');
        uiAuth.classList.add('hidden');
        uiApp.classList.remove('hidden');
        
        // Load Profile & Calculate Streak
        loadUserProgress(user.uid);
    } else {
        // User Logged Out
        uiLoading.classList.add('hidden');
        uiAuth.classList.remove('hidden');
        uiApp.classList.add('hidden');
    }
});

// --- 3. LOGIN / SIGNUP HANDLERS ---

// Email Login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const errBox = document.getElementById('auth-error');
    
    errBox.innerText = "Verifying...";
    
    auth.signInWithEmailAndPassword(email, pass).catch(err => {
        let msg = "Invalid Credentials";
        if(err.code === 'auth/user-not-found') msg = "Account not found.";
        if(err.code === 'auth/wrong-password') msg = "Incorrect Password.";
        errBox.innerText = msg;
    });
});

// Google Login Handler
window.handleGoogleLogin = async function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        // Auth Listener will take over automatically
    } catch (error) {
        alert("Google Login Failed: " + error.message);
    }
}

// Forgot Password Handler
window.forgotPassword = function() {
    const email = prompt("Please enter your registered Email ID:");
    if(email) {
        auth.sendPasswordResetEmail(email)
            .then(() => alert(`Password reset link sent to ${email}`))
            .catch(e => alert("Error: " + e.message));
    }
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    if(confirm("Sign out?")) {
        auth.signOut().then(() => location.reload());
    }
});

// --- 4. DATA SYNC ---
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
        console.warn("Offline Mode Active");
    }
}

// --- 5. REAL-TIME NOTIFICATIONS ---
function subscribeToNotifications() {
    db.collection('config').doc('announcements')
      .onSnapshot((doc) => {
          if (doc.exists && doc.data().list) {
              const newList = doc.data().list;
              if (JSON.stringify(newList) !== JSON.stringify(notifList)) {
                  notifList = newList;
                  if(uiBadge) uiBadge.style.display = "block";
                  if(!uiAnnModal.classList.contains('hidden')) renderNotificationList();
              }
          } else {
              notifList = [];
              if(uiBadge) uiBadge.style.display = "none";
          }
      });
}

window.showAnnouncement = function(openModal) {
    if(openModal) {
        uiAnnModal.classList.remove('hidden');
        if(uiBadge) uiBadge.style.display = "none"; 
    }
    renderNotificationList();
}

function renderNotificationList() {
    if (notifList.length > 0) {
        let html = "";
        notifList.forEach(item => {
            html += `
            <div class="notif-item">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-size:0.7rem; color:var(--primary); font-weight:700; letter-spacing:1px;">UPDATE</span>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${item.date}</span>
                </div>
                <div style="color:var(--text-main); font-size:0.9rem; line-height:1.5;">${item.text}</div>
            </div>`;
        });
        uiAnnBody.innerHTML = html;
    } else {
        uiAnnBody.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No new updates.</div>`;
    }
}

// --- 6. USER PROFILE & STREAK LOGIC ---
window.loadUserProgress = async function(uid) {
    // Reset View for Navigation Fix
    uiContent.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">Loading Data...</div>`;

    const doc = await db.collection('users').doc(uid).get();
    
    if (!doc.exists) {
        // Create Default Profile (For Google Login users too)
        const user = auth.currentUser;
        const defaultData = { 
            name: user.displayName || "Student", 
            email: user.email, 
            mobile: "",
            currentDay: 1, mathsChapter: 1, progress: 0,
            streakCount: 1, lastLoginDate: new Date().toDateString()
        };
        await db.collection('users').doc(uid).set(defaultData);
        currentUserDoc = defaultData;
    } else {
        currentUserDoc = doc.data();
        await calculateStreak(uid); // Update Streak
    }
    
    updateUI(uid); 
}

async function calculateStreak(uid) {
    const today = new Date().toDateString();
    const yesterday = new Date(new Date().setDate(new Date().getDate()-1)).toDateString();
    const lastLogin = currentUserDoc.lastLoginDate;
    
    let newStreak = currentUserDoc.streakCount || 0;

    // Only update if login date is different
    if (lastLogin !== today) {
        if (lastLogin === yesterday) {
            newStreak += 1; // Increment streak
        } else {
            newStreak = 1; // Broken streak, reset
        }
        
        // Save to DB
        await db.collection('users').doc(uid).update({
            lastLoginDate: today,
            streakCount: newStreak
        });
        currentUserDoc.streakCount = newStreak;
    }
}

// --- 7. UI RENDERER ---
function updateUI(uid) {
    // Profile
    uiName.innerText = currentUserDoc.name || "Student";
    uiMobile.innerText = currentUserDoc.mobile ? "+91 " + currentUserDoc.mobile : currentUserDoc.email;
    uiAvatar.innerText = (currentUserDoc.name || "S").charAt(0).toUpperCase();

    // Stats
    const day = currentUserDoc.currentDay || 1;
    const prog = Math.round(currentUserDoc.progress || 0);
    
    uiDayBadge.innerText = (day < 10 ? '0' : '') + day;
    uiProgVal.innerText = prog + "%";
    uiProgBar.style.width = prog + "%";
    
    // Update Streak UI
    if(uiStreak) uiStreak.innerText = currentUserDoc.streakCount || 1;

    // Checks
    const today = new Date();
    
    // Sunday Logic
    if (today.getDay() === 0) {
        uiContent.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-coffee" style="font-size:3rem; margin-bottom:15px; color:var(--warning);"></i>
            <h3>Sunday Break</h3>
            <p>New content is locked. Use the <b>Revision Vault</b>.</p>
        </div>`;
        return;
    }

    // Cooldown Logic (2 Hours)
    if (currentUserDoc.lastCompletedAt) {
        const diff = (today - currentUserDoc.lastCompletedAt.toDate()) / 36e5;
        if (diff < 2) {
            const unlockTime = new Date(currentUserDoc.lastCompletedAt.toDate().getTime() + 2*3600000)
                                .toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            uiContent.innerHTML = `
            <div style="text-align:center; padding:30px; background:var(--bg-card); border-radius:16px; border:1px solid var(--border);">
                <i class="fas fa-check-circle" style="font-size:3rem; color:var(--success); margin-bottom:15px;"></i>
                <h3>Day Completed!</h3>
                <p style="color:var(--text-muted);">Next target unlocks at: <strong style="color:var(--primary)">${unlockTime}</strong></p>
            </div>`;
            return;
        }
    }

    renderDailyContent(day, currentUserDoc.mathsChapter || 1, uid);
}

// --- 8. CONTENT RENDERER ---
function renderDailyContent(day, mathCh, uid) {
    uiContent.innerHTML = `<div class="section-label">Today's Targets • Day ${day}</div>`;
    
    const dayData = globalCurriculum.find(d => d.day === day);
    
    if (dayData) {
        ['physics', 'chemistry'].forEach(sub => {
            if(dayData.videos[sub]) {
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
                <div class="video-tag">Maths • Chapter ${mathCh}</div>
                <div class="video-title">${m.title}</div>
            </div>
            <div style="padding:25px; text-align:center;">
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

// --- 9. MATHS PLAYLIST ---
window.renderMathPlaylist = function(uid, ch) {
    uiContent.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <div class="section-label" style="margin:0;">Maths • ${globalMaths[ch].title}</div>
        <button class="btn btn-outline" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="loadUserProgress('${uid}')">Back</button>
    </div>`;

    globalMaths[ch].videos.forEach((v, i) => {
        uiContent.innerHTML += createVideoCard(`Part ${i+1}`, v.title, v.id);
    });

    const finishBtn = document.createElement('button');
    finishBtn.className = "btn btn-primary";
    finishBtn.style.marginTop = "20px";
    finishBtn.innerHTML = "Finish Chapter <i class='fas fa-arrow-right'></i>";
    finishBtn.onclick = () => completeMaths(uid, ch);
    uiContent.appendChild(finishBtn);
}

// --- 10. VIDEO PLAYER (CINEMA MODE) ---
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

    if(window.innerWidth < 768) {
        card.classList.add('cinema-mode');
        closeBtn.style.display = 'block';
    }

    wrapper.style.display = 'block';
    wrapper.innerHTML = `<div id="yt-${vid}"></div>`;

    players[vid] = new YT.Player(`yt-${vid}`, {
        height: '100%', width: '100%', videoId: vid,
        playerVars: { 'modestbranding': 1, 'rel': 0, 'fs': 0, 'autoplay': 1, 'playsinline': 1 }
    });
}

window.closeVideo = function(vid, cardId) {
    const card = document.getElementById(cardId);
    card.classList.remove('cinema-mode');
    document.getElementById(`close-${vid}`).style.display = 'none';
    const wrapper = document.getElementById(`wrapper-${vid}`);
    wrapper.innerHTML = ""; 
    wrapper.style.display = "none";
}

// --- 11. REVISION VAULT ---
window.renderPreviousDays = function() {
    uiContent.innerHTML = `<div class="section-label">Revision History</div>`;
    const curr = currentUserDoc.currentDay || 1;
    
    if(curr === 1) {
        uiContent.innerHTML += `<div style="text-align:center; padding:30px; color:var(--text-muted);">Complete Day 1 to unlock revision.</div>`;
        return;
    }

    for(let i=1; i<curr; i++) {
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

// --- 12. COMPLETION LOGIC ---
async function completeDay(uid, day) {
    if(!confirm("Day Completed?")) return;
    await db.collection('users').doc(uid).update({ 
        currentDay: day + 1, progress: (day/30)*100, lastCompletedAt: new Date() 
    });
    location.reload();
}

async function completeMaths(uid, ch) {
    if(!confirm("Chapter Finished?")) return;
    await db.collection('users').doc(uid).update({ mathsChapter: parseInt(ch)+1 });
    location.reload();
}
