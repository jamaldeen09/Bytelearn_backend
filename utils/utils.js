export const generateHTML = (code) => {
  return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 25px;
        }
        .logo {
            height: 40px;
            width: 40px;
            border-radius: 8px;
            margin-right: 12px;
        }
        .brand {
            font-size: 20px;
            font-weight: 600;
            color: #4f46e5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        h1 {
            font-size: 24px;
            color: #111827;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .otp-container {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
        }
        .otp {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 3px;
            color: #4f46e5;
            margin: 10px 0;
        }
        .note {
            font-size: 14px;
            color: #6b7280;
            margin-top: 25px;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img class="logo" src="https://thumbs.dreamstime.com/b/black-school-icon-shadow-logo-design-white-157312165.jpg" alt="ByteLearn Logo">
            <span class="brand">ByteLearn</span>
        </div>
        
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your ByteLearn account password. Use the following verification code:</p>
        
        <div class="otp-container">
            <div style="font-size: 14px; color: #6b7280;">Your verification code</div>
            <div class="otp">${code}</div>
            <div style="font-size: 13px; color: #6b7280;">Valid for 5 minutes</div>
        </div>
        
        <p>If you didn't request this code, you can safely ignore this email.</p>
        
        <div class="divider"></div>
        
        <div class="note">
            For security reasons, please don't share this code with anyone.
        </div>
        
        <div class="footer">
            © ${new Date().getFullYear()} ByteLearn. All rights reserved.<br>
            Need help? Contact our support team at support@bytelearn.com
        </div>
    </div>
</body>
</html>`
}

export const responseGenerator = (isSuccessfull, message) => {
  return {
    success: isSuccessfull,
    msg: message,
  }
}


export const notificationGenerator = (avatar, sendersName, notificationId) => {
  return `
      <div class="friend-request-notification" data-notification-id="${notificationId}">
        <div class="notification-header">
          <img src="${avatar}" alt="Profile" class="user-avatar">
          <div class="user-info">
            <span class="username">${sendersName}</span>
            <span class="request-text">sent you a friend request</span>
          </div>
        </div>
        <div class="notification-actions">
          <button class="accept-btn">Accept</button>
          <button class="reject-btn">Reject</button>
        </div>
      </div>
    `;
};

export const generateFriendRequest = (
  fullName,
  id,
  requestStatus = "pending"
) => {
  // Base HTML for the notification content (keep this exactly as is)
  const notificationContent = `
    <div class="friend-request-letter" style="
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #f9fafb;
      font-family: 'Georgia', serif;
      line-height: 1.6;
      color: #111827;
    ">
      <!-- Header -->
      <div class="letter-header" style="
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 15px;
        margin-bottom: 15px;
      ">
        <h2 style="font-size: 1.5rem; color: #1f2937; margin-bottom: 5px;">
          Friendship Request
        </h2>
        <p style="font-style: italic; color: #6b7280;">
          From: ${fullName}
        </p>
      </div>

      <!-- Body -->
      <div class="letter-body" style="margin-bottom: 20px;">
        <p>Dear Friend,</p>
        <p style="margin: 15px 0;">
          I came across your profile and was genuinely impressed. 
          I'd love the chance to connect and share experiences.
        </p>
      </div>
  `;

  // Only modify the buttons section
  const baseButtonStyles = `
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  `;

  let buttonsHTML = '';
  
  if (requestStatus === "accepted") {
    buttonsHTML = `
      <div class="letter-actions" style="
        display: flex;
        gap: 10px;
        margin-top: 25px;
        border-top: 1px solid #e5e7eb;
        padding-top: 15px;
      ">
        <button 
          style="
            ${baseButtonStyles}
            background: #059669;
            color: white;
            width: 100%;
            cursor: not-allowed;
          "
          disabled
        >
          ✓ Accepted
        </button>
      </div>
    `;
  } 
  else if (requestStatus === "rejected") {
    buttonsHTML = `
      <div class="letter-actions" style="
        display: flex;
        gap: 10px;
        margin-top: 25px;
        border-top: 1px solid #e5e7eb;
        padding-top: 15px;
      ">
        <button 
          style="
            ${baseButtonStyles}
            background: #f3f4f6;
            color: #6b7280;
            width: 100%;
            cursor: not-allowed;
            border: 1px solid #e5e7eb;
          "
          disabled
        >
          ✗ Declined
        </button>
      </div>
    `;
  }
  else {
    buttonsHTML = `
      <div class="letter-actions" style="
        display: flex;
        gap: 10px;
        margin-top: 25px;
        border-top: 1px solid #e5e7eb;
        padding-top: 15px;
      ">
        <button 
          id="accept-btn-${id}" 
          class="accept-btn" 
          data-sender="${id}"
          style="
            ${baseButtonStyles}
            background: #10b981;
            color: white;
            flex: 1;
          "
        >
          Accept
        </button>
        <button 
          id="reject-btn-${id}" 
          class="reject-btn" 
          data-sender="${id}"
          style="
            ${baseButtonStyles}
            background: white;
            color: #6b7280;
            flex: 1;
            border: 1px solid #e5e7eb;
          "
        >
          Decline
        </button>
      </div>
    `;
  }

  // Closing HTML (keep this as is)
  const closingHTML = `
      <!-- Closing -->
      <div class="letter-closing" style="
        margin-top: 20px;
        font-style: italic;
        color: #6b7280;
      ">
        <p>Warm regards,</p>
        <p>${fullName}</p>
      </div>
    </div>
  `;

  // Combine all parts
  return notificationContent + buttonsHTML + closingHTML;
};