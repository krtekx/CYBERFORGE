# 🔧 CyberForge | Neural DIY Synthesizer

**Version 13.6.0**

A futuristic, AI-powered hardware design tool that generates custom DIY electronics projects using Google's Gemini AI. Create unique hardware designs with neural-generated schematics, BOMs, and visual renders.

![CyberForge](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google)

## ✨ Features

### 🎨 **Neural Design Generation**
- AI-powered hardware design synthesis
- Automatic Bill of Materials (BOM) generation
- Visual product photography renders
- Multiple design variants per prompt

### 🔑 **Advanced API Key Management**
- Multi-key support with easy switching
- Automatic key rotation on rate limits
- Secure local storage
- Visual key status indicators

### ⚡ **Smart Rate Limiting**
- Automatic retry with exponential backoff (3s, 6s, 12s)
- Intelligent 429 error detection
- Seamless key rotation when hitting limits
- Console logging for transparency

### 🎯 **Customization Options**
- **Complexity Levels**: Easy, Moderate, Hard
- **Materials**: Brass, Acrylic, Plywood, 3D Print
- **Aesthetics**: LED lights, exposed wiring options
- **Power Options**: Battery (18650) or USB-C

### 📦 **Component Library**
- ESP32-C3, RP2040, Raspberry Pi Pico W
- OLED displays, LCD screens, Nixie tubes
- Passive components (resistors, capacitors, diodes)
- LEDs, Neopixels, Edison filaments
- And many more!

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- Google Gemini API key ([Get one here](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/CyberForge.git
   cd CyberForge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔑 API Key Setup

### Getting Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key or use an existing one
5. Copy the key

### Adding Keys to CyberForge

1. Click the **🔑 key icon** in the top-right header
2. Click **"+ ADD NEW API KEY"**
3. Enter a name (e.g., "Personal Account", "Work Key")
4. Paste your API key
5. Click **SAVE**

### Managing Multiple Keys

- **Switch Keys**: Click "SET ACTIVE" on any key
- **Edit Keys**: Click "EDIT" to modify name or key
- **Delete Keys**: Click "DELETE" to remove a key
- **Active Key**: Shown in the header as "Key: [Name]"

## 📊 Free Tier Limits

| Model | Requests/Minute | Requests/Day | Use Case |
|-------|----------------|--------------|----------|
| gemini-2.5-flash | 15 RPM | 1,500 RPD | Text generation, BOM |
| gemini-2.5-flash-image | 2 RPM | 100 RPD | Image generation |

**Tip**: Add multiple API keys from different Google accounts to increase your effective rate limit!

## 🎮 How to Use

1. **Enter a Prompt**: Describe your desired hardware project
   - Example: "retro weather station in brass case"
   - Example: "cyberpunk LED matrix clock"

2. **Select Components** (Optional): Choose specific parts from the grid

3. **Configure Settings**:
   - Complexity: Easy, Moderate, or Hard
   - Material: Brass, Acrylic, Plywood, or 3D Print
   - Aesthetics: Toggle lights and wiring options

4. **Set Activation Units**: Choose how many design variants to generate (1-5)

5. **Click FORGE_INIT**: Generate your designs!

6. **Review Results**:
   - View generated images
   - Inspect Bill of Materials
   - Switch between design variants
   - Export blueprints as WebP

## 🛠️ Tech Stack

- **Frontend**: React 19.2.3 with TypeScript
- **Build Tool**: Vite 6.2.0
- **AI**: Google Gemini API (@google/genai 1.34.0)
- **Styling**: Tailwind CSS (via CDN)
- **State Management**: React Hooks

## 📁 Project Structure

```
CyberForge/
├── components/           # React components
│   ├── ApiKeyManager.tsx    # API key management UI
│   ├── PartSelector.tsx     # Component selection
│   ├── PartDetailPopup.tsx  # Part details modal
│   ├── SchematicView.tsx    # Design visualization
│   └── SynthesisProgress.tsx # Generation progress
├── services/            # API services
│   ├── geminiService.ts     # Gemini AI integration
│   └── apiKeyManager.ts     # Key storage & rotation
├── App.tsx              # Main application
├── constants.tsx        # Component library
├── types.ts             # TypeScript definitions
└── index.html           # Entry point
```

## 🔧 Configuration

### Models Used

- **Text Generation**: `gemini-2.5-flash`
- **Image Generation**: `gemini-2.5-flash-image`

These models are optimized for Free Tier usage and provide excellent results while staying within quota limits.

### Rate Limiting

The app automatically handles rate limits:
- **3 retry attempts** with exponential backoff
- **Automatic key rotation** when hitting limits
- **Console logging** for debugging

## 🐛 Troubleshooting

### "No API key configured" Error
- Open the API Key Manager (🔑 icon)
- Add at least one API key
- Make sure it's set as active

### "Quota exceeded" Error
- Add multiple API keys from different Google accounts
- Wait a minute before retrying
- Check your quota at [Google AI Studio](https://aistudio.google.com/)

### "Model not found" Error
- Ensure you're using a Free Tier API key
- The app uses `gemini-2.5-flash` which is free tier compatible
- Check that your API key has Gemini API access enabled

## 📝 Documentation

- [API Key Manager Guide](./API_KEY_MANAGER_GUIDE.md)
- [Troubleshooting Guide](./API_TROUBLESHOOTING.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Google Gemini AI](https://ai.google.dev/)
- Powered by [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Created with [Antigravity](https://antigravity.dev/)

## 🔗 Links

- [Google AI Studio](https://aistudio.google.com/) - Get API keys
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs) - API documentation
- [Report Issues](https://github.com/YOUR_USERNAME/CyberForge/issues)

---

**Made with ⚡ by the CyberForge Syndicate**

*Version 13.6.0 | Neural DIY Synthesizer*
