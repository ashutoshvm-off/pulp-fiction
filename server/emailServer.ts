import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'contactpulpfiction@gmail.com',
        pass: 'qwlesghdewdjsiyb', // App password
    },
});

// Email templates
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
            <p>If you have any questions, feel free to reach out to us anytime.</p>
            <p>Cheers,<br>The Pulp Fiction Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Pulp Fiction. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
    const { type, to, data } = req.body;

    console.log('📧 Received email request:', { type, to });

    try {
        let subject = '';
        let html = '';

        switch (type) {
            case 'welcome':
                subject = 'Welcome to Pulp Fiction! 🍊';
                html = getWelcomeEmailHtml(data.fullName);
                break;
            default:
                return res.status(400).json({ success: false, error: 'Unknown email type' });
        }

        const mailOptions = {
            from: 'Pulp Fiction <contactpulpfiction@gmail.com>',
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', to);
        res.json({ success: true });
    } catch (error: any) {
        console.error('❌ Failed to send email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'email-server' });
});

app.listen(PORT, () => {
    console.log(`📧 Email server running on http://localhost:${PORT}`);
});
