import 'dotenv/config';
import nodemailer from 'nodemailer';

const SMTP_HOST = 'smtp.mailtrap.io';
const SMTP_PORT = 2525; 
const SMTP_USER = process.env.MAILTRAP_USER;   
const SMTP_PASS = process.env.MAILTRAP_PASS; 

const SENDER_EMAIL = process.env.SENDER_EMAIL 

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

const sendPhotoEmail = async (toEmail, photoUrl) => {
    const mailOptions = {
        from: `"Pidzybox" <${SENDER_EMAIL}>`,
        to: toEmail,
        subject: "Your Pidzybox Photo is Ready!",
        html: `<p>Dear Customer,</p>
                <p>Your photo is ready! You can view and download it using the link below:</p>
                <a href="${photoUrl}">View Your Photo</a>
                <p>Thank you for using Pidzybox!</p>
                <p>Best regards,<br/>The Pidzybox Team</p>`
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Photo email sent successfully to", toEmail);
        console.log("Message ID:", info.messageId);
        console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
        return true
    } catch (error) {
        console.error("Error sending photo email to", toEmail, ":", error);
        return false
    }
};
export { sendPhotoEmail };