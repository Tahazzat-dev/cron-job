import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { verifyToken } from '../utils/token';

export const isAdminMiddleware = async (req: any, res:any, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: true, message: 'Unauthorized: No token provided' });
    }

    const payload = verifyToken(token); 

    if (!payload || !payload.id) {
      return res.status(403).json({ error: true, message: 'Invalid token' });
    }

    const user = await User.findById(payload.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: true, message: 'Access denied: Admins only' });
    }

    // Attach user to request if needed in next handler
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: true, message: 'Server error: Access check failed' });
  }
};
