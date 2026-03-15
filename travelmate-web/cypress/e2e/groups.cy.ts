describe('Travel Groups', () => {
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

    // Set auth tokens via onBeforeLoad so localStorage is set on the correct origin
    // (cy.window() before cy.visit() targets about:blank and tokens are lost on navigation)
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('accessToken', 'mock-access-token');
        win.localStorage.setItem('refreshToken', 'mock-refresh-token');
      },
    });
  });

  describe('Groups List', () => {
    it('should display groups list', () => {
      cy.intercept('GET', '**/api/groups*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              name: '서울 여행',
              description: '서울 여행 그룹입니다',
              memberCount: 5,
              maxMembers: 10,
              thumbnail: null,
              startDate: '2024-03-01',
              endDate: '2024-03-05',
              status: 'RECRUITING',
            },
            {
              id: 2,
              name: '부산 맛집 투어',
              description: '부산 맛집을 탐방합니다',
              memberCount: 3,
              maxMembers: 8,
              thumbnail: null,
              startDate: '2024-04-01',
              endDate: '2024-04-03',
              status: 'RECRUITING',
            },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
        },
      }).as('getGroups');

      cy.visit('/groups');
      cy.wait('@getGroups');

      cy.contains('서울 여행').should('be.visible');
      cy.contains('부산 맛집 투어').should('be.visible');
    });

    it('should filter groups by search term', () => {
      cy.intercept('GET', '**/api/groups*keyword=서울*', {
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              name: '서울 여행',
              description: '서울 여행 그룹입니다',
              memberCount: 5,
              maxMembers: 10,
              thumbnail: null,
              startDate: '2024-03-01',
              endDate: '2024-03-05',
              status: 'RECRUITING',
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      }).as('searchGroups');

      cy.visit('/groups');
      cy.get('input[placeholder*="검색"]').type('서울');
      cy.wait('@searchGroups');

      cy.contains('서울 여행').should('be.visible');
      cy.contains('부산 맛집 투어').should('not.exist');
    });
  });

  describe('Create Group', () => {
    it('should create a new group', () => {
      cy.intercept('POST', '**/api/groups', {
        statusCode: 201,
        body: {
          id: 3,
          name: '제주도 힐링',
          description: '제주도에서 힐링하는 여행',
          memberCount: 1,
          maxMembers: 6,
          thumbnail: null,
          startDate: '2024-05-01',
          endDate: '2024-05-04',
          status: 'RECRUITING',
        },
      }).as('createGroup');

      cy.visit('/groups/create');

      cy.get('input[name="name"]').type('제주도 힐링');
      cy.get('textarea[name="description"]').type('제주도에서 힐링하는 여행');
      cy.get('input[name="maxMembers"]').clear().type('6');
      cy.get('input[name="startDate"]').type('2024-05-01');
      cy.get('input[name="endDate"]').type('2024-05-04');
      cy.get('button[type="submit"]').click();

      cy.wait('@createGroup');
      cy.url().should('include', '/groups');
    });

    it('should validate required fields', () => {
      cy.visit('/groups/create');

      cy.get('button[type="submit"]').click();
      cy.contains('그룹 이름을 입력해주세요').should('be.visible');
    });
  });

  describe('Group Detail', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/groups/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: '서울 여행',
          description: '서울의 명소를 탐방하는 여행입니다',
          memberCount: 5,
          maxMembers: 10,
          thumbnail: null,
          startDate: '2024-03-01',
          endDate: '2024-03-05',
          status: 'RECRUITING',
          leader: {
            id: 2,
            nickname: 'TravelMaster',
            profileImageUrl: null,
          },
          members: [
            { id: 1, nickname: 'TestUser', profileImageUrl: null },
            { id: 2, nickname: 'TravelMaster', profileImageUrl: null },
          ],
          isJoined: false,
        },
      }).as('getGroup');
    });

    it('should display group details', () => {
      cy.visit('/groups/1');
      cy.wait('@getGroup');

      cy.contains('서울 여행').should('be.visible');
      cy.contains('서울의 명소를 탐방하는 여행입니다').should('be.visible');
      cy.contains('5 / 10').should('be.visible'); // member count
    });

    it('should join group', () => {
      cy.intercept('POST', '**/api/groups/1/join', {
        statusCode: 200,
        body: { success: true },
      }).as('joinGroup');

      cy.visit('/groups/1');
      cy.wait('@getGroup');

      cy.get('button').contains('참여하기').click();
      cy.wait('@joinGroup');

      cy.contains('그룹에 참여했습니다').should('be.visible');
    });

    it('should leave group', () => {
      cy.intercept('GET', '**/api/groups/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: '서울 여행',
          description: '서울의 명소를 탐방하는 여행입니다',
          memberCount: 5,
          maxMembers: 10,
          thumbnail: null,
          startDate: '2024-03-01',
          endDate: '2024-03-05',
          status: 'RECRUITING',
          isJoined: true,
        },
      }).as('getJoinedGroup');

      cy.intercept('DELETE', '**/api/groups/1/leave', {
        statusCode: 200,
        body: { success: true },
      }).as('leaveGroup');

      cy.visit('/groups/1');
      cy.wait('@getJoinedGroup');

      cy.get('button').contains('탈퇴하기').click();
      cy.wait('@leaveGroup');
    });
  });
});
