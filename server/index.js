const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

// Load configuration
const config = require('../config.js');
const isDevelopment = process.env.NODE_ENV !== 'production';
const envConfig = isDevelopment ? config.development : config.production;

// Add a simple mutex for read status operations
let readStatusMutex = Promise.resolve();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: envConfig.corsOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: envConfig.corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Constants
const JWT_SECRET = config.security.jwtSecret;
const DATA_DIR = path.join(__dirname, 'data');

// Initialize data directory and files
async function initializeData() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize users.json
    try {
      await fs.access(path.join(DATA_DIR, 'users.json'));
    } catch {
      await fs.writeFile(path.join(DATA_DIR, 'users.json'), JSON.stringify([], null, 2));
    }
    
    // Initialize channels.json
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
    
    // Initialize user_read_status.json
    try {
      await fs.access(path.join(DATA_DIR, 'user_read_status.json'));
    } catch {
      await fs.writeFile(path.join(DATA_DIR, 'user_read_status.json'), JSON.stringify([], null, 2));
    }
    
    console.log('Data files initialized successfully');
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Helper functions for data operations
async function readJsonFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    if (!data.trim()) {
      console.log(`${filename} is empty, returning default array`);
      return [];
    }
    
    // Try to parse JSON
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    
    // If JSON is corrupted, create a backup and recreate the file
    if (error instanceof SyntaxError) {
      console.log(`JSON syntax error in ${filename}, attempting to recover...`);
      
      try {
        // Create backup of corrupted file
        const backupPath = path.join(DATA_DIR, `${filename}.backup.${Date.now()}`);
        const corruptedData = await fs.readFile(filePath, 'utf8');
        await fs.writeFile(backupPath, corruptedData);
        console.log(`Corrupted ${filename} backed up to ${backupPath}`);
        
        // Initialize with appropriate default data
        let defaultData = [];
        if (filename === 'channels.json') {
          defaultData = [
            {
              id: uuidv4(),
              name: 'general',
              description: 'General discussion',
              createdBy: 'system',
              createdAt: new Date().toISOString(),
              members: []
            }
          ];
        }
        
        await writeJsonFile(filename, defaultData);
        console.log(`${filename} recreated with default data`);
        return defaultData;
      } catch (recoveryError) {
        console.error(`Failed to recover ${filename}:`, recoveryError);
        return [];
      }
    }
    
    // For other errors, try one more time
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (secondError) {
      console.error(`Second attempt to read ${filename} failed:`, secondError);
      return [];
    }
  }
}

async function writeJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tempFilePath = `${filePath}.tmp`;
  
  try {
    // Validate data can be stringified
    const jsonString = JSON.stringify(data, null, 2);
    
    // Write to temporary file first
    await fs.writeFile(tempFilePath, jsonString, 'utf8');
    
    // Verify the temporary file can be read back correctly
    const verifyData = await fs.readFile(tempFilePath, 'utf8');
    JSON.parse(verifyData); // This will throw if invalid
    
    // If verification passes, replace the original file
    await fs.rename(tempFilePath, filePath);
    console.log(`Successfully wrote ${filename}`);
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    
    // Clean up temporary file if it exists
    try {
      await fs.unlink(tempFilePath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    throw error; // Re-throw to handle in calling function
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

// Helper functions for read status management
async function updateReadStatus(userId, channelId, dmUserId, timestamp) {
  // Use mutex to prevent concurrent access to read status file
  readStatusMutex = readStatusMutex.then(async () => {
    try {
      console.log('updateReadStatus called:', { userId, channelId, dmUserId, timestamp });
      const readStatuses = await readJsonFile('user_read_status.json');
      const chatKey = channelId ? `channel_${channelId}` : `dm_${dmUserId}`;
      console.log('Generated chat key:', chatKey);
      
      // Find existing status or create new one
      let userStatus = readStatuses.find(status => status.userId === userId);
      if (!userStatus) {
        console.log('Creating new user status for:', userId);
        userStatus = { userId, readTimestamps: {} };
        readStatuses.push(userStatus);
      }
      
      userStatus.readTimestamps[chatKey] = timestamp;
      console.log('Updated read status:', userStatus.readTimestamps);
      
      // Retry write operation if it fails
      let writeSuccess = false;
      let retries = 3;
      
      while (!writeSuccess && retries > 0) {
        try {
          await writeJsonFile('user_read_status.json', readStatuses);
          writeSuccess = true;
          console.log('Read status saved to file');
        } catch (writeError) {
          console.error(`Write attempt failed, retries left: ${retries - 1}`, writeError);
          retries--;
          if (retries > 0) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      if (!writeSuccess) {
        throw new Error('Failed to save read status after multiple attempts');
      }
    } catch (error) {
      console.error('Error updating read status:', error);
      throw error;
    }
  });

  return readStatusMutex;
}

async function getReadStatus(userId) {
  // Use mutex to prevent concurrent access to read status file
  return readStatusMutex.then(async () => {
    try {
      const readStatuses = await readJsonFile('user_read_status.json');
      const userStatus = readStatuses.find(status => status.userId === userId);
      return userStatus ? userStatus.readTimestamps : {};
    } catch (error) {
      console.error('Error getting read status:', error);
      return {};
    }
  });
}

// Socket.io events
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.user.username} connected with socket ID: ${socket.id}`);
  
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

  // Handle marking messages as read
  socket.on('mark_as_read', async (data) => {
    try {
      console.log('mark_as_read event received:', data, 'from user:', socket.user.username);
      const { channelId, dmUserId } = data;
      const timestamp = new Date().toISOString();
      await updateReadStatus(socket.user.id, channelId, dmUserId, timestamp);
      console.log(`User ${socket.user.username} marked ${channelId ? `channel ${channelId}` : `DM with ${dmUserId}`} as read`);
      
      // Send updated read status back to the user
      const key = channelId ? `channel_${channelId}` : `dm_${dmUserId}`;
      socket.emit('read_status_updated', { [key]: timestamp });
      console.log('Sent read_status_updated event:', { [key]: timestamp });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { channelId, dmUserId } = data;
    
    if (channelId) {
      socket.broadcast.emit('user_typing', {
        userId: socket.user.id,
        channelId,
        isTyping: true
      });
    } else if (dmUserId) {
      // For DMs, find the target user and send them the typing event
      const connectedUsers = getConnectedUsers();
      const targetUser = connectedUsers.find(u => u.id === dmUserId);
      if (targetUser) {
        io.to(targetUser.socketId).emit('user_typing', {
          userId: socket.user.id,
          dmUserId: socket.user.id,
          isTyping: true
        });
      }
    }
  });

  socket.on('typing_stop', (data) => {
    const { channelId, dmUserId } = data;
    
    if (channelId) {
      socket.broadcast.emit('user_typing', {
        userId: socket.user.id,
        channelId,
        isTyping: false
      });
    } else if (dmUserId) {
      // For DMs, find the target user and send them the typing event
      const connectedUsers = getConnectedUsers();
      const targetUser = connectedUsers.find(u => u.id === dmUserId);
      if (targetUser) {
        io.to(targetUser.socketId).emit('user_typing', {
          userId: socket.user.id,
          dmUserId: socket.user.id,
          isTyping: false
        });
      }
    }
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
        
        // Emit to all connected clients instead of just channel room
        io.emit('new_message', message);
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
        
        // Emit to all connected clients for now (they'll filter on client side)
        io.emit('new_message', message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Send initial data when user connects
  socket.on('get_initial_data', async () => {
    try {
      console.log(`Sending initial data to user ${socket.user.username}`);
      const channels = await readJsonFile('channels.json');
      const users = await readJsonFile('users.json');
      const messages = await readJsonFile('messages.json');
      const directMessages = await readJsonFile('direct_messages.json');
      const readStatus = await getReadStatus(socket.user.id);
      
      // Join all channels the user is a member of
      channels.forEach(channel => {
        if (channel.members.includes(socket.user.id)) {
          socket.join(`channel_${channel.id}`);
          console.log(`User ${socket.user.username} auto-joined channel ${channel.name} (room: channel_${channel.id})`);
        }
      });
      
      console.log(`User ${socket.user.username} is in rooms:`, Array.from(socket.rooms));
      
      socket.emit('channels', channels);
      socket.emit('users', users.filter(u => u.id !== socket.user.id).map(u => ({
        id: u.id,
        username: u.username,
        status: u.isOnline ? 'online' : 'offline'
      })));
      socket.emit('messages', [...messages, ...directMessages]);
      socket.emit('read_status', readStatus);
      
      console.log(`Initial data sent to ${socket.user.username}: ${channels.length} channels, ${users.length - 1} users, ${messages.length + directMessages.length} messages`);
    } catch (error) {
      console.error('Error getting initial data:', error);
      socket.emit('error', { message: 'Failed to load initial data' });
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

// Helper function to get connected users with socket IDs
function getConnectedUsers() {
  const connectedUsers = [];
  for (const [socketId, socket] of io.sockets.sockets) {
    if (socket.user) {
      connectedUsers.push({
        id: socket.user.id,
        username: socket.user.username,
        socketId: socketId
      });
    }
  }
  console.log(`Connected users: ${connectedUsers.map(u => u.username).join(', ')}`);
  return connectedUsers;
}

// Initialize data and start server
initializeData().then(() => {
  const PORT = process.env.PORT || config.ports.server;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
    console.log(`CORS origins: ${envConfig.corsOrigins.join(', ')}`);
  });
});
