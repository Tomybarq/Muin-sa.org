import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// ─── Security: HTML escape to prevent XSS injection ────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Security: sanitize From header name to prevent header injection ────────
function sanitizeHeaderValue(str: string): string {
  return str.replace(/[\r\n"\\]/g, "").trim();
}

// ─── Email audit log ────────────────────────────────────────────────────────
async function logEmailAttempt({
  toEmail,
  subject,
  status,
  error,
}: {
  toEmail: string;
  subject: string;
  status: "SUCCESS" | "FAILED" | "MOCK";
  error?: string | null;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        toEmail,
        subject,
        status,
        error: error || null,
      },
    });
  } catch (err) {
    console.error("Failed to log email attempt:", err);
  }
}

// ─── SMTP credentials (DB first, env fallback) ─────────────────────────────
async function getSmtpCredentials() {
  let dbMail: any = null;
  try {
    dbMail = await prisma.mailSetting.findFirst();
  } catch (err) {
    console.warn("MailSetting lookup fallback:", err);
  }

  const smtp = (dbMail?.smtp || process.env.MAIL_HOST || "").trim();
  const port = dbMail?.port || (process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587);
  const secure = dbMail?.secure ?? (process.env.MAIL_SECURE === "true");
  const user = (dbMail?.user || process.env.MAIL_USER || "").trim();
  const pass = (dbMail?.password || process.env.MAIL_PASS || "").trim();
  const fromEmail = (dbMail?.fromEmail || process.env.MAIL_FROM || "no-reply@moeen-platform.com").trim();
  const fromName = (dbMail?.fromName || "منصة معين الرقمية").trim();

  return { smtp, port, secure, user, pass, fromEmail, fromName };
}

// ─── Centralized transporter factory (reuses pool when config unchanged) ────
let _cachedTransporter: nodemailer.Transporter | null = null;
let _cachedTransporterKey = "";

function getTransporter(creds: {
  smtp: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}): nodemailer.Transporter {
  const key = `${creds.smtp}:${creds.port}:${creds.user}`;
  if (_cachedTransporter && _cachedTransporterKey === key) {
    return _cachedTransporter;
  }

  // Close old pool if config changed
  if (_cachedTransporter) {
    try { _cachedTransporter.close(); } catch { /* ignore */ }
  }

  _cachedTransporter = nodemailer.createTransport({
    host: creds.smtp,
    port: creds.port,
    secure: creds.secure,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: creds.user,
      pass: creds.pass,
    },
  });
  _cachedTransporterKey = key;
  return _cachedTransporter;
}

// ─── Platform branding (colors, font, logo CID attachment) ──────────────────
interface BrandingInfo {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  fontFamily: string;
  siteNameAr: string;
  attachments: Array<{ filename: string; content?: Buffer; path?: string; cid: string }>;
  hasLogo: boolean;
}

async function getPlatformBranding(): Promise<BrandingInfo> {
  let setting: any = null;
  try {
    setting = await prisma.platformSetting.findFirst({
      include: { logo: true },
    });
  } catch (err) {
    console.warn("PlatformSetting lookup fallback:", err);
  }

  const primaryColor = setting?.primaryColor || "#0A5C4A";
  const secondaryColor = setting?.secondaryColor || "#F9A826";
  const tertiaryColor = setting?.tertiaryColor || "#2FAB99";
  const fontFamily = setting?.fontFamily || "Cairo";
  const siteNameAr = setting?.siteNameAr || "منصة معين الرقمية";

  const attachments: Array<{ filename: string; content?: Buffer; path?: string; cid: string }> = [];
  let hasLogo = false;

  try {
    if (setting?.logo) {
      const logo = setting.logo;
      if (logo.data) {
        attachments.push({
          filename: logo.originalName || "logo.png",
          content: logo.data,
          cid: "platform-logo",
        });
        hasLogo = true;
      } else if (logo.storePath && fs.existsSync(logo.storePath)) {
        attachments.push({
          filename: logo.originalName || "logo.png",
          path: logo.storePath,
          cid: "platform-logo",
        });
        hasLogo = true;
      }
    }

    if (!hasLogo) {
      const publicLogoPath = path.join(process.cwd(), "public", "logo.png");
      if (fs.existsSync(publicLogoPath)) {
        attachments.push({
          filename: "logo.png",
          path: publicLogoPath,
          cid: "platform-logo",
        });
        hasLogo = true;
      }
    }
  } catch (err) {
    console.warn("Failed to resolve logo CID attachment:", err);
  }

  return { primaryColor, secondaryColor, tertiaryColor, fontFamily, siteNameAr, attachments, hasLogo };
}

// ─── Email template renderer (fully inline styles for Gmail/Outlook compat) ─
function renderEmailTemplate({
  title,
  subTitle,
  contentHtml,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  fontFamily,
  siteNameAr,
  hasLogo,
}: {
  title: string;
  subTitle?: string;
  contentHtml: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  fontFamily: string;
  siteNameAr: string;
  hasLogo: boolean;
}) {
  const fontName = fontFamily || "Cairo";
  const googleFontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/'/g, "").replace(/\s+/g, "+")}:wght@400;600;700;800&display=swap`;
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const safeSiteName = escapeHtml(siteNameAr);
  const currentYear = new Date().getFullYear();

  const logoHeader = hasLogo
    ? `<div style="margin-bottom: 18px; text-align: center;">
        <div style="display: inline-block; background: #ffffff; padding: 10px 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 6px 20px rgba(0,0,0,0.12);">
          <img src="cid:platform-logo" alt="${safeSiteName}" height="52" style="max-height: 52px; max-width: 230px; object-fit: contain; display: block; margin: 0 auto; border: 0;" />
        </div>
       </div>`
    : "";

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>${escapeHtml(title)}</title>
      <link href="${googleFontUrl}" rel="stylesheet">
      <!--[if mso]>
      <style>
        table, td { font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important; }
      </style>
      <![endif]-->
    </head>
    <body dir="rtl" style="font-family: '${fontName}', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px 10px; color: #0f172a; direction: rtl; text-align: right;">
      <span style="display:none !important; font-size:0px; color:transparent; line-height:0; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        &#8203;<!-- email_ref:${uniqueId} -->
      </span>
      <div style="max-width: 580px; margin: 20px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${tertiaryColor} 100%); padding: 40px 24px 32px 24px; text-align: center; color: #ffffff;">
          ${logoHeader}
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; font-family: '${fontName}', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;">${safeSiteName}</h1>
          ${subTitle ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #ffffff; opacity: 0.92; font-weight: 600;">${escapeHtml(subTitle)}</p>` : ''}
        </div>
        <div style="padding: 36px 32px; font-size: 15px; line-height: 1.85; color: #334155; font-family: '${fontName}', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;">
          ${contentHtml}
        </div>
        <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9;">
          مع خالص التحية،<br>
          <strong style="color: ${primaryColor}; font-size: 14px;">فريق عمل ${safeSiteName}</strong>
          <div style="margin-top: 12px; font-size: 11px; color: #94a3b8;">© ${currentYear} ${safeSiteName}. جميع الحقوق محفوظة.</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── Helper: build inline-styled button + fallback text link ────────────────
function renderCtaButton(url: string, label: string, primaryColor: string, tertiaryColor: string): string {
  const safeUrl = escapeHtml(url);
  return `
    <div style="text-align: center; margin: 36px 0;">
      <a href="${safeUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${tertiaryColor} 100%); color: #ffffff !important; text-decoration: none; padding: 15px 40px; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 10px 25px ${primaryColor}35;">${escapeHtml(label)}</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8; text-align: center; word-break: break-all; margin-top: 8px;">
      إذا لم يعمل الزر أعلاه، انسخ والصق الرابط التالي في المتصفح:<br>
      <a href="${safeUrl}" style="color: ${primaryColor}; text-decoration: underline;">${safeUrl}</a>
    </p>
  `;
}

// ─── Helper: build inline-styled notice box ─────────────────────────────────
function renderNoticeBox(text: string, primaryColor: string, borderColor: string): string {
  return `<div style="background-color: ${primaryColor}0d; border-right: 4px solid ${borderColor}; padding: 18px; border-radius: 12px; font-size: 13px; color: ${primaryColor}; margin: 28px 0; font-weight: 600;">${text}</div>`;
}

// ─── Helper: build sender header safely ─────────────────────────────────────
function buildSenderHeader(fromName: string, fromEmail: string, fallbackUser: string): string {
  const safeName = sanitizeHeaderValue(fromName);
  return `"${safeName}" <${fromEmail || fallbackUser}>`;
}

// ─── Helper: generate unique X-Entity-Ref-ID ────────────────────────────────
function generateRefId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═════════════════════════════════════════════════════════════════════════════

export async function sendTestEmail(
  targetEmail: string,
  overrideCreds?: {
    smtp?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    password?: string;
    fromEmail?: string;
    fromName?: string;
  }
) {
  const subject = "اختبار الاتصال بخادم البريد (Smtp) - منصة معين";
  try {
    const dbCreds = await getSmtpCredentials();
    const creds = {
      smtp: (overrideCreds?.smtp !== undefined ? overrideCreds.smtp : dbCreds.smtp || "").trim(),
      port: overrideCreds?.port || dbCreds.port || 587,
      secure: overrideCreds?.secure ?? dbCreds.secure,
      user: (overrideCreds?.user !== undefined ? overrideCreds.user : dbCreds.user || "").trim(),
      pass: (overrideCreds?.password !== undefined ? overrideCreds.password : dbCreds.pass || "").trim(),
      fromEmail: (overrideCreds?.fromEmail !== undefined ? overrideCreds.fromEmail : dbCreds.fromEmail || "").trim(),
      fromName: (overrideCreds?.fromName !== undefined ? overrideCreds.fromName : dbCreds.fromName || "").trim(),
    };

    if (!creds.smtp || !creds.user) {
      return {
        success: false,
        message: "إعدادات خادم Smtp غير مكتملة. يرجى إدخال عنوان الخادم واسم المستخدم أولاً.",
      };
    }

    const transporter = getTransporter(creds);
    const branding = await getPlatformBranding();

    const contentHtml = `
      <div style="font-size: 18px; font-weight: 700; color: ${branding.primaryColor}; margin-bottom: 16px;">اختبار خادم البريد (Smtp) ناجح ✅</div>
      <p>تم الاتصال بخادم البريد <strong>${escapeHtml(creds.smtp)}:${creds.port}</strong> بنجاح وإرسال هذه الرسالة الفحصية.</p>
      ${renderNoticeBox("🎉 خادم البريد Smtp يعمل بكفاءة وجاهز لإرسال إيميلات المنصة والدعوات.", branding.primaryColor, branding.secondaryColor || branding.tertiaryColor)}
    `;

    const htmlContent = renderEmailTemplate({
      title: "اختبار خادم البريد (Smtp)",
      subTitle: "اختبار فحص الاتصال التلقائي",
      contentHtml,
      ...branding,
    });

    const textContent = `اختبار خادم البريد (Smtp) ناجح ✅\nتم الاتصال بخادم البريد ${creds.smtp}:${creds.port} بنجاح.\n\nخادم البريد Smtp يعمل بكفاءة وجاهز لإرسال إيميلات المنصة والدعوات.`;

    await transporter.sendMail({
      from: buildSenderHeader(creds.fromName, creds.fromEmail, creds.user),
      to: targetEmail,
      subject,
      html: htmlContent,
      text: textContent,
      attachments: branding.attachments,
      headers: {
        "X-Entity-Ref-ID": generateRefId(),
      },
    });

    await logEmailAttempt({
      toEmail: targetEmail,
      subject,
      status: "SUCCESS",
    });

    return { success: true, message: "تم إرسال بريد فحص تجريبي بنجاح عبر خادم Smtp." };
  } catch (error: any) {
    const errMessage = error?.message || "فشل الاتصال بخادم Smtp";
    await logEmailAttempt({
      toEmail: targetEmail,
      subject,
      status: "FAILED",
      error: errMessage,
    });
    return { success: false, message: errMessage };
  }
}

export async function sendWelcomeAccountEmail({
  toEmail,
  userName,
  resetUrl,
  associationName,
}: {
  toEmail: string;
  userName: string;
  resetUrl: string;
  associationName?: string;
}) {
  const subject = "دعوة ترحيبية وتعيين كلمة المرور - منصة معين الرقمية";
  try {
    const creds = await getSmtpCredentials();

    if (!creds.smtp || !creds.user) {
      console.warn("[EMAIL WARN] Smtp credentials not configured. Welcome URL:", resetUrl);
      await logEmailAttempt({
        toEmail,
        subject,
        status: "MOCK",
        error: "إعدادات Smtp غير مكتملة، تم طباعة رابط الدعوة في السيرفر دون إرسال إيميل فعلي",
      });
      return { success: true, isMock: true };
    }

    const transporter = getTransporter(creds);
    const branding = await getPlatformBranding();

    const safeUserName = escapeHtml(userName);
    const safeAssocName = associationName ? escapeHtml(associationName) : "";

    const contentHtml = `
      <div style="font-size: 18px; font-weight: 700; color: ${branding.primaryColor}; margin-bottom: 16px;">أهلاً ومرحباً بك ${safeUserName} 👋</div>
      <p>تم إنشاء حساب جديد لك في <strong>${escapeHtml(branding.siteNameAr)}</strong> ${safeAssocName ? `كممثل لجمعية (<strong>${safeAssocName}</strong>)` : ''}.</p>
      <p>لإكمال تفعيل حسابك والبدء باستعمال البوابة، يرجى الضغط على الزر التالي لتعيين كلمة المرور الخاصة بك لأول مرة:</p>
      ${renderCtaButton(resetUrl, "قبول الدعوة وتعيين كلمة المرور", branding.primaryColor, branding.tertiaryColor)}
      ${renderNoticeBox("⏱️ <strong>ملاحظة:</strong> رابط الدعوة صالح لمدة 24 ساعة لمرة واحدة فقط.", branding.primaryColor, branding.secondaryColor || branding.tertiaryColor)}
    `;

    const htmlContent = renderEmailTemplate({
      title: "دعوة ترحيبية - " + branding.siteNameAr,
      subTitle: "بوابة إدارة الجمعيات والمستفيدين",
      contentHtml,
      ...branding,
    });

    const textContent = `أهلاً ومرحباً بك ${userName} 👋\n\nتم إنشاء حساب جديد لك في ${branding.siteNameAr}${associationName ? ` كممثل لجمعية (${associationName})` : ''}.\n\nلإكمال تفعيل حسابك، قم بزيارة الرابط التالي:\n${resetUrl}\n\nملاحظة: رابط الدعوة صالح لمدة 24 ساعة لمرة واحدة فقط.\n\nمع خالص التحية،\nفريق عمل ${branding.siteNameAr}`;

    await transporter.sendMail({
      from: buildSenderHeader(creds.fromName, creds.fromEmail, creds.user),
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent,
      attachments: branding.attachments,
      headers: {
        "X-Entity-Ref-ID": generateRefId(),
      },
    });

    await logEmailAttempt({
      toEmail,
      subject,
      status: "SUCCESS",
    });

    return { success: true, isMock: false };
  } catch (error: any) {
    const errMessage = error?.message || "فشل إرسال البريد الترحيبي";
    await logEmailAttempt({
      toEmail,
      subject,
      status: "FAILED",
      error: errMessage,
    });
    return { success: false, error: errMessage };
  }
}

export async function sendPasswordResetEmail({
  toEmail,
  userName,
  resetUrl,
}: {
  toEmail: string;
  userName: string;
  resetUrl: string;
}) {
  const subject = "إعادة تعيين كلمة المرور - منصة معين الرقمية";
  try {
    const creds = await getSmtpCredentials();

    if (!creds.smtp || !creds.user) {
      console.warn("[EMAIL WARN] Smtp credentials not configured. Reset URL:", resetUrl);
      await logEmailAttempt({
        toEmail,
        subject,
        status: "MOCK",
        error: "إعدادات Smtp غير مكتملة، تم طباعة رابط الإعادة في السيرفر دون إرسال إيميل فعلي",
      });
      return { success: true, isMock: true };
    }

    const transporter = getTransporter(creds);
    const branding = await getPlatformBranding();

    const safeUserName = escapeHtml(userName);

    const contentHtml = `
      <div style="font-size: 18px; font-weight: 700; color: ${branding.primaryColor}; margin-bottom: 16px;">مرحباً ${safeUserName} 👋</div>
      <p>تلقينا طلباً لإعادة تعيين كلمة المرور لحسابكم في <strong>${escapeHtml(branding.siteNameAr)}</strong>.</p>
      <p>يمكنك تعيين كلمة مرور جديدة من خلال الضغط على الزر التالي:</p>
      ${renderCtaButton(resetUrl, "إعادة تعيين كلمة المرور", branding.primaryColor, branding.tertiaryColor)}
      ${renderNoticeBox("⏱️ <strong>ملاحظة:</strong> الرابط صالح لمدة ساعة واحدة فقط. إذا لم تقم بطلب الإعادة يرجى تجاهل هذه الرسالة.", branding.primaryColor, branding.secondaryColor || branding.tertiaryColor)}
    `;

    const htmlContent = renderEmailTemplate({
      title: "إعادة تعيين كلمة المرور - " + branding.siteNameAr,
      subTitle: "بوابة إدارة الجمعيات والمستفيدين",
      contentHtml,
      ...branding,
    });

    const textContent = `مرحباً ${userName} 👋\n\nتلقينا طلباً لإعادة تعيين كلمة المرور لحسابكم في ${branding.siteNameAr}.\n\nيمكنك تعيين كلمة مرور جديدة من خلال زيارة الرابط التالي:\n${resetUrl}\n\nملاحظة: الرابط صالح لمدة ساعة واحدة فقط. إذا لم تقم بطلب الإعادة يرجى تجاهل هذه الرسالة.\n\nمع خالص التحية،\nفريق عمل ${branding.siteNameAr}`;

    await transporter.sendMail({
      from: buildSenderHeader(creds.fromName, creds.fromEmail, creds.user),
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent,
      attachments: branding.attachments,
      headers: {
        "X-Entity-Ref-ID": generateRefId(),
      },
    });

    await logEmailAttempt({
      toEmail,
      subject,
      status: "SUCCESS",
    });

    return { success: true, isMock: false };
  } catch (error: any) {
    const errMessage = error?.message || "فشل إرسال بريد استعادة كلمة المرور";
    await logEmailAttempt({
      toEmail,
      subject,
      status: "FAILED",
      error: errMessage,
    });
    return { success: false, error: errMessage };
  }
}
