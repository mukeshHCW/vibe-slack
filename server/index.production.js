require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const server = http.createServer(app);

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

const io = socketIo(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Serve static files in production
if (!isDevelopment) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DATA_DIR = path.join(__dirname, 'data');

// Initialize data directory and files
async function initializeData() {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize users.json
    try {
      await fs.access(path.join(DATA_DIR, 'users.json'));
    } catch {
      await fs.writeFile(path.join(DATA_DIR, 'users.json'), JSON.stringify([], null, 2));
    }
    
    // Initialize channels.json with default general channel
    try {
      await fs.access(path.join(DATA_DIR, 'channels.json'));
    } catch {
      const defaultChannels = [
        {
          id: uuidv4(),
          name: 'general',
          description: 'General discussion',
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          members: []
        }
      ];
      await fs.writeFile(path.join(DATA_DIR, 'channels.json'), JSON.stringify(defaultChannels, null, 2));
    }
    
    // Initialize messages.json
    try {
      await fs.access(path.join(DATA_DIR, 'messages.json'));
    } catch {
      await fs.writeFile(path.join(DATA_DIR, 'messages.json'), JSON.stringify([], null, 2));
    }
    
    // Initialize direct_messages.json
    try {
      await fs.access(path.join(DATA_DIR, 'direct_messages.json'));
    } catch {
      await fs.writeFile(path.join(DATA_DIR, 'direct_messages.json'), JSON.stringify([], null, 2));
    }
    
    console.log('Data files initialized successfully');
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Helper functions for data operations
async function readJsonFile(filename) {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

async function writeJsonFile(filename, data) {
  try {
    await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Socket.io authentication middleware
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  });
}

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const users = await readJsonFile('users.json');
    
    // Check if user already exists
    if (users.find(u => u.email === email || u.username === username)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      isOnline: false
    };
    
    users.push(newUser);
    await writeJsonFile('users.json', users);
    
    // Generate token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const users = await readJsonFile('users.json');
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for DM purposes)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await readJsonFile('users.json');
    const publicUsers = users
      .filter(u => u.id !== req.user.id)
      .map(u => ({
        id: u.id,
        username: u.username,
        isOnline: u.isOnline || false
      }));
    
    res.json(publicUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all channels
app.get('/api/channels', authenticateToken, async (req, res) => {
  try {
    const channels = await readJsonFile('channels.json');
    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create channel
app.post('/api/channels', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Channel name is required' });
    }
    
    const channels = await readJsonFile('channels.json');
    
    // Check if channel already exists
    if (channels.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: 'Channel already exists' });
    }
    
    const newChannel = {
      id: uuidv4(),
      name,
      description: description || '',
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      members: [req.user.id]
    };
    
    channels.push(newChannel);
    await writeJsonFile('channels.json', channels);
    
    res.json(newChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get channel messages
app.get('/api/channels/:channelId/messages', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const messages = await readJsonFile('messages.json');
    const channelMessages = messages.filter(m => m.channelId === channelId);
    
    res.json(channelMessages);
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get direct messages between users
app.get('/api/direct-messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const directMessages = await readJsonFile('direct_messages.json');
    
    const conversation = directMessages.filter(dm => 
      (dm.senderId === req.user.id && dm.receiverId === userId) ||
      (dm.senderId === userId && dm.receiverId === req.user.id)
    );
    
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app in production
if (!isDevelopment) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Socket.io events
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.user.username} connected`);
  
  // Update user online status
  updateUserOnlineStatus(socket.user.id, true);
  
  // Join user to their own room for direct messages
  socket.join(`user_${socket.user.id}`);
  
  // Handle joining channels
  socket.on('join_channel', (channelId) => {
    socket.join(`channel_${channelId}`);
    console.log(`User ${socket.user.username} joined channel ${channelId}`);
  });
  
  // Handle leaving channels
  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel_${channelId}`);
    console.log(`User ${socket.user.username} left channel ${channelId}`);
  });

  // Handle creating channels
  socket.on('create_channel', async (data) => {
    try {
      const { name, description } = data;
      
      if (!name) {
        socket.emit('error', { message: 'Channel name is required' });
        return;
      }
      
      const channels = await readJsonFile('channels.json');
      
      // Check if channel already exists
      if (channels.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        socket.emit('error', { message: 'Channel already exists' });
        return;
      }
      
      const newChannel = {
        id: uuidv4(),
        name,
        description: description || '',
        createdBy: socket.user.id,
        createdAt: new Date().toISOString(),
        members: [socket.user.id]
      };
      
      channels.push(newChannel);
      await writeJsonFile('channels.json', channels);
      
      // Broadcast new channel to all users
      io.emit('channel_created', newChannel);
    } catch (error) {
      console.error('Error creating channel:', error);
      socket.emit('error', { message: 'Failed to create channel' });
    }
  });

  // Handle sending messages (unified handler)
  socket.on('send_message', async (data) => {
    try {
      const { content, channelId, recipientId } = data;
      
      if (channelId) {
        // Channel message
        const message = {
          id: uuidv4(),
          channelId,
          senderId: socket.user.id,
          senderName: socket.user.username,
          content,
          timestamp: new Date().toISOString()
        };
        
        const messages = await readJsonFile('messages.json');
        messages.push(message);
        await writeJsonFile('messages.json', messages);
        
        io.to(`channel_${channelId}`).emit('new_message', message);
      } else if (recipientId) {
        // Direct message
        const message = {
          id: uuidv4(),
          senderId: socket.user.id,
          senderName: socket.user.username,
          recipientId,
          content,
          timestamp: new Date().toISOString()
        };
        
        const directMessages = await readJsonFile('direct_messages.json');
        directMessages.push(message);
        await writeJsonFile('direct_messages.json', directMessages);
        
        io.to(`user_${recipientId}`).emit('new_message', message);
        socket.emit('new_message', message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
  
  // Send initial data when user connects
  socket.on('get_initial_data', async () => {
    try {
      const channels = await readJsonFile('channels.json');
      const users = await readJsonFile('users.json');
      const messages = await readJsonFile('messages.json');
      const directMessages = await readJsonFile('direct_messages.json');
      
      // Join all channels the user is a member of
      channels.forEach(channel => {
        if (channel.members.includes(socket.user.id)) {
          socket.join(`channel_${channel.id}`);
        }
      });
      
      socket.emit('channels', channels);
      socket.emit('users', users.filter(u => u.id !== socket.user.id).map(u => ({
        id: u.id,
        username: u.username,
        status: u.isOnline ? 'online' : 'offline'
      })));
      socket.emit('messages', [...messages, ...directMessages]);
    } catch (error) {
      console.error('Error getting initial data:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.username} disconnected`);
    updateUserOnlineStatus(socket.user.id, false);
  });
});

// Helper function to update user online status
async function updateUserOnlineStatus(userId, isOnline) {
  try {
    const users = await readJsonFile('users.json');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].isOnline = isOnline;
      await writeJsonFile('users.json', users);
      
      // Broadcast online status change
      io.emit('user_status_change', {
        userId,
        isOnline
      });
    }
  } catch (error) {
    console.error('Error updating user online status:', error);
  }
}

// Initialize data and start server
initializeData().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = app;
