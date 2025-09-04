import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiArrowRight, 
  FiCode,
  FiPieChart, 
  FiBell, 
  FiMessageSquare, 
  FiSave, 
  FiShield, 
  FiServer, 
  FiMessageCircle,
  FiX,
  FiSend
} from 'react-icons/fi';
// Import motion conservé pour une utilisation future

// Images d'avatar pour les témoignages
const avatar1 = 'https://randomuser.me/api/portraits/women/44.jpg';
const avatar2 = 'https://randomuser.me/api/portraits/men/32.jpg';
const avatar3 = 'https://randomuser.me/api/portraits/women/68.jpg';

const features = [
  {
    name: 'Factures QR-code suisses',
    description: 'Génération de factures QR-code conformes aux normes suisses (SIX Interbank Clearing).',
    icon: FiCode,
    link: 'https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-fr.pdf',
  },
  {
    name: 'Dashboard intelligent',
    description: 'Calcule automatiquement vos charges, bénéfices et prévisions financières en temps réel.',
    icon: FiPieChart,
  },
  {
    name: 'Rappels administratifs',
    description: 'Notifications cliquables avec redirection vers les portails officiels (AVS, TVA, etc.).',
    icon: FiBell,
    link: 'https://www.ahv-iv.ch/fr',
  },
  {
    name: 'Assistant IA',
    description: 'Posez vos questions fiscales et administratives et obtenez des réponses précises.',
    icon: FiMessageSquare,
  },
  {
    name: 'Sauvegarde sécurisée',
    description: 'Stockage de toutes vos factures et dépenses dans un espace personnel sécurisé.',
    icon: FiSave,
  },
];

const testimonials = [
  {
    id: 1,
    name: 'Sophie Martin',
    role: 'Graphiste indépendante',
    content: 'Grâce à ZenFacture, je n\'oublie plus mes déclarations TVA et mes factures partent en 1 minute !',
    avatar: avatar1,
  },
  {
    id: 2,
    name: 'Thomas Dubois',
    role: 'Consultant IT',
    content: 'L\'assistant IA m\'a sauvé des heures de recherche sur les obligations fiscales. Indispensable !',
    avatar: avatar2,
  },
  {
    id: 3,
    name: 'Léa Bernard',
    role: 'Photographe',
    content: 'La génération des factures avec QR-code est un gain de temps énorme. Plus de soucis de conformité !',
    avatar: avatar3,
  },
];

const trustBadges = [
  {
    id: 1,
    text: 'Compatible QR-factures suisses (SIX Interbank Clearing)',
    icon: FiCode,
  },
  {
    id: 2,
    text: 'Adapté aux obligations AVS / TVA en Suisse',
    icon: FiShield,
  },
  {
    id: 3,
    text: 'Hébergement des données en Suisse',
    icon: FiServer,
  },
];

const AIModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([
    {
      id: 1,
      sender: 'ai',
      content: 'Bonjour ! Je suis l\'assistant ZenFacture. Comment puis-je vous aider avec vos questions fiscales ou administratives ?',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Ajouter la question de l'utilisateur
    const userMessage = {
      id: conversation.length + 1,
      sender: 'user',
      content: question,
    };

    // Réponses prédéfinies
    const responses = {
      // Réponses sur la TVA
      'tva': `En Suisse, la TVA est de 7.7% pour la plupart des biens et services, avec des taux réduits de 2.5% pour les biens de consommation courante et 3.7% pour l'hébergement. 
      
      Si votre chiffre d'affaires annuel dépasse 100'000 CHF, vous devez vous enregistrer pour la TVA. Les déclarations sont généralement trimestrielles.
      
      Plus d'informations: https://www.estv.admin.ch/estv/fr/mehrwertsteuer.html`,
      
      // Réponses sur l'AVS
      'avs': `L'AVS (Assurance-Vieillesse et Survivants) est obligatoire en Suisse pour tous les résidents. 
      
      Les indépendants doivent payer leurs cotisations trimestriellement (environ 10% de leur revenu, avec un minimum annuel).
      
      Paiement possible via: https://www.ahv-iv.ch/fr`,
      
      // Réponses sur les factures
      'facture': `En Suisse, une facture doit contenir:
      - Vos coordonnées complètes
      - Coordonnées du client
      - Numéro de facture unique
      - Date d'émission
      - Délai de paiement
      - Désignation des prestations
      - Montant HT et TVA
      - Numéro de TVA si assujetti
      
      Notre outil ZenFacture génère automatiquement des factures conformes avec QR-bill.`,
      
      // Réponses sur la comptabilité
      'comptabilité': `Les indépendants en Suisse doivent:
      - Tenir une comptabilité complète si le CA > 500'000 CHF/an
      - Conserver les documents 10 ans
      - Déclarer leurs revenus annuellement
      - Payer les impôts à la source si salarié
      
      Notre solution vous aide à générer des rapports comptables facilement.`,
      
      // Réponses sur les délais de paiement
      'paiement': `En Suisse, le délai légal de paiement est de 30 jours, sauf accord contraire. 
      
      Pour les retards, vous pouvez facturer un intérêt de 5% par an. Après rappel, vous pouvez facturer des frais de rappel de 20 CHF minimum.`,
      
      // Réponses sur les assurances sociales
      'assurances': `Les indépendants en Suisse doivent cotiser à:
      - AVS/AI/APG (obligatoire)
      - LPP/2e pilier (recommandé)
      - Assurance maladie (obligatoire)
      - Assurance accident (obligatoire si pas de 2e pilier)
      
      Les cotisations sont déductibles fiscalement.`,
      
      // Réponse par défaut
      'default': 'Je ne suis pas sûr de comprendre votre question. Pourriez-vous la reformuler ? Je peux vous aider avec des questions sur la TVA, l\'AVS, la facturation, la comptabilité, les délais de paiement et les assurances sociales en Suisse.'
    };

    // Vérifier les mots-clés dans la question
    const lowerQuestion = question.toLowerCase();
    let response = responses.default;

    if (lowerQuestion.includes('tva') || lowerQuestion.includes('taxe sur la valeur ajoutée')) {
      response = responses.tva;
    } else if (lowerQuestion.includes('avs') || lowerQuestion.includes('assurance-vieillesse') || lowerQuestion.includes('assurance vieillesse')) {
      response = responses.avs;
    } else if (lowerQuestion.includes('facture') || lowerQuestion.includes('facturer') || lowerQuestion.includes('facturation')) {
      response = responses.facture;
    } else if (lowerQuestion.includes('compta') || lowerQuestion.includes('comptabilité') || lowerQuestion.includes('comptable')) {
      response = responses.comptabilité;
    } else if (lowerQuestion.includes('paiement') || lowerQuestion.includes('payer') || lowerQuestion.includes('retard')) {
      response = responses.paiement;
    } else if (lowerQuestion.includes('assurance') || lowerQuestion.includes('sociale') || lowerQuestion.includes('cotisation')) {
      response = responses.assurances;
    }

    // Réponse de l'IA
    const aiResponse = {
      id: conversation.length + 2,
      sender: 'ai',
      content: response,
    };

    setConversation([...conversation, userMessage, aiResponse]);
    setQuestion('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
      <div className="bg-primary-600 text-white p-3 flex justify-between items-center">
        <h3 className="font-medium">Assistant ZenFacture</h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {conversation.map((message) => (
          <div 
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-primary-100 text-gray-800' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 flex">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Posez votre question..."
          className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button 
          type="submit"
          className="bg-primary-600 text-white p-2 rounded-r-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <FiSend className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export const HomePage = () => {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white relative">
      {/* Bouton flottant de l'assistant IA */}
      <button
        onClick={() => setIsAIModalOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 z-40"
        aria-label="Ouvrir l'assistant IA"
      >
        <FiMessageCircle className="h-8 w-8" />
      </button>

      <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      {/* Hero Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Simplifiez votre facturation</span>
              <span className="block text-primary">et vos obligations administratives</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl">
              ZenFacture aide les indépendants et petites entreprises à gérer leurs factures, 
              leurs charges et leurs déclarations sans stress.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center rounded-md border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700"
              >
                Rejoindre la bêta
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Voir une démo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-primary">Fonctionnalités</h2>
            <p className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              Une solution tout-en-un pour votre entreprise
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              Découvrez comment ZenFacture peut simplifier votre gestion administrative
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="group relative rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent transition-all duration-200 group-hover:border-primary" aria-hidden="true" />
                  <div className="relative h-full flex flex-col">
                    <div className="flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary">
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="ml-4 text-lg font-medium text-gray-900">{feature.name}</h3>
                    </div>
                    <p className="mt-3 text-base text-gray-600 flex-grow">{feature.description}</p>
                    {feature.link && (
                      <a 
                        href={feature.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
                      >
                        En savoir plus
                        <FiArrowRight className="ml-1 h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Témoignages */}
          <div className="mt-24">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Ce que disent nos utilisateurs
              </h2>
            </div>
            
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{testimonial.name}</h3>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-600 italic">"{testimonial.content}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section de confiance */}
          <div className="mt-24">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-12">
                Une solution de confiance
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {trustBadges.map((badge) => (
                <div key={badge.id} className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-100 p-2 rounded-md">
                    <badge.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">{badge.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Prêt à simplifier votre gestion administrative ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">
              Rejoignez ZenFacture dès aujourd'hui et bénéficiez d'un essai gratuit de 14 jours.
              Aucune carte de crédit requise.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-6 py-3 text-base font-medium text-primary-700 shadow-sm hover:bg-gray-50"
              >
                Essayer gratuitement
                <FiArrowRight className="ml-2 -mr-1 h-5 w-5" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center rounded-md border border-white px-6 py-3 text-base font-medium text-white hover:bg-white/10"
              >
                Voir une démo
              </Link>
            </div>
            <p className="mt-4 text-sm text-primary-200">
              Aucune carte de crédit requise • Annulation à tout moment
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">ZenFacture</h3>
              <p className="text-gray-400 text-sm">
                La solution tout-en-un pour la gestion administrative des indépendants et PME en Suisse.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Produit</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Fonctionnalités</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Tarifs</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Témoignages</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Entreprise</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-base text-gray-400 hover:text-white">À propos</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Carrières</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Légal</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Confidentialité</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Conditions d'utilisation</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">Mentions légales</a></li>
                <li><a href="#" className="text-base text-gray-400 hover:text-white">RGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} ZenFacture. Tous droits réservés.
              <span className="block sm:inline-block mt-2 sm:mt-0 sm:ml-4">
                Conçu pour les indépendants et PME en Suisse.
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
