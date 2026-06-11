import { Router } from 'express';
import * as itineraryController from '../controllers/itineraryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, itineraryController.getItineraries);
router.post('/', authenticateToken, itineraryController.createItinerary);
router.get('/:id', authenticateToken, itineraryController.getItineraryById);

export default router;
