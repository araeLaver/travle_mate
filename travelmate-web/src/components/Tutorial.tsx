import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Tutorial.css';

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
  path?: string;
  highlight?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: '트래블메이트에 오신 것을 환영합니다!',
    description: '여행을 함께할 메이트를 찾고, 그룹을 만들고, 실시간으로 소통할 수 있는 플랫폼입니다. 지금부터 주요 기능을 안내해드릴게요!',
    icon: '🌍',
  },
  {
    title: '대시보드',
    description: '위치 기반으로 주변에 있는 여행 메이트를 실시간으로 발견할 수 있어요. 매칭도를 확인하고 바로 채팅을 시작해보세요!',
    icon: '📍',
    path: '/dashboard',
  },
  {
    title: '여행 그룹',
    description: '관심있는 여행 그룹에 참여하거나 직접 그룹을 만들어보세요. 목적지, 여행 스타일, 예산 등으로 필터링할 수 있어요.',
    icon: '👥',
    path: '/groups',
  },
  {
    title: '실시간 채팅',
    description: '매칭된 메이트들과 1:1 또는 그룹 채팅으로 여행 계획을 세워보세요. 실시간 알림으로 메시지를 놓치지 마세요!',
    icon: '💬',
    path: '/chat',
  },
  {
    title: '프로필',
    description: '여행 스타일, 관심사, 방문 기록을 등록해두면 더 정확한 매칭을 받을 수 있어요.',
    icon: '👤',
    path: '/profile',
  },
  {
    title: '시작할 준비가 되셨나요?',
    description: '회원가입하고 나만의 여행 메이트를 찾아보세요! 비회원으로도 둘러보기가 가능하지만, 일부 기능은 로그인이 필요해요.',
    icon: '🚀',
  },
];

interface TutorialProps {
  onComplete: () => void;
  isOpen: boolean;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete, isOpen }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = tutorialSteps[currentStep + 1];
      if (nextStep.path) {
        navigate(nextStep.path);
      }
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (isAnimating || currentStep === 0) return;

    setIsAnimating(true);
    const prevStep = tutorialSteps[currentStep - 1];
    if (prevStep.path) {
      navigate(prevStep.path);
    }
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleGoToStep = (index: number) => {
    if (isAnimating) return;

    setIsAnimating(true);
    const step = tutorialSteps[index];
    if (step.path) {
      navigate(step.path);
    }
    setTimeout(() => {
      setCurrentStep(index);
      setIsAnimating(false);
    }, 300);
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="tutorial-overlay">
      <div className={`tutorial-modal ${isAnimating ? 'animating' : ''}`}>
        <button className="tutorial-skip" onClick={handleSkip}>
          건너뛰기 &times;
        </button>

        <div className="tutorial-content">
          <div className="tutorial-icon">{step.icon}</div>
          <h2 className="tutorial-title">{step.title}</h2>
          <p className="tutorial-description">{step.description}</p>
        </div>

        <div className="tutorial-progress">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => handleGoToStep(index)}
              aria-label={`Step ${index + 1}`}
            />
          ))}
        </div>

        <div className="tutorial-navigation">
          <button
            className="tutorial-btn secondary"
            onClick={handlePrev}
            disabled={isFirstStep}
          >
            이전
          </button>
          <span className="tutorial-step-count">
            {currentStep + 1} / {tutorialSteps.length}
          </span>
          <button
            className="tutorial-btn primary"
            onClick={handleNext}
          >
            {isLastStep ? '시작하기' : '다음'}
          </button>
        </div>

        {isLastStep && (
          <div className="tutorial-actions">
            <button
              className="tutorial-cta primary"
              onClick={() => { onComplete(); navigate('/register'); }}
            >
              회원가입하기
            </button>
            <button
              className="tutorial-cta secondary"
              onClick={() => { onComplete(); navigate('/login'); }}
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tutorial;
