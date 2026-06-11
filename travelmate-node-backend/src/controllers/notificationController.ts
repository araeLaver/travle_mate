import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({ error: 'Server error marking notification as read' });
  }
};

export const registerFcmToken = async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  const userId = req.user?.id;

  try {
    await query('UPDATE users SET fcm_token = $1 WHERE id = $2', [token, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Register FCM token error:', error);
    res.status(500).json({ error: 'Server error registering FCM token' });
  }
};
