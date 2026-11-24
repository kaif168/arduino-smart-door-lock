/* ==========================================================================
   Chart.js Security Analytics & Telemetry Visualizations
   ========================================================================== */

class SecurityAnalyticsManager {
  constructor() {
    this.hourlyChart = null;
    this.methodChart = null;
    this.verdictChart = null;
  }

  initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library not loaded.');
      return;
    }

    // Set Global Chart Dark Theme Defaults
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';

    this.renderHourlyChart();
    this.renderMethodChart();
    this.renderVerdictChart();
  }

  renderHourlyChart() {
    const ctx = document.getElementById('hourlyAccessChart');
    if (!ctx) return;

    if (this.hourlyChart) this.hourlyChart.destroy();

    const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    const accessData = [2, 0, 1, 14, 18, 12, 22, 8];

    this.hourlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: 'Door Access Activity',
          data: accessData,
          borderColor: '#00f2fe',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
            gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
            return gradient;
          },
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00f2fe',
          pointBorderColor: '#0b0f19',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#162032',
            titleColor: '#f3f4f6',
            bodyColor: '#00f2fe',
            borderColor: 'rgba(0, 242, 254, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  renderMethodChart() {
    const ctx = document.getElementById('accessMethodChart');
    if (!ctx) return;

    if (this.methodChart) this.methodChart.destroy();

    this.methodChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['PIN Keypad', 'RFID Card', 'Web Control', 'One-Time Passcode'],
        datasets: [{
          data: [45, 30, 20, 5],
          backgroundColor: [
            '#00f2fe',
            '#3b82f6',
            '#10b981',
            '#f59e0b'
          ],
          borderColor: '#162032',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
              color: '#9ca3af'
            }
          }
        },
        cutout: '72%'
      }
    });
  }

  renderVerdictChart() {
    const ctx = document.getElementById('verdictChart');
    if (!ctx) return;

    if (this.verdictChart) this.verdictChart.destroy();

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    this.verdictChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Access Granted',
            data: [28, 32, 24, 30, 42, 38, 35],
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Access Denied',
            data: [2, 1, 4, 0, 3, 5, 1],
            backgroundColor: '#ef4444',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, padding: 12 }
          }
        },
        scales: {
          y: {
            stacked: false,
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            stacked: false,
            grid: { display: false }
          }
        }
      }
    });
  }

  updateData() {
    if (this.hourlyChart) this.renderHourlyChart();
    if (this.methodChart) this.renderMethodChart();
    if (this.verdictChart) this.renderVerdictChart();
  }
}

window.analyticsManager = new SecurityAnalyticsManager();
