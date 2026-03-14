// Cypress E2E Support File
import '@testing-library/cypress/add-commands';
import 'cypress-real-events/support';

// Custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      mockGeolocation(latitude: number, longitude: number): Chainable<void>;
      interceptApi(method: string, url: string, fixture: string): Chainable<void>;
      tab(): Chainable<JQuery<HTMLElement>>;
      setAuthToken(token: string): Chainable<void>;
      waitForApi(alias: string, timeout?: number): Chainable<void>;
      checkA11y(options?: object): Chainable<void>;
      mockWebSocket(): Chainable<void>;
      simulateOffline(): Chainable<void>;
      simulateOnline(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 1,
        email,
        nickname: 'TestUser',
        profileImageUrl: null,
      },
    },
  }).as('login');

  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.wait('@login');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.window().then(win => {
    win.localStorage.removeItem('accessToken');
    win.localStorage.removeItem('refreshToken');
  });
  cy.visit('/login');
});

// Mock geolocation
Cypress.Commands.add('mockGeolocation', (latitude: number, longitude: number) => {
  cy.window().then(win => {
    cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake(success => {
      success({
        coords: {
          latitude,
          longitude,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });

    cy.stub(win.navigator.geolocation, 'watchPosition').callsFake(success => {
      success({
        coords: {
          latitude,
          longitude,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      return 1;
    });
  });
});

// API interceptor helper
Cypress.Commands.add('interceptApi', (method: string, url: string, fixture: string) => {
  cy.intercept(method, `**/api${url}`, { fixture }).as(url.replace(/\//g, '_'));
});

// Tab navigation (for accessibility testing)
Cypress.Commands.add('tab', { prevSubject: 'optional' }, subject => {
  const tabKey = { key: 'Tab', code: 'Tab', which: 9 };

  if (subject) {
    return cy.wrap(subject).trigger('keydown', tabKey);
  }

  return cy.focused().trigger('keydown', tabKey);
});

// Set auth token directly
Cypress.Commands.add('setAuthToken', (token: string) => {
  cy.window().then(win => {
    win.localStorage.setItem('accessToken', token);
    win.localStorage.setItem('refreshToken', `${token}-refresh`);
  });
});

// Wait for API with custom timeout
Cypress.Commands.add('waitForApi', (alias: string, timeout = 10000) => {
  cy.wait(`@${alias}`, { timeout });
});

// Accessibility check (simplified - use cypress-axe for full support)
Cypress.Commands.add('checkA11y', (options = {}) => {
  // This is a placeholder - in production use cypress-axe
  cy.log('Running accessibility checks...');

  // Basic checks
  cy.get('img').each($img => {
    const alt = $img.attr('alt');
    const role = $img.attr('role');
    if (!alt && role !== 'presentation') {
      cy.log(`Warning: Image missing alt text: ${$img.attr('src')}`);
    }
  });

  cy.get('a').each($a => {
    const href = $a.attr('href');
    const text = $a.text().trim();
    if (!text && !$a.attr('aria-label')) {
      cy.log(`Warning: Link missing text: ${href}`);
    }
  });

  cy.get('button').each($button => {
    const text = $button.text().trim();
    if (!text && !$button.attr('aria-label')) {
      cy.log(`Warning: Button missing text/aria-label`);
    }
  });
});

// Mock WebSocket for real-time features
Cypress.Commands.add('mockWebSocket', () => {
  cy.window().then(win => {
    // Create a mock WebSocket
    const mockSocket = {
      send: cy.stub().as('wsSend'),
      close: cy.stub().as('wsClose'),
      addEventListener: cy.stub().as('wsAddEventListener'),
      removeEventListener: cy.stub().as('wsRemoveEventListener'),
      readyState: 1, // OPEN
    };

    // Replace WebSocket constructor
    cy.stub(win, 'WebSocket').returns(mockSocket);
  });
});

// Simulate offline mode
Cypress.Commands.add('simulateOffline', () => {
  cy.log('Simulating offline mode');
  cy.window().then(win => {
    cy.stub(win.navigator, 'onLine').value(false);
    win.dispatchEvent(new Event('offline'));
  });
});

// Simulate online mode
Cypress.Commands.add('simulateOnline', () => {
  cy.log('Simulating online mode');
  cy.window().then(win => {
    cy.stub(win.navigator, 'onLine').value(true);
    win.dispatchEvent(new Event('online'));
  });
});

// Preserve tokens between tests
beforeEach(() => {
  cy.window().then(win => {
    const accessToken = win.localStorage.getItem('accessToken');
    const refreshToken = win.localStorage.getItem('refreshToken');

    if (accessToken) {
      Cypress.env('accessToken', accessToken);
    }
    if (refreshToken) {
      Cypress.env('refreshToken', refreshToken);
    }
  });
});

// Error handling for uncaught exceptions
Cypress.on('uncaught:exception', err => {
  // Ignore specific errors that don't affect tests
  if (
    err.message.includes('ResizeObserver loop') ||
    err.message.includes('Script error') ||
    err.message.includes('Network Error')
  ) {
    return false;
  }
  return true;
});

// Hide fetch/XHR logs for cleaner output
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

export {};
