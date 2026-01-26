/**
 * Page Controller: Dashboard
 */
import { Storage } from '../state/storage.js';
import { SlidersUI } from '../ui/sliders.js';
import { ChartsUI } from '../ui/charts.js';
import { SimulationApi } from '../api/simulationApi.js';

const DashboardPage = {
    state: {
        userInputs: null,
        allocations: {},
        strategyName: ""
    },

    init() {
        // 1. Load Data
        this.state.userInputs = Storage.getUserInputs();
        const ctx = Storage.getStrategyContext();
        this.state.strategyName = ctx.name;

        if (!this.state.userInputs) {
            alert("No input data found. Redirecting...");
            window.location.href = "index.html";
            return;
        }

        document.getElementById("strat-name").innerText = this.state.strategyName;

        // 2. Initialize Logic
        this.initLogic();

        // 3. Render Initial
        SlidersUI.initControls("controls", this.state.allocations, this.state.totalBudget, (key, val) => {
            this.handleAllocationChange(key, val);
        });

        this.runSimulation();
    },

    initLogic() {
        const { income, fixed, loans } = this.state.userInputs;

        // Calculate core stats
        let totalEMI = 0;
        loans.forEach(l => totalEMI += l.emi);

        // Deployable Capital
        const deployable = Math.max(0, income - fixed - totalEMI);
        this.state.totalBudget = deployable;
        this.state.totalEMI = totalEMI; // Needed for sim
        this.state.loans = loans;

        // Initial Allocations based on Strategy
        if (this.state.strategyName === "Kill Debt First") {
            this.state.allocations = {
                "Extra Debt Payment": deployable,
                "Investments": 0,
                "Fun Money": 0
            };
        } else if (this.state.strategyName === "Wealth Builder") {
            this.state.allocations = {
                "Extra Debt Payment": 0,
                "Investments": Math.floor(deployable * 0.7),
                "Fun Money": Math.floor(deployable * 0.3)
            };
        } else {
            this.state.allocations = {
                "Extra Debt Payment": 0,
                "Investments": Math.floor(deployable * 0.8),
                "Fun Money": Math.floor(deployable * 0.2)
            };
        }
    },

    handleAllocationChange(changedKey, newValue) {
        const total = this.state.totalBudget;
        let val = newValue;
        if (val > total) val = total;

        const remaining = total - val;

        // Redistribute
        const otherKeys = Object.keys(this.state.allocations).filter(k => k !== changedKey);
        let currentSumOthers = 0;
        otherKeys.forEach(k => currentSumOthers += this.state.allocations[k]);

        otherKeys.forEach(k => {
            let portion = 0;
            if (currentSumOthers > 0) {
                portion = (this.state.allocations[k] / currentSumOthers) * remaining;
            } else {
                portion = remaining / otherKeys.length;
            }
            this.state.allocations[k] = portion;
        });

        this.state.allocations[changedKey] = val;

        // UI Update
        SlidersUI.updateValues(this.state.allocations);

        // Rerun Sim
        this.runSimulation();
    },

    async runSimulation() {
        // Use Server API now
        try {
            const res = await SimulationApi.recalculatePath(
                this.state.loans,
                this.state.allocations
            );

            // Map API response to ChartsUI format
            // API returns: labels, debt_path, investment_path, net_worth_path
            ChartsUI.render(res.labels, res.debt_path, res.investment_path, res.net_worth_path);

        } catch (e) {
            console.error("Simulation Failed", e);
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    DashboardPage.init();
});
