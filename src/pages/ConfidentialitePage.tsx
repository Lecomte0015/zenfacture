import React from 'react';
import SEO from '../components/common/SEO';

const ConfidentialitePage: React.FC = () => {
  return (
    <>
      <SEO
        title="Politique de Confidentialité"
        description="Politique de confidentialité de ZenFacture conforme à la loi suisse nLPD et au RGPD."
        url="https://zenfacture.ch/confidentialite"
      />

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Politique de Confidentialité
          </h1>

          <p className="text-sm text-gray-600 mb-8">
            Dernière mise à jour : 20 février 2026
          </p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                ZenFacture SA (ci-après « nous », « notre » ou « ZenFacture ») s'engage à protéger
                la confidentialité et la sécurité de vos données personnelles. La présente Politique
                de Confidentialité décrit comment nous collectons, utilisons, stockons et protégeons
                vos informations personnelles conformément à la nouvelle Loi fédérale sur la protection
                des données (nLPD) suisse et au Règlement Général sur la Protection des Données (RGPD) européen.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Responsable du traitement</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>ZenFacture SA</strong><br />
                Adresse : Suisse<br />
                Email : privacy@zenfacture.ch<br />
                Téléphone : +41 XX XXX XX XX
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Données collectées</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Nous collectons les catégories de données personnelles suivantes :
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.1 Données d'inscription</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Nom de l'entreprise</li>
                <li>Mot de passe (chiffré)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.2 Données d'utilisation</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Factures créées (numéros, montants, dates)</li>
                <li>Informations clients (noms, adresses, emails)</li>
                <li>Devis et notes de crédit</li>
                <li>Produits et services catalogués</li>
                <li>Données de connexion (adresse IP, horodatage)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.3 Données de paiement</h3>
              <p className="text-gray-700 leading-relaxed">
                Les informations de paiement (carte bancaire) sont traitées directement par notre
                prestataire de paiement sécurisé Stripe. Nous ne stockons jamais les données bancaires
                complètes.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.4 Cookies et technologies similaires</h3>
              <p className="text-gray-700 leading-relaxed">
                Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies
                analytiques pour améliorer nos services. Voir notre banner de consentement pour plus de détails.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Finalités du traitement</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Nous utilisons vos données personnelles pour les finalités suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Fournir et gérer votre accès à la Plateforme</li>
                <li>Permettre la création et la gestion de factures conformes aux normes suisses</li>
                <li>Traiter vos paiements et gérer votre abonnement</li>
                <li>Vous contacter pour le support client et les communications importantes</li>
                <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
                <li>Respecter nos obligations légales (conservation des données comptables, TVA, etc.)</li>
                <li>Prévenir la fraude et assurer la sécurité de la Plateforme</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Base juridique du traitement</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Le traitement de vos données personnelles repose sur les bases juridiques suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Exécution d'un contrat :</strong> Pour fournir les services demandés</li>
                <li><strong>Obligation légale :</strong> Conservation des données comptables (10 ans en Suisse)</li>
                <li><strong>Intérêt légitime :</strong> Amélioration des services, sécurité, prévention de la fraude</li>
                <li><strong>Consentement :</strong> Pour les cookies non essentiels et les communications marketing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Partage des données</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données avec :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Prestataires de services :</strong> Stripe (paiements), Supabase (hébergement de données)</li>
                <li><strong>Autorités légales :</strong> Si la loi l'exige (administration fiscale, tribunal, etc.)</li>
                <li><strong>Votre fiduciaire :</strong> Si vous l'autorisez via le portail fiduciaire</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-2">
                Tous nos prestataires sont tenus par des accords de confidentialité stricts et ne peuvent
                utiliser vos données que dans le cadre de leurs services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Transfert de données hors de Suisse</h2>
              <p className="text-gray-700 leading-relaxed">
                Vos données peuvent être stockées sur des serveurs situés dans l'Union européenne
                (via Supabase). Ces transferts sont encadrés par des clauses contractuelles types
                approuvées par les autorités suisses et européennes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Durée de conservation</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Nous conservons vos données personnelles pour les durées suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Données de compte :</strong> Jusqu'à la suppression de votre compte</li>
                <li><strong>Factures et données comptables :</strong> 10 ans (obligation légale suisse)</li>
                <li><strong>Données de paiement :</strong> Durée nécessaire au traitement + 3 ans (prescription)</li>
                <li><strong>Logs de connexion :</strong> 12 mois maximum</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Vos droits</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Conformément à la nLPD et au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> Corriger des données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> Supprimer vos données (sauf obligation légale de conservation)</li>
                <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> S'opposer au traitement de vos données</li>
                <li><strong>Droit de retirer votre consentement :</strong> À tout moment pour les cookies et communications</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Pour exercer vos droits, contactez-nous à : <strong>privacy@zenfacture.ch</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Sécurité des données</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
                protéger vos données :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Mots de passe chiffrés avec bcrypt</li>
                <li>Sauvegardes automatiques quotidiennes</li>
                <li>Accès restreint aux données personnelles (principe du moindre privilège)</li>
                <li>Audits de sécurité réguliers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Modifications de la Politique</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous pouvons modifier cette Politique de Confidentialité à tout moment. Les modifications
                seront publiées sur cette page avec une nouvelle date de mise à jour. Nous vous recommandons
                de consulter régulièrement cette page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Réclamations</h2>
              <p className="text-gray-700 leading-relaxed">
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation
                auprès du Préposé fédéral à la protection des données et à la transparence (PFPDT) en Suisse :
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>PFPDT</strong><br />
                Feldeggweg 1<br />
                CH-3003 Berne<br />
                Email : contact@edoeb.admin.ch
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question concernant cette Politique de Confidentialité ou le traitement
                de vos données personnelles :
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>Email :</strong> privacy@zenfacture.ch<br />
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

export default ConfidentialitePage;
