import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MintingModal from './MintingModal';
import { mintingService } from '../../services/mintingService';
import * as useWalletHook from '../../hooks/useWallet';

// Mock services and hooks
jest.mock('../../services/mintingService', () => ({
  mintingService: {
    getMintingStatus: jest.fn(),
    requestMinting: jest.fn(),
    retryMinting: jest.fn(),
    getPolygonscanTxUrl: jest.fn((hash) => `https://polygonscan.com/tx/${hash}`),
    getOpenseaUrl: jest.fn((contract, tokenId) => `https://opensea.io/assets/matic/${contract}/${tokenId}`),
  },
}));

jest.mock('../../hooks/useWallet');

const mockGetMintingStatus = mintingService.getMintingStatus as jest.Mock;
const mockRequestMinting = mintingService.requestMinting as jest.Mock;
const mockRetryMinting = mintingService.retryMinting as jest.Mock;
const mockUseWallet = useWalletHook.useWallet as jest.Mock;

describe('MintingModal', () => {
  const defaultProps = {
    collectionId: 1,
    locationName: '경복궁',
    nftImageUrl: 'https://example.com/nft.jpg',
    rarity: 'EPIC',
    currentMintStatus: 'PENDING' as const,
    onClose: jest.fn(),
    onMintingComplete: jest.fn(),
  };

  const mockWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseWallet.mockReturnValue({
      isConnected: false,
      walletAddress: null,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'PENDING',
      transactionHash: null,
      tokenId: null,
      contractAddress: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('모달 렌더링 및 NFT 정보 표시', async () => {
    render(<MintingModal {...defaultProps} />);

    expect(screen.getByText('NFT 민팅')).toBeInTheDocument();
    expect(screen.getByText('경복궁')).toBeInTheDocument();
    expect(screen.getByText('EPIC')).toBeInTheDocument();

    const nftImage = screen.getByAltText('경복궁');
    expect(nftImage).toHaveAttribute('src', 'https://example.com/nft.jpg');
  });

  test('NFT 이미지 없을 때 플레이스홀더 표시', async () => {
    render(<MintingModal {...defaultProps} nftImageUrl={null} />);

    const placeholder = document.querySelector('.nft-placeholder');
    expect(placeholder).toBeInTheDocument();
  });

  test('지갑 미연결 시 연결 버튼 표시', async () => {
    render(<MintingModal {...defaultProps} />);

    const connectBtn = document.querySelector('.action-btn.primary');
    expect(connectBtn).toHaveTextContent('지갑 연결');
    expect(screen.getByText('지갑을 연결하여 민팅을 시작하세요.')).toBeInTheDocument();
  });

  test('지갑 연결 버튼 클릭', async () => {
    const mockConnect = jest.fn().mockResolvedValue(undefined);
    mockUseWallet.mockReturnValue({
      isConnected: false,
      walletAddress: null,
      connect: mockConnect,
      isConnecting: false,
    });

    render(<MintingModal {...defaultProps} />);

    const connectBtn = document.querySelector('.action-btn.primary');
    fireEvent.click(connectBtn!);

    expect(mockConnect).toHaveBeenCalled();
  });

  test('지갑 연결 중 상태 표시', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: false,
      walletAddress: null,
      connect: jest.fn(),
      isConnecting: true,
    });

    render(<MintingModal {...defaultProps} />);

    expect(screen.getByText('연결 중...')).toBeInTheDocument();
  });

  test('지갑 연결 후 민팅 버튼 표시', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    render(<MintingModal {...defaultProps} />);

    expect(screen.getByText('NFT 민팅하기')).toBeInTheDocument();
    expect(screen.getByText('민팅 버튼을 눌러 NFT를 블록체인에 기록하세요.')).toBeInTheDocument();
  });

  test('지갑 주소 표시', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    render(<MintingModal {...defaultProps} />);

    // 주소 축약 형태 확인 (0x1234...5678)
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
  });

  test('민팅 버튼 클릭 시 민팅 요청', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });
    mockRequestMinting.mockResolvedValueOnce({});

    render(<MintingModal {...defaultProps} />);

    const mintBtn = screen.getByText('NFT 민팅하기');
    fireEvent.click(mintBtn);

    await waitFor(() => {
      expect(mockRequestMinting).toHaveBeenCalledWith(1, mockWalletAddress);
    });
  });

  test('민팅 진행 중 상태 표시 (MINTING)', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'MINTING',
      transactionHash: '0xabcdef',
      tokenId: null,
      contractAddress: null,
    });

    render(<MintingModal {...defaultProps} currentMintStatus="MINTING" />);

    await waitFor(() => {
      expect(screen.getByText('블록체인에 NFT를 기록하고 있습니다...')).toBeInTheDocument();
    });
  });

  test('트랜잭션 확인 중 상태 표시 (CONFIRMING)', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'CONFIRMING',
      transactionHash: '0xabcdef',
      tokenId: null,
      contractAddress: null,
    });

    render(<MintingModal {...defaultProps} currentMintStatus="CONFIRMING" />);

    await waitFor(() => {
      expect(screen.getByText('트랜잭션 확인 중입니다...')).toBeInTheDocument();
    });
  });

  test('민팅 완료 상태 표시 (MINTED)', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'MINTED',
      transactionHash: '0xabcdef123456',
      tokenId: '42',
      contractAddress: '0xcontract123',
    });

    render(<MintingModal {...defaultProps} currentMintStatus="MINTED" />);

    await waitFor(() => {
      expect(screen.getByText('민팅이 완료되었습니다!')).toBeInTheDocument();
      expect(screen.getByText('Token ID: 42')).toBeInTheDocument();
    });
  });

  test('민팅 완료 시 트랜잭션 링크 표시', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'MINTED',
      transactionHash: '0xabcdef123456',
      tokenId: '42',
      contractAddress: '0xcontract123',
    });

    render(<MintingModal {...defaultProps} currentMintStatus="MINTED" />);

    await waitFor(() => {
      expect(screen.getByText('Polygonscan에서 보기')).toBeInTheDocument();
      expect(screen.getByText('OpenSea에서 보기')).toBeInTheDocument();
    });
  });

  test('민팅 실패 상태 및 재시도 버튼 표시', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'FAILED',
      transactionHash: null,
      tokenId: null,
      contractAddress: null,
    });

    render(<MintingModal {...defaultProps} currentMintStatus="FAILED" />);

    await waitFor(() => {
      expect(screen.getByText('민팅에 실패했습니다.')).toBeInTheDocument();
      expect(screen.getByText('민팅 재시도')).toBeInTheDocument();
    });
  });

  test('재시도 버튼 클릭', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'FAILED',
      transactionHash: null,
      tokenId: null,
      contractAddress: null,
    });
    mockRetryMinting.mockResolvedValueOnce({});

    render(<MintingModal {...defaultProps} currentMintStatus="FAILED" />);

    await waitFor(() => {
      expect(screen.getByText('민팅 재시도')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('민팅 재시도'));

    await waitFor(() => {
      expect(mockRetryMinting).toHaveBeenCalledWith(1);
    });
  });

  test('진행 단계 표시', async () => {
    render(<MintingModal {...defaultProps} />);

    const steps = document.querySelectorAll('.step-label');
    const stepTexts = Array.from(steps).map(s => s.textContent);
    expect(stepTexts).toContain('지갑 연결');
    expect(stepTexts).toContain('민팅 요청');
    expect(stepTexts).toContain('블록체인 처리');
    expect(stepTexts).toContain('완료');
  });

  test('닫기 버튼 동작', async () => {
    const mockOnClose = jest.fn();
    render(<MintingModal {...defaultProps} onClose={mockOnClose} />);

    const closeBtn = document.querySelector('.close-btn');
    fireEvent.click(closeBtn!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('오버레이 클릭 시 닫기', async () => {
    const mockOnClose = jest.fn();
    render(<MintingModal {...defaultProps} onClose={mockOnClose} />);

    const overlay = document.querySelector('.minting-modal-overlay');
    fireEvent.click(overlay!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('모달 내부 클릭 시 닫히지 않음', async () => {
    const mockOnClose = jest.fn();
    render(<MintingModal {...defaultProps} onClose={mockOnClose} />);

    const modal = document.querySelector('.minting-modal');
    fireEvent.click(modal!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('완료 상태에서 닫기 버튼 표시', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'MINTED',
      transactionHash: '0xabcdef',
      tokenId: '42',
      contractAddress: '0xcontract',
    });

    render(<MintingModal {...defaultProps} currentMintStatus="MINTED" />);

    await waitFor(() => {
      const closeActionBtn = screen.getByRole('button', { name: '닫기' });
      expect(closeActionBtn).toHaveClass('action-btn');
    });
  });

  test('레어리티 색상 적용', async () => {
    render(<MintingModal {...defaultProps} rarity="LEGENDARY" />);

    const badge = document.querySelector('.rarity-badge');
    expect(badge).toHaveStyle('background-color: rgb(245, 158, 11)');
  });

  test('지갑 미연결 상태에서 민팅 시도 시 에러 메시지', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: null, // 주소 없음
      connect: jest.fn(),
      isConnecting: false,
    });

    mockGetMintingStatus.mockResolvedValue({
      mintStatus: 'PENDING',
      transactionHash: null,
      tokenId: null,
      contractAddress: null,
    });

    render(<MintingModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('NFT 민팅하기')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('NFT 민팅하기'));

    await waitFor(() => {
      expect(screen.getByText('지갑을 먼저 연결해주세요.')).toBeInTheDocument();
    });
  });

  test('민팅 요청 실패 시 에러 메시지 표시', async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      walletAddress: mockWalletAddress,
      connect: jest.fn(),
      isConnecting: false,
    });

    mockRequestMinting.mockRejectedValueOnce(new Error('네트워크 오류'));

    render(<MintingModal {...defaultProps} />);

    fireEvent.click(screen.getByText('NFT 민팅하기'));

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    });
  });

  test('지갑 연결 실패 시 에러 메시지 표시', async () => {
    const mockConnect = jest.fn().mockRejectedValue(new Error('MetaMask를 찾을 수 없습니다.'));
    mockUseWallet.mockReturnValue({
      isConnected: false,
      walletAddress: null,
      connect: mockConnect,
      isConnecting: false,
    });

    render(<MintingModal {...defaultProps} />);

    const connectBtn = document.querySelector('.action-btn.primary');
    fireEvent.click(connectBtn!);

    await waitFor(() => {
      expect(screen.getByText('MetaMask를 찾을 수 없습니다.')).toBeInTheDocument();
    });
  });
});
