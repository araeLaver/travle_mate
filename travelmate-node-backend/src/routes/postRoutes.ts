import { Router } from 'express';
import * as postController from '../controllers/postController';
import * as commentController from '../controllers/commentController';
import * as interactionController from '../controllers/interactionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Post CRUD
router.get('/', postController.getPosts);
router.post('/', authenticateToken, postController.createPost);
router.get('/:id', postController.getPostById);

// Post Interactions (Likes)
router.post('/:postId/like', authenticateToken, interactionController.togglePostLike);

// Post Comments
router.get('/:postId/comments', commentController.getCommentsByPost);
router.post('/:postId/comments', authenticateToken, commentController.createComment);
router.delete('/comments/:id', authenticateToken, commentController.deleteComment);

export default router;
