// const User = require('../models/User');
// const { generateTokens, verifyToken } = require('../utils/token');

// const register = async (req:any, res:any) => {
//   try {
//     const { name, email, password } = req.body;
//     const existing = await User.findOne({ email });
//     if (existing) return res.status(409).json({ message: 'Email already used' });

//     const user = await User.create({ name, email, password });
//     const tokens = generateTokens(user);
//     res.cookie('refreshToken', tokens.refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.json({ accessToken: tokens.accessToken, user: { name: user.name, email: user.email, role: user.role } });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// const login = async (req:Request, res:Response) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user || !(await user.matchPassword(password))) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const tokens = generateTokens(user);
//     res.cookie('refreshToken', tokens.refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.json({ accessToken: tokens.accessToken, user: { name: user.name, email: user.email, role: user.role } });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// const refreshToken = async (req:Request, res:Response) => {
//   try {
//     const token = req.cookies.refreshToken;
//     if (!token) return res.status(401).json({ message: 'Unauthorized' });

//     const payload = verifyToken(token, 'refresh');
//     const user = await User.findById(payload.id);

//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const tokens = generateTokens(user);
//     res.cookie('refreshToken', tokens.refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.json({ accessToken: tokens.accessToken });
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid refresh token' });
//   }
// };

// const logout = (req:Request, res:Response) => {
//   res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
//   res.status(200).json({ message: 'Logged out' });
// };

// module.exports = {
//   registerController:register,
//   loginController:login,
//   refreshTokenController:refreshToken,
//   logoutController:logout,
// };
