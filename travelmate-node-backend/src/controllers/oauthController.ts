import { Response } from 'express';
import axios from 'axios';
import { query } from '../config/db';
import { generateToken, AuthRequest } from '../middleware/auth';

export const handleOAuthLogin = async (req: AuthRequest, res: Response) => {
  const { provider, code, accessToken, redirectUri } = req.body;

  try {
    let token = accessToken;
    
    // 1. If code is provided, exchange it for access token
    if (code && provider !== 'google') {
      token = await exchangeCodeForToken(provider, code, redirectUri);
    }

    // 2. Get user info from provider
    const userInfo = await getProviderUserInfo(provider, token);

    // 3. Find or create user in DB
    let userResult = await query('SELECT * FROM users WHERE email = $1', [userInfo.email]);
    let user = userResult.rows[0];

    if (!user) {
      // Create new user for social login
      const newUser = await query(
        `INSERT INTO users (email, password, nickname, role, provider, provider_id, full_name, profile_image_url, is_active, is_location_enabled, is_matching_enabled, is_email_verified, phone_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, false, true, false, NOW(), NOW())
         RETURNING id, email, nickname, role`,
        [userInfo.email, 'OAUTH_USER', userInfo.nickname || userInfo.email.split('@')[0], 'USER', provider.toUpperCase(), userInfo.id, userInfo.name, userInfo.profileImageUrl]
      );
      user = newUser.rows[0];
    } else {
      // Update existing user's social info if needed
      await query('UPDATE users SET last_activity_at = NOW() WHERE id = $1', [user.id]);
    }

    // 4. Generate JWT
    const jwtToken = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      },
      token: jwtToken
    });

  } catch (error: any) {
    console.error('OAuth login error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
};

async function exchangeCodeForToken(provider: string, code: string, redirectUri: string) {
  if (provider === 'naver') {
    const response = await axios.get('https://nid.naver.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state: 'naver'
      }
    });
    return response.data.access_token;
  } else if (provider === 'kakao') {
    const response = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data.access_token;
  }
  throw new Error(`Unsupported provider for code exchange: ${provider}`);
}

async function getProviderUserInfo(provider: string, token: string) {
  if (provider === 'google') {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return {
      id: response.data.id,
      email: response.data.email,
      name: response.data.name,
      profileImageUrl: response.data.picture
    };
  } else if (provider === 'kakao') {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return {
      id: response.data.id.toString(),
      email: response.data.kakao_account.email,
      nickname: response.data.properties.nickname,
      profileImageUrl: response.data.properties.profile_image
    };
  } else if (provider === 'naver') {
    const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return {
      id: response.data.response.id,
      email: response.data.response.email,
      nickname: response.data.response.nickname,
      name: response.data.response.name,
      profileImageUrl: response.data.response.profile_image
    };
  }
  throw new Error(`Unsupported OAuth provider: ${provider}`);
}
