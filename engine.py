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
