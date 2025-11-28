# Firestore Security Rules Setup

## 🔒 Update Your Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **taskease-t2uny**
3. Click **Firestore Database** in the left menu
4. Click the **Rules** tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Questions collection - users can only access their own questions
    match /questions/{questionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Daily logs collection - users can only access their own logs
    match /dailyLogs/{logId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // AI feedback cache - users can only access their own cached feedback
    match /aiFeedbackCache/{cacheId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

6. Click **Publish** to save the rules

## ✅ After Publishing

Refresh your browser at `http://localhost:5173` and the permission errors should be gone!

---

## 🎯 What These Rules Do

- **Authenticated users only**: All operations require a logged-in user
- **User isolation**: Each user can only access their own data (based on `userId` field)
- **Secure by default**: No public read/write access

---

## 🚀 You're Almost There!

Once you publish these rules, your Tuf-Tracker will be fully functional and you can:
- ✅ Add DSA problems
- ✅ Get AI analysis
- ✅ Track revisions
- ✅ View your dashboard
