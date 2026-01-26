/**
 * API Integration Layer
 */

export const SimulationApi = {
    async runServerSimulation(income, fixedExpenses, loansData) {
        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    income: income,
                    fixed_expenses: fixedExpenses,
                    loans: loansData
                })
            });

            if (!response.ok) throw new Error("Backend Error");

            return await response.json();

        } catch (e) {
            console.error(e);
            alert("Could not connect to backend. Please ensure 'python3 app.py' is running!");
            throw e;
        }
    }
};
