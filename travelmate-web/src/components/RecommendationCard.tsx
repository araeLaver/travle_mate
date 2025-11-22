import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GroupRecommendation,
  UserRecommendation,
  getScoreColor,
  getScoreLabel,
} from '../hooks/useRecommendations';
import './RecommendationCard.css';

interface GroupRecommendationCardProps {
  recommendation: GroupRecommendation;
}

export const GroupRecommendationCard: React.FC<GroupRecommendationCardProps> = ({
  recommendation,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${recommendation.groupId}`);
  };

  const scoreColor = getScoreColor(recommendation.recommendationScore);
  const scoreLabel = getScoreLabel(recommendation.recommendationScore);

  return (
    <div className="recommendation-card" onClick={handleClick}>
      <div className="recommendation-header">
        <h3 className="recommendation-title">{recommendation.groupName}</h3>
        <div
          className="recommendation-score"
          style={{ backgroundColor: scoreColor }}
        >
          {Math.round(recommendation.recommendationScore)}
        </div>
      </div>

      <div className="recommendation-destination">
        {recommendation.destination}
      </div>

      <div className="recommendation-meta">
        <span className="travel-style-badge">{recommendation.travelStyle}</span>
        <span className="members-info">
          {recommendation.currentMembers}/{recommendation.maxMembers} 명
        </span>
      </div>

      {recommendation.tags && recommendation.tags.length > 0 && (
        <div className="recommendation-tags">
          {recommendation.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="recommendation-description">{recommendation.description}</p>

      <div className="recommendation-reasons">
        <strong>추천 이유:</strong>
        <ul>
          {recommendation.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>

      <div className="score-breakdown">
        <div className="score-label">{scoreLabel}</div>
        <div className="score-bars">
          <ScoreBar
            label="여행 스타일"
            value={recommendation.scoreBreakdown.travelStyleScore}
          />
          <ScoreBar
            label="관심사"
            value={recommendation.scoreBreakdown.interestScore}
          />
          <ScoreBar
            label="인기도"
            value={recommendation.scoreBreakdown.popularityScore}
          />
        </div>
      </div>
    </div>
  );
};

interface UserRecommendationCardProps {
  recommendation: UserRecommendation;
}

export const UserRecommendationCard: React.FC<UserRecommendationCardProps> = ({
  recommendation,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/users/${recommendation.userId}`);
  };

  const scoreColor = getScoreColor(recommendation.recommendationScore);
  const scoreLabel = getScoreLabel(recommendation.recommendationScore);

  return (
    <div className="recommendation-card user-card" onClick={handleClick}>
      <div className="recommendation-header">
        <div className="user-info">
          {recommendation.profileImage && (
            <img
              src={recommendation.profileImage}
              alt={recommendation.nickname}
              className="user-avatar"
            />
          )}
          <div>
            <h3 className="recommendation-title">{recommendation.nickname}</h3>
            {recommendation.ageGroup && (
              <span className="age-group">{recommendation.ageGroup}</span>
            )}
          </div>
        </div>
        <div
          className="recommendation-score"
          style={{ backgroundColor: scoreColor }}
        >
          {Math.round(recommendation.recommendationScore)}
        </div>
      </div>

      {recommendation.travelStyles && recommendation.travelStyles.length > 0 && (
        <div className="travel-styles">
          {recommendation.travelStyles.map((style, index) => (
            <span key={index} className="travel-style-badge">
              {style}
            </span>
          ))}
        </div>
      )}

      {recommendation.interests && recommendation.interests.length > 0 && (
        <div className="interests">
          <strong>관심사:</strong>
          <div className="recommendation-tags">
            {recommendation.interests.map((interest, index) => (
              <span key={index} className="tag">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {recommendation.commonInterests &&
        recommendation.commonInterests.length > 0 && (
          <div className="common-interests">
            <strong>공통 관심사:</strong>
            <div className="recommendation-tags">
              {recommendation.commonInterests.map((interest, index) => (
                <span key={index} className="tag highlight">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

      <div className="recommendation-reasons">
        <strong>추천 이유:</strong>
        <ul>
          {recommendation.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>

      <div className="score-breakdown">
        <div className="score-label">{scoreLabel}</div>
        <div className="similarity-score">
          유사도: {Math.round(recommendation.similarityScore * 100)}%
        </div>
      </div>
    </div>
  );
};

interface ScoreBarProps {
  label: string;
  value: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, value }) => {
  const percentage = Math.round(value * 100);
  const color = getScoreColor(value * 100);

  return (
    <div className="score-bar-container">
      <div className="score-bar-label">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};
