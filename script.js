// --- Core Modular Architecture Properties State ---
const timerConfig = {
    WORK: { min: 25, sec: 0 },
    SHORT_BREAK: { min: 5, sec: 0 },
    LONG_BREAK: { min: 15, sec: 0 },
    roundsInterval: 4
};

let currentMode = 'WORK'; 
let timeLeft = 0;
let totalSessionTime = 0;
let timerId = null;
let completedSessions = 0;

// --- Node Cache DOM Element Mapping ---
const modeDisplay = document.getElementById('current-mode');
const countDisplay = document.getElementById('completed-count');
const targetDisplay = document.getElementById('target-count-display');
const timeDisplay = document.getElementById('time-left');

const startBtn = document.getElementById('btn-start');
const pauseBtn = document.getElementById('btn-pause');
const resetBtn = document.getElementById('btn-reset');
const soundCheckbox = document.getElementById('sound-chk');
const alarmSound = document.getElementById('alarm-sound');
const circle = document.querySelector('.progress-ring__circle');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const saveSettingsBtn = document.getElementById('btn-save-settings');

// Form Input Handlers
const inputWorkMin = document.getElementById('input-work-min');
const inputWorkSec = document.getElementById('input-work-sec');
const inputShortMin = document.getElementById('input-short-min');
const inputShortSec = document.getElementById('input-short-sec');
const inputLongMin = document.getElementById('input-long-min');
const inputLongSec = document.getElementById('input-long-sec');
const inputTargetSessions = document.getElementById('input-target-sessions');

// --- SVG Circular Arc Layout Render Initialization ---
let radius = circle.r.baseVal.value;
let circumference = radius * 2 * Math.PI;

function syncCircleMetrics() {
    radius = circle.r.baseVal.value;
    circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
}

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

// --- App Control Processes Engine ---
function calculateSeconds(min, sec) {
    return (parseInt(min, 10) * 60) + parseInt(sec, 10);
}

function syncTimeByCurrentMode() {
    const activeConfig = timerConfig[currentMode];
    timeLeft = calculateSeconds(activeConfig.min, activeConfig.sec);
    totalSessionTime = timeLeft;
}

function updateDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    let formattedMinutes = String(minutes).padStart(2, '0');
    let formattedSeconds = String(seconds).padStart(2, '0');
    
    const displayString = `${formattedMinutes}:${formattedSeconds}`;
    timeDisplay.textContent = displayString;
    document.title = `(${displayString}) Pomodoro Timer`;

    let progressPercent = totalSessionTime > 0 ? ((totalSessionTime - timeLeft) / totalSessionTime) * 100 : 0;
    setProgress(progressPercent);
}

function updateThemeLayout() {
    const root = document.documentElement;
    if (currentMode === 'WORK') {
        root.style.setProperty('--primary-color', 'var(--color-work)');
        modeDisplay.textContent = "Work Session";
    } else if (currentMode === 'SHORT_BREAK') {
        root.style.setProperty('--primary-color', 'var(--color-short)');
        modeDisplay.textContent = "Short Break";
    } else if (currentMode === 'LONG_BREAK') {
        root.style.setProperty('--primary-color', 'var(--color-long)');
        modeDisplay.textContent = "Long Break";
    }
    countDisplay.textContent = completedSessions;
    targetDisplay.textContent = timerConfig.roundsInterval;
}

function startTimer() {
    if (timerId !== null) return;

    startBtn.disabled = true;
    pauseBtn.disabled = false;
    saveSettingsBtn.disabled = true; 

    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            handleSessionCompletion();
        }
    }, 1000);
}

function pauseTimer() {
    if (timerId === null) return;
    
    clearInterval(timerId);
    timerId = null;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = 'Resume';
}

function resetTimer() {
    pauseTimer();
    startBtn.textContent = 'Start';
    saveSettingsBtn.disabled = false;
    syncTimeByCurrentMode();
    updateDisplay();
}

function handleSessionCompletion() {
    if (soundCheckbox.checked) {
        alarmSound.play().catch(e => console.warn("Audio processing context: ", e));
    }

    if (currentMode === 'WORK') {
        completedSessions++;
        if (completedSessions % timerConfig.roundsInterval === 0) {
            currentMode = 'LONG_BREAK';
        } else {
            currentMode = 'SHORT_BREAK';
        }
    } else {
        currentMode = 'WORK';
    }

    saveSettingsBtn.disabled = false;
    startBtn.textContent = 'Start';
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    syncTimeByCurrentMode();
    updateThemeLayout();
    updateDisplay();
}

// --- Configuration Form Save Module ---
function saveSettings() {
    timerConfig.WORK.min = Math.max(0, parseInt(inputWorkMin.value, 10) || 0);
    timerConfig.WORK.sec = Math.min(Math.max(0, parseInt(inputWorkSec.value, 10) || 0), 59);
    
    timerConfig.SHORT_BREAK.min = Math.max(0, parseInt(inputShortMin.value, 10) || 0);
    timerConfig.SHORT_BREAK.sec = Math.min(Math.max(0, parseInt(inputShortSec.value, 10) || 0), 59);
    
    timerConfig.LONG_BREAK.min = Math.max(0, parseInt(inputLongMin.value, 10) || 0);
    timerConfig.LONG_BREAK.sec = Math.min(Math.max(0, parseInt(inputLongSec.value, 10) || 0), 59);

    timerConfig.roundsInterval = Math.max(1, parseInt(inputTargetSessions.value, 10) || 4);

    resetTimer();
    updateThemeLayout();
}

// --- Color Palette Preferences Engine ---
function initColorMode() {
    const stored = localStorage.getItem('pomo-charcoal-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('pomo-charcoal-theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('pomo-charcoal-theme', 'dark');
    }
});

// --- Dynamic Layout Obverters ---
window.addEventListener('resize', () => {
    syncCircleMetrics();
    updateDisplay();
});

// --- Actions Event Listeners ---
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
saveSettingsBtn.addEventListener('click', saveSettings);

// --- System Initialization Bootstrapping ---
initColorMode();
syncCircleMetrics();
syncTimeByCurrentMode();
updateThemeLayout();
updateDisplay();