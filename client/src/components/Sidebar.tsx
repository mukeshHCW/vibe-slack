import React from 'react';
import './Sidebar.css';

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

interface SidebarProps {
  user: User;
  channels: Channel[];
  users: User[];
  activeChannel: string | null;
  activeDM: string | null;
  onChannelSelect: (channelId: string) => void;
  onUserSelect: (userId: string) => void;
  onLogout: () => void;
  showCreateChannel: boolean;
  setShowCreateChannel: (show: boolean) => void;
  newChannelName: string;
  setNewChannelName: (name: string) => void;
  onCreateChannel: () => void;
  getUnreadCount: (channelId?: string, userId?: string) => number;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  channels,
  users,
  activeChannel,
  activeDM,
  onChannelSelect,
  onUserSelect,
  onLogout,
  showCreateChannel,
  setShowCreateChannel,
  newChannelName,
  setNewChannelName,
  onCreateChannel,
  getUnreadCount
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Vibe Slack</h2>
        <div className="user-info">
          <span className="username">{user.username}</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <h3>Channels</h3>
          <button 
            className="add-btn"
            onClick={() => setShowCreateChannel(true)}
            title="Create Channel"
          >
            +
          </button>
        </div>
        
        {showCreateChannel && (
          <div className="create-channel">
            <input
              type="text"
              placeholder="Channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onCreateChannel()}
            />
            <div className="create-channel-actions">
              <button onClick={onCreateChannel}>Create</button>
              <button onClick={() => setShowCreateChannel(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="channel-list">
          {channels.map(channel => {
            const unreadCount = getUnreadCount(channel.id);
            return (
              <div
                key={channel.id}
                className={`channel-item ${activeChannel === channel.id ? 'active' : ''}`}
                onClick={() => onChannelSelect(channel.id)}
              >
                <div className="channel-item-content">
                  <span className="channel-hash">#</span>
                  <span className="channel-name">{channel.name}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <h3>Direct Messages</h3>
        </div>
        <div className="user-list">
          {users.map(user => {
            const unreadCount = getUnreadCount(undefined, user.id);
            return (
              <div
                key={user.id}
                className={`user-item ${activeDM === user.id ? 'active' : ''}`}
                onClick={() => onUserSelect(user.id)}
              >
                <div className="user-item-content">
                  <div className={`status-indicator ${user.status}`}></div>
                  <span className="user-name">{user.username}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="no-users">No other users online</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
