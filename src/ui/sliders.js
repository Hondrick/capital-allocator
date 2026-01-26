/**
 * UI: Sliders & Allocation Controls
 */

export const SlidersUI = {
    initControls(containerId, allocations, totalBudget, onUpdate) {
        const controlsDiv = document.getElementById(containerId);
        if (!controlsDiv) return;

        controlsDiv.innerHTML = "";

        for (const [key, value] of Object.entries(allocations)) {
            const max = totalBudget;

            const group = document.createElement("div");
            group.className = "control-group";
            group.innerHTML = `
                <div class="control-header">
                    <span>${key}</span>
                    <span id="val-${key}">₹${Math.round(value).toLocaleString()}</span>
                </div>
                <input type="range" id="input-${key}" min="0" max="${Math.round(max)}" step="100" value="${value}">
            `;

            controlsDiv.appendChild(group);

            // Add listener
            group.querySelector("input").addEventListener("input", (e) => {
                onUpdate(key, parseFloat(e.target.value));
            });
        }

        this.updateTotal(allocations);
    },

    updateTotal(allocations) {
        const total = Object.values(allocations).reduce((a, b) => a + b, 0);
        const el = document.getElementById("totalAllocated");
        if (el) el.textContent = `₹${Math.round(total).toLocaleString()}`;
    },

    updateValues(allocations) {
        for (const [key, value] of Object.entries(allocations)) {
            const slider = document.getElementById(`input-${key}`);
            const text = document.getElementById(`val-${key}`);
            if (slider) slider.value = value;
            if (text) text.textContent = `₹${Math.round(value).toLocaleString()}`;
        }
        this.updateTotal(allocations);
    }
};
