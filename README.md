# Capital Allocator

A financial simulation tool for debt payoff and wealth building strategies.

## Running Locally
1. Install dependencies: `pip install -r requirements.txt`
2. Run server: `python3 app.py`
3. Open `http://localhost:5000`

## How to Deploy (Render.com) - Free
This projects is setup for easy deployment on Render.

1. **Push to GitHub**:
   - Create a repo on GitHub.
   - Initialise git: `git init`, `git add .`, `git commit -m "Initial config"`.
   - Push your code.

2. **Deploy on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repo.
   - **Build Command**: `pip install -r requirements.txt` (Default)
   - **Start Command**: `gunicorn app:app` (It might auto-detect this from `Procfile`)
   - Click **Deploy**.

That's it! You'll get a URL like `capital-allocator.onrender.com` to share with friends.
