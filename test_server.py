import unittest
import json
from app import app

class TestFinancialEngine(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_debt_reduction(self):
        # Scenario: 100k Loan, 10% ROI, 2000 EMI
        # Interest/mo = 100k * 0.10/12 = 833.33
        # Principal/mo = 2000 - 833.33 = 1166.67
        # Balance after 1 mo should be ~98833.33
        
        payload = {
            "income": 5000,
            "fixed_expenses": 1000,
            "loans": [
                {
                    "name": "Test Loan",
                    "principal": 100000,
                    "roi": 10,
                    "emi": 2000
                }
            ]
        }
        
        response = self.app.post('/api/simulate', 
                                 data=json.dumps(payload),
                                 content_type='application/json')
        
        data = response.get_json()
        
        # Check Kill Debt First results
        res = data["Kill Debt First"]
        debt_path = res["debt_path"]
        
        # Initial Debt
        # Our simulation loop starts processing month 1.
        # month 0 in array should be balance AFTER month 1 payment?
        # looking at code: `for _ in range(months): bal... debt_path.append`
        # yes, index 0 is Month 1 end balance.
        
        balance_m1 = debt_path[0]
        expected_bal = 100000 - (2000 - (100000 * 0.10 / 12))
        
        # We also have "Extra Debt Payment" in Kill Debt First.
        # Free Capital = 5000 - 1000 - 2000 (EMI) = 2000.
        # So total payment = 2000 (EMI) + 2000 (Extra) = 4000.
        # Principal Red = 4000 - 833.33 = 3166.67
        # Expected Bal = 96833.33
        
        print(f"Computed Balance M1: {balance_m1}")
        
        # Allow small float diffs
        self.assertTrue(96830 < balance_m1 < 96840, f"Balance M1 {balance_m1} not matching expected ~96833")
        
        # Check Payoff
        # With 4000/mo on 100k, payoff should be ~27-28 months.
        # Check if debt is 0 by month 30
        self.assertTrue(debt_path[30] == 0, "Debt should be cleared by month 30")

if __name__ == '__main__':
    unittest.main()
