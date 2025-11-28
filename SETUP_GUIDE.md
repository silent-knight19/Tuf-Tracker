# 🚀 Quick Start Guide

## Getting Your API Keys

### 1. Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"  
3. Create a new project or use existing
4. Copy the API key
5. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it (e.g., "tuf-tracker")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 3. Enable Firebase Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Go to **Sign-in method** tab
4. Click on **Google**
5. Toggle **Enable**
6. Add support email
7. Click **Save**

### 4. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create Database"
3. Select **Start in production mode**
4. Choose a location (e.g., us-central)
5. Click "Enable"

6. Set up Security Rules:
   - Click **Rules** tab
   - Replace with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /questions/{questionId} {
         allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
         allow create: if request.auth != null;
       }
     }
   }
   ```
   - Click **Publish**

### 5. Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web** icon (`</>`)
4. Register app (name: "Tuf-Tracker")
5. Copy the config values:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

6. Add to `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=your_apiKey
VITE_FIREBASE_AUTH_DOMAIN=your_authDomain
VITE_FIREBASE_PROJECT_ID=your_projectId
VITE_FIREBASE_STORAGE_BUCKET=your_storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messagingSenderId
VITE_FIREBASE_APP_ID=your_appId
VITE_API_URL=http://localhost:5000
```

## Running the App

### Terminal 1 - Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your keys
npm install
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env with your Firebase config
npm install
npm run dev
```

Visit: `http://localhost:5173`

## Troubleshooting

### Gemini  API Errors
- Verify your API key is correct
- Check quota limits in AI Studio console
- Ensure billing is enabled if required

### Firebase Auth Errors
- Verify Google sign-in is enabled
- Check authorized domains in Firebase Console
- Clear browser cache and cookies

### CORS Errors
- Ensure backend CORS_ORIGIN matches frontend URL
- Check that backend is running on port 5000

### Firestore Permission Errors
- Verify security rules are published
- Check user is authenticated
- Ensure userId matches in documents

---

**Need Help?** Check the main [README.md](./README.md) for detailed documentation.
