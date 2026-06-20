const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends an email notification to the customer about their service request update
 * @param {string} toEmail - Customer's email address
 * @param {string} customerName - Customer's name
 * @param {object} requestDetails - Details of the service request
 */
const sendStatusUpdateEmail = async (toEmail, customerName, requestDetails) => {
    try {
        if (!toEmail) {
            console.log("No email provided for customer:", customerName);
            return;
        }

        const mailOptions = {
            from: `RTO Ledger System <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to: toEmail,
            subject: `Update on your Service Request (${requestDetails.request_no})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Service Request Update</h2>
                    <p>Dear <strong>${customerName}</strong>,</p>
                    <p>This is to inform you that your service request has been updated.</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <ul style="list-style-type: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 10px;"><strong>Request No:</strong> ${requestDetails.request_no}</li>
                            <li style="margin-bottom: 10px;"><strong>Service:</strong> ${requestDetails.service_name || 'N/A'}</li>
                            <li style="margin-bottom: 10px;"><strong>Vehicle:</strong> ${requestDetails.vehicle_number || 'N/A'}</li>
                            <li style="margin-bottom: 10px;"><strong>Status:</strong> <span style="padding: 3px 8px; border-radius: 4px; background-color: #e0e7ff; color: #3730a3; font-weight: bold;">${requestDetails.status}</span></li>
                            <li style="margin-bottom: 10px;"><strong>Remarks:</strong> ${requestDetails.remarks || 'None'}</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions, please contact us.</p>
                    <p>Best Regards,<br><strong>RTO Ledger System Team</strong></p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${toEmail}: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending email to ${toEmail}:`, error);
        // We log the error but don't throw it, so it doesn't break the main application flow
    }
};

module.exports = {
    sendStatusUpdateEmail,
};
