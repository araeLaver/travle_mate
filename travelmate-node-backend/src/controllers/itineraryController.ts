import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

export const getItineraries = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  try {
    const result = await query(
      `SELECT i.*, u.nickname as owner_nickname
       FROM travel_itineraries i
       JOIN users u ON i.user_id = u.id
       WHERE i.user_id = $1 OR i.visibility = 'PUBLIC'
       ORDER BY i.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch itineraries error:', error);
    res.status(500).json({ error: 'Server error fetching itineraries' });
  }
};

export const createItinerary = async (req: AuthRequest, res: Response) => {
  const { title, description, startDate, endDate, visibility, coverImage } = req.body;
  const userId = req.user?.id;
  const shareCode = crypto.randomBytes(4).toString('hex');

  try {
    const result = await query(
      `INSERT INTO travel_itineraries (user_id, title, description, start_date, end_date, visibility, share_code, cover_image, view_count, like_count, copy_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, NOW(), NOW())
       RETURNING *`,
      [userId, title, description, startDate, endDate, visibility || 'PRIVATE', shareCode, coverImage]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create itinerary error:', error);
    res.status(500).json({ error: 'Server error creating itinerary' });
  }
};

export const getItineraryById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const result = await query(
      `SELECT i.*, u.nickname as owner_nickname
       FROM travel_itineraries i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
      [id]
    );
    
    const itinerary = result.rows[0];
    
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Access control
    if (itinerary.visibility === 'PRIVATE' && itinerary.user_id !== userId) {
      return res.status(403).json({ error: 'Private itinerary' });
    }

    // Fetch items
    const itemsResult = await query(
      'SELECT * FROM itinerary_items WHERE itinerary_id = $1 ORDER BY day_number ASC, order_index ASC',
      [id]
    );
    itinerary.items = itemsResult.rows;

    res.json(itinerary);
  } catch (error) {
    console.error('Fetch itinerary error:', error);
    res.status(500).json({ error: 'Server error fetching itinerary' });
  }
};
