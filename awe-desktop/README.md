# AWE Desktop - Automated Writing Evaluation System

<div align="center">
  <img src="awe-desktop/assets/icon.png" alt="AWE Desktop Logo" width="128" height="128">
  
  <h3>AI-Powered Writing Assessment for Educators</h3>
  
  <p>
    A Windows desktop application that uses local LLMs for automated writing evaluation,
    designed for educators and students.
  </p>

  <p>
    <strong>Center for Preparatory Studies</strong><br>
    <strong>Sultan Qaboos University</strong>
  </p>

  <p>
    <strong>Developed by: Dr. Waleed Mandour, 2026</strong>
  </p>
</div>

---

## 📋 Features

### Core Features

- **🤖 Multi-LLM Support**: Use local or cloud LLMs for assessment
- **👁️ Vision LLM OCR**: Transcribe handwritten essays using LLaVA, Moondream, or other vision models
- **📝 IELTS-Based Assessment**: Comprehensive evaluation based on IELTS criteria
- **📊 Detailed Feedback**: Actionable suggestions for improvement

### LLM & VLM Support

| Provider | Type | Vision Support | Description |
|----------|------|----------------|-------------|
| **Ollama** | Local | ✅ | Recommended for local deployment |
| **LM Studio** | Local | ✅ | User-friendly local LLM runner |
| **OpenAI** | Cloud | ✅ | GPT-4o, GPT-4 Turbo |
| **Anthropic** | Cloud | ✅ | Claude 3 series |
| **Custom** | Any | ✅ | Any OpenAI-compatible endpoint |

### Assessment Criteria

The system evaluates essays based on four IELTS criteria:

1. **Task Response** - How well the essay addresses the prompt
2. **Coherence & Cohesion** - Organization and logical flow
3. **Lexical Resource** - Vocabulary range and accuracy
4. **Grammar Accuracy** - Grammatical range and accuracy

---

## 🖥️ System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| OS | Windows 10 or later (64-bit) |
| RAM | 8 GB |
| CPU | 4 cores |
| Storage | 10 GB free space |

### Recommended Requirements

| Component | Requirement |
|-----------|-------------|
| OS | Windows 11 (64-bit) |
| RAM | 16 GB or more |
| CPU | 8 cores |
| GPU | NVIDIA GPU with 8GB+ VRAM |
| Storage | 20 GB free space |

### LLM Model Requirements

| Model Size | Minimum RAM | Recommended RAM |
|------------|-------------|-----------------|
| 3B parameters | 8 GB | 16 GB |
| 7-8B parameters | 16 GB | 32 GB |
| 14B parameters | 32 GB | 48 GB |
| 70B parameters | 64 GB | 128 GB |

---

## 📥 Installation

### Download

Download the latest release from GitHub:

👉 **[Download Latest Release](https://github.com/waleedmandour/awe-desktop/releases/latest)**

### Option 1: Installer (Recommended)

1. Download `AWE-Desktop-Windows-v1.0.0.zip`
2. Extract the ZIP file
3. Run `AWE Desktop.exe`

### Option 2: Build from Source

```powershell
# Clone the repository
git clone https://github.com/waleedmandour/awe-desktop.git
cd awe-desktop/awe-desktop

# Install dependencies
npm install

# Install Python dependencies
pip install -r python-backend/requirements.txt

# Development mode
npm run electron:dev

# Build Windows installer
npm run electron:build:win
```

---

## 🚀 Quick Start

### 1. Install Ollama (Recommended)

```bash
# Download from https://ollama.ai
# Then pull the recommended models:

# For text assessment
ollama pull llama3:8b

# For handwritten OCR (optional but recommended)
ollama pull llava:7b
```

### 2. Configure AWE Desktop

1. Launch AWE Desktop
2. Navigate to **LLM Settings** from the sidebar
3. Select your preferred models for:
   - **Text LLM**: For essay assessment (e.g., llama3:8b)
   - **Vision LLM**: For OCR (e.g., llava:7b)

### 3. Perform Your First Assessment

1. Click **New Assessment** in the sidebar
2. Enter student information (optional)
3. Upload an essay image or paste text
4. Select OCR method:
   - **Auto**: Vision LLM first, fallback to Tesseract
   - **Vision LLM Only**: Best for handwritten text
   - **Tesseract Only**: Fast, good for printed text
5. Review the extracted text
6. Click **Start Assessment**
7. View detailed results and feedback

---

## ⚙️ Configuration

### Custom LLM Endpoints

You can add custom OpenAI-compatible endpoints:

1. Go to **LLM Settings** → **Custom Endpoints**
2. Click **Add Endpoint**
3. Fill in:
   - **Name**: Your endpoint name
   - **URL**: API base URL (e.g., `http://localhost:1234/v1`)
   - **API Key**: Optional authentication
   - **Model**: Model identifier
   - **Vision Support**: Enable if the model supports images

### OCR Methods

| Method | Best For | Speed | Accuracy |
|--------|----------|-------|----------|
| Vision LLM (LLaVA) | Handwriting, complex layouts | Slower | Highest |
| Tesseract | Printed text, simple layouts | Fast | Good |
| PaddleOCR | Mixed languages, receipts | Medium | Good |

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Application                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Main Process  │    │        Renderer Process         │ │
│  │   (Node.js)     │    │        (React + TypeScript)     │ │
│  │                 │    │                                 │ │
│  │  • IPC Handler  │◄──►│  • Desktop UI Components        │ │
│  │  • File System  │    │  • State Management (Zustand)   │ │
│  │  • System Info  │    │  • Animations (Framer Motion)   │ │
│  └────────┬────────┘    └────────────────┬────────────────┘ │
│           │                              │                   │
│           └──────────────┬───────────────┘                   │
│                          ▼                                   │
│           ┌─────────────────────────────────┐               │
│           │     Python FastAPI Backend       │               │
│           │                                  │               │
│           │  • Vision LLM OCR                │               │
│           │  • Text LLM Assessment           │               │
│           │  • Multi-provider Support        │               │
│           └─────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
awe-desktop/
├── electron/                 # Electron main process
│   ├── main.js              # Main process entry
│   └── preload.js           # IPC bridge
├── src/                      # React frontend
│   ├── components/          # UI components
│   ├── screens/             # Application screens
│   ├── lib/                 # Utilities and state
│   └── types.ts             # TypeScript types
├── python-backend/           # Python FastAPI server
│   ├── main.py              # Backend entry point
│   └── requirements.txt     # Python dependencies
├── assets/                   # Application assets
└── dist/                     # Build output
```

---

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Assessment |
| `Ctrl+O` | Open Image |
| `Ctrl+,` | Open Settings |
| `Ctrl+R` | Reload App |
| `F11` | Toggle Fullscreen |

---

## 📊 Release Notes

### v1.0.0 (March 2026)

**New Features:**
- Vision LLM OCR support (LLaVA, Moondream, MiniCPM-V)
- Custom LLM/VLM endpoint configuration
- Desktop-optimized UI with sidebar navigation
- Multi-provider LLM support

**Improvements:**
- Professional desktop layout
- Better visual hierarchy
- Updated branding for CPS, SQU

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 📞 Support

For issues and feature requests, please use the 
[GitHub Issues](https://github.com/waleedmandour/awe-desktop/issues) page.

---

<div align="center">
  <p>
    <strong>AWE Desktop</strong> - Making AI-powered writing assessment accessible to all educators
  </p>
  <p>
    © 2026 Dr. Waleed Mandour<br>
    Center for Preparatory Studies<br>
    Sultan Qaboos University
  </p>
</div>
