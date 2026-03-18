# ZENFACTURE - Feuille de route & Suivi d'avancement

> **Objectif** : Transformer ZenFacture en SaaS complet de facturation pour PME suisses, prêt au déploiement.
> **Dernière mise à jour** : 2026-03-18 (phases 5-7 planifiées)
> **Positionnement** : Surpasser Bexio (CHF 45+/mois) en offrant plus de fonctionnalités à un meilleur prix, avec des différenciateurs forts (OCR IA, portail fiduciaire, multi-devises, TWINT natif).

---

## Statut global

| Phase | Progression | Statut |
|-------|------------|--------|
| Phase 0 - Infrastructure DB | ██████████ 100% | ✅ Terminé |
| Phase 1 - Nettoyage & Conformité | ██████████ 100% | ✅ Terminé |
| Phase 2 - Fonctionnalités essentielles | ██████████ 100% | ✅ **Terminé** |
| **Phase 2.5 - Back-office Admin** | ██████████ 100% | ✅ **Terminé** |
| **Phase 3 - Différenciation** | ██████████ 100% | ✅ **Terminé** |
| **Phase UX - Design & Expérience** | ██████████ 100% | ✅ **Terminé** |
| Phase 4 - Déploiement | ████░░░░░░ 40% | 🔄 En cours (4.1, 4.2, 4.4 faits) |
| **Phase 5 - Parité Bexio (Must-Have)** | ████░░░░░░ 50% | 🔄 En cours (5.1, 5.2 faits) |
| **Phase 6 - Supériorité Bexio (Should-Have)** | ░░░░░░░░░░ 0% | ⏳ À faire |
| **Phase 7 - Différenciation avancée (Nice-to-Have)** | ░░░░░░░░░░ 0% | ⏳ À faire |

---

## 🚀 PROCHAINES PHASES — Ce qu'il reste à faire pour surpasser Bexio

> Les fonctionnalités sont classées **du plus important au moins important**.
> Apps mobiles natives et moyens de paiement Stripe seront traités séparément après ces phases.

---

### PHASE 5 — Parité Must-Have (fonctionnalités manquantes critiques)

#### ✅ 5.1 Cron automatique pour les factures récurrentes — TERMINÉ 2026-03-18
- [x] Edge Function `supabase/functions/generate-recurring-invoices/index.ts` — génère les factures dues chaque jour à 07h00 UTC
- [x] Migration `20260318200000_recurring_invoices_cron.sql` — colonne `envoi_auto`, index optimisé, pg_cron planifié
- [x] `RecurrencesPage.tsx` — affichage `prochaine_emission`, badge orange si < 7 jours, bouton "Générer maintenant", bannière info 08h00
- [x] `useRecurrences.ts` — `pauseRecurrence()` et `reprendreRecurrence()` ajoutés
- [x] `recurrenceService.ts` — `pauseRecurrence()`, `reprendreRecurrence()`, `getHistoriqueFactures()`, type `envoi_auto` ajouté

---

#### ✅ 5.2 Archivage 10 ans conforme nLPD — TERMINÉ 2026-03-18
- [x] Migration `20260318300000_archive_nlpd.sql` — colonnes `archived_at`, `archive_expiry_at`, `archive_hash` sur `invoices`, `expenses`, `avoirs`, `devis` + table `archives` + RLS + fonction RPC `archiver_document()`
- [x] `archiveService.ts` — `generateHash()` SHA-256 Web Crypto, `archiveDocument()`, `getArchivedDocuments()`, `verifyArchiveIntegrity()`, `exportArchivesAsJson()`
- [x] `useArchives.ts` — hook React avec `archive()`, `refreshArchives()`
- [x] `ArchivePage.tsx` — bannière nLPD/CO art. 962, stats cards, filtres, tableau avec badges, vérification intégrité hash, export JSON
- [x] `App.tsx` — route `/dashboard/archive` ajoutée
- [x] `Sidebar.tsx` — lien "Archives (nLPD)" ajouté dans le groupe Finance

---

#### 5.3 Time Tracking & Gestion de projets 🟠 PRIORITÉ MOYENNE
**Pourquoi** : Bexio, Smallinvoice, KLARA l'ont. Indispensable pour indépendants qui facturent à l'heure.
- [ ] Migration SQL : tables `projets`, `sessions_temps`, `taches`
  - `projets` : nom, client_id, budget_heures, tarif_horaire, statut
  - `sessions_temps` : projet_id, start_at, end_at, description, facturable
  - `taches` : projet_id, titre, statut, heures_estimees, heures_reelles
- [ ] Service `timeTrackingService.ts` : CRUD projets, démarrer/arrêter un timer, saisie manuelle
- [ ] Hook `useTimeTracking.ts`
- [ ] Page `TimeTrackingPage.tsx` :
  - Vue chronomètre (démarrer/arrêter une session)
  - Vue liste des sessions par projet
  - Vue récapitulatif : heures totales, heures facturables, CA potentiel
- [ ] Composant `TimeTracker.tsx` : widget flottant dans le dashboard (toujours visible)
- [ ] **Intégration facturation** : bouton "Facturer ces heures" → crée une ligne de facture automatiquement
- [ ] Route `/dashboard/time-tracking`

---

#### 5.4 Module Salaires / Payroll (Swissdec) 🟠 PRIORITÉ MOYENNE
**Pourquoi** : Bexio, KLARA, Winbiz l'ont. C'est un must pour les PME qui ont des employés.
- [ ] Migration SQL : tables `employes`, `fiches_salaire`, `composants_salaire`
  - `employes` : nom, prénom, ahv_number, adresse, taux_activite, salaire_brut, type_contrat
  - `fiches_salaire` : employe_id, periode, salaire_brut, deductions (AVS/AI/APG, AC, LPP, IJM), net_a_payer
  - `composants_salaire` : primes, heures_sup, indemnites
- [ ] Service `payrollService.ts` :
  - Calcul automatique AVS (8.7%), AI (1.4%), APG (0.5%), AC (2.2%)
  - Calcul LPP selon tranche d'âge
  - Calcul impôt à la source (pour frontaliers/étrangers)
- [ ] Hook `usePayroll.ts`
- [ ] Page `PayrollPage.tsx` :
  - Liste des employés
  - Génération des fiches de salaire mensuelles
  - Récapitulatif charges patronales
- [ ] Export fiche de salaire en PDF
- [ ] Export Swissdec XML (ELM 5.0) pour transmission aux assurances
- [ ] Route `/dashboard/payroll`

---

### PHASE 6 — Supériorité Bexio (différenciateurs supplémentaires)

#### 6.1 Création de factures en masse (Batch) 🟡 PRIORITÉ BASSE
**Pourquoi** : Gain de temps énorme pour les entreprises avec beaucoup de clients récurrents.
- [ ] Bouton "Facturation groupée" sur InvoicesPage
- [ ] Sélection multiple de clients avec checkbox
- [ ] Application d'un template de facture à tous les clients sélectionnés
- [ ] Envoi groupé par email en un clic
- [ ] Rapport : X factures créées, Y envoyées, Z erreurs

---

#### 6.2 Gestion des stocks 🟡 PRIORITÉ BASSE
**Pourquoi** : Utile pour les commerces et revendeurs. Bexio l'a dans ses plans supérieurs.
- [ ] Migration SQL : colonnes `stock_actuel`, `stock_minimum`, `stock_maximum` sur `produits`
- [ ] Service `stockService.ts` : `deduireStock()`, `getAlerteStock()`
- [ ] Déduction automatique du stock à la création/validation d'une facture
- [ ] Alertes dans le dashboard si stock < stock_minimum
- [ ] Page `StocksPage.tsx` : vue inventaire avec niveaux et historique des mouvements
- [ ] Export inventaire CSV/PDF

---

#### 6.3 Estimation d'impôts 🟡 PRIORITÉ BASSE
**Pourquoi** : Magic Heidi le fait et c'est très apprécié des indépendants suisses.
- [ ] Service `taxEstimationService.ts` :
  - Calcul estimatif IS (impôt sur le bénéfice) selon canton
  - Calcul estimatif impôt sur le revenu pour indépendants
  - Prise en compte du bénéfice net (revenus - charges - TVA due)
- [ ] Widget "Provision impôts" sur le dashboard principal
- [ ] Page `TaxEstimationPage.tsx` : simulateur par canton avec barèmes 2026
- [ ] Export PDF avec le détail du calcul

---

#### 6.4 Multi-marques / White-labeling 🟡 PRIORITÉ BASSE
**Pourquoi** : Utile pour les agences et fiduciaires qui gèrent plusieurs entreprises.
- [ ] Migration SQL : table `marques` liée à `organisations`
  - nom, logo_url, couleur_primaire, couleur_secondaire, adresse, iban, email_envoi
- [ ] Un utilisateur peut avoir plusieurs marques (ex: "Entreprise A" + "Entreprise B")
- [ ] Sélecteur de marque lors de la création d'une facture
- [ ] Chaque facture PDF utilise les couleurs et le logo de la marque sélectionnée

---

### PHASE 7 — Différenciation avancée (Nice-to-Have)

#### 7.1 Envoi postal via Swiss Post / ePost 🟢 OPTIONNEL
**Pourquoi** : KLARA l'a (partenariat Swiss Post). Différenciateur pour clients peu digitalisés.
- [ ] Intégration API Swiss Post IncaMail ou ePost
- [ ] Bouton "Envoyer par courrier" dans InvoiceModal
- [ ] Tarification à l'acte (ex: CHF 1.50/envoi) facturée à l'utilisateur
- [ ] Suivi de l'état de l'envoi postal

---

#### 7.2 Détection de fraude IA 🟢 OPTIONNEL
**Pourquoi** : Yooz et certains ERP haut de gamme l'ont. Différenciateur fort pour PME en croissance.
- [ ] Service `fraudDetectionService.ts` :
  - Détection montants atypiques (>3x la moyenne client)
  - Détection IBAN modifié récemment
  - Détection doublons (même montant + même client + même période)
  - Scoring de risque (0-100)
- [ ] Badge de risque sur chaque facture entrant (dépenses)
- [ ] Alerte email à l'admin si score > 70

---

#### 7.3 Intégrité Blockchain (audit trail) 🟢 OPTIONNEL
**Pourquoi** : Banana Accounting le fait — excellent argument légal pour l'archivage.
- [ ] À chaque création/modification d'une facture : calculer un hash SHA-256 du contenu
- [ ] Stocker le hash dans une table `audit_trail` avec timestamp et user_id
- [ ] Chaîner les hashes (hash_n = SHA-256(hash_{n-1} + contenu_n)) pour détection de falsification
- [ ] Page `AuditTrailPage.tsx` : historique complet des modifications avec vérification d'intégrité
- [ ] Export rapport d'audit PDF pour contrôle fiscal

---

#### 7.4 Boutique en ligne / POS 🟢 OPTIONNEL
**Pourquoi** : KLARA l'a. Marché de niche mais différenciateur pour commerces.
- [ ] Intégration Stripe pour paiements en ligne
- [ ] Page produits publique (catalogue)
- [ ] Panier + checkout
- [ ] Génération automatique de facture à la vente
- [ ] Terminal POS simplifié (scan QR produit + paiement TWINT)

---

## ✅ DÉJÀ FAIT — Nos différenciateurs vs Bexio

> Ces fonctionnalités sont **déjà implémentées** et constituent notre avantage concurrentiel.

| Fonctionnalité | ZenFacture | Bexio |
|---|---|---|
| OCR IA (Claude Vision) pour scan reçus | ✅ Natif | ❌ Absent |
| TWINT intégré nativement dans la facture | ✅ Natif | ❌ Partiel |
| Paiement en ligne (TWINT, cartes, PostFinance) via Payrexx | ✅ Natif | ✅ Payant en plus |
| Portail fiduciaire dédié | ✅ Inclus | ✅ Payant en plus |
| Réconciliation bancaire ISO 20022 | ✅ Inclus | ✅ Payant en plus |
| eBill SIX | ✅ Inclus | ✅ Payant en plus |
| Import depuis Bexio/Crésus | ✅ Inclus | ❌ Absent |
| TVA déclaration automatique (formulaire 200 AFC) | ✅ Inclus | ✅ Partiel |
| Comptabilité complète (bilan, grand livre, P&L) | ✅ Inclus | ✅ Payant en plus |
| Internationalisation FR/DE/EN | ✅ Inclus | ✅ Inclus |
| PWA installable sur mobile | ✅ Inclus | ❌ App payante |
| Back-office admin complet | ✅ Inclus | ❌ Absent |
| Prix cible | **CHF 25-29/mois** | **CHF 45+/mois** |

---

## 🎯 CE QU'IL RESTE À FAIRE (Prochaines étapes — historique)

### ✅ FAIT — Priorité 1 : Envoi d'emails (Phase 2) — 2026-03-13
- [x] Service email Resend → `src/services/emailService.ts`
- [x] Edge Function `supabase/functions/send-email/index.ts` (templates facture + rappel + générique)
- [x] Bouton "Envoyer" dans InvoiceModal avec modal de confirmation + PDF joint
- [x] Lien TWINT sur la facture (deep link `twint://`)
- [x] Statut facture mis à `sent` après envoi email — **2026-03-18**
- [x] Bouton "Envoyer" sur DevisPage (modal email + statut → `envoye`) — **2026-03-18**
- [x] Bouton "Envoyer" sur AvoirsPage (modal email + statut → `emis`) — **2026-03-18**

### ✅ FAIT — Priorité 2 : Paiement en ligne (Phase 4.3) — 2026-03-13
- [x] `src/services/payrexxService.ts` (Payrexx + Stripe fallback)
- [x] Edge Function `supabase/functions/create-payment-link/index.ts`
- [x] Bouton "Payer en ligne" dans InvoiceModal + bannière avec lien copyable
- [x] Migration SQL `20260313000000_payment_links.sql` (RLS + index)
- [x] Support TWINT, PostFinance, Visa, MC, Apple/Google Pay via Payrexx

### ✅ FAIT — Phase UX : Design & Expérience utilisateur — 2026-03-17
- [x] **Sidebar** refaite : fond sombre (`bg-gray-950`), 18 items groupés en 6 catégories pliables, état persisté localStorage, avatar initiales, badge plan
- [x] **DashboardPage** refaite : StatCards avec gradients colorés (bleu/vert/orange/violet), graphique CA mensuel (Chart.js Line), header avec prénom + date
- [x] **DashboardLayout** : top header fixe avec titre page, icône notifications, avatar initiales
- [x] **Pages publiques** corrigées : FeaturesPage (export default manquant → page blanche), liens nav `/features` → `/fonctionnalites` etc.
- [x] **Personnalisation facture** : logo entreprise (upload Supabase Storage), couleur principale, couleur fond tableau — appliqués dans PDF + email
- [x] **PDF corrigé** : données entreprise toujours à jour (IBAN, adresse, nom), logo et couleurs dynamiques
- [x] **Lien "Voir les plans"** corrigé : `/app/billing` → `/dashboard/billing` (Link React Router)

### Priorité 2 : Phase 4 - Déploiement (ce qui reste)
- [x] **4.1** Performance & optimisation (lazy loading fait)
- [x] **4.2** SEO & Landing pages (sitemap, meta tags, pages faites)
- [ ] **4.3** Paiement Stripe & abonnements ⚠️ **À faire**
- [x] **4.4** Legal & Compliance (CGU, Confidentialité faites)
- [ ] **4.5** Infrastructure (Vercel/hosting suisse, CI/CD, monitoring) ⚠️ **À faire**
- [ ] **4.6** Tests (unitaires, E2E) - *Partiellement fait (1 test existant)*
- [x] **4.7** Documentation utilisateur (page créée)

---

## Ce qui a été fait

### Phase 0 - Infrastructure & Base de données
- [x] Création du projet Supabase (nouveau après pause inactivité)
- [x] Migration consolidée : toutes les tables créées en une seule migration
  - `profils` (avec trial_start_date, trial_end_date)
  - `invoices` (factures avec QR-bill)
  - `organisations` + `utilisateurs_organisations` (système FR)
  - `organizations` + `organization_members` + `organization_invitations` (système EN)
  - `cles_api` (clés API)
  - `tickets` + `commentaires_tickets` (support)
  - `expenses` (dépenses)
- [x] Correction `auth.utilisateurs` → `auth.users`
- [x] Correction `CREATE TYPE IF NOT EXISTS` → `DO $$ BEGIN ... EXCEPTION`
- [x] Correction ordre des dépendances (organization_members avant policy)
- [x] Trigger auto-création profil à l'inscription
- [x] Fonctions utilitaires (creer_organisation, generer_cle_api, trial, etc.)
- [x] RLS (Row Level Security) sur toutes les tables
- [x] Mise à jour des clés API Supabase dans `.env`

---

## Phase 1 - Nettoyage & Conformité légale ✓

### 1.1 Nettoyage du code ✓
- [x] Supprimer les fichiers de debug/test
- [x] Supprimer les fichiers redondants/backup
- [x] Consolider les composants dupliqués
- [x] Supprimer la route `/debug` dans `App.tsx`
- [x] Unifier le nommage DB en français (migration `20260218000000_unifier_tables_francais.sql`)

### 1.2 Conformité TVA suisse 2024+ ✓
- [x] Taux de TVA mis à jour : 8.1% (normal), 2.6% (réduit), 3.8% (hébergement), 0% (exonéré)
- [x] Sélection du taux par article
- [x] Méthodes de décompte effective et forfaitaire

### 1.3 QR-Bill conforme (nov. 2025) ✓ — Corrigé 2026-03-13
- [x] Service unifié `swissQrService.ts` — source unique de vérité pour la génération SPC
- [x] Adresses structurées uniquement (type 'S') dans tous les composants
- [x] Validation IBAN suisse (CH/LI) avec checksum MOD-97
- [x] Suppression de l'IBAN hardcodé dans `InvoiceModal.tsx`
- [x] Debounce 600ms dans `InvoiceForm.tsx` (évite les re-renders à chaque frappe)
- [x] Vrai export PDF (jsPDF) avec QR code embarqué — remplace la boîte d'impression navigateur
- [x] Messages d'erreur utilisateur si IBAN manquant ou invalide
- [ ] Référence structurée QRR/SCOR (à implémenter — nécessite QR-IBAN)

### 1.4 Internationalisation (i18n) ✓
- [x] `react-i18next` + `i18next` installés
- [x] Fichiers de traduction : `fr.json`, `de.json`, `en.json`
- [x] Textes hardcodés extraits dans les fichiers de traduction
- [x] Sélecteur de langue dans les paramètres
- [x] UI traduite en FR, DE, EN

### 1.5 Sécurité & qualité (partiel)
- [x] `.env` dans `.gitignore`
- [x] Validation côté client (Zod + zodResolver) — **fait 2026-03-18** (5 formulaires couverts)
- [ ] Corriger les `any` TypeScript — à faire
- [x] Tests unitaires — **fait 2026-03-18** (produitForm, settingsForm, expenseForm, invoiceService, clientService)

---

## Phase 2 - Fonctionnalités essentielles (8/9 terminées)

> Migration : `supabase/migrations/20260218100000_phase2_fonctionnalites.sql`
> Tables créées : `produits`, `devis`, `avoirs`, `factures_recurrentes`, `templates_facture`

### 2.1 Devis / Offres ✓
- [x] Table `devis` (migration Phase 2)
- [x] Service `devisService.ts` + hook `useDevis.ts`
- [x] Page `DevisPage.tsx` avec liste, filtres par statut, recherche
- [x] Statuts : brouillon → envoyé → accepté → refusé → expiré → converti
- [x] Conversion devis → facture en 1 clic
- [x] Route `/dashboard/devis`

### 2.2 Factures récurrentes ✓
- [x] Table `factures_recurrentes` (migration Phase 2)
- [x] Service `recurrenceService.ts` + hook `useRecurrences.ts`
- [x] Page `RecurrencesPage.tsx` avec toggle actif/pause
- [x] Fréquences : hebdomadaire, mensuel, trimestriel, semestriel, annuel
- [x] Gestion des arrêts / pauses de récurrence
- [ ] Edge Function Supabase pour génération automatique (cron) — à faire côté backend

### 2.3 Rappels de paiement ✓
- [x] Service `rappelService.ts` + hook `useRappels.ts`
- [x] Détection automatique des factures en retard
- [x] 3 niveaux de rappel configurables (J+7, J+14, J+30)
- [x] Historique des relances par facture
- [x] Marquage automatique du statut `en_retard`

### 2.4 Templates de factures ✓
- [x] Table `templates_facture` (migration Phase 2) + 3 templates système
- [x] Service `templateService.ts` + hook `useTemplates.ts`
- [x] 3 designs : Classique, Moderne, Minimaliste
- [x] Personnalisation couleurs (primaire, secondaire)
- [ ] Upload logo — nécessite Supabase Storage

### 2.5 Envoi de factures par email ✓ — Implémenté 2026-03-13
- [x] Edge Function `supabase/functions/send-email/index.ts` créée (Resend)
- [x] Service `src/services/emailService.ts` + `generatePdfBase64()`
- [x] Bouton "Envoyer" dans `InvoiceModal.tsx` avec modal de confirmation
- [x] Template email HTML responsive avec montant et QR-bill mentionné
- [x] Template rappel HTML (niveaux 1/2/3 avec couleurs d'urgence)
- [x] PDF généré automatiquement et joint à l'email
- [x] Passer le statut à `sent` après envoi — **fait 2026-03-18**
- [x] Bouton "Envoyer" sur devis et avoirs — **fait 2026-03-18**

> **⚠️ Configuration requise** : Ajouter `RESEND_API_KEY`, `APP_FROM_EMAIL`, `APP_FROM_NAME`
> dans les secrets Supabase (`supabase secrets set RESEND_API_KEY=re_xxx`).
> Créer un compte sur https://resend.com et vérifier le domaine d'envoi.

### 2.6 Catalogue produits / services ✓
- [x] Table `produits` (migration Phase 2)
- [x] Service `produitService.ts` + hook `useProduits.ts`
- [x] Page `ProduitsPage.tsx` avec recherche, catégories, export CSV
- [x] Formulaire `ProduitForm.tsx` (modal)
- [x] Unités : pièce, heure, jour, forfait, m², kg

### 2.7 Notes de crédit / Avoirs ✓
- [x] Table `avoirs` (migration Phase 2)
- [x] Service `avoirService.ts` + hook `useAvoirs.ts`
- [x] Page `AvoirsPage.tsx` avec recherche
- [x] Lien obligatoire avec facture d'origine
- [x] Numérotation : AVOIR-YYYYMMDD-NNNN

### 2.8 Gestion clients améliorée ✓
- [x] Table `clients` enrichie (colonnes ajoutées en Phase 2)
- [x] Service `clientService.ts` + hook `useClients.ts`
- [x] Page `ClientsPage.tsx` refactorisée avec recherche, export CSV
- [x] Formulaire `ClientForm.tsx` (modal)
- [x] Historique des factures par client
- [x] Numérotation automatique (CLI-XXXX)

### 2.9 Multi-devises ✓
- [x] Service `deviseService.ts` + hook `useDevises.ts`
- [x] Composant `DeviseSelector.tsx`
- [x] CHF, EUR, USD supportés
- [x] Taux de change via API frankfurter.app (cache 1h)
- [x] `formatCurrency` mis à jour pour supporter toutes les devises

---

## Phase 2.5 - Back-office Admin & Corrections critiques ✅

> **Date de complétion** : 2026-02-25
> **Contexte** : Résolution de bugs critiques (boucle infinie) + création d'un back-office admin complet

### Corrections critiques apportées ✓

#### Problème de boucle infinie au login (résolu) ✓
- [x] **AuthContext.tsx** : Ajout d'un timeout de 5 secondes pour éviter le blocage infini
- [x] **AuthContext.tsx** : Création automatique du profil s'il n'existe pas
- [x] **AuthContext.tsx** : Retour d'un utilisateur minimal en cas d'erreur
- [x] **LoginPage.tsx & RegisterPage.tsx** : Suppression de la navigation manuelle (laisse `PublicOnlyRoute` gérer)
- [x] **App.tsx - ProtectedRoute** : Timeout d'1 seconde pour afficher le contenu même si `loading` est encore `true`
- [x] **DashboardPage.tsx** : Message d'erreur après 5 secondes si l'utilisateur ne se charge pas
- [x] **useInvoices.ts** : Ne reste plus bloqué en `loading: true` si pas d'utilisateur

#### Chargement progressif (Skeleton Loading) ✓
- [x] **DashboardSkeleton.tsx** (nouveau) : Composant d'affichage progressif pendant le chargement
- [x] **App.tsx** : `LazyLoadDashboard` avec React Suspense pour afficher le skeleton
- [x] **App.tsx** : Utilisation de `LazyLoadDashboard` pour la route `/dashboard`

### Back-office Admin complet ✓

#### Infrastructure Admin ✓
- [x] **Migration SQL** : Ajout des colonnes `role`, `is_active`, `blocked_at`, `blocked_reason` dans `profils`
- [x] **AdminLayout.tsx** : Layout dédié avec barre de navigation rouge (différenciation visuelle)
- [x] **AdminLoginPage.tsx** (nouveau) : Page de connexion séparée pour le back-office admin
  - Design sécurisé avec thème rouge
  - Vérification du rôle `admin` ou `super_admin` après connexion
  - Redirection automatique vers `/dashboard/admin` si autorisé
  - Déconnexion automatique si pas admin
  - Route : `/admin/login`

#### Gestion avancée des utilisateurs ✓
- [x] **AdminUsersPage.tsx** (améliorée) : Gestion complète des utilisateurs
  - Liste de tous les utilisateurs avec recherche par nom/email
  - Badges de rôle (User, Admin, Super Admin)
  - Indicateur de statut (Actif / Bloqué)
  - **Modal de détails** au clic sur un utilisateur avec :
    - Toutes les informations (email, nom, rôle, statut, dates)
    - **Changer le rôle** : User, Admin, Super Admin
    - **Bloquer l'utilisateur** avec raison (optionnel)
    - **Débloquer l'utilisateur**
    - **Supprimer définitivement** (avec confirmation en tapant "SUPPRIMER")
  - Actions tracées et confirmées

#### Autres pages Admin (existantes, à améliorer) ✓
- [x] **AdminDashboard.tsx** : Vue d'ensemble (statistiques globales, MRR, abonnements)
- [x] **AdminOrganisationsPage.tsx** : Liste des organisations avec compteurs
- [x] **AdminRemindersPage.tsx** : Rappels administratifs (à corriger : colonne `due_date` manquante)
- [x] **AdminSettingsPage.tsx** : Configuration système (taux de change, limites, feature flags)

### Routes Admin configurées ✓
- [x] Route `/admin/login` - Login séparé pour admin
- [x] Route `/dashboard/admin` - Dashboard admin
- [x] Route `/dashboard/admin/users` - Gestion utilisateurs
- [x] Route `/dashboard/admin/organisations` - Gestion organisations
- [x] Route `/dashboard/admin/rappels` - Rappels admin
- [x] Route `/dashboard/admin/settings` - Configuration système

### À corriger (bugs mineurs identifiés)
- [x] **adminReminderService.ts** : Colonne `due_date` est correcte (table admin_reminders a bien `due_date`) — vérifié 2026-03-18
- [x] **AdminDashboard.tsx** : Colonne `subscription_status` présente via migration 20260225100000 — vérifié 2026-03-18

---

## Phase 3 - Différenciation ✅ (8/8 terminées - 100%)

> **Migration** : `supabase/migrations/20260219000000_phase3_differenciation.sql` ✅ Créée
> **Tables créées** : `ocr_scans`, `comptes_bancaires`, `transactions_bancaires`, `fichiers_bancaires`, `plan_comptable`, `exercices_comptables`, `ecritures_comptables`, `declarations_tva`, `ebill_config`, `ebill_envois`, `acces_fiduciaire`, `exports_fiduciaire`, `imports`

### 3.1 Connexion e-banking (ISO 20022) ✓
- [x] Service `bankingService.ts` + hook `useBanking.ts`
- [x] Parser ISO 20022 `iso20022Parser.ts` (camt.053/054)
- [x] Générateur ISO 20022 `iso20022Generator.ts` (pain.001)
- [x] Composants : `BankAccountList`, `TransactionList`, `ImportBankFile`, `ReconciliationView`
- [x] Page `BankingPage.tsx` avec onglets (comptes, transactions, rapprochement)
- [x] Route `/dashboard/banking`
- [x] Import relevés bancaires (camt.053/054)
- [x] Réconciliation automatique des paiements avec factures
- [x] Export ordres de paiement (pain.001)

### 3.2 eBill ✓
- [x] Service `ebillService.ts` + hook `useEbill.ts`
- [x] Composants : `EbillConfig`, `EbillStatus`
- [x] Page `EbillPage.tsx`
- [x] Route `/dashboard/ebill`
- [x] Configuration participant SIX
- [x] Simulation envoi eBill
- [x] Suivi des statuts (en_attente, envoyé, accepté, refusé)

### 3.3 OCR / IA pour les dépenses ✓
- [x] Service `ocrService.ts` + hook `useOcr.ts`
- [x] Edge Function `supabase/functions/ocr-scan/index.ts` (Claude Vision API)
- [x] Composants : `OcrScanner`, `OcrResultEditor`
- [x] Page `OcrScanPage.tsx`
- [x] Scanner de reçus (upload photo)
- [x] Extraction automatique (montant, date, fournisseur, TVA)
- [x] Classification automatique des catégories
- [x] Formulaire pré-rempli pour validation

### 3.4 Comptabilité simplifiée ✓
- [x] Service `comptabiliteService.ts` + hook `useComptabilite.ts`
- [x] Composants : `PlanComptable`, `JournalEcritures`, `GrandLivre`, `Bilan`, `CompteResultat`
- [x] Page `ComptabilitePage.tsx` avec onglets
- [x] Route `/dashboard/comptabilite`
- [x] Plan comptable PME suisse (seed data système)
- [x] Journal des écritures avec filtres
- [x] Bilan (actifs/passifs)
- [x] Compte de résultat (charges/produits)
- [x] Écritures automatiques (factures, paiements, dépenses)

### 3.5 Déclaration TVA automatique ✓
- [x] Service `tvaDeclarationService.ts` + hook `useTvaDeclaration.ts`
- [x] Composants : `TvaDeclarationForm`, `TvaSummary`
- [x] Page `TvaPage.tsx`
- [x] Route `/dashboard/tva`
- [x] Calcul automatique par période (trimestriel/semestriel)
- [x] Formulaire 200 AFC interactif (chiffres 200-420)
- [x] Méthodes effective et forfaitaire
- [x] Export XML pour l'AFC
- [x] Historique des déclarations

### 3.6 Portail fiduciaire ✓
- [x] Service `fiduciaireService.ts` + hook `useFiduciaire.ts`
- [x] Composants : `FiduciaireAccess`, `FiduciaireExport`
- [x] Page `FiduciairePage.tsx`
- [x] Route `/dashboard/fiduciaire`
- [x] Gestion des accès (invitation/révocation par token)
- [x] Permissions granulaires (factures, dépenses, comptabilité, TVA)
- [x] Export données (CSV, PDF, XML)
- [x] Dashboard lecture seule pour fiduciaire

### 3.7 Application mobile (PWA) ✓
- [x] Fichier `manifest.json` (PWA)
- [x] Service Worker `sw.js` (cache offline)
- [x] Hook `usePwa.ts`
- [x] **Icônes PWA** : `icon-192.png` et `icon-512.png` créées dans `public/icons/`
- [x] **Composant `InstallPrompt.tsx`** : Bannière d'installation complète
- [x] **Meta tags PWA dans `index.html`** : viewport, theme-color, manifest, apple-touch-icon
- [x] **Service Worker enregistré** dans `index.html`

### 3.8 Import données concurrents ✓
- [x] Service `importService.ts` + hook `useImport.ts`
- [x] Composants : `ImportWizard`, `ColumnMapper`
- [x] Page `ImportPage.tsx`
- [x] Route `/dashboard/import`
- [x] Import depuis Bexio (CSV avec mapping automatique)
- [x] Import depuis Cresus (fichier avec détection format)
- [x] Import générique (CSV avec mapping manuel)
- [x] Assistant 3 étapes (Upload → Mapping → Confirmation)

---

## Phase 4 - Préparation au déploiement

### 4.1 Performance & optimisation ✓
- [x] Lazy loading de toutes les pages (React.lazy) - **60+ imports lazy dans App.tsx**
- [x] Vitest configuré pour tests
- [ ] Optimisation des images (WebP, compression) - optionnel
- [ ] Cache des données côté client (React Query ou SWR) - optionnel
- [ ] Compression Gzip/Brotli
- [ ] Lighthouse score > 90

### 4.2 SEO & Landing pages ✓
- [x] Meta tags dans `index.html` (description, viewport, theme-color)
- [x] `sitemap.xml` créé dans `public/`
- [x] Pages de contenu : HomePage, FeaturesPage, PricingPage, FaqPage, DocumentationPage
- [ ] Blog intégré (optionnel)

### 4.3 Paiement & abonnements
- [ ] Intégrer Stripe pour les paiements
- [ ] Page de checkout pour les plans
- [ ] Gestion des abonnements (upgrade, downgrade, annulation)
- [ ] Webhooks Stripe → Supabase (mise à jour du plan)
- [ ] Facturation automatique de l'abonnement
- [ ] Période d'essai gratuite (déjà en place côté DB)

### 4.4 Legal & Compliance ✓
- [x] Page Conditions Générales d'Utilisation (`CguPage.tsx`)
- [x] Page Politique de confidentialité (`ConfidentialitePage.tsx`)
- [x] Banner de consentement cookies — **fait 2026-03-18** (`CookieBanner.tsx` intégré dans App.tsx)
- [x] Conformité nLPD (nouvelle Loi sur la Protection des Données suisse) - structure en place
- [ ] Archivage 10 ans conforme - à implémenter côté DB

### 4.5 Infrastructure de déploiement
- [ ] Choisir l'hébergement (Vercel, Netlify, ou serveur suisse)
- [ ] Configurer le domaine (zenfacture.ch)
- [ ] Certificat SSL
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Environnements : dev / staging / production
- [ ] Monitoring & alertes (Sentry, LogRocket)
- [ ] Backups automatiques Supabase

### 4.6 Tests & Qualité ✅ — Mis à jour 2026-03-18
- [x] Vitest configuré dans `vite.config.ts`
- [x] `setupTests.ts` créé
- [x] Tests unitaires — **243 tests passent** (produitForm, settingsForm, expenseForm, invoiceService, clientService, utils, dateUtils, clientForm, invoiceForm)
- [x] Tests schemas Zod : `produitForm.test.ts`, `settingsForm.test.ts`, `expenseForm.test.ts`
- [x] Tests services mock Supabase : `invoiceService.test.ts`, `clientService.test.ts`
- [x] Tests E2E Playwright — `e2e/auth.spec.ts`, `e2e/invoices.spec.ts`, `playwright.config.ts`
- [x] Script `npm run test` → `vitest run`, `npm run test:e2e` → `playwright test`
- [ ] Couverture > 70% — à mesurer (`npm run test -- --coverage`)
- [ ] Audit de sécurité (OWASP)
- [ ] Tests de charge

### 4.7 Documentation ✓
- [x] Page `DocumentationPage.tsx` créée
- [x] Page `FaqPage.tsx` créée
- [ ] Documentation API (pour les développeurs) - optionnel
- [ ] Vidéos tutoriels (optionnel)

---

## Stack technique actuelle

| Composant | Technologie | Version |
|-----------|------------|---------|
| Frontend | React + TypeScript | 18.2.0 / 5.0.2 |
| Build | Vite | 4.4.5 |
| Routing | React Router DOM | 7.9.1 |
| Styling | Tailwind CSS | 3.4.17 |
| Animations | Framer Motion | 12.23.16 |
| Backend | Supabase (PostgreSQL) | 2.57.4 |
| PDF | jsPDF | 2.5.2 |
| QR-Code | qrcode | 1.5.4 |
| Charts | Chart.js | 4.5.0 |
| Forms | React Hook Form | 7.63.0 |
| Icons | Lucide React | 0.263.1 |
| Notifications | React Toastify | 11.0.5 |

## Stack à ajouter (prévue)

| Besoin | Technologie | Phase |
|--------|------------|-------|
| i18n | react-i18next | Phase 1 |
| Validation | Zod + @hookform/resolvers | Phase 1 — **✅ Fait 2026-03-18** |
| Email | Resend ou SendGrid | Phase 2 |
| Cache client | TanStack Query (React Query) | Phase 2 |
| Paiements | Stripe | Phase 4 |
| Tests E2E | Playwright | Phase 4 — **✅ Configuré 2026-03-18** |
| Monitoring | Sentry | Phase 4 |
| Mobile | React Native ou PWA | Phase 3 |

---

## Structure des fichiers clés

```
src/
├── App.tsx                          # Routing principal
├── context/AuthContext.tsx           # Authentification
├── components/
│   ├── invoices/InvoiceForm.tsx      # Formulaire facture (QR-bill)
│   ├── invoices/InvoiceModal.tsx     # Modal facture
│   ├── clients/ClientForm.tsx       # Formulaire client (modal)
│   ├── produits/ProduitForm.tsx     # Formulaire produit (modal)
│   ├── common/DeviseSelector.tsx    # Sélecteur de devise
│   ├── dashboard/Sidebar.tsx        # Navigation latérale
│   ├── dashboard/SummaryCards.tsx    # KPIs dashboard
│   └── ui/                          # Design system
├── services/
│   ├── invoiceService.ts            # CRUD factures
│   ├── clientService.ts             # CRUD clients
│   ├── produitService.ts            # CRUD produits
│   ├── devisService.ts              # CRUD devis
│   ├── avoirService.ts              # CRUD avoirs
│   ├── recurrenceService.ts         # CRUD factures récurrentes
│   ├── rappelService.ts             # CRUD rappels
│   ├── templateService.ts           # CRUD templates facture
│   ├── deviseService.ts             # Taux de change
│   ├── teamService.ts               # Gestion équipe
│   ├── organisationService.ts       # Organisations
│   ├── supportService.ts            # Tickets support
│   └── apiKeyService.ts             # Clés API
├── hooks/
│   ├── useInvoices.ts               # Hook factures
│   ├── useClients.ts                # Hook clients
│   ├── useProduits.ts               # Hook produits
│   ├── useDevis.ts                  # Hook devis
│   ├── useAvoirs.ts                 # Hook avoirs
│   ├── useRecurrences.ts            # Hook récurrences
│   ├── useRappels.ts                # Hook rappels
│   ├── useTemplates.ts              # Hook templates
│   ├── useDevises.ts                # Hook devises
│   ├── useSubscriptionFeatures.ts   # Gestion plans
│   └── useTrial.ts                  # Période d'essai
├── pages/
│   ├── dashboard/
│   │   ├── ClientsPage.tsx          # Gestion clients
│   │   ├── ProduitsPage.tsx         # Catalogue produits
│   │   ├── DevisPage.tsx            # Devis/Offres
│   │   ├── AvoirsPage.tsx           # Notes de crédit
│   │   ├── RecurrencesPage.tsx      # Factures récurrentes
│   │   └── ...                      # Autres pages dashboard
│   └── (public pages)               # Pages publiques
└── types/                           # Définitions TypeScript
```

---

## Fichiers de migration Supabase

| Fichier | Statut | Notes |
|---------|--------|-------|
| `00000000000000_consolidated_setup.sql` | Exécuté | Migration principale (remplace toutes les autres) |
| `20260218000000_unifier_tables_francais.sql` | **A exécuter** | Phase 1 : unification DB en français |
| `20260218100000_phase2_fonctionnalites.sql` | **A exécuter** | Phase 2 : nouvelles tables (produits, devis, avoirs, etc.) |
| `20240101000000_create_invoices_table.sql` | Obsolète | Remplacé par la consolidée |
| `20240919200000_ajout_fonctionnalites_saas.sql` | Obsolète | Remplacé (avait le bug auth.utilisateurs) |
| `20240922120000_add_trial_*.sql` (x2) | Obsolète | Remplacé (tentait de modifier auth.users) |
| `20241006*_fix_*.sql` (x7) | Obsolète | Patchs successifs, tous remplacés |
| `20241016120000_create_expenses_table.sql` | Obsolète | Remplacé par la consolidée |

---

## Notes & Décisions

- **Nommage DB** : Unifié en français (Phase 1). Tables : `factures`, `depenses`, `rappels`, `clients`, `produits`, `devis`, `avoirs`, `factures_recurrentes`, `templates_facture`.
- **Hébergement** : Pour un SaaS suisse, héberger les données en Suisse est un argument de vente fort (conformité nLPD). Considérer Infomaniak, Exoscale, ou Supabase self-hosted.
- **Pricing** : Positionnement recommandé entre 19-35 CHF/mois pour concurrencer Bexio (45 CHF+) tout en offrant un produit moderne.
- **Plan gratuit** : Envisager un plan freemium limité (ex: 5 factures/mois) pour l'acquisition d'utilisateurs.
- **Back-office Admin** : Login séparé sur `/admin/login` avec vérification des rôles. Design rouge pour différenciation visuelle.
- **Phase 3** : Implémentation complète découverte le 2026-02-25 après vérification. 7/8 fonctionnalités terminées (seules les icônes PWA manquent).

---

## Changelog

### 2026-03-18 - Planification Phases 5-7 (Roadmap mis à jour)
- 📋 **Analyse concurrentielle Bexio complète** : identification des fonctionnalités manquantes
- 📋 **Phase 5 planifiée** : cron récurrences, archivage 10 ans nLPD, time tracking, payroll Swissdec
- 📋 **Phase 6 planifiée** : batch facturation, gestion stocks, estimation impôts, multi-marques
- 📋 **Phase 7 planifiée** : envoi postal Swiss Post, fraude IA, blockchain audit, boutique/POS
- 📋 **Tableau différenciateurs** : mise en évidence des avantages ZenFacture vs Bexio déjà en place
- ℹ️ Apps mobiles natives et Stripe abonnements : reportés après les phases 5-7

### 2026-03-18 - Priorité Moyenne & Basse — Complétées ✅
- ✅ **InvoiceModal.tsx** : Statut facture mis à `sent` après envoi email réussi + rafraîchissement liste parente
- ✅ **DevisPage.tsx** : Bouton "Envoyer" (icône Mail) avec modal email + statut → `envoye` après envoi
- ✅ **AvoirsPage.tsx** : Bouton "Envoyer" (icône Mail) avec modal email + statut → `emis` après envoi
- ✅ **CookieBanner.tsx** : Intégré dans `App.tsx` (toutes les pages) — RGPD/nLPD conforme
- ✅ **Validation Zod** : 5 formulaires couverts (ProduitForm, ProfilePage, SettingsPage OrgForm, ExpensesPage, NewInvoiceModal)
- ✅ **Tests unitaires** : 5 nouveaux fichiers (produitForm, settingsForm, expenseForm, invoiceService, clientService) — 243 tests passent
- ✅ **Tests E2E Playwright** : `playwright.config.ts` + `e2e/auth.spec.ts` + `e2e/invoices.spec.ts`
- ✅ **Scripts npm** : `test` → `vitest run`, `test:watch`, `test:e2e`, `test:e2e:ui`
- ✅ **Bugs admin confirmés résolus** : `adminReminderService.ts` utilise bien `due_date`, `subscription_status` présent en DB

### 2026-03-17 - Design & UX Dashboard + Corrections ✅
- ✅ **Sidebar** : Refonte complète dark theme + navigation groupée en 6 catégories pliables + localStorage persist
- ✅ **DashboardPage** : StatCards gradient colorées + graphique CA mensuel Chart.js + header amélioré
- ✅ **DashboardLayout** : Top header avec titre de page dynamique + avatar + cloche notifications
- ✅ **FeaturesPage** : Ajout export default manquant (page blanche corrigée) + classes Tailwind `-500` fixes
- ✅ **PublicLayout** : Liens nav/footer corrigés (fonctionnalites, tarifs, aide)
- ✅ **SettingsPage** : Personnalisation logo + couleurs facture + lien BillingPage corrigé
- ✅ **InvoiceModal** : Données org toujours fraîches (IBAN, nom, adresse) + logo/couleurs dans PDF
- ✅ **emailService** : Logo + couleurs dynamiques dans PDF joint à l'email

### 2026-03-13 - Paiement en ligne (Payrexx + Stripe) ✅
- ✅ **payrexxService.ts** : `createPaymentLink()`, `getExistingPaymentLink()`, `toCents()`
- ✅ **create-payment-link Edge Function** : Payrexx (TWINT, PostFinance, cartes) ou Stripe (fallback), cache 30j, RLS
- ✅ **InvoiceModal.tsx** : Bouton "Payer en ligne" (vert), bannière avec URL copyable + lien externe
- ✅ **Migration SQL** : Table `payment_links` avec RLS, index, trigger updated_at

> **⚠️ Configuration requise** :
> - Payrexx : `PAYREXX_INSTANCE` + `PAYREXX_API_KEY` (https://payrexx.com)
> - Stripe (optionnel) : `STRIPE_SECRET_KEY`
> - `APP_URL` : URL de production (ex: https://zenfacture.ch)

### 2026-03-13 - Email + TWINT ✅
- ✅ **send-email Edge Function** : Créée avec templates facture + rappel + générique (Resend)
- ✅ **emailService.ts** : Service frontend avec `sendInvoiceEmail()`, `sendReminderEmail()`, `generatePdfBase64()`
- ✅ **InvoiceModal.tsx** : Bouton "Envoyer", modal confirmation avec adresse email pré-remplie, spinner, feedback succès/erreur
- ✅ **TWINT** : Lien de paiement `twint://` dans la section QR-bill (différenciateur vs concurrents)

### 2026-03-13 - Corrections QR-Bill & PDF ✅
- ✅ **swissQrService.ts** : Service unifié SPC v2.0 avec validation IBAN MOD-97
- ✅ **InvoiceModal.tsx** : Adresses structurées (type S), IBAN hardcodé supprimé, erreurs affichées à l'utilisateur
- ✅ **InvoiceForm.tsx** : Migration vers swissQrService, debounce 600ms, import QRCode supprimé
- ✅ **Export PDF réel** : Remplacement de la boîte d'impression par un vrai PDF jsPDF avec QR code embarqué et section QR-bill conforme

### 2026-02-25 - Phase 3 TERMINÉE ✅ 🎉
- ✅ **PWA icônes créées** : Générées avec `rsvg-convert` (192x192 et 512x512)
- ✅ **Phase 3 à 100%** : Toutes les 8 fonctionnalités de différenciation complètes
- ✅ **Phase 4 partiellement faite** : 4.1, 4.2, 4.4, 4.7 déjà implémentés (40%)
- 📋 **Ce qui reste** : Email (Phase 2), Stripe (4.3), Infrastructure (4.5), Tests (4.6)

### 2026-02-25 - Phase 3 découverte complète ✅
- 🔍 **Analyse complète** : Vérification de tous les fichiers du projet
- ✅ **Phase 3 confirmée** : 7/8 fonctionnalités complètement implémentées (88%)
- ✅ **Migration Phase 3** : `20260219000000_phase3_differenciation.sql` existe avec 13 nouvelles tables
- ✅ **Toutes les routes Phase 3** : banking, comptabilite, tva, ebill, fiduciaire, import, ocr
- ⚠️ **PWA partiel** : Structure faite mais icônes manquantes
- 📋 **ROADMAP corrigé** : Statut Phase 3 mis à jour de 0% → 88%

### 2026-02-25 - Phase 2.5 complétée ✅
- ✅ **Correction critique** : Résolution de la boucle infinie au login/inscription
- ✅ **Skeleton Loading** : Ajout du chargement progressif avec `DashboardSkeleton`
- ✅ **Back-office Admin** : Système complet de gestion admin avec login séparé
- ✅ **Gestion utilisateurs** : Modal détaillé avec actions (bloquer, supprimer, changer rôle)
- ✅ **Migration SQL** : Ajout des colonnes `role`, `is_active`, `blocked_at`, `blocked_reason`
- 🔧 **Bugs identifiés** : Colonnes manquantes (`due_date`, `subscription_status`) à corriger

### 2026-02-18 - Phase 2 en cours
- ✅ Phase 1 terminée (Nettoyage, conformité, i18n)
- ✅ 8/9 étapes Phase 2 terminées (email reporté)
- 📋 Migrations créées : `20260218000000_unifier_tables_francais.sql` + `20260218100000_phase2_fonctionnalites.sql`

---

*Ce fichier est mis à jour au fur et à mesure de l'avancement du projet.*
