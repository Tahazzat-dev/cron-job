export const generateOtpMailTemplate = (otp: string, username:string): string => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your One-Time Password (OTP)</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .content {
            padding: 20px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #007bff; /* A nice blue color */
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #e9f5ff; /* Light blue background for emphasis */
            border-radius: 5px;
            letter-spacing: 2px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            font-size: 14px;
            color: #777777;
        }
        .warning {
            color: #dc3545; /* Red color for warnings */
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <p>Hi ${username},</p>
            <p>Here is your One-Time Password (OTP) for logging into your account:</p>
            <div class="otp-code">
                ${otp}
            </div>
            <p>This OTP is valid for 10 minutes. For security reasons, please do not share this code with anyone.</p>
            <p><span class="warning">If you did not request this OTP, please ignore this email.</span></p>
        </div>
        <div class="footer">
            <p>Thanks,</p>
            <p>The FastCronJob Team</p>
        </div>
    </div>
</body>
</html>
    `
}


export const generatePasswordResetMailTemplate = (resetLink: string): string => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .content {
            padding: 20px 0;
        }
        .reset-button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            padding: 12px 25px;
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
            background-color: #28a745; /* A nice green color for action */
            border-radius: 5px;
            text-decoration: none;
            cursor: pointer;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            font-size: 14px;
            color: #777777;
        }
        .warning {
            color: #dc3545; /* Red color for warnings */
            font-weight: bold;
        }
        .link-text {
            word-break: break-all; /* Ensures long links break correctly */
            font-size: 14px;
            color: #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <p>We received a request to reset your password. If you made this request, please click the button below to reset your password:</p>
            
            <div class="reset-button-container">
                <a href="${resetLink}" class="reset-button" target="_blank">Reset Your Password</a>
            </div>

            <p>This link is valid for 20 minutes. If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
            <p class="link-text">${resetLink}</p>
            <br />
            <p><span class="warning">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</span></p>
        </div>
        <div class="footer">
            <p>Thanks,</p>
            <p>The FastCronJob Team</p>
        </div>
    </div>
</body>
</html>
    `;
};