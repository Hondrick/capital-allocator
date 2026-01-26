/**
 * Page Controller: Index
 */
import { InputUI } from '../ui/inputs.js';
import { Storage } from '../state/storage.js';
import { SimulationApi } from '../api/simulationApi.js';

// Expose functions globally for legacy inline onclicks if we can't fully remove them yet?
// Ideally, we bind everything in JS. InputUI does binding.
// But the original HTML has `onclick="removeLoan(...)"` and `onclick="runSimulation()"`
// usage. InputUI tries to handle addLoan via binding, but removeLoan was inline.
// Refactor Strategy: InputUI handles DOM generation. It should attach listeners.
// The InputUI.addLoanRow implementation DOES attach click listeners to the remove button.
// So we just need to bind global buttons (Run Simulation).

const IndexPage = {
    init() {
        // 1. Restore State
        const savedState = Storage.getDraft();
        if (savedState) {
            InputUI.restoreState(savedState);
        } else {
            // Default Init
            InputUI.addLoanRow("Car Loan", "8,00,000", "5,50,000", "15,000", "9");
        }

        // 2. Bind Events
        InputUI.bindEvents();

        // Bind Run Simulation Button
        const btnRun = document.querySelector("button.primary");
        if (btnRun) {
            btnRun.onclick = async () => {
                await this.runSimulation();
            };
        }

        // Reload Handler
        if (performance.getEntriesByType("navigation")[0]?.type === 'reload') {
            Storage.clearDraft();
            InputUI.restoreState(null); // Clear inputs
            InputUI.addLoanRow("Car Loan", "8,00,000", "5,50,000", "15,000", "9");
        }
    },

    async runSimulation() {
        const state = InputUI.captureState();

        // Parse numbers for API
        const income = this.parse(state.income);

        let fixed = 0;
        Object.values(state.costs).forEach(v => fixed += this.parse(v));

        const loansData = state.loans.map(l => ({
            name: l.name || "Unknown Loan",
            principal: this.parse(l.principal),
            emi: this.parse(l.emi),
            roi: parseFloat(l.roi) || 0,
            tenure: parseInt(l.tenure) || 0,
            months_left: parseInt(l.left) || 0
        }));

        try {
            const results = await SimulationApi.runServerSimulation(income, fixed, loansData);

            InputUI.renderResults(results, income, fixed, loansData, (name, res, inputs) => {
                Storage.saveUserInputs(inputs);
                Storage.saveStrategy(name, res);
                window.location.href = "dashboard.html";
            });

        } catch (e) {
            // Error handling done in API layer
        }
    },

    parse(str) {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9.]/g, ''));
    }
};

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
    IndexPage.init();
});
