import nodemailer from 'nodemailer';
import { EmailLog } from '../models/EmailLog.js';

export interface AssignmentEmailParams {
  internName: string;
  internId: string;
  internEmail: string;
  projectName: string;
  projectId: string;
  projectDescription: string;
  assignedDate: string;
  deadline: string;
  assignedBy: string;
}

export function createAssignmentEmailTemplate(params: AssignmentEmailParams): { subject: string; html: string; text: string } {
  const subject = `New Project Assigned – Phoenix Tech Solutions`;
  
  const text = `
Subject: New Project Assigned – Phoenix Tech Solutions

Dear ${params.internName},

A new project has been assigned to you by the Admin at Phoenix Tech Solutions.

Project Assignment Details:
- Intern Name: ${params.internName}
- Intern ID: ${params.internId}
- Project Name: ${params.projectName}
- Project ID: ${params.projectId}
- Project Description: ${params.projectDescription}
- Assigned Date: ${params.assignedDate}
- Project Deadline: ${params.deadline}
- Assigned By: ${params.assignedBy}

Please log in to your Phoenix Tech Solutions Intern Dashboard to view the complete project details and start working on your assigned project.

Best Regards,
Phoenix Tech Solutions
Project Management Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Project Assigned – Phoenix Tech Solutions</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 24px; color: #f1f5f9; }
    .card { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 24px; text-align: center; border-bottom: 2px solid #f97316; }
    .logo-container { margin-bottom: 12px; }
    .logo-img { width: 72px; height: 72px; border-radius: 50%; box-shadow: 0 4px 12px rgba(249,115,22,0.4); }
    .company-name { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; margin: 0; }
    .company-sub { font-size: 11px; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; color: #f8fafc; font-weight: 600; margin-bottom: 12px; }
    .intro { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
    .details-box { background-color: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin-bottom: 24px; }
    .details-title { font-size: 13px; font-weight: 700; color: #f97316; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #1e293b; font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-val { color: #e2e8f0; font-weight: 600; text-align: right; }
    .desc-box { margin-top: 10px; padding: 10px; background-color: #090d16; border-radius: 6px; font-size: 12px; color: #cbd5e1; line-height: 1.5; }
    .action-container { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff !important; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
    .footer { background-color: #020617; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-container">
        <img class="logo-img" src="https://ais-dev-76ypw4tm2bmx45duz3kmrf-367046504991.asia-southeast1.run.app/assets/aistudio/image_c321df86.png" alt="Phoenix Tech Solutions" />
      </div>
      <h1 class="company-name">Phoenix Tech Solutions</h1>
      <div class="company-sub">Project Management & Intern Development</div>
    </div>
    
    <div class="content">
      <div class="greeting">Dear ${params.internName},</div>
      <p class="intro">
        A new project has been officially assigned to you by the Project Administration team at <strong>Phoenix Tech Solutions</strong>.
      </p>

      <div class="details-box">
        <div class="details-title">Project Assignment Details</div>
        <div class="detail-row"><span class="detail-label">Intern Name:</span><span class="detail-val">${params.internName}</span></div>
        <div class="detail-row"><span class="detail-label">Intern ID:</span><span class="detail-val">${params.internId}</span></div>
        <div class="detail-row"><span class="detail-label">Project Name:</span><span class="detail-val">${params.projectName}</span></div>
        <div class="detail-row"><span class="detail-label">Project ID:</span><span class="detail-val">${params.projectId}</span></div>
        <div class="detail-row"><span class="detail-label">Assigned Date:</span><span class="detail-val">${params.assignedDate}</span></div>
        <div class="detail-row"><span class="detail-label">Project Deadline:</span><span class="detail-val">${params.deadline}</span></div>
        <div class="detail-row"><span class="detail-label">Assigned By:</span><span class="detail-val">${params.assignedBy}</span></div>
        
        <div style="margin-top: 12px;">
          <span class="detail-label" style="display:block; margin-bottom:4px;">Project Description:</span>
          <div class="desc-box">${params.projectDescription || 'No description provided.'}</div>
        </div>
      </div>

      <div class="action-container">
        <a href="https://ais-dev-76ypw4tm2bmx45duz3kmrf-367046504991.asia-southeast1.run.app" class="btn" target="_blank">
          Open Intern Dashboard
        </a>
      </div>

      <p class="intro" style="font-size: 13px; margin-bottom: 0;">
        Please log in to your Phoenix Tech Solutions Intern Dashboard to review complete specifications, team members, and weekly milestones.
      </p>
    </div>

    <div class="footer">
      <strong>Phoenix Tech Solutions</strong> · Enterprise Project & Intern Management System<br>
      This is an automated notification. For questions, contact your project mentor or operations supervisor.
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export async function sendAssignmentEmail(params: AssignmentEmailParams): Promise<{ success: boolean; status: 'sent' | 'logged_preview' | 'failed'; emailId: string; error?: string }> {
  const emailId = `EML-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const { subject, html, text } = createAssignmentEmailTemplate(params);

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || '"Phoenix Tech Solutions" <notifications@phoenixtech.corp>';

  const isLiveSmtpConfigured = !!(smtpHost && smtpUser && smtpPass);

  if (isLiveSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: fromEmail,
        to: `"${params.internName}" <${params.internEmail}>`,
        subject,
        text,
        html,
      });

      await EmailLog.create({
        emailId,
        recipientEmail: params.internEmail,
        recipientName: params.internName,
        recipientRole: 'intern',
        internId: params.internId,
        projectId: params.projectId,
        projectName: params.projectName,
        subject,
        bodyHtml: html,
        status: 'sent',
        assignedBy: params.assignedBy,
        deliveryAttempts: 1,
      });

      console.log(`[Email] Live SMTP email delivered to ${params.internEmail} for project ${params.projectId}`);
      return { success: true, status: 'sent', emailId };
    } catch (err: any) {
      console.warn(`[Email] SMTP delivery failed for ${params.internEmail}:`, err?.message || err);

      await EmailLog.create({
        emailId,
        recipientEmail: params.internEmail,
        recipientName: params.internName,
        recipientRole: 'intern',
        internId: params.internId,
        projectId: params.projectId,
        projectName: params.projectName,
        subject,
        bodyHtml: html,
        status: 'failed',
        errorDetails: err?.message || String(err),
        assignedBy: params.assignedBy,
        deliveryAttempts: 1,
      });

      return { success: false, status: 'failed', emailId, error: err?.message };
    }
  }

  // Fallback: SMTP not configured in environment, log to MongoDB and enable UI preview drawer
  try {
    await EmailLog.create({
      emailId,
      recipientEmail: params.internEmail,
      recipientName: params.internName,
      recipientRole: 'intern',
      internId: params.internId,
      projectId: params.projectId,
      projectName: params.projectName,
      subject,
      bodyHtml: html,
      status: 'logged_preview',
      errorDetails: 'SMTP credentials not configured in environment. Logged for in-app preview.',
      assignedBy: params.assignedBy,
      deliveryAttempts: 1,
    });

    console.log(`[Email] Assignment notification logged for ${params.internEmail} (preview mode)`);
    return { success: true, status: 'logged_preview', emailId };
  } catch (logErr: any) {
    console.error('[Email] Failed to create EmailLog record:', logErr?.message || logErr);
    return { success: false, status: 'failed', emailId, error: logErr?.message };
  }
}
