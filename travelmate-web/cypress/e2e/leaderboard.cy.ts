describe('Leaderboard', () => {
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

    // Set auth tokens via onBeforeLoad so localStorage persists across navigation
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('accessToken', 'mock-access-token');
        win.localStorage.setItem('refreshToken', 'mock-refresh-token');
      },
    });
  });

  describe('Global Leaderboard', () => {
    it('should display global leaderboard', () => {
      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: [
            {
              rank: 1,
              userId: 10,
              nickname: 'TopCollector',
              profileImageUrl: '/images/top.jpg',
              nftCount: 150,
              totalPoints: 15000,
              legendaryCount: 10,
              epicCount: 30,
              rareCount: 50,
              commonCount: 60,
            },
            {
              rank: 2,
              userId: 11,
              nickname: 'SecondPlace',
              profileImageUrl: null,
              nftCount: 120,
              totalPoints: 12000,
              legendaryCount: 8,
              epicCount: 25,
              rareCount: 40,
              commonCount: 47,
            },
            {
              rank: 3,
              userId: 12,
              nickname: 'ThirdPlace',
              profileImageUrl: null,
              nftCount: 100,
              totalPoints: 10000,
              legendaryCount: 5,
              epicCount: 20,
              rareCount: 35,
              commonCount: 40,
            },
          ],
          totalParticipants: 1000,
        },
      }).as('getGlobalLeaderboard');

      cy.visit('/leaderboard');
      cy.wait('@getGlobalLeaderboard');

      cy.contains('TopCollector').should('be.visible');
      cy.contains('SecondPlace').should('be.visible');
      cy.contains('ThirdPlace').should('be.visible');
      cy.contains('150').should('be.visible'); // NFT count
      cy.contains('1,000').should('be.visible'); // Total participants (formatted)
    });

    it('should highlight top 3 with special styling', () => {
      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: [
            { rank: 1, userId: 10, nickname: 'Gold', nftCount: 150, totalPoints: 15000 },
            { rank: 2, userId: 11, nickname: 'Silver', nftCount: 120, totalPoints: 12000 },
            { rank: 3, userId: 12, nickname: 'Bronze', nftCount: 100, totalPoints: 10000 },
          ],
          totalParticipants: 100,
        },
      }).as('getGlobalLeaderboard');

      cy.visit('/leaderboard');
      cy.wait('@getGlobalLeaderboard');

      cy.get('[data-testid="rank-1"]').should('have.class', 'gold');
      cy.get('[data-testid="rank-2"]').should('have.class', 'silver');
      cy.get('[data-testid="rank-3"]').should('have.class', 'bronze');
    });

    it('should show rarity breakdown on hover', () => {
      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: [
            {
              rank: 1,
              userId: 10,
              nickname: 'TopCollector',
              nftCount: 150,
              totalPoints: 15000,
              legendaryCount: 10,
              epicCount: 30,
              rareCount: 50,
              commonCount: 60,
            },
          ],
          totalParticipants: 100,
        },
      }).as('getGlobalLeaderboard');

      cy.visit('/leaderboard');
      cy.wait('@getGlobalLeaderboard');

      cy.get('[data-testid="leaderboard-entry-10"]').trigger('mouseenter');
      cy.get('[data-testid="rarity-tooltip"]').should('be.visible');
      cy.contains('Legendary: 10').should('be.visible');
      cy.contains('Epic: 30').should('be.visible');
    });
  });

  describe('Weekly Leaderboard', () => {
    it('should display weekly leaderboard', () => {
      cy.intercept('GET', '**/api/leaderboard/weekly*', {
        statusCode: 200,
        body: {
          type: 'WEEKLY',
          entries: [
            {
              rank: 1,
              userId: 20,
              nickname: 'WeeklyChamp',
              nftCount: 25,
              totalPoints: 2500,
            },
            {
              rank: 2,
              userId: 21,
              nickname: 'ActiveCollector',
              nftCount: 20,
              totalPoints: 2000,
            },
          ],
          totalParticipants: 500,
        },
      }).as('getWeeklyLeaderboard');

      cy.visit('/leaderboard');
      cy.get('[data-testid="tab-weekly"]').click();
      cy.wait('@getWeeklyLeaderboard');

      cy.contains('WeeklyChamp').should('be.visible');
      cy.contains('25').should('be.visible');
      cy.contains('주간 리더보드').should('be.visible');
    });

    it('should show period indicator', () => {
      cy.intercept('GET', '**/api/leaderboard/weekly*', {
        statusCode: 200,
        body: {
          type: 'WEEKLY',
          entries: [],
          totalParticipants: 0,
        },
      }).as('getWeeklyLeaderboard');

      cy.visit('/leaderboard');
      cy.get('[data-testid="tab-weekly"]').click();
      cy.wait('@getWeeklyLeaderboard');

      cy.contains('최근 7일').should('be.visible');
    });
  });

  describe('Monthly Leaderboard', () => {
    it('should display monthly leaderboard', () => {
      cy.intercept('GET', '**/api/leaderboard/monthly*', {
        statusCode: 200,
        body: {
          type: 'MONTHLY',
          entries: [
            {
              rank: 1,
              userId: 30,
              nickname: 'MonthlyKing',
              nftCount: 80,
              totalPoints: 8000,
            },
          ],
          totalParticipants: 800,
        },
      }).as('getMonthlyLeaderboard');

      cy.visit('/leaderboard');
      cy.get('[data-testid="tab-monthly"]').click();
      cy.wait('@getMonthlyLeaderboard');

      cy.contains('MonthlyKing').should('be.visible');
      cy.contains('월간 리더보드').should('be.visible');
    });
  });

  describe('My Rank', () => {
    it('should display current user rank', () => {
      cy.intercept('GET', '**/api/leaderboard/my-rank', {
        statusCode: 200,
        body: {
          userId: 1,
          globalRank: 42,
          weeklyRank: 15,
          monthlyRank: 28,
          nftCount: 35,
          totalPoints: 3500,
          percentile: 95,
        },
      }).as('getMyRank');

      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: [],
          totalParticipants: 1000,
        },
      }).as('getGlobalLeaderboard');

      cy.visit('/leaderboard');
      cy.wait(['@getGlobalLeaderboard', '@getMyRank']);

      cy.get('[data-testid="my-rank-card"]').should('be.visible');
      cy.contains('42위').should('be.visible');
      cy.contains('상위 5%').should('be.visible');
    });

    it('should highlight my position in leaderboard', () => {
      cy.intercept('GET', '**/api/leaderboard/my-rank', {
        statusCode: 200,
        body: {
          userId: 1,
          globalRank: 2,
          nftCount: 120,
          totalPoints: 12000,
          percentile: 99,
        },
      }).as('getMyRank');

      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: [
            { rank: 1, userId: 10, nickname: 'First', nftCount: 150 },
            { rank: 2, userId: 1, nickname: 'TestUser', nftCount: 120 },
            { rank: 3, userId: 12, nickname: 'Third', nftCount: 100 },
          ],
          totalParticipants: 100,
        },
      }).as('getGlobalLeaderboard');

      cy.visit('/leaderboard');
      cy.wait(['@getGlobalLeaderboard', '@getMyRank']);

      cy.get('[data-testid="leaderboard-entry-1"]').should('have.class', 'highlight');
    });

    it('should navigate to my profile from rank card', () => {
      cy.intercept('GET', '**/api/leaderboard/my-rank', {
        statusCode: 200,
        body: {
          userId: 1,
          globalRank: 42,
          percentile: 95,
        },
      }).as('getMyRank');

      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: { type: 'ALL_TIME', entries: [], totalParticipants: 100 },
      }).as('getGlobalLeaderboard');

      cy.visit('/leaderboard');
      cy.wait(['@getGlobalLeaderboard', '@getMyRank']);

      cy.get('[data-testid="my-rank-card"]').click();
      cy.url().should('include', '/profile/1');
    });
  });

  describe('User Profile Navigation', () => {
    it('should navigate to user profile on click', () => {
      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: [{ rank: 1, userId: 10, nickname: 'TopCollector', nftCount: 150 }],
          totalParticipants: 100,
        },
      }).as('getGlobalLeaderboard');

      cy.intercept('GET', '**/api/users/10', {
        statusCode: 200,
        body: {
          id: 10,
          nickname: 'TopCollector',
          nftCount: 150,
        },
      }).as('getUserProfile');

      cy.visit('/leaderboard');
      cy.wait('@getGlobalLeaderboard');

      cy.get('[data-testid="leaderboard-entry-10"]').click();
      cy.wait('@getUserProfile');
      cy.url().should('include', '/profile/10');
    });
  });

  describe('Pagination', () => {
    it('should load more entries on scroll', () => {
      const generateEntries = (start: number, count: number) =>
        Array.from({ length: count }, (_, i) => ({
          rank: start + i,
          userId: 100 + start + i,
          nickname: `User${start + i}`,
          nftCount: 200 - start - i,
          totalPoints: (200 - start - i) * 100,
        }));

      cy.intercept('GET', '**/api/leaderboard/global?limit=100', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: generateEntries(1, 100),
          totalParticipants: 500,
        },
      }).as('getFirstPage');

      cy.intercept('GET', '**/api/leaderboard/global?limit=100&offset=100', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: generateEntries(101, 100),
          totalParticipants: 500,
        },
      }).as('getSecondPage');

      cy.visit('/leaderboard');
      cy.wait('@getFirstPage');

      cy.contains('User1').should('be.visible');

      // Scroll to bottom to trigger infinite scroll
      cy.get('[data-testid="leaderboard-list"]').scrollTo('bottom');
      cy.wait('@getSecondPage');

      cy.contains('User101').should('be.visible');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no entries', () => {
      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: {
          type: 'ALL_TIME',
          entries: [],
          totalParticipants: 0,
        },
      }).as('getEmptyLeaderboard');

      cy.visit('/leaderboard');
      cy.wait('@getEmptyLeaderboard');

      cy.contains('아직 참여자가 없습니다').should('be.visible');
      cy.get('[data-testid="start-collecting-button"]').should('be.visible');
    });

    it('should navigate to NFT map from empty state', () => {
      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 200,
        body: { type: 'ALL_TIME', entries: [], totalParticipants: 0 },
      }).as('getEmptyLeaderboard');

      cy.visit('/leaderboard');
      cy.wait('@getEmptyLeaderboard');

      cy.get('[data-testid="start-collecting-button"]').click();
      cy.url().should('include', '/nft/map');
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', () => {
      cy.intercept('GET', '**/api/leaderboard/global*', {
        statusCode: 500,
        body: { error: '서버 오류가 발생했습니다.' },
      }).as('getLeaderboardError');

      cy.visit('/leaderboard');
      cy.wait('@getLeaderboardError');

      cy.contains('리더보드를 불러오는데 실패했습니다').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should retry on button click', () => {
      let callCount = 0;
      cy.intercept('GET', '**/api/leaderboard/global*', req => {
        callCount++;
        if (callCount === 1) {
          req.reply({ statusCode: 500, body: { error: '서버 오류' } });
        } else {
          req.reply({
            statusCode: 200,
            body: { type: 'ALL_TIME', entries: [], totalParticipants: 0 },
          });
        }
      }).as('getLeaderboard');

      cy.visit('/leaderboard');
      cy.wait('@getLeaderboard');

      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@getLeaderboard');

      cy.contains('아직 참여자가 없습니다').should('be.visible');
    });
  });
});
