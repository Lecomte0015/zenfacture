import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import SEO from '@/components/common/SEO';

export interface FeatureStep {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface FeatureBenefit {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface FeatureFaqItem {
  question: string;
  answer: string;
}

export interface RelatedFeatureLink {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

interface FeatureLayoutProps {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  path: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  illustration: ReactNode;
  steps: FeatureStep[];
  benefits: FeatureBenefit[];
  faqs?: FeatureFaqItem[];
  related: RelatedFeatureLink[];
}

/**
 * Layout partagé par toutes les pages de détail de fonctionnalité
 * (/fonctionnalites/comptabilite, /gestion-commandes, /gestion-salaires,
 * /gestion-contacts). Centralise le SEO (title/description/keywords,
 * canonical, JSON-LD BreadcrumbList + FAQPage) et la structure visuelle
 * (hero, étapes du processus, bénéfices, FAQ, maillage interne, CTA)
 * pour que chaque page ne définisse que son contenu.
 */
const FeatureLayout = ({
  seoTitle,
  seoDescription,
  seoKeywords,
  path,
  eyebrow,
  title,
  subtitle,
  illustration,
  steps,
  benefits,
  faqs,
  related,
}: FeatureLayoutProps) => {
  const url = `https://www.zenfacture.ch${path}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.zenfacture.ch/' },
      { '@type': 'ListItem', position: 2, name: 'Fonctionnalités', item: 'https://www.zenfacture.ch/fonctionnalites' },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  };

  const faqSchema = faqs && faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} keywords={seoKeywords} url={url} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      {/* Fil d'ariane */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Fil d'ariane">
            <Link to="/" className="hover:text-primary-600">Accueil</Link>
            <span>/</span>
            <Link to="/fonctionnalites" className="hover:text-primary-600">Fonctionnalités</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{title}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3">{eyebrow}</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">{title}</h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">{subtitle}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-base font-bold text-white shadow-warm hover:bg-primary-700 transition-all duration-200"
              >
                Essayer gratuitement 30 jours
              </Link>
              <Link
                to="/tarifs"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
          <div>{illustration}</div>
        </div>
      </div>

      {/* Étapes du processus */}
      <div className="bg-gray-50 py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Comment ça marche</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Le processus, étape par étape</h2>
          </div>
          <div className="space-y-5">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-card">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 flex items-center gap-2">
                    <span className="text-primary-600">{step.icon}</span>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bénéfices */}
      <div className="bg-white py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Bénéfices</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Pourquoi c'est différent</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  {b.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{b.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <div className="bg-gray-50 py-16 sm:py-20 border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">Questions fréquentes</h2>
            <dl className="space-y-5">
              {faqs.map((f, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <dt className="text-base font-semibold text-gray-900 mb-2">{f.question}</dt>
                  <dd className="text-sm text-gray-600 leading-relaxed">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Maillage interne */}
      <div className="bg-white py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Découvrez aussi</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {related.map((r, i) => (
              <Link
                key={i}
                to={r.href}
                className="group flex flex-col rounded-2xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-card-hover transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  {r.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{r.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed flex-1">{r.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:gap-2 transition-all">
                  En savoir plus <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA final */}
      <div className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Prêt à essayer {title.charAt(0).toLowerCase() + title.slice(1)} ?
          </h2>
          <p className="text-gray-600 mb-8">
            Rejoignez les indépendants et PME suisses qui ont déjà simplifié leur gestion administrative.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/auth/register"
              className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-base font-bold text-white shadow-warm hover:bg-primary-700 transition-all duration-200"
            >
              Commencer l'essai gratuit
            </Link>
            <Link
              to="/fonctionnalites"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Voir toutes les fonctionnalités
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeatureLayout;
