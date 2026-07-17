import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import SEO from '../components/common/SEO';
import { blogArticles } from '../data/blogArticles';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });

export const BlogPage = () => {
  return (
    <>
      <SEO
        title="Blog"
        description="Facturation, TVA, QR-facture : les guides pratiques ZenFacture pour gérer votre PME ou activité indépendante en Suisse en toute conformité."
        keywords="blog facturation suisse, guide TVA suisse, QR-facture, conseils PME suisse"
        url="https://www.zenfacture.ch/blog"
      />
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Le blog ZenFacture
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Facturation, TVA et administratif suisse expliqués simplement, pour indépendants et PME.
          </p>
        </div>

        <div className="space-y-6">
          {blogArticles.map((article) => (
            <Link
              key={article.slug}
              to={`/blog/${article.slug}`}
              className="block p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 shadow-card hover:border-primary-300 hover:shadow-card-hover transition-all duration-200"
            >
              <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary-600 mb-2">
                {article.category}
              </span>
              <h2 className="text-xl font-bold text-gray-900">{article.title}</h2>
              <p className="mt-2 text-gray-600">{article.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(article.publishedDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {article.readingMinutes} min de lecture
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-primary-600 font-medium">
                  Lire l'article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
