# IronForge Gym Management System 🏋️‍♂️

A real, modern full-stack Gym Management System built with **React**, **Node.js / Express**, and **MongoDB / Mongoose**.

---

## 📌 Project Overview

**IronForge** is designed as a premier fitness center web application and gym management platform. It features an athletic, high-energy dark design system, seamless frontend-backend communication, robust error handling, and a modular architecture structured for college-level evaluation and real-world scalability.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite SPA), HTML5, CSS3 Custom Properties (Design System), JavaScript (ESNext), Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Styling** | Vanilla CSS with Modular Design Tokens & Responsive Glassmorphism |
| **Networking** | REST APIs, CORS, Cookie-Parser, Fetch API |

---

## 📂 Project Structure

```text
C:\gym_site\
├── package.json                 # Project runner scripts
├── .gitignore                   # Ignore rules
├── README.md                    # Project documentation
│
├── server/                      # Express & Node.js Backend
│   ├── .env                     # Local environment variables
│   ├── .env.example             # Template environment variables
│   ├── package.json
│   ├── data/                    # MongoDB data files (gitignored)
│   └── src/
│       ├── config/
│       │   └── db.js            # MongoDB Mongoose connection
│       ├── controllers/
│       │   └── healthController.js # API health controller
│       ├── middleware/
│       │   ├── errorHandler.js   # Centralized error handler
│       │   └── notFoundHandler.js# 404 handler
│       ├── routes/
│       │   ├── index.js         # Main API router
│       │   └── healthRoutes.js  # /api/health endpoint
│       ├── utils/
│       │   └── apiResponse.js   # Standardized JSON response helpers
│       ├── app.js               # Express application configuration
│       └── server.js            # Server entrypoint
│
└── client/                      # React Frontend (Vite)
    ├── index.html               # HTML entry with Google Fonts
    ├── vite.config.js           # Vite configuration & backend proxy
    ├── package.json
    └── src/
        ├── assets/              # Icons & static assets
        ├── components/
        │   ├── common/
        │   │   ├── Button.jsx   # Primary, Secondary, Outline, Ghost buttons
        │   │   ├── Card.jsx     # Modern card container with subtle borders & glow
        │   │   └── Badge.jsx    # Status & feature tag badges
        │   └── layout/
        │       ├── Navbar.jsx   # Responsive glassmorphism navbar & live API status
        │       └── Footer.jsx   # Full gym footer with links, hours, contact info
        ├── pages/
        │   └── landing/
        │       ├── LandingPage.jsx  # Landing page coordinator
        │       ├── LandingPage.css  # Landing page styling
        │       └── sections/
        │           ├── HeroSection.jsx        # Headline, CTAs, live stats, athletic card
        │           ├── AboutSection.jsx       # Gym philosophy & highlight metrics
        │           ├── FeaturesSection.jsx    # 4 Core pillars (Trainers, Workouts, Plans, Tracking)
        │           ├── MembershipsSection.jsx # 3 Tier plans (Basic, Standard, Premium)
        │           ├── TrainersSection.jsx    # Coach showcase with bios & ratings
        │           ├── WhyChooseUsSection.jsx # 6-point differentiator grid
        │           ├── TestimonialsSection.jsx# Member stories with 5-star reviews
        │           └── CtaSection.jsx         # 3-Day VIP trial conversion banner
        ├── services/
        │   └── api.js           # Fetch API service
        ├── styles/
        │   ├── variables.css    # Colors, fonts, spacing, shadows tokens
        │   ├── reset.css        # Modern CSS reset
        │   ├── typography.css   # Typography & gradient text rules
        │   └── global.css       # Utility classes & animations
        ├── App.jsx              # Main App component with routing
        └── main.jsx             # React DOM entry point
```

---

## 🚀 How to Run the Application

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **MongoDB** (Local instance or MongoDB Atlas URI)

---

### Step 1: Start MongoDB

Ensure MongoDB is running locally on port `27017` or configure `MONGODB_URI` in `server/.env`.
```powershell
mongod --dbpath "C:\gym_site\server\data\db" --port 27017
```

---

### Step 2: Run the Backend Server

```powershell
cd C:\gym_site\server
npm install
npm run dev
```
* Backend will be accessible at: `http://localhost:5000`
* Health Check Endpoint: `http://localhost:5000/api/health`

---

### Step 3: Run the React Frontend

Open a second terminal window:
```powershell
cd C:\gym_site\client
npm install
npm run dev
```
* Frontend will be accessible at: `http://localhost:5173`

---

## 🌟 Implemented Features (Phase 1 & Phase 2)

1. **Backend Foundation**:
   - Express server with modular architecture.
   - Robust Mongoose database connection with connection state reporting.
   - Centralized error handling and standardized JSON responses.
   - Health-check API endpoint (`/api/health`).
   - CORS and Cookie-parser middleware configured.

2. **Frontend Foundation & Design System**:
   - Pure React 18 SPA built with Vite.
   - Custom athletic dark theme design system (`variables.css`, `global.css`).
   - Reusable `Button`, `Card`, and `Badge` components with hover states.
   - Live backend status indicator integrated directly into the Navbar.

3. **Complete Responsive Landing Page**:
   - **Hero Section**: Impactful "Train Strong. Live Stronger." headline, dynamic stat pills, primary/secondary CTAs, and athletic showcase card.
   - **About Section**: Gym story, 18,000 sq. ft. facility highlights, and 3 core pillars.
   - **Features Section**: 4 primary benefits (Expert Trainers, Personalized Workouts, Flexible Memberships, Progress Tracking).
   - **Memberships Preview**: 3 transparent tiers (Basic, Standard, Premium Elite) with monthly/annual toggle.
   - **Trainers Showcase**: Certified coach cards with certifications, experience, ratings, and specialties.
   - **Why Choose Us**: 6-point advantage grid (Pristine Hygiene, 24/7 Access, Infrared Recovery, Calibrated Gear, etc.).
   - **Testimonials**: Authentic member transformation stories and 5-star ratings.
   - **Call-to-Action Banner**: 3-day VIP trial pass claim with instant feedback.
   - **Footer**: Full contact info, operating hours, quick links, and college project credits.

---

## 📋 Next Phases Roadmap

- **Phase 3**: Authentication & Authorization (Register, Login, Logout, JWT with HTTP-only cookies, Protected Routes, Role Management for Admin, Trainer, Member).
- **Phase 4**: Database Models & RESTful APIs (Users, Members, Trainers, Memberships, Payments, Workout Plans).
- **Phase 5**: Dashboards (Admin, Trainer, Member).
- **Phase 6**: Management CRUD & Workflows (Member Assignment, Workout Scheduling, Fee Records).
- **Phase 7 & 8**: Seed sample data, validation hardening, polish, and final evaluation docs.
