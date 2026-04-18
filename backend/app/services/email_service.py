"""Email utility — sends credentials to newly created users via SMTP."""
from __future__ import annotations
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def send_credentials_email(to_email: str, name: str, role: str, temp_password: str) -> bool:
    """Send a welcome email with temporary credentials. Returns True on success."""
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_user:
        logger.warning("SMTP not configured — skipping email to %s", to_email)
        return False

    role_label = "Student" if role == "student" else "Faculty / Mentor"
    login_url = settings.frontend_url or "http://localhost:3000"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f1117;color:#e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
        <h1 style="margin:0;font-size:1.5rem;color:#fff;">🎓 Welcome to AcadeX</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">Your academic portal account is ready</p>
      </div>
      <div style="padding:28px 32px;">
        <p>Hi <strong>{name}</strong>,</p>
        <p>Your <strong>{role_label}</strong> account has been created by the Academic Coordinator.</p>
        <div style="background:#1a1f36;border:1px solid rgba(99,102,241,0.3);border-radius:10px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:0.8rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Your Login Credentials</p>
          <p style="margin:4px 0;"><strong>Email:</strong> {to_email}</p>
          <p style="margin:4px 0;"><strong>Temporary Password:</strong> <code style="background:#2d3748;padding:2px 8px;border-radius:4px;font-size:1rem;color:#a78bfa;">{temp_password}</code></p>
        </div>
        <p style="color:#f59e0b;font-size:0.88rem;">⚠️ You will be required to change your password on first login.</p>
        <a href="{login_url}/login" style="display:inline-block;margin-top:8px;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Login to AcadeX →
        </a>
      </div>
      <div style="padding:16px 32px;border-top:1px solid #1e2744;font-size:0.78rem;color:#64748b;">
        If you did not expect this email, please contact your institution's coordinator.
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome to AcadeX — Your Account Credentials"
    msg["From"]    = settings.smtp_user
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        port = settings.smtp_port
        if settings.smtp_use_tls:
            with smtplib.SMTP_SSL(settings.smtp_host, port) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_user, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, port) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_user, [to_email], msg.as_string())
        logger.info("Credentials email sent to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        return False


def send_reset_email(to_email: str, name: str, reset_url: str) -> bool:
    """Send a password reset link email."""
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_user:
        logger.warning("SMTP not configured — skipping reset email to %s", to_email)
        return False

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f1117;color:#e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
        <h1 style="margin:0;font-size:1.5rem;color:#fff;">🔐 Reset Your Password</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">AcadeX Password Reset</p>
      </div>
      <div style="padding:28px 32px;">
        <p>Hi <strong>{name}</strong>,</p>
        <p>We received a request to reset your AcadeX password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="{reset_url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem;">
            Reset My Password
          </a>
        </div>
        <p style="color:#64748b;font-size:0.83rem;">If you didn't request a password reset, ignore this email — your password will remain unchanged.</p>
        <div style="background:#1a1f36;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:0.78rem;color:#94a3b8;word-break:break-all;">
          Or copy this link: {reset_url}
        </div>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset Your AcadeX Password"
    msg["From"]    = settings.smtp_user
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        if settings.smtp_use_tls:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_user, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.ehlo(); server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_user, [to_email], msg.as_string())
        logger.info("Reset email sent to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send reset email to %s: %s", to_email, e)
        return False
