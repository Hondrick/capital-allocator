/**
 * UI: Charts (Chart.js Wrapper)
 */

export const ChartsUI = {
    monthlyChartInstance: null,
    yearlyChartInstance: null,

    render(labels, debt, investments, netWorth) {
        this.renderMonthly(labels, debt, investments, netWorth);
        this.renderYearly(investments);
    },

    renderMonthly(labels, debt, investments, netWorth) {
        const ctx = document.getElementById("monthlyChart").getContext("2d");
        if (this.monthlyChartInstance) this.monthlyChartInstance.destroy();

        this.monthlyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Net Worth',
                        data: netWorth,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Debt',
                        data: debt,
                        borderColor: '#ef4444',
                        tension: 0.4
                    },
                    {
                        label: 'Investments',
                        data: investments,
                        borderColor: '#10b981',
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { grid: { color: '#1e293b' } },
                    y: { grid: { color: '#1e293b' } }
                }
            }
        });
    },

    renderYearly(investments) {
        // Simplified Yearly for speed
        const yrLabels = ["Y1", "Y2", "Y3", "Y4", "Y5"];
        const yrData = [];
        for (let y = 1; y <= 5; y++) {
            yrData.push((investments[y * 12 - 1] || 0));
        }

        const ctx = document.getElementById("yearlyChart").getContext("2d");
        if (this.yearlyChartInstance) this.yearlyChartInstance.destroy();

        this.yearlyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: yrLabels,
                datasets: [{
                    label: 'Investments',
                    data: yrData,
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#1e293b' } }
                }
            }
        });
    }
};
