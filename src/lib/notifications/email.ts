import nodemailer from 'nodemailer';

export async function sendDraftEmailNotification(topic: string, draftId: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!user || !pass) {
    console.warn('[Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD, skipping email notification.');
    return;
  }

  try {
    // Determine the dashboard URL (fallback to production domain if missing)
    const dashboardUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kingdragonhub.com';
    const reviewUrl = `${dashboardUrl}/admin/posts/preview?id=${draftId}`;

    const transporter = nodemailer.createTransport({ 
      service: 'gmail', 
      auth: { user, pass } 
    });

    const targetEmails = process.env.NOTIFICATION_EMAIL || user;

    await transporter.sendMail({
      from: `"KING DRAGON AI" <${user}>`,
      to: targetEmails,
      subject: `[AI Content] Bài viết mới: ${topic}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #ff6a00; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">🐉 KING DRAGON AI</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hệ thống AI vừa soạn thảo xong một bài viết mới và đang chờ bạn kiểm duyệt.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #ff6a00; margin: 20px 0;">
              <strong>Chủ đề:</strong> ${topic}
            </div>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${reviewUrl}" style="background-color: #ff6a00; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">Kiểm duyệt bản nháp</a>
            </p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            Đây là email tự động từ hệ thống MCP ChatGPT Integration.
          </div>
        </div>
      `,
    });
    
    console.log(`[Email] Notification sent successfully for topic: ${topic}`);
  } catch (err) { 
    console.error('[Email] Failed to send notification:', err); 
  }
}
