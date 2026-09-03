import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import PageBackground from '../components/PageBackground';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const WalletConnect: React.FC = () => {
  const navigate = useNavigate();
  const {
    isConnected,
    isVerified,
    isConnecting,
    walletAddress,
    walletInfo,
    networkInfo,
    error,
    connect,
    disconnect,
    isMetaMaskInstalled,
    shortAddress,
  } = useWallet();

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const features = [
    { icon: '🎨', label: '여행지 NFT 수집' },
    { icon: '💰', label: '포인트로 거래' },
    { icon: '🏆', label: '업적 달성 보상' },
    { icon: '📊', label: '랭킹 시스템' },
  ];

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] relative overflow-hidden">
      <PageBackground />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <Logo size="sm" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">지갑 연결</h1>
          <ThemeToggle />
        </div>
      </motion.nav>

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* 연결 안내 */}
        {!isConnected && (
          <motion.div {...fadeInUp} className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 mx-auto mb-6 bg-primary-100 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center shadow-[0_10px_30px_rgba(16,16,20,0.1)]"
            >
              <span className="text-5xl">👛</span>
            </motion.div>

            <h2 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white mb-3">
              MetaMask 지갑 연결
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Fryndo NFT 시스템은 Polygon 네트워크를 사용합니다. MetaMask 지갑을 연결하여 NFT를
              수집하고 관리하세요.
            </p>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8"
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 border border-transparent dark:border-gray-700/50 flex items-center gap-3"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {feature.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {!isMetaMaskInstalled ? (
              <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
                <p className="text-amber-600 dark:text-amber-400 mb-4">
                  MetaMask가 설치되어 있지 않습니다.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-4 bg-primary-500 hover:bg-primary-700 text-white font-bold rounded-[15px] transition-colors"
                >
                  MetaMask 설치하기
                </a>
              </motion.div>
            ) : (
              <motion.button
                {...fadeInUp}
                transition={{ delay: 0.2 }}
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-8 py-4 bg-primary-500 hover:bg-primary-700 text-white font-bold rounded-[15px] shadow-[0_8px_22px_rgba(74,58,255,0.3)] transition-colors disabled:opacity-50 flex items-center gap-3 mx-auto"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    연결 중...
                  </>
                ) : (
                  <>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                      alt="MetaMask"
                      className="w-6 h-6"
                    />
                    MetaMask 연결하기
                  </>
                )}
              </motion.button>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-danger dark:text-red-400"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* 연결된 상태 */}
        {isConnected && (
          <motion.div {...fadeInUp} className="space-y-6">
            {/* 상태 배지 */}
            <div className="flex items-center justify-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  isVerified
                    ? 'bg-green-100 dark:bg-green-900/30 text-success dark:text-green-400'
                    : 'bg-[#FDF3E4] dark:bg-amber-900/30 text-rarity-legendary dark:text-amber-400'
                }`}
              >
                {isVerified ? '✓ 검증됨' : '⏳ 검증 대기'}
              </span>
              {networkInfo && (
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold ${
                    networkInfo.isTestnet
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400'
                      : 'bg-ink text-white'
                  }`}
                >
                  {networkInfo.name}
                </span>
              )}
            </div>

            {/* 지갑 카드 */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="bg-ink rounded-2xl p-6 text-white shadow-[0_10px_30px_rgba(16,16,20,0.1)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                  alt="MetaMask"
                  className="w-12 h-12"
                />
                <div>
                  <p className="text-sm text-[#A0A0AC]">지갑 주소</p>
                  <p className="font-mono font-medium" title={walletAddress || ''}>
                    {shortAddress}
                  </p>
                </div>
              </div>

              {walletInfo && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-sm text-[#A0A0AC]">잔액</p>
                    <p className="font-semibold">{walletInfo.balanceFormatted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#A0A0AC]">수집한 NFT</p>
                    <p className="font-semibold">{walletInfo.nftCount}개</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#A0A0AC]">네트워크</p>
                    <p className="font-semibold">{walletInfo.networkName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#A0A0AC]">Chain ID</p>
                    <p className="font-semibold">{walletInfo.chainId}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* 네트워크 정보 */}
            {networkInfo && (
              <motion.div
                {...fadeInUp}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-transparent dark:border-gray-700/50"
              >
                <h4 className="font-semibold text-gray-800 dark:text-white mb-4">네트워크 정보</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">컨트랙트</span>
                    <span className="font-mono text-gray-800 dark:text-white">
                      {networkInfo.contractAddress
                        ? `${networkInfo.contractAddress.slice(0, 10)}...${networkInfo.contractAddress.slice(-8)}`
                        : '미설정'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">통화</span>
                    <span className="text-gray-800 dark:text-white">
                      {networkInfo.currencySymbol}
                    </span>
                  </div>
                  {networkInfo.blockExplorerUrl && (
                    <a
                      href={networkInfo.blockExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-500 dark:text-primary-400 hover:underline"
                    >
                      블록 탐색기 열기 →
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* 액션 버튼 */}
            <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className="space-y-3">
              <button
                onClick={() => navigate('/nft')}
                className="w-full py-4 bg-primary-500 hover:bg-primary-700 text-white font-bold rounded-[15px] transition-colors"
              >
                NFT 수집하러 가기
              </button>
              <button
                onClick={() => navigate('/nft/collection')}
                className="w-full py-4 bg-sand-200 dark:bg-gray-800 text-ink dark:text-white font-bold rounded-[15px] hover:bg-sand-300 dark:hover:bg-gray-700 transition-colors"
              >
                내 컬렉션 보기
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full py-4 bg-white dark:bg-red-900/20 border-[1.5px] border-[#F0D6D3] text-danger dark:text-red-400 font-bold rounded-[15px] hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                연결 해제
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* 안내 섹션 */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-transparent dark:border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <span>💜</span> Polygon 네트워크란?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Polygon은 이더리움과 호환되는 레이어2 블록체인으로, 빠른 트랜잭션 속도와 저렴한 가스비를
            제공합니다. Fryndo는 Polygon Amoy 테스트넷을 사용합니다.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <span>🪙</span> 테스트넷 MATIC 받기
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            NFT를 민팅하려면 소량의 MATIC이 필요합니다.{' '}
            <a
              href="https://faucet.polygon.technology/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 dark:text-primary-400 hover:underline"
            >
              Polygon Faucet
            </a>
            에서 무료로 테스트넷 MATIC을 받을 수 있습니다.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default WalletConnect;
