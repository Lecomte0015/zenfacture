import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, Shield, FileText, Repeat,
  BarChart3, Mail, ChevronDown, ChevronUp, RefreshCw,
  Bell, Clock, Lock, Download, Users,
} from 'lucide-react';
import SEO from '../components/common/SEO';
import ChatAssistant from '../components/chat/ChatAssistant';

// ─── Aperçu d'une vraie facture ZenFacture ───────────────────────────────────

const InvoicePreview = () => (
  <div className="w-full max-w-lg mx-auto">
    {/* Barre d'action de l'app */}
    <div className="bg-gray-900 rounded-t-xl px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white text-xs font-semibold">ZenFacture</span>
        <span className="text-gray-500 text-xs">/ Facture F-2025-042</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-[11px] font-medium text-gray-300 bg-gray-800 px-3 py-1 rounded-md flex items-center gap-1.5">
          <Download className="w-3 h-3" /> PDF
        </button>
        <button className="text-[11px] font-medium text-white bg-blue-600 px-3 py-1 rounded-md flex items-center gap-1.5">
          <Mail className="w-3 h-3" /> Envoyer
        </button>
      </div>
    </div>

    {/* Facture simulée */}
    <div className="bg-white rounded-b-xl shadow-2xl border border-gray-200 border-t-0 overflow-hidden">
      <div className="px-8 pt-7 pb-4">

        {/* En-tête facture */}
        <div className="flex justify-between items-start mb-7">
          <div>
            <div className="font-black text-base text-gray-900 tracking-tight">Atelier Créatif Sàrl</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Rue du Lac 12 · 1006 Lausanne<br/>
              CHE-123.456.789 TVA
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-0.5">Facture</div>
            <div className="text-xs text-gray-500">N° F-2025-042</div>
            <div className="text-xs text-gray-500">Échéance : 21 mai 2025</div>
          </div>
        </div>

        {/* Destinataire */}
        <div className="bg-gray-50 rounded-lg p-3 mb-5 text-xs">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Facturé à</div>
          <div className="font-semibold text-gray-900">Müller & Associés SA</div>
          <div className="text-gray-500">Bahnhofstrasse 42 · 8001 Zürich</div>
        </div>

        {/* Lignes */}
        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-wider">
              <th className="text-left pb-1.5 font-semibold">Prestation</th>
              <th className="text-right pb-1.5 font-semibold">CHF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr>
              <td className="py-2 text-gray-700">Conception graphique — identité visuelle</td>
              <td className="text-right text-gray-800 font-medium">2 800.00</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-700">Révisions (3h × 120.–)</td>
              <td className="text-right text-gray-800 font-medium">360.00</td>
            </tr>
          </tbody>
        </table>

        {/* Totaux */}
        <div className="border-t border-gray-200 pt-2 space-y-1 text-xs mb-5">
          <div className="flex justify-between text-gray-500"><span>Sous-total HT</span><span>3 160.00</span></div>
          <div className="flex justify-between text-gray-500"><span>TVA 8.1%</span><span>256.00</span></div>
          <div className="flex justify-between font-black text-sm text-gray-900 pt-1.5 border-t border-gray-300 mt-1">
            <span>Total CHF</span><span>3 416.00</span>
          </div>
        </div>

        {/* Section QR-bill */}
        <div className="border-t-2 border-gray-800 pt-4">
          <div className="flex gap-4 items-start">
            {/* QR code */}
            <div className="w-20 h-20 border border-gray-300 rounded-sm p-1 flex-shrink-0 bg-white flex items-center justify-center">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-gray-900">
                <rect x="2" y="2" width="8" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="14" y="2" width="8" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="2" y="14" width="8" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="3.5" y="3.5" width="5" height="5" fill="currentColor" rx="0.3"/>
                <rect x="15.5" y="3.5" width="5" height="5" fill="currentColor" rx="0.3"/>
                <rect x="3.5" y="15.5" width="5" height="5" fill="currentColor" rx="0.3"/>
                <path d="M14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill="currentColor"/>
              </svg>
            </div>
            <div className="flex-1 text-[10px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="font-bold text-gray-800 mb-0.5">Compte / Payable à</div>
                  <div className="text-gray-600">Atelier Créatif Sàrl</div>
                  <div className="text-gray-600 font-mono">CH58 0076 1016 1185 3420 5</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800 mb-0.5">Montant</div>
                  <div className="text-xl font-black text-gray-900 leading-none">3 416.00</div>
                  <div className="text-gray-500 font-semibold">CHF</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 text-[9px] text-gray-400 uppercase tracking-wide">
                Conforme SIX Payment Services · Scannable depuis tous les e-bankings suisses
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Badge flottant */}
    <div className="mt-3 flex justify-center">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
        <CheckCircle className="w-3.5 h-3.5" />
        Généré automatiquement en 2 minutes · PDF prêt à envoyer
      </span>
    </div>
  </div>
);

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqItems = [
  {
    q: "La QR-facture est-elle vraiment conforme aux normes SIX/PostFinance ?",
    a: "Oui, à 100%. Les données sont générées selon les spécifications officielles SIX Payment Services. Le QR-code est scannable par tous les e-bankings suisses : PostFinance, UBS, Raiffeisen, BCV, ZKB, Migros Bank, etc.",
  },
  {
    q: "Puis-je migrer depuis Bexio ou un autre outil ?",
    a: "Oui. Vous pouvez importer vos clients et produits via CSV. Notre support vous accompagne si nécessaire.",
  },
  {
    q: "Mes données sont-elles hébergées en Suisse ?",
    a: "Oui. Toutes vos données sont stockées sur des serveurs en Suisse, conformément à la nLPD (nouvelle loi sur la protection des données).",
  },
  {
    q: "Que se passe-t-il à la fin des 30 jours gratuits ?",
    a: "Vous choisissez un abonnement ou vous arrêtez — sans engagement, sans pénalité. Vous pouvez exporter toutes vos données à tout moment au format PDF et CSV.",
  },
  {
    q: "Est-ce que ZenFacture gère la TVA suisse ?",
    a: "Oui. Les taux 8.1%, 2.6% et 3.8% sont pré-configurés. La TVA est calculée automatiquement sur chaque facture et un rapport est disponible pour votre fiduciaire.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2 max-w-3xl mx-auto">
      {faqItems.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.q}
            {open === i
              ? <ChevronUp className="w-4 h-4 text-blue-500 shrink-0 ml-4" />
              : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-4" />
            }
          </button>
          {open === i && (
            <div className="px-6 pb-5 pt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const HomePage = () => {
  return (
    <>
      <SEO />

      {/* ══ 1. ANNOUNCEMENT BAR ══════════════════════════════════════════════ */}
      <div className="bg-blue-600 text-white text-center text-sm py-2.5 px-4">
        Nouveau : envoi de factures par email avec PDF + QR-bill intégrés —
        <Link to="/fonctionnalites" className="underline font-semibold ml-1 hover:no-underline">
          Découvrir les fonctionnalités
        </Link>
      </div>

      {/* ══ 2. HERO — photo de fond ══════════════════════════════════════════ */}
      {/* Remplace /hero-bg.jpg par ta photo dans le dossier public/ */}
      <section className="relative min-h-[600px] lg:min-h-[660px] flex items-center overflow-hidden">
        {/* Photo de fond — dépose ton image dans public/hero-bg.jpg */}
        <img
          src="/hero-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Overlay sombre pour lisibilité du texte */}
        <div className="absolute inset-0 bg-gray-950/70" />

        {/* Contenu */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl">

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 bg-blue-900/40 border border-blue-700/40 rounded-full px-3 py-1.5 mb-7">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              Certifié SIX Payment Services · Swiss Made · nLPD
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5">
              La facturation suisse,<br /> enfin simple.
            </h1>

            <p className="text-lg text-gray-300 leading-relaxed mb-9 max-w-xl">
              Créez des factures professionnelles avec QR-bill conforme, envoyez-les par email et encaissez vos paiements — depuis une interface pensée pour les PME et indépendants suisses.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-7">
              <Link
                to="/auth/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg transition-all"
              >
                Commencer gratuitement — 30 jours
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/tarifs"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white border border-white/30 hover:border-white/60 hover:bg-white/10 rounded-lg transition-all"
              >
                Voir les tarifs
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
              {['Sans carte bancaire', 'Sans engagement', 'Annulation en 1 clic'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> {t}
                </span>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══ 3. TRUST BAR ═════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-200 py-7">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400 uppercase font-semibold tracking-widest mb-5">
            QR-bill scannable depuis tous les e-bankings suisses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14">
            {['PostFinance', 'UBS', 'Raiffeisen', 'BCV', 'ZKB', 'Migros Bank'].map(bank => (
              <span key={bank} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                {bank}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3b. APERÇU PRODUIT — facture réelle ═════════════════════════════ */}
      <section className="bg-slate-50 border-b border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Texte gauche */}
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Aperçu du logiciel</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                Votre première facture avec QR-bill en moins de 2 minutes
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-7">
                Renseignez votre client, ajoutez vos prestations et la TVA : ZenFacture génère instantanément un PDF professionnel avec le QR-bill intégré, prêt à envoyer par email.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'QR-bill conforme SIX, scannable par tous les e-bankings',
                  'PDF avec en-tête à votre image, IBAN et montant exacts',
                  'Envoi par email en un clic — historique conservé',
                  'TVA 8.1 %, 2.6 % et 3.8 % pré-configurés',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
              >
                Essayer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Facture droite */}
            <div>
              <InvoicePreview />
            </div>

          </div>
        </div>
      </section>

      {/* ══ 4. POURQUOI ZENFACTURE ═══════════════════════════════════════════ */}
      <section className="bg-white py-20 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Pourquoi ZenFacture</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Conçu pour les professionnels suisses</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-5 h-5 text-blue-600" />,
                title: "QR-bill conforme en quelques clics",
                desc: "Chaque facture génère automatiquement un QR-bill selon les normes SIX. Vos clients paient depuis leur e-banking sans saisie manuelle.",
              },
              {
                icon: <Bell className="w-5 h-5 text-blue-600" />,
                title: "Moins de factures en retard",
                desc: "Les relances s'envoient automatiquement à J+7, J+14 et J+30. Vous récupérez du temps et vos clients paient plus régulièrement.",
              },
              {
                icon: <Clock className="w-5 h-5 text-blue-600" />,
                title: "Opérationnel en cinq minutes",
                desc: "Inscription, IBAN, première facture envoyée. Aucune formation requise, aucun comptable nécessaire pour démarrer.",
              },
            ].map((b, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. FONCTIONNALITÉS — grille scannable ════════════════════════════ */}
      <section className="bg-slate-50 border-y border-gray-200 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Fonctionnalités</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Tout ce qu'il vous faut, rien de superflu</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: <FileText className="w-4 h-4 text-blue-600" />, title: "QR-bill automatique sur chaque PDF", desc: "Conforme SIX · Compatible tous e-bankings suisses" },
              { icon: <Mail className="w-4 h-4 text-blue-600" />, title: "Envoi par email en un clic", desc: "PDF + QR-bill joints automatiquement · Historique d'envoi" },
              { icon: <Bell className="w-4 h-4 text-blue-600" />, title: "Relances automatiques (J+7, J+14, J+30)", desc: "Emails configurables · Notification de paiement reçu" },
              { icon: <Repeat className="w-4 h-4 text-blue-600" />, title: "Factures récurrentes", desc: "Génération et envoi automatiques · Idéal pour abonnements" },
              { icon: <BarChart3 className="w-4 h-4 text-blue-600" />, title: "Tableau de bord financier", desc: "CA, TVA, factures en retard · Export fiduciaire" },
              { icon: <RefreshCw className="w-4 h-4 text-blue-600" />, title: "Import bancaire CAMT.053", desc: "Format suisse natif · Rapprochement automatique" },
              { icon: <Users className="w-4 h-4 text-blue-600" />, title: "Gestion des clients et produits", desc: "Catalogue, historique, devis convertibles en factures" },
              { icon: <Download className="w-4 h-4 text-blue-600" />, title: "Export et archivage nLPD", desc: "PDF, CSV · Hébergement suisse · Conforme nLPD" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{f.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. COMMENT ÇA MARCHE ════════════════════════════════════════════ */}
      <section className="bg-white py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Prise en main</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Opérationnel en cinq minutes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-px bg-gray-200" />
            {[
              { step: '1', title: 'Créez votre compte', desc: 'Inscription en 30 secondes. Ajoutez votre IBAN et votre logo. Aucune carte bancaire requise.' },
              { step: '2', title: 'Rédigez votre facture', desc: 'Sélectionnez votre client, ajoutez vos prestations et la TVA. Le QR-bill et le PDF sont générés instantanément.' },
              { step: '3', title: 'Envoyez et encaissez', desc: 'Envoyez par email en un clic. Votre client reçoit le PDF avec le QR-bill prêt à scanner.' },
            ].map((s, i) => (
              <div key={i} className="text-center relative">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-5 relative z-10 shadow-sm shadow-blue-600/30">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. TARIFS ════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 border-b border-gray-200 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Tarifs</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Transparent, sans surprise</h2>
            <p className="text-gray-500 mt-2 text-sm">30 jours gratuits · Sans carte bancaire · Sans engagement</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Essentiel',
                price: '19',
                desc: 'Indépendants & micro-entreprises',
                features: ['10 factures par mois', 'QR-bill automatique', 'Envoi par email', '1 utilisateur', 'Export PDF'],
                cta: 'Commencer',
                highlight: false,
              },
              {
                name: 'Professionnel',
                price: '49',
                desc: 'PME en croissance',
                features: ['Factures illimitées', 'Relances automatiques', 'Factures récurrentes', 'Import CAMT.053', 'Multi-devises', 'Devis et avoirs', 'Support prioritaire'],
                cta: 'Essai gratuit 30 jours',
                highlight: true,
              },
              {
                name: 'Entreprise',
                price: '99',
                desc: 'Multi-utilisateurs et équipes',
                features: ['Tout Professionnel', '5 utilisateurs inclus', 'API REST', 'Marque blanche', 'Intégration fiduciaire', 'Support dédié'],
                cta: 'Nous contacter',
                highlight: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-7 flex flex-col border ${
                  plan.highlight
                    ? 'bg-blue-600 border-blue-600 shadow-xl'
                    : 'bg-white border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                    Le plus choisi
                  </div>
                )}
                <div className="mb-5">
                  <h3 className={`text-base font-bold mb-0.5 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-xs mb-4 ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                    <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>CHF / mois</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-blue-50' : 'text-gray-600'}`}>
                      <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-green-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.name === 'Entreprise' ? '/aide' : '/auth/register'}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            Tous les prix sont en CHF HT · Paiement mensuel ou annuel (2 mois offerts)
          </p>
        </div>
      </section>

      {/* ══ 8. GARANTIES — réduction du risque ══════════════════════════════ */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Essayez sans risque</h2>
            <p className="text-gray-400 text-sm mt-2">Nous assumons l'entier du risque pour vous.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Clock className="w-5 h-5 text-blue-400" />, title: "30 jours gratuits", desc: "Sans carte bancaire. Aucun débit automatique." },
              { icon: <Lock className="w-5 h-5 text-blue-400" />, title: "Annulation en 1 clic", desc: "Sans frais, sans pénalité, à tout moment." },
              { icon: <Download className="w-5 h-5 text-blue-400" />, title: "Vos données restent vôtres", desc: "Export PDF et CSV à tout moment, sans restriction." },
              { icon: <Shield className="w-5 h-5 text-blue-400" />, title: "Données en Suisse", desc: "Hébergement suisse · nLPD conforme · ISO27001." },
            ].map((g, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-3">
                  {g.icon}
                </div>
                <p className="text-sm font-semibold text-white mb-1">{g.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 9. FAQ ══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Questions fréquentes</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Vous avez des questions ?</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ══ 10. CTA FINAL ════════════════════════════════════════════════════ */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-4">Swiss Made Software</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Prêt à simplifier votre facturation ?
          </h2>
          <p className="text-base text-blue-100 mb-8 max-w-lg mx-auto leading-relaxed">
            30 jours gratuits, sans carte bancaire. Votre première facture avec QR-bill en moins de cinq minutes.
          </p>
          <Link
            to="/auth/register"
            className="group inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-lg transition-all shadow-lg"
          >
            Commencer gratuitement
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-blue-200">
            {['Sans carte bancaire', 'Sans engagement', 'Support en français'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-300 shrink-0" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <ChatAssistant />
    </>
  );
};

export default HomePage;
