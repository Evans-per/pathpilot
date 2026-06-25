# PathPilot – AI Learning Roadmap Generator

PathPilot is a production-quality, full-stack AI-powered learning platform that generates personalized learning roadmaps and recommends YouTube videos based on user interests, deadline, current level, and available study hours.

---

## 🚀 Key Features

1. **Authentication**: JWT-based secure auth, session tracking for active connections, password recovery with pre-filled mock testing codes, and onboarding state enforcement.
2. **AI-Powered Onboarding**: Dynamic questionnaire detailing interests, levels, study budgets, styles, and existing skills to generate a roadmap.
3. **Structured Timelines**: Weekly modules mapping goals, specific lessons, concepts, hands-on tasks, and mini-projects.
4. **Scored YouTube Curation**: Gathers courses matching topics, filters out short clips (<15m), and ranks them using:
   $$\text{Score} = (\text{Views} \times 0.40) + (\text{Likes} \times 0.30) + (\text{Recentness} \times 0.20) + (\text{Channel Quality} \times 0.10)$$
5. **Daily Scheduler**: Maps active week uncompleted tasks to Session A & Session B slots.
6. **Gamified Progress**: Earn XP for completions, maintain study streaks, unlock achievement badges, and climb global leaderboards.
7. **AI Assistant**: A floating chatbot with roadmap context to answer queries and debug code.
8. **PDF Exporter**: Uses canvas conversions and PDF templates to export study timelines.
9. **Dark Mode Toggle**: Sleek HSL dark mode palettes persisted in localStorage.

---

## 📂 Project Structure

```text
pathpilot/
├── backend/
│   ├── config/             # Database connection configuration
│   ├── controllers/        # Route controllers (Auth, Roadmap, Videos, Planner, Dashboard, Chat)
│   ├── middleware/         # Custom Middlewares (JWT Authentication, Error handlers, Rate limiters)
│   ├── models/             # Mongoose schemas (User, Roadmap, Video cache, Progress, Session)
│   ├── routes/             # Express routing wires
│   ├── services/           # External APIs (OpenAI GPT, YouTube Data API v3, Daily Scheduler)
│   ├── utils/              # Standing verification test suites
│   ├── server.js           # Express app entry point
│   ├── .env.example        # Environment variables template
│   └── package.json        # Backend dependencies
│
└── frontend/
    ├── src/
    │   ├── components/     # Layout & Floating elements (Navbar, Sidebar, Chatbot, ProtectedRoute)
    │   ├── context/        # React context wrappers (AuthContext, ThemeContext)
    │   ├── pages/          # Pages (Landing, Auth, Onboarding, Dashboard, Roadmap, Videos, Planner, Settings, Leaderboard)
    │   ├── services/       # Axios API client
    │   ├── App.jsx         # App router config
    │   ├── index.css       # Global styles & glassmorphism
    │   └── main.jsx        # App entry bootstrapper
    ├── tailwind.config.js  # Tailwind CSS configurations
    ├── postcss.config.js   # CSS processing config
    ├── vite.config.js      # Vite and API proxy settings
    └── package.json        # Frontend dependencies
```

---

## ⚙️ Environment Variables

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pathpilot
JWT_SECRET=your_jwt_secret_key_change_me_in_production
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE
```

*Note: If `OPENAI_API_KEY` or `YOUTUBE_API_KEY` are not set, the platform will automatically run in Mock Fallback Mode, supplying high-quality simulated data so you can test all features offline out-of-the-box.*

---

## 🛠️ Installation & Setup

Ensure you have **Node.js (v18+)** and **MongoDB** installed and running on your system.

### 1. Set Up Backend

```bash
cd backend
# Install packages
npm install

# (Optional) Verify service algorithms in standalone mode
node utils/testApis.js

# Start backend server
npm start
```
*The backend will listen on port `5000`.*

### 2. Set Up Frontend

```bash
cd ../frontend
# Install packages
npm install

# Start Vite React server
npm run dev
```
*The frontend dev server will start on port `3000`.*

---

## 🧪 Testing Account Flow

1. Access the web portal at `http://localhost:3000`.
2. Navigate to **Signup** and register a test user.
3. Fill in the **Onboarding Questionnaire** (Interest, Level, Deadline, Daily hours, style).
4. Watch the AI generate your custom weekly timeline roadmap!
5. Navigate to the **Timeline** to view weeks and click **Watch lectures** to load scored courses.
6. Open **Daily Planner** to choose study slots, check off tasks, and see your streak update on the **Dashboard** and **Leaderboard**.

---

## 🌐 Production Deployment Steps

### 1. Database (MongoDB Atlas)
- Create a free cluster on MongoDB Atlas.
- In Database Access, create a database user and copy the connection string.
- Paste the connection string as `MONGO_URI` in your backend environment variables.

### 2. Backend (Render.com)
- Create a new Web Service on Render.
- Link your GitHub repository.
- Set Build Command to `npm install` (or custom build steps).
- Set Start Command to `npm start`.
- Under Environment, add all keys from `backend/.env`.
- Copy your deployed service URL (e.g. `https://pathpilot-api.onrender.com`).

### 3. Frontend (Vercel)
- Create a new project on Vercel.
- Link your GitHub repository.
- Configure Root Directory to `frontend`.
- Set Build Command to `npm run build`.
- Add Environment Variable: `VITE_API_URL` set to your Render backend URL (e.g. `https://pathpilot-api.onrender.com`).
- Click Deploy!
