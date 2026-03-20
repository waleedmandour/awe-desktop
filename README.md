# AWE System - Automated Writing Evaluation

A Multimodal, LLM-based Automated Writing Evaluation (AWE) System for Formative Assessment

**For Foundation and Post-Foundation Year Students At Sultan Qaboos University**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Dual-Track System](#dual-track-system)
  - [Track 1: Cloud-Based PWA](#track-1-cloud-based-pwa)
  - [Track 2: Windows Desktop App](#track-2-windows-desktop-app)
- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Supported Courses](#supported-courses)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Privacy & Security](#privacy--security)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
- [License](#license)

---

## 🎯 Overview

AWE System is an AI-powered essay assessment platform that enables students to:
- Upload photos of handwritten essays
- Extract text using OCR technology
- Receive AI-powered assessment based on IELTS criteria
- Get constructive feedback to improve their writing

---

## 🔄 Dual-Track System

### Track 1: Cloud-Based PWA

A Progressive Web App hosted on Vercel that uses cloud APIs for processing.

**Features:**
- ✅ Google Gemini API for AI assessment
- ✅ Google Vision API for OCR
- ✅ Works on any device with a browser
- ✅ Installable on iOS and Android
- ✅ Requires internet connection

**Best for:**
- Students with reliable internet access
- Quick assessments on mobile devices
- Users who prefer cloud-based solutions

**Live Demo:** [https://awe-system-xhwc-git-main-waleedmandours-projects.vercel.app/](https://awe-system-xhwc-git-main-waleedmandours-projects.vercel.app/)

---

### Track 2: Windows Desktop App

A native Windows application that runs entirely locally with offline support.

**Features:**
- ✅ Local LLM support (Ollama, LM Studio, custom)
- ✅ Offline OCR (Tesseract, PaddleOCR, EasyOCR)
- ✅ No internet required after setup
- ✅ Full privacy - data never leaves your computer
- ✅ System requirements checker
- ✅ Microsoft Store ready

**Best for:**
- Users with privacy concerns
- Offline environments
- Institutions with local LLM infrastructure
- Users with powerful GPUs

---

## 🚀 Quick Start

### Track 1 (PWA)

```bash
# Clone the repository
git clone https://github.com/waleedmandour/awe-system.git
cd awe-system

# Install dependencies
bun install

# Setup database
bun run db:push

# Run development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Track 2 (Desktop)

```bash
# Navigate to desktop app
cd awe-system/desktop-app

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r python-backend/requirements.txt

# Run in development mode
npm run dev
```

---

## 💻 System Requirements

### Track 1 (PWA - Cloud)

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Browser | Chrome 90+, Safari 14+ | Latest version |
| Internet | Required | Stable connection |
| Device | Any smartphone/tablet/PC | Modern smartphone |

### Track 2 (Desktop - Local LLM)

| Requirement | Minimum | Recommended | Optimal |
|-------------|---------|-------------|---------|
| OS | Windows 10 64-bit | Windows 11 | Windows 11 |
| CPU | 4 cores | 8 cores | 12+ cores |
| RAM | 8 GB | 16 GB | 32+ GB |
| Storage | 15 GB free | 30 GB free | 50+ GB free |
| GPU | Optional | NVIDIA 6GB VRAM | NVIDIA 12GB+ VRAM |

**LLM Model Recommendations by Hardware:**

| Hardware Tier | RAM | GPU VRAM | Recommended Models |
|---------------|-----|----------|-------------------|
| Entry | 8GB | None | llama3.2:1b, phi3:mini |
| Standard | 16GB | 4GB | llama3.2:3b, mistral:7b |
| Performance | 32GB | 8GB | llama3.1:8b, qwen2.5:14b |
| Professional | 64GB | 12GB+ | llama3.1:70b, mixtral:8x7b |

---

## 📥 Installation

### Track 1: PWA Installation

#### From GitHub

```bash
# Clone repository
git clone https://github.com/waleedmandour/awe-system.git
cd awe-system

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Initialize database
bun run db:push

# Build for production
bun run build

# Start production server
bun run start
```

#### Deploy to Vercel

1. Fork the repository on GitHub
2. Connect to Vercel
3. Deploy automatically
4. Configure environment variables in Vercel dashboard

### Track 2: Desktop Installation

#### For End Users

Download the installer from:
- **Microsoft Store:** (Coming Soon)
- **GitHub Releases:** [Download](https://github.com/waleedmandour/awe-system/releases)

#### For Developers

```bash
# Clone repository
git clone https://github.com/waleedmandour/awe-system.git
cd awe-system/desktop-app

# Install dependencies
npm install
pip install -r python-backend/requirements.txt

# Development
npm run dev

# Build installer
npm run build:win
```

#### Installing Local LLM (Ollama)

```bash
# Download Ollama from https://ollama.ai
# Then pull a model:

ollama pull llama3.2:3b

# Start Ollama server
ollama serve
```

#### Installing Tesseract OCR

```bash
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Install to default location or configure path in app settings
```

---

## ⚙️ Configuration

### Track 1: PWA Configuration

Create a `.env` file with:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# API Keys (optional - can be entered in app)
GEMINI_API_KEY=your-gemini-api-key
VISION_API_KEY=your-vision-api-key
```

### Track 2: Desktop Configuration

The desktop app stores settings locally. Configure via Settings menu:

**LLM Configuration:**
- Provider: Ollama / LM Studio / Custom
- URL: Server endpoint
- Model: Selected model name
- Temperature: 0.0 - 1.0 (default: 0.3)
- Max Tokens: Response length limit

**OCR Configuration:**
- Provider: Tesseract / PaddleOCR / EasyOCR
- Language: eng, ara, etc.
- Tesseract Path: Custom installation path

---

## 📚 Supported Courses

### Foundation Program

| Course Code | Course Name | Assessment Scale |
|-------------|-------------|------------------|
| 0230 | English Language Foundation I | 0-6 per criterion |
| 0340 | English Language Foundation II | 0-6 per criterion |

### Post-Foundation Program

| Course Code | Course Name | Assessment Scale |
|-------------|-------------|------------------|
| LANC2160 | Academic English: Summary Writing | 0-5 per criterion |

### Assessment Criteria

**Foundation Courses (0230, 0340):**

| Criterion | Max Score | Description |
|-----------|-----------|-------------|
| Task Response | 6 | How well the essay addresses the given task |
| Coherence & Cohesion | 6 | Logical organization and linking of ideas |
| Lexical Resource | 6 | Range and accuracy of vocabulary |
| Grammatical Range & Accuracy | 6 | Range and accuracy of grammar |

**Post-Foundation (LANC2160):**

| Criterion | Max Score | Description |
|-----------|-----------|-------------|
| Task Achievement | 5 | How well the summary captures main points |
| Coherence & Cohesion | 5 | Logical organization and linking of ideas |
| Lexical Resource | 5 | Range and accuracy of vocabulary |
| Grammatical Range & Accuracy | 5 | Range and accuracy of grammar |

---

## 🔌 API Documentation

### Track 1 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ocr` | POST | Process image with Google Vision OCR |
| `/api/assess` | POST | Assess essay with Gemini AI |
| `/api/courses` | GET | Get available courses |
| `/api/essays` | CRUD | Manage essay records |

### Track 2 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/system/specs` | GET | Get system specifications |
| `/api/system/compatibility` | GET | Check LLM compatibility |
| `/api/llm/status` | GET | Check all LLM providers status |
| `/api/llm/models` | GET | List available models |
| `/api/llm/configure` | POST | Configure LLM provider |
| `/api/ocr/process` | POST | Process image with local OCR |
| `/api/ocr/configure` | POST | Configure OCR provider |
| `/api/assess` | POST | Assess essay with local LLM |
| `/api/criteria/{course}` | GET | Get course criteria |

---

## 🛠️ Tech Stack

### Track 1 (PWA)

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Animations | Framer Motion |
| Database | Prisma ORM, SQLite |
| State | Zustand |
| AI | Google Gemini API |
| OCR | Google Vision API |
| PWA | Service Worker, Web Manifest |

### Track 2 (Desktop)

| Component | Technology |
|-----------|------------|
| Frontend | Electron.js, React |
| Backend | Python FastAPI |
| LLM | Ollama / LM Studio / Custom |
| OCR | Tesseract, PaddleOCR, EasyOCR |
| Database | SQLite |
| Installer | electron-builder (NSIS, MSI, MSIX) |

---

## 📂 Project Structure

```
awe-system/
├── src/                          # PWA Source
│   ├── app/
│   │   ├── api/                  # API Routes
│   │   │   ├── assess/           # AI Assessment
│   │   │   ├── courses/          # Course Data
│   │   │   ├── essays/           # Essay CRUD
│   │   │   └── ocr/              # OCR Processing
│   │   ├── globals.css           # Global Styles
│   │   ├── layout.tsx            # Root Layout
│   │   └── page.tsx              # Main App
│   ├── components/ui/            # shadcn/ui Components
│   ├── hooks/                    # React Hooks
│   └── lib/
│       ├── db.ts                 # Database Client
│       ├── store.ts              # Zustand Store
│       └── utils.ts              # Utilities
├── prisma/
│   └── schema.prisma             # Database Schema
├── public/
│   ├── squ_logo.png              # SQU Logo
│   ├── manifest.json             # PWA Manifest
│   └── sw.js                     # Service Worker
├── desktop-app/                  # Track 2 Desktop App
│   ├── src/
│   │   ├── main/
│   │   │   └── main.js           # Electron Main Process
│   │   ├── preload/
│   │   │   └── preload.js        # Preload Script
│   │   └── renderer/             # UI Components
│   ├── python-backend/
│   │   ├── server.py             # FastAPI Server
│   │   ├── llm/
│   │   │   └── provider.py       # Multi-LLM Support
│   │   ├── ocr/
│   │   │   └── processor.py      # OCR Processors
│   │   ├── utils/
│   │   │   └── system_checker.py # Hardware Check
│   │   └── requirements.txt      # Python Dependencies
│   ├── assets/                   # App Icons, Images
│   ├── installer/                # Installer Config
│   └── package.json              # Electron Config
├── download/
│   ├── index.html                # PWA Install Page
│   └── awe-system-page.html      # Project Description
├── .env.example                  # Environment Template
├── README.md                     # This File
└── package.json                  # PWA Dependencies
```

---

## 🔒 Privacy & Security

### Track 1 (PWA)
- API keys stored locally in browser's localStorage
- Essays processed via Google APIs
- No data stored on external servers
- HTTPS encryption for all API calls

### Track 2 (Desktop)
- **100% Offline Operation** - No internet required
- All data stored locally on user's computer
- LLM inference runs entirely on local hardware
- OCR processing happens locally
- Full control over your data

---

## 🔧 Troubleshooting

### PWA Issues

**"API Key Required" Error:**
- Enter your Gemini API key in the Setup screen
- Get a free key from [aistudio.google.com](https://aistudio.google.com)

**OCR Not Working:**
- Ensure Vision API key is configured
- Check image quality and lighting
- Try uploading instead of camera capture

**Install Prompt Not Showing:**
- Use Safari on iOS, Chrome on Android
- Ensure you're using HTTPS

### Desktop App Issues

**"LLM Not Available" Error:**
- Ensure Ollama is running: `ollama serve`
- Check if model is downloaded: `ollama list`
- Verify URL in settings (default: http://localhost:11434)

**OCR Not Working:**
- Install Tesseract OCR
- Configure Tesseract path in settings
- Try PaddleOCR as alternative

**Low Performance:**
- Check system compatibility in Help menu
- Use smaller model (llama3.2:1b instead of larger)
- Ensure GPU drivers are updated

---

## 👨‍🏫 Credits

**Developed by:** Dr. Waleed Mandour  
**Year:** 2025-2026  
**Institution:** Sultan Qaboos University  
**Contact:** w.abumandour@squ.edu.om  
**Website:** [waleedmandour.org](https://waleedmandour.org)

---

## 📄 License

Educational use only. All rights reserved.

---

## 🚀 Future Roadmap

- [ ] Arabic language support for UI
- [ ] More LLM providers (vLLM, llama.cpp)
- [ ] Batch essay processing
- [ ] Student progress tracking
- [ ] Custom rubric builder
- [ ] PDF report generation
- [ ] macOS version
- [ ] Linux version

---

*Last Updated: March 2026*
