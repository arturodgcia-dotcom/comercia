import json
from typing import Any

import stripe


def create_checkout_session_plan1(
    *,
    secret_key: str,
    line_items: list[dict[str, Any]],
    success_url: str,
    cancel_url: str,
    metadata: dict[str, str],
) -> stripe.checkout.Session:
    stripe.api_key = secret_key
    return stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
        client_reference_id=metadata.get("order_id"),
    )


def create_checkout_session_plan2(
    *,
    secret_key: str,
    line_items: list[dict[str, Any]],
    success_url: str,
    cancel_url: str,
    metadata: dict[str, str],
    application_fee_amount: int,
    destination_account: str,
) -> stripe.checkout.Session:
    stripe.api_key = secret_key
    return stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
        client_reference_id=metadata.get("order_id"),
        payment_intent_data={
            "application_fee_amount": application_fee_amount,
            "transfer_data": {"destination": destination_account},
        },
    )


def construct_webhook_event(payload: bytes, sig_header: str | None, webhook_secret: str | None) -> dict:
    if webhook_secret and sig_header:
        return stripe.Webhook.construct_event(payload=payload, sig_header=sig_header, secret=webhook_secret)
    return json.loads(payload.decode("utf-8"))
