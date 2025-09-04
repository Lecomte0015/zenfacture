import React from 'react';
import { FaBook, FaFilePdf, FaVideo, FaCode } from 'react-icons/fa';

export const DocumentationPage = () => {
  const resources = [
    {
      title: 'Guide d\'utilisation',
      description: 'Découvrez comment utiliser toutes les fonctionnalités de ZenFacture',
      icon: <FaBook className="h-8 w-8 text-blue-500" />,
      link: '#',
    },
    {
      title: 'Tutoriels vidéo',
      description: 'Regardez nos tutoriels pour maîtriser rapidement l\'application',
      icon: <FaVideo className="h-8 w-8 text-green-500" />,
      link: '#',
    },
    {
      title: 'Documentation API',
      description: 'Intégrez ZenFacture à vos applications existantes',
      icon: <FaCode className="h-8 w-8 text-purple-500" />,
      link: '#',
    },
    {
      title: 'Téléchargements',
      description: 'Modèles et documents utiles à télécharger',
      icon: <FaFilePdf className="h-8 w-8 text-red-500" />,
      link: '#',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Documentation
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Guides complets et ressources pour vous aider à tirer le meilleur parti de ZenFacture
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {resources.map((resource, index) => (
          <a
            key={index}
            href={resource.link}
            className="flex flex-col p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {resource.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{resource.title}</h3>
                <p className="mt-1 text-gray-500">{resource.description}</p>
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-blue-600">
              En savoir plus →
            </div>
          </a>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Vous ne trouvez pas ce que vous cherchez ?</h2>
        <p className="text-gray-600 mb-4">
          Notre équipe est là pour vous aider. Contactez-nous pour toute question supplémentaire.
        </p>
        <a
          href="/help"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Contacter le support
        </a>
      </div>
    </div>
  );
};

export default DocumentationPage;
