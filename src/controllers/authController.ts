import User from "../models/User";

const { generateTokens, verifyToken } = require('../utils/token');

export const registerController = async (req:any, res:any) => {
  try {
    const { name, email, password, domain } = req.body;
    if(!name || !email || !password || !domain){
        return res.status(400).json({error:true, message:"All fields are required"})
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({error:true, message: 'Email already used' });

     // --- Calculate packageExpiresAt for trial ---
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(now.getDate() + 2); // for 2 days free trial

    const user = await User.create({ name, email, password,domain,packageExpiresAt:trialEndDate});
    const tokens = generateTokens(user);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: tokens.accessToken, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// export const login = async (req:Request, res:Response) => {
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

// export const refreshToken = async (req:Request, res:Response) => {
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

// export const logout = (req:Request, res:Response) => {
//   res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
//   res.status(200).json({ message: 'Logged out' });
// };

