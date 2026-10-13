/* ==========================================
   STUDY TASK TRACKER
   Complete JavaScript
========================================== */
 
let SUBJECTS = readStorage("studyTrackerSubjects", [
    "DSA", "Java", "Mathematics", "Physics", "Chemistry", "Other"
]);
 
if (!Array.isArray(SUBJECTS)) SUBJECTS = ["Other"];
SUBJECTS = [...new Set(SUBJECTS.map(s => String(s).trim()).filter(Boolean))];
if (SUBJECTS.length === 0) SUBJECTS = ["Other"];
saveStorage("studyTrackerSubjects", SUBJECTS);
 
const STORAGE_KEYS = {
    tasks: "studyTrackerTasks",
    goal: "studyTrackerDailyGoal",
    dailyFocus: "studyTrackerDailyFocus",
    focusHistory: "studyTrackerFocusHistory",
    subjectFocus: "studyTrackerSubjectFocus",
    completedHistory: "studyTrackerCompletedHistory",
    achievements: "studyTrackerAchievements",
    streak: "studyTrackerStreak",
    timetable: "studyTrackerTimetable"
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
let timetableSessions = readStorage(STORAGE_KEYS.timetable, []);
if (!Array.isArray(timetableSessions)) timetableSessions = [];
let timetableSelectedDate = todayKey();
let dailyGoal = Number(readStorage(STORAGE_KEYS.goal, 120));
 
let dailyFocusHistory = readStorage(STORAGE_KEYS.dailyFocus, {});
let focusHistory = readStorage(STORAGE_KEYS.focusHistory, {});
let subjectFocusHistory = readStorage(STORAGE_KEYS.subjectFocus, {});
let studyPeriodHistory = readStorage("studyTrackerStudyPeriods", {});
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
        subject: SUBJECTS.includes(task.subject) ? task.subject : (task.subject || SUBJECTS[0]),
        completed: Boolean(task.completed),
        priority: task.priority || "Medium"
    };
}).filter(Boolean);
 
tasks.forEach(function (task) {
    if (task.subject && !SUBJECTS.includes(task.subject)) SUBJECTS.push(task.subject);
});
saveStorage("studyTrackerSubjects", SUBJECTS);
 
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
 
const timetableForm = document.getElementById("timetableForm");
const timetableSubject = document.getElementById("timetableSubject");
const timetableTopic = document.getElementById("timetableTopic");
const timetableStartTime = document.getElementById("timetableStartTime");
const timetableEndTime = document.getElementById("timetableEndTime");
const timetableDateHeading = document.getElementById("timetableDateHeading");
const timetableSessionsList = document.getElementById("timetableSessionsList");
const timetableFormMessage = document.getElementById("timetableFormMessage");
 
const taskList = document.getElementById("taskList");
const completedTaskList = document.getElementById("completedTaskList");
const subjectFilter = document.getElementById("subjectFilter");
const subjectForm = document.getElementById("subjectForm");
const newSubjectName = document.getElementById("newSubjectName");
const subjectManagerList = document.getElementById("subjectManagerList");
const timerHours = document.getElementById("timerHours");
const timerMinutes = document.getElementById("timerMinutes");
const setTimerDurationButton = document.getElementById("setTimerDuration");
 
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
 
    // Record which part of the day the user studies.
    const hour = new Date().getHours();
    let period;
    if (hour >= 5 && hour < 12) {
        period = "Morning";
    } else if (hour >= 12 && hour < 17) {
        period = "Afternoon";
    } else if (hour >= 17 && hour < 21) {
        period = "Evening";
    } else {
        period = "Night";
    }
    if (!studyPeriodHistory || typeof studyPeriodHistory !== "object") {
        studyPeriodHistory = {};
    }
    studyPeriodHistory[period] = (Number(studyPeriodHistory[period]) || 0) + seconds;
    saveStorage("studyTrackerStudyPeriods", studyPeriodHistory);
 
    saveFocusData();
    updateDashboard();
    updateSubjectSummary();
    updateWeeklyAnalytics();
    updateAchievements();
    updateProductivityInsights();
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
   CUSTOM SUBJECT MANAGEMENT
========================================== */
 
function populateSubjectDropdowns() {
    if (taskSubject) {
        const previous = taskSubject.value;
        taskSubject.innerHTML = "";
        SUBJECTS.forEach(function (subject) {
            const option = document.createElement("option");
            option.value = subject;
            option.textContent = subject;
            taskSubject.appendChild(option);
        });
        taskSubject.value = SUBJECTS.includes(previous) ? previous : SUBJECTS[0];
    }
 
    if (subjectFilter) {
        const previous = subjectFilter.value;
        subjectFilter.innerHTML = "";
        const allOption = document.createElement("option");
        allOption.value = "All";
        allOption.textContent = "All Subjects";
        subjectFilter.appendChild(allOption);
 
        SUBJECTS.forEach(function (subject) {
            const option = document.createElement("option");
            option.value = subject;
            option.textContent = subject;
            subjectFilter.appendChild(option);
        });
 
        subjectFilter.value = previous === "All" || SUBJECTS.includes(previous)
            ? previous : "All";
    }
 
    // Keep the timetable subject list in sync with custom subject changes.
    populateTimetableSubjects();
}
 
function renderSubjectManager() {
    if (!subjectManagerList) return;
    subjectManagerList.innerHTML = "";
 
    SUBJECTS.forEach(function (subject) {
        const row = document.createElement("div");
        row.className = "subject-manager-item";
 
        const name = document.createElement("span");
        name.textContent = subject;
 
        const renameButton = document.createElement("button");
        renameButton.type = "button";
        renameButton.textContent = "Rename";
        renameButton.addEventListener("click", function () {
            const newName = prompt("Enter the new subject name:", subject);
            if (newName === null) return;
            const cleanName = newName.trim();
            if (!cleanName) {
                alert("Subject name cannot be empty.");
                return;
            }
            if (SUBJECTS.some(s => s.toLowerCase() === cleanName.toLowerCase() && s !== subject)) {
                alert("That subject already exists.");
                return;
            }
 
            SUBJECTS = SUBJECTS.map(s => s === subject ? cleanName : s);
            tasks.forEach(task => { if (task.subject === subject) task.subject = cleanName; });
 
            Object.values(subjectFocusHistory).forEach(day => {
                if (day && Object.prototype.hasOwnProperty.call(day, subject)) {
                    day[cleanName] = (Number(day[cleanName]) || 0) + (Number(day[subject]) || 0);
                    delete day[subject];
                }
            });
 
            saveStorage("studyTrackerSubjects", SUBJECTS);
            saveTasks();
            saveFocusData();
            populateSubjectDropdowns();
            renderSubjectManager();
            renderTasks();
        });
 
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
            if (SUBJECTS.length <= 1) {
                alert("Keep at least one subject.");
                return;
            }
            if (!confirm(`Delete "${subject}"? Tasks assigned to it will move to the first remaining subject.`)) return;
 
            const replacement = SUBJECTS.find(s => s !== subject);
            SUBJECTS = SUBJECTS.filter(s => s !== subject);
            tasks.forEach(task => { if (task.subject === subject) task.subject = replacement; });
 
            Object.values(subjectFocusHistory).forEach(day => {
                if (day && Object.prototype.hasOwnProperty.call(day, subject)) {
                    day[replacement] = (Number(day[replacement]) || 0) + (Number(day[subject]) || 0);
                    delete day[subject];
                }
            });
 
            saveStorage("studyTrackerSubjects", SUBJECTS);
            saveTasks();
            saveFocusData();
            populateSubjectDropdowns();
            renderSubjectManager();
            renderTasks();
        });
 
        row.append(name, renameButton, deleteButton);
        subjectManagerList.appendChild(row);
    });
}
 
if (subjectForm) {
    subjectForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const name = newSubjectName.value.trim();
        if (!name) return;
        if (SUBJECTS.some(s => s.toLowerCase() === name.toLowerCase())) {
            alert("That subject already exists.");
            return;
        }
        SUBJECTS.push(name);
        saveStorage("studyTrackerSubjects", SUBJECTS);
        newSubjectName.value = "";
        populateSubjectDropdowns();
        renderSubjectManager();
        updateSubjectSummary();
        renderTasks();
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
            taskSubject.value = SUBJECTS[0];
        }
 
        if (taskPriority) {
            taskPriority.value = "Medium";
        }
 
        if (subjectFilter) {
            subjectFilter.value = "All";
        }
 
        renderTasks();
        renderStudyCalendar();
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
    renderStudyCalendar();
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
    renderStudyCalendar();
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
 
function populateTimerPickers() {
    if (timerHours) {
        timerHours.innerHTML = "";
        for (let hour = 0; hour <= 23; hour++) {
            const option = document.createElement("option");
            option.value = String(hour);
            option.textContent = `${hour} hour${hour === 1 ? "" : "s"}`;
            timerHours.appendChild(option);
        }
    }
    if (timerMinutes) {
        timerMinutes.innerHTML = "";
        for (let minute = 0; minute <= 59; minute++) {
            const option = document.createElement("option");
            option.value = String(minute);
            option.textContent = `${minute} minute${minute === 1 ? "" : "s"}`;
            timerMinutes.appendChild(option);
        }
    }
    if (timerMinutes) timerMinutes.value = "25";
}
 
function applyTimerDuration() {
    const hours = Number(timerHours ? timerHours.value : 0);
    const minutes = Number(timerMinutes ? timerMinutes.value : 25);
    const totalSeconds = (hours * 60 + minutes) * 60;
 
    if (totalSeconds <= 0) {
        alert("Please select a duration greater than zero.");
        return;
    }
 
    if (timerRunning) pauseTimer();
    selectedDuration = totalSeconds;
    timerSeconds = selectedDuration;
    updateTimerDisplay();
}
 
function setDuration(minutes) {
    if (timerHours) timerHours.value = "0";
    if (timerMinutes) timerMinutes.value = String(minutes);
    applyTimerDuration();
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
   PRODUCTIVITY INSIGHTS
========================================== */
 
function updateProductivityInsights() {
    // Most productive subject, based on total recorded focus time.
    const subjectTotals = {};
    SUBJECTS.forEach(function (subject) { subjectTotals[subject] = 0; });
    Object.values(subjectFocusHistory).forEach(function (dayData) {
        if (!dayData || typeof dayData !== "object") return;
        SUBJECTS.forEach(function (subject) {
            subjectTotals[subject] += Number(dayData[subject]) || 0;
        });
    });
    let bestSubject = "";
    let bestSubjectSeconds = 0;
    Object.entries(subjectTotals).forEach(function ([subject, seconds]) {
        if (seconds > bestSubjectSeconds) { bestSubject = subject; bestSubjectSeconds = seconds; }
    });
    const subjectElement = document.getElementById("mostProductiveSubject");
    const subjectTimeElement = document.getElementById("mostProductiveSubjectTime");
    if (subjectElement) subjectElement.textContent = bestSubject || "Not enough data yet";
    if (subjectTimeElement) subjectTimeElement.textContent = bestSubject
        ? `${formatMinutes(bestSubjectSeconds)} studied in total`
        : "Complete a focus session linked to a subject.";
 
    // Preferred study period from newly recorded focus sessions.
    const periodElement = document.getElementById("preferredStudyPeriod");
    const periodTimeElement = document.getElementById("preferredStudyPeriodTime");
    const periods = ["Morning", "Afternoon", "Evening", "Night"];
    let bestPeriod = "";
    let bestPeriodSeconds = 0;
    periods.forEach(function (period) {
        const seconds = Number(studyPeriodHistory[period]) || 0;
        if (seconds > bestPeriodSeconds) { bestPeriod = period; bestPeriodSeconds = seconds; }
    });
    if (periodElement) periodElement.textContent = bestPeriod || "Collecting data...";
    if (periodTimeElement) periodTimeElement.textContent = bestPeriod
        ? `${formatMinutes(bestPeriodSeconds)} recorded during this period`
        : "Use the focus timer to discover your study pattern.";
 
    // Weekday with the most recorded study time.
    const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
    Object.entries(focusHistory).forEach(function ([dateKey, seconds]) {
        const parts = dateKey.split("-").map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return;
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return;
        weekdayTotals[date.getDay()] += Number(seconds) || 0;
    });
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let bestWeekdayIndex = -1;
    let bestWeekdaySeconds = 0;
    weekdayTotals.forEach(function (seconds, index) {
        if (seconds > bestWeekdaySeconds) { bestWeekdaySeconds = seconds; bestWeekdayIndex = index; }
    });
    const bestDayElement = document.getElementById("insightBestStudyDay");
    const bestDayTimeElement = document.getElementById("insightBestStudyDayTime");
    if (bestDayElement) bestDayElement.textContent = bestWeekdayIndex >= 0 ? weekdayNames[bestWeekdayIndex] : "Not enough data yet";
    if (bestDayTimeElement) bestDayTimeElement.textContent = bestWeekdayIndex >= 0
        ? `${formatMinutes(bestWeekdaySeconds)} recorded on this weekday`
        : "Complete focus sessions on different days.";
 
    // Compare this week with the previous week.
    function getTotalForWeek(offset) {
        return getWeekDates(offset).reduce(function (total, date) {
            return total + (Number(focusHistory[todayKey(date)]) || 0);
        }, 0);
    }
    const thisWeekSeconds = getTotalForWeek(0);
    const lastWeekSeconds = getTotalForWeek(-1);
    const progressElement = document.getElementById("weeklyProgressChange");
    const progressMessageElement = document.getElementById("weeklyProgressMessage");
    let progressText;
    let message;
    if (lastWeekSeconds === 0 && thisWeekSeconds === 0) {
        progressText = "No study data yet";
        message = "Complete focus sessions to compare your weeks.";
    } else if (lastWeekSeconds === 0) {
        progressText = "Study started!";
        message = "Last week had no recorded focus time.";
    } else {
        const difference = thisWeekSeconds - lastWeekSeconds;
        const percentage = Math.round((difference / lastWeekSeconds) * 100);
        if (difference > 0) {
            progressText = `↑ ${percentage}%`;
            message = `${formatMinutes(difference)} more than last week.`;
        } else if (difference < 0) {
            progressText = `↓ ${Math.abs(percentage)}%`;
            message = `${formatMinutes(Math.abs(difference))} less than last week.`;
        } else {
            progressText = "No change";
            message = "Your study time matches last week.";
        }
    }
    if (progressElement) progressElement.textContent = progressText;
    if (progressMessageElement) progressMessageElement.textContent = message;
}
 
/* ==========================================
   STUDENT NAME PROFILE
========================================== */
 
const STUDENT_NAME_KEY = "studyTrackerStudentName";
let studentName = readStorage(STUDENT_NAME_KEY, "");
 
const studentNameModal = document.getElementById("studentNameModal");
const studentNameForm = document.getElementById("studentNameForm");
const studentNameInput = document.getElementById("studentNameInput");
const studentNameError = document.getElementById("studentNameError");
const welcomeGreeting = document.getElementById("welcomeGreeting");
const editStudentNameButton = document.getElementById("editStudentNameButton");
const cancelStudentNameButton = document.getElementById("cancelStudentNameButton");
 
function updateStudentGreeting() {
    if (welcomeGreeting) {
        welcomeGreeting.textContent = studentName
            ? `Welcome, ${studentName}! Ready to make progress today?`
            : "Plan your work. Focus on your goals.";
    }
 
    if (editStudentNameButton) {
        editStudentNameButton.textContent = studentName
            ? "Edit Name"
            : "Set Your Name";
    }
}
 
function openStudentNameModal() {
    if (!studentNameModal) return;
 
    studentNameModal.hidden = false;
    if (studentNameInput) {
        studentNameInput.value = studentName || "";
        studentNameInput.focus();
    }
    if (studentNameError) studentNameError.textContent = "";
    if (cancelStudentNameButton) {
        cancelStudentNameButton.hidden = !studentName;
    }
}
 
function closeStudentNameModal() {
    if (studentNameModal) studentNameModal.hidden = true;
}
 
function saveStudentName(event) {
    event.preventDefault();
 
    const enteredName = studentNameInput
        ? studentNameInput.value.trim().replace(/\s+/g, " ")
        : "";
 
    if (!enteredName) {
        if (studentNameError) {
            studentNameError.textContent = "Please enter your name.";
        }
        if (studentNameInput) studentNameInput.focus();
        return;
    }
 
    studentName = enteredName;
    saveStorage(STUDENT_NAME_KEY, studentName);
    updateStudentGreeting();
    closeStudentNameModal();
}
 
if (studentNameForm) {
    studentNameForm.addEventListener("submit", saveStudentName);
}
 
if (editStudentNameButton) {
    editStudentNameButton.addEventListener("click", openStudentNameModal);
}
 
if (cancelStudentNameButton) {
    cancelStudentNameButton.addEventListener("click", closeStudentNameModal);
}
 
/* ==========================================
   STUDY CALENDAR
========================================== */
 
let calendarDisplayedDate = new Date();
calendarDisplayedDate = new Date(
    calendarDisplayedDate.getFullYear(),
    calendarDisplayedDate.getMonth(),
    1
);
let calendarSelectedDate = todayKey();
 
const calendarPrevMonthButton = document.getElementById("calendarPrevMonth");
const calendarNextMonthButton = document.getElementById("calendarNextMonth");
const studyCalendarGrid = document.getElementById("studyCalendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
/* ==========================================
   DAILY STUDY TIMETABLE
========================================== */
 
function saveTimetableSessions() {
    saveStorage(STORAGE_KEYS.timetable, timetableSessions);
}
 
function formatTimetableDate(dateKey) {
    const parts = String(dateKey).split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return dateKey;
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
}
 
function timeToMinutes(time) {
    const parts = String(time || "").split(":").map(Number);
    if (parts.length !== 2 || parts.some(Number.isNaN)) return NaN;
    return parts[0] * 60 + parts[1];
}
 
function formatStudyMinutes(minutes) {
    const safeMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(safeMinutes / 60);
    const remaining = safeMinutes % 60;
    if (hours && remaining) return `${hours} hr ${remaining} min`;
    if (hours) return `${hours} hr`;
    return `${remaining} min`;
}
 
function getTimetableSessionsForDate(dateKey) {
    return timetableSessions
        .filter(session => session.date === dateKey)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}
 
function populateTimetableSubjects() {
    if (!timetableSubject) return;
    const currentValue = timetableSubject.value;
    timetableSubject.innerHTML = "";
    SUBJECTS.forEach(function (subject) {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        timetableSubject.appendChild(option);
    });
    if (SUBJECTS.includes(currentValue)) timetableSubject.value = currentValue;
}
 
function renderTimetable() {
    if (!timetableSessionsList || !timetableDateHeading) return;
 
    timetableDateHeading.textContent = formatTimetableDate(timetableSelectedDate);
    const sessions = getTimetableSessionsForDate(timetableSelectedDate);
    const plannedMinutes = sessions.reduce((total, session) => {
        return total + Math.max(0, timeToMinutes(session.endTime) - timeToMinutes(session.startTime));
    }, 0);
    const completedCount = sessions.filter(session => session.completed).length;
 
    document.getElementById("timetableSessionCount").textContent = sessions.length;
    document.getElementById("timetablePlannedTime").textContent = formatStudyMinutes(plannedMinutes);
    document.getElementById("timetableCompletedCount").textContent = `${completedCount} / ${sessions.length}`;
    document.getElementById("timetableSessionsTitle").textContent = `Sessions for ${formatTimetableDate(timetableSelectedDate)}`;
 
    timetableSessionsList.innerHTML = "";
    if (!sessions.length) {
        const empty = document.createElement("p");
        empty.className = "timetable-empty-state";
        empty.textContent = "No study sessions planned for this day yet. Add one using the form above.";
        timetableSessionsList.appendChild(empty);
        return;
    }
 
    sessions.forEach(function (session) {
        const card = document.createElement("article");
        card.className = "timetable-session-card";
        if (session.completed) card.classList.add("timetable-session-completed");
 
        const time = document.createElement("div");
        time.className = "timetable-session-time";
        time.textContent = `${session.startTime} – ${session.endTime}`;
 
        const info = document.createElement("div");
        info.className = "timetable-session-info";
        const title = document.createElement("h4");
        title.textContent = session.subject || "Study session";
        const topic = document.createElement("p");
        topic.textContent = session.topic || "General study";
        info.append(title, topic);
 
        const actions = document.createElement("div");
        actions.className = "timetable-session-actions";
        const doneLabel = document.createElement("label");
        doneLabel.className = "timetable-done-label";
        const doneCheckbox = document.createElement("input");
        doneCheckbox.type = "checkbox";
        doneCheckbox.checked = Boolean(session.completed);
        doneCheckbox.setAttribute("aria-label", `Mark ${session.subject} session as completed`);
        doneCheckbox.addEventListener("change", function () {
            session.completed = doneCheckbox.checked;
            session.completedAt = session.completed ? todayKey() : null;
            saveTimetableSessions();
            renderTimetable();
        });
        doneLabel.append(doneCheckbox, document.createTextNode("Done"));
 
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "timetable-delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
            timetableSessions = timetableSessions.filter(item => item.id !== session.id);
            saveTimetableSessions();
            renderTimetable();
        });
        actions.append(doneLabel, deleteButton);
        card.append(time, info, actions);
        timetableSessionsList.appendChild(card);
    });
}
 
function moveTimetableDate(days) {
    const parts = timetableSelectedDate.split("-").map(Number);
    const selected = new Date(parts[0], parts[1] - 1, parts[2]);
    selected.setDate(selected.getDate() + days);
    timetableSelectedDate = todayKey(selected);
    renderTimetable();
}
 
if (timetableForm) {
    timetableForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const subject = timetableSubject.value;
        const topic = timetableTopic.value.trim();
        const startTime = timetableStartTime.value;
        const endTime = timetableEndTime.value;
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
 
        if (!subject || !startTime || !endTime || !Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
            timetableFormMessage.textContent = "Please choose a subject and both times.";
            return;
        }
        if (endMinutes <= startMinutes) {
            timetableFormMessage.textContent = "End time must be later than start time.";
            return;
        }
        const overlaps = getTimetableSessionsForDate(timetableSelectedDate).some(function (session) {
            return startMinutes < timeToMinutes(session.endTime) && endMinutes > timeToMinutes(session.startTime);
        });
        if (overlaps) {
            timetableFormMessage.textContent = "This session overlaps with another session. Choose a different time.";
            return;
        }
 
        timetableSessions.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            date: timetableSelectedDate,
            subject,
            topic,
            startTime,
            endTime,
            completed: false,
            completedAt: null,
            createdAt: todayKey()
        });
        saveTimetableSessions();
        timetableTopic.value = "";
        timetableFormMessage.textContent = "Study session added to your timetable.";
        renderTimetable();
    });
}
 
const timetablePreviousDay = document.getElementById("timetablePreviousDay");
const timetableNextDay = document.getElementById("timetableNextDay");
const timetableTodayButton = document.getElementById("timetableTodayButton");
if (timetablePreviousDay) timetablePreviousDay.addEventListener("click", () => moveTimetableDate(-1));
if (timetableNextDay) timetableNextDay.addEventListener("click", () => moveTimetableDate(1));
if (timetableTodayButton) timetableTodayButton.addEventListener("click", function () {
    timetableSelectedDate = todayKey();
    renderTimetable();
});
 
const calendarSelectedDateTitle = document.getElementById("calendarSelectedDateTitle");
const calendarSelectedTasks = document.getElementById("calendarSelectedTasks");
const upcomingDeadlinesList = document.getElementById("upcomingDeadlinesList");
 
function calendarDateKey(date) {
    return todayKey(date);
}
 
function formatCalendarDate(dateKey, options = {}) {
    const parts = String(dateKey).split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return dateKey;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString(undefined, options);
}
 
function getTasksForCalendarDate(dateKey) {
    return tasks.filter(function (task) {
        return task.dueDate === dateKey ||
            (task.completed && task.completedAt === dateKey);
    });
}
 
function renderStudyCalendar() {
    if (!studyCalendarGrid || !calendarMonthLabel) return;
 
    const year = calendarDisplayedDate.getFullYear();
    const month = calendarDisplayedDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayKey();
 
    calendarMonthLabel.textContent = calendarDisplayedDate.toLocaleDateString(
        undefined, { month: "long", year: "numeric" }
    );
    studyCalendarGrid.innerHTML = "";
 
    for (let i = 0; i < firstWeekday; i++) {
        const blank = document.createElement("div");
        blank.className = "calendar-day calendar-day-empty";
        blank.setAttribute("aria-hidden", "true");
        studyCalendarGrid.appendChild(blank);
    }
 
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = calendarDateKey(date);
        const dayTasks = getTasksForCalendarDate(dateKey);
 
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "calendar-day";
        cell.setAttribute("aria-label", formatCalendarDate(dateKey, {
            weekday: "long", month: "long", day: "numeric", year: "numeric"
        }));
 
        if (dateKey === today) cell.classList.add("calendar-day-today");
        if (dateKey === calendarSelectedDate) cell.classList.add("calendar-day-selected");
 
        const number = document.createElement("span");
        number.className = "calendar-day-number";
        number.textContent = day;
        cell.appendChild(number);
 
        const pendingCount = dayTasks.filter(task => !task.completed && task.dueDate === dateKey).length;
        const completedCount = dayTasks.filter(task => task.completed && (
            task.completedAt === dateKey || task.dueDate === dateKey
        )).length;
        const overdueCount = dayTasks.filter(task =>
            !task.completed && task.dueDate === dateKey && dateKey < today
        ).length;
 
        if (pendingCount || completedCount || overdueCount) {
            const markers = document.createElement("span");
            markers.className = "calendar-day-markers";
 
            if (pendingCount) {
                const dot = document.createElement("i");
                dot.className = "calendar-dot calendar-dot-pending";
                dot.title = `${pendingCount} pending deadline(s)`;
                markers.appendChild(dot);
            }
            if (completedCount) {
                const dot = document.createElement("i");
                dot.className = "calendar-dot calendar-dot-completed";
                dot.title = `${completedCount} completed task(s)`;
                markers.appendChild(dot);
            }
            if (overdueCount) {
                const dot = document.createElement("i");
                dot.className = "calendar-dot calendar-dot-overdue";
                dot.title = `${overdueCount} overdue task(s)`;
                markers.appendChild(dot);
            }
            cell.appendChild(markers);
            const count = document.createElement("span");
            count.className = "calendar-day-count";
            count.textContent = `${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}`;
            cell.appendChild(count);
        }
 
        cell.addEventListener("click", function () {
            calendarSelectedDate = dateKey;
            renderStudyCalendar();
            renderCalendarSelectedTasks();
        });
 
        studyCalendarGrid.appendChild(cell);
    }
 
    renderCalendarSelectedTasks();
    renderUpcomingDeadlines();
}
 
function renderCalendarSelectedTasks() {
    if (!calendarSelectedTasks || !calendarSelectedDateTitle) return;
 
    calendarSelectedDateTitle.textContent =
        `Tasks for ${formatCalendarDate(calendarSelectedDate, {
            weekday: "long", month: "long", day: "numeric", year: "numeric"
        })}`;
 
    const selectedTasks = getTasksForCalendarDate(calendarSelectedDate);
    calendarSelectedTasks.innerHTML = "";
 
    if (!selectedTasks.length) {
        const empty = document.createElement("p");
        empty.textContent = "No tasks or completed items for this date.";
        calendarSelectedTasks.appendChild(empty);
        return;
    }
 
    selectedTasks.forEach(function (task) {
        const item = document.createElement("article");
        item.className = "calendar-task-item";
        item.classList.add(task.completed ? "calendar-task-completed" : "calendar-task-pending");
 
        const title = document.createElement("strong");
        title.textContent = task.title || "Untitled task";
 
        const meta = document.createElement("p");
        const dueText = task.dueDate ? `Deadline: ${task.dueDate}` : "No deadline";
        const completedText = task.completed
            ? ` · Completed ${task.completedAt ? formatCalendarDate(task.completedAt) : ""}`
            : " · Pending";
        meta.textContent = `${task.subject || "Other"} · ${dueText}${completedText}`;
 
        item.appendChild(title);
        item.appendChild(meta);
        calendarSelectedTasks.appendChild(item);
    });
}
 
function renderUpcomingDeadlines() {
    if (!upcomingDeadlinesList) return;
 
    const today = todayKey();
    const upcoming = tasks
        .filter(task => !task.completed && task.dueDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 8);
 
    upcomingDeadlinesList.innerHTML = "";
 
    if (!upcoming.length) {
        const empty = document.createElement("p");
        empty.textContent = "No pending deadlines. You're all caught up!";
        upcomingDeadlinesList.appendChild(empty);
        return;
    }
 
    upcoming.forEach(function (task) {
        const item = document.createElement("article");
        item.className = "upcoming-deadline-item";
 
        const due = document.createElement("span");
        due.className = "upcoming-deadline-date";
        due.textContent = formatCalendarDate(task.dueDate, {
            month: "short", day: "numeric", year: "numeric"
        });
 
        const details = document.createElement("div");
        details.className = "upcoming-deadline-details";
 
        const title = document.createElement("strong");
        title.textContent = task.title || "Untitled task";
 
        const subject = document.createElement("small");
        subject.textContent = `${task.subject || "Other"} · ${task.priority || "Medium"} priority`;
 
        details.appendChild(title);
        details.appendChild(subject);
        item.appendChild(due);
        item.appendChild(details);
 
        if (task.dueDate < today) {
            item.classList.add("upcoming-deadline-overdue");
            const overdue = document.createElement("span");
            overdue.className = "upcoming-deadline-status";
            overdue.textContent = "Overdue";
            item.appendChild(overdue);
        } else if (task.dueDate === today) {
            item.classList.add("upcoming-deadline-today");
            const status = document.createElement("span");
            status.className = "upcoming-deadline-status";
            status.textContent = "Today";
            item.appendChild(status);
        }
 
        upcomingDeadlinesList.appendChild(item);
    });
}
 
if (calendarPrevMonthButton) {
    calendarPrevMonthButton.addEventListener("click", function () {
        calendarDisplayedDate = new Date(
            calendarDisplayedDate.getFullYear(),
            calendarDisplayedDate.getMonth() - 1,
            1
        );
        renderStudyCalendar();
    });
}
 
if (calendarNextMonthButton) {
    calendarNextMonthButton.addEventListener("click", function () {
        calendarDisplayedDate = new Date(
            calendarDisplayedDate.getFullYear(),
            calendarDisplayedDate.getMonth() + 1,
            1
        );
        renderStudyCalendar();
    });
}
 
/* ==========================================
   START APPLICATION
========================================== */
 
function initializeApp() {
    updateStudentGreeting();
    populateSubjectDropdowns();
    populateTimetableSubjects();
    renderTimetable();
    renderSubjectManager();
    populateTimerPickers();
    if (setTimerDurationButton) {
        setTimerDurationButton.addEventListener("click", applyTimerDuration);
    }
    updateTimerDisplay();
    updateDashboard();
    renderTasks();
    updateSubjectSummary();
    updateWeeklyAnalytics();
    renderStudyCalendar();
    updateAchievements();
    updateProductivityInsights();
 
    if (!studentName) {
        openStudentNameModal();
    }
}
 
initializeApp();
 
/* ==========================================
   EXAM AND SYLLABUS TRACKER
========================================== */
const EXAM_STORAGE_KEY = "studyTrackerExamsAndSyllabus";
let examRecords = readStorage(EXAM_STORAGE_KEY, []);
if (!Array.isArray(examRecords)) examRecords = [];
 
const examForm = document.getElementById("examForm");
const examSubject = document.getElementById("examSubject");
const examName = document.getElementById("examName");
const examDate = document.getElementById("examDate");
const examTopic = document.getElementById("examTopic");
const examFormMessage = document.getElementById("examFormMessage");
const examTrackerList = document.getElementById("examTrackerList");
 
function populateExamSubjects() {
    if (!examSubject) return;
    const previous = examSubject.value;
    examSubject.innerHTML = "";
    SUBJECTS.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        examSubject.appendChild(option);
    });
    if (SUBJECTS.includes(previous)) examSubject.value = previous;
}
 
function daysUntilExam(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDay = new Date(dateString + "T00:00:00");
    return Math.round((examDay - today) / 86400000);
}
 
function renderExamTracker() {
    if (!examTrackerList) return;
    const total = examRecords.length;
    const completed = examRecords.filter(record => record.completed).length;
    const progress = total ? Math.round(completed / total * 100) : 0;
    document.getElementById("examTotalTopics").textContent = total;
    document.getElementById("examCompletedTopics").textContent = completed;
    document.getElementById("examProgressPercent").textContent = progress + "%";
    examTrackerList.innerHTML = "";
    if (!total) {
        examTrackerList.innerHTML = '<p class="exam-empty-state">No exams or chapters added yet. Add one above to get started.</p>';
        return;
    }
    const groups = {};
    examRecords.forEach(record => {
        const key = record.subject + "|" + record.examDate + "|" + (record.examName || "");
        if (!groups[key]) groups[key] = { subject: record.subject, examDate: record.examDate, examName: record.examName || "", topics: [] };
        groups[key].topics.push(record);
    });
    Object.values(groups).sort((a,b) => a.examDate.localeCompare(b.examDate) || a.subject.localeCompare(b.subject)).forEach(group => {
        const card = document.createElement("article");
        card.className = "exam-card";
        const days = daysUntilExam(group.examDate);
        let countdown = days < 0 ? `Exam date passed ${Math.abs(days)} day(s) ago` : days === 0 ? "Exam is today" : `${days} day(s) remaining`;
        card.innerHTML = `<div class="exam-card-heading"><div><h3>${escapeHTML(group.subject)}${group.examName ? " — " + escapeHTML(group.examName) : ""}</h3><p>${escapeHTML(new Date(group.examDate + "T00:00:00").toLocaleDateString(undefined, {year:"numeric",month:"short",day:"numeric"}))} · ${escapeHTML(countdown)}</p></div><span class="exam-countdown ${days >= 0 && days <= 7 ? "exam-soon" : ""}">${days < 0 ? "Past" : days === 0 ? "Today" : days + "d left"}</span></div><div class="exam-topic-list"></div>`;
        const topicsContainer = card.querySelector(".exam-topic-list");
        group.topics.forEach(topic => {
            const row = document.createElement("div");
            row.className = "exam-topic-row" + (topic.completed ? " exam-topic-completed" : "");
            const label = document.createElement("label");
            label.className = "exam-topic-label";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = !!topic.completed;
            checkbox.setAttribute("aria-label", "Mark " + topic.topic + " as completed");
            checkbox.addEventListener("change", () => {
                topic.completed = checkbox.checked;
                saveStorage(EXAM_STORAGE_KEY, examRecords);
                renderExamTracker();
            });
            const span = document.createElement("span");
            span.textContent = topic.topic;
            label.append(checkbox, span);
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "exam-delete-button";
            remove.textContent = "Delete";
            remove.addEventListener("click", () => {
                examRecords = examRecords.filter(item => item.id !== topic.id);
                saveStorage(EXAM_STORAGE_KEY, examRecords);
                renderExamTracker();
            });
            row.append(label, remove);
            topicsContainer.appendChild(row);
        });
        examTrackerList.appendChild(card);
    });
}
 
if (examDate) examDate.value = todayKey();
if (examForm) {
    examForm.addEventListener("submit", event => {
        event.preventDefault();
        const subject = examSubject.value;
        const date = examDate.value;
        const topic = examTopic.value.trim();
        if (!subject || !date || !topic) {
            examFormMessage.textContent = "Please choose a subject, exam date, and chapter name.";
            return;
        }
        const record = {
            id: "exam-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
            subject,
            examName: examName.value.trim(),
            examDate: date,
            topic,
            completed: false
        };
        examRecords.push(record);
        saveStorage(EXAM_STORAGE_KEY, examRecords);
        examTopic.value = "";
        examFormMessage.textContent = "Chapter added! Add another chapter for this exam if needed.";
        renderExamTracker();
    });
}
populateExamSubjects();
renderExamTracker();


/* ==========================================
   DARK MODE AND THEMES
========================================== */

const themeSelector = document.getElementById("themeSelector");
const THEME_STORAGE_KEY = "studyTrackerTheme";

function applyStudyTheme(theme) {
    const availableThemes = ["light", "dark", "lavender"];

    if (!availableThemes.includes(theme)) {
        theme = "light";
    }

    document.body.dataset.theme = theme;

    if (themeSelector) {
        themeSelector.value = theme;
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const themeColors = {
        light: "#f8f7ff",
        dark: "#17152b",
        lavender: "#f1eaff"
    };

    const themeColor = themeColors[theme];

    let themeMeta = document.querySelector('meta[name="theme-color"]');

    if (themeMeta) {
        themeMeta.setAttribute("content", themeColor);
    }
}

if (themeSelector) {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";

    applyStudyTheme(savedTheme);

    themeSelector.addEventListener("change", function () {
        applyStudyTheme(themeSelector.value);
    });
}

/* =====================================
   SETTINGS PANEL CONTROLS
===================================== */

const openSettingsButton = document.getElementById("openSettingsButton");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const mainContainer = document.querySelector(".container");

if (openSettingsButton && closeSettingsButton && settingsPanel && mainContainer) {

    openSettingsButton.addEventListener("click", function () {
        mainContainer.hidden = true;
        settingsPanel.hidden = false;
        window.scrollTo(0, 0);
    });

    closeSettingsButton.addEventListener("click", function () {
        settingsPanel.hidden = true;
        mainContainer.hidden = false;
        window.scrollTo(0, 0);
    });

}

 
 

 


