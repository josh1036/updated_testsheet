import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, shareUrl, addressLocation, date, switchboardNumber, workerName, licenceNumber, companyName, contractorName } = await req.json();
    if (!to || !shareUrl) return Response.json({ error: 'Missing required fields' }, { status: 400 });

    const fromName = companyName || contractorName || 'AS/NZS Test Results';

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2044;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Electrical Test Results</h1>
          <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">AS/NZS 3000:2018 &amp; AS/NZS 3008</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">Hi,</p>
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">Please find below your electrical test results. You can view, download, and print the full report using the link below.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;">
            ${addressLocation ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:160px;">Address</td><td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">${addressLocation}</td></tr>` : ''}
            ${date ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Date</td><td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">${date}</td></tr>` : ''}
            ${switchboardNumber ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Switchboard</td><td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">${switchboardNumber}</td></tr>` : ''}
            ${workerName ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Worker</td><td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">${workerName}</td></tr>` : ''}
            ${licenceNumber ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Licence No.</td><td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">${licenceNumber}</td></tr>` : ''}
          </table>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0f2044;border-radius:8px;padding:14px 28px;">
              <a href="${shareUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">View Test Results →</a>
            </td></tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">From the link you can view, print, or save the report as a PDF.<br>This link is shareable and does not require a login.</p>
        </td></tr>
        <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Sent by ${fromName} via AS/NZS Test Results</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <noreply@testsheet.com.au>`, to: [to], subject: `Electrical Test Results — ${addressLocation || 'Job'}`, html: emailHtml }),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.message || 'Resend error' }, { status: 500 });
    return Response.json({ success: true, id: data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});