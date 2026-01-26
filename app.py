from flask import Flask, request, jsonify, send_file, abort
from engine import run_simulation_core, run_custom_simulation
import os

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def home():
    return send_file('index.html')

@app.route('/dashboard.html')
def dashboard():
    return send_file('dashboard.html')

# Secure Static File Serving
# Only allow specific extensions to prevent directory traversal or source leakage
ALLOWED_EXTENSIONS = {'.html', '.css', '.js', '.png', '.jpg', '.ico', '.svg'}

@app.route('/<path:path>')
def static_files(path):
    # Security Check
    _, ext = os.path.splitext(path)
    if ext.lower() not in ALLOWED_EXTENSIONS:
        return abort(403) # Forbidden
        
    if '..' in path or path.startswith('/'):
        return abort(403)
        
    return send_file(path)

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.json
    income = data.get('income', 0)
    loans_data = data.get('loans', [])
    fixed_expenses = data.get('fixed_expenses', 0)
    
    # Validation
    if not isinstance(income, (int, float)) or income < 0:
        return jsonify({"error": "Invalid income"}), 400
    if not isinstance(loans_data, list):
         return jsonify({"error": "Loans must be a list"}), 400

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

@app.route('/api/recalculate', methods=['POST'])
def recalculate():
    """
    New Endpoint for Dashboard interactivity.
    Takes explicit allocations and runs the secure Python engine.
    """
    data = request.json
    loans_data = data.get('loans', [])
    allocations = data.get('allocations', {})
    
    # Validate
    if not isinstance(loans_data, list):
         return jsonify({"error": "Loans must be a list"}), 400
         
    results = run_custom_simulation(loans_data, allocations)
    return jsonify(results)

if __name__ == '__main__':
    print("Starting Flask server on port 5000...")
    app.run(port=5000, debug=True)
