/**
 * Core Financial Logic
 */

export const FinancialEngine = {
    parseCurrency(str) {
        if (!str) return 0;
        if (typeof str === 'number') return str;
        return parseFloat(str.replace(/[^0-9.]/g, ''));
    },

    formatCurrency(num) {
        if (!num && num !== 0) return "";
        return Math.round(num).toLocaleString('en-IN');
    },

    // Legacy support if needed, but DebtSimulator handles the Heavy Lifting now
    calculateCompound(principal, rate, months) {
        const history = [];
        let p = principal;
        for (let i = 0; i < months; i++) {
            p = p * (1 + rate / 12);
            history.push(p);
        }
        return { finalAmount: p, history };
    }
};
