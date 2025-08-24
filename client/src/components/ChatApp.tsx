import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';
import Sidebar from './Sidebar.tsx';
import ChatWindow from './ChatWindow.tsx';
import './ChatApp.css';

interface User {
  id: string;
  username: string;
  email: string;
  status: string;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  members: string[];
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  channelId?: string;
  recipientId?: string;
}

interface ChatAppProps {
  user: User;
  onLogout: () => void;
}

const ChatApp: React.FC<ChatAppProps> = ({ user, onLogout }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [readStatus, setReadStatus] = useState<{[key: string]: string}>({});
  const [typingUsers, setTypingUsers] = useState<{[key: string]: Set<string>}>({});
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const token = localStorage.getItem('token');
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      // Request initial data when connected
      newSocket.emit('get_initial_data');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error.message);
      alert(error.message);
    });

    newSocket.on('channels', (channelData: Channel[]) => {
      console.log('Received channels:', channelData);
      setChannels(channelData);
      if (channelData.length > 0 && !activeChannel && !activeDM) {
        setActiveChannel(channelData[0].id);
      }
    });

    newSocket.on('users', (userData: User[]) => {
      console.log('Received users:', userData);
      setUsers(userData);
    });

    newSocket.on('messages', (messageData: Message[]) => {
      console.log('Received initial messages:', messageData);
      setMessages(messageData);
    });

    newSocket.on('read_status', (status: {[key: string]: string}) => {
      console.log('Received read status:', status);
      setReadStatus(status);
    });

    newSocket.on('read_status_updated', (updatedStatus: {[key: string]: string}) => {
      console.log('Read status updated:', updatedStatus);
      setReadStatus(prev => ({ ...prev, ...updatedStatus }));
    });

    newSocket.on('new_message', (message: Message) => {
      console.log('Received new message:', message);
      setMessages(prev => [...prev, message]);
      
      // Note: Unread status will be handled by server-side read status
      // No need to manually track unread here as it's calculated from server data
    });

    newSocket.on('user_typing', ({ userId, channelId, dmUserId, isTyping }: {
      userId: string, channelId?: string, dmUserId?: string, isTyping: boolean
    }) => {
      console.log('Received typing event:', { userId, channelId, dmUserId, isTyping });
      const key = channelId ? `channel_${channelId}` : `dm_${dmUserId}`;
      console.log('Typing key:', key, 'Current active:', { activeChannel, activeDM });
      
      setTypingUsers(prev => {
        const newTyping = { ...prev };
        if (!newTyping[key]) newTyping[key] = new Set();
        
        if (isTyping) {
          newTyping[key].add(userId);
          console.log(`Added ${userId} to typing users for ${key}`);
        } else {
          newTyping[key].delete(userId);
          console.log(`Removed ${userId} from typing users for ${key}`);
          if (newTyping[key].size === 0) {
            delete newTyping[key];
          }
        }
        console.log('Updated typing users:', newTyping);
        return newTyping;
      });
    });

    console.log('Set up user_typing event listener');

    newSocket.on('channel_created', (channel: Channel) => {
      console.log('New channel created:', channel);
      setChannels(prev => [...prev, channel]);
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error.message);
      alert(error.message);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []); // Remove activeChannel and activeDM from dependencies

  // Update unread status when messages or read status changes
  useEffect(() => {
    // Force re-render of sidebar when active chat changes
    // This ensures unread counts are recalculated
  }, [messages, readStatus, activeChannel, activeDM]);

  // Helper function to get an updated unread count that considers active chat
  const getUnreadCountForSidebar = (channelId?: string, userId?: string) => {
    // Always recalculate based on current active chat
    return getUnreadCount(channelId, userId);
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket) {
      console.log('No socket for typing');
      return;
    }
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Emit typing start
    if (activeChannel) {
      console.log('Emitting typing_start for channel:', activeChannel);
      socket.emit('typing_start', { channelId: activeChannel });
    } else if (activeDM) {
      console.log('Emitting typing_start for DM:', activeDM);
      socket.emit('typing_start', { dmUserId: activeDM });
    }
    
    // Set timeout to stop typing
    const timeout = setTimeout(() => {
      if (activeChannel) {
        console.log('Emitting typing_stop for channel:', activeChannel);
        socket.emit('typing_stop', { channelId: activeChannel });
      } else if (activeDM) {
        console.log('Emitting typing_stop for DM:', activeDM);
        socket.emit('typing_stop', { dmUserId: activeDM });
      }
    }, 3000);
    
    setTypingTimeout(timeout);
  };

  const sendMessage = (content: string) => {
    if (!socket || !content.trim()) {
      console.log('Cannot send message: socket or content missing', { socket: !!socket, content });
      return;
    }

    const messageData = {
      content: content.trim(),
      channelId: activeChannel,
      recipientId: activeDM
    };

    console.log('Sending message:', messageData);
    socket.emit('send_message', messageData);
  };

  const createChannel = () => {
    if (!socket || !newChannelName.trim()) return;

    socket.emit('create_channel', {
      name: newChannelName.trim(),
      description: `Channel created by ${user.username}`
    });

    setNewChannelName('');
    setShowCreateChannel(false);
  };

  const switchToChannel = (channelId: string) => {
    // Mark current chat as read before switching
    if (socket) {
      if (activeChannel) {
        socket.emit('mark_as_read', { channelId: activeChannel });
      } else if (activeDM) {
        socket.emit('mark_as_read', { dmUserId: activeDM });
      }
    }
    
    setActiveChannel(channelId);
    setActiveDM(null);
    
    // Mark new channel as read
    if (socket) {
      socket.emit('mark_as_read', { channelId });
    }
  };

  const switchToDM = (userId: string) => {
    // Mark current chat as read before switching
    if (socket) {
      if (activeChannel) {
        socket.emit('mark_as_read', { channelId: activeChannel });
      } else if (activeDM) {
        socket.emit('mark_as_read', { dmUserId: activeDM });
      }
    }
    
    setActiveDM(userId);
    setActiveChannel(null);
    
    // Mark new DM as read
    if (socket) {
      socket.emit('mark_as_read', { dmUserId: userId });
    }
  };

  const getFilteredMessages = () => {
    if (activeChannel) {
      return messages.filter(msg => msg.channelId === activeChannel);
    } else if (activeDM) {
      return messages.filter(msg => 
        (msg.senderId === user.id && msg.recipientId === activeDM) ||
        (msg.senderId === activeDM && msg.recipientId === user.id)
      );
    }
    return [];
  };

  const getCurrentChatName = () => {
    if (activeChannel) {
      const channel = channels.find(c => c.id === activeChannel);
      return channel ? `#${channel.name}` : 'Unknown Channel';
    } else if (activeDM) {
      const dmUser = users.find(u => u.id === activeDM);
      return dmUser ? `@${dmUser.username}` : 'Unknown User';
    }
    return 'Select a chat';
  };

  const getUnreadCount = (channelId?: string, userId?: string) => {
    // If this chat is currently active, always return 0 (no unread)
    if (channelId && channelId === activeChannel) {
      console.log(`Channel ${channelId} is active, returning 0 unread`);
      return 0;
    }
    if (userId && userId === activeDM) {
      console.log(`DM ${userId} is active, returning 0 unread`);
      return 0;
    }
    
    if (channelId) {
      // Count unread messages in channel
      const lastRead = readStatus[`channel_${channelId}`];
      const messageCount = messages.filter(msg => 
        msg.channelId === channelId && 
        msg.senderId !== user.id &&
        (!lastRead || msg.timestamp > lastRead)
      ).length;
      console.log(`Channel ${channelId} unread count: ${messageCount}, lastRead: ${lastRead}`);
      return messageCount;
    } else if (userId) {
      // Count unread DMs from specific user
      const lastRead = readStatus[`dm_${userId}`];
      const messageCount = messages.filter(msg => 
        msg.senderId === userId && 
        msg.recipientId === user.id &&
        (!lastRead || msg.timestamp > lastRead)
      ).length;
      console.log(`DM ${userId} unread count: ${messageCount}, lastRead: ${lastRead}, activeChannel: ${activeChannel}, activeDM: ${activeDM}`);
      return messageCount;
    }
    return 0;
  };

  const getTypingUsersForCurrentChat = () => {
    const key = activeChannel ? `channel_${activeChannel}` : (activeDM ? `dm_${activeDM}` : null);
    console.log('Getting typing users for key:', key, 'typingUsers:', typingUsers);
    
    if (!key || !typingUsers[key]) {
      console.log('No typing users for current chat');
      return [];
    }
    
    const usernames = Array.from(typingUsers[key]).map(userId => {
      const foundUser = users.find(u => u.id === userId);
      console.log('Found user for typing:', userId, foundUser?.username);
      return foundUser ? foundUser.username : 'Unknown';
    });
    
    console.log('Typing usernames:', usernames);
    return usernames;
  };

  return (
    <div className="chat-app">
      <Sidebar
        key={`${activeChannel || 'no-channel'}-${activeDM || 'no-dm'}`}
        user={user}
        channels={channels}
        users={users}
        activeChannel={activeChannel}
        activeDM={activeDM}
        onChannelSelect={switchToChannel}
        onUserSelect={switchToDM}
        onLogout={onLogout}
        showCreateChannel={showCreateChannel}
        setShowCreateChannel={setShowCreateChannel}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        onCreateChannel={createChannel}
        getUnreadCount={getUnreadCountForSidebar}
      />
      <ChatWindow
        messages={getFilteredMessages()}
        currentUser={user}
        chatName={getCurrentChatName()}
        onSendMessage={sendMessage}
        onTyping={handleTyping}
        typingUsers={(() => {
          const typingList = getTypingUsersForCurrentChat();
          console.log('Passing typing users to ChatWindow:', typingList);
          return typingList;
        })()}
      />
    </div>
  );
};

export default ChatApp;
