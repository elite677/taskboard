import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'token';

export const cookieOptions = () => {
  const prod = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: prod,
    // 'none' lets a Vercel frontend talk to a Render backend; 'lax' is fine locally
    sameSite: prod ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

export const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Please log in' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
};
