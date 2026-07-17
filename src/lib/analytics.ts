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

// DIAGNOSTIC TEMPORAIRE — logs visibles dans la Console pour tracer
// précisément où le chargement de GA4 s'arrête. À retirer une fois le bug
// trouvé (voir tâche "Retirer les logs diagnostic GA4").
const dlog = (...args: unknown[]) => console.log('[GA4 debug]', ...args);

/** Injecte le script gtag.js et l'initialise. Idempotent : sans effet si déjà chargé. */
export const loadGoogleAnalytics = () => {
  dlog('loadGoogleAnalytics() appelé. loaded =', loaded);
  if (loaded || typeof window === 'undefined') {
    dlog('sortie anticipée : déjà chargé ou pas de window');
    return;
  }
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    dlog('script déjà présent dans le DOM, on marque loaded=true sans réinitialiser');
    loaded = true;
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  dlog('balise <script> ajoutée au head, src =', script.src);

  window.dataLayer = window.dataLayer || [];
  // Reproduit EXACTEMENT le motif officiel de Google (dataLayer.push(arguments),
  // pas un tableau construit via spread) — gtag.js interne peut être sensible
  // à la forme exacte de ce qui est poussé dans dataLayer.
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    dlog('gtag() appelé avec', arguments);
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments as unknown as unknown[]);
  };

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
  // Note diagnostic : send_page_view désormais laissé à sa valeur par défaut
  // (true) le temps du test, pour se rapprocher au maximum de la balise
  // brute qui, elle, a fonctionné — on réintroduira le tracking manuel de
  // route une fois la cause du blocage confirmée.

  loaded = true;
  dlog('loadGoogleAnalytics() terminé, loaded =', loaded, ', dataLayer =', window.dataLayer);
};

/** Coupe l'envoi de données GA (opt-out officiel Google), sans recharger la page. */
export const disableGoogleAnalytics = () => {
  if (typeof window === 'undefined') return;
  (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  if (window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
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
    dlog('initAnalyticsFromStoredConsent() — cookieConsent brut =', consent);
    if (!consent) return;
    const parsed = JSON.parse(consent);
    dlog('consentement parsé =', parsed);
    if (parsed.analytics) {
      dlog('analytics=true dans le consentement stocké, appel de loadGoogleAnalytics()');
      loadGoogleAnalytics();
    } else {
      dlog('analytics=false ou absent dans le consentement stocké, on ne charge rien');
    }
  } catch (e) {
    dlog('erreur de lecture du consentement stocké', e);
  }
};
