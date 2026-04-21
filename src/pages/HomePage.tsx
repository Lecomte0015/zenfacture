import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, Shield, FileText, Repeat,
  BarChart3, Mail, ChevronDown, ChevronUp,
  RefreshCw, Bell, Clock,
} from 'lucide-react';
import SEO from '../components/common/SEO';
import ChatAssistant from '../components/chat/ChatAssistant';

// ─── Mock Dashboard Preview ───────────────────────────────────────────────────

const DashboardPreview = () => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 w-full max-w-lg">
    {/* Top bar */}
    <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-red-400" />
      <div className="w-3 h-3 rounded-full bg-yellow-400" />
      <div className="w-3 h-3 rounded-full bg-green-400" />
      <span className="ml-3 text-xs text-gray-400 font-mono">app.zenfacture.ch/dashboard</span>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
      {[
        { label: 'Facturé', value: '24 850', color: 'text-blue-600', sub: 'ce mois' },
        { label: 'Payé', value: '18 200', color: 'text-green-600', sub: '73%' },
        { label: 'En attente', value: '6 650', color: 'text-orange-500', sub: '3 factures' },
      ].map((s, i) => (
        <div key={i} className={`px-4 py-3 ${i < 2 ? 'border-r border-gray-100' : ''}`}>
          <p className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">{s.label}</p>
          <p className={`text-base font-bold ${s.color}`}>{s.value} <span className="text-xs font-normal text-gray-400">CHF</span></p>
          <p className="text-[10px] text-gray-400">{s.sub}</p>
        </div>
      ))}
    </div>

    {/* Invoice list */}
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">Dernières factures</span>
        <span className="text-[10px] text-blue-500 font-medium cursor-pointer hover:underline">Voir tout</span>
      </div>
      {[
        { num: 'F-2024-042', client: 'Müller SA',        amount: '4 800.00', status: 'payé',      date: '15 mars' },
        { num: 'F-2024-041', client: 'Atelier Vaud',     amount: '1 250.00', status: 'envoyée',   date: '12 mars' },
        { num: 'F-2024-040', client: 'TechStartup GmbH', amount: '3 600.00', status: 'en retard', date: '1 mars' },
        { num: 'F-2024-039', client: 'Studio Genève',    amount: '890.00',   status: 'payé',      date: '28 fév' },
      ].map((inv, i) => (
        <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              inv.status === 'payé' ? 'bg-green-500' :
              inv.status === 'en retard' ? 'bg-red-500' : 'bg-orange-400'
            }`} />
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">{inv.client}</p>
              <p className="text-[10px] text-gray-400">{inv.num}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">{inv.amount} <span className="font-normal text-gray-400">CHF</span></p>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
              inv.status === 'payé'      ? 'bg-green-100 text-green-700' :
              inv.status === 'en retard' ? 'bg-red-100 text-red-700' :
                                           'bg-orange-100 text-orange-700'
            }`}>{inv.status}</span>
          </div>
        </div>
      ))}
    </div>

    {/* QR bill */}
    <div className="mx-4 mb-4 rounded-xl bg-blue-50 border border-blue-100 p-3 flex items-center gap-3">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-blue-600">
          <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="14" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="2" y="14" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="4" height="4" fill="currentColor" rx="0.5"/>
          <rect x="16" y="4" width="4" height="4" fill="currentColor" rx="0.5"/>
          <rect x="4" y="16" width="4" height="4" fill="currentColor" rx="0.5"/>
          <path d="M14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill="currentColor"/>
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-blue-800">QR-Facture suisse générée</p>
        <p className="text-[10px] text-blue-600">Conforme SIX · Scannez depuis votre e-banking</p>
      </div>
      <div className="ml-auto shrink-0">
        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Valide</span>
      </div>
    </div>
  </div>
);

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqItems = [
  {
    q: "La QR-facture est-elle vraiment conforme aux normes SIX/PostFinance ?",
    a: "Oui, à 100%. Nous générons les données selon les spécifications officielles SIX Payment Services. Votre QR-code est scannable par tous les e-bankings suisses : PostFinance, UBS, Raiffeisen, BCV, ZKB, etc.",
  },
  {
    q: "Puis-je migrer depuis Bexio ou Debitoor ?",
    a: "Absolument. Vous pouvez importer vos clients et produits via CSV, ou contacter notre support pour une migration assistée.",
  },
  {
    q: "Mes données sont-elles hébergées en Suisse ?",
    a: "Oui, toutes vos données sont stockées sur des serveurs en Suisse, conformément à la nouvelle loi sur la protection des données (nLPD).",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Aucun. Vous payez mois par mois et résiliez quand vous voulez. Pas de frais cachés, pas de pénalité de résiliation.",
  },
  {
    q: "Est-ce que ZenFacture gère la TVA suisse ?",
    a: "Oui. Les taux suisses (8.1%, 2.6%, 3.8%) sont pré-configurés. La TVA est calculée automatiquement sur chaque facture et un rapport TVA est disponible pour votre fiduciaire.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2 max-w-3xl mx-auto">
      {faqItems.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
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
            <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Témoignages ─────────────────────────────────────────────────────────────

const testimonials = [
  {
    quote: "Le QR-bill s'affiche directement sur le PDF. Mes clients scannent depuis leur PostFinance et c'est réglé dans la journée. Fini les virements manuels.",
    name: "Sophie Maillard",
    role: "Graphiste indépendante",
    location: "Lausanne, VD",
    initials: "SM",
  },
  {
    quote: "J'avais essayé un autre outil mais c'était beaucoup trop complexe. ZenFacture fait ce qu'il faut, simplement. J'ai créé ma première facture en moins de cinq minutes.",
    name: "Thomas Reinholt",
    role: "Consultant indépendant",
    location: "Berne, BE",
    initials: "TR",
  },
  {
    quote: "Les relances automatiques m'ont enlevé une épine du pied. Je n'avais pas le courage de relancer mes clients moi-même. Maintenant ça se fait tout seul.",
    name: "Marie-Claire Dubois",
    role: "Architecte d'intérieur",
    location: "Genève, GE",
    initials: "MD",
  },
];

// ─── Page principale ──────────────────────────────────────────────────────────

const HomePage = () => {
  return (
    <>
      <SEO />

      {/* ══ 1. ANNOUNCEMENT BAR ══════════════════════════════════════════════ */}
      <div className="bg-blue-600 text-white text-center text-sm py-2.5 px-4">
        Nouveau : envoi de factures par email avec PDF + QR-bill intégrés —
        <Link to="/features" className="underline font-semibold ml-1 hover:no-underline">
          Découvrir les fonctionnalités
        </Link>
      </div>

      {/* ══ 2. HERO ══════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 mb-7">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                Certifié SIX Payment Services · Swiss Made · nLPD
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-5">
                La facturation suisse,<br className="hidden sm:block" /> enfin simple.
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
                Créez des factures avec QR-bill conforme, envoyez-les par email et encaissez vos paiements — depuis une interface pensée pour les PME et indépendants suisses.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  to="/auth/register"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center px-7 py-3.5 text-base font-medium text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Voir les tarifs
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                {['30 jours gratuits · sans carte', 'Sans engagement', 'Support en français'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Dashboard */}
            <div className="flex justify-center lg:justify-end">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. TRUST BAR ═════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-b border-gray-200 py-7">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400 uppercase font-semibold tracking-widest mb-5">
            QR-bill scannable depuis tous les e-bankings suisses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14">
            {['PostFinance', 'UBS', 'Raiffeisen', 'BCV', 'ZKB', 'Migros Bank'].map(bank => (
              <span key={bank} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors tracking-tight">
                {bank}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. TÉMOIGNAGES — juste après le hero ════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Ils facturent avec ZenFacture</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ce qu'en disent nos clients</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl p-7 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col">
                <p className="text-gray-700 text-sm leading-relaxed mb-6 flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. BÉNÉFICES CLÉS ════════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-200 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Pourquoi ZenFacture</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Conçu pour les professionnels suisses</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-6 h-6 text-blue-600" />,
                title: "QR-bill conforme en quelques clics",
                desc: "Chaque facture génère automatiquement un QR-bill conforme aux normes SIX. Vos clients paient depuis leur e-banking sans saisie manuelle.",
              },
              {
                icon: <Bell className="w-6 h-6 text-blue-600" />,
                title: "Moins de factures en retard",
                desc: "Les relances par email s'envoient automatiquement à J+7, J+14 et J+30. Vous récupérez du temps et vos clients paient plus régulièrement.",
              },
              {
                icon: <Clock className="w-6 h-6 text-blue-600" />,
                title: "Opérationnel en moins de cinq minutes",
                desc: "Inscription, configuration de votre IBAN, première facture envoyée. Aucune formation requise, aucun comptable nécessaire.",
              },
            ].map((b, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. COMMENT CA MARCHE ════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Prise en main</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Opérationnel en cinq minutes</h2>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-11 left-[16.67%] right-[16.67%] h-px bg-gray-200" />
            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: '1',
                  title: 'Créez votre compte',
                  desc: 'Inscription en 30 secondes. Configurez votre entreprise, votre IBAN et votre logo.',
                },
                {
                  step: '2',
                  title: 'Rédigez votre facture',
                  desc: 'Ajoutez votre client, vos prestations et la TVA. Le QR-bill et le PDF sont générés instantanément.',
                },
                {
                  step: '3',
                  title: 'Envoyez et encaissez',
                  desc: 'Envoyez par email en un clic. Votre client reçoit le PDF avec le QR-bill prêt à scanner.',
                },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-5 relative z-10">
                    {s.step}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. FONCTIONNALITÉS — linéaire, pas de bento ═════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-200 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Fonctionnalités</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Tout ce qu'il vous faut, rien de superflu</h2>
          </div>

          <div className="space-y-14">
            {[
              {
                icon: <FileText className="w-5 h-5 text-blue-600" />,
                title: "QR-facture conforme SIX — incluse sur chaque PDF",
                desc: "Le QR-bill est généré automatiquement selon les spécifications officielles SIX Payment Services. Vos clients paient en scannant le code depuis leur e-banking suisse, sans saisie d'IBAN ni de montant. Compatible PostFinance, UBS, Raiffeisen, BCV, ZKB et Migros Bank.",
                tags: ['SIX certifié', 'Tous e-bankings', 'PDF automatique'],
              },
              {
                icon: <Bell className="w-5 h-5 text-blue-600" />,
                title: "Relances automatiques — plus de factures oubliées",
                desc: "Configurez trois niveaux de relance par email (J+7, J+14, J+30). Les emails partent automatiquement sans que vous ayez à intervenir. Vous êtes notifié dès qu'un paiement est reçu.",
                tags: ['Emails automatiques', '3 niveaux', 'Notifications'],
              },
              {
                icon: <Repeat className="w-5 h-5 text-blue-600" />,
                title: "Factures récurrentes — gagnez des heures chaque mois",
                desc: "Pour vos abonnements mensuels, trimestriels ou annuels : configurez une fois, ZenFacture génère et envoie automatiquement. Idéal pour les prestataires de services à tarif fixe.",
                tags: ['Mensuel · Trimestriel', 'Envoi automatique', 'Gestion abonnements'],
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
                title: "Tableau de bord financier — vue d'ensemble en temps réel",
                desc: "Montant facturé, encaissé, en retard. TVA collectée par période. Export des données pour votre fiduciaire. Toutes vos finances en un coup d'oeil.",
                tags: ['Chiffre d\'affaires', 'TVA', 'Export fiduciaire'],
              },
              {
                icon: <Mail className="w-5 h-5 text-blue-600" />,
                title: "Envoi par email — PDF et QR-bill en pièce jointe",
                desc: "Envoyez vos factures directement depuis ZenFacture. Le PDF avec QR-bill est joint automatiquement. Votre client reçoit tout ce dont il a besoin pour payer.",
                tags: ['PDF automatique', 'QR-bill joint', 'Historique envois'],
              },
              {
                icon: <RefreshCw className="w-5 h-5 text-blue-600" />,
                title: "Import bancaire CAMT.053 — réconciliation sans saisie",
                desc: "Importez votre relevé bancaire au format CAMT.053 (standard suisse) et réconciliez automatiquement vos paiements. Zéro saisie manuelle.",
                tags: ['Format suisse natif', 'CAMT.053', 'Rapprochement auto'],
              },
            ].map((f, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-6 pb-14 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{f.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {f.tags.map(tag => (
                      <span key={tag} className="text-[11px] font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. TARIFS ════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20">
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
                features: [
                  '10 factures par mois',
                  'QR-bill automatique',
                  'Envoi par email',
                  '1 utilisateur',
                  'Export PDF',
                ],
                cta: 'Commencer',
                highlight: false,
              },
              {
                name: 'Professionnel',
                price: '49',
                desc: 'PME en croissance',
                features: [
                  'Factures illimitées',
                  'Relances automatiques',
                  'Factures récurrentes',
                  'Import CAMT.053',
                  'Multi-devises',
                  'Devis et avoirs',
                  'Support prioritaire',
                ],
                cta: 'Essai gratuit 30 jours',
                highlight: true,
              },
              {
                name: 'Entreprise',
                price: '99',
                desc: 'Multi-utilisateurs et équipes',
                features: [
                  'Tout Professionnel',
                  '5 utilisateurs inclus',
                  'API REST',
                  'Marque blanche',
                  'Intégration fiduciaire',
                  'Support dédié',
                ],
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
                  to={plan.name === 'Entreprise' ? '/help' : '/auth/register'}
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

      {/* ══ 9. FAQ ══════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-200 py-20">
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-4">Swiss Made Software</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Prêt à simplifier votre facturation ?
          </h2>
          <p className="text-base text-blue-100 mb-8 max-w-xl mx-auto leading-relaxed">
            Rejoignez les indépendants et PME suisses qui ont gagné du temps sur leur administratif grâce à ZenFacture.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-lg transition-all"
            >
              Commencer gratuitement — 30 jours
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all"
            >
              Voir les tarifs
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-blue-200">
            {['Sans carte bancaire', 'Sans engagement', 'Données hébergées en Suisse', 'Support en français'].map(t => (
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
