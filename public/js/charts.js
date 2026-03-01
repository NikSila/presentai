/* global Chart */

const chartInstances = new Map();

function destroy(canvasId) {
  const existing = chartInstances.get(canvasId);
  if (existing) { existing.destroy(); chartInstances.delete(canvasId); }
}

function create(canvas, config) {
  destroy(canvas.id);
  const instance = new Chart(canvas, config);
  chartInstances.set(canvas.id, instance);
  return instance;
}

export function renderBarChart(canvas, chartData, colors) {
  const datasets = chartData.series.map((s, i) => ({
    label: s.name,
    data: s.data,
    backgroundColor: colors[i % colors.length],
    borderRadius: 4,
  }));
  return create(canvas, {
    type: 'bar',
    data: { labels: chartData.labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: chartData.series.length > 1, position: 'bottom' } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

export function renderPieChart(canvas, chartData, colors) {
  return create(canvas, {
    type: 'doughnut',
    data: {
      labels: chartData.labels,
      datasets: [{ data: chartData.values, backgroundColor: colors.slice(0, chartData.values.length) }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { position: 'right' } },
    },
  });
}

export function renderLineChart(canvas, chartData, colors) {
  const datasets = chartData.series.map((s, i) => ({
    label: s.name,
    data: s.data,
    borderColor: colors[i % colors.length],
    backgroundColor: colors[i % colors.length] + '33',
    borderWidth: 3,
    pointRadius: 4,
    tension: 0.3,
    fill: false,
  }));
  return create(canvas, {
    type: 'line',
    data: { labels: chartData.labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: chartData.series.length > 1, position: 'bottom' } },
    },
  });
}

export function destroyAll() {
  chartInstances.forEach((c) => c.destroy());
  chartInstances.clear();
}
