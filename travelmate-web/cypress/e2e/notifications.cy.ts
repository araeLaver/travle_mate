describe('Notifications', () => {
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

  describe('Notification List', () => {
    it('should display notifications list', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              type: 'FOLLOW',
              message: 'TravelBuddy님이 팔로우했습니다.',
              isRead: false,
              createdAt: '2024-01-20T10:00:00Z',
              data: { userId: 2, nickname: 'TravelBuddy' },
            },
            {
              id: 2,
              type: 'NFT_COLLECTED',
              message: '경복궁 NFT를 수집했습니다!',
              isRead: true,
              createdAt: '2024-01-19T15:00:00Z',
              data: { locationId: 1, locationName: '경복궁', rarity: 'LEGENDARY' },
            },
            {
              id: 3,
              type: 'MINTING_COMPLETE',
              message: '남산타워 NFT 민팅이 완료되었습니다.',
              isRead: true,
              createdAt: '2024-01-18T12:00:00Z',
              data: { collectionId: 2, tokenId: '12345' },
            },
          ],
          totalElements: 3,
          totalPages: 1,
          number: 0,
        },
      }).as('getNotifications');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.contains('TravelBuddy님이 팔로우했습니다').should('be.visible');
      cy.contains('경복궁 NFT를 수집했습니다').should('be.visible');
      cy.contains('민팅이 완료되었습니다').should('be.visible');
    });

    it('should show unread badge in header', () => {
      cy.intercept('GET', '**/api/notifications/unread-count', {
        statusCode: 200,
        body: { count: 5 },
      }).as('getUnreadCount');

      cy.visit('/');
      cy.wait('@getUnreadCount');

      cy.get('[data-testid="notification-badge"]').should('contain', '5');
    });

    it('should highlight unread notifications', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              type: 'FOLLOW',
              message: '새 팔로워',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: 2,
              type: 'COMMENT',
              message: '읽은 알림',
              isRead: true,
              createdAt: new Date().toISOString(),
            },
          ],
          totalElements: 2,
        },
      }).as('getNotifications');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-1"]').should('have.class', 'unread');
      cy.get('[data-testid="notification-2"]').should('not.have.class', 'unread');
    });
  });

  describe('Notification Actions', () => {
    it('should mark notification as read on click', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              type: 'FOLLOW',
              message: 'TravelBuddy님이 팔로우했습니다.',
              isRead: false,
              createdAt: new Date().toISOString(),
              data: { userId: 2 },
            },
          ],
          totalElements: 1,
        },
      }).as('getNotifications');

      cy.intercept('PUT', '**/api/notifications/1/read', {
        statusCode: 200,
        body: { success: true },
      }).as('markAsRead');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-1"]').click();
      cy.wait('@markAsRead');
    });

    it('should mark all as read', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            { id: 1, type: 'FOLLOW', message: '알림 1', isRead: false, createdAt: new Date().toISOString() },
            { id: 2, type: 'FOLLOW', message: '알림 2', isRead: false, createdAt: new Date().toISOString() },
          ],
          totalElements: 2,
        },
      }).as('getNotifications');

      cy.intercept('PUT', '**/api/notifications/read-all', {
        statusCode: 200,
        body: { success: true },
      }).as('markAllAsRead');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="mark-all-read-button"]').click();
      cy.wait('@markAllAsRead');
    });

    it('should delete notification', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            { id: 1, type: 'FOLLOW', message: '삭제할 알림', isRead: true, createdAt: new Date().toISOString() },
          ],
          totalElements: 1,
        },
      }).as('getNotifications');

      cy.intercept('DELETE', '**/api/notifications/1', {
        statusCode: 200,
        body: { success: true },
      }).as('deleteNotification');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-1"]').within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });
      cy.wait('@deleteNotification');

      cy.contains('삭제할 알림').should('not.exist');
    });

    it('should clear all notifications', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            { id: 1, type: 'FOLLOW', message: '알림 1', isRead: true, createdAt: new Date().toISOString() },
            { id: 2, type: 'FOLLOW', message: '알림 2', isRead: true, createdAt: new Date().toISOString() },
          ],
          totalElements: 2,
        },
      }).as('getNotifications');

      cy.intercept('DELETE', '**/api/notifications/all', {
        statusCode: 200,
        body: { success: true },
      }).as('clearAllNotifications');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="clear-all-button"]').click();
      cy.get('[data-testid="confirm-clear-button"]').click();
      cy.wait('@clearAllNotifications');

      cy.contains('알림이 없습니다').should('be.visible');
    });
  });

  describe('Notification Navigation', () => {
    it('should navigate to user profile for FOLLOW notification', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              type: 'FOLLOW',
              message: 'TravelBuddy님이 팔로우했습니다.',
              isRead: false,
              createdAt: new Date().toISOString(),
              data: { userId: 2, nickname: 'TravelBuddy' },
            },
          ],
          totalElements: 1,
        },
      }).as('getNotifications');

      cy.intercept('PUT', '**/api/notifications/1/read', { statusCode: 200 }).as('markAsRead');

      cy.intercept('GET', '**/api/users/2', {
        statusCode: 200,
        body: { id: 2, nickname: 'TravelBuddy' },
      }).as('getUserProfile');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-1"]').click();
      cy.wait('@getUserProfile');
      cy.url().should('include', '/profile/2');
    });

    it('should navigate to NFT collection for NFT_COLLECTED notification', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              type: 'NFT_COLLECTED',
              message: '경복궁 NFT를 수집했습니다!',
              isRead: false,
              createdAt: new Date().toISOString(),
              data: { collectionId: 5, locationName: '경복궁' },
            },
          ],
          totalElements: 1,
        },
      }).as('getNotifications');

      cy.intercept('PUT', '**/api/notifications/1/read', { statusCode: 200 }).as('markAsRead');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-1"]').click();
      cy.url().should('include', '/nft/collection');
    });

    it('should navigate to group for GROUP_INVITE notification', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              type: 'GROUP_INVITE',
              message: '서울 여행 그룹에 초대되었습니다.',
              isRead: false,
              createdAt: new Date().toISOString(),
              data: { groupId: 1, groupName: '서울 여행' },
            },
          ],
          totalElements: 1,
        },
      }).as('getNotifications');

      cy.intercept('PUT', '**/api/notifications/1/read', { statusCode: 200 }).as('markAsRead');

      cy.intercept('GET', '**/api/groups/1', {
        statusCode: 200,
        body: { id: 1, name: '서울 여행' },
      }).as('getGroup');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-1"]').click();
      cy.url().should('include', '/groups/1');
    });

    it('should navigate to chat for MESSAGE notification', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              type: 'MESSAGE',
              message: 'TravelBuddy님이 메시지를 보냈습니다.',
              isRead: false,
              createdAt: new Date().toISOString(),
              data: { chatRoomId: 1 },
            },
          ],
          totalElements: 1,
        },
      }).as('getNotifications');

      cy.intercept('PUT', '**/api/notifications/1/read', { statusCode: 200 }).as('markAsRead');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-1"]').click();
      cy.url().should('include', '/chat/1');
    });
  });

  describe('Notification Types', () => {
    it('should display correct icon for each notification type', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          content: [
            { id: 1, type: 'FOLLOW', message: '팔로우', isRead: true, createdAt: new Date().toISOString() },
            { id: 2, type: 'NFT_COLLECTED', message: 'NFT 수집', isRead: true, createdAt: new Date().toISOString() },
            { id: 3, type: 'MINTING_COMPLETE', message: '민팅 완료', isRead: true, createdAt: new Date().toISOString() },
            { id: 4, type: 'REVIEW_HELPFUL', message: '도움됨', isRead: true, createdAt: new Date().toISOString() },
          ],
          totalElements: 4,
        },
      }).as('getNotifications');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-1"] [data-testid="icon-follow"]').should('exist');
      cy.get('[data-testid="notification-2"] [data-testid="icon-nft"]').should('exist');
      cy.get('[data-testid="notification-3"] [data-testid="icon-minting"]').should('exist');
      cy.get('[data-testid="notification-4"] [data-testid="icon-helpful"]').should('exist');
    });
  });

  describe('Notification Settings', () => {
    it('should navigate to notification settings', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: { content: [], totalElements: 0 },
      }).as('getNotifications');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.get('[data-testid="notification-settings-button"]').click();
      cy.url().should('include', '/settings/notifications');
    });

    it('should toggle notification preferences', () => {
      cy.intercept('GET', '**/api/settings/notifications', {
        statusCode: 200,
        body: {
          follow: true,
          message: true,
          nftCollected: true,
          mintingComplete: true,
          groupInvite: true,
          reviewHelpful: false,
          email: false,
          push: true,
        },
      }).as('getNotificationSettings');

      cy.intercept('PUT', '**/api/settings/notifications', {
        statusCode: 200,
        body: { success: true },
      }).as('updateNotificationSettings');

      cy.visit('/settings/notifications');
      cy.wait('@getNotificationSettings');

      cy.get('[data-testid="toggle-follow"]').should('be.checked');
      cy.get('[data-testid="toggle-email"]').should('not.be.checked');

      cy.get('[data-testid="toggle-email"]').click();
      cy.wait('@updateNotificationSettings');
    });
  });

  describe('Real-time Notifications', () => {
    it('should display toast for new notification', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: { content: [], totalElements: 0 },
      }).as('getNotifications');

      cy.visit('/');

      // Simulate receiving a WebSocket notification
      cy.window().then((win) => {
        const event = new CustomEvent('ws:notification', {
          detail: {
            id: 100,
            type: 'FOLLOW',
            message: '새로운 팔로워가 생겼습니다!',
            createdAt: new Date().toISOString(),
          },
        });
        win.dispatchEvent(event);
      });

      cy.get('[data-testid="notification-toast"]').should('be.visible');
      cy.contains('새로운 팔로워가 생겼습니다').should('be.visible');
    });

    it('should update badge count for new notification', () => {
      cy.intercept('GET', '**/api/notifications/unread-count', {
        statusCode: 200,
        body: { count: 2 },
      }).as('getUnreadCount');

      cy.visit('/');
      cy.wait('@getUnreadCount');

      cy.get('[data-testid="notification-badge"]').should('contain', '2');

      // Simulate receiving a new notification
      cy.window().then((win) => {
        const event = new CustomEvent('ws:notification', {
          detail: {
            id: 100,
            type: 'FOLLOW',
            message: '새 알림',
            createdAt: new Date().toISOString(),
          },
        });
        win.dispatchEvent(event);
      });

      cy.get('[data-testid="notification-badge"]').should('contain', '3');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no notifications', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: { content: [], totalElements: 0 },
      }).as('getNotifications');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      cy.contains('알림이 없습니다').should('be.visible');
      cy.get('[data-testid="empty-notification-icon"]').should('be.visible');
    });
  });

  describe('Pagination', () => {
    it('should load more notifications on scroll', () => {
      const generateNotifications = (start: number, count: number) =>
        Array.from({ length: count }, (_, i) => ({
          id: start + i,
          type: 'FOLLOW',
          message: `알림 ${start + i}`,
          isRead: true,
          createdAt: new Date(Date.now() - (start + i) * 60000).toISOString(),
        }));

      cy.intercept('GET', '**/api/notifications?page=0*', {
        statusCode: 200,
        body: {
          content: generateNotifications(1, 20),
          totalElements: 40,
          totalPages: 2,
          number: 0,
        },
      }).as('getFirstPage');

      cy.intercept('GET', '**/api/notifications?page=1*', {
        statusCode: 200,
        body: {
          content: generateNotifications(21, 20),
          totalElements: 40,
          totalPages: 2,
          number: 1,
        },
      }).as('getSecondPage');

      cy.visit('/notifications');
      cy.wait('@getFirstPage');

      cy.contains('알림 1').should('be.visible');

      // Scroll to bottom
      cy.get('[data-testid="notifications-list"]').scrollTo('bottom');
      cy.wait('@getSecondPage');

      cy.contains('알림 21').should('be.visible');
    });
  });
});
