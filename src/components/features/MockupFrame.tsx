import { ReactNode } from 'react';

/**
 * Cadre "fenêtre d'application" réutilisé par les pages de détail de
 * fonctionnalité (/fonctionnalites/*) pour habiller les aperçus visuels
 * du produit (mockups). Évite d'avoir à héberger de vraies captures
 * d'écran (qui se désynchronisent vite de l'UI réelle) tout en donnant
 * une image concrète du fonctionnement de chaque module.
 */
interface MockupFrameProps {
  children: ReactNode;
  label?: string;
}

export const MockupFrame = ({ children, label }: MockupFrameProps) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-card-hover overflow-hidden">
    <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
      {label && <span className="ml-3 text-xs text-gray-400 font-medium">{label}</span>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default MockupFrame;
