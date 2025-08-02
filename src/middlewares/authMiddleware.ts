import jwt from 'jsonwebtoken';

export const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: true, message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: true, message: 'Unauthorized: No token provided' });
    }
    
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: true, message: 'Invalid token' });
  }
};
