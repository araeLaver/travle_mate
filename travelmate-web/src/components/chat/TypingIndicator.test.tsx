import { render, screen } from '@testing-library/react';
import TypingIndicator from './TypingIndicator';

describe('TypingIndicator', () => {
  const mockUsers = [
    { id: 1, nickname: '사용자1', profileImageUrl: 'https://example.com/profile1.jpg' },
    { id: 2, nickname: '사용자2', profileImageUrl: undefined },
    { id: 3, nickname: '사용자3', profileImageUrl: 'https://example.com/profile3.jpg' },
    { id: 4, nickname: '사용자4', profileImageUrl: undefined },
  ];

  test('빈 배열일 때 컴포넌트 미렌더링', () => {
    const { container } = render(<TypingIndicator typingUsers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('1명일 때 "○○○님이 입력 중" 표시', () => {
    render(<TypingIndicator typingUsers={[mockUsers[0]]} />);
    expect(screen.getByText('사용자1님이 입력 중')).toBeInTheDocument();
  });

  test('2명일 때 "○○○님, △△△님이 입력 중" 표시', () => {
    render(<TypingIndicator typingUsers={mockUsers.slice(0, 2)} />);
    expect(screen.getByText('사용자1님, 사용자2님이 입력 중')).toBeInTheDocument();
  });

  test('3명일 때 모든 이름 표시', () => {
    render(<TypingIndicator typingUsers={mockUsers.slice(0, 3)} />);
    expect(screen.getByText('사용자1, 사용자2, 사용자3님이 입력 중')).toBeInTheDocument();
  });

  test('4명 이상일 때 "외 N명" 표시', () => {
    render(<TypingIndicator typingUsers={mockUsers} />);
    expect(screen.getByText('사용자1, 사용자2 외 2명이 입력 중')).toBeInTheDocument();
  });

  test('maxDisplay 옵션 적용', () => {
    render(<TypingIndicator typingUsers={mockUsers.slice(0, 3)} maxDisplay={2} />);
    expect(screen.getByText('사용자1 외 2명이 입력 중')).toBeInTheDocument();
  });

  test('프로필 이미지 표시', () => {
    render(<TypingIndicator typingUsers={[mockUsers[0]]} />);
    const avatar = screen.getByAltText('사용자1');
    expect(avatar).toHaveAttribute('src', 'https://example.com/profile1.jpg');
  });

  test('프로필 이미지 없을 때 플레이스홀더 표시', () => {
    render(<TypingIndicator typingUsers={[mockUsers[1]]} />);
    expect(screen.getByText('사')).toBeInTheDocument(); // 첫 글자 대문자
  });

  test('타이핑 도트 애니메이션 요소 존재', () => {
    render(<TypingIndicator typingUsers={[mockUsers[0]]} />);
    const dots = document.querySelectorAll('.dot');
    expect(dots).toHaveLength(3);
  });

  test('다수의 아바타 표시', () => {
    render(<TypingIndicator typingUsers={mockUsers.slice(0, 3)} />);
    const avatars = document.querySelectorAll('.typing-avatar');
    expect(avatars).toHaveLength(3);
  });

  test('maxDisplay 초과 시 제한된 아바타만 표시', () => {
    render(<TypingIndicator typingUsers={mockUsers} maxDisplay={3} />);
    const avatars = document.querySelectorAll('.typing-avatar');
    expect(avatars).toHaveLength(3); // maxDisplay 만큼만
  });
});
