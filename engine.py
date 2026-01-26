import copy

class Loan:
    def __init__(self, name, principal, roi, emi, tenure=0, months_left=0):
        self.name = name
        self.principal = float(principal)
        self.roi = float(roi) / 100.0
        self.emi = float(emi)
        self.monthly_rate = self.roi / 12.0
        self.initial_principal = self.principal
        self.total_interest_paid = 0
        self.tenure_total = tenure
        self.months_left = months_left

    def simulate_month(self, extra_payment=0):
        if self.principal <= 0:
            return 0, 0, 0 # Paid, Interest, PrincipalReduced

        interest = self.principal * self.monthly_rate
        
        # Total available to pay this loan
        payment_budget = self.emi + extra_payment
        
        # Can't pay more than balance + interest
        amount_to_clear = self.principal + interest
        actual_payment = min(payment_budget, amount_to_clear)
        
        principal_comp = actual_payment - interest
        
        # If payment < interest (negative amortization), principal grows
        self.principal -= principal_comp
        self.total_interest_paid += interest
        
        if self.principal < 1: 
            self.principal = 0 # Close it out
            
        return actual_payment, interest, principal_comp

def run_custom_simulation(loans_data, allocations, months=60):
    """
    Runs a simulation based on specific user allocations (from sliders).
    Implements Avalanche (Highest ROI first) and Snowball (Freed cashflow redirects to Investments).
    """
    # Deep copy loans
    loans = [Loan(l['name'], l['principal'], l['roi'], l['emi'], l.get('tenure', 0), l.get('months_left', 0)) for l in loans_data]
    
    extra_debt_alloc = float(allocations.get("Extra Debt Payment", 0))
    invest_alloc = float(allocations.get("Investments", 0))
    # Fun Money is usually consumed or saved separately, we simulate it as cash growth or ignore for NW?
    # For consistency with JS, we'll track it in cash but usually it's "spent". 
    # Let's assume Fun Money is consumed unless specified. The prompt asked for "Investments" path.
    # We will focus on Net Worth = Investments - Debt.
    
    debt_path = []
    investment_path = []
    net_worth_path = []
    labels = []
    
    current_inv = 0
    equity_return = 0.10 / 12

    # Calculate Base Mandated EMI Total (Constant sum of original EMIs)
    # This represents the "Debt Commitment" that the user is used to paying.
    base_emi_total = sum(l.emi for l in loans)
    
    for m in range(months):
        # A. Investment Growth
        current_inv = current_inv * (1 + equity_return)
        
        # B. Debt Payment Logic
        # The pool available for debt is (Mandatory EMIs of all loans) + (User Extra Allocation)
        # Even if a loan finishes, its EMI portion stays in the pool (Snowball method) to attack others or invest.
        monthly_debt_budget = base_emi_total + extra_debt_alloc
        
        # 1. Mandatory Minimums first
        for loan in loans:
            if loan.principal <= 0: continue
            
            interest = loan.principal * loan.monthly_rate
            amount_due = loan.emi
            
            # Pay minimum needed
            amount_to_clear = loan.principal + interest
            payment = min(amount_due, amount_to_clear)
            
            monthly_debt_budget -= payment
            
            # Apply payment directly (we can bypass simulate_month helper for granular control or use it)
            # Let's do manual calc to be precise with the pool
            principal_comp = payment - interest
            loan.principal -= principal_comp
            if loan.principal < 0: loan.principal = 0
            
        # 2. Surplus Allocation (Avalanche - Highest ROI)
        if monthly_debt_budget > 0.01:
            # Sort active loans by ROI descending
            active_loans = sorted([l for l in loans if l.principal > 0], key=lambda x: x.roi, reverse=True)
            
            for loan in active_loans:
                if monthly_debt_budget <= 0: break
                
                principal_remaining = loan.principal
                # Extra payment goes 100% to principal
                extra_payment = min(monthly_debt_budget, principal_remaining)
                
                loan.principal -= extra_payment
                monthly_debt_budget -= extra_payment
        
        # 3. Snowball Redirection (Flow to Investments)
        # Whatever is LEFT in monthly_debt_budget after paying minimums and killing all debt...
        # ...is money that USED to go to debt, now free.
        if monthly_debt_budget > 0:
            current_inv += monthly_debt_budget
            
        # 4. Standard Investment Allocation
        current_inv += invest_alloc
        
        # Record Stats
        total_outstanding = sum(l.principal for l in loans)
        
        debt_path.append(max(0, total_outstanding))
        investment_path.append(current_inv)
        net_worth_path.append(current_inv - total_outstanding)
        labels.append(f"M{m+1}")
        
    return {
        "labels": labels,
        "debt_path": debt_path,
        "investment_path": investment_path,
        "net_worth_path": net_worth_path
    }

def run_simulation_core(income, fixed_expenses, loans_data, strategy_name, months=120):
    # Deep copy loans so simulations don't interfere
    loans = [Loan(l['name'], l['principal'], l['roi'], l['emi'], l.get('tenure', 0), l.get('months_left', 0)) for l in loans_data]
    
    monthly_income = float(income)
    monthly_fixed = float(fixed_expenses)
    
    debt_path = []
    investment_path = []
    cash_path = []
    
    total_invested = 0
    total_cash = 0
    equity_return = 0.10 / 12
    cash_return = 0.04 / 12
    
    debt_free_month = None
    
    for m in range(months):
        # 1. Cash Inflow
        available_cash = monthly_income - monthly_fixed
        
        # 2. Mandatory EMIs
        required_emi_total = sum(l.emi for l in loans if l.principal > 0)
        
        remaining_cash = available_cash - required_emi_total
        
        # 3. Strategy Allocation of Remaining Cash (Surplus)
        extra_debt_budget = 0
        invest_budget = 0
        cash_budget = 0
        
        if strategy_name == "Kill Debt First":
            active_loans = [l for l in loans if l.principal > 0]
            if active_loans:
                extra_debt_budget = max(0, remaining_cash)
            else:
                invest_budget = max(0, remaining_cash)
                if debt_free_month is None: debt_free_month = m
                
        elif strategy_name == "Wealth Builder":
            active_loans = [l for l in loans if l.principal > 0]
            if active_loans:
                 invest_budget = max(0, remaining_cash * 0.7)
                 cash_budget = max(0, remaining_cash * 0.3)
            else:
                 invest_budget = max(0, remaining_cash * 0.7)
                 cash_budget = max(0, remaining_cash * 0.3)
                 if debt_free_month is None: debt_free_month = m

        elif strategy_name == "Aggressive Growth":
             invest_budget = max(0, remaining_cash * 0.9)
             cash_budget = max(0, remaining_cash * 0.1)
             if not [l for l in loans if l.principal > 0] and debt_free_month is None:
                 debt_free_month = m

        elif strategy_name == "Baseline (Minimums Only)":
             cash_budget = max(0, remaining_cash)
             if not [l for l in loans if l.principal > 0] and debt_free_month is None:
                 debt_free_month = m

        # 4. Execute Loan Payments
        sorted_loans = sorted([l for l in loans if l.principal > 0], key=lambda x: x.roi, reverse=True)
        
        current_month_debt_balance = 0
        
        for loan in loans:
            if loan.principal <= 0: continue
            
            extra_for_this_loan = 0
            if sorted_loans and loan == sorted_loans[0]:
                extra_for_this_loan = extra_debt_budget
            
            p, i, reduced = loan.simulate_month(extra_for_this_loan)
            
            current_month_debt_balance += loan.principal
        
        debt_path.append(current_month_debt_balance)
        
        # 5. Investments & Cash Growth
        total_invested = total_invested * (1 + equity_return) + invest_budget
        total_cash = total_cash * (1 + cash_return) + cash_budget
        
        investment_path.append(total_invested)
        cash_path.append(total_cash)
        
    total_interest = sum(l.total_interest_paid for l in loans)
    
    return {
        "debt_path": debt_path,
        "investment_path": investment_path,
        "cash_path": cash_path,
        "total_interest": total_interest,
        "debt_free_month": debt_free_month,
        "final_net_worth": (total_invested + total_cash) - debt_path[-1]
    }
