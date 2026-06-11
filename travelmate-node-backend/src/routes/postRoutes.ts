import { Router } from 'express';
import * as postController from '../controllers/postController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', postController.getPosts);
router.post('/', authenticateToken, postController.createPost);
router.get('/:id', postController.getPostById);

export default router;
