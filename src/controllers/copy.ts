// import OtpStore from "../models/OtpStore";
// import Package, { IPackage } from "../models/Package";
// import PasswordResetToken from "../models/PasswordResetToken";
// import User from "../models/User";
// import { autoCronQueue } from "../queues/autoCron.queue";
// import { sendOtpEmail, sendResetEmail } from "../services/mail";
// import { IUserDataToInsert, TDomain, UserPayload } from "../types/types";
// import { createDefaultCronExecutableURL, sanitizeDomain } from "../utils/sanitize";
// import { generateTokens, verifyToken } from "../utils/token";
// import { generateOtp, setRefreshCookie } from "../utils/utilityFN";
// import crypto from 'crypto';
// import bcrypt from 'bcrypt';

// export const registerController = async (req: any, res: any) => {
//   try {
//     const { name, email, password, domain, username, mobile } = req.body;

//     // 1. Sanitize and validate domain
//     const sanitizedDomain = sanitizeDomain(domain);
//     if (!sanitizedDomain) {
//       return res.status(400).json({ error: true, message: `Invalid domain: ${domain}` });
//     }

//     // 2. Validate required fields
//     const requiredFields: { key: string; label: string }[] = [
//       { key: 'name', label: 'Name' },
//       { key: 'email', label: 'Email' },
//       { key: 'password', label: 'Password' },
//       { key: 'domain', label: 'Domain' },
//       { key: 'username', label: 'Username' },
//       { key: 'mobile', label: 'Mobile number' },
//     ];

//     for (const field of requiredFields) {
//       if (!req.body[field.key]) {
//         return res.status(400).json({ error: true, message: `${field.label} is required` });
//       }
//     }

//     // 3. Block already registered users (excluding 'pending')
//     const existingUser = await User.findOne({
//       $and: [
//         { $or: [{ email }, { username }, { mobile }] },
//         { status: { $ne: 'pending' } }
//       ]
//     });

//     if (existingUser) {
//       const conflictField =
//         existingUser.email === email ? 'Email' :
//           existingUser.username === username ? 'Username' :
//             'Mobile number';
//       return res.status(409).json({ error: true, message: `${conflictField} already in use` });
//     }

//     // 4. OTP request throttling
//     const existingOtp = await OtpStore.findOne({ email });
//     const now = new Date();
//     if (existingOtp && existingOtp.resendAfter > now) {
//       const waitSeconds = Math.ceil((existingOtp.resendAfter.getTime() - now.getTime()) / 1000);
//       return res.status(429).json({
//         error: true,
//         message: `Please wait ${waitSeconds} seconds before requesting another OTP.`,
//         waitSeconds,
//       });
//     }

//     // 5. Generate and store OTP
//     const otp = generateOtp();
//     await OtpStore.findOneAndUpdate(
//       { email },
//       {
//         otp,
//         expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
//         resendAfter: new Date(Date.now() + 60 * 1000),     // 1 minute block
//       },
//       { upsert: true }
//     );

//     // 6. Prepare user data
//     const userDataToInsert: IUserDataToInsert = {
//       name,
//       email,
//       password,
//       username,
//       mobile,
//       domain: sanitizedDomain,
//       status: 'pending',
//     };

//     // 7. Create or Update pending user
//     const pendingUser = await User.findOne({ email, status: 'pending' });

//     let user;
//     if (pendingUser) {
//       // Update existing pending user
//       const salt = await bcrypt.genSalt(10);
//       userDataToInsert.password = salt;
//       user = await User.findOneAndUpdate(
//         { _id: pendingUser._id },
//         userDataToInsert,
//         { new: true }
//       );
//     } else {
//       // Create new pending user
//       user = await User.create(userDataToInsert);
//     }

//     // 8. Send OTP email
//     const result = await sendOtpEmail(email, user.username, otp, "register");

//     // 9. Respond
//     if (result) {
//       return res.status(200).json({
//         success: true,
//         message: 'OTP sent to your email. Please verify to activate your account.',
//       })
//     } else {
//       console.log("Couldn't send the email.")
//       return res.status(200).json({
//         success: false,
//         message: 'Internal server error. Please try again',
//       });
//     }
//   } catch (err: any) {
//     if (err?.code === 11000 && err?.keyPattern?.domain) {
//       return res.status(409).json({ error: true, message: 'Domain already exists in database.' });
//     }

//     console.error('Register Error:', err);
//     const message = err?.message || 'Server error';
//     res.status(500).json({ error: true, message });
//   }
// };


// export const verifyRegistrationOTPController = async (req: any, res: any) => {
//   try {
//     const { email, otp } = req.body;

//     // 1. Check the otpStore and find matched data.
//     const record = await OtpStore.findOne({ email });

//     if (!record || record.otp !== otp || record.expiresAt < new Date()) {
//       return res.status(400).json({ error: true, message: 'Invalid or expired OTP' });
//     }

//     // 2. Find the user and extract domain to add default domain data.
//         const user = await User.findOne({ email });
//         if (!user) throw new Error("Something went wrong");
//         const defaultDomains: TDomain[] = [{ status: "enabled", url: createDefaultCronExecutableURL(user.domain) }];
       

//         // 3. get the free package and assing to the user for trial
//          const defaultPackage: IPackage | any = await Package.findOne({ name: "Free" });
//          let packageExpiresAt = defaultPackage?.validity? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);


    
//     user.status = "enabled";
//     user.defaultDomains = defaultDomains;
//     user.packageExpiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2-days by default,    
//     await user.save()


//     await OtpStore.deleteOne({ email });

//     // get the package and extract the free package to asing by default.
    
//     // make an array so that we can add another url in v2. 
    
//     // add queue for default domains
//     if (defaultPackage.status === 'enabled') {
//       for (const domain of user.defaultDomains) {
//         const jobId = `auto-default-${user._id}-${domain.url}`;

//         await autoCronQueue.add(
//           'auto-execute',
//           { userId: user._id, domain, type: "default" },
//           {
//             jobId,
//             removeOnComplete: true,
//             removeOnFail: true,
//             repeat: {
//               every: defaultPackage?.intervalInMs || 7000, // fallback 7s
//             },
//           }
//         );
//       }
//     }


//     // generate token
//     const tokens = generateTokens(user);
//     setRefreshCookie(res, tokens.refreshToken);

//     res.status(201).json({
//       accessToken: tokens.accessToken,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//     });
//   } catch (err: any) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: true, message: "Server error" });
//   }
// };

// export const loginController = async (req: any, res: any) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: true, message: "Email and password are required" });
//     }

//     const user = await User.findOne({ email });
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ error: true, message: "Invalid credentials" });
//     }

//     const existing = await OtpStore.findOne({ email });

//     try {
//       const now = new Date();
//       if (existing && existing.resendAfter > now) {
//         const waitSeconds = Math.ceil((existing.resendAfter.getTime() - now.getTime()) / 1000);
//         return res.status(429).json({ error: true, message: `Please wait ${waitSeconds} seconds before requesting another OTP.`, waitSeconds });
//       }

//       const otp = generateOtp();

//       await OtpStore.findOneAndUpdate(
//         { email },
//         {
//           otp,
//           expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 5 min expiry
//           resendAfter: new Date(Date.now() + 60 * 1000),   // 1 min spam block
//         },
//         { upsert: true }
//       );

//       const result = await sendOtpEmail(email, user.username, otp);
//       if (result) {
//         return res.json({ message: 'OTP sent to your email' });
//       }
//     } catch (error) {

//     }
//   } catch (err: any) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: true, message: "Server error" });
//   }
// };

// export const resendOTPController = async (req: any, res: any) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
//     const existing = await OtpStore.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ error: true, message: "User not found" });
//     }

//     if (!existing) {
//       return res.status(404).json({ error: true, message: "No OTP request found for this email" });
//     }

//     const now = new Date();
//     if (existing && existing.resendAfter > now) {
//       const waitSeconds = Math.ceil((existing.resendAfter.getTime() - now.getTime()) / 1000);
//       return res.status(429).json({ error: true, message: `Please wait ${waitSeconds} seconds before requesting another OTP.`, waitSeconds });
//     }

//     const otp = generateOtp();

//     await OtpStore.findOneAndUpdate(
//       { email },
//       {
//         otp,
//         expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 5 min expiry
//         resendAfter: new Date(Date.now() + 60 * 1000),   // 1 min spam block
//       },
//       { upsert: true }
//     );

//     const result = await sendOtpEmail(email, user.username, otp);
//     if (result) {
//       return res.json({ message: 'OTP sent to your email' });
//     }
//   } catch (error) {

//   }
// }

// export const verifyLoginOTPController = async (req: any, res: any) => {
//   try {
//     const { email, otp } = req.body;

//     const record = await OtpStore.findOne({ email });
//     if (!record || record.otp !== otp || record.expiresAt < new Date()) {
//       return res.status(400).json({ error: true, message: 'Invalid or expired OTP' });
//     }

//     await OtpStore.deleteOne({ email });

//     const user = await User.findOne({ email });
//     const tokens = generateTokens(user);
//     setRefreshCookie(res, tokens.refreshToken);

//     res.json({
//       accessToken: tokens.accessToken,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//     });
//   } catch (err: any) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: true, message: "Server error" });
//   }
// };

// export const forgotPasswordController = async (req: any, res: any) => {
//   const { email, redirectBaseUrl } = req.body;

//   if (!email || !redirectBaseUrl) {
//     return res.status(400).json({ error: true, message: 'Email and redirect URL are required' });
//   }

//   const user = await User.findOne({ email });
//   if (!user) {
//     return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
//   }

//   const existing = await PasswordResetToken.findOne({ email });
//   if (existing && existing.expiresAt > new Date()) {
//     return res.status(429).json({ error: true, message: 'Please wait before requesting another reset link.' });
//   }

//   const token = crypto.randomBytes(32).toString('hex');

//   const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes expiry
//   await PasswordResetToken.findOneAndUpdate(
//     { email },
//     { token, expiresAt },
//     { upsert: true }
//   );

//   const resetLink = `${redirectBaseUrl}?token=${token}&email=${encodeURIComponent(email)}`;

//   await sendResetEmail(email, resetLink);

//   return res.json({ message: 'Reset link sent to your email' });
// };

// export const resetPasswordController = async (req: any, res: any) => {
//   try {
//     const { email, token, newPassword } = req.body;

//     if (!newPassword) {
//       return res.status(400).json({ error: true, message: 'New password is required' });
//     }

//     if (!email) {
//       return res.status(400).json({ error: true, message: 'Email is required' });
//     }

//     if (!token) {
//       return res.status(400).json({ error: true, message: 'Token is required' });
//     }

//     const resetToken = await PasswordResetToken.findOne({ email, token });
//     if (!resetToken || resetToken.expiresAt < new Date()) {
//       return res.status(400).json({ error: true, message: 'Invalid or expired reset link' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: true, message: 'User not found' });
//     }

//     user.password = newPassword;
//     await user.save();

//     await PasswordResetToken.deleteOne({ email });

//     return res.json({ success: true, message: 'Password has been reset successfully' });

//   } catch (error) {
//     console.error("Reset password error:", error);
//     res.status(500).json({ error: true, message: 'Server error' });
//   }
// };

// export const refreshTokenController = async (req: any, res: any) => {
//   try {
//     const token = req.cookies.refreshToken;
//     if (!token) return res.status(401).json({ error: true, message: "Unauthorized" });

//     const payload = verifyToken(token, 'refresh');
//     if (!payload?.id) return res.status(401).json({ error: true, message: "Invalid or expired token" });

//     const user = await User.findById(payload.id);
//     if (!user) return res.status(404).json({ error: true, message: "User not found" });

//     const tokens = generateTokens(user);
//     setRefreshCookie(res, tokens.refreshToken);

//     res.json({ accessToken: tokens.accessToken });
//   } catch (err: any) {
//     console.error("Refresh token error:", err);
//     res.status(401).json({ error: true, message: "Invalid refresh token" });
//   }
// };

// export const logoutController = (req: any, res: any) => {
//   res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
//   res.status(200).json({ message: 'Logged out' });
// };