# 📄 DocFable-V2

DocFable-V2 is an AI-powered document analysis and studying platform. Simply upload a PDF research paper, article, or document, and instantly interact with it using modern AI models.

## ✨ Features
- 💬 **Interactive Chat:** Ask specific questions about your document and get answers cited from the text.
- 📝 **Smart Summaries:** Generate Executive, Beginner, Technical, or Bulleted summaries depending on your needs.
- 📇 **Study Flashcards:** Automatically generate interactive flip-cards to memorize key concepts.
- 🧠 **Quizzes:** Test your knowledge with AI-generated Multiple Choice (MCQ) or Short Answer quizzes.
- 💡 **Key Insights:** Instantly extract main contributions, limitations, key terminology, and statistics.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Python, FastAPI, Uvicorn
- **AI Integration:** OpenRouter API (Gemma, Nemotron) with automatic fallback to Google Gemini (Flash Lite). Includes a transparent fallback system to seamlessly handle free-tier rate limits.
- **PDF Parsing:** `pypdf` with a resilient fallback to `pdfminer.six`.

## 🚀 Getting Started

### 1. Start the Backend (FastAPI)
```bash
cd backend
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Open .env and add your OPENROUTER_API_KEY and GEMINI_API_KEY

# Start the server
uvicorn app.main:app --port 5000 --reload
```

### 2. Start the Frontend (React)
```bash
cd frontend
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

### 3. Open the App
Navigate to `http://localhost:5173` in your browser. Upload a PDF and start exploring!
