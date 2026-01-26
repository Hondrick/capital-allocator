/**
 * Robust Debt Simulator (Avalanche + Snowball)
 * Exact replica of the logic verified on Dashboard
 */

export function runClientSideSimulation(loans, allocations, months = 60, equityReturn = 0.10) {
    // 1. Inputs
    const debtAlloc = allocations["Extra Debt Payment"] || 0;
    const investAlloc = allocations["Investments"] || 0;

    // 2. Setup Loan Objects for Sim (Deep Copy)
    let activeLoans = loans.map(l => ({
        name: l.name,
        principal: l.principal, // Outstanding
        emi: l.emi,
        roi: l.roi,
        monthlyRate: (l.roi / 12) / 100
    }));

    // Calculate Base Mandated EMI Total (Constant sum of original EMIs)
    const baseEmiTotal = activeLoans.reduce((sum, l) => sum + l.emi, 0);

    let currentInv = 0;

    const debtPath = [];
    const investmentPath = [];
    const netWorthPath = [];
    const labels = [];

    for (let m = 0; m < months; m++) {
        // A. Investment Growth (Start of Month)
        currentInv = currentInv * (1 + equityReturn / 12);

        // B. Debt Payment Logic
        let monthlyDebtBudget = baseEmiTotal + debtAlloc;
        let actualDebtPaidThisMonth = 0;

        // 1. Mandatory Minimums first
        activeLoans.forEach(loan => {
            if (loan.principal <= 0) return;

            const interest = loan.principal * loan.monthlyRate;
            const amountDue = loan.emi;

            // Pay minimum needed to satisfy EMI or Close Loan
            const amountToClear = loan.principal + interest;
            const payment = Math.min(amountDue, amountToClear);

            monthlyDebtBudget -= payment;

            // Apply payment
            const principalComp = payment - interest;
            loan.principal -= principalComp;
            if (loan.principal < 0) loan.principal = 0;

            actualDebtPaidThisMonth += payment;
        });

        // 2. Surplus Allocation (Avalanche - Highest ROI)
        if (monthlyDebtBudget > 0.01) {
            // Sort active loans by ROI descending
            const sortable = activeLoans.filter(l => l.principal > 0).sort((a, b) => b.roi - a.roi);

            for (let loan of sortable) {
                if (monthlyDebtBudget <= 0) break;

                const principalRemaining = loan.principal;
                const extraPayment = Math.min(monthlyDebtBudget, principalRemaining);

                loan.principal -= extraPayment;
                monthlyDebtBudget -= extraPayment;
                actualDebtPaidThisMonth += extraPayment;
            }
        }

        // 3. Snowball Redirection (Flow to Investments)
        if (monthlyDebtBudget > 0) {
            currentInv += monthlyDebtBudget;
        }

        // 4. Standard Investment Allocation
        currentInv += investAlloc;

        // Record Stats
        const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.principal, 0);

        debtPath.push(Math.max(0, totalOutstanding));
        investmentPath.push(currentInv);
        netWorthPath.push(currentInv - totalOutstanding);
        labels.push(`M${m + 1}`);
    }

    return {
        labels,
        debtPath,
        investmentPath,
        netWorthPath
    };
}
