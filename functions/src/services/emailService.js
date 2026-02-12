import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment
// The API key should be stored in Secret Manager and accessed via environment variable
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Send an email using SendGrid
 */
export const sendEmail = async ({ to, subject, body, from_name = 'CommonThread' }) => {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, email not sent');
    return { success: false, message: 'Email service not configured' };
  }

  const msg = {
    to,
    from: {
      email: 'noreply@commonthread.app',
      name: from_name
    },
    subject,
    html: body
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

/**
 * Send application confirmation email
 */
export const sendApplicationConfirmation = async ({
  userEmail,
  userName,
  businessName,
  opportunityTitle,
  hoursCommitted,
  startDate,
  status
}) => {
  const isConfirmed = status === 'confirmed';

  const subject = isConfirmed
    ? `Application Confirmed: ${opportunityTitle} at ${businessName}`
    : `Application Submitted: ${opportunityTitle} at ${businessName}`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">
          ${isConfirmed ? 'Application Confirmed!' : 'Application Submitted!'}
        </h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${userName}!</h2>

        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          ${isConfirmed
            ? 'Your volunteer application has been automatically confirmed! You met all the requirements.'
            : 'Your application has been submitted and is pending review.'
          }
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isConfirmed ? '#10b981' : '#f59e0b'};">
          <h3 style="color: ${isConfirmed ? '#10b981' : '#f59e0b'}; margin-top: 0;">Details</h3>
          <table style="width: 100%; color: #4b5563;">
            <tr><td style="padding: 8px 0;"><strong>Business:</strong></td><td>${businessName}</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Opportunity:</strong></td><td>${opportunityTitle}</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Hours:</strong></td><td>${hoursCommitted} hours</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Start Date:</strong></td><td>${startDate}</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td><span style="color: ${isConfirmed ? '#10b981' : '#f59e0b'}; font-weight: bold;">${status.toUpperCase()}</span></td></tr>
          </table>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Thank you for making a difference in your community!
        </p>

        <p style="color: #6b7280; font-size: 14px;">
          - The CommonThread Team
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, body });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async ({ userEmail, userName }) => {
  const subject = 'Welcome to CommonThread!';

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CommonThread!</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${userName}!</h2>

        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Thank you for completing your volunteer profile! We're excited to connect you with local businesses and nonprofits that need your help.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899;">
          <h3 style="color: #ec4899; margin-top: 0;">What's Next?</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>Browse volunteer opportunities that match your skills</li>
            <li>Apply to help local businesses in your community</li>
            <li>Track your volunteer hours and impact</li>
            <li>Receive special offers from businesses you help</li>
          </ul>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Thank you for joining us in strengthening local communities!
        </p>

        <p style="color: #6b7280; font-size: 14px;">
          - The CommonThread Team
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, body });
};

export default {
  sendEmail,
  sendApplicationConfirmation,
  sendWelcomeEmail
};
