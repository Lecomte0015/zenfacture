import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import SEO from '../components/common/SEO';
import { getArticleBySlug, BlogBlock } from '../data/blogArticles';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });

const renderBlock = (block: BlogBlock, index: number) => {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={index} className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={index} className="text-xl font-semibold text-gray-900 mt-8 mb-3">
          {block.text}
        </h3>
      );
    case 'p':
      return (
        <p key={index} className="text-gray-700 leading-relaxed mb-4">
          {block.text}
        </p>
      );
    case 'ul':
      return (
        <ul key={index} className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case 'note':
      return (
        <div key={index} className="bg-primary-50 border border-primary-100 rounded-xl p-5 my-6 text-gray-700">
          {block.text}
        </div>
      );
    case 'table':
      return (
        <div key={index} className="overflow-x-auto my-6">
          <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
};

export const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedDate,
    dateModified: article.updatedDate,
    author: {
      '@type': 'Organization',
      name: 'ZenFacture',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ZenFacture',
      logo: {
        '@type': 'ImageObject',
        url: 'https://zenfacture.ch/icons/icon-512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://zenfacture.ch/blog/${article.slug}`,
    },
  };

  return (
    <>
      <SEO
        title={article.title}
        description={article.metaDescription}
        keywords={article.metaKeywords}
        url={`https://zenfacture.ch/blog/${article.slug}`}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour au blog
        </Link>

        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary-600 mb-3">
          {article.category}
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl leading-tight">
          {article.title}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(article.publishedDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {article.readingMinutes} min de lecture
          </span>
        </div>

        <article className="mt-10">
          {article.content.map((block, i) => renderBlock(block, i))}
        </article>

        <div className="mt-14 bg-primary-50 border border-primary-100 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Facturez conforme, sans y penser
          </h2>
          <p className="text-gray-600 mb-5">
            ZenFacture génère vos QR-factures suisses conformes automatiquement, avec le bon numéro IDE-TVA et les bons taux. 30 jours d'essai gratuit.
          </p>
          <Link
            to="/auth/register"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Essayer ZenFacture gratuitement
          </Link>
        </div>
      </div>
    </>
  );
};

export default BlogArticlePage;
