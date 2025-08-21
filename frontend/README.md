# Securin Recipes App

This is the assignment project.  
It has a **backend (Node.js + Express + MongoDB)** and a **frontend (React + Vite + TailwindCSS)**.

---

## How to Run

### Backend
1. Open terminal:
   ```bash
   cd backend
   npm install
   npm run dev
Runs at: http://localhost:4000/api


Frontend:

Open another terminal:
  cd frontend
  npm install
  npm run dev
Runs at: http://localhost:5173

API Endpoints:

GET /api/recipes?page=1&limit=15 → Get list of recipes

GET /api/recipes/search?... → Search with filters

GET /api/recipes/cuisines → List cuisines

Features Done:

✅ Show recipes in grid (title, cuisine, rating, time, serves)
✅ Click recipe → drawer with details (description, time, nutrition)
✅ Search filters (title, cuisine, calories, rating, time)
✅ Pagination (15, 25, 50)
✅ “No results” message fallback

API Testing Example:
  curl http://localhost:4000/api/recipes?page=1&limit=5
