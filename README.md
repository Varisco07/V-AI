# VARI AI Platform

![VARI AI](https://img.shields.io/badge/VARI_AI-v1.0.0-6366F1?style=for-the-badge)
![Status](https://img.shields.io/badge/STATUS-ONLINE-10B981?style=for-the-badge)
![License](https://img.shields.io/badge/LICENSE-MIT-EC4899?style=for-the-badge)

> **VARI AI** - Your Advanced AI Assistant Platform

A modern, beautiful AI platform built with Next.js, TypeScript, and cutting-edge web technologies. Features real AI integration with Ollama (free & local) or OpenAI/Claude.

## ✨ Features

- **🤖 Real AI Integration** - OpenAI GPT-4, Claude, or local Ollama (FREE!)
- **🌐 Multi-Language** - 9 languages supported (English, Italian, Spanish, French, German, Portuguese, Russian, Chinese, Japanese)
- **📁 File Upload** - PDF, Word, Images support
- **🎤 Voice Input** - Speech recognition ready
- **📊 System Monitoring** - Real-time CPU & Memory metrics
- **💼 Project Management** - Track projects with localStorage
- **💻 Interactive Terminal** - Built-in command interface
- **🎨 Modern UI** - Clean, responsive design with smooth animations
- **⚡ Performance** - Optimized for speed

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/vari-ai.git
cd vari-ai

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🤖 AI Setup

### **Option 1: Ollama (FREE - Recommended)**

**No cost, no API keys, runs on your PC!**

1. **Download Ollama**
   ```
   https://ollama.ai/download
   ```

2. **Install model**
   ```bash
   ollama pull llama3.2
   ```

3. **Start VARI AI**
   ```bash
   npm run dev
   ```

✅ **Done!** VARI AI now uses real AI, completely free.

### **Option 2: OpenAI (Paid)**

1. Get API Key: https://platform.openai.com/api-keys

2. Create `.env.local`:
   ```
   OPENAI_API_KEY=sk-your-key
   ```

3. Update API endpoint in `AIChat.tsx` (line ~145):
   ```typescript
   fetch('/api/chat', { ... })  // instead of /api/chat-local
   ```

## 📚 Usage

### AI Chat
- Click the chat interface at the bottom
- Select your preferred language
- Upload files (PDF, Word, Images)
- Use voice input (microphone button)

### Terminal Commands
```bash
help          # Show available commands
status        # System status
projects      # List projects
analyze       # Code analysis
deploy        # Deploy application
clear         # Clear terminal
```

## 🎨 Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **AI:** Ollama / OpenAI / Claude
- **Icons:** Lucide React

## 📁 Project Structure

```
vari-ai/
├── app/
│   ├── api/
│   │   ├── chat-local/       # Ollama integration
│   │   └── system/metrics/   # System monitoring
│   ├── page.tsx              # Main interface
│   └── layout.tsx            # Root layout
├── components/
│   ├── hud/
│   │   ├── CommandCenter.tsx # Project management
│   │   └── SystemMetrics.tsx # System stats
│   └── interface/
│       ├── AIChat.tsx        # AI chat interface
│       └── Terminal.tsx      # Terminal component
└── lib/                      # Utilities
```

## 🛠️ Configuration

### Environment Variables
```env
OPENAI_API_KEY=sk-...           # Optional (for OpenAI)
ANTHROPIC_API_KEY=sk-ant-...    # Optional (for Claude)
```

### Colors (tailwind.config.ts)
```typescript
colors: {
  vari: {
    primary: '#6366F1',      // Indigo
    secondary: '#8B5CF6',    // Purple
    accent: '#EC4899',       // Pink
    success: '#10B981',      // Green
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t vari-ai .
docker run -p 3000:3000 vari-ai
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🎯 Roadmap

- [x] Modern UI redesign
- [x] Multi-language support
- [x] File upload support
- [x] System monitoring
- [x] Project management
- [ ] Voice command integration
- [ ] Mobile responsive improvements
- [ ] Plugin system
- [ ] Cloud sync

## 💬 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and AI**

*"The future is already here — it's just not evenly distributed." - William Gibson*
