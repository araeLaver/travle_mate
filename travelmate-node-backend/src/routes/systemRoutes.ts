import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import * as notificationController from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// File Uploads
router.post('/upload', authenticateToken, uploadController.upload.single('file'), uploadController.handleFileUpload);

// Notifications
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.post('/notifications/:id/read', authenticateToken, notificationController.markAsRead);
router.post('/notifications/fcm-token', authenticateToken, notificationController.registerFcmToken);

export default router;
