from flask import Flask, request, jsonify, send_file
from engine import run_simulation_core

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def home():
    return send_file('index.html')

@app.route('/dashboard.html')
def dashboard():
    return send_file('dashboard.html')

@app.route('/financial-engine.js')
def engine_js():
    return send_file('financial-engine.js')

# Serve other static files if needed (css/js)
@app.route('/<path:path>')
def static_files(path):
    return send_file(path)

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.json
    income = data.get('income', 0)
    fixed_expenses = data.get('fixed_expenses', 0) 
    loans_data = data.get('loans', [])
    
    # Run Baseline first to compare
    baseline = run_simulation_core(income, fixed_expenses, loans_data, "Baseline (Minimums Only)")
    
    strategies = ["Kill Debt First", "Wealth Builder", "Aggressive Growth"]
    results = {}
    
    for strat in strategies:
        res = run_simulation_core(income, fixed_expenses, loans_data, strat)
        
        # Calculate Savings vs Baseline
        res["interest_saved"] = baseline["total_interest"] - res["total_interest"]
        
        # Time Saved
        base_time = baseline["debt_free_month"] if baseline["debt_free_month"] is not None else 120
        strat_time = res["debt_free_month"] if res["debt_free_month"] is not None else 120
        
        res["months_saved"] = max(0, base_time - strat_time)
        res["debt_free_date_str"] = f"Month {strat_time}" if strat_time < 120 else "After 10 Years"
        
        results[strat] = res

    return jsonify(results)

if __name__ == '__main__':
    print("Starting Flask server on port 5000...")
    app.run(port=5000, debug=True)
