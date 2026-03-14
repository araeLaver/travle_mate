describe('Social Features', () => {
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

    cy.window().then(win => {
      win.localStorage.setItem('accessToken', 'mock-access-token');
      win.localStorage.setItem('refreshToken', 'mock-refresh-token');
    });
  });

  describe('Follow System', () => {
    it('should follow a user', () => {
      cy.intercept('GET', '**/api/users/2', {
        statusCode: 200,
        body: {
          id: 2,
          nickname: 'TravelBuddy',
          profileImageUrl: null,
          bio: '여행을 좋아하는 사람',
          followerCount: 100,
          followingCount: 50,
          isFollowing: false,
        },
      }).as('getUserProfile');

      cy.intercept('POST', '**/api/users/2/follow', {
        statusCode: 200,
        body: {
          success: true,
          isFollowing: true,
          isMutual: false,
          stats: {
            followerCount: 101,
            followingCount: 50,
          },
        },
      }).as('followUser');

      cy.visit('/profile/2');
      cy.wait('@getUserProfile');

      cy.get('button').contains('팔로우').click();
      cy.wait('@followUser');

      cy.get('button').contains('팔로잉').should('be.visible');
    });

    it('should unfollow a user', () => {
      cy.intercept('GET', '**/api/users/2', {
        statusCode: 200,
        body: {
          id: 2,
          nickname: 'TravelBuddy',
          profileImageUrl: null,
          bio: '여행을 좋아하는 사람',
          followerCount: 101,
          followingCount: 50,
          isFollowing: true,
        },
      }).as('getUserProfile');

      cy.intercept('DELETE', '**/api/users/2/follow', {
        statusCode: 200,
        body: {
          success: true,
          isFollowing: false,
          stats: {
            followerCount: 100,
            followingCount: 50,
          },
        },
      }).as('unfollowUser');

      cy.visit('/profile/2');
      cy.wait('@getUserProfile');

      cy.get('button').contains('팔로잉').click();
      cy.wait('@unfollowUser');

      cy.get('button').contains('팔로우').should('be.visible');
    });

    it('should display followers list', () => {
      cy.intercept('GET', '**/api/users/1/followers*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 2,
              nickname: 'Follower1',
              profileImageUrl: null,
              isMutual: true,
            },
            {
              id: 3,
              nickname: 'Follower2',
              profileImageUrl: null,
              isMutual: false,
            },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
        },
      }).as('getFollowers');

      cy.visit('/profile/1/followers');
      cy.wait('@getFollowers');

      cy.contains('Follower1').should('be.visible');
      cy.contains('Follower2').should('be.visible');
    });

    it('should display following list', () => {
      cy.intercept('GET', '**/api/users/1/following*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 4,
              nickname: 'Following1',
              profileImageUrl: null,
              isMutual: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('getFollowing');

      cy.visit('/profile/1/following');
      cy.wait('@getFollowing');

      cy.contains('Following1').should('be.visible');
    });
  });

  describe('Location Reviews', () => {
    it('should display location reviews', () => {
      cy.intercept('GET', '**/api/locations/1/reviews*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              userId: 2,
              userNickname: 'Reviewer1',
              rating: 5,
              comment: '정말 멋진 장소입니다!',
              visitSeason: 'SPRING',
              helpfulCount: 10,
              createdAt: '2024-01-15T10:00:00Z',
              isHelpful: false,
            },
            {
              id: 2,
              userId: 3,
              userNickname: 'Reviewer2',
              rating: 4,
              comment: '좋은 경험이었어요',
              visitSeason: 'SUMMER',
              helpfulCount: 5,
              createdAt: '2024-01-10T14:00:00Z',
              isHelpful: true,
            },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
        },
      }).as('getLocationReviews');

      cy.intercept('GET', '**/api/locations/1/reviews/stats', {
        statusCode: 200,
        body: {
          averageRating: 4.5,
          totalReviews: 2,
          ratingDistribution: {
            5: 1,
            4: 1,
            3: 0,
            2: 0,
            1: 0,
          },
        },
      }).as('getReviewStats');

      cy.visit('/locations/1/reviews');
      cy.wait(['@getLocationReviews', '@getReviewStats']);

      cy.contains('정말 멋진 장소입니다').should('be.visible');
      cy.contains('4.5').should('be.visible'); // Average rating
    });

    it('should submit a review', () => {
      cy.intercept('POST', '**/api/locations/1/reviews', {
        statusCode: 201,
        body: {
          id: 3,
          userId: 1,
          userNickname: 'TestUser',
          rating: 5,
          comment: '아름다운 곳이에요!',
          visitSeason: 'FALL',
          helpfulCount: 0,
          createdAt: new Date().toISOString(),
        },
      }).as('createReview');

      cy.visit('/locations/1/reviews');

      cy.get('[data-testid="rating-5"]').click();
      cy.get('[data-testid="season-select"]').select('FALL');
      cy.get('textarea[name="comment"]').type('아름다운 곳이에요!');
      cy.get('button[type="submit"]').click();

      cy.wait('@createReview');
      cy.contains('리뷰가 등록되었습니다').should('be.visible');
    });

    it('should toggle helpful on review', () => {
      cy.intercept('GET', '**/api/locations/1/reviews*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              userId: 2,
              userNickname: 'Reviewer1',
              rating: 5,
              comment: '정말 멋진 장소입니다!',
              visitSeason: 'SPRING',
              helpfulCount: 10,
              createdAt: '2024-01-15T10:00:00Z',
              isHelpful: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('getLocationReviews');

      cy.intercept('POST', '**/api/reviews/1/helpful', {
        statusCode: 200,
        body: {
          isHelpful: true,
          helpfulCount: 11,
        },
      }).as('toggleHelpful');

      cy.visit('/locations/1/reviews');
      cy.wait('@getLocationReviews');

      cy.get('[data-testid="helpful-button-1"]').click();
      cy.wait('@toggleHelpful');

      cy.contains('11').should('be.visible');
    });
  });

  describe('Profile', () => {
    it('should display user profile', () => {
      cy.intercept('GET', '**/api/users/1', {
        statusCode: 200,
        body: {
          id: 1,
          nickname: 'TestUser',
          email: 'test@example.com',
          profileImageUrl: null,
          bio: '여행 좋아요',
          followerCount: 50,
          followingCount: 30,
          nftCount: 15,
          reviewCount: 8,
        },
      }).as('getUserProfile');

      cy.visit('/profile/1');
      cy.wait('@getUserProfile');

      cy.contains('TestUser').should('be.visible');
      cy.contains('50').should('be.visible'); // followers
      cy.contains('30').should('be.visible'); // following
      cy.contains('15').should('be.visible'); // NFTs
    });

    it('should update profile', () => {
      cy.intercept('GET', '**/api/users/1', {
        statusCode: 200,
        body: {
          id: 1,
          nickname: 'TestUser',
          email: 'test@example.com',
          profileImageUrl: null,
          bio: '여행 좋아요',
        },
      }).as('getUserProfile');

      cy.intercept('PUT', '**/api/users/1', {
        statusCode: 200,
        body: {
          id: 1,
          nickname: 'UpdatedUser',
          email: 'test@example.com',
          profileImageUrl: null,
          bio: '여행과 맛집 탐방',
        },
      }).as('updateProfile');

      cy.visit('/profile/1/edit');
      cy.wait('@getUserProfile');

      cy.get('input[name="nickname"]').clear().type('UpdatedUser');
      cy.get('textarea[name="bio"]').clear().type('여행과 맛집 탐방');
      cy.get('button[type="submit"]').click();

      cy.wait('@updateProfile');
      cy.contains('프로필이 업데이트되었습니다').should('be.visible');
    });
  });
});
