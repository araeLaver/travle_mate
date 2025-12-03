import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TutorialContextType {
  isOpen: boolean;
  startTutorial: () => void;
  completeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const startTutorial = useCallback(() => {
    // 비회원 둘러보기 모드 설정
    localStorage.setItem('guestMode', 'true');
    localStorage.removeItem('tutorialCompleted');
    setIsOpen(true);
  }, []);

  const completeTutorial = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem('tutorialCompleted', 'true');
  }, []);

  return (
    <TutorialContext.Provider value={{ isOpen, startTutorial, completeTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
};
