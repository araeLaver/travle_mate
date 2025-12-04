import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Tutorial.css';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  path: string;
  targetSelector: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'TravelMate에 오신 것을 환영합니다!',
    description:
      'TravelMate는 당신의 완벽한 여행 동반자를 찾아주는 스마트한 매칭 서비스입니다. 튜토리얼을 통해 주요 기능들을 둘러보세요! 하이라이트된 영역을 클릭하여 다음 단계로 진행하세요.',
    path: '/',
    targetSelector: '.tutorial-guest-mode-btn',
    position: 'bottom',
  },
  {
    id: 2,
    title: '대시보드',
    description: '여기서 주변 여행 메이트를 발견하고 매칭할 수 있어요. 주변 메이트 발견 버튼을 확인해보세요!',
    path: '/dashboard',
    targetSelector: '.discovery-btn',
    position: 'top',
  },
  {
    id: 3,
    title: '여행 그룹',
    description: '다양한 여행 그룹을 확인하고 참여할 수 있어요. 관심 있는 그룹에 참여해보세요!',
    path: '/groups',
    targetSelector: '.card, [class*="tab"], [role="tablist"]',
    position: 'bottom',
  },
  {
    id: 4,
    title: '채팅',
    description: '매칭된 메이트들과 실시간으로 대화할 수 있어요. 채팅방 목록을 확인해보세요!',
    path: '/chat',
    targetSelector: '.card, [class*="chat"], [class*="room"]',
    position: 'right',
  },
  {
    id: 5,
    title: '내 프로필',
    description: '프로필을 등록하면 더 정확한 매칭을 받을 수 있어요. 여행 스타일과 관심사를 설정해보세요!',
    path: '/profile',
    targetSelector: '.card, [class*="profile"], [class*="avatar"]',
    position: 'bottom',
  },
];

interface TutorialProps {
  onComplete: () => void;
  isOpen: boolean;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete, isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false); // 페이지 로드 완료 후 true
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tutorialSteps[currentStep];

  // 현재 스텝의 타겟 요소 찾기
  const findTargetElement = useCallback((): Element | null => {
    if (!step) return null;

    // 여러 셀렉터를 시도
    const selectors = step.targetSelector.split(', ');
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch {
        // 잘못된 셀렉터 무시
      }
    }

    // 폴백: 메인 컨텐츠 영역
    return document.querySelector('main') || document.querySelector('.container');
  }, [step]);

  // 하이라이트 적용
  const applyHighlight = useCallback(() => {
    // 이전 하이라이트 제거
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    const target = findTargetElement();
    if (target) {
      target.classList.add('tutorial-highlight');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 약간의 딜레이 후 위치 계산 (스크롤 완료 대기)
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        setIsReady(true);
      }, 300);
    } else {
      setIsReady(true);
    }
  }, [findTargetElement]);

  // 튜토리얼 시작 시 또는 스텝 변경 시 페이지 이동
  useEffect(() => {
    if (!isOpen || !step) return;

    setIsReady(false);
    setTargetRect(null);

    // 현재 경로와 스텝 경로가 다르면 이동
    if (location.pathname !== step.path) {
      navigate(step.path);
    } else {
      // 이미 올바른 페이지에 있으면 바로 하이라이트 적용
      const timer = setTimeout(applyHighlight, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep, step, location.pathname, navigate, applyHighlight]);

  // 페이지 이동 완료 후 하이라이트 적용
  useEffect(() => {
    if (!isOpen || !step) return;
    if (location.pathname !== step.path) return;

    const timer = setTimeout(applyHighlight, 500);
    return () => clearTimeout(timer);
  }, [isOpen, step, location.pathname, applyHighlight]);

  // 창 리사이즈/스크롤 시 위치 업데이트
  useEffect(() => {
    if (!isOpen || !isReady) return;

    const updatePosition = () => {
      const target = findTargetElement();
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, isReady, findTargetElement]);

  // 다음 스텝으로 이동
  const goToNextStep = useCallback(() => {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // 완료
      localStorage.setItem('tutorialCompleted', 'true');
      setCurrentStep(0);
      setIsReady(false);
      onComplete();
      navigate('/');
    }
  }, [currentStep, navigate, onComplete]);

  // 이전 스텝으로 이동
  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // 튜토리얼 종료
  const handleComplete = useCallback(() => {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    localStorage.setItem('tutorialCompleted', 'true');
    setCurrentStep(0);
    setIsReady(false);
    onComplete();
    navigate('/');
  }, [navigate, onComplete]);

  // 하이라이트된 요소 클릭 시 다음 스텝
  useEffect(() => {
    if (!isOpen || !isReady) return;

    const handleHighlightClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('tutorial-highlight') || target.closest('.tutorial-highlight')) {
        e.preventDefault();
        e.stopPropagation();
        goToNextStep();
      }
    };

    document.addEventListener('click', handleHighlightClick, true);
    return () => {
      document.removeEventListener('click', handleHighlightClick, true);
    };
  }, [isOpen, isReady, goToNextStep]);

  // 컴포넌트 언마운트 시 하이라이트 제거
  useEffect(() => {
    return () => {
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, []);

  // 튜토리얼이 열려있지 않거나 준비되지 않았으면 렌더링하지 않음
  if (!isOpen || !isReady) return null;

  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // 툴팁 위치 계산
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    }

    const position = step?.position || 'bottom';
    const tooltipWidth = 320;
    const tooltipHeight = 220;
    const margin = 20;

    let top: number;
    let left: number;

    switch (position) {
      case 'top':
        top = Math.max(margin, targetRect.top - tooltipHeight - margin);
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - margin;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + margin;
        break;
      default:
        top = targetRect.bottom + margin;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    }

    // 화면 밖으로 나가지 않도록 조정
    left = Math.min(window.innerWidth - tooltipWidth - margin, Math.max(margin, left));
    top = Math.min(window.innerHeight - tooltipHeight - margin, Math.max(margin, top));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  return (
    <>
      {/* 반투명 오버레이 */}
      <div className="tutorial-overlay" />

      {/* 툴팁 */}
      <div
        ref={tooltipRef}
        className="tutorial-tooltip-inline"
        style={getTooltipStyle()}
      >
        <div className="tutorial-header">
          <span className="tutorial-step-badge">
            {currentStep + 1} / {tutorialSteps.length}
          </span>
          <button className="tutorial-close" onClick={handleComplete} type="button">
            &times;
          </button>
        </div>

        <div className="tutorial-body">
          <h3 className="tutorial-title">{step?.title}</h3>
          <p className="tutorial-description">{step?.description}</p>
          <div className="tutorial-click-hint">
            하이라이트된 영역을 클릭하거나 '다음' 버튼을 눌러주세요
          </div>
        </div>

        <div className="tutorial-footer">
          <button
            className="tutorial-btn secondary"
            onClick={goToPrevStep}
            disabled={isFirstStep}
            type="button"
          >
            이전
          </button>
          <div className="tutorial-dots">
            {tutorialSteps.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button className="tutorial-btn primary" onClick={goToNextStep} type="button">
            {isLastStep ? '완료' : '다음'}
          </button>
        </div>

        <button className="tutorial-skip" onClick={handleComplete} type="button">
          튜토리얼 건너뛰기
        </button>
      </div>
    </>
  );
};

export default Tutorial;
