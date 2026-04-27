/* ============================================================
   COMMON CENTS — Charts Module (js/charts.js)
   Colour-blind friendly palette throughout
   ============================================================ */

const CC_COLORS = {
  teal:    { bg: '#0d9e75', border: '#0d6e56', light: 'rgba(13,158,117,0.15)' },
  amber:   { bg: '#e8971f', border: '#c07a12', light: 'rgba(232,151,31,0.15)' },
  blue:    { bg: '#2474c4', border: '#1a5fa5', light: 'rgba(36,116,196,0.15)' },
  coral:   { bg: '#c9542a', border: '#a33f1a', light: 'rgba(201,84,42,0.15)'  },
  purple:  { bg: '#5a44b8', border: '#4230a0', light: 'rgba(90,68,184,0.15)'  },
  slate:   { bg: '#7b8fa6', border: '#5a6f85', light: 'rgba(123,143,166,0.15)'},
  sage:    { bg: '#5a9e75', border: '#3d7a56', light: 'rgba(90,158,117,0.15)' },
};

// Colour-blind safe palette for categories (no red/green ambiguity)
const CAT_COLORS = {
  groceries:     CC_COLORS.amber,
  dining:        CC_COLORS.coral,
  utilities:     CC_COLORS.blue,
  transport:     CC_COLORS.teal,
  entertainment: CC_COLORS.purple,
  health:        CC_COLORS.sage,
  other:         CC_COLORS.slate,
};

const CHART_DEFAULTS = {
  font: { family: 'DM Sans, sans-serif', size: 12 },
  color: '#5c5b57',
};

let charts = {};

function destroyChart(key) {
  if (charts[key]) { charts[key].destroy(); charts[key] = null; }
}

function getChartColors() {
  return {
    grid:   'rgba(0,0,0,0.06)',
    text:   '#5c5b57',
    bg:     '#ffffff',
  };
}

// ---- DONUT CHART (Dashboard spending breakdown) ----
function renderDonutChart(canvasId, catSpend) {
  destroyChart('donut');
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const entries = Object.entries(catSpend).filter(([,v]) => v > 0);
  if (!entries.length) { canvas.parentElement.innerHTML = '<div class="empty-state"><i data-lucide="pie-chart"></i><span>No spending data yet</span></div>'; lucide.createIcons(); return; }

  const labels  = entries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
  const values  = entries.map(([,v]) => v);
  const colors  = entries.map(([k]) => (CAT_COLORS[k] || CC_COLORS.slate).bg);
  const borders = entries.map(([k]) => (CAT_COLORS[k] || CC_COLORS.slate).border);

  charts.donut = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` $${ctx.parsed.toFixed(2)} (${((ctx.parsed / values.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`,
          },
          bodyFont: CHART_DEFAULTS.font,
        }
      },
      animation: { animateRotate: true, duration: 600, easing: 'easeInOutQuart' },
    }
  });

  // Render legend separately
  const legend = document.getElementById('category-legend');
  if (legend) {
    legend.innerHTML = entries.map(([k, v]) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${(CAT_COLORS[k]||CC_COLORS.slate).bg}"></div>
        <span>${k.charAt(0).toUpperCase()+k.slice(1)} <strong>$${v.toFixed(0)}</strong></span>
      </div>`).join('');
  }
}

// ---- BAR CHART (Monthly spending vs income) ----
function renderBarChart(canvasId, monthlyData) {
  destroyChart('bar');
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const c = getChartColors();
  charts.bar = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: monthlyData.map(m => m.label),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(m => m.income),
          backgroundColor: CC_COLORS.teal.light,
          borderColor: CC_COLORS.teal.border,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: monthlyData.map(m => m.expenses),
          backgroundColor: CC_COLORS.amber.light,
          borderColor: CC_COLORS.amber.border,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Savings',
          data: monthlyData.map(m => Math.max(0, m.savings)),
          backgroundColor: CC_COLORS.blue.light,
          borderColor: CC_COLORS.blue.border,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: CHART_DEFAULTS.font, color: c.text, usePointStyle: true, pointStyleWidth: 8, padding: 14 }
        },
        tooltip: {
          callbacks: { label: ctx => ` $${ctx.parsed.y.toFixed(2)}` },
          bodyFont: CHART_DEFAULTS.font,
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: CHART_DEFAULTS.font, color: c.text }
        },
        y: {
          grid: { color: c.grid, drawBorder: false },
          ticks: {
            font: CHART_DEFAULTS.font,
            color: c.text,
            callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v),
          },
          border: { display: false }
        }
      },
      animation: { duration: 700, easing: 'easeInOutQuart' },
    }
  });
}

// ---- FORECAST CHART (Savings projection) ----
function renderForecastChart(canvasId, forecast) {
  destroyChart('forecast');
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const c = getChartColors();
  const historyLen = forecast.history.length;
  const allLabels  = [...forecast.history.map(h => h.label), ...forecast.future.map(f => f.label)];
  const actualData = forecast.history.map(h => h.value);
  const forecastData = [...Array(historyLen).fill(null), ...forecast.future.map(f => f.value)];
  const cumulData  = [...Array(historyLen).fill(null), ...forecast.future.map(f => f.cumulative)];

  // Bridge point so lines connect
  if (actualData.length > 0) {
    forecastData[historyLen - 1] = actualData[historyLen - 1];
  }

  charts.forecast = new Chart(canvas, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        {
          label: 'Actual Savings',
          data: actualData,
          borderColor: CC_COLORS.teal.bg,
          backgroundColor: CC_COLORS.teal.light,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: CC_COLORS.teal.bg,
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Projected Savings',
          data: forecastData,
          borderColor: CC_COLORS.blue.bg,
          backgroundColor: CC_COLORS.blue.light,
          borderWidth: 2.5,
          borderDash: [6, 4],
          pointRadius: 3,
          pointBackgroundColor: CC_COLORS.blue.bg,
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Cumulative Forecast',
          data: cumulData,
          borderColor: CC_COLORS.amber.bg,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [3, 6],
          pointRadius: 0,
          tension: 0.35,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: CHART_DEFAULTS.font, color: c.text, usePointStyle: true, pointStyleWidth: 8, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.parsed.y === null) return null;
              return ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(0)}`;
            }
          },
          bodyFont: CHART_DEFAULTS.font,
        },
        annotation: {}
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: CHART_DEFAULTS.font, color: c.text }
        },
        y: {
          grid: { color: c.grid, drawBorder: false },
          ticks: {
            font: CHART_DEFAULTS.font,
            color: c.text,
            callback: v => '$' + (Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v),
          },
          border: { display: false }
        }
      },
      animation: { duration: 800, easing: 'easeInOutQuart' },
    }
  });
}

// ---- LINE CHART (Category trends over months) ----
function renderLineChart(canvasId, monthsBack = 6) {
  destroyChart('line');
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const c = getChartColors();
  const now = new Date();
  const labels = [];
  const catKeys = ['groceries','dining','utilities','transport','entertainment'];
  const datasets = catKeys.map(cat => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    data: [],
    borderColor: (CAT_COLORS[cat] || CC_COLORS.slate).bg,
    backgroundColor: 'transparent',
    borderWidth: 2,
    pointRadius: 3,
    pointBackgroundColor: (CAT_COLORS[cat] || CC_COLORS.slate).bg,
    tension: 0.35,
  }));

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' }));
    const catSpend = getCategorySpend(d.getFullYear(), d.getMonth());
    catKeys.forEach((cat, idx) => {
      datasets[idx].data.push(catSpend[cat] || 0);
    });
  }

  charts.line = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: CHART_DEFAULTS.font, color: c.text, usePointStyle: true, pointStyleWidth: 8, padding: 10, boxHeight: 8 }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(0)}` },
          bodyFont: CHART_DEFAULTS.font,
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: CHART_DEFAULTS.font, color: c.text }
        },
        y: {
          grid: { color: c.grid, drawBorder: false },
          ticks: {
            font: CHART_DEFAULTS.font,
            color: c.text,
            callback: v => '$' + v,
          },
          border: { display: false }
        }
      },
      animation: { duration: 700, easing: 'easeInOutQuart' },
    }
  });
}

// ---- RENDER BUDGET VS ACTUAL BARS ----
function renderBudgetVsActual(containerId, year, month) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cats = getBudgetCategories();
  const catSpend = getCategorySpend(year, month);
  const colorKeys = ['fill-teal','fill-amber','fill-coral','fill-blue','fill-purple'];

  container.innerHTML = cats.map((cat, idx) => {
    const spent  = catSpend[cat.id] || 0;
    const limit  = cat.limit || 1;
    const pct    = Math.min(100, (spent / limit) * 100);
    const over   = spent > limit;
    const fillCls = over ? 'fill-coral' : colorKeys[idx % colorKeys.length];

    return `
      <div class="bva-row">
        <div class="bva-header">
          <span class="bva-label">${cat.name}</span>
          <span class="bva-amount" style="color:${over ? 'var(--coral)' : 'var(--text-muted)'}">
            $${spent.toFixed(0)} / $${limit}${over ? ' ⚠️' : ''}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${fillCls}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}
