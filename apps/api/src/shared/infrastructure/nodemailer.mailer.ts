import nodemailer, { Transporter } from 'nodemailer';
import { Mailer } from '../application/ports';
import { logger } from './logger';
export interface SmtpConfig { host?: string; port: number; user?: string; pass?: string; from?: string }
export class NodemailerMailer implements Mailer {
  private transport: Transporter | null;
  constructor(private cfg: SmtpConfig) {
    this.transport = cfg.host ? nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.port === 465, auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined }) : null;
  }
  async send(to: string, subject: string, html: string) {
    if (!this.transport) { logger.info({ to, subject }, 'SMTP not configured; email not sent'); return false; }
    try { await this.transport.sendMail({ from: this.cfg.from ?? 'BREWORA <no-reply@brewora.pk>', to, subject, html }); return true; }
    catch (err) { logger.error({ err, to }, 'email failed'); return false; }
  }
}
