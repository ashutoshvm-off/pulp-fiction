import { sendWelcomeEmail } from '../lib/services/emailService';

async function testEmail() {
    console.log('🧪 Testing email service...');
    
    const result = await sendWelcomeEmail(
        'your-test-email@gmail.com', // Replace with your email
        'Test User'
    );
    
    if (result.success) {
        console.log('✅ Email sent successfully!');
    } else {
        console.log('❌ Email failed:', result.error);
    }
}

testEmail();
