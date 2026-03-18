import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { FiSend, FiX, FiMessageSquare, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

declare global {
  interface Window {
    jsPDF: any;
  }
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const defaultQuestions = [
  "Comment créer une facture QR suisse ?",
  "Quelles fonctionnalités propose ZenFacture ?",
  "Combien coûte ZenFacture ?",
  "Comment gérer ma TVA avec ZenFacture ?"
];

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ajouter un message de bienvenue au premier chargement
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: '👋 Bienvenue ! Je suis l\'assistant ZenFacture. Je peux répondre à vos questions sur nos fonctionnalités, tarifs, QR-factures suisses, TVA et bien plus. Comment puis-je vous aider ?',
        sender: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simuler une réponse de l'assistant
      setTimeout(() => {
        const responses: Record<string, string> = {
          "qr": "ZenFacture génère automatiquement des **QR-factures conformes aux normes suisses** avec QR-IBAN et références structurées. La QR-facture remplace les bulletins de versement orange et rouge depuis juillet 2020.",
          "prix": "ZenFacture propose 3 formules : **Starter** (9 CHF/mois) pour débuter, **Business** (29 CHF/mois, le plus populaire) avec toutes les fonctionnalités, et **Enterprise** (79 CHF/mois) avec support prioritaire et API. Tous les plans incluent un essai gratuit de 14 jours !",
          "tarif": "Nos tarifs commencent à **9 CHF/mois** pour le plan Starter. Le plan Business à 29 CHF/mois inclut les factures illimitées, la gestion multi-devises (CHF/EUR/USD), les devis et avoirs, ainsi que la déclaration TVA automatique.",
          "tva": "ZenFacture **calcule automatiquement votre TVA** avec les 3 taux suisses (8.1% normal, 2.6% réduit, 3.8% hébergement). Le module génère également le **formulaire AFC 200** prêt à envoyer et exporte en XML pour la soumission électronique.",
          "fonctionnalité": "ZenFacture offre : ✅ Factures QR suisses, ✅ Gestion clients & produits, ✅ Devis & Avoirs, ✅ Factures récurrentes, ✅ Multi-devises (CHF/EUR/USD), ✅ Déclaration TVA automatique, ✅ Rappels de paiement, ✅ E-banking & comptabilité, ✅ Portail fiduciaire.",
          "facture": "Créez une facture en 3 clics : 1) Sélectionnez un client, 2) Ajoutez vos produits/services, 3) ZenFacture génère automatiquement la **QR-facture** avec calcul TVA, numérotation séquentielle et QR-code. Envoyez par email ou téléchargez en PDF !",
          "client": "La gestion clients permet de stocker toutes les informations (nom, adresse, IBAN, TVA), d'organiser par tags, et de suivre l'historique complet des factures et paiements. Import possible depuis Excel/CSV.",
          "récurrent": "Les **factures récurrentes** automatisent vos abonnements : configurez la fréquence (mensuelle, trimestrielle, annuelle) et ZenFacture génère et envoie automatiquement vos factures aux dates définies.",
          "rappel": "Le système envoie automatiquement des **rappels de paiement** par email selon vos règles : 1er rappel à 7 jours, 2ème à 14 jours, dernière mise en demeure à 30 jours. Personnalisez les délais et messages.",
          "devise": "ZenFacture supporte **3 devises principales** : CHF (Franc suisse), EUR (Euro) et USD (Dollar américain). Les taux de change sont mis à jour quotidiennement pour une facturation internationale précise.",
          "devis": "Créez des **devis professionnels** avec numérotation automatique, validité configurable et conversion en facture en un clic. Envoyez par email et suivez les acceptations/refus clients.",
          "avoir": "Les **notes de crédit (avoirs)** annulent partiellement ou totalement une facture. ZenFacture les génère automatiquement avec référence à la facture originale et ajuste votre comptabilité et TVA.",
          "comptabilité": "Le module de **comptabilité simplifiée** inclut un plan comptable PME suisse, journal des écritures, grand livre, bilan et compte de résultat. Intégration automatique des factures et dépenses.",
          "banking": "Le module **E-banking** importe vos relevés bancaires (format ISO 20022 camt.053/054), effectue le rapprochement automatique factures↔paiements, et exporte des ordres de paiement (pain.001).",
          "ebill": "**eBill** permet d'envoyer vos factures directement dans le e-banking de vos clients. Compatible avec le réseau SIX, vos clients reçoivent et paient en un clic depuis leur banque en ligne.",
          "fiduciaire": "Le **portail fiduciaire** donne un accès sécurisé en lecture seule à votre fiduciaire : factures, dépenses, comptabilité, TVA. Exports automatiques en format compatible avec leurs outils comptables.",
          "import": "Importez vos données depuis **Bexio, Cresus ou tout logiciel** via CSV : clients, factures, produits, dépenses. L'assistant de mapping facilite la correspondance des colonnes.",
          "essai": "Oui ! ZenFacture offre un **essai gratuit de 14 jours sans carte bancaire** sur tous les plans. Testez toutes les fonctionnalités en conditions réelles avant de vous engager.",
          "support": "Notre support est disponible par **email** (tous les plans), avec réponse sous 24h. Le plan Enterprise bénéficie d'un **support prioritaire** avec réponse sous 4h et assistance téléphonique.",
          "sécurité": "Vos données sont **hébergées en Suisse** (conformité nLPD), chiffrées en transit (SSL/TLS) et au repos. Sauvegardes quotidiennes, accès sécurisé avec authentification 2FA disponible.",
          "aide": "Je peux vous renseigner sur les **fonctionnalités**, les **tarifs**, la **facturation QR**, la **TVA**, et toutes les questions sur ZenFacture. N'hésitez pas à poser votre question !",
          "bonjour": "Bonjour ! 👋 Je suis l'assistant ZenFacture. Je peux vous aider à découvrir notre solution de facturation suisse. Que souhaitez-vous savoir ?",
          "salut": "Salut ! 👋 Comment puis-je vous aider avec ZenFacture aujourd'hui ?",
          "inscription": "Pour vous inscrire, cliquez sur le bouton **S'inscrire** en haut à droite. Créez votre compte en 2 minutes, aucune carte bancaire requise pour l'essai gratuit de 14 jours !",
          "démo": "Vous pouvez tester ZenFacture gratuitement pendant **14 jours** sans engagement. Toutes les fonctionnalités sont débloquées pour que vous puissiez évaluer la solution en conditions réelles.",
        };

        let responseText = "Je ne suis pas certain de comprendre votre question. Pouvez-vous être plus précis ? Vous pouvez me demander des informations sur les **fonctionnalités**, les **tarifs**, la **TVA**, les **QR-factures**, ou toute autre question sur ZenFacture.";
        const lowerInput = inputValue.toLowerCase();

        for (const [keyword, response] of Object.entries(responses)) {
          if (lowerInput.includes(keyword)) {
            responseText = response;
            break;
          }
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    // Créer un message utilisateur directement
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simuler une réponse de l'assistant
    setTimeout(() => {
      const responses: Record<string, string> = {
        "qr": "ZenFacture génère automatiquement des **QR-factures conformes aux normes suisses** avec QR-IBAN et références structurées. La QR-facture remplace les bulletins de versement orange et rouge depuis juillet 2020.",
        "prix": "ZenFacture propose 3 formules : **Starter** (9 CHF/mois) pour débuter, **Business** (29 CHF/mois, le plus populaire) avec toutes les fonctionnalités, et **Enterprise** (79 CHF/mois) avec support prioritaire et API. Tous les plans incluent un essai gratuit de 14 jours !",
        "tarif": "Nos tarifs commencent à **9 CHF/mois** pour le plan Starter. Le plan Business à 29 CHF/mois inclut les factures illimitées, la gestion multi-devises (CHF/EUR/USD), les devis et avoirs, ainsi que la déclaration TVA automatique.",
        "tva": "ZenFacture **calcule automatiquement votre TVA** avec les 3 taux suisses (8.1% normal, 2.6% réduit, 3.8% hébergement). Le module génère également le **formulaire AFC 200** prêt à envoyer et exporte en XML pour la soumission électronique.",
        "fonctionnalité": "ZenFacture offre : ✅ Factures QR suisses, ✅ Gestion clients & produits, ✅ Devis & Avoirs, ✅ Factures récurrentes, ✅ Multi-devises (CHF/EUR/USD), ✅ Déclaration TVA automatique, ✅ Rappels de paiement, ✅ E-banking & comptabilité, ✅ Portail fiduciaire.",
        "facture": "Créez une facture en 3 clics : 1) Sélectionnez un client, 2) Ajoutez vos produits/services, 3) ZenFacture génère automatiquement la **QR-facture** avec calcul TVA, numérotation séquentielle et QR-code. Envoyez par email ou téléchargez en PDF !",
        "aide": "Je peux vous renseigner sur les **fonctionnalités**, les **tarifs**, la **facturation QR**, la **TVA**, et toutes les questions sur ZenFacture. N'hésitez pas à poser votre question !",
      };

      let responseText = "Je ne suis pas certain de comprendre votre question. Pouvez-vous être plus précis ? Vous pouvez me demander des informations sur les **fonctionnalités**, les **tarifs**, la **TVA**, les **QR-factures**, ou toute autre question sur ZenFacture.";
      const lowerInput = question.toLowerCase();

      for (const [keyword, response] of Object.entries(responses)) {
        if (lowerInput.includes(keyword)) {
          responseText = response;
          break;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <>
      {/* Bouton flottant du chat */}
      <motion.button
        className={`fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
        } text-white transition-colors duration-200`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        {isOpen ? <FiX size={24} /> : <FiMessageSquare size={24} />}
      </motion.button>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed bottom-24 right-8 w-96 bg-white rounded-lg shadow-xl flex flex-col z-50 overflow-hidden"
            style={{ height: '600px' }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* En-tête */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Assistant ZenFacture</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-blue-100"
                aria-label="Fermer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Corps du chat */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions rapides */}
            {messages.length <= 1 && (
              <div className="px-4 pt-2 pb-1 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Questions rapides :</p>
                <div className="flex flex-wrap gap-2">
                  {defaultQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs bg-white border border-gray-200 hover:bg-gray-50 rounded-full px-3 py-1.5 text-gray-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zone de saisie */}
            <form 
              id="chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(e);
              }}
              className="p-4 border-t border-gray-200 bg-white"
            >
              <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-3 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className={`px-4 h-full ${
                    !inputValue.trim() || isLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  {isLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatAssistant;
