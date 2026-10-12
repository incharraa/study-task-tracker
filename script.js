
let tasks = [];

try {
    let savedTasks = localStorage.getItem("studyTasks");

    if (savedTasks) {
        let parsedTasks = JSON.parse(savedTasks);

        if (Array.isArray(parsedTasks)) {
            tasks = parsedTasks.filter(function(task) {
                return task &&
                    Number.isInteger(task.id) &&
                    typeof task.name === "string" &&
                    ["High", "Medium", "Low"].includes(task.priority) &&
                    typeof task.completed === "boolean";
            });
        }
    }
} catch (error) {
    tasks = [];
}

let nextTaskId = tasks.length > 0
    ? Math.max(...tasks.map(function(task) {
        return task.id;
    })) + 1
    : 1;

let selectedMinutes = 25;
let time = selectedMinutes * 60;
let timer = null;
let focusScreen = null;
let currentTaskId = null;
let endTime = null;
let warningTimeout = null;


// Save tasks in the browser

function saveTasks() {
    try {
        localStorage.setItem("studyTasks", JSON.stringify(tasks));
    } catch (error) {
        alert("Unable to save tasks in this browser.");
    }
}


// Add a new task

document.getElementById("taskForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let input = document.getElementById("taskInput");
    let priority = document.getElementById("taskPriority");
    let taskName = input.value.trim();

    if (taskName === "") {
        alert("Please enter a study task.");
        return;
    }

    tasks.push({
        id: nextTaskId++,
        name: taskName,
        priority: priority.value,
        completed: false
    });

    input.value = "";
    saveTasks();
    renderTasks();
});


// Display tasks

function renderTasks() {
    let list = document.getElementById("taskList");
    let emptyMessage = document.getElementById("emptyMessage");

    list.innerHTML = "";

    tasks.forEach(function(task) {
        let item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("is-completed");
        }

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Mark " + task.name + " completed");

        checkbox.addEventListener("change", function() {
            task.completed = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        let details = document.createElement("div");
        details.className = "task-details";

        let name = document.createElement("div");
        name.className = "task-name";
        name.textContent = task.name;

        let priority = document.createElement("span");
        priority.className = "priority priority-" + task.priority;
        priority.textContent = task.priority + " Priority";

        details.appendChild(name);
        details.appendChild(priority);

        let deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteTask(task.id);
        });

        item.appendChild(checkbox);
        item.appendChild(details);
        item.appendChild(deleteButton);

        list.appendChild(item);
    });

    emptyMessage.style.display = tasks.length === 0 ? "block" : "none";

    let completed = tasks.filter(function(task) {
        return task.completed;
    }).length;

    document.getElementById("taskCount").textContent =
        tasks.length + (tasks.length === 1 ? " task" : " tasks");

    document.getElementById("completedCount").textContent =
        completed + " completed";

    updateTaskOptions();
}


// Delete a task

function deleteTask(id) {
    tasks = tasks.filter(function(task) {
        return task.id !== id;
    });

    if (currentTaskId === id) {
        currentTaskId = null;
    }

    saveTasks();
    renderTasks();
}


// Update the Focus Mode task dropdown

function updateTaskOptions() {
    let select = document.getElementById("focusTask");

    if (!select) {
        return;
    }

    select.innerHTML = "";

    if (tasks.length === 0) {
        let option = document.createElement("option");
        option.value = "";
        option.textContent = "Add a task first";
        select.appendChild(option);

        currentTaskId = null;
        updateCurrentTaskDisplay();
        return;
    }

    tasks.forEach(function(task) {
        let option = document.createElement("option");
        option.value = String(task.id);
        option.textContent =
            task.name + " (" + task.priority + ")" +
            (task.completed ? " — Completed" : "");

        select.appendChild(option);
    });

    let selectedTaskExists = tasks.some(function(task) {
        return task.id === currentTaskId;
    });

    if (!selectedTaskExists) {
        let firstPending = tasks.find(function(task) {
            return !task.completed;
        });

        currentTaskId = firstPending ? firstPending.id : tasks[0].id;
    }

    select.value = String(currentTaskId);
    updateCurrentTaskDisplay();
}


// Display the current assignment

function updateCurrentTaskDisplay() {
    let display = document.getElementById("currentTaskDisplay");

    if (!display) {
        return;
    }

    let task = tasks.find(function(item) {
        return item.id === currentTaskId;
    });

    display.textContent = task
        ? "Current assignment: " + task.name
        : "Add a task to get started.";
}


// Update timer display

function updateTimer() {
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;

    let display =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

    document.getElementById("timer").textContent = display;

    let focusTimer = document.getElementById("focusTimer");

    if (focusTimer) {
        focusTimer.textContent = display;
    }
}


// Select timer duration

function setDuration(minutes) {
    clearInterval(timer);
    timer = null;
    endTime = null;

    selectedMinutes = minutes;
    time = selectedMinutes * 60;

    updateTimer();
}


// Start timer

function startTimer() {
    if (timer !== null) {
        return;
    }

    if (time <= 0) {
        alert("Please reset the timer first.");
        return;
    }

    endTime = Date.now() + time * 1000;

    timer = setInterval(function() {
        time = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        updateTimer();

        if (time <= 0) {
            clearInterval(timer);
            timer = null;
            endTime = null;
            alert("Study session completed!");
        }
    }, 250);
}


// Pause timer

function pauseTimer() {
    if (timer !== null && endTime !== null) {
        time = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    }

    clearInterval(timer);
    timer = null;
    endTime = null;

    updateTimer();
}


// Reset timer

function resetTimer() {
    clearInterval(timer);
    timer = null;
    endTime = null;

    time = selectedMinutes * 60;
    updateTimer();
}


// Open Focus Mode

function openFocusMode() {
    if (focusScreen) {
        return;
    }

    focusScreen = document.createElement("div");
    focusScreen.id = "focusScreen";

    focusScreen.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        background: #17202a;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 16px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 24px;
        box-sizing: border-box;
    `;

    focusScreen.innerHTML = `
        <h1>Focus Mode</h1>
        <p>Choose your current assignment:</p>

        <select id="focusTask" aria-label="Choose current assignment"></select>

        <h2 id="currentTaskDisplay">Choose a task to begin.</h2>

        <h1 id="focusTimer">25:00</h1>

        <div>
            <button type="button" id="focusStart">Start</button>
            <button type="button" id="focusPause">Pause</button>
            <button type="button" id="focusReset">Reset</button>
        </div>

        <p id="focusWarning" role="status" aria-live="polite"
            style="color:#ffcc66; min-height:24px;"></p>

        <button type="button" id="exitFocus">Exit Focus Mode</button>
    `;

    document.body.appendChild(focusScreen);

    updateTaskOptions();
    updateTimer();

    document.getElementById("focusTask").addEventListener("change", function() {
        currentTaskId = Number(this.value) || null;
        updateCurrentTaskDisplay();
    });

    document.getElementById("focusStart").addEventListener("click", startTimer);
    document.getElementById("focusPause").addEventListener("click", pauseTimer);
    document.getElementById("focusReset").addEventListener("click", resetTimer);
    document.getElementById("exitFocus").addEventListener("click", closeFocusMode);

    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(function() {});
    }
}


// Exit Focus Mode

function closeFocusMode() {
    if (focusScreen) {
        focusScreen.remove();
        focusScreen = null;
    }

    if (warningTimeout !== null) {
        clearTimeout(warningTimeout);
        warningTimeout = null;
    }

    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(function() {});
    }
}


// Warn when returning to the tab

document.addEventListener("visibilitychange", function() {
    if (document.hidden || !focusScreen) {
        return;
    }

    let warning = document.getElementById("focusWarning");

    if (!warning) {
        return;
    }

    warning.textContent = "Welcome back! Stay focused on your assignment.";

    if (warningTimeout !== null) {
        clearTimeout(warningTimeout);
    }

    warningTimeout = setTimeout(function() {
        if (focusScreen && warning.isConnected) {
            warning.textContent = "";
        }

        warningTimeout = null;
    }, 4000);
});


// Load saved tasks when the app opens

renderTasks();
updateTimer();



