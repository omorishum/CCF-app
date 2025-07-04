/*
  File        : script.js
  Description : 処置ログを記録するロジック、ボタン操作処理など。
  Author      : Shumpei Omori
  Created     : 2025-07-04
  License     : MIT
  Copyright   : © 2025 omorishumpei
  History     :
    - 2025-07-04 初版作成
*/

// 改良版 script.js（胸骨圧迫ボタン：通常時青・圧迫中暗青）
let cprTime = 0;
let ccTime = 0;
let press = false;
let cprRunning = false;
let cprStart, ccStart;
let logText = "";
let elapsedSeconds = 0;

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const seconds = String(totalSec % 60).padStart(2, '0');
  const deci = Math.floor((ms % 1000) / 100);
  return `${minutes}:${seconds}.${deci}`;
}

function formatElapsedTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${sec}.0`;
}

function updateDisplay() {
  document.getElementById("time_cpr").textContent = `CPR: ${formatTime(cprTime)}`;
  document.getElementById("time_cc").textContent = `圧迫: ${formatTime(ccTime)}`;
  const rate = cprTime > 0 ? Math.min(100, Math.floor((ccTime / cprTime) * 100)) : 0;
  document.getElementById("rate").textContent = `圧迫率: ${rate}%`;
}

const ccfData = {
  labels: [],
  datasets: [{
    label: 'CCF (%)',
    data: [],
    borderColor: 'rgba(75, 192, 192, 1)',
    fill: false,
    tension: 0.4,
    pointRadius: 0
  }]
};

const ccfChart = new Chart(document.getElementById('ccfChart'), {
  type: 'line',
  data: ccfData,
  options: {
    plugins: {
      annotation: { annotations: {} },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, mode: 'x' }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'CCF (%)' }
      },
      x: {
        beginAtZero: true,
        type: 'linear',
        title: { display: true, text: '時間 (分:秒)' },
        ticks: {
          callback: function(value) {
            const m = String(Math.floor(value / 60)).padStart(2, '0');
            const s = String(value % 60).padStart(2, '0');
            return `${m}:${s}`;
          }
        }
      }
    }
  }
});

function tick() {
  const now = Date.now();
  const delta = now - (cprStart || now);

  if (cprRunning) {
    cprTime += delta;
    cprStart = now;

    if (press) {
      ccTime += delta;
      ccStart = now;
    }

    const totalElapsed = Math.floor(cprTime / 1000);
    if (totalElapsed > elapsedSeconds) {
      elapsedSeconds = totalElapsed;
      const currentRate = cprTime > 0 ? Math.min(100, Math.floor((ccTime / cprTime) * 100)) : 0;
      ccfData.labels.push(elapsedSeconds);
      ccfData.datasets[0].data.push(currentRate);

      ccfChart.options.scales.x.min = Math.max(elapsedSeconds - 60, 0);
      ccfChart.options.scales.x.max = elapsedSeconds;
      ccfChart.update();
    }
  }

  updateDisplay();
  setTimeout(tick, 100);
}

document.getElementById("button-reset").addEventListener("click", () => {
  cprTime = 0;
  ccTime = 0;
  press = false;
  cprRunning = false;
  logText = "";
  elapsedSeconds = 0;

  ccfData.labels = [];
  ccfData.datasets[0].data = [];

  if (ccfChart.options.plugins.annotation) {
    ccfChart.options.plugins.annotation.annotations = {};
  }

  ccfChart.update();

  document.getElementById("log_interruption").innerHTML = "";
  updateDisplay();
  document.getElementById("button-cpr").style.backgroundColor = "#4CAF50";
  document.getElementById("button-cc").style.backgroundColor = "#1976D2"; // 初期色：青
});

document.getElementById("button-cpr").addEventListener("click", () => {
  cprRunning = !cprRunning;
  cprStart = Date.now();
  document.getElementById("button-cpr").style.backgroundColor = cprRunning ? "#228B22" : "#4CAF50";

  if (!cprRunning) {
    press = false;
    const ccBtn = document.getElementById("button-cc");
    ccBtn.style.backgroundColor = "#1976D2";
  }
});

document.getElementById("button-cc").addEventListener("click", () => {
  press = !press;
  const timeStr = formatElapsedTime(elapsedSeconds);
  const ccBtn = document.getElementById("button-cc");

  ccBtn.style.backgroundColor = press ? "#1565C0" : "#1976D2";

  if (press) {
    if (!cprRunning) {
      cprRunning = true;
      cprStart = Date.now();
      const cprBtn = document.getElementById("button-cpr");
      cprBtn.style.backgroundColor = "#228B22";
    }
    ccStart = Date.now();
    logText += `<div class="log-entry">[${timeStr}] 圧迫開始</div>`;
  } else {
    logText += `<div class="log-entry">[${timeStr}] 圧迫停止</div>`;
  }

  document.getElementById("log_interruption").innerHTML = logText;
});

tick();

function addLog(action) {
  const logArea = document.getElementById("log_interruption");
  const timeStr = formatElapsedTime(elapsedSeconds);
  logText += `<div class="log-entry">[${timeStr}] ${action}</div>`;
  logArea.innerHTML = logText;

  const id = `log-${elapsedSeconds}`;
  ccfChart.options.plugins.annotation.annotations[id] = {
    type: 'line',
    xMin: elapsedSeconds,
    xMax: elapsedSeconds,
    borderColor: 'red',
    borderWidth: 2,
    label: {
      content: `${timeStr}\n${action}`,
      enabled: true,
      position: 'start',
      rotation: -90,
      backgroundColor: 'rgba(255,0,0,0.7)',
      color: '#fff',
      font: { size: 10 },
      yAdjust: (elapsedSeconds % 2 === 0) ? -20 : 20
    }
  };
  ccfChart.update();
}

function addCustomLog() {
  const input = document.getElementById("customLogInput");
  const value = input.value.trim();
  if (value) {
    addLog(value);
    input.value = "";
  }
}
