import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';

// ==================== Collectible Locations ====================

export const getLocations = async (req: AuthRequest, res: Response) => {
  const { latitude, longitude, radius = 5000 } = req.query; // Default 5km

  try {
    let sql = 'SELECT * FROM collectible_locations WHERE is_active = true';
    const params: any[] = [];

    // Simple distance filtering if lat/lng provided
    if (latitude && longitude) {
      // Basic square bounding box for efficiency, or Haversine in SQL
      // 1 degree lat approx 111km, 1 degree lng approx 111*cos(lat)
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const rad = parseFloat(radius as string) / 1000.0; // to km
      
      const latDelta = rad / 111.0;
      const lngDelta = rad / (111.0 * Math.cos(lat * Math.PI / 180.0));

      sql += ` AND latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4`;
      params.push(lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta);
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch locations error:', error);
    res.status(500).json({ error: 'Server error fetching locations' });
  }
};

// ==================== User Collections ====================

import { mintNftOnChain } from '../config/blockchain';

// ... existing calculateDistance helper ...

export const collectNft = async (req: AuthRequest, res: Response) => {
  const { locationId, latitude, longitude, deviceId } = req.body;
  const userId = req.user?.id;

  try {
    // 1. Check if location exists and is active
    const locResult = await query('SELECT * FROM collectible_locations WHERE id = $1 AND is_active = true', [locationId]);
    if (locResult.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found or inactive' });
    }
    const location = locResult.rows[0];

    // 2. Check if already collected
    const existing = await query('SELECT id FROM user_nft_collections WHERE user_id = $1 AND location_id = $2', [userId, locationId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already collected from this location' });
    }

    // 3. Verify distance (Backend check)
    const dist = calculateDistance(
      parseFloat(latitude), parseFloat(longitude),
      parseFloat(location.latitude), parseFloat(location.longitude)
    );

    if (dist > location.collect_radius) {
      return res.status(400).json({ error: 'Too far from location', distance: dist, required: location.collect_radius });
    }

    // 4. Create collection record
    const result = await query(
      `INSERT INTO user_nft_collections (user_id, location_id, mint_status, collected_latitude, collected_longitude, collected_at, device_id, is_verified, earned_points, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, true, $7, NOW())
       RETURNING *`,
      [userId, locationId, 'PENDING', latitude, longitude, deviceId, location.point_reward || 10]
    );

    const collection = result.rows[0];

    // 5. Update location and user stats
    await query('UPDATE collectible_locations SET total_collected = total_collected + 1 WHERE id = $1', [locationId]);
    await query('UPDATE users SET total_nfts_collected = total_nfts_collected + 1 WHERE id = $1', [userId]);

    // 6. Async Mint on Blockchain
    // background process
    mintNftOnChain(collection.id).catch(err => console.error('Background minting error:', err));

    res.status(201).json(collection);
  } catch (error) {
    console.error('Collect NFT error:', error);
    res.status(500).json({ error: 'Server error during NFT collection' });
  }
};

export const getUserCollections = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const result = await query(
      `SELECT c.*, l.name as location_name, l.nft_image_url, l.rarity, l.category
       FROM user_nft_collections c
       JOIN collectible_locations l ON c.location_id = l.id
       WHERE c.user_id = $1
       ORDER BY c.collected_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch user collections error:', error);
    res.status(500).json({ error: 'Server error fetching collections' });
  }
};

// Helper: Haversine distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
