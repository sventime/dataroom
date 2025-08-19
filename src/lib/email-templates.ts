interface EmailTemplateProps {
  url: string
  email: string
}

export function generateSignInEmailTemplate({ url, email }: EmailTemplateProps) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to Harvey: Data Room</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Container -->
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 32px; border-radius: 16px; border: 1px solid #333;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 400;">
                Harvey: Data Room
              </h1>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="background: #111111; border: 1px solid #333; border-radius: 16px; padding: 40px; margin-bottom: 32px;">
            
            <p style="color: #888; text-align: center; margin: 0 0 32px; font-size: 16px; line-height: 1.5;">
              We received a request to sign you into your Harvey: Data Room<br/>
              Click the button below to continue securely.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" 
                 style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.2s ease;">
                Sign In to Data Room
              </a>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; color: #666; font-size: 12px; line-height: 1.4;">
            <p style="margin: 0 0 8px;">
              This email was sent to <span style="color: #888;">${email}</span>
            </p>
            <p style="margin: 0;">
              Harvey: Data Room • Secure Document Management
            </p>
          </div>
          
        </div>
      </body>
    </html>
  `

  const text = `
Harvey: Data Room - Sign In Request

Hi there,

We received a request to sign you into your Harvey: Data Room account.

Click this link to sign in securely:
${url}

Security Information:
• This link expires in 24 hours
• Can only be used once
• If you didn't request this, ignore this email

This email was sent to: ${email}

---
Harvey: Data Room
Secure Document Management Platform
  `

  return { html, text }
}