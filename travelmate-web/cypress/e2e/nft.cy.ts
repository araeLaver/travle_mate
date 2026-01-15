describe('NFT Collection', () => {
  beforeEach(() => {
    // Mock authenticated user
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'test@example.com',
        nickname: 'TestUser',
        profileImageUrl: null,
      },
    }).as('getMe');

    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'mock-access-token');
      win.localStorage.setItem('refreshToken', 'mock-refresh-token');
    });
  });

  describe('NFT Map View', () => {
    it('should display NFT map with collectible locations', () => {
      cy.intercept('GET', '**/api/nft/locations*', {
        statusCode: 200,
        body: [
          {
            id: 1,
            name: '경복궁',
            latitude: 37.5796,
            longitude: 126.977,
            rarity: 'LEGENDARY',
            isCollected: false,
            description: '조선 왕조의 정궁',
          },
          {
            id: 2,
            name: '남산타워',
            latitude: 37.5512,
            longitude: 126.9882,
            rarity: 'EPIC',
            isCollected: true,
            description: '서울의 상징적인 랜드마크',
          },
        ],
      }).as('getNftLocations');

      cy.mockGeolocation(37.5665, 126.978);
      cy.visit('/nft/map');
      cy.wait('@getNftLocations');

      // Map should be visible
      cy.get('[data-testid="nft-map"]').should('be.visible');
    });

    it('should show location detail on marker click', () => {
      cy.intercept('GET', '**/api/nft/locations*', {
        statusCode: 200,
        body: [
          {
            id: 1,
            name: '경복궁',
            latitude: 37.5796,
            longitude: 126.977,
            rarity: 'LEGENDARY',
            isCollected: false,
            description: '조선 왕조의 정궁',
          },
        ],
      }).as('getNftLocations');

      cy.mockGeolocation(37.5665, 126.978);
      cy.visit('/nft/map');
      cy.wait('@getNftLocations');

      // Click on location marker (this may need adjustment based on actual map implementation)
      cy.get('[data-testid="location-marker-1"]').click();
      cy.contains('경복궁').should('be.visible');
      cy.contains('LEGENDARY').should('be.visible');
    });
  });

  describe('NFT Collection', () => {
    it('should display user NFT collection', () => {
      cy.intercept('GET', '**/api/nft/collection*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              locationName: '남산타워',
              imageUrl: '/images/namsan.jpg',
              rarity: 'EPIC',
              collectedAt: '2024-01-15T10:00:00Z',
              mintStatus: 'MINTED',
              tokenId: 12345,
            },
            {
              id: 2,
              locationName: '광화문',
              imageUrl: '/images/gwanghwamun.jpg',
              rarity: 'RARE',
              collectedAt: '2024-01-20T14:30:00Z',
              mintStatus: 'NOT_MINTED',
              tokenId: null,
            },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
        },
      }).as('getNftCollection');

      cy.visit('/nft/collection');
      cy.wait('@getNftCollection');

      cy.contains('남산타워').should('be.visible');
      cy.contains('광화문').should('be.visible');
    });

    it('should filter collection by rarity', () => {
      cy.intercept('GET', '**/api/nft/collection*rarity=EPIC*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              locationName: '남산타워',
              imageUrl: '/images/namsan.jpg',
              rarity: 'EPIC',
              collectedAt: '2024-01-15T10:00:00Z',
              mintStatus: 'MINTED',
              tokenId: 12345,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('getFilteredCollection');

      cy.visit('/nft/collection');
      cy.get('[data-testid="rarity-filter"]').select('EPIC');
      cy.wait('@getFilteredCollection');

      cy.contains('남산타워').should('be.visible');
      cy.contains('광화문').should('not.exist');
    });
  });

  describe('NFT Minting', () => {
    it('should open minting modal for unminted NFT', () => {
      cy.intercept('GET', '**/api/nft/collection*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 2,
              locationName: '광화문',
              imageUrl: '/images/gwanghwamun.jpg',
              rarity: 'RARE',
              collectedAt: '2024-01-20T14:30:00Z',
              mintStatus: 'NOT_MINTED',
              tokenId: null,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('getNftCollection');

      cy.visit('/nft/collection');
      cy.wait('@getNftCollection');

      cy.get('[data-testid="nft-card-2"]').within(() => {
        cy.get('button').contains('민팅하기').click();
      });

      cy.get('[data-testid="minting-modal"]').should('be.visible');
      cy.contains('광화문 NFT 민팅').should('be.visible');
    });

    it('should start minting process', () => {
      cy.intercept('POST', '**/api/nft/mint/2', {
        statusCode: 200,
        body: {
          success: true,
          status: 'MINTING',
          message: '민팅이 시작되었습니다.',
        },
      }).as('startMinting');

      cy.intercept('GET', '**/api/nft/mint/status/2', {
        statusCode: 200,
        body: {
          status: 'COMPLETED',
          tokenId: 12346,
          transactionHash: '0x123abc...',
        },
      }).as('getMintStatus');

      cy.visit('/nft/collection');

      // Mock collection with unminted NFT
      cy.intercept('GET', '**/api/nft/collection*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 2,
              locationName: '광화문',
              imageUrl: '/images/gwanghwamun.jpg',
              rarity: 'RARE',
              collectedAt: '2024-01-20T14:30:00Z',
              mintStatus: 'NOT_MINTED',
              tokenId: null,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      });

      cy.get('[data-testid="nft-card-2"] button').contains('민팅하기').click();
      cy.get('[data-testid="start-minting-button"]').click();

      cy.wait('@startMinting');
      cy.contains('민팅이 시작되었습니다').should('be.visible');
    });
  });

  describe('Location Collection', () => {
    it('should collect NFT when in range', () => {
      cy.intercept('POST', '**/api/nft/collect/1', {
        statusCode: 200,
        body: {
          success: true,
          nft: {
            id: 3,
            locationName: '경복궁',
            imageUrl: '/images/gyeongbok.jpg',
            rarity: 'LEGENDARY',
            collectedAt: new Date().toISOString(),
          },
          message: '경복궁 NFT를 수집했습니다!',
        },
      }).as('collectNft');

      // Mock being at the location
      cy.mockGeolocation(37.5796, 126.977);

      cy.intercept('GET', '**/api/nft/locations*', {
        statusCode: 200,
        body: [
          {
            id: 1,
            name: '경복궁',
            latitude: 37.5796,
            longitude: 126.977,
            rarity: 'LEGENDARY',
            isCollected: false,
            collectRadius: 100,
            description: '조선 왕조의 정궁',
          },
        ],
      }).as('getNftLocations');

      cy.visit('/nft/map');
      cy.wait('@getNftLocations');

      cy.get('[data-testid="collect-button-1"]').click();
      cy.wait('@collectNft');

      cy.contains('경복궁 NFT를 수집했습니다').should('be.visible');
    });

    it('should show error when out of range', () => {
      cy.intercept('POST', '**/api/nft/collect/1', {
        statusCode: 400,
        body: {
          error: '수집 범위 밖에 있습니다. 더 가까이 이동해주세요.',
        },
      }).as('collectOutOfRange');

      // Mock being far from the location
      cy.mockGeolocation(37.5, 127.0);

      cy.intercept('GET', '**/api/nft/locations*', {
        statusCode: 200,
        body: [
          {
            id: 1,
            name: '경복궁',
            latitude: 37.5796,
            longitude: 126.977,
            rarity: 'LEGENDARY',
            isCollected: false,
            collectRadius: 100,
            description: '조선 왕조의 정궁',
          },
        ],
      }).as('getNftLocations');

      cy.visit('/nft/map');
      cy.wait('@getNftLocations');

      cy.get('[data-testid="collect-button-1"]').click();
      cy.wait('@collectOutOfRange');

      cy.contains('수집 범위 밖').should('be.visible');
    });
  });
});
