import User from "../models/User";
import { TDomain } from "../types/types";
import { sanitizeDomain } from "../utils/sanitize";

const { generateTokens, verifyToken } = require('../utils/token');

const COOKIE_EXPIRY = 15 * 24 * 60 * 60 * 1000;

export const registerController = async (req:any, res:any) => {
  try {
    const { name, email, password, domain } = req.body;
    if(!name || !email || !password || !domain){
        return res.status(400).json({error:true, message:"All fields are required"})
    }

    const sanitizedDomain = sanitizeDomain(domain);

    if(!sanitizedDomain) {
      return res.status(400).json({error:true, message: `Invalid domain: ${domain}` });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({error:true, message: 'Email already used' });

     // --- Calculate packageExpiresAt for trial ---
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(now.getDate() + 2); // for 2 days free trial
    const defaultDomains:TDomain[] = [
      {status:"enabled", url:sanitizedDomain},
      // {status:"enabled", url:sanitizedDomain},
    ]
    const user = await User.create({ name, email, password,defaultDomains,packageExpiresAt:trialEndDate});
    const tokens = generateTokens(user);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: COOKIE_EXPIRY
    });

    res.json({ accessToken: tokens.accessToken, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:true,message: 'Server error' });
  }
};

export const loginController = async (req:any, res:any) => {
   try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens(user);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: COOKIE_EXPIRY
    });

    res.json({ accessToken: tokens.accessToken, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshTokenController = async (req:any, res:any) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({error:true, message: 'Unauthorized' });

    const payload = verifyToken(token, 'refresh');

    if( !payload || !payload?.id)return res.status(404).json({error:true, message: 'Invalid or expired token' });

    const user = await User.findById(payload.id);

    if (!user) return res.status(404).json({error:true, message: 'User not found' });

    const tokens = generateTokens(user);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: COOKIE_EXPIRY
    });

    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logoutController = (req:any, res:any) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
  res.status(200).json({ message: 'Logged out' });
};

