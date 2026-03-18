#!/bin/bash

# Vérifier que les variables d'environnement nécessaires sont définies
if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "Erreur : Les variables d'environnement SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_REF doivent être définies"
  exit 1
fi

# URL de l'API Supabase
API_URL="https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/functions/send-reminders"

# En-têtes pour l'authentification
HEADERS=(
  "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
  "Content-Type: application/json"
)

# Vérifier si la fonction existe déjà
echo "Vérification de l'existence de la fonction send-reminders..."
EXISTING_FUNCTION=$(curl -s -X GET "$API_URL" -H "${HEADERS[0]}" -H "${HEADERS[1]}")

if [[ "$EXISTING_FUNCTION" == *"Function not found"* ]]; then
  echo "La fonction send-reminders n'existe pas. Veuillez d'abord la déployer."
  exit 1
fi

# URL de l'API CRON
CRON_API_URL="https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/functions/send-reminders/schedules"

# Vérifier s'il existe déjà une planification
EXISTING_CRON=$(curl -s -X GET "$CRON_API_URL" -H "${HEADERS[0]}" -H "${HEADERS[1]}")

# Créer ou mettre à jour la planification CRON
if [[ "$EXISTING_CRON" == *"[]"* ]]; then
  echo "Création d'une nouvelle planification CRON..."
  curl -X POST "$CRON_API_URL" \
    -H "${HEADERS[0]}" \
    -H "${HEADERS[1]}" \
    -d '{
      "cron": "0 9 * * *",  # Tous les jours à 9h00
      "name": "daily-reminders",
      "enabled": true
    }'
else
  # Mettre à jour la planification existante
  SCHEDULE_ID=$(echo "$EXISTING_CRON" | jq -r '.[0].id')
  echo "Mise à jour de la planification existante (ID: $SCHEDULE_ID)..."
  
  curl -X PATCH "$CRON_API_URL/$SCHEDULE_ID" \
    -H "${HEADERS[0]}" \
    -H "${HEADERS[1]}" \
    -d '{
      "cron": "0 9 * * *",  # Tous les jours à 9h00
      "enabled": true
    }'
fi

echo "Configuration CRON terminée avec succès !"
