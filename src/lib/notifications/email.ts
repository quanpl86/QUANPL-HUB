import nodemailer from 'nodemailer';

type WeekEmailSlot = {
  title: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  outline: string | null;
  angle: string | null;
  field: string | null;
  subject: string | null;
  category: string | null;
};

type WeekEmail = {
  week_start: string;
  title: string | null;
  summary: string | null;
  admin_feedback?: string | null;
  slots: WeekEmailSlot[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dashboardBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://kingdragonhub.com').replace(/\/$/, "");
}

function mailer() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return {
    user,
    to: process.env.NOTIFICATION_EMAIL || user,
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    }),
  };
}

function wrapEmail(body: string) {
  return `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ff6a00; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">🐉 KING DRAGON AI</h2>
      </div>
      <div style="padding: 20px;">
        ${body}
      </div>
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        Đây là email tự động từ hệ thống MCP ChatGPT Integration.
      </div>
    </div>
  `;
}

/**
 * Await SMTP before the MCP/API response returns.
 * Fire-and-forget `.catch()` is killed when the Netlify isolate freezes.
 */
async function queueMail(work: () => Promise<void>) {
  await work().catch((err) => console.error("[Email] failed:", err));
}

export async function sendDraftEmailNotification(
  topic: string,
  draftId: string,
  kind: "created" | "updated" = "created"
) {
  await queueMail(async () => {
    const mail = mailer();
    if (!mail) {
      console.warn("[Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD, skipping email notification.");
      return;
    }
    const reviewUrl = `${dashboardBase()}/admin/posts/edit/${draftId}`;
    const created = kind === "created";
    await mail.transporter.sendMail({
      from: `"KING DRAGON AI" <${mail.user}>`,
      to: mail.to,
      subject: created
        ? `[AI Content] Bài viết mới: ${topic}`
        : `[AI Content] Bản nháp đã sửa: ${topic}`,
      html: wrapEmail(`
        <p>${created
          ? "ChatGPT vừa soạn xong một bản nháp và đang chờ bạn kiểm duyệt."
          : "ChatGPT vừa sửa bản nháp bị trả và đang chờ bạn đọc lại."}</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #ff6a00; margin: 20px 0;">
          <strong>Chủ đề:</strong> ${escapeHtml(topic)}
        </div>
        <p style="text-align: center; margin-top: 30px;">
          <a href="${reviewUrl}" style="background-color: #ff6a00; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">Kiểm duyệt bản nháp</a>
        </p>
      `),
    });
    console.log(`[Email] Draft ${kind} sent for topic: ${topic}`);
  });
}

export async function sendArticleWorkflowEmail(input: {
  topic: string;
  draftId?: string | null;
  mediaStatus: "COMPLETE" | "INCOMPLETE";
  missingImages?: Array<{ image_id: string; prompt: string; alt: string; failure_reason?: string }>;
}) {
  await queueMail(async () => {
    const mail = mailer();
    if (!mail) {
      console.warn("[Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD, skipping workflow email.");
      return;
    }
    const incomplete = input.mediaStatus === "INCOMPLETE";
    const reviewUrl = input.draftId ? `${dashboardBase()}/admin/posts/edit/${input.draftId}` : null;
    const missing = (input.missingImages || []).map((image) => `<li style="margin-bottom:12px">
      <strong>${escapeHtml(image.image_id)} — ${escapeHtml(image.alt)}</strong><br/>
      Prompt: ${escapeHtml(image.prompt)}<br/>
      Lỗi: ${escapeHtml(image.failure_reason || "Không tạo hoặc tải được ảnh")}
    </li>`).join("");
    await mail.transporter.sendMail({
      from: `"KING DRAGON AI" <${mail.user}>`,
      to: mail.to,
      subject: incomplete
        ? `[CẦN BỔ SUNG ẢNH] Draft đã tạo: ${input.topic}`
        : `[HOÀN TẤT] Draft và 4 ảnh đã tạo: ${input.topic}`,
      html: wrapEmail(`
        <p>${incomplete
          ? "Draft đã được tạo nhưng còn ảnh lỗi hoặc thiếu. Bài đang ở trạng thái MEDIA_INCOMPLETE và không được phép publish."
          : "ChatGPT đã hoàn thành nội dung, cover và ba ảnh trong bài."}</p>
        <p><strong>Chủ đề:</strong> ${escapeHtml(input.topic)}</p>
        ${missing ? `<p><strong>Ảnh cần xử lý:</strong></p><ul>${missing}</ul>` : ""}
        ${reviewUrl ? `<p style="text-align:center;margin-top:30px"><a href="${reviewUrl}" style="background:#ff6a00;color:white;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:bold">Mở bản nháp</a></p>` : ""}
        <p>MCP lưu progress trên server. Có thể mở một ChatGPT có kết nối KingDragonHub và nói: <strong>Tiếp tục bài đang dở</strong>.</p>
      `),
    });
  });
}

export async function sendArticleWorkflowPausedEmail(input: { topic: string; error: string }) {
  await queueMail(async () => {
    const mail = mailer();
    if (!mail) return;
    await mail.transporter.sendMail({
      from: `"KING DRAGON AI" <${mail.user}>`,
      to: mail.to,
      subject: `[ẢNH ĐÃ XONG, DRAFT ĐANG LỖI] ${input.topic}`,
      html: wrapEmail(`
        <p>Bốn image slot đã xử lý xong nhưng hệ thống chưa tạo được draft.</p>
        <p><strong>Lỗi:</strong> ${escapeHtml(input.error)}</p>
        <p>Progress vẫn được lưu trên MCP. Mở ChatGPT có kết nối KingDragonHub và nói: <strong>Tiếp tục bài đang dở</strong>.</p>
      `),
    });
  });
}

export async function sendEditorialWeekReviewEmail(week: WeekEmail, kind: "proposed" | "revised") {
  await queueMail(async () => {
    const mail = mailer();
    if (!mail) {
      console.warn("[Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD, skipping week review email.");
      return;
    }

    const reviewUrl = `${dashboardBase()}/admin/editorial`;
    const heading = kind === "revised"
      ? "ChatGPT đã hiệu chỉnh lại lịch tuần và gửi lại để bạn duyệt."
      : "ChatGPT vừa gửi danh sách bài viết trong tuần để bạn review.";
    const rows = week.slots.map((slot) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; white-space: nowrap;">
        ${escapeHtml([slot.scheduled_date, slot.scheduled_time].filter(Boolean).join(" "))}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${escapeHtml(slot.title)}</strong><br/>
        <span style="color:#666;font-size:13px;">${escapeHtml(slot.outline || slot.angle || "")}</span>
      </td>
    </tr>
  `).join("");

    await mail.transporter.sendMail({
      from: `"KING DRAGON AI" <${mail.user}>`,
      to: mail.to,
      subject: kind === "revised"
        ? `[Lịch tuần] ${week.title || week.week_start} — ChatGPT đã sửa, chờ xem`
        : `[Lịch tuần] ${week.title || week.week_start} — chờ duyệt`,
      html: wrapEmail(`
        <p>${heading}</p>
        <p><strong>${escapeHtml(week.title || `Tuần ${week.week_start}`)}</strong></p>
        ${week.summary ? `<p>${escapeHtml(week.summary)}</p>` : ""}
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">${rows}</table>
        <p style="text-align: center; margin-top: 30px;">
          <a href="${reviewUrl}" style="background-color: #ff6a00; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">Review lịch tuần</a>
        </p>
      `),
    });
    console.log(`[Email] Week review sent for ${week.week_start} (${kind})`);
  });
}

export async function sendEditorialDueReminderEmail(slots: WeekEmailSlot[]) {
  const mail = mailer();
  if (!mail) {
    console.warn('[Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD, skipping due reminder.');
    return false;
  }
  if (!slots.length) return false;

  const reviewUrl = `${dashboardBase()}/admin/editorial`;
  const items = slots.map((slot) => `
    <li>
      <strong>${escapeHtml(slot.title)}</strong>
      — ${escapeHtml([slot.scheduled_date, slot.scheduled_time].filter(Boolean).join(" "))}
    </li>
  `).join("");

  try {
    await mail.transporter.sendMail({
      from: `"KING DRAGON AI" <${mail.user}>`,
      to: mail.to,
      subject: `[Lịch tuần] ${slots.length} bài đến hạn — mở ChatGPT để viết`,
      html: wrapEmail(`
        <p>Có bài đã đến ngày giờ đăng. ChatGPT MCP không tự thức dậy được — hãy mở conversation và bảo:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #ff6a00; margin: 20px 0;">
          Viết các slot đến hạn hôm nay. Gọi get_due_editorial_slots rồi create_blog_draft với calendar_id.
        </div>
        <ul>${items}</ul>
        <p style="text-align: center; margin-top: 30px;">
          <a href="${reviewUrl}" style="background-color: #ff6a00; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">Xem lịch tuần</a>
        </p>
      `),
    });
    console.log(`[Email] Due reminder sent for ${slots.length} slots`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send due reminder:', err);
    return false;
  }
}
