/**
 * SalesPulse - Data Visualizations & Chart.js Integration
 * Handles responsive performance line/area charts, category donut charts, channel bar charts, and mini sparklines.
 */

class ChartManager {
  constructor() {
    this.performanceChart = null;
    this.categoryChart = null;
    this.channelChart = null;

    // Palette constants (Explicit CSS colors - no CSS variables)
    this.colors = {
      primary: '#4f46e5',
      primaryLight: 'rgba(79, 70, 229, 0.12)',
      primaryBorder: '#4338ca',
      secondary: '#94a3b8',
      secondaryLight: 'rgba(148, 163, 184, 0.08)',
      categories: [
        '#4f46e5', // Indigo
        '#0284c7', // Sky
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#64748b'  // Slate
      ],
      channels: [
        '#2563eb', // Blue
        '#7c3aed', // Purple
        '#059669', // Green
        '#d97706'  // Orange
      ]
    };
  }

  /**
   * Render or update Main Sales Performance Chart
   */
  renderPerformanceChart(canvasId, timeSeriesData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Create subtle gradient for primary area
    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.22)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.00)');

    if (this.performanceChart) {
      this.performanceChart.destroy();
    }

    this.performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeSeriesData.labels,
        datasets: [
          {
            label: timeSeriesData.currentLabel || 'Current Period',
            data: timeSeriesData.current,
            borderColor: this.colors.primary,
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: this.colors.primary,
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: this.colors.primary,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2
          },
          {
            label: timeSeriesData.prevLabel || 'Previous Period',
            data: timeSeriesData.previous,
            borderColor: this.colors.secondary,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: this.colors.secondary
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              padding: 18,
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 12,
                weight: '500'
              },
              color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            cornerRadius: 8,
            titleFont: {
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              size: 13,
              weight: '600'
            },
            bodyFont: {
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              size: 12
            },
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 11
              },
              padding: 6
            }
          },
          y: {
            grid: {
              color: '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 11
              },
              padding: 8,
              callback: function (val) {
                if (val >= 1000) {
                  return '$' + (val / 1000).toFixed(0) + 'k';
                }
                return '$' + val;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Render or update Category Donut Chart
   */
  renderCategoryChart(canvasId, categoryData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const labels = categoryData.labels.length > 0 ? categoryData.labels : ['No Data'];
    const data = categoryData.data.length > 0 ? categoryData.data : [1];
    const bgColors = categoryData.data.length > 0 ? this.colors.categories : ['#e2e8f0'];

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: bgColors,
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            display: false // We render custom interactive legend below the chart
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const val = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: $${val.toLocaleString()} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Render or update Sales Channel Horizontal Bar Chart
   */
  renderChannelChart(canvasId, channelData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (this.channelChart) {
      this.channelChart.destroy();
    }

    const labels = channelData.labels.length > 0 ? channelData.labels : ['No Data'];
    const data = channelData.data.length > 0 ? channelData.data : [0];

    this.channelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: this.colors.channels,
            borderRadius: 6,
            barThickness: 16
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const val = context.parsed.x;
                return ` Revenue: $${val.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              callback: function (val) {
                if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'k';
                return '$' + val;
              }
            }
          },
          y: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#334155',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 12,
                weight: '500'
              }
            }
          }
        }
      }
    });
  }

  /**
   * Draw high-DPI crisp mini sparkline on HTML5 Canvas
   */
  drawSparkline(canvasId, points, isPositive = true) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!points || points.length < 2) {
      return;
    }

    const strokeColor = isPositive ? '#10b981' : '#f43f5e';
    const fillStart = isPositive ? 'rgba(16, 185, 129, 0.20)' : 'rgba(244, 63, 94, 0.20)';
    const fillEnd = isPositive ? 'rgba(16, 185, 129, 0.00)' : 'rgba(244, 63, 94, 0.00)';

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = (max - min) === 0 ? 1 : (max - min);

    const paddingY = 4;
    const availableHeight = height - (paddingY * 2);
    const stepX = width / (points.length - 1);

    const coords = points.map((val, idx) => ({
      x: idx * stepX,
      y: height - paddingY - (((val - min) / range) * availableHeight)
    }));

    // Area fill
    ctx.beginPath();
    ctx.moveTo(coords[0].x, height);
    ctx.lineTo(coords[0].x, coords[0].y);

    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const midX = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(midX, prev.y, midX, curr.y, curr.x, curr.y);
    }

    ctx.lineTo(coords[coords.length - 1].x, height);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, fillStart);
    grad.addColorStop(1, fillEnd);
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const midX = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(midX, prev.y, midX, curr.y, curr.x, curr.y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.75;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Last point pulse dot
    const last = coords[coords.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  }
}

// Global chart manager
window.chartManager = new ChartManager();

