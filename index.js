// index.js - simplified: only chart + add/clear admin controls (table removed)
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

  let chart = null;
  let moods = JSON.parse(localStorage.getItem('moods') || '[]');
  // track admin state; only admin can submit moods
  let isAdmin = false;

  // helper to convert hex color to rgba string with alpha
  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function buildDatasets() {
    // Build a single categorical dataset with three labels so bars are equal width and centered
    const types = ['Happiness', 'Bored', 'Stress'];
    const colorMap = {
      'Happiness': '#0274BD', // bright blue
      'Bored': '#013557',     // dark blue
      'Stress': '#001B2C'     // very dark
    };

    // For each type take the most recent value (if any), otherwise 0
    const data = types.map(type => {
      // find last entry of this type in moods
      for (let i = moods.length - 1; i >= 0; i--) {
        if (moods[i].type === type) return moods[i].v;
      }
      return 0;
    });

    const bgColors = types.map(t => hexToRgba(colorMap[t], 0.85));
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
        scales: {
          x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 30 }, offset: true },
          y: {
            type: 'linear',
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
              label: (ctx) => (ctx.raw == null ? `${ctx.dataset.label}: -` : `${ctx.dataset.label}: ${ctx.raw}`)
            }
          }
        },
        datasets: { bar: { barPercentage: 0.7, categoryPercentage: 0.7, maxBarThickness: 60 } }
      }
    });
  }

  function updateChart() {
    if (!chart) return;
    const ds = buildDatasets();
    chart.data.labels = ds.labels;
    chart.data.datasets = ds.datasets;
    chart.update();
  }

  function addMood(value) {
    if (!isAdmin) {
      alert('Alleen admin kan moods indienen. Log in als admin.');
      return;
    }
    const type = (moodType && moodType.value) ? moodType.value : 'Happiness';
    // remove any existing same-type entry so we replace older entry
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

  // initial render
  updateChart();
});
