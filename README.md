# Vibe Slack - Real-time Chat Application

A Slack-inspired chat application built with React, Node.js, and Socket.IO, designed for seamless real-time communication.

## 🚀 Features

- **Real-time Messaging**: Instant messaging with Socket.IO
- **Channel Management**: Create and join different channels
- **Direct Messages**: Private conversations between users
- **User Authentication**: Secure JWT-based authentication
- **Responsive Design**: Desktop-optimized interface
- **Azure Deployment Ready**: Complete deployment pipeline

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** with TypeScript
- **Vite 7.1.3** for fast development and building
- **Socket.IO Client 4.8.1** for real-time communication
- **CSS3** with custom styling

### Backend
- **Node.js 18+** with Express
- **Socket.IO 4.7.4** for WebSocket connections
- **JWT** for authentication
- **bcryptjs** for password hashing
- **JSON file storage** for simplicity

## 🏗️ Project Structure

```
vibe-slack-chat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── config/         # API configuration
│   │   └── assets/         # Static assets
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── data/              # JSON data storage
│   ├── index.js           # Development server
│   ├── index.production.js # Production server
│   └── package.json
├── docs/                  # Documentation
└── deployment/            # Deployment configurations
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/vibe-slack-chat.git
cd vibe-slack-chat

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Start development servers
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### Environment Setup
Create a `.env` file in the server directory:
```env
NODE_ENV=development
JWT_SECRET=your-secret-key
PORT=5000
CORS_ORIGINS=http://localhost:5174
```

## 📱 Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Join Channels**: Click on existing channels or create new ones
3. **Direct Messages**: Click on users in the sidebar to start private chats
4. **Real-time Chat**: Send messages and see them appear instantly

## 🏠 Deployment

### Azure Windows VM Deployment
See [AZURE_WINDOWS_VM_DEPLOYMENT.md](./AZURE_WINDOWS_VM_DEPLOYMENT.md) for complete deployment guide.

Quick deployment:
```bash
# Azure CLI setup
az vm create --resource-group vibe-slack-rg --name vibe-slack-vm --image Win2022Datacenter --size Standard_B1s

# On VM: Clone and deploy
git clone https://github.com/YOUR-USERNAME/vibe-slack-chat.git
cd vibe-slack-chat
powershell.exe -File scripts/deploy.ps1
```

### Other Deployment Options
- **Azure App Service**: See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
- **Docker**: Use included Dockerfile
- **Traditional VPS**: Follow VM deployment guide

## 🔧 Development Workflow

### Branch Strategy
- **main**: Development branch
- **production**: Stable deployment branch
- **feature/***: Feature development branches

### Deployment Pipeline
1. Develop on `main` branch
2. Create pull request for features
3. Merge to `production` for deployment
4. Automated deployment via GitHub Actions

## 📊 Performance

- **Lightweight**: Optimized for 4-5 concurrent users
- **Fast**: Vite build system for quick development
- **Efficient**: Socket.IO for minimal bandwidth usage
- **Scalable**: Easy to upgrade VM size as needed

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Protection**: Configurable CORS origins
- **Input Validation**: Sanitized user inputs

## 💰 Cost-Effective Deployment

### Azure B1s VM (~$8/month)
- Perfect for demos and small teams
- Auto-shutdown for additional savings
- Spot instances for 80% discount

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the excellent framework
- Socket.IO team for real-time communication
- Microsoft Azure for cloud infrastructure
- Vite team for the amazing build tool

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the deployment documentation
- Review the troubleshooting section in deployment guides

---

**Happy Chatting! 💬**
