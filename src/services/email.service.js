import nodemailer from 'nodemailer';
import { logger } from '../config/logger.js';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"CareFlow EHR" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html
    });

    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending error:', error);
    throw error;
  }
};

export const sendAppointmentReminder = async (appointment) => {
  const html = `
    <h2>Rappel de Rendez-vous</h2>
    <p>Bonjour ${appointment.patient.firstName},</p>
    <p>Ceci est un rappel pour votre rendez-vous:</p>
    <ul>
      <li><strong>Date:</strong> ${new Date(appointment.dateTime).toLocaleDateString('fr-FR')}</li>
      <li><strong>Heure:</strong> ${new Date(appointment.dateTime).toLocaleTimeString('fr-FR')}</li>
      <li><strong>Médecin:</strong> Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}</li>
      <li><strong>Durée:</strong> ${appointment.duration} minutes</li>
    </ul>
    <p>Merci de confirmer votre présence.</p>
  `;

  return sendEmail({
    to: appointment.patient.email,
    subject: 'Rappel de Rendez-vous - CareFlow',
    html
  });
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const html = `
    <h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour ${user.firstName},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>Ce lien expire dans 1 heure.</p>
    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Réinitialisation de mot de passe - CareFlow',
    html
  });
};
