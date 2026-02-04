// Supabase Edge Function for sending emails
// Deploy this to: supabase functions deploy send-email
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.16.0/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Pulp Fiction <noreply@pulpfiction.com>";

// SMTP Fallback configuration
const SMTP_HOST = Deno.env.get("SMTP_HOST");
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

interface EmailRequest {
  type: "welcome" | "otp" | "order_confirmation" | "subscription_confirmation";
  to: string;
  data: Record<string, unknown>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();

    let subject = "";
    let html = "";

    switch (type) {
      case "welcome":
        subject = "Welcome to Pulp Fiction! 🍊";
        html = generateWelcomeEmail(data.fullName as string);
        break;

      case "otp":
        subject = "Your Password Reset Code - Pulp Fiction";
        html = generateOTPEmail(data.code as string, data.fullName as string);
        break;

      case "order_confirmation":
        subject = `Order Confirmed - ${data.orderNumber}`;
        html = generateOrderConfirmationEmail(
          data.fullName as string,
          data.orderNumber as string,
          data.orderTotal as number,
          data.orderItems as Array<{ name: string; quantity: number; price: number }>
        );
        break;

      case "subscription_confirmation":
        subject = "Your Subscription is Active! 🥤";
        html = generateSubscriptionConfirmationEmail(
          data.fullName as string,
          data.frequency as string,
          data.totalPrice as number,
          data.nextDeliveryDate as string
        );
        break;

      default:
        throw new Error("Invalid email type");
    }

    // Try Resend first
    let result;
    if (RESEND_API_KEY) {
      try {
        result = await sendViaResend(to, subject, html);
        return new Response(
          JSON.stringify({ success: true, id: result.id, provider: "resend" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (resendError) {
        console.error("Resend failed:", resendError.message);
        // Fall through to SMTP if Resend fails
      }
    }

    // Fallback to SMTP
    if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
      try {
        result = await sendViaSMTP(to, subject, html);
        return new Response(
          JSON.stringify({ success: true, id: result.id, provider: "smtp" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (smtpError) {
        console.error("SMTP failed:", smtpError.message);
        throw new Error(`Both Resend and SMTP failed: ${smtpError.message}`);
      }
    }

    throw new Error("No email provider configured (neither Resend nor SMTP)");
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

async function sendViaResend(
  to: string,
  subject: string,
  html: string
): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to send email via Resend");
  }

  return { id: result.id };
}

async function sendViaSMTP(
  to: string,
  subject: string,
  html: string
): Promise<{ id: string }> {
  const client = new SmtpClient();

  try {
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USER,
      password: SMTP_PASSWORD,
    });

    await client.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      content: html,
      html: true,
    });

    await client.close();

    return { id: `smtp-${Date.now()}` };
  } catch (error) {
    throw new Error(`SMTP connection failed: ${error.message}`);
  }
}

function generateWelcomeEmail(fullName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🍊 Pulp Fiction</h1>
      <p style="color: #bbf7d0; margin: 10px 0 0 0; font-size: 16px;">Fresh. Natural. Delicious.</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #166534; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${fullName || 'Juice Lover'}! 🎉</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        We're thrilled to have you join the Pulp Fiction family! You've just taken the first step towards a healthier, more delicious lifestyle.
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Explore our collection of fresh, cold-pressed juices made from the finest fruits and vegetables. Every bottle is crafted with love and care to bring you maximum nutrition and amazing taste.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://pulpfiction.com/shop" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Start Shopping</a>
      </div>
      
      <!-- Features -->
      <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; margin-top: 30px;">
        <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">What you can expect:</h3>
        <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>🥤 100% fresh, cold-pressed juices</li>
          <li>🚚 Free delivery on orders over ₹500</li>
          <li>📦 Build your own custom juice box</li>
          <li>🔄 Flexible subscription options</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Need help? Reply to this email or contact us at<br>
        <a href="mailto:support@pulpfiction.com" style="color: #16a34a;">support@pulpfiction.com</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0;">
        © 2024 Pulp Fiction. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateOTPEmail(code: string, fullName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🔐 Password Reset</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px; text-align: center;">
      <h2 style="color: #166534; margin: 0 0 20px 0; font-size: 24px;">Hello${fullName ? `, ${fullName}` : ''}!</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        You requested to reset your password. Use the code below to continue with your password reset.
      </p>
      
      <!-- OTP Code -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 12px; padding: 30px; margin: 30px 0;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
        <div style="font-size: 40px; font-weight: 700; color: #166534; letter-spacing: 8px; font-family: 'Courier New', monospace;">
          ${code}
        </div>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        This code will expire in <strong>15 minutes</strong>.
      </p>
      
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin-top: 30px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          ⚠️ If you didn't request this password reset, please ignore this email or contact support if you have concerns.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Need help? Contact us at<br>
        <a href="mailto:support@pulpfiction.com" style="color: #16a34a;">support@pulpfiction.com</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0;">
        © 2024 Pulp Fiction. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateOrderConfirmationEmail(
  fullName: string,
  orderNumber: string,
  orderTotal: number,
  orderItems: Array<{ name: string; quantity: number; price: number }>
): string {
  const itemsHtml = orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">✅ Order Confirmed!</h1>
      <p style="color: #bbf7d0; margin: 10px 0 0 0; font-size: 16px;">Order #${orderNumber}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #166534; margin: 0 0 20px 0; font-size: 24px;">Thank you, ${fullName || 'Valued Customer'}! 🎉</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your order has been confirmed and is being prepared. We'll send you another email when your juices are on their way!
      </p>
      
      <!-- Order Details -->
      <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 30px 0;">
        <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #e5e7eb;">
              <th style="padding: 12px; text-align: left; color: #374151;">Item</th>
              <th style="padding: 12px; text-align: center; color: #374151;">Qty</th>
              <th style="padding: 12px; text-align: right; color: #374151;">Price</th>
            </tr>
          </thead>
          <tbody style="color: #374151;">
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 12px; font-weight: 700; color: #166534; font-size: 18px;">Total</td>
              <td style="padding: 15px 12px; font-weight: 700; color: #166534; font-size: 18px; text-align: right;">₹${orderTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://pulpfiction.com/profile" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Track Your Order</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Questions about your order?<br>
        <a href="mailto:support@pulpfiction.com" style="color: #16a34a;">support@pulpfiction.com</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0;">
        © 2024 Pulp Fiction. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateSubscriptionConfirmationEmail(
  fullName: string,
  frequency: string,
  totalPrice: number,
  nextDeliveryDate: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🥤 Subscription Active!</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #166534; margin: 0 0 20px 0; font-size: 24px;">Great choice, ${fullName || 'Juice Enthusiast'}! 🎉</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your juice subscription is now active! Get ready for regular deliveries of fresh, delicious juices right to your doorstep.
      </p>
      
      <!-- Subscription Details -->
      <div style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #166534; margin: 0 0 20px 0; font-size: 18px;">Subscription Details</h3>
        <table style="width: 100%;">
          <tr>
            <td style="color: #6b7280; padding: 8px 0;">Frequency:</td>
            <td style="color: #166534; font-weight: 600; text-align: right; padding: 8px 0;">${frequency}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 8px 0;">Price per delivery:</td>
            <td style="color: #166534; font-weight: 600; text-align: right; padding: 8px 0;">₹${totalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 8px 0;">Next delivery:</td>
            <td style="color: #166534; font-weight: 600; text-align: right; padding: 8px 0;">${nextDeliveryDate}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        You can manage, pause, or cancel your subscription anytime from your account settings.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://pulpfiction.com/profile" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Manage Subscription</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Questions about your subscription?<br>
        <a href="mailto:support@pulpfiction.com" style="color: #16a34a;">support@pulpfiction.com</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0;">
        © 2024 Pulp Fiction. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
