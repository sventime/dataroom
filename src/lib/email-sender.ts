import { createTransport } from 'nodemailer'
import { generateSignInEmailTemplate } from './email-templates'

interface SendVerificationEmailProps {
  identifier: string
  url: string
  provider: {
    server: Record<string, unknown>
    from: string
  }
}

export async function sendVerificationEmail({
  identifier: email,
  url,
  provider,
}: SendVerificationEmailProps) {
  const transport = createTransport(provider.server)
  
  const { html, text } = generateSignInEmailTemplate({ url, email })
  
  try {
    const result = await transport.sendMail({
      to: email,
      from: provider.from,
      subject: 'Sign in to Harvey: Data Room',
      text,
      html,
    })
    
    console.log('Email sent successfully:', result.messageId)
    return result
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}