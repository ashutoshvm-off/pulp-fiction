// Supabase Edge Function for sending emails
// Deploy this to: supabase functions deploy send-email
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates
const templates = {
  welcome: (data: any) => ({
    subject: "Welcome to Pulp Fiction! 🍊",
    html: `
            <!DOCTYPE html>
            <html>
            <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#8B4513;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{padding:20px;background:#f9f9f9}.footer{text-align:center;padding:20px;color:#666;font-size:12px}</style></head>
            <body>
                <div class="container">
                    <div class="header"><h1>Welcome to Pulp Fiction!</h1></div>
                    <div class="content">
                        <p>Hi ${data.fullName},</p>
                        <p>Welcome to Pulp Fiction! We're thrilled to have you join our community of juice enthusiasts.</p>
                        <p>Get ready to explore our delicious, fresh-pressed juices made from the finest ingredients.</p>
                        <p>Cheers,<br>The Pulp Fiction Team</p>
                    </div>
                    <div class="footer"><p>© ${new Date().getFullYear()} Pulp Fiction. All rights reserved.</p></div>
                </div>
            </body>
            </html>
        `,
  }),

  password_reset: (data: any) => ({
    subject: "Reset Your Password - Pulp Fiction",
    html: `
            <!DOCTYPE html>
            <html>
            <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#8B4513;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{padding:20px;background:#f9f9f9}.btn{display:inline-block;background:#F97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{text-align:center;padding:20px;color:#666;font-size:12px}</style></head>
            <body>
                <div class="container">
                    <div class="header"><h1>Password Reset</h1></div>
                    <div class="content">
                        <p>Hi ${data.fullName},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <p style="text-align:center"><a href="${data.resetLink}" class="btn">Reset Password</a></p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                        <p>Cheers,<br>The Pulp Fiction Team</p>
                    </div>
                    <div class="footer"><p>© ${new Date().getFullYear()} Pulp Fiction. All rights reserved.</p></div>
                </div>
            </body>
            </html>
        `,
  }),

  order_confirmation: (data: any) => ({
    subject: `Order Confirmed - ${data.orderNumber} 🧃`,
    html: `
            <!DOCTYPE html>
            <html>
            <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#8B4513;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{padding:20px;background:#f9f9f9}.item{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #ddd}.total{font-size:18px;font-weight:bold;margin-top:20px}.footer{text-align:center;padding:20px;color:#666;font-size:12px}</style></head>
            <body>
                <div class="container">
                    <div class="header"><h1>Order Confirmed!</h1></div>
                    <div class="content">
                        <p>Hi ${data.fullName},</p>
                        <p>Thank you for your order! Here's your order summary:</p>
                        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
                        <div style="margin:20px 0">
                            ${data.orderItems.map((item: any) => `
                                <div class="item">
                                    <span>${item.name} x ${item.quantity}</span>
                                    <span>₹${item.price}</span>
                                </div>
                            `).join('')}
                        </div>
                        <p class="total">Total: ₹${data.orderTotal}</p>
                        <p>We'll notify you when your order ships!</p>
                        <p>Cheers,<br>The Pulp Fiction Team</p>
                    </div>
                    <div class="footer"><p>© ${new Date().getFullYear()} Pulp Fiction. All rights reserved.</p></div>
                </div>
            </body>
            </html>
        `,
  }),

  subscription_confirmation: (data: any) => ({
    subject: "Subscription Confirmed! 🍊",
    html: `
            <!DOCTYPE html>
            <html>
            <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#8B4513;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{padding:20px;background:#f9f9f9}.highlight{background:#FFF7ED;padding:15px;border-radius:8px;margin:20px 0}.footer{text-align:center;padding:20px;color:#666;font-size:12px}</style></head>
            <body>
                <div class="container">
                    <div class="header"><h1>Subscription Confirmed!</h1></div>
                    <div class="content">
                        <p>Hi ${data.fullName},</p>
                        <p>Your juice subscription is now active!</p>
                        <div class="highlight">
                            <p><strong>Frequency:</strong> ${data.frequency}</p>
                            <p><strong>Amount:</strong> ₹${data.totalPrice}</p>
                            <p><strong>Next Delivery:</strong> ${data.nextDeliveryDate}</p>
                        </div>
                        <p>We'll send you fresh juices on schedule. You can manage your subscription anytime from your account.</p>
                        <p>Cheers,<br>The Pulp Fiction Team</p>
                    </div>
                    <div class="footer"><p>© ${new Date().getFullYear()} Pulp Fiction. All rights reserved.</p></div>
                </div>
            </body>
            </html>
        `,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, to, data } = await req.json();

    if (!type || !to || !templates[type as keyof typeof templates]) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email type or missing recipient" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const template = templates[type as keyof typeof templates](data);

    const client = new SmtpClient();
    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
      port: Number(Deno.env.get("SMTP_PORT")) || 587,
      username: Deno.env.get("SMTP_USER")!,
      password: Deno.env.get("SMTP_PASSWORD")!,
    });

    await client.send({
      from: Deno.env.get("FROM_EMAIL") || "Pulp Fiction <contactpulpfiction@gmail.com>",
      to,
      subject: template.subject,
      content: template.html,
      html: template.html,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, provider: "SMTP" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
