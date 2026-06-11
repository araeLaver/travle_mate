import { Router } from 'express';
import * as userController from '../controllers/userController';
import * as interactionController from '../controllers/interactionController';
import * as oauthController from '../controllers/oauthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Auth & Profile
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/oauth-login', oauthController.handleOAuthLogin);
router.get('/profile', authenticateToken, userController.getProfile);

// Social Interactions (Follows)
router.post('/follow/:followingId', authenticateToken, interactionController.followUser);
router.delete('/follow/:followingId', authenticateToken, interactionController.unfollowUser);
router.get('/:userId/followers', interactionController.getFollowers);

export default router;
