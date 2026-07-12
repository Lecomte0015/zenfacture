import React from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaFilePdf, FaVideo, FaCode } from 'react-icons/fa';

export const DocumentationPage = () => {
  const resources = [
    {
      title: 'Guide d\'utilisation',
      description: 'Découvrez comment utiliser toutes les fonctionnalités de ZenFacture',
      icon: <FaBook className="h-8 w-8 text-blue-500" />,
      link: '/aide',
      available: true,
    },
    {
      title: 'Tutoriels vidéo',
      description: 'Regardez nos tutoriels pour maîtriser rapidement l\'application',
      icon: <FaVideo className="h-8 w-8 text-green-500" />,
      link: null,
      available: false,
    },
    {
      title: 'Documentation API',
      description: 'Intégrez ZenFacture à vos applications existantes',
      icon: <FaCode className="h-8 w-8 text-purple-500" />,
      link: '/dashboard/api',
      available: true,
    },
    {
      title: 'Téléchargements',
      description: 'Modèles et documents utiles à télécharger',
      icon: <FaFilePdf className="h-8 w-8 text-red-500" />,
      link: null,
      available: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Documentation
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Tout ce qu'il faut pour prendre ZenFacture en main, sans jargon technique.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {resources.map((resource, index) => {
          const content = (
            <>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {resource.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{resource.title}</h3>
                  <p className="mt-1 text-gray-500">{resource.description}</p>
                </div>
              </div>
              <div className="mt-4 text-sm font-medium">
                {resource.available ? (
                  <span className="text-primary-600">En savoir plus →</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                    Bientôt disponible
                  </span>
                )}
              </div>
            </>
          );

          return resource.available && resource.link ? (
            <Link
              key={index}
              to={resource.link}
              className="flex flex-col p-6 bg-white rounded-2xl border border-gray-200 shadow-card hover:border-primary-300 hover:shadow-card-hover transition-all duration-200"
            >
              {content}
            </Link>
          ) : (
            <div
              key={index}
              className="flex flex-col p-6 bg-white rounded-2xl border border-gray-200 opacity-60 cursor-not-allowed"
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className="mt-14 bg-primary-50 border border-primary-100 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Vous ne trouvez pas ce qu'il vous faut ?</h2>
        <p className="text-gray-600 mb-5">
          Écrivez-nous simplement — notre équipe répond vite et sans jargon.
        </p>
        <Link
          to="/aide"
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Contacter le support
        </Link>
      </div>
    </div>
  );
};

export default DocumentationPage;
