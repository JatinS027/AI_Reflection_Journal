# AI Reflection Journal — User-Authenticated Gemini & Firestore Application

A full-stack, user-authenticated journaling and reflection platform built with **React**, **Google Gemini API**, and **Cloud Firestore**, designed for complete owner-bound privacy, multi-turn AI reframing, and automated synthesis.

---

## 🌟 Key Features

1. **Passwordless Federated Authentication**: Secure Google Sign-In via Firebase Auth; zero passwords or plaintext credentials stored.
2. **Strict User-Bound Data Isolation**: All journal reflections, transcripts, and AI summaries are persisted exclusively under `/users/{userId}/interactions/{interactionId}` protected by deployed Firestore Security Rules.
3. **Multi-Turn Gemini Reflections**: Empathetic conversational partner using Gemini with a resilient model fallback ladder (`gemini-3.1-flash-lite` → `gemini-3.7-flash` → `gemini-flash-latest` → `gemini-3.6-flash`).
4. **Actionable AI Syntheses**: One-click extraction of executive summaries, mindset patterns, and suggested micro-actions.
5. **Private Archive & Search**: Filter, search, read, and export journal entries as Markdown files.
6. **Zero-Hardcoding Hygiene**: Server-side proxy for Gemini API keys with Google Cloud Secret Manager compatibility.

---

## 🔒 Security Architecture & Firestore Rules

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Google Cloud Run Deployment Guide

### 1. Prerequisites & GCP APIs Setup
Ensure the Google Cloud SDK (`gcloud`) is installed and authenticated:
```bash
# Set your active GCP project ID
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="asia-southeast1" # or us-central1
gcloud config set project $PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

### 2. Secret Management Setup (Gemini API Key)
Create and store the Gemini API key in Google Cloud Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Retrieve your project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### 3. Deploy to Cloud Run
Build and deploy the application to Cloud Run with the Secret Manager binding:

```bash
# Deploy to Google Cloud Run
gcloud run deploy ai-reflection-journal \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

---

### 4. Apply Mandatory Verification Label
Apply the required campaign label to register the service for automated challenge verification:

```bash
gcloud run services update ai-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 🧪 Functional Walkthrough & Test Cases

The application includes an in-app **Test Cases** explorer covering:
- **TC-AUTH-01**: Google Federated Sign-In flow & private dashboard redirection.
- **TC-AUTH-02**: Sign-Out & session state clearance.
- **TC-JOURNAL-01**: Dynamic Gemini prompt inspirations and initial reflection submission.
- **TC-AI-01**: Multi-turn conversational reframing dialogue.
- **TC-AI-02**: Executive summary, key takeaways, and action items generation.
- **TC-ARCHIVE-01**: Archive filtering, real-time keyword search, and Markdown export.
- **TC-ARCHIVE-02**: Entry deletion with safety confirmation dialog.
- **TC-SEC-01**: Owner-bound Firestore rule enforcement and zero secret leakage.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run full-stack dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
