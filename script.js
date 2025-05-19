let cprTime = 0;
let ccTime = 0;
let press = false;
let cprRunning = false;
let cprStart, ccStart;
let logText = "";

// グラフ用データ
const ccfData = {
    labels: [],
    datasets: [{
        label: 'CCF (%)',
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
        tension: 0.1
    }]
};

const ccfChart = new Chart(
    document.getElementById('ccfChart'),
    {
        type: 'line',
        data: ccfData,
        options: {
            plugins: {
                annotation: {
                    annotations: {} // ここにマーカーを動的に追加していく
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'CCF (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '時間 (秒)'
                    }
                }
            }
        }
    }
);

function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSec % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function updateDisplay() {
    document.getElementById("time_cpr").textContent = `CPR: ${formatTime(cprTime)}`;
    document.getElementById("time_cc").textContent = `圧迫: ${formatTime(ccTime)}`;
    const rate = cprTime > 0 ? Math.floor((ccTime / cprTime) * 100) : 0;
    document.getElementById("rate").textContent = `圧迫率: ${rate}%`;
}

let elapsedSeconds = 0;

function tick() {
    const now = Date.now();

    if (cprRunning) {
        cprTime += now - cprStart;
        cprStart = now;

        if (press) {
            ccTime += now - ccStart;
            ccStart = now;
        }

        // 1秒ごとの処理（CPRが動いている時のみ）
        elapsedSeconds++;
        const currentRate = cprTime > 0 ? Math.floor((ccTime / cprTime) * 100) : 0;
        ccfData.labels.push(elapsedSeconds);
        ccfData.datasets[0].data.push(currentRate);
        ccfChart.update();
    }

    updateDisplay();
    setTimeout(tick, 1000);
}

document.getElementById("button-reset").addEventListener("click", () => {
    cprTime = 0;
    ccTime = 0;
    press = false;
    cprRunning = false;
    logText = "";
    elapsedSeconds = 0;

    // グラフリセット
    ccfData.labels = [];
    ccfData.datasets[0].data = [];
    ccfChart.update();

    document.getElementById("log_interruption").innerHTML = "";
    updateDisplay();
    document.getElementById("button-cpr").style.backgroundColor = "#4CAF50";
    document.getElementById("button-cc").style.backgroundColor = "#4CAF50";
});

document.getElementById("button-cpr").addEventListener("click", () => {
    cprRunning = !cprRunning;
    cprStart = Date.now();
    document.getElementById("button-cpr").style.backgroundColor = cprRunning ? "#228B22" : "#4CAF50";
});

document.getElementById("button-cc").addEventListener("click", () => {
    press = !press;
    ccStart = Date.now();
    const logArea = document.getElementById("log_interruption");

    if (press) {
        // 圧迫開始時、CPRが止まっていたら自動スタート
        if (!cprRunning) {
            cprRunning = true;
            cprStart = Date.now();
            document.getElementById("button-cpr").style.backgroundColor = "#228B22";
        }
        logText += `<div class="log-entry">[${new Date().toLocaleTimeString()}] 圧迫開始</div>`;
    } else {
        logText += `<div class="log-entry">[${new Date().toLocaleTimeString()}] 圧迫停止</div>`;
    }
    logArea.innerHTML = logText;
    document.getElementById("button-cc").style.backgroundColor = press ? "#228B22" : "#4CAF50";
});

tick(); // タイマー開始

function addLog(action) {
    const logArea = document.getElementById("log_interruption");
    logText += `<div class="log-entry">[${new Date().toLocaleTimeString()}] ${action}</div>`;
    logArea.innerHTML = logText;

    // グラフにアノテーションを追加
    const id = `log-${elapsedSeconds}`;
    ccfChart.options.plugins.annotation.annotations[id] = {
        type: 'line',
        xMin: elapsedSeconds,
        xMax: elapsedSeconds,
        borderColor: 'red',
        borderWidth: 2,
        label: {
            content: action,
            enabled: true,
            position: 'start',
            backgroundColor: 'rgba(255,0,0,0.7)',
            color: '#fff',
            font: { size: 10 }
        }
    };
    ccfChart.update();
}

function addCustomLog() {
    const input = document.getElementById("customLogInput");
    const value = input.value.trim();
    if (value) {
        addLog(value);
        input.value = ""; // 入力欄をクリア
    }
}