// index.js - chart + admin controls
// Make sure Chart.js is loaded before this script

document.addEventListener('DOMContentLoaded', () => {
  const canvasEl = document.getElementById('moodChart');
  const ctx = canvasEl ? canvasEl.getContext('2d') : null;
  const adminControls = document.getElementById('adminControls');
  const adminToggle = document.getElementById('adminToggle');
  const addMoodBtn = document.getElementById('addMood');
  const clearMoodBtn = document.getElementById('clearMood');
  const moodRange = document.getElementById('moodRange');
  const moodType = document.getElementById('moodType');
  const moodDatesEl = document.getElementById('mood-dates');
  const timelineDetail = document.getElementById('timeline-detail');
  const timelineEl = document.getElementById('timeline');
  const timelineGroup = document.getElementById('timeline-group');

  let chart = null;
  // stored as array of { type: 'Happiness', v: number, t: timestamp }
  let moods = JSON.parse(localStorage.getItem('moods') || '[]');
  let isAdmin = false;

  const types = ['Happiness', 'Bored', 'Stress'];
  const colorMap = {
    'Happiness': '#0274BD', // bright blue
    'Bored': '#013557',     // dark blue
    'Stress': '#001B2C'     // very dark
  };

  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getLatestPerType() {
    // returns array aligned with types order, each item { v, t }
    return types.map(t => {
      for (let i = moods.length - 1; i >= 0; i--) {
        if (moods[i].type === t) return { v: Number(moods[i].v), t: moods[i].t };
      }
      return { v: 0, t: null };
    });
  }

  function buildDatasets() {
    const latest = getLatestPerType();
    const data = latest.map(it => it.v);
    const bgColors = types.map(t => hexToRgba(colorMap[t], 0.9));
    const borderColors = types.map(t => colorMap[t]);

    return {
      labels: types,
      datasets: [
        {
          label: 'Current moods',
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1
        }
      ]
    };
  }

  if (ctx) {
    const ds = buildDatasets();
    chart = new Chart(ctx, {
      type: 'bar',
      data: ds,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        scales: {
          x: {
            ticks: { autoSkip: false },
            reverse: true // reverse order per user request
          },
          y: {
            beginAtZero: true,
            min: 0,
            max: 10,
            ticks: {
              stepSize: 1,
              precision: 0
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw ?? 0;
                const type = ctx.label ?? '';
                // include date for this mood if exists
                const idx = types.indexOf(type);
                const latest = getLatestPerType()[idx];
                const dateStr = latest && latest.t ? new Date(latest.t).toLocaleString() : 'No date';
                return `${type}: ${val} — ${dateStr}`;
              }
            }
          },
          legend: { display: false }
        },
        datasets: {
          bar: {
            categoryPercentage: 0.7,
            barPercentage: 0.7,
            maxBarThickness: 160
          }
        }
      }
    });
  }

  function updateChart() {
    if (!chart) return;
    const ds = buildDatasets();
    chart.data.labels = ds.labels.slice().reverse(); // reverse labels visually
    chart.data.datasets = ds.datasets.map(d => ({ ...d, data: d.data.slice().reverse() }));
    chart.update();
    renderDates();
  }

  function renderDates() {
    // show the date per bar in a small list, newest first
    const latest = getLatestPerType();
    moodDatesEl.innerHTML = '';
    types.forEach((t, i) => {
      const it = latest[i];
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.fontSize = '12px';
      item.style.color = '#fff';
      item.style.marginTop = '4px';
      const left = document.createElement('div');
      left.textContent = t;
      const right = document.createElement('div');
      right.textContent = it.t ? new Date(it.t).toLocaleString() : '-';
      item.appendChild(left);
      item.appendChild(right);
      moodDatesEl.appendChild(item);
    });
  }

  function addMood(value) {
    if (!isAdmin) { alert('Alleen admin kan moods indienen. Log in als admin.'); return; }
    const type = (moodType && moodType.value) ? moodType.value : 'Happiness';
    // remove existing same-type entry so we replace older entry
    const idx = moods.findIndex(m => m.type === type);
    if (idx !== -1) moods.splice(idx, 1);
    moods.push({ t: Date.now(), v: Number(value), type });
    localStorage.setItem('moods', JSON.stringify(moods));
    updateChart();
  }

  function clearMoods() {
    if (!confirm('Weet je zeker dat je alle mood-gegevens wilt wissen?')) return;
    moods = [];
    localStorage.removeItem('moods');
    updateChart();
  }

  // timeline interactivity (hover or click shows detail)
  document.querySelectorAll('.timeline-item').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      timelineDetail.textContent = btn.getAttribute('data-details') || btn.textContent;
    });
    btn.addEventListener('click', () => {
      timelineDetail.textContent = btn.getAttribute('data-details') || btn.textContent;
    });
  });

  // initial render
  updateChart();

  // initialize admin button state
  if (addMoodBtn) addMoodBtn.disabled = true;

  if (adminToggle) {
    adminToggle.addEventListener('click', () => {
      isAdmin = !isAdmin;
      adminControls.style.display = isAdmin ? 'block' : 'none';
      adminToggle.textContent = isAdmin ? 'Logout admin' : 'Login als admin';
      if (addMoodBtn) addMoodBtn.disabled = !isAdmin;
    });
  }

  if (addMoodBtn) addMoodBtn.addEventListener('click', () => addMood(moodRange.value));
  if (clearMoodBtn) clearMoodBtn.addEventListener('click', clearMoods);

});
