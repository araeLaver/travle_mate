import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { generateToken, AuthRequest } from '../middleware/auth';

export const register = async (req: AuthRequest, res: Response) => {
  const { email, password, nickname } = req.body;

  try {
    const userCheck = await query('SELECT id FROM users WHERE email = $1 OR nickname = $2', [email, nickname]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email or nickname already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password, nickname, role, is_active, is_location_enabled, is_matching_enabled, is_email_verified, phone_verified, email_notification_enabled, push_notification_enabled, privacy_profile_visible, privacy_location_visible, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING id, email, nickname, role',
      [email, hashedPassword, nickname, 'USER', true, false, false, false, false, true, true, true, true]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    
    // Update last activity
    await query('UPDATE users SET last_activity_at = NOW() WHERE id = $1', [user.id]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT id, email, nickname, full_name, age, gender, profile_image_url, bio, travel_style, rating, review_count, role, polygon_wallet_address, total_nfts_collected, unique_locations_visited FROM users WHERE id = $1', [req.user?.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};
