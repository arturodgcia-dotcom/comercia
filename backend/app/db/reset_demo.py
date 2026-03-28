from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.models.models import (
    Appointment,
    Banner,
    Base,
    BlockedEntity,
    Category,
    CommissionDetail,
    ContractTemplate,
    Coupon,
    CurrencySettings,
    Customer,
    CustomerLoyaltyAccount,
    Distributor,
    DistributorApplication,
    DistributorEmployee,
    DistributorProfile,
    ExchangeRate,
    InternalAlert,
    LogisticsEvent,
    LogisticsOrder,
    LoyaltyProgram,
    LoyaltyRule,
    MembershipPlan,
    MarketingInsight,
    Notification,
    Order,
    OrderItem,
    PlanPurchaseLead,
    PosEmployee,
    PosLocation,
    PosMembershipRegistration,
    PosSale,
    PosSaleItem,
    Product,
    ProductReview,
    RecurringOrderItem,
    RecurringOrderSchedule,
    ReportInsight,
    ReportRequest,
    RiskScore,
    SalesCommissionAgent,
    SecurityAlert,
    SecurityEvent,
    SecurityRule,
    SalesReferral,
    ServiceOffering,
    SignedContract,
    StorefrontConfig,
    StripeConfig,
    Subscription,
    Tenant,
    TenantBranding,
    User,
    WishlistItem,
    BotChannelConfig,
    BotMessageTemplate,
    AutomationEventLog,
)

DEMO_TENANT_SLUGS = {"reinpia", "natura-vida", "cafe-monte-alto", "demo-inactivo"}
DEMO_AGENT_CODE_PREFIX = "COD-DEMO-"
DEMO_AGENT_CODES = {"COD-REINPIA-1001", "COD-REINPIA-1002"}
DEMO_USER_EMAILS = {
    "admin@reinpia.demo",
    "admin@reinpia-tenant.demo",
    "admin@natura.demo",
    "admin@cafe.demo",
    "distributor1@natura.demo",
    "distributor2@cafe.demo",
}
DEMO_PLAN_LEAD_EMAILS = {"ceo@reinpia.demo", "ventas@reinpia.demo", "contacto@reinpia.demo"}


def reset_demo_data(db: Session) -> None:
    tenant_ids = list(
        db.scalars(select(Tenant.id).where(Tenant.slug.in_(DEMO_TENANT_SLUGS))).all()
    )
    order_ids = list(db.scalars(select(Order.id).where(Order.tenant_id.in_(tenant_ids))).all()) if tenant_ids else []
    recurring_ids = (
        list(db.scalars(select(RecurringOrderSchedule.id).where(RecurringOrderSchedule.tenant_id.in_(tenant_ids))).all())
        if tenant_ids
        else []
    )
    logistics_ids = (
        list(db.scalars(select(LogisticsOrder.id).where(LogisticsOrder.tenant_id.in_(tenant_ids))).all()) if tenant_ids else []
    )
    distributor_profile_ids = (
        list(db.scalars(select(DistributorProfile.id).where(DistributorProfile.tenant_id.in_(tenant_ids))).all()) if tenant_ids else []
    )
    customer_ids = list(db.scalars(select(Customer.id).where(Customer.tenant_id.in_(tenant_ids))).all()) if tenant_ids else []
    loyalty_program_ids = (
        list(db.scalars(select(LoyaltyProgram.id).where(LoyaltyProgram.tenant_id.in_(tenant_ids))).all()) if tenant_ids else []
    )
    service_ids = (
        list(db.scalars(select(ServiceOffering.id).where(ServiceOffering.tenant_id.in_(tenant_ids))).all()) if tenant_ids else []
    )
    product_ids = (
        list(db.scalars(select(Product.id).where(Product.tenant_id.in_(tenant_ids))).all()) if tenant_ids else []
    )
    contract_template_ids = (
        list(db.scalars(select(ContractTemplate.id).where(ContractTemplate.tenant_id.in_(tenant_ids))).all())
        if tenant_ids
        else []
    )

    if logistics_ids:
        db.execute(delete(LogisticsEvent).where(LogisticsEvent.logistics_order_id.in_(logistics_ids)))
    if recurring_ids:
        db.execute(delete(RecurringOrderItem).where(RecurringOrderItem.recurring_order_schedule_id.in_(recurring_ids)))
    if order_ids:
        db.execute(delete(OrderItem).where(OrderItem.order_id.in_(order_ids)))
        db.execute(delete(CommissionDetail).where(CommissionDetail.order_id.in_(order_ids)))
    if distributor_profile_ids:
        db.execute(delete(DistributorEmployee).where(DistributorEmployee.distributor_profile_id.in_(distributor_profile_ids)))
        db.execute(delete(SignedContract).where(SignedContract.distributor_profile_id.in_(distributor_profile_ids)))
    if customer_ids:
        db.execute(delete(CustomerLoyaltyAccount).where(CustomerLoyaltyAccount.customer_id.in_(customer_ids)))
        db.execute(delete(WishlistItem).where(WishlistItem.customer_id.in_(customer_ids)))
    if product_ids:
        db.execute(delete(ProductReview).where(ProductReview.product_id.in_(product_ids)))
    if service_ids:
        db.execute(delete(Appointment).where(Appointment.service_offering_id.in_(service_ids)))
    if contract_template_ids:
        db.execute(delete(SignedContract).where(SignedContract.contract_template_id.in_(contract_template_ids)))

    if tenant_ids:
        pos_location_ids = list(db.scalars(select(PosLocation.id).where(PosLocation.tenant_id.in_(tenant_ids))).all())
        pos_sale_ids = list(db.scalars(select(PosSale.id).where(PosSale.tenant_id.in_(tenant_ids))).all())
        if pos_sale_ids:
            db.execute(delete(PosSaleItem).where(PosSaleItem.pos_sale_id.in_(pos_sale_ids)))
        if pos_location_ids:
            db.execute(delete(PosEmployee).where(PosEmployee.pos_location_id.in_(pos_location_ids)))
            db.execute(delete(PosMembershipRegistration).where(PosMembershipRegistration.pos_location_id.in_(pos_location_ids)))
        db.execute(delete(PosSale).where(PosSale.tenant_id.in_(tenant_ids)))
        db.execute(delete(PosLocation).where(PosLocation.tenant_id.in_(tenant_ids)))
        db.execute(delete(CurrencySettings).where(CurrencySettings.tenant_id.in_(tenant_ids)))
        db.execute(delete(BotChannelConfig).where(BotChannelConfig.tenant_id.in_(tenant_ids)))
        db.execute(delete(BotMessageTemplate).where(BotMessageTemplate.tenant_id.in_(tenant_ids)))
        db.execute(delete(AutomationEventLog).where(AutomationEventLog.tenant_id.in_(tenant_ids)))
        db.execute(delete(Notification).where(Notification.tenant_id.in_(tenant_ids)))
        db.execute(delete(InternalAlert).where(InternalAlert.tenant_id.in_(tenant_ids)))
        db.execute(delete(SecurityAlert).where(SecurityAlert.tenant_id.in_(tenant_ids)))
        db.execute(delete(SecurityEvent).where(SecurityEvent.tenant_id.in_(tenant_ids)))
        db.execute(delete(RiskScore).where(RiskScore.tenant_id.in_(tenant_ids)))
        db.execute(delete(MarketingInsight).where(MarketingInsight.tenant_id.in_(tenant_ids)))
        db.execute(delete(ReportInsight).where(ReportInsight.tenant_id.in_(tenant_ids)))
        db.execute(delete(ReportRequest).where(ReportRequest.tenant_id.in_(tenant_ids)))
        db.execute(delete(SalesReferral).where(SalesReferral.tenant_id.in_(tenant_ids)))
        db.execute(delete(PlanPurchaseLead).where(PlanPurchaseLead.buyer_email.in_(DEMO_PLAN_LEAD_EMAILS)))
        db.execute(delete(LogisticsOrder).where(LogisticsOrder.tenant_id.in_(tenant_ids)))
        db.execute(delete(RecurringOrderSchedule).where(RecurringOrderSchedule.tenant_id.in_(tenant_ids)))
        db.execute(delete(Order).where(Order.tenant_id.in_(tenant_ids)))
        db.execute(delete(Distributor).where(Distributor.tenant_id.in_(tenant_ids)))
        db.execute(delete(DistributorProfile).where(DistributorProfile.tenant_id.in_(tenant_ids)))
        db.execute(delete(DistributorApplication).where(DistributorApplication.tenant_id.in_(tenant_ids)))
        db.execute(delete(Appointment).where(Appointment.tenant_id.in_(tenant_ids)))
        db.execute(delete(ServiceOffering).where(ServiceOffering.tenant_id.in_(tenant_ids)))
        db.execute(delete(ProductReview).where(ProductReview.tenant_id.in_(tenant_ids)))
        db.execute(delete(WishlistItem).where(WishlistItem.tenant_id.in_(tenant_ids)))
        db.execute(delete(Product).where(Product.tenant_id.in_(tenant_ids)))
        db.execute(delete(Category).where(Category.tenant_id.in_(tenant_ids)))
        db.execute(delete(Coupon).where(Coupon.tenant_id.in_(tenant_ids)))
        db.execute(delete(MembershipPlan).where(MembershipPlan.tenant_id.in_(tenant_ids)))
        db.execute(delete(LoyaltyRule).where(LoyaltyRule.tenant_id.in_(tenant_ids)))
        db.execute(delete(LoyaltyProgram).where(LoyaltyProgram.tenant_id.in_(tenant_ids)))
        db.execute(delete(Customer).where(Customer.tenant_id.in_(tenant_ids)))
        db.execute(delete(Subscription).where(Subscription.tenant_id.in_(tenant_ids)))
        db.execute(delete(Banner).where(Banner.tenant_id.in_(tenant_ids)))
        db.execute(delete(StripeConfig).where(StripeConfig.tenant_id.in_(tenant_ids)))
        db.execute(delete(TenantBranding).where(TenantBranding.tenant_id.in_(tenant_ids)))
        db.execute(delete(StorefrontConfig).where(StorefrontConfig.tenant_id.in_(tenant_ids)))
        db.execute(delete(ContractTemplate).where(ContractTemplate.tenant_id.in_(tenant_ids)))
        db.execute(delete(Tenant).where(Tenant.id.in_(tenant_ids)))

    db.execute(delete(User).where(User.email.in_(DEMO_USER_EMAILS)))
    db.execute(delete(SalesReferral).where(SalesReferral.referral_code_entered.like(f"{DEMO_AGENT_CODE_PREFIX}%")))
    db.execute(delete(InternalAlert).where(InternalAlert.commission_agent_id.in_(select(SalesCommissionAgent.id).where(SalesCommissionAgent.code.in_(DEMO_AGENT_CODES)))))
    db.execute(delete(SalesCommissionAgent).where(SalesCommissionAgent.code.in_(DEMO_AGENT_CODES) | SalesCommissionAgent.code.like(f"{DEMO_AGENT_CODE_PREFIX}%")))
    db.execute(delete(SecurityAlert))
    db.execute(delete(SecurityEvent))
    db.execute(delete(RiskScore))
    db.execute(delete(SecurityRule))
    db.execute(delete(BlockedEntity))
    db.execute(delete(MarketingInsight))
    db.execute(delete(ReportInsight))
    db.execute(delete(ReportRequest))
    db.execute(delete(ExchangeRate).where(ExchangeRate.source_name.in_(["demo_manual", "local_fallback"])))

    db.commit()


def run() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        reset_demo_data(db)


if __name__ == "__main__":
    run()
