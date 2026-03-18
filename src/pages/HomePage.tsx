import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, Zap, Shield, Globe,
  FileText, Users, Repeat, BarChart3, Mail,
  Clock, TrendingUp, Star, ChevronDown, ChevronUp,
  CreditCard, RefreshCw, Bell, Download
} from 'lucide-react';
import SEO from '../components/common/SEO';
import ChatAssistant from '../components/chat/ChatAssistant';

// ─── Mock Dashboard Preview ───────────────────────────────────────────────────

const DashboardPreview = () => (
  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 w-full max-w-lg">
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
        <span className="text-[10px] text-blue-500 font-medium cursor-pointer hover:underline">Voir tout →</span>
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

    {/* QR bill preview */}
    <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 flex items-center gap-3">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
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
        <p className="text-[10px] text-blue-600">Conforme SIX · Scannez avec votre e-banking</p>
      </div>
      <div className="ml-auto">
        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Valide</span>
      </div>
    </div>
  </div>
);

// ─── Section helpers ──────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
    {children}
  </span>
);

const faqItems = [
  { q: "La QR-facture est-elle vraiment conforme aux normes SIX/PostFinance ?", a: "Oui, à 100%. Nous générons les données selon les spécifications officielles SIX Payment Services. Votre QR-code est scannable par tous les e-bankings suisses (PostFinance, UBS, Raiffeisen, ZKB, etc.)." },
  { q: "Puis-je migrer depuis Bexio ou Debitoor ?", a: "Absolument. Vous pouvez importer vos clients et produits via CSV, ou contacter notre support pour une migration assistée." },
  { q: "TWINT fonctionne-t-il vraiment depuis la facture ?", a: "Oui, ZenFacture génère un lien TWINT natif directement sur la facture PDF et dans l'aperçu. Le client clique et paye depuis son app TWINT. Unique en Suisse romande." },
  { q: "Mes données sont-elles hébergées en Suisse ?", a: "Oui, toutes vos données sont stockées sur des serveurs en Suisse, conformément à la nouvelle loi sur la protection des données (nLPD)." },
  { q: "Y a-t-il un engagement de durée ?", a: "Aucun. Vous payez mois par mois et résiliez quand vous voulez. Pas de frais cachés, pas de pénalité de résiliation." },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
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

// ─── Page principale ──────────────────────────────────────────────────────────

const HomePage = () => {
  return (
    <>
      <SEO />

      {/* ══ 1. ANNOUNCEMENT BAR ══════════════════════════════════════════════ */}
      <div className="bg-blue-600 text-white text-center text-sm py-2.5 px-4 font-medium">
        🇨🇭 &nbsp;Nouveau : envoi de factures par email avec PDF + QR-bill intégrés &nbsp;—&nbsp;
        <Link to="/register" className="underline hover:no-underline font-bold">Essayez gratuitement →</Link>
      </div>

      {/* ══ 2. HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative bg-gray-950 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/50 rounded-full px-4 py-2 mb-6">
                <Star className="w-3.5 h-3.5 fill-blue-400" />
                Solution #1 de facturation QR pour PME suisses
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6">
                Facturez&nbsp;<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  en 2 minutes.
                </span>
                <br/>Soyez payé plus vite.
              </h1>

              <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                QR-facture conforme SIX, paiement TWINT, envoi par email, relances automatiques.
                Tout ce dont une PME suisse a besoin.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:shadow-blue-500/40 hover:scale-[1.02]"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  Voir les fonctionnalités
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-gray-500">
                {['30 jours gratuits', 'Sans carte bancaire', 'Sans engagement', 'Support inclus'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Dashboard mock */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <DashboardPreview />
                {/* Floating badges */}
                <div className="absolute -top-4 -left-6 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce">
                  ✓ QR-Bill SIX
                </div>
                <div className="absolute -bottom-4 -right-6 bg-purple-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5">
                  ⚡ TWINT ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. SOCIAL PROOF BAR ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400 uppercase font-semibold tracking-widest mb-6">
            Compatible avec tous les e-bankings suisses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            {[
              { name: 'PostFinance', color: 'text-yellow-600' },
              { name: 'UBS', color: 'text-red-600' },
              { name: 'Raiffeisen', color: 'text-yellow-700' },
              { name: 'Credit Suisse', color: 'text-blue-800' },
              { name: 'ZKB', color: 'text-blue-700' },
              { name: 'BEKB', color: 'text-red-700' },
            ].map(bank => (
              <span key={bank.name} className={`text-sm font-bold ${bank.color} opacity-70 hover:opacity-100 transition-opacity`}>
                {bank.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. STATS ═════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { val: '2 min', label: 'pour créer une facture',     icon: <Zap className="w-5 h-5" />,        color: 'text-blue-600 bg-blue-50' },
              { val: '100%', label: 'conforme normes SIX/PostFin', icon: <Shield className="w-5 h-5" />,      color: 'text-green-600 bg-green-50' },
              { val: '3×',   label: 'moins de factures en retard', icon: <TrendingUp className="w-5 h-5" />,  color: 'text-purple-600 bg-purple-50' },
              { val: '19 CHF', label: 'seulement par mois',        icon: <CreditCard className="w-5 h-5" />, color: 'text-orange-600 bg-orange-50' },
            ].map((s, i) => (
              <div key={i} className="text-center p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
                  {s.icon}
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{s.val}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. AVANT / APRÈS ═════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>Pourquoi ZenFacture</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              La facturation, enfin simple
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Sans */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-red-700 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center text-xs">✗</span>
                Sans ZenFacture
              </h3>
              <ul className="space-y-3">
                {[
                  'Word/Excel pour vos factures, erreurs fréquentes',
                  'QR-bill généré manuellement ou absent',
                  'Clients qui paient en retard, pas de relances',
                  'Pas d\'envoi par email intégré',
                  'TVA calculée à la main',
                  'Archivage désorganisé sur votre disque',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-red-800">
                    <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Avec */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-green-700 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center text-xs">✓</span>
                Avec ZenFacture
              </h3>
              <ul className="space-y-3">
                {[
                  'Facture professionnelle en 2 minutes chrono',
                  'QR-bill SIX automatique sur chaque PDF',
                  'Relances automatiques par email (1, 2, 3)',
                  'Envoi direct par email avec pièce jointe PDF',
                  'TVA 8.1%, 2.6%, 3.8% calculée automatiquement',
                  'Archivage cloud sécurisé, exportable',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 6. COMMENT ÇA MARCHE ════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionLabel>Comment ça marche</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Opérationnel en 5 minutes
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: '01',
                  icon: <Users className="w-6 h-6 text-blue-600" />,
                  title: 'Créez votre compte',
                  desc: 'Inscription en 30 secondes. Pas de carte bancaire requise. Configurez votre entreprise et votre IBAN.',
                },
                {
                  step: '02',
                  icon: <FileText className="w-6 h-6 text-blue-600" />,
                  title: 'Créez votre facture',
                  desc: 'Ajoutez votre client, vos lignes, la TVA. Le QR-bill suisse et le PDF sont générés instantanément.',
                },
                {
                  step: '03',
                  icon: <Mail className="w-6 h-6 text-blue-600" />,
                  title: 'Envoyez & soyez payé',
                  desc: 'Envoyez par email en un clic. Le client paye par QR-bill ou TWINT. Vous êtes notifié.',
                },
              ].map((s, i) => (
                <div key={i} className="relative text-center">
                  <div className="w-24 h-24 rounded-2xl bg-blue-50 border-2 border-blue-100 flex flex-col items-center justify-center mx-auto mb-5 relative z-10 bg-white">
                    <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase mb-1">{s.step}</span>
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. FEATURES BENTO ═══════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionLabel>Fonctionnalités</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Tout ce qu'il vous faut, rien de plus
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Grande carte QR-bill */}
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute right-6 top-6 opacity-10">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="white">
                  <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/>
                  <rect x="2" y="14" width="8" height="8" rx="1"/><rect x="4" y="4" width="4" height="4" rx="0.5"/>
                  <rect x="16" y="4" width="4" height="4" rx="0.5"/><rect x="4" y="16" width="4" height="4" rx="0.5"/>
                  <path d="M14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>
                </svg>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">QR-Facture suisse + TWINT</h3>
              <p className="text-blue-100 text-sm leading-relaxed max-w-sm">
                Le QR-bill conforme SIX est généré automatiquement sur chaque PDF. Vos clients paient d'un scan depuis leur e-banking ou avec TWINT — une exclusivité en Suisse romande.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['SIX certifié', 'PostFinance', 'TWINT natif', 'Tous e-bankings'].map(tag => (
                  <span key={tag} className="text-[11px] font-semibold bg-white/15 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:border-purple-100 transition-all group">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Envoi par email</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Envoyez vos factures en un clic. PDF + QR-bill joint automatiquement. Votre client reçoit tout ce dont il a besoin pour payer.
              </p>
            </div>

            {/* Relances */}
            <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:border-orange-100 transition-all group">
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Relances automatiques</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                3 niveaux de relance configurables. Emails envoyés automatiquement à J+7, J+14, J+30. Plus jamais de facture oubliée.
              </p>
            </div>

            {/* Récurrentes */}
            <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:border-green-100 transition-all group">
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Repeat className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Factures récurrentes</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Vos abonnements mensuels ou trimestriels se génèrent seuls. Gagnez des heures chaque mois sur vos tâches répétitives.
              </p>
            </div>

            {/* Multi-devises */}
            <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Multi-devises</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Facturez en CHF, EUR, USD. Taux de change automatiques. Idéal pour les PME avec des clients à l'international.
              </p>
            </div>

            {/* Dashboard */}
            <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:border-indigo-100 transition-all group">
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Dashboard financier</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Vue d'ensemble de vos encaissements, TVA collectée, factures en retard. Exportez vos données pour votre fiduciaire.
              </p>
            </div>

            {/* Devis */}
            <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:border-teal-100 transition-all group">
              <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
                <Download className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Devis & Avoirs</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Convertissez un devis en facture en un clic. Émettez des notes de crédit conformes. Tout dans un seul outil.
              </p>
            </div>

            {/* Grande carte dark */}
            <div className="md:col-span-2 lg:col-span-1 bg-gray-950 rounded-2xl p-7 text-white relative overflow-hidden">
              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold mb-2">Import bancaire CAMT.053</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Importez votre relevé bancaire suisse et réconciliez automatiquement vos paiements. Zéro saisie manuelle.
              </p>
              <span className="inline-block mt-4 text-[11px] font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/30">
                🇨🇭 Format suisse natif
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 8. TARIFS ════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionLabel>Tarifs</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Transparent, sans surprise
            </h2>
            <p className="text-gray-500 mt-3 text-base">30 jours gratuits · Sans carte · Sans engagement</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Essentiel',
                price: '19',
                desc: 'Indépendants & micro-entreprises',
                features: [
                  '10 factures / mois',
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
                  'Devis & Avoirs',
                  'Support prioritaire',
                ],
                cta: 'Essai gratuit 30 j.',
                highlight: true,
              },
              {
                name: 'Entreprise',
                price: '99',
                desc: 'Multi-utilisateurs & équipes',
                features: [
                  'Tout Professionnel',
                  '5 utilisateurs inclus',
                  'API REST',
                  'Marque blanche',
                  'Intégration fiduciaire',
                  'Support dédié',
                ],
                cta: 'Contacter',
                highlight: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.highlight
                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 scale-[1.03]'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">
                    ★ Populaire
                  </div>
                )}
                <div className="mb-5">
                  <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
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
                  to={plan.name === 'Entreprise' ? '/help' : '/register'}
                  className={`block text-center py-3 rounded-xl text-sm font-bold transition-all ${
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

      {/* ══ 9. TESTIMONIALS ══════════════════════════════════════════════════ */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionLabel>Témoignages</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              Ils ont adopté ZenFacture
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Le QR-bill est enfin correct. Mes clients scannent et paient le jour même. J'ai réduit mes délais de paiement de 15 jours en moyenne.",
                name: "Sophie M.",
                role: "Graphiste indépendante, Lausanne",
                stars: 5,
              },
              {
                quote: "J'utilisais Bexio avant, beaucoup trop complexe pour mon usage. ZenFacture fait exactement ce dont j'ai besoin, en 10× plus simple.",
                name: "Thomas R.",
                role: "Consultant IT, Zürich",
                stars: 5,
              },
              {
                quote: "Les relances automatiques m'ont sauvé la mise. Plus de factures qui traînent à 60 jours. Mon cash-flow s'est amélioré significativement.",
                name: "Marie-Claire D.",
                role: "Architecte d'intérieur, Genève",
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-7 hover:border-gray-700 transition-colors">
                <div className="flex gap-0.5 mb-5">
                  {[...Array(t.stars)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 10. FAQ ══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Questions fréquentes
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ══ 11. CTA FINAL ════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-200 bg-white/10 border border-white/10 rounded-full px-4 py-2 mb-6">
            🇨🇭 Swiss Made · Données hébergées en Suisse
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
            Prêt à facturer<br/>comme un pro ?
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
            Rejoignez les PME suisses qui font confiance à ZenFacture pour leur facturation au quotidien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl shadow-2xl transition-all hover:scale-[1.02]"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-10 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
            >
              Voir les tarifs
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-blue-200">
            {['30 jours gratuits', 'Sans carte bancaire', 'Résiliation en 1 clic', 'Support 🇨🇭 en français'].map(t => (
              <span key={t} className="flex items-center gap-2">
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
