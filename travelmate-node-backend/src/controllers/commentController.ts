import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getCommentsByPost = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;

  try {
    const result = await query(
      `SELECT c.*, u.nickname as author_nickname, u.profile_image_url as author_profile_image
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1 AND c.is_deleted = false
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ error: 'Server error fetching comments' });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const { content, parentCommentId } = req.body;
  const authorId = req.user?.id;

  try {
    const result = await query(
      `INSERT INTO comments (content, post_id, author_id, parent_comment_id, like_count, is_deleted, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, false, NOW(), NOW())
       RETURNING *`,
      [content, postId, authorId, parentCommentId || null]
    );

    // Update comment count in post
    await query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1', [postId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error creating comment' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const authorId = req.user?.id;

  try {
    const commentResult = await query('SELECT * FROM comments WHERE id = $1', [id]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = commentResult.rows[0];
    if (comment.author_id !== authorId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    await query('UPDATE comments SET is_deleted = true WHERE id = $1', [id]);
    await query('UPDATE posts SET comment_count = comment_count - 1 WHERE id = $1', [comment.post_id]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error deleting comment' });
  }
};
