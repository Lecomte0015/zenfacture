import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { FiSend, FiX, FiMessageSquare, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';

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

const RESPONSES: Record<string, string> = {
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
  "bonjour": "Bonjour ! 👋 Je suis l'assistant ZenFacture. Je peux vous aider à découvrir notre solution de facturation suisse. Que souhaitez-vous savoir ?",
  "salut": "Salut ! 👋 Comment puis-je vous aider avec ZenFacture aujourd'hui ?",
  "inscription": "Pour vous inscrire, cliquez sur le bouton **S'inscrire** en haut à droite. Créez votre compte en 2 minutes, aucune carte bancaire requise pour l'essai gratuit de 14 jours !",
  "démo": "Vous pouvez tester ZenFacture gratuitement pendant **14 jours** sans engagement. Toutes les fonctionnalités sont débloquées pour que vous puissiez évaluer la solution en conditions réelles.",
  "aide": "Je peux vous renseigner sur les **fonctionnalités**, les **tarifs**, la **facturation QR**, la **TVA**, et toutes les questions sur ZenFacture. N'hésitez pas à poser votre question !",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [keyword, response] of Object.entries(RESPONSES)) {
    if (lower.includes(keyword)) return response;
  }
  return "Je ne suis pas certain de comprendre votre question. Pouvez-vous être plus précis ? Vous pouvez me demander des informations sur les **fonctionnalités**, les **tarifs**, la **TVA**, les **QR-factures**, ou toute autre question sur ZenFacture.";
}

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    text: "👋 Bienvenue ! Je suis l'assistant ZenFacture. Je peux répondre à vos questions sur nos fonctionnalités, tarifs, QR-factures suisses, TVA et bien plus. Comment puis-je vous aider ?",
    sender: 'assistant',
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: getResponse(text),
        sender: 'assistant',
        timestamp: new Date()
      }]);
      setIsLoading(false);
    }, 900);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    try {
      sendMessage(inputValue.trim());
    } catch (err) {
      console.error(err);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        className={`fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isOpen ? <FiX size={24} /> : <FiMessageSquare size={24} />}
      </button>

      {/* Fenêtre de chat */}
      <div
        className={`fixed bottom-28 right-8 w-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: '600px' }}
      >
        {/* En-tête */}
        <div className="bg-blue-600 text-white px-5 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="font-semibold text-base">Assistant ZenFacture</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:text-blue-200 transition-colors" aria-label="Fermer">
            <FiX size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-3 overflow-y-auto bg-gray-50 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex space-x-1.5">
                  {[0, 150, 300].map(delay => (
                    <div key={delay} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Questions rapides */}
        {messages.length <= 1 && (
          <div className="px-4 pt-2 pb-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
            <p className="text-[11px] text-gray-400 mb-1.5 uppercase tracking-wide font-medium">Questions rapides</p>
            <div className="flex flex-wrap gap-1.5">
              {defaultQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 rounded-full px-3 py-1 text-gray-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 focus-within:border-blue-400 overflow-hidden bg-gray-50 px-3 py-2 transition-colors">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="text-blue-600 disabled:text-gray-300 hover:text-blue-700 transition-colors"
            >
              {isLoading ? <FiLoader className="animate-spin" size={18} /> : <FiSend size={18} />}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatAssistant;
