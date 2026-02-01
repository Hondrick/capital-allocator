# Capital Allocator (AI-Powered)

A financial simulation tool that combines deterministic math with agentic AI. It features a "Ruthless CFO" agent that analyzes your financial projections and provides strategic advice.

## 🚀 Features
- **Deterministic Engine:** Python-based simulation for debt payoffs.
- **Agentic AI:** A "Ruthless CFO" agent (powered by Groq/Llama-3) that critiques your strategy.
- **Interactive Dashboard:** Real-time charts to visualize Net Worth.

## 🛠 Prerequisites
- **Python 3.10, 3.11, or 3.12** (Python 3.14 is NOT supported).
- **Groq API Key** (Free from console.groq.com).

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd "capital allocator"
   ```

2. **Set up Virtual Environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Secrets:**
   Create a `.env` file in the root folder:
   ```text
   GROQ_API_KEY=gsk_your_actual_api_key_here
   ```

## ▶️ Running Locally
Start the Flask server:
```bash
python3 app.py
```
Open your browser to: `http://localhost:5000`

## 🤖 AI Agents
- **Ruthless CFO:** Analyzes simulation JSON data to find inefficiencies in debt payment vs. investment allocation.
