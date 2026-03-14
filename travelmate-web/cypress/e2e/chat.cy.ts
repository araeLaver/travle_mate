describe('Chat Features', () => {
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

  describe('Chat Room List', () => {
    it('should display chat rooms', () => {
      cy.intercept('GET', '**/api/chat/rooms*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              name: '서울 여행 그룹 채팅',
              type: 'GROUP',
              lastMessage: '내일 몇 시에 만나요?',
              lastMessageTime: '2024-01-20T10:30:00Z',
              unreadCount: 3,
              participants: [
                { id: 1, nickname: 'TestUser', profileImageUrl: null },
                { id: 2, nickname: 'TravelBuddy', profileImageUrl: null },
              ],
            },
            {
              id: 2,
              name: 'TravelBuddy',
              type: 'PRIVATE',
              lastMessage: '안녕하세요!',
              lastMessageTime: '2024-01-19T15:00:00Z',
              unreadCount: 0,
              participants: [
                { id: 1, nickname: 'TestUser', profileImageUrl: null },
                { id: 2, nickname: 'TravelBuddy', profileImageUrl: null },
              ],
            },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
        },
      }).as('getChatRooms');

      cy.visit('/chat');
      cy.wait('@getChatRooms');

      cy.contains('서울 여행 그룹 채팅').should('be.visible');
      cy.contains('TravelBuddy').should('be.visible');
      cy.get('[data-testid="unread-badge"]').should('contain', '3');
    });

    it('should filter chat rooms by search', () => {
      cy.intercept('GET', '**/api/chat/rooms*keyword=서울*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              name: '서울 여행 그룹 채팅',
              type: 'GROUP',
              lastMessage: '내일 몇 시에 만나요?',
              lastMessageTime: '2024-01-20T10:30:00Z',
              unreadCount: 3,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('searchChatRooms');

      cy.visit('/chat');
      cy.get('input[placeholder*="검색"]').type('서울');
      cy.wait('@searchChatRooms');

      cy.contains('서울 여행 그룹 채팅').should('be.visible');
    });
  });

  describe('Chat Messages', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/chat/rooms/1/messages*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              senderId: 2,
              senderNickname: 'TravelBuddy',
              content: '안녕하세요!',
              type: 'TEXT',
              createdAt: '2024-01-20T10:00:00Z',
              isRead: true,
            },
            {
              id: 2,
              senderId: 1,
              senderNickname: 'TestUser',
              content: '반갑습니다!',
              type: 'TEXT',
              createdAt: '2024-01-20T10:05:00Z',
              isRead: true,
            },
            {
              id: 3,
              senderId: 2,
              senderNickname: 'TravelBuddy',
              content: '내일 몇 시에 만나요?',
              type: 'TEXT',
              createdAt: '2024-01-20T10:30:00Z',
              isRead: false,
            },
          ],
          totalElements: 3,
          totalPages: 1,
          number: 0,
        },
      }).as('getMessages');

      cy.intercept('GET', '**/api/chat/rooms/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: '서울 여행 그룹 채팅',
          type: 'GROUP',
          participants: [
            { id: 1, nickname: 'TestUser', profileImageUrl: null },
            { id: 2, nickname: 'TravelBuddy', profileImageUrl: null },
          ],
        },
      }).as('getChatRoom');
    });

    it('should display chat messages', () => {
      cy.visit('/chat/1');
      cy.wait(['@getChatRoom', '@getMessages']);

      cy.contains('안녕하세요!').should('be.visible');
      cy.contains('반갑습니다!').should('be.visible');
      cy.contains('내일 몇 시에 만나요?').should('be.visible');
    });

    it('should send a text message', () => {
      cy.intercept('POST', '**/api/chat/rooms/1/messages', {
        statusCode: 201,
        body: {
          id: 4,
          senderId: 1,
          senderNickname: 'TestUser',
          content: '10시에 만나요!',
          type: 'TEXT',
          createdAt: new Date().toISOString(),
        },
      }).as('sendMessage');

      cy.visit('/chat/1');
      cy.wait(['@getChatRoom', '@getMessages']);

      cy.get('input[placeholder*="메시지"]').type('10시에 만나요!');
      cy.get('[data-testid="send-button"]').click();

      cy.wait('@sendMessage');
    });

    it('should display image message', () => {
      cy.intercept('GET', '**/api/chat/rooms/2/messages*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              senderId: 2,
              senderNickname: 'TravelBuddy',
              content: null,
              type: 'IMAGE',
              imageUrl: '/images/travel-photo.jpg',
              thumbnailUrl: '/images/travel-photo-thumb.jpg',
              createdAt: '2024-01-20T10:00:00Z',
              isRead: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('getImageMessages');

      cy.intercept('GET', '**/api/chat/rooms/2', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'TravelBuddy',
          type: 'PRIVATE',
        },
      }).as('getChatRoom2');

      cy.visit('/chat/2');
      cy.wait(['@getChatRoom2', '@getImageMessages']);

      cy.get('[data-testid="image-message"]').should('be.visible');
    });

    it('should display location message', () => {
      cy.intercept('GET', '**/api/chat/rooms/3/messages*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              senderId: 2,
              senderNickname: 'TravelBuddy',
              content: null,
              type: 'LOCATION',
              latitude: 37.5796,
              longitude: 126.977,
              placeName: '경복궁',
              createdAt: '2024-01-20T10:00:00Z',
              isRead: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('getLocationMessages');

      cy.intercept('GET', '**/api/chat/rooms/3', {
        statusCode: 200,
        body: {
          id: 3,
          name: 'LocationChat',
          type: 'PRIVATE',
        },
      }).as('getChatRoom3');

      cy.visit('/chat/3');
      cy.wait(['@getChatRoom3', '@getLocationMessages']);

      cy.get('[data-testid="location-message"]').should('be.visible');
      cy.contains('경복궁').should('be.visible');
    });

    it('should show typing indicator', () => {
      cy.visit('/chat/1');
      cy.wait(['@getChatRoom', '@getMessages']);

      // Simulate typing indicator via WebSocket mock
      cy.window().then(win => {
        const event = new CustomEvent('ws:typing', {
          detail: {
            roomId: 1,
            users: [{ id: 2, nickname: 'TravelBuddy', profileImageUrl: null }],
          },
        });
        win.dispatchEvent(event);
      });

      cy.get('[data-testid="typing-indicator"]').should('be.visible');
      cy.contains('TravelBuddy님이 입력 중').should('be.visible');
    });
  });

  describe('Private Chat', () => {
    it('should start private chat', () => {
      cy.intercept('POST', '**/api/chat/rooms/private', {
        statusCode: 201,
        body: {
          id: 5,
          name: 'NewUser',
          type: 'PRIVATE',
          participants: [
            { id: 1, nickname: 'TestUser', profileImageUrl: null },
            { id: 5, nickname: 'NewUser', profileImageUrl: null },
          ],
        },
      }).as('createPrivateChat');

      cy.intercept('GET', '**/api/users/5', {
        statusCode: 200,
        body: {
          id: 5,
          nickname: 'NewUser',
          profileImageUrl: null,
        },
      }).as('getUserProfile');

      cy.visit('/profile/5');
      cy.wait('@getUserProfile');

      cy.get('button').contains('메시지').click();
      cy.wait('@createPrivateChat');

      cy.url().should('include', '/chat/5');
    });
  });

  describe('Group Chat', () => {
    it('should display group chat info', () => {
      cy.intercept('GET', '**/api/chat/rooms/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: '서울 여행 그룹 채팅',
          type: 'GROUP',
          groupId: 1,
          participants: [
            { id: 1, nickname: 'TestUser', profileImageUrl: null, role: 'MEMBER' },
            { id: 2, nickname: 'TravelBuddy', profileImageUrl: null, role: 'LEADER' },
            { id: 3, nickname: 'Explorer', profileImageUrl: null, role: 'MEMBER' },
          ],
        },
      }).as('getGroupChatRoom');

      cy.intercept('GET', '**/api/chat/rooms/1/messages*', {
        statusCode: 200,
        body: { content: [], totalElements: 0, totalPages: 0, number: 0 },
      }).as('getMessages');

      cy.visit('/chat/1');
      cy.wait(['@getGroupChatRoom', '@getMessages']);

      cy.get('[data-testid="chat-info-button"]').click();
      cy.get('[data-testid="chat-info-modal"]').should('be.visible');
      cy.contains('서울 여행 그룹 채팅').should('be.visible');
      cy.contains('3명').should('be.visible'); // participants count
    });

    it('should leave group chat', () => {
      cy.intercept('GET', '**/api/chat/rooms/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: '서울 여행 그룹 채팅',
          type: 'GROUP',
          groupId: 1,
        },
      }).as('getGroupChatRoom');

      cy.intercept('GET', '**/api/chat/rooms/1/messages*', {
        statusCode: 200,
        body: { content: [], totalElements: 0, totalPages: 0, number: 0 },
      }).as('getMessages');

      cy.intercept('DELETE', '**/api/chat/rooms/1/leave', {
        statusCode: 200,
        body: { success: true },
      }).as('leaveChatRoom');

      cy.visit('/chat/1');
      cy.wait(['@getGroupChatRoom', '@getMessages']);

      cy.get('[data-testid="chat-menu-button"]').click();
      cy.get('[data-testid="leave-chat-button"]').click();
      cy.get('[data-testid="confirm-leave-button"]').click();

      cy.wait('@leaveChatRoom');
      cy.url().should('include', '/chat');
    });
  });

  describe('Media Upload', () => {
    it('should upload and send image', () => {
      cy.intercept('POST', '**/api/upload/image', {
        statusCode: 200,
        body: {
          url: '/images/uploaded-photo.jpg',
          thumbnailUrl: '/images/uploaded-photo-thumb.jpg',
        },
      }).as('uploadImage');

      cy.intercept('POST', '**/api/chat/rooms/1/messages', {
        statusCode: 201,
        body: {
          id: 5,
          senderId: 1,
          senderNickname: 'TestUser',
          type: 'IMAGE',
          imageUrl: '/images/uploaded-photo.jpg',
          thumbnailUrl: '/images/uploaded-photo-thumb.jpg',
          createdAt: new Date().toISOString(),
        },
      }).as('sendImageMessage');

      cy.intercept('GET', '**/api/chat/rooms/1', {
        statusCode: 200,
        body: { id: 1, name: 'Test Chat', type: 'PRIVATE' },
      }).as('getChatRoom');

      cy.intercept('GET', '**/api/chat/rooms/1/messages*', {
        statusCode: 200,
        body: { content: [], totalElements: 0, totalPages: 0, number: 0 },
      }).as('getMessages');

      cy.visit('/chat/1');
      cy.wait(['@getChatRoom', '@getMessages']);

      cy.get('[data-testid="attach-button"]').click();
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait('@uploadImage');
      cy.wait('@sendImageMessage');
    });

    it('should share location', () => {
      cy.mockGeolocation(37.5665, 126.978);

      cy.intercept('POST', '**/api/chat/rooms/1/messages', {
        statusCode: 201,
        body: {
          id: 6,
          senderId: 1,
          senderNickname: 'TestUser',
          type: 'LOCATION',
          latitude: 37.5665,
          longitude: 126.978,
          placeName: '현재 위치',
          createdAt: new Date().toISOString(),
        },
      }).as('sendLocationMessage');

      cy.intercept('GET', '**/api/chat/rooms/1', {
        statusCode: 200,
        body: { id: 1, name: 'Test Chat', type: 'PRIVATE' },
      }).as('getChatRoom');

      cy.intercept('GET', '**/api/chat/rooms/1/messages*', {
        statusCode: 200,
        body: { content: [], totalElements: 0, totalPages: 0, number: 0 },
      }).as('getMessages');

      cy.visit('/chat/1');
      cy.wait(['@getChatRoom', '@getMessages']);

      cy.get('[data-testid="location-button"]').click();
      cy.get('[data-testid="share-current-location"]').click();

      cy.wait('@sendLocationMessage');
    });
  });

  describe('Message Actions', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/chat/rooms/1', {
        statusCode: 200,
        body: { id: 1, name: 'Test Chat', type: 'PRIVATE' },
      }).as('getChatRoom');

      cy.intercept('GET', '**/api/chat/rooms/1/messages*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              senderId: 1,
              senderNickname: 'TestUser',
              content: '삭제할 메시지',
              type: 'TEXT',
              createdAt: '2024-01-20T10:00:00Z',
              isRead: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('getMessages');
    });

    it('should delete own message', () => {
      cy.intercept('DELETE', '**/api/chat/messages/1', {
        statusCode: 200,
        body: { success: true },
      }).as('deleteMessage');

      cy.visit('/chat/1');
      cy.wait(['@getChatRoom', '@getMessages']);

      cy.get('[data-testid="message-1"]').rightclick();
      cy.get('[data-testid="delete-message-button"]').click();
      cy.get('[data-testid="confirm-delete-button"]').click();

      cy.wait('@deleteMessage');
    });

    it('should copy message text', () => {
      cy.visit('/chat/1');
      cy.wait(['@getChatRoom', '@getMessages']);

      cy.get('[data-testid="message-1"]').rightclick();
      cy.get('[data-testid="copy-message-button"]').click();

      // Verify clipboard (requires clipboard permissions in Cypress config)
      cy.window().then(win => {
        win.navigator.clipboard.readText().then(text => {
          expect(text).to.eq('삭제할 메시지');
        });
      });
    });
  });
});
