import React from 'react';
import './TypingIndicator.css';

interface TypingUser {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  maxDisplay?: number;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  maxDisplay = 3,
}) => {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].nickname}님이 입력 중`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].nickname}님, ${typingUsers[1].nickname}님이 입력 중`;
    } else if (typingUsers.length <= maxDisplay) {
      const names = typingUsers.slice(0, -1).map((u) => u.nickname).join(', ');
      const lastName = typingUsers[typingUsers.length - 1].nickname;
      return `${names}, ${lastName}님이 입력 중`;
    } else {
      const displayedNames = typingUsers.slice(0, maxDisplay - 1).map((u) => u.nickname).join(', ');
      const remaining = typingUsers.length - (maxDisplay - 1);
      return `${displayedNames} 외 ${remaining}명이 입력 중`;
    }
  };

  return (
    <div className="typing-indicator" data-testid="typing-indicator">
      <div className="typing-avatars" data-testid="typing-avatars">
        {typingUsers.slice(0, maxDisplay).map((user) => (
          <div key={user.id} className="typing-avatar" data-testid={`typing-avatar-${user.id}`}>
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user.nickname} />
            ) : (
              <div className="avatar-placeholder">
                {user.nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="typing-content">
        <div className="typing-dots" data-testid="typing-dots">
          <span className="dot" data-testid="dot" />
          <span className="dot" data-testid="dot" />
          <span className="dot" data-testid="dot" />
        </div>
        <span className="typing-text">{getTypingText()}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
