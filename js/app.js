// js/app.js - SMART SHIELD VERSION

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

// BACK BUTTON LOGIC
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

    // Phys/Chem
    ['physics', 'chemistry'].forEach(sub => {
        if(dayData.videos[sub]) {
            const vid = dayData.videos[sub];
            uiContent.innerHTML += createSafeVideoCard(sub, vid.title, vid.id);
        }
    });

    // Maths
    if (typeof mathsCurriculum !== 'undefined') renderMathsSection(mathsCh, uid);

    // Complete Button
    const btnDiv = document.createElement('div');
    btnDiv.style.gridColumn = "1/-1"; btnDiv.style.textAlign = "center"; btnDiv.style.marginTop = "30px";
    btnDiv.innerHTML = `<div style="width:100%; height:1px; background:#334155; margin:20px 0;"></div>
        <button id="complete-day-btn" class="btn btn-outline">MARK DAY ${day} COMPLETE</button>`;
    uiContent.appendChild(btnDiv);

    setTimeout(() => {
        document.getElementById('complete-day-btn').addEventListener('click', async () => {
            if(!confirm("Physics & Chemistry done?")) return;
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
    data.videos.forEach((vid, index) => {
        uiContent.innerHTML += createSafeVideoCard(`Part ${index + 1}`, vid.title, vid.id);
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
                if(!confirm("Target Completed?")) return;
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

// --- 8. SMART SHIELD VIDEO CARD (Blocks Redirect, Allows Controls) ---
function createSafeVideoCard(subject, title, videoId) {
    const uniqueId = 'card-' + Math.random().toString(36).substr(2, 9);
    
    return `
    <div class="video-card" id="${uniqueId}">
        <div class="video-header">
            <div class="video-subject">${subject}</div>
            <div class="video-title">${title}</div>
        </div>
        <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; background:black;">
            
            <iframe 
                style="position:absolute; top:0; left:0; width:100%; height:100%;" 
                src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&fs=0" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
            
            <div style="position:absolute; top:0; left:0; width:100%; height:60px; z-index:20;"></div>
            
            <div style="position:absolute; bottom:35px; right:0; width:120px; height:60px; z-index:20;"></div>

            <button onclick="toggleFullScreen('${uniqueId}')" style="
                position:absolute; bottom:10px; right:10px; z-index:50;
                background:rgba(0,0,0,0.6); color:white; border:1px solid rgba(255,255,255,0.3);
                padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                ⛶ Full Screen
            </button>
        </div>
    </div>`;
}

// --- 9. FULLSCREEN LOGIC ---
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
