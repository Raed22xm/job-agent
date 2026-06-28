import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { to, subject, text } = body;

    if (!to || !subject || !text) {
      return NextResponse.json({ error: "Missing to, subject, or text" }, { status: 400 });
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return NextResponse.json({ 
        error: "SMTP credentials not configured in .env (SMTP_HOST, SMTP_USER, SMTP_PASS)" 
      }, { status: 501 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Job Agent" <${user}>`,
      to,
      subject,
      text,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("Send Email Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
