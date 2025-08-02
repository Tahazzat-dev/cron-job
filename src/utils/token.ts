import jwt from 'jsonwebtoken';
import { TokenPayload, UserPayload } from '../types/types';

export const generateTokens = (user: UserPayload): { accessToken: string; refreshToken: string } => {

  // Ensure secrets are defined, otherwise throw an error or default
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables.');
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '15d' }
  );

  return { accessToken, refreshToken };
};


export const verifyToken = (token: string, type: 'access' | 'refresh' = 'access'): TokenPayload | null => {
  let secret: string | undefined;

  if (type === 'access') {
    secret = process.env.JWT_SECRET;
  } else {
    secret = process.env.JWT_REFRESH_SECRET;
  }

  if (!secret) {
    throw new Error(`JWT_SECRET or JWT_REFRESH_SECRET for type '${type}' is not defined.`);
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;

  } catch (err:any) {
    console.log(err?.message || 'invalid token')
    return null
  }
};





