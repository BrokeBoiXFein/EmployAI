# Deployment Guide

Follow these steps to deploy your application.

## 1. Deploy the Backend (to Render)

1.  Create a free account on [Render](https://render.com/).
2.  Connect your GitHub repository.
3.  Select **"Web Service"** and connect your repo.
4.  Set the following configuration:
    *   **Build Command**: `cd backend && npm install`
    *   **Start Command**: `cd backend && node server.js`
5.  Add **Environment Variables**:
    *   `GEMINI_API_KEY`: Your Google Gemini API Key.
    *   `ADZUNA_APP_ID`: Your Adzuna App ID.
    *   `ADZUNA_API_KEY`: Your Adzuna API Key.
    *   `PORT`: `5000` (optional, Render sets this automatically).
6.  Once deployed, copy the **onrender.com** URL.

## 2. Deploy the Frontend (to GitHub Pages)

1.  In your local `frontend/src/App.jsx`, ensure you've committed the changes that use `import.meta.env.VITE_API_URL`.
2.  In the `frontend` directory, run:
    ```powershell
    npm run deploy
    ```
3.  Go to your GitHub repo's **Settings > Pages** and ensure the source is set to the `gh-pages` branch.
4.  If you want to use the production backend URL on GitHub Pages, you can either:
    *   Set a GitHub Secret/Variable for the build.
    *   Or, manually update the fallback in `App.jsx` before deploying.

> [!IMPORTANT]
> To use the production backend on GitHub Pages, you should run the deploy command with the environment variable:
> `$env:VITE_API_URL="https://your-backend.onrender.com"; npm run deploy` (Windows PowerShell)
