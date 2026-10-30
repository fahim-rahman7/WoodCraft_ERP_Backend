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

export const sendInvitationEmail = async (to, organizationName, role, inviteLink) => {
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
    subject: `Invitation to join ${organizationName} - WoodCraft ERP`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Organization Invitation</h2>
        <p>You have been invited to join <strong>${organizationName}</strong> as a <strong>${role}</strong> on WoodCraft ERP.</p>
        <p>Click the button below to accept your invitation:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #0066cc; font-size: 12px; word-break: break-all;">${inviteLink}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">This invitation link will expire in 7 days. If you did not expect this invitation, please ignore this email.</p>
      </div>
    `,
  }),
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(`Brevo Email Error: ${errorData.message || response.statusText}`);
}
};