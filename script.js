function addTask() {

    let input = document.getElementById("taskInput");

    let task = input.value;

    if (task == "") {
        alert("Please enter a study task");
        return;
    }

    let list = document.getElementById("taskList");

    let item = document.createElement("li");

    item.innerHTML = task;

    list.appendChild(item);

    input.value = "";
}


// Focus Timer

let time = 25 * 60;
let timer = null;

function startTimer() {

    if (timer !== null) {
        return;
    }

    timer = setInterval(function() {

        let minutes = Math.floor(time / 60);
        let seconds = time % 60;

        document.getElementById("timer").innerHTML =
            minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

        if (time === 0) {

            clearInterval(timer);
            timer = null;

            alert("Study session completed!");

            return;
        }

        time--;

    }, 1000);
}


function pauseTimer() {

    clearInterval(timer);

    timer = null;
}


function resetTimer() {

    clearInterval(timer);

    timer = null;

    time = 25 * 60;

    document.getElementById("timer").innerHTML = "25:00";
}
