// Google Analytics 4 (gtag.js) — chargé dynamiquement, uniquement si
// l'utilisateur a donné son consentement "analytics" via le CookieBanner.
// On ne colle jamais la balise gtag telle quelle dans index.html : ça la
// ferait tourner pour tout le monde dès le chargement de la page, avant même
// que le bandeau de cookies ait pu recueillir un consentement — ce qui
// contredirait le texte du bandeau et la mention "nLPD conforme" du footer.

export const GA_MEASUREMENT_ID = 'G-SN6QY2GYZJ';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let loaded = false;

/** Injecte le script gtag.js et l'initialise. Idempotent : sans effet si déjà chargé. */
export const loadGoogleAnalytics = () => {
  if (loaded || typeof window === 'undefined') return;
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    loaded = true;
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
  // send_page_view: false — on envoie nous-mêmes les page_view à chaque
  // changement de route (voir trackPageView), car dans une SPA React Router
  // le gtag automatique ne se déclenche qu'une seule fois au premier chargement.

  loaded = true;
};

/** Coupe l'envoi de données GA (opt-out officiel Google), sans recharger la page. */
export const disableGoogleAnalytics = () => {
  if (typeof window === 'undefined') return;
  (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
};

/** À appeler à chaque changement de route (voir AnalyticsRouteTracker). */
export const trackPageView = (path: string) => {
  if (!loaded || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

/** Relit le consentement stocké et active GA si l'utilisateur avait déjà accepté. */
export const initAnalyticsFromStoredConsent = () => {
  if (typeof window === 'undefined') return;
  try {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) return;
    const parsed = JSON.parse(consent);
    if (parsed.analytics) {
      loadGoogleAnalytics();
    }
  } catch {
    // consentement illisible : on ne charge rien, le bandeau se réaffichera
  }
};
