import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa';

export const InstallPrompt: React.FC = () => {
  const { isInstallable, promptInstall, dismissInstall } = usePwa();
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };

    checkMobile();

    // Delay showing the banner for smooth animation
    if (isInstallable) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    await promptInstall();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      dismissInstall();
    }, 300);
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {isMobile ? (
                  <Smartphone className="h-6 w-6 text-white" />
                ) : (
                  <Monitor className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-white truncate">
                  Installez ZenFacture sur votre appareil pour un accès rapide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Installer</span>
              </button>

              <button
                onClick={handleDismiss}
                className="inline-flex items-center gap-2 px-3 py-2 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors duration-200"
                aria-label="Fermer"
              >
                <span className="hidden sm:inline">Plus tard</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
