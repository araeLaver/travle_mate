# ADR 0001 — 백엔드 스택은 Java(Spring Boot)로 확정

- 상태: **Accepted**
- 결정일: 2026-08-22
- 관련 브랜치: `codex/fryndo-public-beta-launch-20260706` (런칭 경로)

## 맥락

분기점 `9962561`(2026-05-10) 이후 백엔드가 두 갈래로 갈라졌다.

- **이 브랜치 (Java / Spring Boot)** — `travelmate-backend`. "Launch Fryndo public beta"(2026-07-06) 이후 베타 작업(2026-08-19)까지 진행된 실제 런칭 경로.
- **`origin/main` (Node.js 이식)** — 2026-06-11 하루치 커밋 3개(`2683e77`, `76f463c`, `feffda1`)로 `travelmate-node-backend`를 추가하고 배포를 Fly.io로 전환. 단, 기존 Java 소스(393파일)는 지운 게 아니라 **루트 `pom.xml`만 제거**해 빌드에서 떼어낸 절반짜리 이식 상태.

## 근거 (git 데이터, 2026-08-22 검증)

| 항목 | 이 브랜치 (Java) | `origin/main` (Node) |
|---|---|---|
| 파일 수 | 424 | node 22 (+Java 393 방치) |
| 컨트롤러 | 44 | 9 |
| 서비스 / 엔티티 | 61 / 61 | — |
| 보안·인증 클래스 | 30 (2FA·JWT·STOMP) | auth 미들웨어 1 |
| Flyway 마이그레이션 | 10 | — |
| web3/NFT 파일 | 53 | 일부(재구현) |
| 코드량 / 테스트 | 전체 기능 / 전 모듈 그린 | ~1079줄 / **테스트 0** |
| API 계약 | 프론트 267 호출 ↔ 320 라우트 매칭 통과 | — |
| 최신 작업 | 2026-08-19 | 2026-06-11 |
| 빌드/배포 | pom.xml (Maven) 정상 | 루트 pom.xml 제거 + fly.toml/Dockerfile.node |

### 유지보수성 판단

Node/TS 스택 자체는 나쁘지 않고, 그린필드였다면(TS 프론트 + 인디 + web3) 합리적 후보였을 것이다. 그러나 이 프로젝트에서는 Node로 갈 이유가 하나씩 소멸한다.

- **팀 언어**: 유지보수자가 Java를 문제없이 다루며 특정 언어로 쏠리지 않음 → Node 전환을 강제하지 않음.
- **타입 공유**: `travelmate-shared`가 TS가 아니라 **Java 모듈** → 풀스택 TS 이점은 공짜로 오지 않음.
- **web3/NFT**: Java 백엔드가 이미 53파일로 NFT/민팅 구현. 온체인 컨트랙트(`blockchain/TravelMateNFT.sol`, Hardhat)는 백엔드 스택과 무관한 독립 JS 모듈. main의 `feffda1`은 Java가 이미 하는 것을 재구현한 것.

남는 것은 Node의 일반론적 장점(가벼운 운영·단일 언어)뿐인데, 그 대가로 61 서비스 + 61 엔티티 + 30 보안 클래스 + 10 마이그레이션 + 53 web3 파일 재작성과 회귀 위험을 선지불해야 한다. 정당화되지 않는다.

## 결정

1. **백엔드 스택은 Java(Spring Boot)로 확정한다.** `travelmate-backend`가 유일한 정식 백엔드다.
2. `origin/main`의 Node 이식(`travelmate-node-backend` 및 관련 3커밋)은 **폐기(dead-end)** 로 간주한다.
3. `origin/main`을 이 브랜치로 **자동 merge 하지 않는다.** 반대로 이 브랜치를 런칭 정본으로 삼는다.

## 결과 / 후속

- main에 남아 있는 Node 잔재(`travelmate-node-backend`, `fly.toml`, `Dockerfile.node`, 제거된 루트 `pom.xml`)는 이 브랜치를 정본으로 정리하는 과정에서 걷어낸다.
- 향후 이 문서를 근거로 삼아 스택 재논의 시 같은 분석을 반복하지 않는다.
