import { NextFunction } from "express";
import { verifyToken } from "../utils/token";
import User from "../models/User";

export const isValidUserMiddleware = async (req: any, res:any, next: NextFunction) => {
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

    if (!user || user.role !== 'user') {
      return res.status(403).json({ error: true, message: 'Access denied: Users only' });
    }

    // Attach user to request if needed in next handler
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: true, message: 'Server error: Access check failed' });
  }
};