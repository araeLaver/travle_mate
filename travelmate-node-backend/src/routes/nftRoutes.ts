import { Router } from 'express';
import * as nftController from '../controllers/nftController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/locations', nftController.getLocations);
router.post('/collect', authenticateToken, nftController.collectNft);
router.get('/my-collections', authenticateToken, nftController.getUserCollections);

export default router;
