# Kopa - Web3 Video Conferencing Platform

A decentralized, privacy-focused video conferencing platform built with Next.js, featuring end-to-end encryption, local data storage, and anonymous mode capabilities.

![Kopa Screenshot](./public/screenshot.png)

## 🚀 Features

### Core Video Conferencing
- **High-Quality Video & Audio**: Crystal clear communication with advanced noise cancellation
- **Screen Sharing**: Share your screen with participants seamlessly
- **Recording**: Record meetings with multiple quality options
- **Real-time Chat**: Instant messaging during meetings
- **File Sharing**: Share files securely with participants
- **Presentation Mode**: Upload and present slides with navigation controls

### Privacy & Security
- **End-to-End Encryption**: All communications are encrypted by default
- **Local Data Storage**: Data stored locally by default, with optional cloud backup
- **Anonymous Mode**: Join meetings without revealing personal information
- **Decentralized Architecture**: Built on blockchain technology for enhanced privacy

### Web3 Integration
- **Wallet Connection**: Connect with Coinbase Wallet and other Web3 wallets
- **Blockchain-Powered**: Leverages blockchain technology for security and decentralization
- **OnchainKit Integration**: Built with Base's OnchainKit for seamless Web3 experience

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom brutal design system
- **State Management**: Zustand
- **WebRTC**: Simple-peer for peer-to-peer communication
- **Real-time**: Socket.io for real-time features
- **Web3**: OnchainKit, Wagmi, Viem
- **Recording**: RecordRTC for meeting recording
- **Storage**: Redis (Upstash) for session management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/kopa.git
cd kopa
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:

```bash
# OnchainKit Configuration
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=kopa
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here
NEXT_PUBLIC_URL=http://localhost:3000

# Socket.io Configuration (Optional)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Redis Configuration (Optional)
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token

# Frame Configuration
NEXT_PUBLIC_APP_ICON=/icon.png
NEXT_PUBLIC_APP_SUBTITLE=Web3 Video Conferencing
NEXT_PUBLIC_APP_DESCRIPTION=Decentralized video conferencing with privacy focus
NEXT_PUBLIC_APP_SPLASH_IMAGE=/splash.png
NEXT_PUBLIC_APP_HERO_IMAGE=/hero.png
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Creating a Room
1. Connect your Web3 wallet
2. Enter a room name
3. Click "Create Room"
4. Share the generated room code with participants

### Joining a Room
1. Connect your Web3 wallet
2. Enter the room code
3. Click "Join Room"

### Privacy Settings
Access privacy settings from the home page:
- **End-to-End Encryption**: Toggle encryption on/off
- **Data Storage**: Choose between "Local Only" or "Encrypted Cloud"
- **Anonymous Mode**: Enable to join meetings anonymously

### During a Meeting
- **Video/Audio Controls**: Mute/unmute, enable/disable camera
- **Screen Sharing**: Share your screen with participants
- **Chat**: Send messages to all participants
- **File Sharing**: Upload and share files
- **Presentations**: Upload slides and present to the room
- **Recording**: Record the meeting for later review

## 🏗️ Project Structure

```
kopa/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   │   ├── Home.tsx       # Home page with wallet connection
│   │   ├── Room.tsx       # Main room interface
│   │   └── ui/            # Reusable UI components
│   ├── api/               # API routes
│   ├── room/[id]/         # Dynamic room pages
│   └── layout.tsx         # Root layout
├── lib/                   # Utility libraries
│   ├── store.ts          # Zustand state management
│   ├── webrtc.ts         # WebRTC service
│   ├── recording.ts      # Recording service
│   └── utils.ts          # Utility functions
├── public/               # Static assets
└── styles/              # Global styles
```

## 🔧 Configuration

### Privacy Settings
The application defaults to privacy-first settings:
- End-to-end encryption: **Enabled**
- Data storage: **Local Only**
- Anonymous mode: **Enabled**

### WebRTC Configuration
The platform uses WebRTC for peer-to-peer communication with fallback to relay servers when needed.

### Recording Options
- **Quality**: Low, Medium, High
- **Type**: Screen, Camera, or Both
- **Audio Source**: Microphone, System, or Both

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [OnchainKit](https://onchainkit.xyz/) by Coinbase
- Powered by [Base](https://base.org/) blockchain
- UI inspired by brutal design principles
- WebRTC implementation using [simple-peer](https://github.com/feross/simple-peer)

## 📞 Support

For support, email support@kopa.app or join our community Discord.

---

**Kopa** - Secure, Private, Decentralized Video Conferencing 🎥🔒
