import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getAnnouncementBanner } from '@/services/platformSettingsService';

const DISMISS_KEY_PREFIX = 'zenfacture_banner_dismissed_';

/**
 * Bannière d'annonce configurable depuis le back-office (AdminSettingsPage →
 * "Bannière d'annonce"). Lecture via la fonction publique
 * public.get_announcement_banner() (voir platformSettingsService.ts), donc
 * visible même pour un visiteur non connecté sur le site public.
 *
 * Le rejet ("X") est mémorisé par texte de bannière (sessionStorage) : si
 * l'admin change le texte, la bannière réapparaît même pour quelqu'un qui
 * avait fermé la précédente.
 */
const AnnouncementBanner: React.FC = () => {
  const [banner, setBanner] = useState<{
    text: string;
    imageUrl: string | null;
    linkUrl: string | null;
    linkLabel: string | null;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getAnnouncementBanner();
      if (!data || !data.banner_enabled || !data.banner_text) return;

      const dismissKey = `${DISMISS_KEY_PREFIX}${data.banner_text}`;
      if (sessionStorage.getItem(dismissKey)) {
        setDismissed(true);
        return;
      }

      setBanner({
        text: data.banner_text,
        imageUrl: data.banner_image_url,
        linkUrl: data.banner_link_url,
        linkLabel: data.banner_link_label,
      });
    })();
  }, []);

  const handleDismiss = () => {
    if (banner) {
      sessionStorage.setItem(`${DISMISS_KEY_PREFIX}${banner.text}`, '1');
    }
    setDismissed(true);
  };

  if (!banner || dismissed) return null;

  return (
    <div
      className="relative w-full text-white"
      style={{
        backgroundColor: '#1D4ED8',
        ...(banner.imageUrl
          ? {
              backgroundImage: `linear-gradient(90deg, rgba(29,78,216,0.92), rgba(29,78,216,0.75)), url(${banner.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}),
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-3 text-sm">
        <span className="text-center">{banner.text}</span>
        {banner.linkUrl && (
          <a
            href={banner.linkUrl}
            className="font-semibold underline underline-offset-2 whitespace-nowrap hover:text-blue-100"
          >
            {banner.linkLabel || 'En savoir plus'}
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fermer la bannière"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
