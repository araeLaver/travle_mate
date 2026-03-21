import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NFTCollection from './NFTCollection';

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

const mockCollections = [
  {
    id: 1,
    location: {
      id: 101,
      name: '경복궁',
      city: '서울',
      country: '대한민국',
      rarity: 'RARE' as const,
      nftImageUrl: 'https://example.com/nft1.jpg',
      imageUrl: 'https://example.com/img1.jpg',
    },
    earnedPoints: 50,
    collectedAt: '2025-01-10T10:00:00Z',
    mintStatus: 'PENDING' as const,
    tokenId: null,
  },
  {
    id: 2,
    location: {
      id: 102,
      name: '해운대',
      city: '부산',
      country: '대한민국',
      rarity: 'LEGENDARY' as const,
      nftImageUrl: null,
      imageUrl: 'https://example.com/img2.jpg',
    },
    earnedPoints: 200,
    collectedAt: '2025-01-12T14:00:00Z',
    mintStatus: 'MINTED' as const,
    tokenId: '0x123abc',
  },
];

jest.mock('../services/nftService', () => ({
  nftService: {
    getMyCollection: jest.fn(),
    getCollectionBook: jest.fn(),
  },
}));

jest.mock('../services/achievementService', () => ({
  achievementService: {
    getMyAchievements: jest.fn(),
  },
}));

jest.mock('../services/mintingService', () => ({
  mintingService: {
    getPolygonscanTxUrl: (tokenId: string) => `https://polygonscan.com/tx/${tokenId}`,
  },
  getMintStatusLabel: (status: string) => {
    const map: Record<string, string> = {
      PENDING: '대기',
      MINTING: '민팅중',
      MINTED: '완료',
      FAILED: '실패',
    };
    return map[status] || status;
  },
  getMintStatusColor: () => '#888',
}));

jest.mock('../hooks/useWallet', () => ({
  useWallet: () => ({
    isConnected: false,
    walletAddress: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

jest.mock(
  '../components/nft/MintingModal',
  () => (props: { locationName: string; onClose: () => void }) => (
    <div data-testid="minting-modal">
      <span>{props.locationName}</span>
      <button onClick={props.onClose}>Close</button>
    </div>
  )
);

const mockToast = { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };
jest.mock('../components/Toast', () => ({
  useToast: () => mockToast,
}));

jest.mock('../components/Logo', () => () => <div data-testid="logo">Logo</div>);
jest.mock('../components/ThemeToggle', () => () => (
  <div data-testid="theme-toggle">ThemeToggle</div>
));

// eslint-disable-next-line import/first
import { nftService } from '../services/nftService';
// eslint-disable-next-line import/first
import { achievementService } from '../services/achievementService';

const renderNFTCollection = () =>
  render(
    <MemoryRouter>
      <NFTCollection />
    </MemoryRouter>
  );

describe('NFTCollection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (nftService.getMyCollection as jest.Mock).mockResolvedValue({
      content: mockCollections,
      last: true,
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      empty: false,
    });
    (nftService.getCollectionBook as jest.Mock).mockResolvedValue({
      stats: {
        completionRate: 25.0,
        collectedLocations: 2,
        totalLocations: 8,
        commonCollected: 0,
        rareCollected: 1,
        epicCollected: 0,
        legendaryCollected: 1,
      },
      regions: [
        { region: '서울', country: '대한민국', collected: 1, total: 4, completionRate: 25 },
      ],
    });
    (achievementService.getMyAchievements as jest.Mock).mockResolvedValue([]);
  });

  test('renders page title', async () => {
    renderNFTCollection();
    expect(await screen.findByText('내 NFT')).toBeInTheDocument();
  });

  test('renders tabs', async () => {
    renderNFTCollection();
    await screen.findByText('내 NFT');
    expect(screen.getByText('컬렉션')).toBeInTheDocument();
    expect(screen.getByText('도감')).toBeInTheDocument();
    expect(screen.getByText('업적')).toBeInTheDocument();
  });

  test('renders NFT grid with items', async () => {
    renderNFTCollection();
    expect(await screen.findByText('경복궁')).toBeInTheDocument();
    expect(screen.getByText('해운대')).toBeInTheDocument();
  });

  test('shows NFT metadata', async () => {
    renderNFTCollection();
    await screen.findByText('경복궁');

    // Check location info
    expect(screen.getByText(/서울, 대한민국/)).toBeInTheDocument();
    expect(screen.getByText(/부산, 대한민국/)).toBeInTheDocument();

    // Check points
    expect(screen.getByText(/50P/)).toBeInTheDocument();
    expect(screen.getByText(/200P/)).toBeInTheDocument();
  });

  test('shows rarity filter buttons', async () => {
    renderNFTCollection();
    await screen.findByText('경복궁');

    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('레어')).toBeInTheDocument();
    expect(screen.getByText('전설')).toBeInTheDocument();
  });

  test('shows empty collection message when no NFTs', async () => {
    (nftService.getMyCollection as jest.Mock).mockResolvedValue({
      content: [],
      last: true,
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20,
      first: true,
      empty: true,
    });

    renderNFTCollection();
    expect(await screen.findByText('수집한 NFT가 없습니다')).toBeInTheDocument();
  });

  test('shows mint button for pending NFTs', async () => {
    renderNFTCollection();
    expect(await screen.findByText(/민팅하기/)).toBeInTheDocument();
  });

  test('shows Polygonscan link for minted NFTs', async () => {
    renderNFTCollection();
    expect(await screen.findByText(/Polygonscan/)).toBeInTheDocument();
  });

  test('shows token ID for minted NFTs', async () => {
    renderNFTCollection();
    expect(await screen.findByText('#0x123abc')).toBeInTheDocument();
  });

  test('shows empty achievements message', async () => {
    renderNFTCollection();
    await screen.findByText('경복궁');

    fireEvent.click(screen.getByText('업적'));

    expect(await screen.findByText('아직 업적이 없습니다')).toBeInTheDocument();
  });
});
