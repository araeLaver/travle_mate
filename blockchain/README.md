# Fryndo NFT Smart Contracts

Polygon 네트워크용 위치 기반 NFT 수집 스마트 컨트랙트

## 개요

Fryndo NFT는 사용자가 특정 장소를 방문하여 수집하는 위치 기반 NFT입니다.

### 주요 기능

- ERC721 표준 NFT
- 위치 메타데이터 온체인 저장
- 장소별 최대 발행량 설정
- 역할 기반 접근 제어 (Admin, Minter, Pauser)
- 일시 정지 기능
- 소각 기능

## 설치

```bash
cd blockchain
npm install
```

## 환경 설정

```bash
cp .env.example .env
```

`.env` 파일 설정:

```env
# 배포자 지갑 개인키 (0x 없이)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Alchemy API 키
ALCHEMY_API_KEY=your_alchemy_api_key

# PolygonScan API 키 (컨트랙트 검증용)
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## 컴파일

```bash
npm run compile
```

## 테스트

```bash
# 테스트 실행
npm test

# 커버리지
npm run test:coverage
```

## 배포

### 로컬 테스트넷

```bash
# 터미널 1: 로컬 노드 실행
npm run node

# 터미널 2: 배포
npm run deploy:local
```

### Polygon Amoy 테스트넷

```bash
npm run deploy:amoy
```

### Polygon 메인넷

```bash
npm run deploy:polygon
```

## 컨트랙트 검증

```bash
# Amoy 테스트넷
npm run verify:amoy

# 메인넷
npm run verify:polygon
```

## 컨트랙트 구조

### TravelMateNFT.sol

```solidity
contract TravelMateNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    ERC721Pausable,
    ERC721Burnable,
    AccessControl,
    ReentrancyGuard
```

### 역할 (Roles)

| 역할 | 권한 |
|------|------|
| `DEFAULT_ADMIN_ROLE` | 역할 관리 |
| `ADMIN_ROLE` | 설정 변경, 메타데이터 업데이트 |
| `MINTER_ROLE` | NFT 민팅 |
| `PAUSER_ROLE` | 컨트랙트 일시정지 |

### 주요 함수

#### 민팅

```solidity
// 기본 민팅
function mintNFT(address to, string memory uri) returns (uint256)

// 위치 메타데이터 포함 민팅
function mintNFTWithLocation(
    address to,
    string memory uri,
    uint256 locationId,
    string memory locationName,
    string memory rarity,
    int256 latitude,
    int256 longitude
) returns (uint256)
```

#### 조회

```solidity
// 위치 메타데이터 조회
function getLocationMetadata(uint256 tokenId) returns (LocationMetadata)

// 장소별 민팅 수량 조회
function getLocationMintCount(uint256 locationId) returns (uint256)

// 소유자의 모든 토큰 조회
function tokensOfOwner(address owner) returns (uint256[])
```

#### 관리

```solidity
// 장소별 최대 발행량 설정
function setLocationMaxSupply(uint256 locationId, uint256 maxSupply)

// 토큰 URI 업데이트
function updateTokenURI(uint256 tokenId, string memory newUri)

// 일시정지
function pause()
function unpause()
```

## 메타데이터 형식 (IPFS)

```json
{
  "name": "Seoul Tower",
  "description": "서울의 랜드마크 N서울타워에서 수집한 NFT",
  "image": "ipfs://QmXxx.../image.png",
  "external_url": "https://fryndo.app/locations/1",
  "attributes": [
    {
      "trait_type": "Location",
      "value": "Seoul Tower"
    },
    {
      "trait_type": "Rarity",
      "value": "LEGENDARY"
    },
    {
      "trait_type": "Category",
      "value": "LANDMARK"
    },
    {
      "display_type": "number",
      "trait_type": "Latitude",
      "value": 37.5512
    },
    {
      "display_type": "number",
      "trait_type": "Longitude",
      "value": 126.9882
    },
    {
      "display_type": "date",
      "trait_type": "Collected At",
      "value": 1705305600
    }
  ]
}
```

## 네트워크 정보

### Polygon Amoy 테스트넷

- Chain ID: 80002
- RPC: https://polygon-amoy.g.alchemy.com/v2/{API_KEY}
- Explorer: https://amoy.polygonscan.com
- Faucet: https://faucet.polygon.technology

### Polygon 메인넷

- Chain ID: 137
- RPC: https://polygon-mainnet.g.alchemy.com/v2/{API_KEY}
- Explorer: https://polygonscan.com

## 백엔드 연동

배포 후 백엔드 환경 변수 업데이트:

```env
BLOCKCHAIN_ENABLED=true
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/{API_KEY}
POLYGON_CHAIN_ID=80002
NFT_CONTRACT_ADDRESS=0x...
BLOCKCHAIN_PRIVATE_KEY=0x...
```

## 가스 최적화

- Solidity 최적화: 200 runs
- 배치 민팅 지원 계획
- 대리 민팅 (Gasless) 지원 계획

## 보안 고려사항

1. **개인키 보안**: 절대 코드나 로그에 개인키를 노출하지 마세요
2. **역할 관리**: MINTER_ROLE은 신뢰할 수 있는 백엔드 지갑에만 부여
3. **ReentrancyGuard**: 재진입 공격 방지
4. **Pausable**: 긴급 상황 시 컨트랙트 일시정지 가능

## 라이선스

MIT
