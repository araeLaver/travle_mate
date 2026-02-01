import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Payment from './Payment';

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

jest.mock('../services/paymentService', () => ({
  paymentService: {
    getPointProducts: jest.fn(),
    getSubscriptionProducts: jest.fn(),
    getSubscriptionInfo: jest.fn(),
    getPaymentHistory: jest.fn(),
    applyCoupon: jest.fn(),
    preparePayment: jest.fn(),
    cancelSubscription: jest.fn(),
    formatCurrency: (amount: number) => `${amount.toLocaleString()}원`,
    formatDateTime: (date: string) => date,
    formatDate: (date: string) => date,
    getPaymentStatusLabel: (status: string) => {
      const map: Record<string, string> = {
        COMPLETED: '결제완료',
        PENDING: '대기중',
        FAILED: '실패',
      };
      return map[status] || status;
    },
    getSubscriptionTierInfo: (tier: string) => ({ icon: '⭐', name: tier }),
    getDaysRemaining: () => 30,
    calculateYearlySavings: (monthly: number, yearly: number) => monthly * 12 - yearly,
  },
  // Re-export types
}));

jest.mock('../components/Logo', () => () => <div data-testid="logo">Logo</div>);
jest.mock('../components/ThemeToggle', () => () => (
  <div data-testid="theme-toggle">ThemeToggle</div>
));

// eslint-disable-next-line import/first
import { paymentService } from '../services/paymentService';

const mockPointProducts = [
  {
    productId: 'p1',
    name: '100 포인트',
    points: 100,
    price: 1000,
    originalPrice: 1000,
    discountPercent: 0,
    isBestValue: false,
  },
  {
    productId: 'p2',
    name: '500 포인트',
    points: 500,
    price: 4000,
    originalPrice: 5000,
    discountPercent: 20,
    isBestValue: true,
    badge: 'HOT',
  },
];

const renderPayment = () =>
  render(
    <MemoryRouter>
      <Payment />
    </MemoryRouter>
  );

describe('Payment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (paymentService.getPointProducts as jest.Mock).mockResolvedValue(mockPointProducts);
    (paymentService.getSubscriptionProducts as jest.Mock).mockResolvedValue([]);
    (paymentService.getSubscriptionInfo as jest.Mock).mockResolvedValue({
      tier: 'FREE',
      status: 'ACTIVE',
      activeFeatures: [],
    });
    (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
    });
  });

  test('renders payment page header', async () => {
    renderPayment();
    expect(await screen.findByText('결제')).toBeInTheDocument();
    expect(screen.getByText('포인트 충전 및 프리미엄 구독 관리')).toBeInTheDocument();
  });

  test('renders tabs', async () => {
    renderPayment();
    await screen.findByText('결제');
    expect(screen.getByText('포인트 충전')).toBeInTheDocument();
    expect(screen.getByText('구독 관리')).toBeInTheDocument();
    expect(screen.getByText('결제 내역')).toBeInTheDocument();
  });

  test('renders point products after loading', async () => {
    renderPayment();
    expect(await screen.findByText('100 포인트')).toBeInTheDocument();
    expect(screen.getByText('500 포인트')).toBeInTheDocument();
    expect(screen.getByText('BEST VALUE')).toBeInTheDocument();
  });

  test('shows discount info for discounted products', async () => {
    renderPayment();
    expect(await screen.findByText('20% 할인')).toBeInTheDocument();
  });

  test('shows empty history message', async () => {
    renderPayment();
    await screen.findByText('100 포인트');

    fireEvent.click(screen.getByText('결제 내역'));

    expect(await screen.findByText('결제 내역이 없습니다')).toBeInTheDocument();
  });

  test('shows payment history table when data exists', async () => {
    (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue({
      content: [
        {
          orderId: 'order-1',
          productName: '100 포인트',
          amount: 1000,
          status: 'COMPLETED',
          createdAt: '2025-01-01',
          productType: 'POINTS',
          paymentMethod: 'CARD',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    });

    renderPayment();
    await screen.findByText('100 포인트');

    fireEvent.click(screen.getByText('결제 내역'));

    expect(await screen.findByText('결제완료')).toBeInTheDocument();
    expect(screen.getByText('order-1')).toBeInTheDocument();
  });

  test('selecting a product shows purchase panel', async () => {
    renderPayment();
    const product = await screen.findByText('100 포인트');
    fireEvent.click(product);

    expect(await screen.findByText('결제하기')).toBeInTheDocument();
    expect(screen.getByText('선택한 상품')).toBeInTheDocument();
  });
});
