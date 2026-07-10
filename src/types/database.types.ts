export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          description: string
          amount: number
          category: string
          date: string
          status: string
          receipt_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          description: string
          amount: number
          category: string
          date: string
          status?: string
          receipt_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          description?: string
          amount?: number
          category?: string
          date?: string
          status?: string
          receipt_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          id: string
          email: string
          organization_id: string
          invited_by: string | null
          role: string
          token: string
          accepted: boolean
          created_at: string
          metadata: Json | null
        }
        Insert: {
          email: string
          organization_id: string
          invited_by?: string | null
          role: string
          token: string
          accepted?: boolean
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          email?: string
          organization_id?: string
          invited_by?: string | null
          role?: string
          token?: string
          accepted?: boolean
          created_at?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          user_id: string
          organization_id: string
          role: string
          permissions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          organization_id: string
          role: string
          permissions: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          organization_id?: string
          role?: string
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          raw_user_meta_data: Json | null
          last_sign_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          raw_user_meta_data?: Json | null
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          raw_user_meta_data?: Json | null
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profils: {
        Row: {
          id: string
          email: string | null
          name: string | null
          plan_abonnement: string
          trial_start_date: string | null
          trial_end_date: string | null
          avatar_url: string | null
          role: string
          is_active: boolean
          blocked_at: string | null
          blocked_reason: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          subscription_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          plan_abonnement?: string
          trial_start_date?: string | null
          trial_end_date?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          blocked_at?: string | null
          blocked_reason?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          plan_abonnement?: string
          trial_start_date?: string | null
          trial_end_date?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          blocked_at?: string | null
          blocked_reason?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          id: string
          nom_organisation: string
          adresse: string | null
          code_postal: string | null
          ville: string | null
          pays: string
          iban: string | null
          numero_tva: string | null
          email: string | null
          telephone: string | null
          site_web: string | null
          logo_url: string | null
          subscription_status: string
          subscription_plan: string
          primary_color: string
          header_bg_color: string
          font_family: string
          qr_position: string
          address_spacing: string
          profil_metier: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom_organisation: string
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          pays?: string
          iban?: string | null
          numero_tva?: string | null
          email?: string | null
          telephone?: string | null
          site_web?: string | null
          logo_url?: string | null
          subscription_status?: string
          subscription_plan?: string
          primary_color?: string
          header_bg_color?: string
          font_family?: string
          qr_position?: string
          address_spacing?: string
          profil_metier?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom_organisation?: string
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          pays?: string
          iban?: string | null
          numero_tva?: string | null
          email?: string | null
          telephone?: string | null
          site_web?: string | null
          logo_url?: string | null
          subscription_status?: string
          subscription_plan?: string
          primary_color?: string
          header_bg_color?: string
          font_family?: string
          qr_position?: string
          address_spacing?: string
          profil_metier?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      utilisateurs_organisations: {
        Row: {
          id: string
          utilisateur_id: string
          organisation_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          utilisateur_id: string
          organisation_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          utilisateur_id?: string
          organisation_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilisateurs_organisations_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilisateurs_organisations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      factures: {
        Row: {
          id: string
          organisation_id: string
          client_id: string | null
          template_id: string | null
          facture_recurrente_id: string | null
          invoice_number: string
          date: string
          due_date: string | null
          status: string
          items: Json
          subtotal: number
          tax: number
          total: number
          devise: string
          notes: string | null
          currency: string
          client_name: string | null
          client_email: string | null
          client_address: string | null
          payment_terms: string | null
          iban: string | null
          qr_reference: string | null
          user_id: string
          archived_at: string | null
          archive_expiry_at: string | null
          archive_hash: string | null
          marque_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id?: string
          client_id?: string | null
          template_id?: string | null
          facture_recurrente_id?: string | null
          invoice_number: string
          date: string
          due_date?: string | null
          status?: string
          items?: Json
          subtotal?: number
          tax?: number
          total?: number
          devise?: string
          notes?: string | null
          currency?: string
          client_name?: string | null
          client_email?: string | null
          client_address?: string | null
          payment_terms?: string | null
          iban?: string | null
          qr_reference?: string | null
          user_id: string
          archived_at?: string | null
          archive_expiry_at?: string | null
          archive_hash?: string | null
          marque_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          client_id?: string | null
          template_id?: string | null
          facture_recurrente_id?: string | null
          invoice_number?: string
          date?: string
          due_date?: string | null
          status?: string
          items?: Json
          subtotal?: number
          tax?: number
          total?: number
          devise?: string
          notes?: string | null
          currency?: string
          client_name?: string | null
          client_email?: string | null
          client_address?: string | null
          payment_terms?: string | null
          iban?: string | null
          qr_reference?: string | null
          user_id?: string
          archived_at?: string | null
          archive_expiry_at?: string | null
          archive_hash?: string | null
          marque_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      depenses: {
        Row: {
          id: string
          organisation_id: string
          description: string
          montant: number
          categorie: string
          date: string
          statut: string
          recu_url: string | null
          notes: string | null
          utilisateur_id: string
          archived_at: string | null
          archive_expiry_at: string | null
          archive_hash: string | null
          cree_le: string
          mis_a_jour_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          description: string
          montant: number
          categorie: string
          date: string
          statut?: string
          recu_url?: string | null
          notes?: string | null
          utilisateur_id: string
          archived_at?: string | null
          archive_expiry_at?: string | null
          archive_hash?: string | null
          cree_le?: string
          mis_a_jour_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          description?: string
          montant?: number
          categorie?: string
          date?: string
          statut?: string
          recu_url?: string | null
          notes?: string | null
          utilisateur_id?: string
          archived_at?: string | null
          archive_expiry_at?: string | null
          archive_hash?: string | null
          cree_le?: string
          mis_a_jour_le?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          organisation_id: string
          nom: string
          prenom: string | null
          entreprise: string | null
          email: string | null
          telephone: string | null
          adresse: string | null
          code_postal: string | null
          ville: string | null
          pays: string
          numero_client: string | null
          devise_preferee: string
          conditions_paiement: number
          notes: string | null
          cree_le: string
          mis_a_jour_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          nom: string
          prenom?: string | null
          entreprise?: string | null
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          pays?: string
          numero_client?: string | null
          devise_preferee?: string
          conditions_paiement?: number
          notes?: string | null
          cree_le?: string
          mis_a_jour_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          nom?: string
          prenom?: string | null
          entreprise?: string | null
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          pays?: string
          numero_client?: string | null
          devise_preferee?: string
          conditions_paiement?: number
          notes?: string | null
          cree_le?: string
          mis_a_jour_le?: string
        }
        Relationships: []
      }
      cles_api: {
        Row: {
          id: string
          organisation_id: string
          nom: string
          cle: string
          active: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          nom: string
          cle: string
          active?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          nom?: string
          cle?: string
          active?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          organisation_id: string
          utilisateur_id: string
          titre: string
          description: string
          statut: string
          priorite: string
          cree_le: string
          mis_a_jour_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          utilisateur_id: string
          titre: string
          description: string
          statut?: string
          priorite?: string
          cree_le?: string
          mis_a_jour_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          utilisateur_id?: string
          titre?: string
          description?: string
          statut?: string
          priorite?: string
          cree_le?: string
          mis_a_jour_le?: string
        }
        Relationships: []
      }
      commentaires_tickets: {
        Row: {
          id: string
          ticket_id: string
          utilisateur_id: string
          contenu: string
          organisation_id: string
          cree_le: string
        }
        Insert: {
          id?: string
          ticket_id: string
          utilisateur_id: string
          contenu: string
          organisation_id: string
          cree_le?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          utilisateur_id?: string
          contenu?: string
          organisation_id?: string
          cree_le?: string
        }
        Relationships: []
      }
      invitations_organisation: {
        Row: {
          id: string
          organisation_id: string
          email: string
          role: string
          invite_par: string | null
          token: string
          acceptee: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          email: string
          role?: string
          invite_par?: string | null
          token: string
          acceptee?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          email?: string
          role?: string
          invite_par?: string | null
          token?: string
          acceptee?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      produits: {
        Row: {
          id: string
          organisation_id: string
          nom: string
          description: string | null
          prix_unitaire: number
          taux_tva: number
          unite: string
          categorie: string | null
          actif: boolean
          cree_le: string
          mis_a_jour_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          nom: string
          description?: string | null
          prix_unitaire?: number
          taux_tva?: number
          unite?: string
          categorie?: string | null
          actif?: boolean
          cree_le?: string
          mis_a_jour_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          nom?: string
          description?: string | null
          prix_unitaire?: number
          taux_tva?: number
          unite?: string
          categorie?: string | null
          actif?: boolean
          cree_le?: string
          mis_a_jour_le?: string
        }
        Relationships: []
      }
      devis: {
        Row: {
          id: string
          organisation_id: string
          client_id: string | null
          numero_devis: string
          date_devis: string
          date_validite: string | null
          statut: string
          articles: Json
          sous_total: number
          total_tva: number
          total: number
          devise: string
          notes: string | null
          conditions: string | null
          facture_id: string | null
          marque_id: string | null
          archived_at: string | null
          archive_expiry_at: string | null
          archive_hash: string | null
          cree_le: string
          mis_a_jour_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          client_id?: string | null
          numero_devis: string
          date_devis?: string
          date_validite?: string | null
          statut?: string
          articles?: Json
          sous_total?: number
          total_tva?: number
          total?: number
          devise?: string
          notes?: string | null
          conditions?: string | null
          facture_id?: string | null
          marque_id?: string | null
          archived_at?: string | null
          archive_expiry_at?: string | null
          archive_hash?: string | null
          cree_le?: string
          mis_a_jour_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          client_id?: string | null
          numero_devis?: string
          date_devis?: string
          date_validite?: string | null
          statut?: string
          articles?: Json
          sous_total?: number
          total_tva?: number
          total?: number
          devise?: string
          notes?: string | null
          conditions?: string | null
          facture_id?: string | null
          marque_id?: string | null
          archived_at?: string | null
          archive_expiry_at?: string | null
          archive_hash?: string | null
          cree_le?: string
          mis_a_jour_le?: string
        }
        Relationships: []
      }
      avoirs: {
        Row: {
          id: string
          organisation_id: string
          client_id: string | null
          facture_id: string | null
          numero_avoir: string
          date_avoir: string
          statut: string
          articles: Json
          sous_total: number
          total_tva: number
          total: number
          devise: string
          motif: string | null
          notes: string | null
          archived_at: string | null
          archive_expiry_at: string | null
          archive_hash: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          client_id?: string | null
          facture_id?: string | null
          numero_avoir: string
          date_avoir?: string
          statut?: string
          articles?: Json
          sous_total?: number
          total_tva?: number
          total?: number
          devise?: string
          motif?: string | null
          notes?: string | null
          archived_at?: string | null
          archive_expiry_at?: string | null
          archive_hash?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          client_id?: string | null
          facture_id?: string | null
          numero_avoir?: string
          date_avoir?: string
          statut?: string
          articles?: Json
          sous_total?: number
          total_tva?: number
          total?: number
          devise?: string
          motif?: string | null
          notes?: string | null
          archived_at?: string | null
          archive_expiry_at?: string | null
          archive_hash?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      factures_recurrentes: {
        Row: {
          id: string
          organisation_id: string
          client_id: string | null
          nom: string
          articles: Json
          sous_total: number
          total_tva: number
          total: number
          devise: string
          frequence: string
          jour_emission: number
          prochaine_emission: string | null
          derniere_emission: string | null
          date_debut: string
          date_fin: string | null
          actif: boolean
          notes: string | null
          envoi_auto: boolean
          cree_le: string
          mis_a_jour_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          client_id?: string | null
          nom: string
          articles?: Json
          sous_total?: number
          total_tva?: number
          total?: number
          devise?: string
          frequence?: string
          jour_emission?: number
          prochaine_emission?: string | null
          derniere_emission?: string | null
          date_debut?: string
          date_fin?: string | null
          actif?: boolean
          notes?: string | null
          envoi_auto?: boolean
          cree_le?: string
          mis_a_jour_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          client_id?: string | null
          nom?: string
          articles?: Json
          sous_total?: number
          total_tva?: number
          total?: number
          devise?: string
          frequence?: string
          jour_emission?: number
          prochaine_emission?: string | null
          derniere_emission?: string | null
          date_debut?: string
          date_fin?: string | null
          actif?: boolean
          notes?: string | null
          envoi_auto?: boolean
          cree_le?: string
          mis_a_jour_le?: string
        }
        Relationships: []
      }
      templates_facture: {
        Row: {
          id: string
          organisation_id: string | null
          nom: string
          description: string | null
          config: Json
          est_defaut: boolean
          est_systeme: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id?: string | null
          nom: string
          description?: string | null
          config?: Json
          est_defaut?: boolean
          est_systeme?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string | null
          nom?: string
          description?: string | null
          config?: Json
          est_defaut?: boolean
          est_systeme?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      rappels: {
        Row: {
          id: string
          facture_id: string
          organisation_id: string
          type_rappel: string
          niveau: number
          date_envoi: string | null
          date_echeance: string | null
          contenu: string | null
          statut: string
          cree_le: string
        }
        Insert: {
          id?: string
          facture_id: string
          organisation_id: string
          type_rappel?: string
          niveau?: number
          date_envoi?: string | null
          date_echeance?: string | null
          contenu?: string | null
          statut?: string
          cree_le?: string
        }
        Update: {
          id?: string
          facture_id?: string
          organisation_id?: string
          type_rappel?: string
          niveau?: number
          date_envoi?: string | null
          date_echeance?: string | null
          contenu?: string | null
          statut?: string
          cree_le?: string
        }
        Relationships: []
      }
      // Phase 3 tables
      ocr_scans: {
        Row: {
          id: string
          organisation_id: string
          image_url: string
          resultat_json: Json | null
          statut: string
          depense_id: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          image_url: string
          resultat_json?: Json | null
          statut?: string
          depense_id?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          image_url?: string
          resultat_json?: Json | null
          statut?: string
          depense_id?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      comptes_bancaires: {
        Row: {
          id: string
          organisation_id: string
          nom: string
          iban: string
          bic: string | null
          devise: string
          solde: number
          actif: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          nom: string
          iban: string
          bic?: string | null
          devise?: string
          solde?: number
          actif?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          nom?: string
          iban?: string
          bic?: string | null
          devise?: string
          solde?: number
          actif?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      transactions_bancaires: {
        Row: {
          id: string
          compte_id: string
          organisation_id: string
          reference: string | null
          montant: number
          devise: string
          date_valeur: string
          date_comptable: string | null
          description: string | null
          type: string
          statut_rapprochement: string
          facture_id: string | null
          depense_id: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          compte_id: string
          organisation_id: string
          reference?: string | null
          montant: number
          devise?: string
          date_valeur: string
          date_comptable?: string | null
          description?: string | null
          type?: string
          statut_rapprochement?: string
          facture_id?: string | null
          depense_id?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          compte_id?: string
          organisation_id?: string
          reference?: string | null
          montant?: number
          devise?: string
          date_valeur?: string
          date_comptable?: string | null
          description?: string | null
          type?: string
          statut_rapprochement?: string
          facture_id?: string | null
          depense_id?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      fichiers_bancaires: {
        Row: {
          id: string
          organisation_id: string
          nom_fichier: string
          type_fichier: string
          statut: string
          nb_transactions: number
          date_import: string
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          nom_fichier: string
          type_fichier: string
          statut?: string
          nb_transactions?: number
          date_import?: string
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          nom_fichier?: string
          type_fichier?: string
          statut?: string
          nb_transactions?: number
          date_import?: string
          cree_le?: string
        }
        Relationships: []
      }
      plan_comptable: {
        Row: {
          id: string
          organisation_id: string | null
          numero: string
          nom: string
          type_compte: string
          categorie: string | null
          parent_id: string | null
          actif: boolean
          est_systeme: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id?: string | null
          numero: string
          nom: string
          type_compte: string
          categorie?: string | null
          parent_id?: string | null
          actif?: boolean
          est_systeme?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string | null
          numero?: string
          nom?: string
          type_compte?: string
          categorie?: string | null
          parent_id?: string | null
          actif?: boolean
          est_systeme?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      exercices_comptables: {
        Row: {
          id: string
          organisation_id: string
          annee: number
          date_debut: string
          date_fin: string
          statut: string
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          annee: number
          date_debut: string
          date_fin: string
          statut?: string
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          annee?: number
          date_debut?: string
          date_fin?: string
          statut?: string
          cree_le?: string
        }
        Relationships: []
      }
      ecritures_comptables: {
        Row: {
          id: string
          organisation_id: string
          exercice_id: string | null
          numero_piece: string | null
          date_ecriture: string
          libelle: string
          compte_debit_id: string | null
          compte_credit_id: string | null
          montant: number
          devise: string
          facture_id: string | null
          depense_id: string | null
          transaction_id: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          exercice_id?: string | null
          numero_piece?: string | null
          date_ecriture: string
          libelle: string
          compte_debit_id?: string | null
          compte_credit_id?: string | null
          montant: number
          devise?: string
          facture_id?: string | null
          depense_id?: string | null
          transaction_id?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          exercice_id?: string | null
          numero_piece?: string | null
          date_ecriture?: string
          libelle?: string
          compte_debit_id?: string | null
          compte_credit_id?: string | null
          montant?: number
          devise?: string
          facture_id?: string | null
          depense_id?: string | null
          transaction_id?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      declarations_tva: {
        Row: {
          id: string
          organisation_id: string
          exercice_id: string | null
          periode_debut: string
          periode_fin: string
          methode: string
          chiffre_affaires: number
          tva_due: number
          tva_deductible: number
          tva_nette: number
          statut: string
          xml_data: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          exercice_id?: string | null
          periode_debut: string
          periode_fin: string
          methode?: string
          chiffre_affaires?: number
          tva_due?: number
          tva_deductible?: number
          tva_nette?: number
          statut?: string
          xml_data?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          exercice_id?: string | null
          periode_debut?: string
          periode_fin?: string
          methode?: string
          chiffre_affaires?: number
          tva_due?: number
          tva_deductible?: number
          tva_nette?: number
          statut?: string
          xml_data?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      ebill_config: {
        Row: {
          id: string
          organisation_id: string
          participant_id: string | null
          statut: string
          actif: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          participant_id?: string | null
          statut?: string
          actif?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          participant_id?: string | null
          statut?: string
          actif?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      ebill_envois: {
        Row: {
          id: string
          organisation_id: string
          facture_id: string | null
          participant_destinataire: string | null
          statut: string
          date_envoi: string | null
          date_acceptation: string | null
          reference_ebill: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          facture_id?: string | null
          participant_destinataire?: string | null
          statut?: string
          date_envoi?: string | null
          date_acceptation?: string | null
          reference_ebill?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          facture_id?: string | null
          participant_destinataire?: string | null
          statut?: string
          date_envoi?: string | null
          date_acceptation?: string | null
          reference_ebill?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      acces_fiduciaire: {
        Row: {
          id: string
          organisation_id: string
          email_fiduciaire: string
          nom_fiduciaire: string | null
          token_acces: string
          permissions: Json
          actif: boolean
          derniere_connexion: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          email_fiduciaire: string
          nom_fiduciaire?: string | null
          token_acces: string
          permissions?: Json
          actif?: boolean
          derniere_connexion?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          email_fiduciaire?: string
          nom_fiduciaire?: string | null
          token_acces?: string
          permissions?: Json
          actif?: boolean
          derniere_connexion?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      exports_fiduciaire: {
        Row: {
          id: string
          organisation_id: string
          acces_id: string | null
          type_export: string
          periode_debut: string | null
          periode_fin: string | null
          fichier_url: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          acces_id?: string | null
          type_export: string
          periode_debut?: string | null
          periode_fin?: string | null
          fichier_url?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          acces_id?: string | null
          type_export?: string
          periode_debut?: string | null
          periode_fin?: string | null
          fichier_url?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      imports: {
        Row: {
          id: string
          organisation_id: string
          source: string
          type_donnees: string
          statut: string
          nb_lignes: number
          nb_importees: number
          nb_erreurs: number
          erreurs_detail: Json | null
          cree_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          source: string
          type_donnees: string
          statut?: string
          nb_lignes?: number
          nb_importees?: number
          nb_erreurs?: number
          erreurs_detail?: Json | null
          cree_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          source?: string
          type_donnees?: string
          statut?: string
          nb_lignes?: number
          nb_importees?: number
          nb_erreurs?: number
          erreurs_detail?: Json | null
          cree_le?: string
        }
        Relationships: []
      }
      // Tables utilisées par useTrial (non encore migrées)
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          current_period_end: string | null
          started_at: string | null
          ends_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          status?: string
          current_period_end?: string | null
          started_at?: string | null
          ends_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          current_period_end?: string | null
          started_at?: string | null
          ends_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      trial_reminders: {
        Row: {
          id: string
          user_id: string
          days_remaining: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          days_remaining: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          days_remaining?: number
          created_at?: string
        }
        Relationships: []
      }
      // Système EN (consolidated_setup) — organizations / invoices
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          invoice_number: string | null
          client_name: string
          client_company: string | null
          client_address: string | null
          client_city: string | null
          client_postal_code: string | null
          client_country: string | null
          client_email: string | null
          client_phone: string | null
          client_vat: string | null
          company_name: string
          company_address: string
          company_city: string
          company_postal_code: string
          company_country: string
          company_vat: string | null
          company_email: string | null
          company_phone: string | null
          date: string
          due_date: string
          status: string
          items: Json
          subtotal: number
          tax_amount: number
          total: number
          notes: string | null
          terms: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          invoice_number?: string | null
          client_name: string
          client_company?: string | null
          client_address?: string | null
          client_city?: string | null
          client_postal_code?: string | null
          client_country?: string | null
          client_email?: string | null
          client_phone?: string | null
          client_vat?: string | null
          company_name: string
          company_address: string
          company_city: string
          company_postal_code: string
          company_country: string
          company_vat?: string | null
          company_email?: string | null
          company_phone?: string | null
          date: string
          due_date: string
          status: string
          items?: Json
          subtotal: number
          tax_amount: number
          total: number
          notes?: string | null
          terms?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          invoice_number?: string | null
          client_name?: string
          client_company?: string | null
          client_address?: string | null
          client_city?: string | null
          client_postal_code?: string | null
          client_country?: string | null
          client_email?: string | null
          client_phone?: string | null
          client_vat?: string | null
          company_name?: string
          company_address?: string
          company_city?: string
          company_postal_code?: string
          company_country?: string
          company_vat?: string | null
          company_email?: string | null
          company_phone?: string | null
          date?: string
          due_date?: string
          status?: string
          items?: Json
          subtotal?: number
          tax_amount?: number
          total?: number
          notes?: string | null
          terms?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Phase 5-8 : nouvelles tables (régénération database.types.ts)
      admin_reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string
          status: string
          category: string
          notification_sent: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date: string
          status?: string
          category?: string
          notification_sent?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string
          status?: string
          category?: string
          notification_sent?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: boolean
          usd_to_chf: number
          eur_to_chf: number
          smtp_host: string | null
          smtp_port: number | null
          smtp_user: string | null
          smtp_from: string | null
          maintenance_mode: boolean
          trial_days: number
          max_invoices_starter: number
          max_invoices_business: number
          enable_ebill: boolean
          enable_api: boolean
          enable_fiduciaire: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: boolean
          usd_to_chf?: number
          eur_to_chf?: number
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          smtp_from?: string | null
          maintenance_mode?: boolean
          trial_days?: number
          max_invoices_starter?: number
          max_invoices_business?: number
          enable_ebill?: boolean
          enable_api?: boolean
          enable_fiduciaire?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: boolean
          usd_to_chf?: number
          eur_to_chf?: number
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          smtp_from?: string | null
          maintenance_mode?: boolean
          trial_days?: number
          max_invoices_starter?: number
          max_invoices_business?: number
          enable_ebill?: boolean
          enable_api?: boolean
          enable_fiduciaire?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string | null
          admin_email: string | null
          action: string
          target_type: string
          target_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          admin_email?: string | null
          action: string
          target_type: string
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          admin_email?: string | null
          action?: string
          target_type?: string
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      archives: {
        Row: {
          id: string
          organisation_id: string
          document_type: string
          document_id: string
          document_number: string | null
          document_date: string | null
          montant: number | null
          archived_at: string
          archive_expiry_at: string
          archive_hash: string
          archived_by: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          organisation_id: string
          document_type: string
          document_id: string
          document_number?: string | null
          document_date?: string | null
          montant?: number | null
          archived_at?: string
          archive_expiry_at: string
          archive_hash: string
          archived_by?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          organisation_id?: string
          document_type?: string
          document_id?: string
          document_number?: string | null
          document_date?: string | null
          montant?: number | null
          archived_at?: string
          archive_expiry_at?: string
          archive_hash?: string
          archived_by?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          id: string
          organisation_id: string
          document_type: string
          document_id: string
          action: string
          user_id: string | null
          user_email: string | null
          contenu_json: Json | null
          hash_contenu: string
          hash_precedent: string | null
          hash_chaine: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          document_type: string
          document_id: string
          action: string
          user_id?: string | null
          user_email?: string | null
          contenu_json?: Json | null
          hash_contenu: string
          hash_precedent?: string | null
          hash_chaine: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          document_type?: string
          document_id?: string
          action?: string
          user_id?: string | null
          user_email?: string | null
          contenu_json?: Json | null
          hash_contenu?: string
          hash_precedent?: string | null
          hash_chaine?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      boutique_connexions: {
        Row: {
          id: string
          organisation_id: string
          nom: string
          plateforme: string
          url_boutique: string
          api_key: string | null
          api_secret: string | null
          access_token: string | null
          webhook_secret: string | null
          statut: string
          derniere_synchro: string | null
          config: Json
          auto_facture: boolean
          auto_stock: boolean
          statut_commande: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          nom: string
          plateforme: string
          url_boutique: string
          api_key?: string | null
          api_secret?: string | null
          access_token?: string | null
          webhook_secret?: string | null
          statut?: string
          derniere_synchro?: string | null
          config?: Json
          auto_facture?: boolean
          auto_stock?: boolean
          statut_commande?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          nom?: string
          plateforme?: string
          url_boutique?: string
          api_key?: string | null
          api_secret?: string | null
          access_token?: string | null
          webhook_secret?: string | null
          statut?: string
          derniere_synchro?: string | null
          config?: Json
          auto_facture?: boolean
          auto_stock?: boolean
          statut_commande?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      boutique_commandes: {
        Row: {
          id: string
          organisation_id: string
          connexion_id: string
          commande_externe_id: string
          numero_commande: string
          statut: string
          client_nom: string | null
          client_email: string | null
          client_adresse: Json | null
          lignes: Json
          total_ht: number
          total_tva: number
          total_ttc: number
          devise: string
          invoice_id: string | null
          synchro_at: string
          commande_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          connexion_id: string
          commande_externe_id: string
          numero_commande: string
          statut: string
          client_nom?: string | null
          client_email?: string | null
          client_adresse?: Json | null
          lignes?: Json
          total_ht?: number
          total_tva?: number
          total_ttc?: number
          devise?: string
          invoice_id?: string | null
          synchro_at?: string
          commande_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          connexion_id?: string
          commande_externe_id?: string
          numero_commande?: string
          statut?: string
          client_nom?: string | null
          client_email?: string | null
          client_adresse?: Json | null
          lignes?: Json
          total_ht?: number
          total_tva?: number
          total_ttc?: number
          devise?: string
          invoice_id?: string | null
          synchro_at?: string
          commande_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      fournisseurs: {
        Row: {
          id: string
          organisation_id: string
          numero: string | null
          nom: string
          contact: string | null
          email: string | null
          telephone: string | null
          adresse: string | null
          code_postal: string | null
          ville: string | null
          pays: string
          iban: string | null
          tva_numero: string | null
          delai_paiement: number
          notes: string | null
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          numero?: string | null
          nom: string
          contact?: string | null
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          pays?: string
          iban?: string | null
          tva_numero?: string | null
          delai_paiement?: number
          notes?: string | null
          actif?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          numero?: string | null
          nom?: string
          contact?: string | null
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          pays?: string
          iban?: string | null
          tva_numero?: string | null
          delai_paiement?: number
          notes?: string | null
          actif?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      commandes_fournisseurs: {
        Row: {
          id: string
          organisation_id: string
          fournisseur_id: string
          numero: string
          statut: string
          date_commande: string
          date_livraison_prevue: string | null
          date_reception: string | null
          total_ht: number
          total_tva: number
          total_ttc: number
          devise: string
          adresse_livraison: string | null
          notes: string | null
          conditions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          fournisseur_id: string
          numero: string
          statut?: string
          date_commande?: string
          date_livraison_prevue?: string | null
          date_reception?: string | null
          total_ht?: number
          total_tva?: number
          total_ttc?: number
          devise?: string
          adresse_livraison?: string | null
          notes?: string | null
          conditions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          fournisseur_id?: string
          numero?: string
          statut?: string
          date_commande?: string
          date_livraison_prevue?: string | null
          date_reception?: string | null
          total_ht?: number
          total_tva?: number
          total_ttc?: number
          devise?: string
          adresse_livraison?: string | null
          notes?: string | null
          conditions?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      commandes_fournisseurs_lignes: {
        Row: {
          id: string
          commande_id: string
          article_id: string | null
          reference: string | null
          description: string
          quantite_commandee: number
          quantite_recue: number
          unite: string
          prix_unitaire: number
          taux_tva: number
          remise_pct: number
          total_ht: number
          ordre: number
        }
        Insert: {
          id?: string
          commande_id: string
          article_id?: string | null
          reference?: string | null
          description: string
          quantite_commandee: number
          quantite_recue?: number
          unite?: string
          prix_unitaire: number
          taux_tva?: number
          remise_pct?: number
          total_ht: number
          ordre?: number
        }
        Update: {
          id?: string
          commande_id?: string
          article_id?: string | null
          reference?: string | null
          description?: string
          quantite_commandee?: number
          quantite_recue?: number
          unite?: string
          prix_unitaire?: number
          taux_tva?: number
          remise_pct?: number
          total_ht?: number
          ordre?: number
        }
        Relationships: []
      }
      crm_opportunites: {
        Row: {
          id: string
          organisation_id: string
          nom: string
          client_id: string | null
          client_nom: string | null
          client_email: string | null
          valeur: number
          devise: string
          stade: string
          probabilite: number
          date_fermeture: string | null
          description: string | null
          raison_perte: string | null
          devis_id: string | null
          ordre: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          nom: string
          client_id?: string | null
          client_nom?: string | null
          client_email?: string | null
          valeur?: number
          devise?: string
          stade?: string
          probabilite?: number
          date_fermeture?: string | null
          description?: string | null
          raison_perte?: string | null
          devis_id?: string | null
          ordre?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          nom?: string
          client_id?: string | null
          client_nom?: string | null
          client_email?: string | null
          valeur?: number
          devise?: string
          stade?: string
          probabilite?: number
          date_fermeture?: string | null
          description?: string | null
          raison_perte?: string | null
          devis_id?: string | null
          ordre?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_activites: {
        Row: {
          id: string
          opportunite_id: string
          type: string
          titre: string
          description: string | null
          date_activite: string
          created_at: string
        }
        Insert: {
          id?: string
          opportunite_id: string
          type: string
          titre: string
          description?: string | null
          date_activite?: string
          created_at?: string
        }
        Update: {
          id?: string
          opportunite_id?: string
          type?: string
          titre?: string
          description?: string | null
          date_activite?: string
          created_at?: string
        }
        Relationships: []
      }
      employes: {
        Row: {
          id: string
          organisation_id: string
          prenom: string
          nom: string
          email: string | null
          telephone: string | null
          adresse: string | null
          code_postal: string | null
          ville: string | null
          date_naissance: string | null
          date_entree: string
          date_sortie: string | null
          numero_avs: string | null
          type_contrat: string
          taux_activite: number
          salaire_brut_mensuel: number
          lpp_taux_employe: number
          ijm_taux: number
          impot_source: boolean
          taux_is: number
          iban: string | null
          actif: boolean
          notes: string | null
          cree_le: string
          mis_a_jour_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          prenom: string
          nom: string
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          date_naissance?: string | null
          date_entree?: string
          date_sortie?: string | null
          numero_avs?: string | null
          type_contrat?: string
          taux_activite?: number
          salaire_brut_mensuel?: number
          lpp_taux_employe?: number
          ijm_taux?: number
          impot_source?: boolean
          taux_is?: number
          iban?: string | null
          actif?: boolean
          notes?: string | null
          cree_le?: string
          mis_a_jour_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          prenom?: string
          nom?: string
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          date_naissance?: string | null
          date_entree?: string
          date_sortie?: string | null
          numero_avs?: string | null
          type_contrat?: string
          taux_activite?: number
          salaire_brut_mensuel?: number
          lpp_taux_employe?: number
          ijm_taux?: number
          impot_source?: boolean
          taux_is?: number
          iban?: string | null
          actif?: boolean
          notes?: string | null
          cree_le?: string
          mis_a_jour_le?: string
        }
        Relationships: []
      }
      fiches_salaire: {
        Row: {
          id: string
          employe_id: string
          organisation_id: string
          periode: string
          salaire_brut: number
          avs_employe: number
          ai_employe: number
          apg_employe: number
          ac_employe: number
          lpp_employe: number
          ijm_employe: number
          impot_source: number
          autres_deductions: number
          total_deductions: number
          salaire_net: number
          avs_employeur: number
          ai_employeur: number
          apg_employeur: number
          ac_employeur: number
          lpp_employeur: number
          allocations_familiales: number
          total_charges_patronales: number
          cout_total_employeur: number
          primes: number
          heures_sup: number
          indemnites: number
          statut: string
          date_paiement: string | null
          notes: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          employe_id: string
          organisation_id: string
          periode: string
          salaire_brut: number
          avs_employe?: number
          ai_employe?: number
          apg_employe?: number
          ac_employe?: number
          lpp_employe?: number
          ijm_employe?: number
          impot_source?: number
          autres_deductions?: number
          total_deductions?: number
          salaire_net: number
          avs_employeur?: number
          ai_employeur?: number
          apg_employeur?: number
          ac_employeur?: number
          lpp_employeur?: number
          allocations_familiales?: number
          total_charges_patronales?: number
          cout_total_employeur: number
          primes?: number
          heures_sup?: number
          indemnites?: number
          statut?: string
          date_paiement?: string | null
          notes?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          employe_id?: string
          organisation_id?: string
          periode?: string
          salaire_brut?: number
          avs_employe?: number
          ai_employe?: number
          apg_employe?: number
          ac_employe?: number
          lpp_employe?: number
          ijm_employe?: number
          impot_source?: number
          autres_deductions?: number
          total_deductions?: number
          salaire_net?: number
          avs_employeur?: number
          ai_employeur?: number
          apg_employeur?: number
          ac_employeur?: number
          lpp_employeur?: number
          allocations_familiales?: number
          total_charges_patronales?: number
          cout_total_employeur?: number
          primes?: number
          heures_sup?: number
          indemnites?: number
          statut?: string
          date_paiement?: string | null
          notes?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      envois_postaux: {
        Row: {
          id: string
          organisation_id: string
          invoice_id: string | null
          type: string
          statut: string
          destinataire: Json
          expediteur: Json
          nombre_pages: number
          couleur: boolean
          tracking_number: string | null
          prix_centimes: number
          reference_externe: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          invoice_id?: string | null
          type: string
          statut?: string
          destinataire: Json
          expediteur: Json
          nombre_pages?: number
          couleur?: boolean
          tracking_number?: string | null
          prix_centimes?: number
          reference_externe?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          invoice_id?: string | null
          type?: string
          statut?: string
          destinataire?: Json
          expediteur?: Json
          nombre_pages?: number
          couleur?: boolean
          tracking_number?: string | null
          prix_centimes?: number
          reference_externe?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      marques: {
        Row: {
          id: string
          organisation_id: string
          nom: string
          slug: string
          description: string | null
          logo_url: string | null
          couleur_primaire: string
          couleur_secondaire: string | null
          police: string | null
          adresse: string | null
          email: string | null
          telephone: string | null
          site_web: string | null
          mentions_legales: string | null
          conditions_paiement: string | null
          pied_facture: string | null
          actif: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          nom: string
          slug: string
          description?: string | null
          logo_url?: string | null
          couleur_primaire?: string
          couleur_secondaire?: string | null
          police?: string | null
          adresse?: string | null
          email?: string | null
          telephone?: string | null
          site_web?: string | null
          mentions_legales?: string | null
          conditions_paiement?: string | null
          pied_facture?: string | null
          actif?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          nom?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          couleur_primaire?: string
          couleur_secondaire?: string | null
          police?: string | null
          adresse?: string | null
          email?: string | null
          telephone?: string | null
          site_web?: string | null
          mentions_legales?: string | null
          conditions_paiement?: string | null
          pied_facture?: string | null
          actif?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          id: string
          invoice_id: string
          invoice_number: string
          provider: string
          payment_url: string
          external_id: string | null
          external_transaction_id: string | null
          amount_cents: number
          currency: string
          status: string
          payment_method: string | null
          expires_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          invoice_number: string
          provider?: string
          payment_url: string
          external_id?: string | null
          external_transaction_id?: string | null
          amount_cents: number
          currency?: string
          status?: string
          payment_method?: string | null
          expires_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          invoice_number?: string
          provider?: string
          payment_url?: string
          external_id?: string | null
          external_transaction_id?: string | null
          amount_cents?: number
          currency?: string
          status?: string
          payment_method?: string | null
          expires_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      portail_client_liens: {
        Row: {
          id: string
          organisation_id: string
          client_email: string
          client_nom: string | null
          token: string
          expires_at: string
          dernier_acces: string | null
          nb_acces: number
          actif: boolean
          message_accueil: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          client_email: string
          client_nom?: string | null
          token?: string
          expires_at?: string
          dernier_acces?: string | null
          nb_acces?: number
          actif?: boolean
          message_accueil?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          client_email?: string
          client_nom?: string | null
          token?: string
          expires_at?: string
          dernier_acces?: string | null
          nb_acces?: number
          actif?: boolean
          message_accueil?: string | null
          created_at?: string
        }
        Relationships: []
      }
      projets: {
        Row: {
          id: string
          organisation_id: string
          client_id: string | null
          nom: string
          description: string | null
          tarif_horaire: number
          budget_heures: number | null
          devise: string
          statut: string
          date_debut: string | null
          date_fin: string | null
          couleur: string
          cree_le: string
          mis_a_jour_le: string
        }
        Insert: {
          id?: string
          organisation_id: string
          client_id?: string | null
          nom: string
          description?: string | null
          tarif_horaire?: number
          budget_heures?: number | null
          devise?: string
          statut?: string
          date_debut?: string | null
          date_fin?: string | null
          couleur?: string
          cree_le?: string
          mis_a_jour_le?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          client_id?: string | null
          nom?: string
          description?: string | null
          tarif_horaire?: number
          budget_heures?: number | null
          devise?: string
          statut?: string
          date_debut?: string | null
          date_fin?: string | null
          couleur?: string
          cree_le?: string
          mis_a_jour_le?: string
        }
        Relationships: []
      }
      sessions_temps: {
        Row: {
          id: string
          projet_id: string
          user_id: string | null
          description: string | null
          debut_at: string | null
          fin_at: string | null
          duree_minutes: number | null
          facturable: boolean
          facture: boolean
          facture_id: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          projet_id: string
          user_id?: string | null
          description?: string | null
          debut_at?: string | null
          fin_at?: string | null
          duree_minutes?: number | null
          facturable?: boolean
          facture?: boolean
          facture_id?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          projet_id?: string
          user_id?: string | null
          description?: string | null
          debut_at?: string | null
          fin_at?: string | null
          duree_minutes?: number | null
          facturable?: boolean
          facture?: boolean
          facture_id?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      taches: {
        Row: {
          id: string
          projet_id: string
          titre: string
          description: string | null
          statut: string
          heures_estimees: number | null
          heures_reelles: number
          assignee_id: string | null
          priorite: string
          date_echeance: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          projet_id: string
          titre: string
          description?: string | null
          statut?: string
          heures_estimees?: number | null
          heures_reelles?: number
          assignee_id?: string | null
          priorite?: string
          date_echeance?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          projet_id?: string
          titre?: string
          description?: string | null
          statut?: string
          heures_estimees?: number | null
          heures_reelles?: number
          assignee_id?: string | null
          priorite?: string
          date_echeance?: string | null
          cree_le?: string
        }
        Relationships: []
      }
      signature_demandes: {
        Row: {
          id: string
          organisation_id: string
          document_type: string
          document_id: string
          document_titre: string
          signataire_nom: string
          signataire_email: string
          token: string
          statut: string
          message_personnalise: string | null
          signature_data: string | null
          signature_type: string
          nom_signe: string | null
          ip_signataire: string | null
          user_agent_signataire: string | null
          signe_at: string | null
          vu_at: string | null
          refuse_raison: string | null
          expires_at: string
          rappel_envoye_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          document_type: string
          document_id: string
          document_titre: string
          signataire_nom: string
          signataire_email: string
          token?: string
          statut?: string
          message_personnalise?: string | null
          signature_data?: string | null
          signature_type?: string
          nom_signe?: string | null
          ip_signataire?: string | null
          user_agent_signataire?: string | null
          signe_at?: string | null
          vu_at?: string | null
          refuse_raison?: string | null
          expires_at?: string
          rappel_envoye_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          document_type?: string
          document_id?: string
          document_titre?: string
          signataire_nom?: string
          signataire_email?: string
          token?: string
          statut?: string
          message_personnalise?: string | null
          signature_data?: string | null
          signature_type?: string
          nom_signe?: string | null
          ip_signataire?: string | null
          user_agent_signataire?: string | null
          signe_at?: string | null
          vu_at?: string | null
          refuse_raison?: string | null
          expires_at?: string
          rappel_envoye_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      stock_articles: {
        Row: {
          id: string
          organisation_id: string
          produit_id: string | null
          nom: string
          reference: string | null
          description: string | null
          quantite: number
          quantite_min: number
          quantite_max: number | null
          unite: string
          cout_unitaire: number
          emplacement: string | null
          categorie: string | null
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          produit_id?: string | null
          nom: string
          reference?: string | null
          description?: string | null
          quantite?: number
          quantite_min?: number
          quantite_max?: number | null
          unite?: string
          cout_unitaire?: number
          emplacement?: string | null
          categorie?: string | null
          actif?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          produit_id?: string | null
          nom?: string
          reference?: string | null
          description?: string | null
          quantite?: number
          quantite_min?: number
          quantite_max?: number | null
          unite?: string
          cout_unitaire?: number
          emplacement?: string | null
          categorie?: string | null
          actif?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_mouvements: {
        Row: {
          id: string
          organisation_id: string
          article_id: string
          type: string
          quantite: number
          quantite_avant: number
          quantite_apres: number
          cout_unitaire: number | null
          reference_doc: string | null
          motif: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          article_id: string
          type: string
          quantite: number
          quantite_avant: number
          quantite_apres: number
          cout_unitaire?: number | null
          reference_doc?: string | null
          motif?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          article_id?: string
          type?: string
          quantite?: number
          quantite_avant?: number
          quantite_apres?: number
          cout_unitaire?: number | null
          reference_doc?: string | null
          motif?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ventes_pos: {
        Row: {
          id: string
          organisation_id: string
          numero: string
          lignes: Json
          total_ht: number
          total_tva: number
          total_ttc: number
          remise_totale: number
          mode_paiement: string
          montant_recu: number | null
          monnaie_rendue: number | null
          client_id: string | null
          client_nom: string | null
          invoice_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          numero: string
          lignes?: Json
          total_ht?: number
          total_tva?: number
          total_ttc?: number
          remise_totale?: number
          mode_paiement: string
          montant_recu?: number | null
          monnaie_rendue?: number | null
          client_id?: string | null
          client_nom?: string | null
          invoice_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          numero?: string
          lignes?: Json
          total_ht?: number
          total_tva?: number
          total_ttc?: number
          remise_totale?: number
          mode_paiement?: string
          montant_recu?: number | null
          monnaie_rendue?: number | null
          client_id?: string | null
          client_nom?: string | null
          invoice_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
