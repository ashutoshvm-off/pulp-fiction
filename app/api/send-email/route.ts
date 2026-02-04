import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'contactpulpfiction@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'qwlesghdewdjsiyb',
    },
});

const getWelcomeEmailHtml = (fullName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Pulp Fiction!</h1>
        </div>
        <div class="content">
            <p>Hi ${fullName},</p>
            <p>Welcome to Pulp Fiction! We're thrilled to have you join our community of juice enthusiasts.</p>
            <p>Get ready to explore our delicious, fresh-pressed juices made from the finest ingredients.</p>
            <p>Cheers,<br>The Pulp Fiction Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Pulp Fiction. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export async function POST(request: NextRequest) {
    try {
        const { type, to, data } = await request.json();

        let subject = '';
        let html = '';

        switch (type) {
            case 'welcome':
                subject = 'Welcome to Pulp Fiction! 🍊';
                html = getWelcomeEmailHtml(data.fullName);
                break;
            default:
                return NextResponse.json({ success: false, error: 'Unknown email type' }, { status: 400 });
        }

        await transporter.sendMail({
            from: 'Pulp Fiction <contactpulpfiction@gmail.com>',
            to,
            subject,
            html,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('❌ Failed to send email:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
