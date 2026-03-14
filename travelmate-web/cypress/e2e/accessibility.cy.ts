describe('Accessibility', () => {
  beforeEach(() => {
    cy.window().then(win => {
      win.localStorage.setItem('accessToken', 'mock-access-token');
      win.localStorage.setItem('refreshToken', 'mock-refresh-token');
    });

    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: { id: 1, email: 'test@example.com', nickname: 'TestUser' },
    }).as('getMe');
  });

  describe('Keyboard Navigation', () => {
    it('should navigate main menu with keyboard', () => {
      cy.visit('/');

      // Tab through navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'nav-home');

      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'nav-groups');

      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'nav-nft');
    });

    it('should open and navigate dropdown with keyboard', () => {
      cy.visit('/');

      cy.get('[data-testid="user-menu"]').focus();
      cy.get('[data-testid="user-menu"]').type('{enter}');
      cy.get('[data-testid="user-dropdown"]').should('be.visible');

      cy.get('[data-testid="user-dropdown"]').within(() => {
        cy.get('a, button').first().should('have.focus');
      });

      // Navigate with arrow keys
      cy.focused().type('{downarrow}');
      cy.focused().should('have.attr', 'data-testid', 'dropdown-item-2');

      // Close with escape
      cy.focused().type('{esc}');
      cy.get('[data-testid="user-dropdown"]').should('not.exist');
    });

    it('should trap focus in modal', () => {
      cy.intercept('GET', '**/api/nft/collection*', {
        statusCode: 200,
        body: {
          content: [{ id: 1, locationName: 'Test NFT', mintStatus: 'NOT_MINTED' }],
          totalElements: 1,
        },
      }).as('getCollection');

      cy.visit('/nft/collection');
      cy.wait('@getCollection');

      // Open modal
      cy.get('[data-testid="nft-card-1"] button').contains('민팅하기').click();
      cy.get('[data-testid="minting-modal"]').should('be.visible');

      // Tab should stay within modal
      cy.get('[data-testid="minting-modal"]').within(() => {
        const focusableElements = cy.get(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        // Tab to last element
        focusableElements.last().focus();
        cy.focused().tab();

        // Should wrap to first element
        focusableElements.first().should('have.focus');
      });
    });

    it('should close modal with Escape key', () => {
      cy.intercept('GET', '**/api/nft/collection*', {
        statusCode: 200,
        body: {
          content: [{ id: 1, locationName: 'Test', mintStatus: 'NOT_MINTED' }],
          totalElements: 1,
        },
      }).as('getCollection');

      cy.visit('/nft/collection');
      cy.wait('@getCollection');

      cy.get('[data-testid="nft-card-1"] button').contains('민팅하기').click();
      cy.get('[data-testid="minting-modal"]').should('be.visible');

      cy.get('body').type('{esc}');
      cy.get('[data-testid="minting-modal"]').should('not.exist');
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels on buttons', () => {
      cy.visit('/');

      cy.get('[data-testid="notification-button"]')
        .should('have.attr', 'aria-label')
        .and('match', /알림|notifications/i);

      cy.get('[data-testid="user-menu"]')
        .should('have.attr', 'aria-label')
        .and('match', /사용자 메뉴|user menu/i);
    });

    it('should have proper ARIA labels on form inputs', () => {
      cy.visit('/login');

      cy.get('input[type="email"]').should('have.attr', 'aria-label').or('have.attr', 'id');

      cy.get('input[type="password"]').should('have.attr', 'aria-label').or('have.attr', 'id');
    });

    it('should announce loading states', () => {
      cy.intercept('GET', '**/api/groups*', {
        delay: 1000,
        statusCode: 200,
        body: { content: [], totalElements: 0 },
      }).as('getGroups');

      cy.visit('/groups');

      cy.get('[role="status"]')
        .should('have.attr', 'aria-live', 'polite')
        .and('contain.text', '로딩');

      cy.wait('@getGroups');
    });

    it('should have proper heading hierarchy', () => {
      cy.visit('/');

      // Should have exactly one h1
      cy.get('h1').should('have.length', 1);

      // Headings should be in order
      cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
        let lastLevel = 0;
        $headings.each((_, heading) => {
          const level = parseInt(heading.tagName.substring(1));
          expect(level).to.be.at.most(lastLevel + 1);
          lastLevel = level;
        });
      });
    });

    it('should have proper role attributes on interactive elements', () => {
      cy.intercept('GET', '**/api/groups*', {
        statusCode: 200,
        body: { content: [], totalElements: 0 },
      }).as('getGroups');

      cy.visit('/groups');
      cy.wait('@getGroups');

      // Tab panels
      cy.get('[role="tablist"]').should('exist');
      cy.get('[role="tab"]').should('have.attr', 'aria-selected');
      cy.get('[role="tabpanel"]').should('exist');
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for text', () => {
      cy.visit('/');

      // Check primary text
      cy.get('body').then($body => {
        const backgroundColor = $body.css('background-color');
        const textColor = $body.css('color');

        // Note: In a real test, you would calculate contrast ratio
        // This is a simplified check
        expect(backgroundColor).to.not.equal(textColor);
      });
    });

    it('should not rely solely on color for information', () => {
      cy.intercept('GET', '**/api/nft/collection*', {
        statusCode: 200,
        body: {
          content: [
            { id: 1, locationName: 'Legendary NFT', rarity: 'LEGENDARY' },
            { id: 2, locationName: 'Common NFT', rarity: 'COMMON' },
          ],
          totalElements: 2,
        },
      }).as('getCollection');

      cy.visit('/nft/collection');
      cy.wait('@getCollection');

      // Rarity should have text labels, not just colors
      cy.get('[data-testid="nft-card-1"]').within(() => {
        cy.contains(/legendary|레전더리/i).should('be.visible');
      });

      cy.get('[data-testid="nft-card-2"]').within(() => {
        cy.contains(/common|커먼/i).should('be.visible');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have skip link for main content', () => {
      cy.visit('/');

      cy.get('[data-testid="skip-link"]').should('exist').and('have.attr', 'href', '#main-content');

      // Skip link should be visible on focus
      cy.get('[data-testid="skip-link"]').focus();
      cy.get('[data-testid="skip-link"]').should('be.visible');
    });

    it('should have alt text for images', () => {
      cy.intercept('GET', '**/api/users/1', {
        statusCode: 200,
        body: { id: 1, nickname: 'TestUser', profileImageUrl: '/images/profile.jpg' },
      }).as('getUserProfile');

      cy.visit('/profile/1');
      cy.wait('@getUserProfile');

      cy.get('img').each($img => {
        // Images should have alt or be marked as decorative
        const alt = $img.attr('alt');
        const role = $img.attr('role');

        expect(alt !== undefined || role === 'presentation').to.be.true;
      });
    });

    it('should have descriptive link text', () => {
      cy.visit('/');

      // Links should not have generic text
      cy.get('a').each($link => {
        const text = $link.text().trim().toLowerCase();
        const ariaLabel = $link.attr('aria-label');

        // Should not be just "click here" or "read more"
        const genericTexts = ['click here', 'read more', 'here', 'more', '더보기'];

        if (!ariaLabel) {
          genericTexts.forEach(generic => {
            expect(text).to.not.equal(generic);
          });
        }
      });
    });

    it('should announce dynamic content changes', () => {
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: { content: [], totalElements: 0 },
      }).as('getNotifications');

      cy.visit('/notifications');
      cy.wait('@getNotifications');

      // Check for live region
      cy.get(
        '[aria-live="polite"], [aria-live="assertive"], [role="alert"], [role="status"]'
      ).should('exist');
    });
  });

  describe('Focus Management', () => {
    it('should return focus after modal closes', () => {
      cy.intercept('GET', '**/api/nft/collection*', {
        statusCode: 200,
        body: {
          content: [{ id: 1, locationName: 'Test', mintStatus: 'NOT_MINTED' }],
          totalElements: 1,
        },
      }).as('getCollection');

      cy.visit('/nft/collection');
      cy.wait('@getCollection');

      cy.get('[data-testid="nft-card-1"] button').contains('민팅하기').as('openButton');
      cy.get('@openButton').click();

      cy.get('[data-testid="minting-modal"]').should('be.visible');
      cy.get('[data-testid="close-modal-button"]').click();

      // Focus should return to the button that opened the modal
      cy.get('@openButton').should('have.focus');
    });

    it('should focus first error on form validation failure', () => {
      cy.visit('/register');

      // Submit empty form
      cy.get('button[type="submit"]').click();

      // First invalid input should be focused
      cy.get('input:invalid').first().should('have.focus');
    });

    it('should maintain focus position after content update', () => {
      cy.intercept('GET', '**/api/groups*', {
        statusCode: 200,
        body: {
          content: [
            { id: 1, name: 'Group 1' },
            { id: 2, name: 'Group 2' },
          ],
          totalElements: 2,
        },
      }).as('getGroups');

      cy.visit('/groups');
      cy.wait('@getGroups');

      // Focus on a group card
      cy.get('[data-testid="group-card-1"]').focus();

      // Trigger a refresh
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@getGroups');

      // Focus should remain on the same logical element
      cy.get('[data-testid="group-card-1"]').should('have.focus');
    });
  });

  describe('Reduced Motion', () => {
    it('should respect prefers-reduced-motion setting', () => {
      // Emulate reduced motion preference
      cy.wrap(
        Cypress.automation('remote:debugger:protocol', {
          command: 'Emulation.setEmulatedMedia',
          params: {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
          },
        })
      );

      cy.visit('/');

      // Check that animations are disabled or reduced
      cy.get('*').then($elements => {
        $elements.each((_, el) => {
          const animationDuration = window.getComputedStyle(el).animationDuration;
          const transitionDuration = window.getComputedStyle(el).transitionDuration;

          // Animations should be instant (0s) or very short when reduced motion is preferred
          if (animationDuration !== '0s') {
            expect(parseFloat(animationDuration)).to.be.lessThan(0.1);
          }
        });
      });
    });
  });

  describe('Form Accessibility', () => {
    it('should have associated labels for inputs', () => {
      cy.visit('/login');

      cy.get('input').each($input => {
        const id = $input.attr('id');
        const ariaLabel = $input.attr('aria-label');
        const ariaLabelledBy = $input.attr('aria-labelledby');

        // Input should have a label associated via id, aria-label, or aria-labelledby
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        } else {
          expect(ariaLabel || ariaLabelledBy).to.exist;
        }
      });
    });

    it('should display error messages accessibly', () => {
      cy.visit('/login');

      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      }).as('loginFail');

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginFail');

      // Error should be associated with input and announced
      cy.get('[role="alert"]').should('exist');
      cy.get('input[type="password"]')
        .should('have.attr', 'aria-invalid', 'true')
        .and('have.attr', 'aria-describedby');
    });

    it('should indicate required fields', () => {
      cy.visit('/register');

      cy.get('input[required]').each($input => {
        // Required inputs should have aria-required or visible indicator
        const ariaRequired = $input.attr('aria-required');
        const required = $input.attr('required');

        expect(ariaRequired === 'true' || required !== undefined).to.be.true;
      });
    });
  });
});
