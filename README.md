
StudyPilot is an intelligent study planner and academic management platform. It uses AI to extract syllabus content from documents (PDFs, Images, Docx), generates customized study plans, and features an interactive frontend dashboard for seamless schedule tracking and productivity visualization.

## Key Features

* **Intelligent Study Planner Engine**: Generates adaptive study plans and supports replanning based on user progress.
* **Syllabus & OCR Pipeline**: Upload your course syllabus via PDF, Docx, or images. The backend utilizes PyTesseract and PyPDF with AI extraction to parse out key dates, topics, and assignments.
* **Retrieval-Augmented Generation (RAG)**: Integrates vector search (ChromaDB + OpenAI) for advanced contextual recommendations and querying of your study materials.
* **Interactive Dashboard**: Modern UI with a calendar view (FullCalendar), progress heatmaps, and productivity charts (Recharts).
* **Automated Reminders**: Built-in background scheduler to send notifications for upcoming study sessions.

## Tech Stack

### Frontend (User Interface)
* **Framework**: React 18, Vite, TypeScript
* **Styling**: Tailwind CSS, Radix UI Primitives, Lucide Icons
* **State Management**: Zustand
* **Components**: FullCalendar (Schedule), Recharts (Data Visualization), React Calendar Heatmap
* **Data Fetching**: Axios

### Backend (API & AI Pipeline)
* **Framework**: FastAPI (Python 3.9+)
* **Database**: PostgreSQL (with SQLAlchemy ORM and Alembic for migrations)
* **AI & RAG**: OpenAI API, ChromaDB, Sentence Transformers
* **Document Parsing**: PyPDF, python-docx, PyTesseract (OCR), Pillow
* **Task Scheduling**: APScheduler
* **Security & Auth**: Python-JOSE, Passlib (bcrypt)

## Project Structure

```text
Team-BinaryBeast---Dishant/
├── apps/
│   └── api/                # FastAPI Backend Application
│       ├── alembic/        # Database Migrations
│       ├── app/            # Main application code (routers, models, schemas)
│       ├── scripts/        # Utility scripts
│       ├── tests/          # Backend tests
│       └── requirements.txt# Python dependencies
└── frontend/               # React + Vite Frontend Application
    ├── public/             # Static assets
    ├── src/                # Frontend source code (components, api, store)
    └── package.json        # Node.js dependencies
```

## 🏁 Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.9+)
* PostgreSQL
* Tesseract OCR (for image syllabus extraction)

### Backend Setup

1. **Navigate to the API directory:**
   ```bash
   cd apps/api
   ```
2. **Create a virtual environment and activate it:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables:**
   Copy `.env.example` to `.env` and configure your database URL, OpenAI API key, and JWT secrets.
   ```bash
   cp .env.example .env
   ```
5. **Run Migrations (if applicable):**
   ```bash
   alembic upgrade head
   ```
6. **Start the API server:**
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Create a `.env.local` file and add your backend API URL (e.g., `VITE_API_URL=http://localhost:8000`).
4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Roadmap / Upcoming Features
- **Phase 1**: API Enhancements & Complete Auth Flow (Refresh tokens, profile updates).
- **Phase 2**: Production Planner Engine with adaptive replanning based on feedback.
- **Phase 3**: Robust Syllabus & OCR Pipeline with async processing for large documents.
- **Phase 4**: Notifications & Scheduler for study session reminders.
- **Phase 5**: Full RAG/Vector Storage integration with planner recommendations.
- **Phase 6**: Production Infrastructure (Seed data scripts, comprehensive unit/integration tests).

---
