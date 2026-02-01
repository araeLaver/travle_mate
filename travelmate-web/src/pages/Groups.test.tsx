import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Groups from './Groups';
import { groupService, TravelGroup } from '../services/groupService';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('framer-motion', () => {
  const mockMotionProps = [
    'initial',
    'animate',
    'transition',
    'exit',
    'whileHover',
    'whileTap',
    'variants',
  ];
  const ReactModule = require('react');
  return {
    motion: new Proxy(
      {},
      {
        get: (_target: unknown, prop: string) => {
          return ({ children, ...rest }: { children?: unknown; [key: string]: unknown }) => {
            const validProps = Object.fromEntries(
              Object.entries(rest).filter(([key]) => !mockMotionProps.includes(key))
            );
            return ReactModule.createElement(prop, validProps, children);
          };
        },
      }
    ),
    AnimatePresence: ({ children }: { children: unknown }) => children,
  };
});

jest.mock('../services/groupService', () => ({
  groupService: {
    getAllGroups: jest.fn(),
    getMyGroups: jest.fn(),
    getRecommendedGroups: jest.fn(),
    searchGroups: jest.fn(),
    joinGroup: jest.fn(),
    leaveGroup: jest.fn(),
    getCurrentUserId: jest.fn().mockReturnValue('user-1'),
  },
  // Re-export TravelGroup type placeholder
}));

const mockToast = { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };
jest.mock('../components/Toast', () => ({
  useToast: () => mockToast,
}));

jest.mock('../utils/errorHandler', () => ({
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : 'Error'),
  logError: jest.fn(),
}));

jest.mock('../components/Logo', () => () => <div data-testid="logo">Logo</div>);
jest.mock('../components/ThemeToggle', () => () => (
  <div data-testid="theme-toggle">ThemeToggle</div>
));

const mockGroups: TravelGroup[] = [
  {
    id: 'g1',
    name: '제주도 힐링 여행',
    description: '제주도에서 힐링하는 여행입니다.',
    destination: '제주',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-03-05'),
    maxMembers: 6,
    currentMembers: 3,
    members: [
      {
        id: 'user-2',
        name: '김리더',
        role: 'leader',
        joinedAt: new Date(),
        profileImage: '',
        status: 'active',
      },
      {
        id: 'user-3',
        name: '박멤버',
        role: 'member',
        joinedAt: new Date(),
        profileImage: '',
        status: 'active',
      },
    ],
    tags: ['힐링', '자연', '맛집'],
    coverImage: 'https://example.com/jeju.jpg',
    createdBy: 'user-2',
    createdAt: new Date(),
    status: 'recruiting',
    budget: { min: 300000, max: 500000, currency: 'KRW' },
    travelStyle: '힐링여행',
    requirements: [],
  },
  {
    id: 'g2',
    name: '서울 문화탐방',
    description: '서울 유명 문화재 탐방',
    destination: '서울',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-04-03'),
    maxMembers: 4,
    currentMembers: 4,
    members: [
      {
        id: 'user-1',
        name: '나',
        role: 'member',
        joinedAt: new Date(),
        profileImage: '',
        status: 'active',
      },
      {
        id: 'user-4',
        name: '이리더',
        role: 'leader',
        joinedAt: new Date(),
        profileImage: '',
        status: 'active',
      },
    ],
    tags: ['문화', '역사'],
    createdBy: 'user-4',
    createdAt: new Date(),
    status: 'full',
    travelStyle: '문화탐방',
    requirements: [],
  },
];

const renderGroups = () =>
  render(
    <MemoryRouter>
      <Groups />
    </MemoryRouter>
  );

describe('Groups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (groupService.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
    (groupService.getMyGroups as jest.Mock).mockResolvedValue([mockGroups[1]]);
    (groupService.getRecommendedGroups as jest.Mock).mockResolvedValue([mockGroups[0]]);
    (groupService.searchGroups as jest.Mock).mockResolvedValue([]);
  });

  test('renders page header', async () => {
    renderGroups();
    expect(await screen.findByText('Travel Groups')).toBeInTheDocument();
  });

  test('renders group list after loading', async () => {
    renderGroups();
    // Default filter is status='recruiting', so only recruiting groups show
    expect(await screen.findByText('제주도 힐링 여행')).toBeInTheDocument();
  });

  test('shows loading state', async () => {
    (groupService.getAllGroups as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );
    renderGroups();
    await waitFor(() => {
      expect(screen.getByText('여행 그룹을 불러오는 중...')).toBeInTheDocument();
    });
  });

  test('shows empty state when no groups match', async () => {
    (groupService.getAllGroups as jest.Mock).mockResolvedValue([]);
    renderGroups();
    await waitFor(
      () => {
        expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test('renders search input', async () => {
    renderGroups();
    await screen.findByText('제주도 힐링 여행');
    expect(screen.getByPlaceholderText('그룹명, 목적지, 태그로 검색...')).toBeInTheDocument();
  });

  test('join button shown for non-member recruiting groups', async () => {
    renderGroups();
    expect(await screen.findByText('가입하기')).toBeInTheDocument();
  });

  test('calls joinGroup when join button clicked', async () => {
    (groupService.joinGroup as jest.Mock).mockResolvedValue(true);
    renderGroups();

    const joinButton = await screen.findByText('가입하기');
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(groupService.joinGroup).toHaveBeenCalledWith('g1');
    });
  });

  test('shows create group button', async () => {
    renderGroups();
    await screen.findByText('제주도 힐링 여행');
    expect(screen.getByText(/새 그룹 만들기/)).toBeInTheDocument();
  });

  test('navigates to create group page', async () => {
    renderGroups();
    await screen.findByText('제주도 힐링 여행');
    fireEvent.click(screen.getByText(/새 그룹 만들기/));
    expect(mockNavigate).toHaveBeenCalledWith('/groups/create');
  });
});
