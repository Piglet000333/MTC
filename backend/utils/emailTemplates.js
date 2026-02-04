const getOTPEmailTemplate = (otpCode) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #ffffff;
      padding: 30px 40px;
      border-bottom: 1px solid #f0f0f0;
    }
    .logo-text {
      font-size: 24px;
      font-weight: bold;
      color: #1a56db; /* Blue brand color */
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .content {
      padding: 40px;
      text-align: center;
    }
    .main-heading {
      color: #111827;
      font-size: 24px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .sub-text {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 30px;
    }
    .otp-container {
      background-color: #f0fdf4; /* Light green background */
      border: 1px dashed #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 0 auto 30px auto;
      display: inline-block;
      min-width: 200px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #10b981; /* Green text */
      letter-spacing: 6px;
      font-family: monospace;
    }
    .instruction {
      color: #374151;
      font-size: 15px;
      margin-bottom: 30px;
      text-align: left;
    }
    .warning-box {
      background-color: #fff8f1;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      text-align: left;
      margin-top: 20px;
      border-radius: 4px;
    }
    .warning-text {
      color: #92400e;
      font-size: 13px;
      margin: 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #f0f0f0;
    }
    .footer-text {
      color: #9ca3af;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .footer-links a {
      color: #6b7280;
      text-decoration: none;
      font-size: 12px;
      margin: 0 10px;
    }
    .footer-links a:hover {
      color: #1a56db;
    }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100%; margin: 0; border-radius: 0; }
      .content { padding: 20px; }
      .header { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">
        <!-- Placeholder for Logo -->
        <span>MTC</span>
        <span style="color: #1f2937; margin-left: 8px;">Student Portal</span>
      </div>
    </div>
    
    <div class="content">
      <h1 class="main-heading">Your One-Time Password (OTP)</h1>
      <p class="sub-text">Please enter the OTP below to verify your account request.</p>
      
      <div class="otp-container">
        <div class="otp-code">${otpCode}</div>
      </div>
      
      <div class="instruction">
        <p>You attempted to create a Student Portal account. Use the code above to complete your registration.</p>
        <p>If you did not make this request, please disregard this email or contact our support team.</p>
      </div>

      <div class="warning-box">
        <p class="warning-text">
          <strong>Security Notice:</strong> If you did not attempt to sign up, please contact us immediately at 
          <a href="mailto:support@mechatronictraining.com" style="color: #92400e; text-decoration: underline;">support@mechatronictraining.com</a>.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        If you have any questions, feel free to respond to this email or visit our <a href="#" style="color: #1a56db;">Help Center</a>.
      </p>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Unsubscribe</a>
      </div>
      <p class="footer-text" style="margin-top: 20px;">
        &copy; ${new Date().getFullYear()} Mechatronic Training Corporation. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

const getForgotPasswordEmailTemplate = (resetLink) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #ffffff;
      padding: 30px 40px;
      border-bottom: 1px solid #f0f0f0;
    }
    .logo-text {
      font-size: 24px;
      font-weight: bold;
      color: #1a56db;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .content {
      padding: 40px;
      text-align: center;
    }
    .main-heading {
      color: #111827;
      font-size: 24px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .sub-text {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 30px;
    }
    .action-button {
      background-color: #1a56db;
      color: #ffffff !important; /* Force white text */
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(26, 86, 219, 0.2);
    }
    .action-button:hover {
      background-color: #1e429f;
    }
    .instruction {
      color: #374151;
      font-size: 15px;
      margin-bottom: 30px;
      text-align: left;
    }
    .warning-box {
      background-color: #fff8f1;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      text-align: left;
      margin-top: 20px;
      border-radius: 4px;
    }
    .warning-text {
      color: #92400e;
      font-size: 13px;
      margin: 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #f0f0f0;
    }
    .footer-text {
      color: #9ca3af;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .footer-links a {
      color: #6b7280;
      text-decoration: none;
      font-size: 12px;
      margin: 0 10px;
    }
    .footer-links a:hover {
      color: #1a56db;
    }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100%; margin: 0; border-radius: 0; }
      .content { padding: 20px; }
      .header { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">
        <span>MTC</span>
        <span style="color: #1f2937; margin-left: 8px;">Student Portal</span>
      </div>
    </div>
    
    <div class="content">
      <h1 class="main-heading">Reset Your Password</h1>
      <p class="sub-text">We received a request to reset your password. Click the button below to choose a new one.</p>
      
      <a href="${resetLink}" class="action-button">Reset Password</a>
      
      <div class="instruction">
        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #1a56db; font-size: 14px;">${resetLink}</p>
      </div>

      <div class="warning-box">
        <p class="warning-text">
          <strong>Security Notice:</strong> This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        If you have any questions, feel free to respond to this email or visit our <a href="#" style="color: #1a56db;">Help Center</a>.
      </p>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Unsubscribe</a>
      </div>
      <p class="footer-text" style="margin-top: 20px;">
        &copy; ${new Date().getFullYear()} Mechatronic Training Corporation. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { getOTPEmailTemplate, getForgotPasswordEmailTemplate };
