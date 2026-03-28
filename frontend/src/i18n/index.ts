import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const savedLanguage = localStorage.getItem("comercia_lang") ?? "es";

const resources = {
  es: {
    translation: {
      app: { title: "ComerCia", subtitle: "by REINPIA" },
      auth: {
        loginTitle: "ComerCia Admin",
        loginSubtitle: "Acceso al panel multitenant by REINPIA",
        email: "Email",
        password: "Contrasena",
        login: "Iniciar sesion",
        loading: "Ingresando...",
        goLanding: "Ver landing ComerCia"
      },
      nav: {
        dashboard: "Dashboard",
        tenants: "Tenants",
        plans: "Planes",
        payments: "Pagos",
        loyalty: "Fidelizacion",
        memberships: "Membresias",
        coupons: "Cupones",
        banners: "Banners",
        reviews: "Resenas",
        services: "Servicios",
        appointments: "Citas",
        distApps: "Solicitudes Dist.",
        distributors: "Distribuidores",
        contracts: "Contratos",
        recurring: "Recurrencia",
        logistics: "Logistica",
        categories: "Categorias",
        products: "Productos",
        currency: "Monedas",
        reports: "Reportes",
        reportSales: "Rep. Ventas",
        reportProducts: "Rep. Productos",
        reportLoyalty: "Rep. Fidelizacion",
        reportDistributors: "Rep. Distribuidores",
        reportLogistics: "Rep. Logistica",
        reportServices: "Rep. Servicios",
        reportMarketing: "Rep. Marketing",
        onboardingSales: "Onboarding Ventas",
        onboardingClient: "Onboarding Cliente",
        pos: "POS",
        automation: "Automatizacion"
      },
      common: {
        logout: "Cerrar sesion",
        loading: "Cargando..."
      }
    }
  },
  en: {
    translation: {
      app: { title: "ComerCia", subtitle: "by REINPIA" },
      auth: {
        loginTitle: "ComerCia Admin",
        loginSubtitle: "Multi-tenant admin access by REINPIA",
        email: "Email",
        password: "Password",
        login: "Sign in",
        loading: "Signing in...",
        goLanding: "View ComerCia landing"
      },
      nav: {
        dashboard: "Dashboard",
        tenants: "Tenants",
        plans: "Plans",
        payments: "Payments",
        loyalty: "Loyalty",
        memberships: "Memberships",
        coupons: "Coupons",
        banners: "Banners",
        reviews: "Reviews",
        services: "Services",
        appointments: "Appointments",
        distApps: "Dist. Apps",
        distributors: "Distributors",
        contracts: "Contracts",
        recurring: "Recurring",
        logistics: "Logistics",
        categories: "Categories",
        products: "Products",
        currency: "Currency",
        reports: "Reports",
        reportSales: "Rep. Sales",
        reportProducts: "Rep. Products",
        reportLoyalty: "Rep. Loyalty",
        reportDistributors: "Rep. Distributors",
        reportLogistics: "Rep. Logistics",
        reportServices: "Rep. Services",
        reportMarketing: "Rep. Marketing",
        onboardingSales: "Sales Onboarding",
        onboardingClient: "Client Onboarding",
        pos: "POS",
        automation: "Automation"
      },
      common: {
        logout: "Logout",
        loading: "Loading..."
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: "es",
  interpolation: { escapeValue: false }
});

export default i18n;
