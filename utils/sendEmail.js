const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Gmail transporter configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL, // Your Gmail address
      pass: process.env.GMAIL_PASSWORD // Gmail App Password
    }
  });

  // Create HTML template for verification code
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">${process.env.FROM_NAME || 'Your App'}</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Verification</h2>
        <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
          Enter this verification code in your mobile app to reset your password:
        </p>
        
        <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
          ${options.verificationCode}
        </div>
        
        <p style="color: #dc3545; font-weight: bold; margin-top: 20px;">
          This code will expire in 10 minutes
        </p>
      </div>
      
      <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-radius: 8px;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. 
          Your account is secure and no changes have been made.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px;">
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  `;

  const textMessage = `
    Password Reset Verification Code
    
    Your verification code is: ${options.verificationCode}
    
    Enter this code in your mobile app to reset your password.
    This code will expire in 10 minutes.
    
    If you didn't request this, please ignore this email.
  `;

  const message = {
    from: `${process.env.FROM_NAME || 'Your App'} <${process.env.GMAIL_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: textMessage,
    html: htmlTemplate
  };

  const info = await transporter.sendMail(message);
  console.log('Verification code email sent: %s', info.messageId);
  
  return info;
};

module.exports = sendEmail;