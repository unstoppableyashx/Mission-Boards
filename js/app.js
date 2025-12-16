// js/app.js - FINAL VERSION (Note-Taking Friendly + Keyboard Controls)

// --- 1. DOM ELEMENTS ---
const uiContent = document.getElementById('content-area');
const uiProgressBar = document.getElementById('progress-bar');
const uiProgressPercent = document.getElementById('progress-percent');
const uiDayBadge = document.getElementById('day-badge');
const uiTimer = document.getElementById('timer-display');
const uiLoading = document.getElementById('loading-screen');
const uiAuthBox = document.getElementById('auth-container');
const uiAppBox = document.getElementById('app-container');

const uiMathsHeader = document.getElementById('maths-nav-header');
const uiMathsTitle = document.getElementById('maths-header-title');
const uiMathsSub = document.getElementById('maths-header-subtitle');
const uiGlobalStatus = document.getElementById('global-status');
const uiBackBtn = document.getElementById('static-back-btn');

let currentUserDoc = null; 
let players = {}; // Store YouTube Player instances
let activePlayerId = null; // Track which video is active for keyboard controls

// --- 2. AUTHENTICATION ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        if(uiLoading) uiLoading.classList.add('hidden');
        if(uiAuthBox) uiAuthBox.classList.add('hidden');
        if(uiAppBox) uiAppBox.classList.remove('hidden');
        loadUserProgress(user.uid);
    } else {
        if(uiLoading) uiLoading.classList.add('hidden');
        if(uiAuthBox) uiAuthBox.classList.remove('hidden');
        if(uiAppBox) uiAppBox.classList.add('hidden');
    }
});

// GLOBAL KEYBOARD LISTENER
document.addEventListener('keydown', (e) => {
    if (!activePlayerId || !players[activePlayerId]) return;
    
    const player = players[activePlayerId];
    // Check if player function exists
    if(typeof player.getPlayerState !== 'function') return;

    // SPACE: Play/Pause
    if (e.code === 'Space') {
        e.preventDefault(); // Scroll hone se rokein
        const state = player.getPlayerState();
        if (state === 1) player.pauseVideo();
        else player.playVideo();
    }
    // LEFT ARROW: Seek Back 5s
    else if (e.code === 'ArrowLeft') {
        const time = player.getCurrentTime();
        player.seekTo(Math.max(time - 5, 0));
    }
    // RIGHT ARROW: Seek Forward 5s
    else if (e.code === 'ArrowRight') {
        const time = player.getCurrentTime();
        const duration = player.getDuration();
        player.seekTo(Math.min(time + 5, duration));
    }
    // UP ARROW: Volume Up
    else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const vol = player.getVolume();
        player.setVolume(Math.min(vol + 10, 100));
    }
    // DOWN ARROW: Volume Down
    else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const vol = player.getVolume();
        player.setVolume(Math.max(vol - 10, 0));
    }
    // 'F' KEY: Fullscreen
    else if (e.key.toLowerCase() === 'f') {
        const cardId = 'card-' + activePlayerId;
        toggleFullScreen(cardId);
    }
});

// BACK BUTTON
if (uiBackBtn) {
    uiBackBtn.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        if (currentUserDoc && auth.currentUser) {
            renderDashboard(currentUserDoc, auth.currentUser.uid);
        }
    });
}

// --- 3. DATA LOADING ---
async function loadUserProgress(uid) {
    try {
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            const defaultData = { 
                currentDay: 1, mathsChapter: 1, mathsDailyCount: 0, 
                mathsLastDate: new Date().toDateString(), progress: 0, email: auth.currentUser.email 
            };
            await userRef.set(defaultData);
            currentUserDoc = defaultData;
            renderDashboard(defaultData, uid);
        } else {
            currentUserDoc = doc.data();
            if(!currentUserDoc.mathsChapter) currentUserDoc.mathsChapter = 1;
            renderDashboard(currentUserDoc, uid);
        }
    } catch (error) { console.error(error); }
}

// --- 4. DASHBOARD ---
function renderDashboard(user, uid) {
    const currentDay = user.currentDay || 1;
    const mathsCh = user.mathsChapter || 1;
    
    // UI RESET
    if(uiGlobalStatus) uiGlobalStatus.classList.remove('hidden');
    if(uiMathsHeader) uiMathsHeader.classList.add('hidden');
    
    if(uiDayBadge) uiDayBadge.textContent = `DAY ${currentDay.toString().padStart(2, '0')}`;
    const pVal = user.progress || 0;
    if(uiProgressBar) uiProgressBar.style.width = `${pVal}%`;
    if(uiProgressPercent) uiProgressPercent.textContent = `${Math.round(pVal)}%`;

    if (new Date().getDay() === 0) { renderSundayMode(); return; }
    if (user.lastCompletedAt) {
        const diff = (new Date() - user.lastCompletedAt.toDate()) / 1000 / 3600;
        if (diff < 2) { renderLockMode(user.lastCompletedAt.toDate()); return; }
    }

    renderStudyMode(currentDay, mathsCh, uid);
}

// --- 5. RENDER STUDY MODE ---
function renderStudyMode(day, mathsCh, uid) {
    if (typeof curriculum === 'undefined') { uiContent.innerHTML = `<h3>Data Error</h3>`; return; }
    const dayData = curriculum.find(d => d.day === day);
    if (!dayData) { uiContent.innerHTML = `<h2>Complete</h2>`; return; }

    uiContent.innerHTML = ''; 
    if(uiTimer) uiTimer.innerHTML = `<span style="color:#10b981">● ACTIVE</span>`;
    players = {}; 

    // Phys/Chem
    ['physics', 'chemistry'].forEach(sub => {
        if(dayData.videos[sub]) {
            const vid = dayData.videos[sub];
            uiContent.innerHTML += createSmartVideoCard(sub, vid.title, vid.id);
            setTimeout(() => initSmartPlayer(vid.id), 500);
        }
    });

    // Maths
    if (typeof mathsCurriculum !== 'undefined') renderMathsSection(mathsCh, uid);

    const btnDiv = document.createElement('div');
    btnDiv.style.gridColumn = "1/-1"; btnDiv.style.textAlign = "center"; btnDiv.style.marginTop = "30px";
    btnDiv.innerHTML = `<div style="width:100%; height:1px; background:#334155; margin:20px 0;"></div>
        <button id="complete-day-btn" class="btn btn-outline">MARK DAY ${day} COMPLETE</button>`;
    uiContent.appendChild(btnDiv);

    setTimeout(() => {
        document.getElementById('complete-day-btn').addEventListener('click', async () => {
            if(!confirm("Day Completed?")) return;
            await db.collection('users').doc(uid).update({ currentDay: day + 1, progress: (day/30)*100, lastCompletedAt: new Date() });
            location.reload();
        });
    }, 100);
}

// --- 6. MATHS SECTION UI ---
function renderMathsSection(mathsCh, uid) {
    if (!mathsCurriculum[mathsCh]) return;
    const mData = mathsCurriculum[mathsCh];

    const wrapper = document.createElement('div');
    wrapper.style.gridColumn = "1/-1"; wrapper.style.marginTop = "30px";
    wrapper.style.padding = "20px"; wrapper.style.background = "#1e293b"; 
    wrapper.style.border = "1px solid #334155"; wrapper.style.borderRadius = "12px";

    wrapper.innerHTML = `<h3 style="color:#3b82f6; font-family:'JetBrains Mono'; margin-bottom:20px;">📐 MATHEMATICS ZONE</h3>
        <div id="maths-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px;"></div>`;

    const activeCard = document.createElement('div');
    activeCard.className = 'video-card';
    activeCard.style.border = "1px solid #3b82f6";
    activeCard.innerHTML = `<div class="video-header" style="background:rgba(59, 130, 246, 0.1)">
            <div class="video-subject" style="color:#3b82f6">CURRENT • CH ${mathsCh}</div>
            <div class="video-title">${mData.title}</div>
        </div>
        <div style="padding:20px; text-align:center;">
            <p style="color:#94a3b8; font-size:0.9rem;">Target: ${mData.target}</p>
            <button class="btn btn-primary" id="open-maths-btn">OPEN PLAYLIST ▶</button>
        </div>`;

    const nextCh = parseInt(mathsCh) + 1;
    if (mathsCurriculum[nextCh]) {
        wrapper.querySelector('#maths-grid').appendChild(activeCard);
        wrapper.querySelector('#maths-grid').innerHTML += `<div class="video-card" style="opacity:0.6; border:1px dashed #475569;">
            <div class="video-header"><div class="video-subject">UP NEXT</div><div class="video-title">${mathsCurriculum[nextCh].title}</div></div>
            <div style="padding:30px; text-align:center;">🔒 LOCKED</div>
        </div>`;
    } else {
        wrapper.querySelector('#maths-grid').appendChild(activeCard);
    }

    uiContent.appendChild(wrapper);
    setTimeout(() => {
        document.getElementById('open-maths-btn').addEventListener('click', () => renderMathsExpanded(mathsCh, mData, uid));
    }, 100);
}

// --- 7. MATHS EXPANDED ---
function renderMathsExpanded(chNum, data, uid) {
    const todayStr = new Date().toDateString();
    let dailyCount = currentUserDoc.mathsDailyCount || 0;
    if (currentUserDoc.mathsLastDate !== todayStr) dailyCount = 0;
    const limitReached = dailyCount >= 2;

    if(uiGlobalStatus) uiGlobalStatus.classList.add('hidden');
    if(uiMathsHeader) uiMathsHeader.classList.remove('hidden');
    if(uiMathsTitle) uiMathsTitle.innerText = `Ch ${chNum}: ${data.title}`;
    if(uiMathsSub) {
        uiMathsSub.innerText = `Daily Progress: ${dailyCount}/2 Chapters`;
        uiMathsSub.style.color = limitReached ? '#ef4444' : '#10b981';
    }

    uiContent.innerHTML = ''; 
    players = {}; // Reset

    data.videos.forEach((vid, index) => {
        uiContent.innerHTML += createSmartVideoCard(`Part ${index + 1}`, vid.title, vid.id);
        setTimeout(() => initSmartPlayer(vid.id), 500);
    });

    const finishDiv = document.createElement('div');
    finishDiv.style.gridColumn = "1/-1"; finishDiv.style.textAlign = "center"; finishDiv.style.marginTop = "30px";
    
    if (limitReached) {
        finishDiv.innerHTML = `<button class="btn btn-danger" disabled>DAILY LIMIT REACHED (2/2)</button>`;
    } else {
        finishDiv.innerHTML = `<button class="btn btn-primary" style="background:#10b981; color:#000;" id="finish-maths">I HAVE STUDIED 2.5 HOURS / FINISHED</button>`;
    }
    uiContent.appendChild(finishDiv);

    setTimeout(() => {
        const btn = document.getElementById('finish-maths');
        if(btn && !limitReached) {
            btn.addEventListener('click', async () => {
                if(!confirm("Did you actually complete the target?")) return;
                await db.collection('users').doc(uid).update({
                    mathsChapter: parseInt(chNum) + 1, mathsDailyCount: dailyCount + 1, mathsLastDate: todayStr
                });
                if(document.fullscreenElement) document.exitFullscreen();
                currentUserDoc.mathsChapter = parseInt(chNum) + 1;
                renderDashboard(currentUserDoc, uid);
            });
        }
    }, 100);
}

// --- 8. SMART VIDEO CARD (Transparent Pause Shield) ---
function createSmartVideoCard(subject, title, videoId) {
    const divId = 'player-wrapper-' + videoId;
    const overlayId = 'pause-overlay-' + videoId;
    const cardId = 'card-' + videoId;

    return `
    <div class="video-card" id="${cardId}">
        <div class="video-header">
            <div class="video-subject">${subject}</div>
            <div class="video-title">${title}</div>
        </div>
        <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; background:black;">
            
            <div id="${divId}" style="position:absolute; top:0; left:0; width:100%; height:100%;"></div>

            <div id="${overlayId}" class="pause-overlay" onclick="resumeVideo('${videoId}')">
                <div class="resume-icon-container">
                    <span class="resume-icon">▶</span>
                </div>
            </div>

            <div style="position:absolute; top:0; left:0; width:100%; height:60px; z-index:20;"></div>
            <div style="position:absolute; bottom:40px; right:0; width:100px; height:50px; z-index:20;"></div>

            <button class="custom-fs-btn" onclick="toggleFullScreen('${cardId}')">
                ⛶
            </button>
        </div>
    </div>`;
}

// --- 9. YOUTUBE API + KEYBOARD LOGIC ---
function initSmartPlayer(videoId) {
    const divId = 'player-wrapper-' + videoId;
    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
        setTimeout(() => initSmartPlayer(videoId), 1000);
        return;
    }

    players[videoId] = new YT.Player(divId, {
        height: '100%', width: '100%', videoId: videoId,
        playerVars: { 'modestbranding': 1, 'rel': 0, 'controls': 1, 'fs': 0, 'iv_load_policy': 3 },
        events: {
            'onStateChange': (event) => onPlayerStateChange(event, videoId)
        }
    });
}

function onPlayerStateChange(event, videoId) {
    const overlay = document.getElementById('pause-overlay-' + videoId);
    
    // Playing
    if (event.data === 1) {
        if(overlay) overlay.style.display = 'none';
        activePlayerId = videoId; // Set active for keyboard shortcuts
    } 
    // Paused (2) or Ended (0)
    else if (event.data === 2 || event.data === 0) {
        if(overlay) overlay.style.display = 'flex'; // Show transparent shield
    }
}

window.resumeVideo = function(videoId) {
    const player = players[videoId];
    if (player && typeof player.playVideo === 'function') {
        player.playVideo();
        document.getElementById('pause-overlay-' + videoId).style.display = 'none';
    }
};

window.toggleFullScreen = function(elementId) {
    const elem = document.getElementById(elementId);
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
};

// --- 10. MODES ---
function renderLockMode(lastTime) {
    uiContent.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px;"><h1 style="color:#ef4444">COOLDOWN ACTIVE</h1><h2>Rest for 2 Hours</h2></div>`;
}
function renderSundayMode() {
    uiContent.innerHTML = `<h1 style="color:white; text-align:center; grid-column:1/-1">SUNDAY REVISION</h1>`;
}
