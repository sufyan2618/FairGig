from __future__ import annotations

import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.otp_code import OtpPurpose


logger = logging.getLogger(__name__)


class BrevoEmailService:
    async def send_otp_email(
        self,
        *,
        recipient_email: str,
        recipient_name: str,
        otp_code: str,
        purpose: OtpPurpose,
    ) -> None:
        is_development = settings.ENVIRONMENT.lower() == "development"

        if not settings.BREVO_API_KEY:
            if is_development:
                logger.warning(
                    "BREVO_API_KEY missing; skipping OTP email in development. recipient=%s purpose=%s otp=%s",
                    recipient_email,
                    purpose.value,
                    otp_code,
                )
                return
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Brevo API key is not configured.",
            )

        if purpose == OtpPurpose.EMAIL_VERIFICATION:
            subject = "Verify your FairGig account"
            action_label = "email verification"
        else:
            subject = "Reset your FairGig password"
            action_label = "password reset"

        html_content = f"""
        <html>
          <body style=\"font-family:Arial,sans-serif;line-height:1.5;color:#1b1f23;\">
            <h2 style=\"margin-bottom:8px;\">FairGig Security Code</h2>
            <p>Hello {recipient_name},</p>
            <p>Your one-time code for {action_label} is:</p>
            <p style=\"font-size:24px;font-weight:700;letter-spacing:3px;\">{otp_code}</p>
            <p>This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </body>
        </html>
        """

        payload = {
            "sender": {
                "name": settings.BREVO_SENDER_NAME,
                "email": settings.BREVO_SENDER_EMAIL,
            },
            "to": [{"email": recipient_email, "name": recipient_name}],
            "subject": subject,
            "htmlContent": html_content,
        }

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": settings.BREVO_API_KEY,
        }
        logger.info("Sending OTP email via Brevo to %s for purpose %s", recipient_email, purpose.value)
        logger.info("brevo api key is set: %s", bool(settings.BREVO_API_KEY))

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{settings.BREVO_BASE_URL}/smtp/email",
                    headers=headers,
                    json=payload,
                )
        except httpx.HTTPError as exc:
            logger.exception("Brevo request failed for recipient=%s", recipient_email)
            if is_development:
                logger.warning(
                    "Continuing without email in development. recipient=%s purpose=%s otp=%s",
                    recipient_email,
                    purpose.value,
                    otp_code,
                )
                return
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to send OTP email via Brevo.",
            ) from exc

        if response.status_code >= 400:
            logger.error(
                "Brevo rejected OTP email: status=%s recipient=%s body=%s",
                response.status_code,
                recipient_email,
                response.text,
            )
            if is_development:
                logger.warning(
                    "Continuing without email in development. recipient=%s purpose=%s otp=%s",
                    recipient_email,
                    purpose.value,
                    otp_code,
                )
                return
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to send OTP email via Brevo.",
            )
