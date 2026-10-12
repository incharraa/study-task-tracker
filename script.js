
/* ==========================================
   STUDY TASK TRACKER
   Complete JavaScript
========================================== */

const SUBJECTS = [
    "DSA",
    "Java",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Other"
];

const STORAGE_KEYS = {
    tasks: "studyTrackerTasks",
    goal: "studyTrackerDailyGoal",
    dailyFocus: "studyTrackerDailyFocus",
    focusHistory: "studyTrackerFocusHistory",
    subjectFocus: "studyTrackerSubjectFocus",
    completedHistory: "studyTrackerCompletedHistory",
    achievements: "studyTrackerAchievements",
    streak: "studyTrackerStreak"
};

function readStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
    } catch (error) {
        console.error("Could not read saved data:", error);
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Could not save data:", error);
    }
}

function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatMinutes(seconds) {
    const minutes = Math.floor(Math.max(0, seconds) / 60);
    return `${minutes} min`;
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

/* ==========================================
   SAVED DATA
========================================== */

let tasks = readStorage(STORAGE_KEYS.tasks, []);
let dailyGoal = Number(readStorage(STORAGE_KEYS.goal, 120));

let dailyFocusHistory = readStorage(STORAGE_KEYS.dailyFocus, {});
let focusHistory = readStorage(STORAGE_KEYS.focusHistory, {});
let subjectFocusHistory = readStorage(STORAGE_KEYS.subjectFocus, {});
let completedHistory = readStorage(STORAGE_KEYS.completedHistory, {});
let achievements = readStorage(STORAGE_KEYS.achievements, {});
let streakData = readStorage(STORAGE_KEYS.streak, {
    current: 0,
    best: 0,
    lastStudyDate: ""
});

if (!Array.isArray(tasks)) {
    tasks = [];
}

if (!dailyFocusHistory || typeof dailyFocusHistory !== "object") {
    dailyFocusHistory = {};
}

if (!focusHistory || typeof focusHistory !== "object") {
    focusHistory = {};
}

if (!subjectFocusHistory || typeof subjectFocusHistory !== "object") {
    subjectFocusHistory = {};
}

if (!completedHistory || typeof completedHistory !== "object") {
    completedHistory = {};
}

if (!achievements || typeof achievements !== "object") {
    achievements = {};
}

if (!streakData || typeof streakData !== "object") {
    streakData = {
        current: 0,
        best: 0,
        lastStudyDate: ""
    };
}

tasks = tasks.map(function (task) {
    if (!task || typeof task !== "object") {
        return task;
    }

    return {
        ...task,
        subject: SUBJECTS.includes(task.subject) ? task.subject : "Other",
        completed: Boolean(task.completed),
        priority: task.priority || "Medium"
    };
}).filter(Boolean);

if (!Number.isFinite(dailyGoal) || dailyGoal < 1) {
    dailyGoal = 120;
}

const today = todayKey();

if (typeof dailyFocusHistory[today] !== "number") {
    dailyFocusHistory[today] = 0;
}

/* ==========================================
   ELEMENTS
========================================== */

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskSubject = document.getElementById("taskSubject");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");

const taskList = document.getElementById("taskList");
const completedTaskList = document.getElementById("completedTaskList");
const subjectFilter = document.getElementById("subjectFilter");

const timerDisplay = document.getElementById("timer");

const dailyGoalInput = document.getElementById("dailyGoal");
const saveGoalButton = document.getElementById("saveGoalButton");

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let timerTaskId = null;
let timerEndTime = null;
let selectedDuration = 25 * 60;
let lastTimerTick = null;
let focusModeEnabled = false;

/* ==========================================
   STORAGE HELPERS
========================================== */

function saveTasks() {
    saveStorage(STORAGE_KEYS.tasks, tasks);
}

function saveFocusData() {
    saveStorage(STORAGE_KEYS.dailyFocus, dailyFocusHistory);
    saveStorage(STORAGE_KEYS.focusHistory, focusHistory);
    saveStorage(STORAGE_KEYS.subjectFocus, subjectFocusHistory);
}

function saveStreakData() {
    saveStorage(STORAGE_KEYS.streak, streakData);
}

function getTaskById(id) {
    return tasks.find(function (task) {
        return String(task.id) === String(id);
    });
}

/* ==========================================
   DAILY FOCUS TRACKING
========================================== */

function getTodayFocusSeconds() {
    return Number(dailyFocusHistory[todayKey()]) || 0;
}

function getTotalFocusSeconds() {
    return Object.values(focusHistory).reduce(function (total, seconds) {
        return total + (Number(seconds) || 0);
    }, 0);
}

function recordFocusTime(seconds, taskId) {
    seconds = Math.max(0, Math.floor(seconds));

    if (seconds <= 0) {
        return;
    }

    const date = todayKey();

    dailyFocusHistory[date] =
        (Number(dailyFocusHistory[date]) || 0) + seconds;

    focusHistory[date] =
        (Number(focusHistory[date]) || 0) + seconds;

    const task = taskId !== null ? getTaskById(taskId) : null;
    const subject = task && SUBJECTS.includes(task.subject)
        ? task.subject
        : "Other";

    if (!subjectFocusHistory[date]) {
        subjectFocusHistory[date] = {};
    }

    subjectFocusHistory[date][subject] =
        (Number(subjectFocusHistory[date][subject]) || 0) + seconds;

    saveFocusData();
    updateDashboard();
    updateSubjectSummary();
    updateWeeklyAnalytics();
    updateAchievements();
}

function updateStreak() {
    const date = todayKey();

    if (streakData.lastStudyDate === date) {
        return;
    }

    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);

    const yesterday = todayKey(previousDate);

    if (streakData.lastStudyDate === yesterday) {
        streakData.current = (Number(streakData.current) || 0) + 1;
    } else {
        streakData.current = 1;
    }

    streakData.best = Math.max(
        Number(streakData.best) || 0,
        streakData.current
    );

    streakData.lastStudyDate = date;

    saveStreakData();
}

function getTotalCompletedTasks() {
    return tasks.filter(function (task) {
        return task.completed;
    }).length;
}

/* ==========================================
   DAILY DASHBOARD
========================================== */

function updateDashboard() {
    const focusSeconds = getTodayFocusSeconds();
    const pendingTasks = tasks.filter(function (task) {
        return !task.completed;
    }).length;

    const completedTasks = getTotalCompletedTasks();

    const goalDisplay = document.getElementById("goalDisplay");
    const focusTimeDisplay = document.getElementById("focusTimeDisplay");
    const dashboardCompleted = document.getElementById("dashboardCompleted");
    const dashboardPending = document.getElementById("dashboardPending");
    const goalProgressText = document.getElementById("goalProgressText");
    const goalProgressFill = document.getElementById("goalProgressFill");
    const goalProgressBar = document.getElementById("goalProgressBar");
    const goalMessage = document.getElementById("goalMessage");

    const goalSeconds = dailyGoal * 60;
    const percentage = goalSeconds > 0
        ? Math.min(100, Math.round((focusSeconds / goalSeconds) * 100))
        : 0;

    if (goalDisplay) {
        goalDisplay.textContent = `${dailyGoal} min`;
    }

    if (dailyGoalInput) {
        dailyGoalInput.value = dailyGoal;
    }

    if (focusTimeDisplay) {
        focusTimeDisplay.textContent = formatMinutes(focusSeconds);
    }

    if (dashboardCompleted) {
        dashboardCompleted.textContent =
            `${completedTasks} / ${tasks.length}`;
    }

    if (dashboardPending) {
        dashboardPending.textContent = pendingTasks;
    }

    if (goalProgressText) {
        goalProgressText.textContent = `${percentage}%`;
    }

    if (goalProgressFill) {
        goalProgressFill.style.width = `${percentage}%`;
    }

    if (goalProgressBar) {
        goalProgressBar.setAttribute("aria-valuenow", percentage);
    }

    if (goalMessage) {
        if (percentage >= 100) {
            goalMessage.textContent = "Amazing! You reached your daily study goal!";
        } else if (focusSeconds > 0) {
            const remaining = Math.ceil((goalSeconds - focusSeconds) / 60);
            goalMessage.textContent =
                `Great progress! ${remaining} more minutes to reach your goal.`;
        } else {
            goalMessage.textContent =
                "Start a focus session to make progress toward your goal.";
        }
    }
}

if (saveGoalButton) {
    saveGoalButton.addEventListener("click", function () {
        const value = Number(dailyGoalInput.value);

        if (!Number.isFinite(value) || value < 1 || value > 1440) {
            alert("Please enter a goal between 1 and 1440 minutes.");
            return;
        }

        dailyGoal = Math.floor(value);
        saveStorage(STORAGE_KEYS.goal, dailyGoal);
        updateDashboard();
    });
}

/* ==========================================
   TASK MANAGEMENT
========================================== */

function renderTasks() {
    if (!taskList || !completedTaskList) {
        return;
    }

    taskList.innerHTML = "";
    completedTaskList.innerHTML = "";

    const filter = subjectFilter ? subjectFilter.value : "All";

    const activeTasks = tasks.filter(function (task) {
        return !task.completed &&
            (filter === "All" || task.subject === filter);
    });

    const completedTasks = tasks.filter(function (task) {
        return task.completed;
    });

    activeTasks.forEach(function (task) {
        taskList.appendChild(createTaskElement(task, false));
    });

    completedTasks.forEach(function (task) {
        completedTaskList.appendChild(createTaskElement(task, true));
    });

    const taskCount = document.getElementById("taskCount");
    const completedCount = document.getElementById("completedCount");
    const emptyMessage = document.getElementById("emptyMessage");
    const completedEmptyMessage =
        document.getElementById("completedEmptyMessage");

    if (taskCount) {
        taskCount.textContent = `${activeTasks.length} active tasks`;
    }

    if (completedCount) {
        completedCount.textContent = `${completedTasks.length} completed`;
    }

    if (emptyMessage) {
        emptyMessage.style.display =
            activeTasks.length === 0 ? "block" : "none";

        if (activeTasks.length === 0) {
            emptyMessage.textContent = filter === "All"
                ? "No active tasks. Add your first study task!"
                : `No active tasks for ${filter}.`;
        }
    }

    if (completedEmptyMessage) {
        completedEmptyMessage.style.display =
            completedTasks.length === 0 ? "block" : "none";
    }

    updateDashboard();
    updateSubjectSummary();
    updateAchievements();
}

function createTaskElement(task, completed) {
    const item = document.createElement("li");
    item.className = "task-item";

    const taskInfo = document.createElement("div");
    taskInfo.className = "task-info";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title || "Untitled task";

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const subjectBadge = document.createElement("span");
    subjectBadge.className = "subject-badge";
    subjectBadge.textContent = task.subject || "Other";

    const priorityBadge = document.createElement("span");
    const priority = ["High", "Medium", "Low"].includes(task.priority)
        ? task.priority
        : "Medium";

    priorityBadge.className =
        `priority-badge ${priority.toLowerCase()}`;
    priorityBadge.textContent = `${priority} Priority`;

    meta.appendChild(subjectBadge);
    meta.appendChild(priorityBadge);

    if (task.dueDate) {
        const deadlineBadge = document.createElement("span");
        deadlineBadge.className = "deadline-badge";
        deadlineBadge.textContent = `Due: ${task.dueDate}`;
        meta.appendChild(deadlineBadge);
    }

    taskInfo.appendChild(title);
    taskInfo.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    if (!completed) {
        const completeButton = document.createElement("button");
        completeButton.type = "button";
        completeButton.className = "complete-button";
        completeButton.textContent = "Complete";

        completeButton.addEventListener("click", function () {
            completeTask(task.id);
        });

        actions.appendChild(completeButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
        deleteTask(task.id);
    });

    actions.appendChild(deleteButton);

    item.appendChild(taskInfo);
    item.appendChild(actions);

    return item;
}

if (taskForm) {
    taskForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = taskInput.value.trim();
        const subject = SUBJECTS.includes(taskSubject.value)
            ? taskSubject.value
            : "Other";

        const priority = ["High", "Medium", "Low"].includes(taskPriority.value)
            ? taskPriority.value
            : "Medium";

        if (!title) {
            alert("Please enter a task name.");
            return;
        }

        const task = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            title: title,
            subject: subject,
            priority: priority,
            dueDate: taskDueDate.value || "",
            completed: false,
            createdAt: todayKey(),
            completedAt: null
        };

        tasks.push(task);
        saveTasks();

        taskForm.reset();

        if (taskSubject) {
            taskSubject.value = "DSA";
        }

        if (taskPriority) {
            taskPriority.value = "Medium";
        }

        if (subjectFilter) {
            subjectFilter.value = "All";
        }

        renderTasks();
    });
}

if (subjectFilter) {
    subjectFilter.addEventListener("change", renderTasks);
}

function completeTask(id) {
    const task = getTaskById(id);

    if (!task || task.completed) {
        return;
    }

    task.completed = true;
    task.completedAt = todayKey();

    completedHistory[task.completedAt] =
        (Number(completedHistory[task.completedAt]) || 0) + 1;

    saveTasks();
    saveStorage(STORAGE_KEYS.completedHistory, completedHistory);

    updateStreak();
    renderTasks();
    updateWeeklyAnalytics();
    updateAchievements();
}

function deleteTask(id) {
    const task = getTaskById(id);

    if (!task) {
        return;
    }

    const confirmed = confirm(`Delete "${task.title}"?`);

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter(function (item) {
        return String(item.id) !== String(id);
    });

    saveTasks();

    if (String(timerTaskId) === String(id)) {
        timerTaskId = null;
    }

    renderTasks();
    updateWeeklyAnalytics();
}

/* ==========================================
   SUBJECT-WISE TRACKING
========================================== */

function updateSubjectSummary() {
    const container = document.getElementById("subjectSummaryCards");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const date = todayKey();
    const subjectData = subjectFocusHistory[date] || {};
    const totalSeconds = getTodayFocusSeconds();

    SUBJECTS.forEach(function (subject) {
        const seconds = Number(subjectData[subject]) || 0;

        const subjectTasks = tasks.filter(function (task) {
            return task.subject === subject;
        });

        const completed = subjectTasks.filter(function (task) {
            return task.completed;
        }).length;

        const total = subjectTasks.length;

        const share = totalSeconds > 0
            ? Math.round((seconds / totalSeconds) * 100)
            : 0;

        const card = document.createElement("article");
        card.className = "subject-card";

        const heading = document.createElement("h3");
        heading.textContent = subject;

        const timeText = document.createElement("p");
        timeText.textContent = `Study time today: ${formatMinutes(seconds)}`;

        const taskText = document.createElement("p");
        taskText.textContent = `Tasks: ${completed} completed / ${total} total`;

        const shareText = document.createElement("p");
        shareText.textContent = `Share of study time: ${share}%`;

        const progressTrack = document.createElement("div");
        progressTrack.className = "subject-progress-track";

        const progressFill = document.createElement("div");
        progressFill.className = "subject-progress-fill";
        progressFill.style.width = `${share}%`;

        progressTrack.appendChild(progressFill);

        card.appendChild(heading);
        card.appendChild(timeText);
        card.appendChild(taskText);
        card.appendChild(shareText);
        card.appendChild(progressTrack);

        container.appendChild(card);
    });
}

/* ==========================================
   FOCUS TIMER
========================================== */

function setDuration(minutes) {
    if (timerRunning) {
        pauseTimer();
    }

    selectedDuration = Math.max(1, Number(minutes)) * 60;
    timerSeconds = selectedDuration;

    updateTimerDisplay();
}

function updateTimerDisplay() {
    if (timerDisplay) {
        timerDisplay.textContent = formatDuration(timerSeconds);
    }

    document.title = timerRunning
        ? `${formatDuration(timerSeconds)} - Study Timer`
        : "Study Task Tracker";
}

function startTimer() {
    if (timerRunning) {
        return;
    }

    if (timerSeconds <= 0) {
        timerSeconds = selectedDuration;
    }

    timerRunning = true;
    timerTaskId = getSelectedTaskId();
    timerEndTime = Date.now() + timerSeconds * 1000;
    lastTimerTick = Date.now();

    timerInterval = setInterval(function () {
        const now = Date.now();

        timerSeconds = Math.max(
            0,
            Math.ceil((timerEndTime - now) / 1000)
        );

        const elapsedSeconds = Math.max(
            0,
            Math.floor((now - lastTimerTick) / 1000)
        );

        lastTimerTick = now;

        if (elapsedSeconds > 0) {
            recordFocusTime(elapsedSeconds, timerTaskId);
        }

        updateTimerDisplay();

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerRunning = false;
            timerEndTime = null;
            lastTimerTick = null;

            updateTimerDisplay();

            alert("Focus session completed! Great work!");
        }
    }, 1000);

    updateTimerDisplay();
}

function pauseTimer() {
    if (!timerRunning) {
        return;
    }

    clearInterval(timerInterval);

    timerInterval = null;
    timerRunning = false;
    timerEndTime = null;
    lastTimerTick = null;

    updateTimerDisplay();
}

function resetTimer() {
    if (timerRunning) {
        pauseTimer();
    }

    timerSeconds = selectedDuration;
    timerTaskId = null;

    updateTimerDisplay();
}

function getSelectedTaskId() {
    const activeTasks = tasks.filter(function (task) {
        return !task.completed;
    });

    return activeTasks.length > 0 ? activeTasks[0].id : null;
}

function openFocusMode() {
    focusModeEnabled = !focusModeEnabled;

    document.body.classList.toggle("focus-mode", focusModeEnabled);

    const button = document.querySelector(".focus-button");

    if (button) {
        button.textContent = focusModeEnabled
            ? "Exit Focus Mode"
            : "Enter Focus Mode";
    }
}

/* ==========================================
   WEEKLY ANALYTICS
========================================== */

let displayedWeekOffset = 0;

function getWeekDates(offset = 0) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset * 7);

    const day = date.getDay();
    const difference = day === 0 ? -6 : 1 - day;

    date.setDate(date.getDate() + difference);

    const dates = [];

    for (let i = 0; i < 7; i++) {
        const current = new Date(date);
        current.setDate(date.getDate() + i);
        dates.push(current);
    }

    return dates;
}

function updateWeeklyAnalytics() {
    const dates = getWeekDates(displayedWeekOffset);
    const chart = document.getElementById("weeklyChart");

    let totalSeconds = 0;
    let completedCount = 0;
    let bestDay = null;
    let bestSeconds = 0;

    dates.forEach(function (date) {
        const key = todayKey(date);
        const seconds = Number(focusHistory[key]) || 0;

        totalSeconds += seconds;

        if (seconds > bestSeconds) {
            bestSeconds = seconds;
            bestDay = date;
        }

        completedCount += Number(completedHistory[key]) || 0;
    });

    const averageSeconds = Math.round(totalSeconds / 7);

    const weeklyFocusTotal = document.getElementById("weeklyFocusTotal");
    const weeklyFocusAverage = document.getElementById("weeklyFocusAverage");
    const weeklyTasksCompleted = document.getElementById("weeklyTasksCompleted");
    const bestStudyDay = document.getElementById("bestStudyDay");
    const analyticsWeekLabel = document.getElementById("analyticsWeekLabel");
    const analyticsMessage = document.getElementById("analyticsMessage");

    if (weeklyFocusTotal) {
        weeklyFocusTotal.textContent = formatMinutes(totalSeconds);
    }

    if (weeklyFocusAverage) {
        weeklyFocusAverage.textContent = formatMinutes(averageSeconds);
    }

    if (weeklyTasksCompleted) {
        weeklyTasksCompleted.textContent = completedCount;
    }

    if (bestStudyDay) {
        bestStudyDay.textContent = bestDay
            ? bestDay.toLocaleDateString("en", { weekday: "short" })
            : "—";
    }

    if (analyticsWeekLabel) {
        if (displayedWeekOffset === 0) {
            analyticsWeekLabel.textContent = "This Week";
        } else if (displayedWeekOffset < 0) {
            analyticsWeekLabel.textContent =
                `${Math.abs(displayedWeekOffset)} week(s) ago`;
        } else {
            analyticsWeekLabel.textContent =
                `In ${displayedWeekOffset} week(s)`;
        }
    }

    if (chart) {
        chart.innerHTML = "";

        const maxSeconds = Math.max(
            60,
            ...dates.map(function (date) {
                return Number(focusHistory[todayKey(date)]) || 0;
            })
        );

        dates.forEach(function (date) {
            const key = todayKey(date);
            const seconds = Number(focusHistory[key]) || 0;

            const day = document.createElement("div");
            day.className = "chart-day";

            const minutes = document.createElement("span");
            minutes.className = "chart-minutes";
            minutes.textContent = formatMinutes(seconds);

            const barArea = document.createElement("div");
            barArea.className = "chart-bar-area";

            const bar = document.createElement("div");
            bar.className = "chart-bar";

            if (key === todayKey()) {
                bar.classList.add("today");
            }

            const height = seconds > 0
                ? Math.max(5, (seconds / maxSeconds) * 140)
                : 3;

            bar.style.height = `${height}px`;

            const label = document.createElement("span");
            label.className = "chart-day-label";
            label.textContent =
                date.toLocaleDateString("en", { weekday: "short" });

            barArea.appendChild(bar);
            day.appendChild(minutes);
            day.appendChild(barArea);
            day.appendChild(label);

            chart.appendChild(day);
        });
    }

    if (analyticsMessage) {
        analyticsMessage.textContent = totalSeconds > 0
            ? "Keep it up! Every study session contributes to your progress."
            : "No study history recorded for this week yet. Complete a focus session to get started.";
    }
}

const previousWeekButton = document.getElementById("previousWeekButton");
const nextWeekButton = document.getElementById("nextWeekButton");

if (previousWeekButton) {
    previousWeekButton.addEventListener("click", function () {
        displayedWeekOffset--;
        updateWeeklyAnalytics();
    });
}

if (nextWeekButton) {
    nextWeekButton.addEventListener("click", function () {
        if (displayedWeekOffset < 0) {
            displayedWeekOffset++;
            updateWeeklyAnalytics();
        }
    });
}

/* ==========================================
   ACHIEVEMENTS AND XP
========================================== */

function updateAchievements() {
    const completedTasks = getTotalCompletedTasks();
    const totalSeconds = getTotalFocusSeconds();
    const currentStreak = Number(streakData.current) || 0;
    const bestStreak = Number(streakData.best) || 0;

    const xp = completedTasks * 20 + Math.floor(totalSeconds / 60);
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;

    const currentStreakElement = document.getElementById("currentStreak");
    const bestStreakElement = document.getElementById("bestStreak");
    const totalXPElement = document.getElementById("totalXP");
    const studyLevelElement = document.getElementById("studyLevel");
    const levelMessage = document.getElementById("levelMessage");
    const xpProgressText = document.getElementById("xpProgressText");
    const xpProgressFill = document.getElementById("xpProgressFill");
    const xpProgressBar = document.getElementById("xpProgressBar");

    if (currentStreakElement) {
        currentStreakElement.textContent = currentStreak;
    }

    if (bestStreakElement) {
        bestStreakElement.textContent = bestStreak;
    }

    if (totalXPElement) {
        totalXPElement.textContent = `${xp} XP`;
    }

    if (studyLevelElement) {
        studyLevelElement.textContent = `Level ${level}`;
    }

    if (levelMessage) {
        levelMessage.textContent = level > 1
            ? "You're making great progress!"
            : "Your journey starts here!";
    }

    if (xpProgressText) {
        xpProgressText.textContent = `${xpInLevel} / 100 XP`;
    }

    if (xpProgressFill) {
        xpProgressFill.style.width = `${xpInLevel}%`;
    }

    if (xpProgressBar) {
        xpProgressBar.setAttribute("aria-valuenow", xpInLevel);
    }

    unlockBadge("badgeFirstTask", completedTasks >= 1);
    unlockBadge("badgeFiveTasks", completedTasks >= 5);
    unlockBadge("badgeTenTasks", completedTasks >= 10);
    unlockBadge("badgeThreeDayStreak", bestStreak >= 3);
    unlockBadge("badgeSevenDayStreak", bestStreak >= 7);
    unlockBadge("badgeFirstHour", totalSeconds >= 3600);
}

function unlockBadge(id, unlocked) {
    const badge = document.getElementById(id);

    if (!badge) {
        return;
    }

    badge.classList.toggle("unlocked", unlocked);
    badge.classList.toggle("locked", !unlocked);

    const status = badge.querySelector(".badge-status");

    if (status) {
        status.textContent = unlocked ? "Unlocked ✓" : "Locked";
    }
}

/* ==========================================
   START APPLICATION
========================================== */

function initializeApp() {
    updateTimerDisplay();
    updateDashboard();
    renderTasks();
    updateSubjectSummary();
    updateWeeklyAnalytics();
    updateAchievements();
}

initializeApp();

