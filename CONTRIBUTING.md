# Contributing Guide

## Branch Strategy

### Main Branches

- **main**: Production-ready code
  - Protected branch
  - Direct commits not allowed
  - Only accepts PRs from develop or hotfix branches
  
- **develop**: Integration branch for features
  - Latest development changes
  - Base branch for feature development

### Supporting Branches

- **feature/\***: Feature development
  - Branch from: develop
  - Merge back to: develop
  - Naming: feature/feature-name
  - Example: feature/user-authentication

- **hotfix/\***: Emergency fixes for production
  - Branch from: main
  - Merge back to: main and develop
  - Naming: hotfix/issue-description
  - Example: hotfix/login-error

- **release/\***: Prepare production release
  - Branch from: develop
  - Merge back to: main and develop
  - Naming: release/version
  - Example: release/1.0.0

## Workflow

### Feature Development

1. Create feature branch from develop
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. Develop and commit
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push and create PR
   ```bash
   git push origin feature/new-feature
   ```

4. After review, merge to develop

### Hotfix Process

1. Create hotfix branch from main
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-bug
   ```

2. Fix and commit
   ```bash
   git add .
   git commit -m "fix: resolve critical bug"
   ```

3. Merge to main and develop
   ```bash
   git checkout main
   git merge --no-ff hotfix/critical-bug
   git checkout develop
   git merge --no-ff hotfix/critical-bug
   git branch -d hotfix/critical-bug
   ```

## Commit Convention

Format: `<type>: <subject>`

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code formatting (no functional changes)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Build process or tools

### Examples

```
feat: implement user profile page
fix: resolve login timeout issue
docs: update API documentation
refactor: optimize database queries
```

## Pull Request Guidelines

1. Update develop branch before creating PR
2. Write clear PR title and description
3. Reference related issues
4. Ensure CI checks pass
5. Request review from team members
6. Resolve all review comments

## Code Review Process

- At least 1 approval required
- All CI checks must pass
- No merge conflicts
- Branch up to date with base branch
