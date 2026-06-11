import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getPosts = async (req: AuthRequest, res: Response) => {
  const { category, limit = 10, offset = 0 } = req.query;
  
  try {
    let sql = `
      SELECT p.*, u.nickname as author_nickname, u.profile_image_url as author_profile_image
      FROM posts p
      JOIN users u ON p.author_id = u.id
    `;
    const params: any[] = [];
    
    if (category) {
      sql += ` WHERE p.category = $1`;
      params.push(category);
    }
    
    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ error: 'Server error fetching posts' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  const { title, content, category, locationName, locationLatitude, locationLongitude } = req.body;
  const authorId = req.user?.id;

  try {
    const result = await query(
      `INSERT INTO posts (title, content, category, author_id, location_name, location_latitude, location_longitude, view_count, like_count, comment_count, is_pinned, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, false, NOW(), NOW())
       RETURNING *`,
      [title, content, category, authorId, locationName, locationLatitude, locationLongitude]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error creating post' });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Increase view count
    await query('UPDATE posts SET view_count = view_count + 1 WHERE id = $1', [id]);
    
    const result = await query(
      `SELECT p.*, u.nickname as author_nickname, u.profile_image_url as author_profile_image
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch post error:', error);
    res.status(500).json({ error: 'Server error fetching post' });
  }
};
