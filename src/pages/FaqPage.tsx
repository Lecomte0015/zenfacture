import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

export const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Comment créer une facture ?",
      answer: "Pour créer une facture, allez dans le tableau de bord et cliquez sur 'Nouvelle facture'. Remplissez les informations requises telles que le client, les articles, les quantités et les prix. Une fois terminé, cliquez sur 'Enregistrer' ou 'Envoyer'."
    },
    {
      question: "Comment envoyer une facture à un client ?",
      answer: "Après avoir créé une facture, vous pouvez l'envoyer directement depuis l'application en cliquant sur le bouton 'Envoyer'. Vous pourrez alors choisir d'envoyer la facture par email ou de générer un lien partageable."
    },
    {
      question: "Comment suivre les paiements ?",
      answer: "Tous les paiements sont suivis automatiquement dans la section 'Factures' de votre tableau de bord. Les factures payées, en attente et en retard sont clairement indiquées."
    },
    {
      question: "Puis-je personnaliser mes factures ?",
      answer: "Oui, vous pouvez personnaliser vos factures avec votre logo, vos coordonnées et d'autres détails dans les paramètres de votre compte."
    },
    {
      question: "Comment fonctionne l'essai gratuit ?",
      answer: "L'essai gratuit vous donne accès à toutes les fonctionnalités de ZenFacture pendant 14 jours. Aucune carte de crédit n'est requise pour commencer l'essai."
    },
    {
      question: "Quels modes de paiement sont acceptés ?",
      answer: "Nous acceptons les cartes de crédit (Visa, Mastercard, American Express) et les virements bancaires pour les paiements d'abonnement. Pour vos clients, vous pouvez configurer différents modes de paiement dans les paramètres."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Foire aux questions
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Trouvez des réponses aux questions les plus fréquemment posées
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full px-6 py-4 text-left focus:outline-none"
              onClick={() => toggleFaq(index)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                {openIndex === index ? (
                  <FaChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <FaChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 pt-0 text-gray-600">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Vous n'avez pas trouvé de réponse ?</h2>
        <p className="text-gray-600 mb-4">
          Notre équipe de support est là pour vous aider.
        </p>
        <div className="space-x-4">
          <a
            href="/help"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Contacter le support
          </a>
          <a
            href="/documentation"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Voir la documentation
          </a>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
