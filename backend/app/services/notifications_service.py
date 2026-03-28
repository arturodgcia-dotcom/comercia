def send_email_notification(to_email: str, subject: str, body: str) -> None:
    print("[EMAIL]", {"to": to_email, "subject": subject, "body": body})


def send_whatsapp_placeholder(phone: str | None, message: str) -> None:
    # Placeholder intencional para futura integración oficial WhatsApp Business API.
    print("[WHATSAPP_PLACEHOLDER]", {"phone": phone, "message": message})
