# ZenFacture 🇨🇭

**Solution de facturation SaaS conçue pour les indépendants et PME suisses.**

ZenFacture couvre l'ensemble du cycle de facturation : devis → facture → paiement → comptabilité, avec conformité suisse (TVA, QR-facture, IBAN, e-Bill).

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Base de données (Supabase)](#base-de-données-supabase)
- [Tests](#tests)
- [Déploiement](#déploiement)

---

## Fonctionnalités

### Facturation
- ✅ Création et gestion de **factures** (PDF, QR-facture suisse)
- ✅ **Devis** avec conversion en facture en un clic
- ✅ **Avoirs** (notes de crédit)
- ✅ **Factures récurrentes** automatiques
- ✅ Envoi par email directement depuis l'application
- ✅ Suivi des statuts (brouillon, envoyé, payé, en retard)
- ✅ Rappels automatiques pour les factures impayées

### Gestion
- ✅ **Clients** (carnet d'adresses complet)
- ✅ **Produits & services** (catalogue avec TVA)
- ✅ **Dépenses** (suivi des charges)
- ✅ **Équipe** (multi-utilisateurs par organisation)
- ✅ **Devis → Facture** en un clic

### Comptabilité & Conformité suisse
- ✅ **TVA suisse** (8.1%, 2.6%, 3.8%) — déclarations périodiques
- ✅ **QR-facture** (Swiss QR Code / ISO 20022)
- ✅ **e-Bill** (facture électronique B2B)
- ✅ **Banking** — import de fichiers ISO 20022 / CAMT
- ✅ **Comptabilité** — plan comptable, grand livre, journal, bilan, compte de résultat
- ✅ **Fiduciaire** — portail d'accès pour expert-comptable
- ✅ **Multi-devises**

### Productivité
- ✅ **OCR** — scan et reconnaissance de documents
- ✅ **Import** — import de données (clients, produits, factures)
- ✅ **Templates** de factures personnalisables (couleurs, logo)
- ✅ **API** avec gestion de clés API
- ✅ **Rapports** et tableaux de bord

### Technique
- ✅ **PWA** (Progressive Web App — installable sur mobile)
- ✅ **Internationalisation** FR / EN / DE
- ✅ **Cookie Banner** conforme nLPD/RGPD
- ✅ **Admin** — tableau de bord super-admin (utilisateurs, organisations, rappels)
- ✅ Période d'essai 30 jours

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Styles | Tailwind CSS |
| Formulaires | React Hook Form + Zod |
| State | React Query (TanStack) |
| Backend/BDD | Supabase (PostgreSQL + Auth + Storage) |
| Email | Supabase Edge Functions + Resend |
| Paiements | Payrexx |
| Tests unitaires | Vitest |
| Tests E2E | Playwright |
| Icons | Lucide React + Heroicons |
| PDF | jsPDF + html2canvas |
| Animations | Framer Motion |
| i18n | i18next |

---

## Prérequis

- **Node.js** >= 18
- **npm** >= 9
- Un compte **Supabase** (gratuit)

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Lecomte0015/zenfacture.git
cd zenfacture

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# 4. Lancer en développement
npm run dev
```

L'application sera disponible sur **http://localhost:5173**

---

## Variables d'environnement

Copiez `.env.example` vers `.env` et renseignez :

```env
# Supabase — obligatoire
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key

# Supabase Service Role — pour les Edge Functions uniquement (ne pas exposer côté client)
VITE_SERVICE_ROLE_KEY=votre_service_role_key

# Environnement
NODE_ENV=development
```

> ⚠️ Ne jamais committer le fichier `.env`. Il est exclu par `.gitignore`.

---

## Scripts disponibles

```bash
# Développement
npm run dev          # Lance le serveur de dev (http://localhost:5173)

# Production
npm run build        # Compile TypeScript + bundle Vite
npm run preview      # Prévisualise le build de production

# Tests unitaires (Vitest)
npm run test         # Lance tous les tests une fois
npm run test:watch   # Mode watch (rechargement automatique)

# Tests E2E (Playwright)
npm run test:e2e     # Lance les tests end-to-end
npm run test:e2e:ui  # Lance les tests avec l'interface Playwright
```

---

## Structure du projet

```
zenfacture/
├── e2e/                          # Tests E2E Playwright
│   ├── auth.spec.ts
│   └── invoices.spec.ts
├── public/                       # Assets statiques + PWA
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── src/
│   ├── __tests__/               # Tests unitaires Vitest
│   ├── components/
│   │   ├── admin/               # Composants admin
│   │   ├── banking/             # Gestion bancaire
│   │   ├── clients/             # Gestion clients
│   │   ├── common/              # Composants réutilisables (CookieBanner, SEO…)
│   │   ├── comptabilite/        # Comptabilité
│   │   ├── dashboard/           # Widgets dashboard
│   │   ├── devis/               # Formulaires devis
│   │   ├── invoices/            # Modals / formulaires factures
│   │   ├── produits/            # Catalogue produits
│   │   ├── tva/                 # Déclarations TVA
│   │   └── ui/                  # Composants UI de base
│   ├── context/                 # React Contexts (Auth, Organisation)
│   ├── hooks/                   # Hooks personnalisés (useInvoices, useClients…)
│   ├── i18n/                    # Traductions FR / EN / DE
│   ├── layouts/                 # Layouts (Public, Dashboard, Admin)
│   ├── lib/                     # Clients Supabase, utilitaires
│   ├── pages/
│   │   ├── admin/               # Pages super-admin
│   │   ├── dashboard/           # Pages de l'application
│   │   └── *.tsx                # Pages publiques (Home, Pricing, FAQ…)
│   ├── services/                # Couche d'accès aux données (Supabase)
│   ├── types/                   # Types TypeScript
│   └── utils/                   # Utilitaires (format, erreurs…)
├── supabase/
│   ├── functions/               # Edge Functions (email, OCR, paiements…)
│   └── migrations/              # Migrations SQL
├── playwright.config.ts
├── vite.config.ts
├── tailwind.config.js
└── .env.example
```

---

## Base de données (Supabase)

Les migrations SQL se trouvent dans `supabase/migrations/`. Pour les appliquer :

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement via l'interface Supabase SQL Editor
# Exécuter les fichiers dans l'ordre chronologique
```

### Principales tables

| Table | Description |
|-------|-------------|
| `organizations` | Organisations (multi-tenant) |
| `organization_users` | Membres par organisation |
| `invoices` | Factures |
| `invoice_items` | Lignes de facture |
| `clients` | Clients |
| `devis` | Devis |
| `avoirs` | Avoirs / notes de crédit |
| `produits` | Catalogue produits |
| `expenses` | Dépenses |
| `reminders` | Rappels automatiques |
| `templates` | Modèles de documents |

### Edge Functions Supabase

| Fonction | Rôle |
|----------|------|
| `send-email` | Envoi d'emails transactionnels |
| `send-reminders` | Rappels de paiement automatisés |
| `send-trial-reminders` | Rappels fin de période d'essai |
| `ocr-scan` | Reconnaissance optique de caractères |
| `create-payment-link` | Création de liens de paiement Payrexx |

---

## Tests

### Tests unitaires (Vitest)

```bash
npm run test
```

Couvre :
- Schemas de validation Zod (formulaires clients, produits, dépenses, paramètres, factures)
- Services Supabase (invoiceService, clientService)
- Utilitaires (formatDate, formatIbanDisplay, hexToRgb…)
- Composants React (authentification)

### Tests E2E (Playwright)

```bash
# Démarrer l'app en dev, puis :
npm run test:e2e
```

Couvre :
- Redirection vers login si non authentifié
- Formulaire de connexion (champs, erreurs)
- Navigation entre pages publiques
- Cookie banner (affichage, acceptation)

---

## Déploiement

### Build de production

```bash
npm run build
# Le dossier dist/ contient le build prêt à déployer
```

Compatible avec : **Vercel**, **Netlify**, **Cloudflare Pages**, ou tout hébergeur de fichiers statiques.

### Variables d'environnement en production

Configurer dans votre hébergeur :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Licence

Projet privé — © 2026 ZenFacture. Tous droits réservés.
