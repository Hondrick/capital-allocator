/**
 * State Management (LocalStorage)
 */

const STORAGE_KEY_DRAFT = "allocator_form_draft";
const STORAGE_KEY_INPUTS = "userInputs";
const STORAGE_KEY_STRATEGY = "strategyName";
const STORAGE_KEY_RESULTS = "simulationResult";

export const Storage = {
    // Input Draft Form
    saveDraft(state) {
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(state));
    },

    getDraft() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_DRAFT));
        } catch { return null; }
    },

    clearDraft() {
        localStorage.removeItem(STORAGE_KEY_DRAFT);
    },

    // Validated User Inputs (for Dashboard)
    saveUserInputs(inputs) {
        localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(inputs));
    },

    getUserInputs() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_INPUTS));
        } catch { return null; }
    },

    // Selected Strategy
    saveStrategy(name, resultData) {
        localStorage.setItem(STORAGE_KEY_STRATEGY, name);
        localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(resultData));
    },

    getStrategyContext() {
        return {
            name: localStorage.getItem(STORAGE_KEY_STRATEGY) || "Custom",
            result: JSON.parse(localStorage.getItem(STORAGE_KEY_RESULTS) || "null")
        };
    }
};
