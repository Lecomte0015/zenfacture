// Contenu du blog ZenFacture — chaque article est un objet statique (pas de
// CMS pour l'instant). Le tableau `blogArticles` alimente à la fois la page
// d'index (/blog) et la page de détail (/blog/:slug).

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'note'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

export interface BlogArticle {
  slug: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  excerpt: string;
  category: string;
  publishedDate: string; // ISO
  updatedDate: string; // ISO
  readingMinutes: number;
  content: BlogBlock[];
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'mentions-obligatoires-facture-suisse',
    title: 'Mentions obligatoires sur une facture en Suisse : le guide complet 2026',
    metaDescription:
      "Quelles mentions sont obligatoires sur une facture suisse ? IDE (CHE), TVA, QR-facture, adresses structurées : le guide à jour 2026 pour indépendants et PME.",
    metaKeywords:
      'mentions obligatoires facture suisse, numéro IDE suisse, CHE TVA, QR-facture obligatoire, facture conforme suisse, TVA suisse 2026',
    excerpt:
      "IDE, TVA, QR-facture, adresse structurée : voici exactement ce qu'une facture doit contenir en Suisse en 2026 pour être valable — et les erreurs qui la rendent contestable.",
    category: 'Facturation & TVA',
    publishedDate: '2026-07-16',
    updatedDate: '2026-07-16',
    readingMinutes: 7,
    content: [
      {
        type: 'p',
        text: "Une facture qui n'est pas conforme peut être refusée par un client, contestée par l'Administration fédérale des contributions (AFC), ou tout simplement retarder un paiement. En Suisse, il n'existe pas un article de loi unique qui liste \"les mentions obligatoires d'une facture\" — les exigences viennent de plusieurs sources : le droit des obligations (CO), la législation sur la TVA, et depuis 2022 les normes techniques de la QR-facture. Ce guide rassemble tout, à jour pour 2026.",
      },
      { type: 'h2', text: '1. Les mentions de base, pour toute facture' },
      {
        type: 'p',
        text: "Qu'elle soit soumise à la TVA ou non, une facture suisse doit permettre d'identifier sans ambiguïté qui facture quoi, à qui, et pour quel montant.",
      },
      {
        type: 'ul',
        items: [
          'Raison sociale complète et adresse de l\'émetteur',
          'Nom et adresse du client',
          'Date d\'émission de la facture',
          'Numéro de facture unique et séquentiel',
          'Description des prestations ou produits livrés (nature, quantité)',
          'Date ou période de la prestation',
          'Montant total à payer, dans la devise convenue (CHF le plus souvent)',
          'Conditions et délai de paiement',
        ],
      },
      { type: 'h2', text: '2. Le numéro IDE (CHE) : obligatoire dès que vous êtes assujetti à la TVA' },
      {
        type: 'p',
        text: "Le numéro d'identification des entreprises (IDE, aussi appelé UID) suit toujours le format CHE-XXX.XXX.XXX. Dès que votre chiffre d'affaires annuel dépasse CHF 100'000, l'assujettissement à la TVA est obligatoire et ce numéro doit apparaître sur chaque facture, complété du suffixe TVA (ou MWST en Suisse alémanique, IVA au Tessin) : par exemple CHE-123.456.789 TVA. Une facture qui omet ce numéro alors que l'émetteur est assujetti peut être jugée non conforme par l'AFC, avec un risque direct sur la déduction de la TVA en amont pour votre client.",
      },
      {
        type: 'note',
        text: "Sous le seuil de CHF 100'000, l'assujettissement TVA est facultatif (sauf activités spécifiques). Si vous n'êtes pas assujetti, vous ne devez ni facturer de TVA, ni faire figurer de numéro IDE-TVA — seul un numéro IDE simple reste recommandé pour la traçabilité commerciale.",
      },
      { type: 'h2', text: '3. Les mentions liées à la TVA (si vous êtes assujetti)' },
      {
        type: 'p',
        text: "En 2026, les taux de TVA suisses restent ceux en vigueur depuis janvier 2024 : 8.1% (taux normal), 2.6% (taux réduit — alimentation, livres, médicaments notamment) et 3.8% (taux spécial hébergement). Chaque ligne de facture — ou à défaut le total — doit indiquer clairement quel taux s'applique.",
      },
      {
        type: 'table',
        headers: ['Taux', 'Usage'],
        rows: [
          ['8.1 %', 'Taux normal — la majorité des biens et services'],
          ['2.6 %', 'Taux réduit — alimentation, livres, journaux, médicaments'],
          ['3.8 %', 'Taux spécial — hébergement (hôtellerie, parahôtellerie)'],
        ],
      },
      {
        type: 'ul',
        items: [
          'Le numéro IDE-TVA de l\'émetteur (CHE-XXX.XXX.XXX TVA)',
          'Le ou les taux de TVA appliqués',
          'Le montant de TVA par taux, ou le montant total de TVA',
          'Le montant hors taxe (HT) et le montant TTC',
        ],
      },
      { type: 'h2', text: '4. La QR-facture : obligatoire depuis octobre 2022' },
      {
        type: 'p',
        text: "Depuis le 1er octobre 2022, les bulletins de versement traditionnels (BVR/BVJ orange et rouge) ne sont plus acceptés par les banques suisses : toute facture payée sur un IBAN suisse ou un numéro IBAN CH doit intégrer une section QR-facture normalisée (référence SIX Interbank Clearing), avec son QR-code contenant les coordonnées de paiement structurées. C'est aujourd'hui le standard de fait pour toute facture papier ou PDF adressée à un client suisse.",
      },
      {
        type: 'note',
        text: "Changement important pour 2026 : depuis le 21 novembre 2025, seules les adresses structurées (rue et numéro séparés du NPA et de la localité, dans des champs distincts) sont acceptées sur les nouvelles QR-factures. La période de transition se termine le 30 septembre 2026 — passé cette date, une QR-facture avec une adresse en texte libre non structurée sera rejetée par les banques. Si votre logiciel de facturation génère encore des adresses en texte libre, c'est le moment de vérifier sa conformité.",
      },
      { type: 'h2', text: '5. Mentions complémentaires recommandées' },
      {
        type: 'p',
        text: "Sans être strictement obligatoires, ces mentions réduisent les litiges et accélèrent le paiement :",
      },
      {
        type: 'ul',
        items: [
          'Coordonnées de contact (email, téléphone) pour toute question sur la facture',
          'Conditions de retard de paiement (intérêts moratoires, rappel)',
          'Mention du régime pour les indépendants non assujettis : « TVA non applicable, art. 21 LTVA » ou simplement l\'absence de mention TVA',
          'Numéro de commande ou de référence client, si applicable',
        ],
      },
      { type: 'h2', text: 'En résumé' },
      {
        type: 'p',
        text: "Une facture suisse conforme en 2026 combine trois couches d'exigences : les mentions commerciales de base (CO), les mentions fiscales si vous êtes assujetti à la TVA (numéro IDE-TVA, taux, montants), et la structure technique de la QR-facture avec adresses structurées. Un logiciel de facturation suisse à jour — comme ZenFacture — applique ces règles automatiquement à chaque facture, pour éviter les oublis et les rejets bancaires.",
      },
    ],
  },
];

export const getArticleBySlug = (slug: string): BlogArticle | undefined =>
  blogArticles.find((a) => a.slug === slug);
