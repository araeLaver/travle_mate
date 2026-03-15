describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login Flow', () => {
    it('should display login page', () => {
      cy.visit('/login');
      cy.contains('로그인').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 1,
            email: 'test@example.com',
            nickname: 'TestUser',
            profileImageUrl: null,
          },
        },
      }).as('login');

      cy.visit('/login');
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@login');
      cy.url().should('not.include', '/login');
    });

    it('should show error message for invalid credentials', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: {
          error: '이메일 또는 비밀번호가 올바르지 않습니다.',
        },
      }).as('loginFail');

      cy.visit('/login');
      cy.get('input[type="email"]').type('wrong@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginFail');
      cy.contains('이메일 또는 비밀번호').should('be.visible');
    });

    it('should validate email format', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      // HTML5 validation should prevent submission
      cy.get('input[type="email"]:invalid').should('exist');
    });
  });

  describe('Register Flow', () => {
    it('should display register page', () => {
      cy.visit('/register');
      cy.contains('회원가입').should('be.visible');
    });

    it('should register successfully', () => {
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 201,
        body: {
          id: 1,
          email: 'newuser@example.com',
          nickname: 'NewUser',
        },
      }).as('register');

      cy.visit('/register');
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      cy.get('input[name="username"]').type('NewUser');
      cy.get('button[type="submit"]').click();

      cy.wait('@register');
    });

    it('should show error for existing email', () => {
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 409,
        body: {
          error: '이미 존재하는 이메일입니다.',
        },
      }).as('registerFail');

      cy.visit('/register');
      cy.get('input[name="email"]').type('existing@example.com');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      cy.get('input[name="username"]').type('ExistingUser');
      cy.get('button[type="submit"]').click();

      cy.wait('@registerFail');
      cy.contains('이미 존재하는 이메일').should('be.visible');
    });

    it('should validate password confirmation', () => {
      cy.visit('/register');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('DifferentPassword!');
      cy.get('input[name="username"]').type('TestUser');
      cy.get('button[type="submit"]').click();

      cy.contains('비밀번호가 일치하지 않습니다').should('be.visible');
    });
  });

  // TODO: Implement data-testid="user-menu" and data-testid="logout-button" in Header/Nav component
  describe.skip('Logout Flow', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
    });

    it('should logout successfully', () => {
      cy.intercept('POST', '**/api/auth/logout', {
        statusCode: 200,
        body: { success: true },
      }).as('logout');

      // Find and click logout button (adjust selector based on actual UI)
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      cy.url().should('include', '/login');
    });
  });
});
