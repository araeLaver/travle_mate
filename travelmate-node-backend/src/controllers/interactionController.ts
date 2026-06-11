import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';

// ==================== Post Likes ====================

export const togglePostLike = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const userId = req.user?.id;

  try {
    const likeCheck = await query('SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    
    if (likeCheck.rows.length > 0) {
      // Unlike
      await query('DELETE FROM post_likes WHERE id = $1', [likeCheck.rows[0].id]);
      await query('UPDATE posts SET like_count = like_count - 1 WHERE id = $1', [postId]);
      res.json({ liked: false });
    } else {
      // Like
      await query('INSERT INTO post_likes (post_id, user_id, created_at) VALUES ($1, $2, NOW())', [postId, userId]);
      await query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1', [postId]);
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Server error toggling like' });
  }
};

// ==================== User Follows ====================

export const followUser = async (req: AuthRequest, res: Response) => {
  const { followingId } = req.params;
  const followerId = req.user?.id;

  if (followerId === parseInt(followingId)) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    const followCheck = await query('SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
    
    if (followCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    await query('INSERT INTO user_follows (follower_id, following_id, created_at) VALUES ($1, $2, NOW())', [followerId, followingId]);
    res.json({ followed: true });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Server error during follow operation' });
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  const { followingId } = req.params;
  const followerId = req.user?.id;

  try {
    await query('DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
    res.json({ followed: false });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Server error during unfollow operation' });
  }
};

export const getFollowers = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const result = await query(
      `SELECT u.id, u.nickname, u.profile_image_url
       FROM user_follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Server error fetching followers' });
  }
};
