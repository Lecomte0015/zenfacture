#!/bin/bash

# Script de déploiement pour la fonction d'envoi de rappels d'essai

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Déploiement de la fonction d'envoi de rappels d'essai ===${NC}\n"

# Vérifier si la CLI Supabase est installée
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}La CLI Supabase n'est pas installée. Veuillez l'installer avec :${NC}"
    echo -e "npm install -g supabase\n"
    exit 1
fi

# Demander les informations de configuration
read -p "Entrez la référence de votre projet Supabase (ex: xyzabc123) : " PROJECT_REF
read -p "Entrez votre clé de service Supabase (trouvable dans les paramètres du projet) : " SERVICE_ROLE_KEY
read -p "URL de votre site (ex: https://votresite.com) : " SITE_URL
read -p "Adresse e-mail expéditrice (ex: no-reply@votredomaine.com) : " EMAIL_FROM

# Vérifier que les champs obligatoires sont remplis
if [ -z "$PROJECT_REF" ] || [ -z "$SERVICE_ROLE_KEY" ] || [ -z "$SITE_URL" ] || [ -z "$EMAIL_FROM" ]; then
    echo -e "${RED}Tous les champs sont obligatoires.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Configuration :${NC}"
echo "- Projet Supabase: $PROJECT_REF"
echo "- URL du site: $SITE_URL"
echo "- E-mail expéditeur: $EMAIL_FROM"
echo ""

read -p "Voulez-vous continuer le déploiement ? (o/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}Déploiement annulé.${NC}"
    exit 1
fi

# Se connecter à Supabase
echo -e "\n${YELLOW}Connexion à Supabase...${NC}"
supabase login

if [ $? -ne 0 ]; then
    echo -e "${RED}Échec de la connexion à Supabase. Vérifiez vos identifiants.${NC}"
    exit 1
fi

# Déployer la fonction
echo -e "\n${YELLOW}Déploiement de la fonction send-trial-reminders...${NC}"
supabase functions deploy send-trial-reminders --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo -e "${RED}Échec du déploiement de la fonction.${NC}"
    exit 1
fi

# Configurer les variables d'environnement
echo -e "\n${YELLOW}Configuration des variables d'environnement...${NC}"
supabase secrets set --project-ref $PROJECT_REF \
  SUPABASE_URL="https://$PROJECT_REF.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
  SITE_URL="$SITE_URL" \
  EMAIL_FROM="$EMAIL_FROM"

if [ $? -ne 0 ]; then
    echo -e "${RED}Échec de la configuration des variables d'environnement.${NC}"
    exit 1
fi

# Configurer le déclencheur CRON
echo -e "\n${YELLOW}Configuration du déclencheur CRON...${NC}"
SQL_COMMAND="
-- Créer ou mettre à jour le job CRON
select
  cron.schedule(
    'send-trial-reminders-daily',
    '0 9 * * *', -- Tous les jours à 9h00 UTC
    \$\$
    select
      net.http_post(
        url := 'https://$PROJECT_REF.supabase.co/functions/v1/send-trial-reminders',
        headers := '{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer $SERVICE_ROLE_KEY\"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
    \$\$
  );
"

echo "Exécution de la commande SQL..."
echo "$SQL_COMMAND" | supabase sql --db-url="postgresql://postgres:postgres@db.$PROJECT_REF.supabase.co:5432/postgres"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Impossible de configurer automatiquement le déclencheur CRON.${NC}"
    echo -e "Veuillez exécuter manuellement la commande SQL suivante dans l'éditeur SQL de Supabase :\n"
    echo "$SQL_COMMAND"
else
    echo -e "${GREEN}Le déclencheur CRON a été configuré avec succès.${NC}"
fi

echo -e "\n${GREEN}✓ Déploiement terminé avec succès !${NC}"
echo -e "\n${YELLOW}Prochaines étapes :${NC}"
echo "1. Vérifiez que la fonction est bien déployée dans l'interface Supabase"
echo "2. Vérifiez que les variables d'environnement sont correctement configurées"
echo "3. Testez la fonction manuellement depuis l'interface Supabase"
echo -e "\nPour plus d'informations, consultez la documentation : docs/PERIODE_ESSAI.md"
