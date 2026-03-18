import React from 'react';
import SEO from '../components/common/SEO';

const CguPage: React.FC = () => {
  return (
    <>
      <SEO
        title="Conditions Générales d'Utilisation (CGU)"
        description="Conditions générales d'utilisation de ZenFacture, solution de facturation pour PME suisses."
        url="https://zenfacture.ch/cgu"
      />

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Conditions Générales d'Utilisation (CGU)
          </h1>

          <p className="text-sm text-gray-600 mb-8">
            Dernière mise à jour : 20 février 2026
          </p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Objet</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et
                l'utilisation de la plateforme ZenFacture (ci-après « la Plateforme »), éditée par ZenFacture SA,
                société suisse dont le siège est situé en Suisse.
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                La Plateforme offre des services de facturation en ligne, de gestion de clients, de devis,
                et d'autres fonctionnalités connexes pour les professionnels et entreprises suisses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Acceptation des CGU</h2>
              <p className="text-gray-700 leading-relaxed">
                En accédant à la Plateforme et en créant un compte, vous acceptez sans réserve les présentes CGU.
                Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la Plateforme.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Inscription et compte utilisateur</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.1 Création de compte :</strong> Pour utiliser la Plateforme, vous devez créer un compte
                en fournissant des informations exactes et à jour (nom, adresse e-mail, etc.).
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>3.2 Sécurité :</strong> Vous êtes responsable de la confidentialité de vos identifiants
                de connexion. En cas de suspicion d'utilisation non autorisée de votre compte, vous devez
                immédiatement nous en informer.
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>3.3 Période d'essai :</strong> Un essai gratuit de 30 jours est proposé.
                À l'issue de cette période, un abonnement payant sera nécessaire pour continuer à utiliser
                la Plateforme.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Services proposés</h2>
              <p className="text-gray-700 leading-relaxed">
                La Plateforme propose les services suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Création et gestion de factures conformes aux normes suisses (QR-facture)</li>
                <li>Gestion des clients et catalogue de produits/services</li>
                <li>Création de devis et notes de crédit (avoirs)</li>
                <li>Factures récurrentes et rappels de paiement</li>
                <li>Multi-devises (CHF, EUR, USD)</li>
                <li>Gestion de la TVA suisse</li>
                <li>Rapports et statistiques</li>
                <li>Fonctionnalités avancées selon le plan d'abonnement choisi</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Tarification et paiement</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>5.1 Abonnements :</strong> Les tarifs des différents plans d'abonnement sont indiqués
                sur la page Tarifs de la Plateforme. Les prix sont exprimés en francs suisses (CHF) hors TVA.
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>5.2 Facturation :</strong> Le paiement s'effectue mensuellement ou annuellement par
                carte bancaire via notre prestataire de paiement sécurisé Stripe.
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>5.3 Résiliation :</strong> Vous pouvez résilier votre abonnement à tout moment depuis
                votre espace client. La résiliation prendra effet à la fin de la période de facturation en cours,
                sans remboursement au prorata.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Propriété intellectuelle</h2>
              <p className="text-gray-700 leading-relaxed">
                Tous les éléments de la Plateforme (textes, graphismes, logiciels, bases de données, etc.)
                sont protégés par le droit d'auteur et sont la propriété exclusive de ZenFacture SA.
                Toute reproduction, représentation ou utilisation non autorisée est interdite.
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                Vous conservez tous les droits sur les données que vous créez et importez sur la Plateforme
                (factures, clients, etc.).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Protection des données</h2>
              <p className="text-gray-700 leading-relaxed">
                Le traitement de vos données personnelles est régi par notre{' '}
                <a href="/confidentialite" className="text-blue-600 hover:underline">
                  Politique de Confidentialité
                </a>, conforme à la nouvelle Loi fédérale sur la protection des données (nLPD) suisse
                et au RGPD européen.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Responsabilités</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>8.1 Obligations de l'utilisateur :</strong> Vous vous engagez à utiliser la Plateforme
                de manière conforme aux lois en vigueur et aux présentes CGU. Vous êtes seul responsable
                de l'exactitude des données que vous saisissez (factures, clients, TVA, etc.).
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>8.2 Limitation de responsabilité :</strong> ZenFacture SA met tout en œuvre pour assurer
                la disponibilité et la sécurité de la Plateforme, mais ne peut garantir une disponibilité de 100%.
                Nous ne saurions être tenus responsables des dommages indirects résultant de l'utilisation
                ou de l'impossibilité d'utiliser la Plateforme.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Modification des CGU</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les modifications
                prendront effet dès leur publication sur la Plateforme. Votre utilisation continue de la
                Plateforme après la publication des modifications constitue votre acceptation des nouvelles CGU.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Loi applicable et juridiction</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes CGU sont régies par le droit suisse. En cas de litige, les tribunaux
                suisses seront seuls compétents.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l'adresse :
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>Email :</strong> support@zenfacture.ch<br />
                <strong>Adresse :</strong> ZenFacture SA, Suisse
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default CguPage;
