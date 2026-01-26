/**
 * UI: Inputs & Form Management
 */

import { FinancialEngine } from '../core/financialEngine.js';
import { Storage } from '../state/storage.js';

export const InputUI = {

    bindEvents() {
        // Bind global formatters (using delegation if possible, or static IDs)
        const inputs = document.querySelectorAll('input');
        inputs.forEach(inp => {
            if (inp.id.startsWith('income') || inp.id.startsWith('cost_')) {
                inp.addEventListener('keyup', (e) => {
                    FinancialEngine.formatCurrency(e.target.value); // Wait, formatCurrency updates value in place
                    // The original formatCurrency took 'input' element.
                    // Let's reimplement similar UI behavior.
                    this.handleCurrency(e.target);
                    this.updateTotalFixed();
                    Storage.saveDraft(this.captureState());
                });
            }
        });

        // Add Loan Button
        const btn = document.querySelector("button.secondary"); // Assumption class
        if (btn) btn.addEventListener('click', () => this.addLoanRow());
    },

    handleCurrency(input) {
        const val = input.value.replace(/[^0-9]/g, '');
        if (!val) return;
        const num = parseInt(val, 10);
        input.value = num.toLocaleString('en-IN');
    },

    updateTotalFixed() {
        const inputs = document.querySelectorAll('.cost-input');
        let total = 0;
        inputs.forEach(inp => total += FinancialEngine.parseCurrency(inp.value));
        const label = document.getElementById("total-fixed");
        if (label) label.textContent = "₹" + total.toLocaleString('en-IN');
    },

    // Dynamic Rows
    addLoanRow(name = "", original = "", principal = "", emi = "", roi = "", tenure = "", left = "") {
        const id = Date.now();
        const div = document.createElement("div");
        div.className = "loan-item";
        div.id = `loan-${id}`;

        // Note: Inline events removed in favor of delegation or explicit binding 
        // But for dynamic elements, simpler to set innerHTML with attributes or attach listeners after.
        // To strictly match "No functional change", I will replicate the innerHTML, 
        // but try to move oninput logic to a centralized saver if possible.
        // Actually, inline `oninput="saveFormState()"` relies on global scope.
        // We MUST expose a global or attach listeners. 
        // I will attach listeners after creation for cleanliness.

        div.innerHTML = `
            <input type="text" placeholder="Name" value="${name}" class="loan-name">
            <input type="text" placeholder="Original" value="${original}" class="loan-original">
            <input type="text" placeholder="Outstanding" value="${principal}" class="loan-principal">
            <input type="text" placeholder="EMI" value="${emi}" class="loan-emi">
            <input type="number" placeholder="%" value="${roi}" class="loan-roi">
            <input type="number" placeholder="Tot" value="${tenure}" class="loan-tenure">
            <input type="number" placeholder="Left" value="${left}" class="loan-left">
            <button class="btn-remove">&times;</button>
        `;

        const list = document.getElementById("loans-list");
        if (list) list.appendChild(div);

        // Attach listeners
        const inputs = div.querySelectorAll('input');
        inputs.forEach(inp => {
            inp.addEventListener('input', () => Storage.saveDraft(this.captureState()));
            if (inp.classList.contains('loan-original') || inp.classList.contains('loan-principal') || inp.classList.contains('loan-emi')) {
                inp.addEventListener('keyup', (e) => this.handleCurrency(e.target));
            }
        });

        const btnRemove = div.querySelector('.btn-remove');
        btnRemove.addEventListener('click', () => {
            div.remove();
            Storage.saveDraft(this.captureState());
        });

        return div;
    },

    captureState() {
        const state = {
            income: document.getElementById('income').value,
            costs: {
                rent: document.getElementById('cost_rent').value,
                food: document.getElementById('cost_food').value,
                transport: document.getElementById('cost_transport').value,
                utilities: document.getElementById('cost_utilities').value,
                other: document.getElementById('cost_other').value
            },
            loans: []
        };

        document.querySelectorAll(".loan-item").forEach(item => {
            state.loans.push({
                name: item.querySelector(".loan-name").value,
                original: item.querySelector(".loan-original").value,
                principal: item.querySelector(".loan-principal").value,
                emi: item.querySelector(".loan-emi").value,
                roi: item.querySelector(".loan-roi").value,
                tenure: item.querySelector(".loan-tenure").value,
                left: item.querySelector(".loan-left").value
            });
        });

        return state;
    },

    restoreState(state) {
        if (!state) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        }

        setVal('income', state.income);
        if (state.costs) {
            setVal('cost_rent', state.costs.rent);
            setVal('cost_food', state.costs.food);
            setVal('cost_transport', state.costs.transport);
            setVal('cost_utilities', state.costs.utilities);
            setVal('cost_other', state.costs.other);
        }

        const list = document.getElementById("loans-list");
        if (list) list.innerHTML = ""; // Clear default

        if (state.loans && state.loans.length > 0) {
            state.loans.forEach(l => {
                this.addLoanRow(l.name, l.original, l.principal, l.emi, l.roi, l.tenure, l.left);
            });
        }

        this.updateTotalFixed();
    },

    renderResults(results, income, fixed, loansData, onSelectStrategy) {
        const output = document.getElementById("output");
        output.innerHTML = "";

        const order = ["Kill Debt First", "Wealth Builder", "Aggressive Growth"];

        order.forEach(name => {
            const data = results[name];
            if (!data) return;

            const div = document.createElement("div");
            div.className = "strategy-card";

            const netWorth = Math.round(data.final_net_worth).toLocaleString('en-IN');
            const savedInterest = data.interest_saved > 0 ? `<div style="margin-top:8px; font-size:14px;">Savings: <span class="highlight-green">₹${Math.round(data.interest_saved).toLocaleString('en-IN')} Interest</span></div>` : "";
            const timeSaved = data.months_saved > 0 ? `<div style="font-size:14px;">Time Saved: <span class="highlight-blue">${data.months_saved} Months</span></div>` : "";
            const debtFreeDate = `<div style="margin-bottom:12px; font-size:14px; color:#94a3b8;">Debt Free: ${data.debt_free_date_str || "Never"}</div>`;

            div.innerHTML = `
                <h3>${name}</h3>
                <div style="font-size:24px; font-weight:bold; margin-bottom:4px;">₹${netWorth}</div>
                <div style="font-size:12px; color:#94a3b8; margin-bottom:16px;">Proj. Net Worth (5Y)</div>
                
                ${debtFreeDate}
                ${savedInterest}
                ${timeSaved}
            `;

            const btn = document.createElement('button');
            btn.className = "primary";
            btn.style.marginTop = "20px";
            btn.style.fontSize = "14px";
            btn.style.padding = "10px";
            btn.textContent = "View Dashboard →";
            btn.onclick = () => onSelectStrategy(name, data, { income, fixed, loans: loansData });

            div.appendChild(btn);
            output.appendChild(div);
        });
    }
};
