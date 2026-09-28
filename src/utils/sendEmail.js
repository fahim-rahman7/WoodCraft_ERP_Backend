export const sendOTP = async (to, otp) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.EMAIL_FROM_NAME || 'WoodCraft ERP',
          email: process.env.EMAIL_FROM_ADDRESS,
        },
        to: [{ email: to }],
        subject: 'Verify Your Email - WoodCraft ERP',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Email Verification</h2>
            <p>Your OTP code for registration is:</p>
            <h1 style="color: #4CAF50; letter-spacing: 4px;">${otp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
          </div>
        `,
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo Email Error: ${errorData.message || response.statusText}`);
    }
  };