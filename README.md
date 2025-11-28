# Tuf-Tracker: AI-Powered DSA Learning Platform

<div align="center">

![Tuf-Tracker Banner](https://img.shields.io/badge/AI--Powered-DSA%20Tracker-blue?style=for-the-badge&logo=googlegemini)

**Your Intelligent DSA Learning Companion**

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)

</div>

---

## 🚀 Features

### 🤖 AI-Powered Learning
- **Automatic Problem Categorization**: Gemini AI analyzes your DSA problems and extracts topics, patterns, and difficulty
- **Personalized Insights**: Get AI-generated key takeaways, improvement suggestions, and revision hints
- **Weakness Detection**: AI scans your progress to identify weak areas and recommends focus topics
- **Flashcard Generation**: Convert problems into study flashcards automatically

### 📚 Smart Revision System
- **Adaptive Spaced Repetition**: Intelligent scheduling based on difficulty and your performance
- **Revision Queue**: Organized view of overdue, due today, and upcoming problems
- **Progress Tracking**: Monitor revision counts and improvement over time

### 📊 Analytics & Insights
- Dashboard with key statistics
- Topic and pattern distribution
- Weakness analysis and recommendations
- Learning path suggestions

### 🎨 Premium UI/UX
- Modern glassmorphism design
- Dark mode optimized
- Smooth animations with Framer Motion
- Fully responsive layout

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** - Fast, modern development
- **Firebase** - Authentication & Firestore database
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Beautiful animations
- **Axios** - HTTP client
- **React Router** - Navigation
- **Lucide React** - Modern icons

### Backend
- **Node.js** + **Express** - REST API server
- **Google Gemini AI** - Problem analysis & insights
- **Firebase Admin** - Server-side Firebase integration
- **CORS** - Cross-origin resource sharing

---

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher) installed
2. **Firebase Project** created
   - Enable Google Authentication
   - Enable Firestore Database
3. **Google AI Studio API Key** ([Get one here](https://makersuite.google.com/app/apikey))

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Tuf-Tracker
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file in `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Create `.env` file in `frontend/`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000
```

### 4. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Google Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google provider
4. Create **Firestore Database**:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)

**Firestore Security Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Questions collection
    match /questions/{questionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

---

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📱 Usage Guide

### 1. Sign In
- Click "Continue with Google" on the login page
- Authorize with your Google account

### 2. Add a Problem
- Navigate to "Add Problem"
- Fill in:
  - Problem title
  - URL (optional)
  - Problem description
  - Your notes and approach
- Click "Save & Analyze with AI"
- View AI-generated insights

### 3. Revision Queue
- Check "Revision Queue" for problems due for review
- Problems are categorized as:
  - **Overdue** - Past due date
  - **Due Today** - Scheduled for today
  - **Upcoming** - Future revisions
- Click "Mark Revised" when you complete a revision

### 4. Dashboard
- View your statistics
  - Total problems solved
  - Problems added this week
  - Problems due today
  - Current streak

---

## 🔥 Firebase Deployment

### Deploy Frontend to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in the project:
```bash
cd frontend
firebase init
```

Select:
- Hosting
- Use existing project
- Public directory: `dist`
- Single-page app: `Yes`
- GitHub actions: `No` (or `Yes` for CI/CD)

4. Build and deploy:
```bash
npm run build
firebase deploy
```

### Deploy Backend to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd backend
vercel
```

3. Set environment variables in Vercel dashboard:
- `GEMINI_API_KEY`
- `PORT`
- `CORS_ORIGIN` (your Firebase hosting URL)

4. Update frontend `.env`:
```env
VITE_API_URL=https://your-backend-url.vercel.app
```

---

## 📚 API Endpoints

### AI Endpoints

#### Analyze Problem
```http
POST /api/ai/analyze-problem
Content-Type: application/json

{
  "title": "Two Sum",
  "url": "https://leetcode.com/problems/two-sum/",
  "description": "Given an array...",
  "userNotes": "Used hash map approach..."
}
```

#### Revision Feedback
```http
POST /api/ai/revision-feedback
Content-Type: application/json

{
  "title": "Two Sum",
  "topic": "Arrays",
  "pattern": "Hash Map",
  "revisionCount": 2,
  "currentNotes": "Solved again, faster this time..."
}
```

#### Analyze Weaknesses
```http
POST /api/ai/analyze-weaknesses
Content-Type: application/json

{
  "problems": [...]
}
```

#### Generate Flashcards
```http
POST /api/ai/generate-flashcards
Content-Type: application/json

{
  "problem": {...}
}
```

---

## 🗂️ Project Structure

```
Tuf-Tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── gemini.config.js
│   │   ├── controllers/
│   │   │   └── aiController.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   └── ai.routes.js
│   │   ├── services/
│   │   │   ├── geminiService.js
│   │   │   └── revisionCalculator.js
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── ProtectedRoute.jsx
    │   │   ├── layout/
    │   │   │   └── Navbar.jsx
    │   │   └── problems/
    │   │       └── ProblemEntryForm.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── AddProblemPage.jsx
    │   │   ├── RevisionQueuePage.jsx
    │   │   └── AnalyticsPage.jsx
    │   ├── utils/
    │   │   ├── firebaseConfig.js
    │   │   └── aiService.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── firebase.json
    ├── tailwind.config.js
    └── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Striver's TUF+** for DSA learning inspiration
- **Google Gemini AI** for intelligent problem analysis
- **Firebase** for backend infrastructure
- **React & Vite** for amazing developer experience

---

<div align="center">

**Built with ❤️ for DSA learners**

[Report Bug](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues)

</div>
