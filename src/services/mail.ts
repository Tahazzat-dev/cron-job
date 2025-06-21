import { generateOtpMailTemplate, generatePasswordResetMailTemplate } from '../utils/mailTemplate';
import transporter from './transporter';

 export const sendOtpEmail = async (to: string, username:string="", otp: string) => {
  const info = await transporter.sendMail({
    from: `"FastCronJob" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Login OTP',
    html: generateOtpMailTemplate(otp,username),
  });
  return info;
};

export const sendResetEmail = async (to: string, resetLink:string,) => {
  const info = await transporter.sendMail({
    from: `"FastCronJob" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Password Reset Request',
    html:generatePasswordResetMailTemplate(resetLink),
  });
  return info;
};
