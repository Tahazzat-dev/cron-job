// import { generateOtpMailTemplate, generatePasswordResetMailTemplate } from '../utils/mailTemplate';
// import transporter from './transporter';

//  export const sendOtpEmail = async (to: string, username:string="", otp: string, mailType:'login'|'register'="login") => {
//   const info = await transporter.sendMail({
//     from: `"CellsDeal" <${process.env.SMTP_USER}>`,
//     to,
//     subject: mailType==="login"?'Login OTP':'Register OTP',
//     html: generateOtpMailTemplate(otp,username,mailType),
//   });
//   return info;
// };

// export const sendResetEmail = async (to: string, resetLink:string,) => {
//   const info = await transporter.sendMail({
//     from: `"CellsDeal" <${process.env.SMTP_USER}>`,
//     to,
//     subject: 'Password Reset Request',
//     html:generatePasswordResetMailTemplate(resetLink),
//   });
//   return info;
// };
