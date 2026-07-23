export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acces_fiduciaire: {
        Row: {
          actif: boolean | null
          cree_le: string | null
          derniere_connexion: string | null
          email_fiduciaire: string
          id: string
          nom_fiduciaire: string | null
          organisation_id: string
          permissions: Json | null
          token_acces: string
        }
        Insert: {
          actif?: boolean | null
          cree_le?: string | null
          derniere_connexion?: string | null
          email_fiduciaire: string
          id?: string
          nom_fiduciaire?: string | null
          organisation_id: string
          permissions?: Json | null
          token_acces: string
        }
        Update: {
          actif?: boolean | null
          cree_le?: string | null
          derniere_connexion?: string | null
          email_fiduciaire?: string
          id?: string
          nom_fiduciaire?: string | null
          organisation_id?: string
          permissions?: Json | null
          token_acces?: string
        }
        Relationships: [
          {
            foreignKeyName: "acces_fiduciaire_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_reminders: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          notification_sent: boolean | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          notification_sent?: boolean | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          notification_sent?: boolean | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      archives: {
        Row: {
          archive_expiry_at: string
          archive_hash: string
          archived_at: string
          archived_by: string | null
          document_date: string | null
          document_id: string
          document_number: string | null
          document_type: string
          id: string
          metadata: Json | null
          montant: number | null
          organisation_id: string
        }
        Insert: {
          archive_expiry_at: string
          archive_hash: string
          archived_at?: string
          archived_by?: string | null
          document_date?: string | null
          document_id: string
          document_number?: string | null
          document_type: string
          id?: string
          metadata?: Json | null
          montant?: number | null
          organisation_id: string
        }
        Update: {
          archive_expiry_at?: string
          archive_hash?: string
          archived_at?: string
          archived_by?: string | null
          document_date?: string | null
          document_id?: string
          document_number?: string | null
          document_type?: string
          id?: string
          metadata?: Json | null
          montant?: number | null
          organisation_id?: string
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          action: string
          contenu_json: Json | null
          created_at: string
          document_id: string
          document_type: string
          hash_chaine: string
          hash_contenu: string
          hash_precedent: string | null
          id: string
          ip_address: string | null
          organisation_id: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          contenu_json?: Json | null
          created_at?: string
          document_id: string
          document_type: string
          hash_chaine: string
          hash_contenu: string
          hash_precedent?: string | null
          id?: string
          ip_address?: string | null
          organisation_id: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          contenu_json?: Json | null
          created_at?: string
          document_id?: string
          document_type?: string
          hash_chaine?: string
          hash_contenu?: string
          hash_precedent?: string | null
          id?: string
          ip_address?: string | null
          organisation_id?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      avoirs: {
        Row: {
          archive_expiry_at: string | null
          archive_hash: string | null
          archived_at: string | null
          articles: Json
          client_id: string | null
          cree_le: string | null
          date_avoir: string
          devise: string | null
          facture_id: string | null
          id: string
          motif: string | null
          notes: string | null
          numero_avoir: string
          organisation_id: string
          sous_total: number | null
          statut: string
          total: number | null
          total_tva: number | null
        }
        Insert: {
          archive_expiry_at?: string | null
          archive_hash?: string | null
          archived_at?: string | null
          articles?: Json
          client_id?: string | null
          cree_le?: string | null
          date_avoir?: string
          devise?: string | null
          facture_id?: string | null
          id?: string
          motif?: string | null
          notes?: string | null
          numero_avoir: string
          organisation_id: string
          sous_total?: number | null
          statut?: string
          total?: number | null
          total_tva?: number | null
        }
        Update: {
          archive_expiry_at?: string | null
          archive_hash?: string | null
          archived_at?: string | null
          articles?: Json
          client_id?: string | null
          cree_le?: string | null
          date_avoir?: string
          devise?: string | null
          facture_id?: string | null
          id?: string
          motif?: string | null
          notes?: string | null
          numero_avoir?: string
          organisation_id?: string
          sous_total?: number | null
          statut?: string
          total?: number | null
          total_tva?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avoirs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avoirs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      boutique_commandes: {
        Row: {
          client_adresse: Json | null
          client_email: string | null
          client_nom: string | null
          commande_at: string | null
          commande_externe_id: string
          connexion_id: string
          created_at: string
          devise: string
          id: string
          invoice_id: string | null
          lignes: Json
          numero_commande: string
          organisation_id: string
          statut: string
          synchro_at: string
          total_ht: number
          total_ttc: number
          total_tva: number
        }
        Insert: {
          client_adresse?: Json | null
          client_email?: string | null
          client_nom?: string | null
          commande_at?: string | null
          commande_externe_id: string
          connexion_id: string
          created_at?: string
          devise?: string
          id?: string
          invoice_id?: string | null
          lignes?: Json
          numero_commande: string
          organisation_id: string
          statut: string
          synchro_at?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
        }
        Update: {
          client_adresse?: Json | null
          client_email?: string | null
          client_nom?: string | null
          commande_at?: string | null
          commande_externe_id?: string
          connexion_id?: string
          created_at?: string
          devise?: string
          id?: string
          invoice_id?: string | null
          lignes?: Json
          numero_commande?: string
          organisation_id?: string
          statut?: string
          synchro_at?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
        }
        Relationships: [
          {
            foreignKeyName: "boutique_commandes_connexion_id_fkey"
            columns: ["connexion_id"]
            isOneToOne: false
            referencedRelation: "boutique_connexions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boutique_commandes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boutique_commandes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      boutique_connexions: {
        Row: {
          access_token: string | null
          api_key: string | null
          api_secret: string | null
          auto_facture: boolean
          auto_stock: boolean
          config: Json
          created_at: string
          derniere_synchro: string | null
          id: string
          nom: string
          organisation_id: string
          plateforme: string
          statut: string
          statut_commande: string
          updated_at: string
          url_boutique: string
          webhook_secret: string | null
        }
        Insert: {
          access_token?: string | null
          api_key?: string | null
          api_secret?: string | null
          auto_facture?: boolean
          auto_stock?: boolean
          config?: Json
          created_at?: string
          derniere_synchro?: string | null
          id?: string
          nom: string
          organisation_id: string
          plateforme: string
          statut?: string
          statut_commande?: string
          updated_at?: string
          url_boutique: string
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string | null
          api_key?: string | null
          api_secret?: string | null
          auto_facture?: boolean
          auto_stock?: boolean
          config?: Json
          created_at?: string
          derniere_synchro?: string | null
          id?: string
          nom?: string
          organisation_id?: string
          plateforme?: string
          statut?: string
          statut_commande?: string
          updated_at?: string
          url_boutique?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boutique_connexions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      cles_api: {
        Row: {
          cle: string
          cree_le: string
          cree_par: string | null
          derniere_utilisation: string | null
          id: string
          nom: string
          organisation_id: string
        }
        Insert: {
          cle: string
          cree_le?: string
          cree_par?: string | null
          derniere_utilisation?: string | null
          id?: string
          nom: string
          organisation_id: string
        }
        Update: {
          cle?: string
          cree_le?: string
          cree_par?: string | null
          derniere_utilisation?: string | null
          id?: string
          nom?: string
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cles_api_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          code_postal: string | null
          conditions_paiement: number | null
          created_at: string | null
          cree_le: string | null
          devise_preferee: string | null
          email: string | null
          entreprise: string | null
          id: string
          mis_a_jour_le: string | null
          nom: string
          notes: string | null
          numero_client: string | null
          numero_tva: string | null
          organisation_id: string | null
          pays: string | null
          prenom: string | null
          telephone: string | null
          updated_at: string | null
          user_id: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          conditions_paiement?: number | null
          created_at?: string | null
          cree_le?: string | null
          devise_preferee?: string | null
          email?: string | null
          entreprise?: string | null
          id?: string
          mis_a_jour_le?: string | null
          nom: string
          notes?: string | null
          numero_client?: string | null
          numero_tva?: string | null
          organisation_id?: string | null
          pays?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          conditions_paiement?: number | null
          created_at?: string | null
          cree_le?: string | null
          devise_preferee?: string | null
          email?: string | null
          entreprise?: string | null
          id?: string
          mis_a_jour_le?: string | null
          nom?: string
          notes?: string | null
          numero_client?: string | null
          numero_tva?: string | null
          organisation_id?: string | null
          pays?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      commandes_fournisseurs: {
        Row: {
          adresse_livraison: string | null
          conditions: string | null
          created_at: string
          date_commande: string
          date_livraison_prevue: string | null
          date_reception: string | null
          devise: string
          fournisseur_id: string
          id: string
          notes: string | null
          numero: string
          organisation_id: string
          statut: string
          total_ht: number
          total_ttc: number
          total_tva: number
          updated_at: string
        }
        Insert: {
          adresse_livraison?: string | null
          conditions?: string | null
          created_at?: string
          date_commande?: string
          date_livraison_prevue?: string | null
          date_reception?: string | null
          devise?: string
          fournisseur_id: string
          id?: string
          notes?: string | null
          numero: string
          organisation_id: string
          statut?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
        }
        Update: {
          adresse_livraison?: string | null
          conditions?: string | null
          created_at?: string
          date_commande?: string
          date_livraison_prevue?: string | null
          date_reception?: string | null
          devise?: string
          fournisseur_id?: string
          id?: string
          notes?: string | null
          numero?: string
          organisation_id?: string
          statut?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commandes_fournisseurs_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_fournisseurs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      commandes_fournisseurs_lignes: {
        Row: {
          article_id: string | null
          commande_id: string
          description: string
          id: string
          ordre: number
          prix_unitaire: number
          quantite_commandee: number
          quantite_recue: number
          reference: string | null
          remise_pct: number
          taux_tva: number
          total_ht: number
          unite: string
        }
        Insert: {
          article_id?: string | null
          commande_id: string
          description: string
          id?: string
          ordre?: number
          prix_unitaire: number
          quantite_commandee: number
          quantite_recue?: number
          reference?: string | null
          remise_pct?: number
          taux_tva?: number
          total_ht: number
          unite?: string
        }
        Update: {
          article_id?: string | null
          commande_id?: string
          description?: string
          id?: string
          ordre?: number
          prix_unitaire?: number
          quantite_commandee?: number
          quantite_recue?: number
          reference?: string | null
          remise_pct?: number
          taux_tva?: number
          total_ht?: number
          unite?: string
        }
        Relationships: [
          {
            foreignKeyName: "commandes_fournisseurs_lignes_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes_fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      commentaires_tickets: {
        Row: {
          contenu: string
          cree_le: string
          id: string
          organisation_id: string | null
          ticket_id: string
          utilisateur_id: string
        }
        Insert: {
          contenu: string
          cree_le?: string
          id?: string
          organisation_id?: string | null
          ticket_id: string
          utilisateur_id: string
        }
        Update: {
          contenu?: string
          cree_le?: string
          id?: string
          organisation_id?: string | null
          ticket_id?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commentaires_tickets_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commentaires_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      comptes_bancaires: {
        Row: {
          actif: boolean | null
          bic: string | null
          cree_le: string | null
          devise: string | null
          iban: string
          id: string
          nom: string
          organisation_id: string
          solde: number | null
        }
        Insert: {
          actif?: boolean | null
          bic?: string | null
          cree_le?: string | null
          devise?: string | null
          iban: string
          id?: string
          nom: string
          organisation_id: string
          solde?: number | null
        }
        Update: {
          actif?: boolean | null
          bic?: string | null
          cree_le?: string | null
          devise?: string | null
          iban?: string
          id?: string
          nom?: string
          organisation_id?: string
          solde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comptes_bancaires_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activites: {
        Row: {
          created_at: string
          date_activite: string
          description: string | null
          id: string
          opportunite_id: string
          titre: string
          type: string
        }
        Insert: {
          created_at?: string
          date_activite?: string
          description?: string | null
          id?: string
          opportunite_id: string
          titre: string
          type: string
        }
        Update: {
          created_at?: string
          date_activite?: string
          description?: string | null
          id?: string
          opportunite_id?: string
          titre?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activites_opportunite_id_fkey"
            columns: ["opportunite_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunites"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunites: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_nom: string | null
          created_at: string
          date_fermeture: string | null
          description: string | null
          devis_id: string | null
          devise: string
          id: string
          nom: string
          ordre: number
          organisation_id: string
          probabilite: number
          raison_perte: string | null
          stade: string
          updated_at: string
          valeur: number
        }
        Insert: {
          client_email?: string | null
          client_id?: string | null
          client_nom?: string | null
          created_at?: string
          date_fermeture?: string | null
          description?: string | null
          devis_id?: string | null
          devise?: string
          id?: string
          nom: string
          ordre?: number
          organisation_id: string
          probabilite?: number
          raison_perte?: string | null
          stade?: string
          updated_at?: string
          valeur?: number
        }
        Update: {
          client_email?: string | null
          client_id?: string | null
          client_nom?: string | null
          created_at?: string
          date_fermeture?: string | null
          description?: string | null
          devis_id?: string | null
          devise?: string
          id?: string
          nom?: string
          ordre?: number
          organisation_id?: string
          probabilite?: number
          raison_perte?: string | null
          stade?: string
          updated_at?: string
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunites_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      declarations_tva: {
        Row: {
          chiffre_affaires: number | null
          cree_le: string | null
          exercice_id: string | null
          id: string
          methode: string | null
          organisation_id: string
          periode_debut: string
          periode_fin: string
          statut: string | null
          tva_deductible: number | null
          tva_due: number | null
          tva_nette: number | null
          xml_data: string | null
        }
        Insert: {
          chiffre_affaires?: number | null
          cree_le?: string | null
          exercice_id?: string | null
          id?: string
          methode?: string | null
          organisation_id: string
          periode_debut: string
          periode_fin: string
          statut?: string | null
          tva_deductible?: number | null
          tva_due?: number | null
          tva_nette?: number | null
          xml_data?: string | null
        }
        Update: {
          chiffre_affaires?: number | null
          cree_le?: string | null
          exercice_id?: string | null
          id?: string
          methode?: string | null
          organisation_id?: string
          periode_debut?: string
          periode_fin?: string
          statut?: string | null
          tva_deductible?: number | null
          tva_due?: number | null
          tva_nette?: number | null
          xml_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "declarations_tva_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declarations_tva_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          amount: number
          archive_expiry_at: string | null
          archive_hash: string | null
          archived_at: string | null
          categorie: string | null
          category: string
          created_at: string | null
          currency: string | null
          date: string
          description: string
          devise: string | null
          fournisseur: string | null
          id: string
          montant: number | null
          notes: string | null
          organisation_id: string | null
          receipt_url: string | null
          status: string
          taux_tva: number | null
          updated_at: string | null
          user_id: string
          vat_rate: number | null
        }
        Insert: {
          amount: number
          archive_expiry_at?: string | null
          archive_hash?: string | null
          archived_at?: string | null
          categorie?: string | null
          category: string
          created_at?: string | null
          currency?: string | null
          date: string
          description: string
          devise?: string | null
          fournisseur?: string | null
          id?: string
          montant?: number | null
          notes?: string | null
          organisation_id?: string | null
          receipt_url?: string | null
          status?: string
          taux_tva?: number | null
          updated_at?: string | null
          user_id: string
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          archive_expiry_at?: string | null
          archive_hash?: string | null
          archived_at?: string | null
          categorie?: string | null
          category?: string
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string
          devise?: string | null
          fournisseur?: string | null
          id?: string
          montant?: number | null
          notes?: string | null
          organisation_id?: string | null
          receipt_url?: string | null
          status?: string
          taux_tva?: number | null
          updated_at?: string | null
          user_id?: string
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "depenses_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          archive_expiry_at: string | null
          archive_hash: string | null
          archived_at: string | null
          articles: Json
          client_id: string | null
          conditions: string | null
          cree_le: string | null
          date_devis: string
          date_validite: string | null
          devise: string | null
          facture_id: string | null
          id: string
          marque_id: string | null
          mis_a_jour_le: string | null
          notes: string | null
          numero_devis: string
          organisation_id: string
          sous_total: number | null
          statut: string
          total: number | null
          total_tva: number | null
        }
        Insert: {
          archive_expiry_at?: string | null
          archive_hash?: string | null
          archived_at?: string | null
          articles?: Json
          client_id?: string | null
          conditions?: string | null
          cree_le?: string | null
          date_devis?: string
          date_validite?: string | null
          devise?: string | null
          facture_id?: string | null
          id?: string
          marque_id?: string | null
          mis_a_jour_le?: string | null
          notes?: string | null
          numero_devis: string
          organisation_id: string
          sous_total?: number | null
          statut?: string
          total?: number | null
          total_tva?: number | null
        }
        Update: {
          archive_expiry_at?: string | null
          archive_hash?: string | null
          archived_at?: string | null
          articles?: Json
          client_id?: string | null
          conditions?: string | null
          cree_le?: string | null
          date_devis?: string
          date_validite?: string | null
          devise?: string | null
          facture_id?: string | null
          id?: string
          marque_id?: string | null
          mis_a_jour_le?: string | null
          notes?: string | null
          numero_devis?: string
          organisation_id?: string
          sous_total?: number | null
          statut?: string
          total?: number | null
          total_tva?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_marque_id_fkey"
            columns: ["marque_id"]
            isOneToOne: false
            referencedRelation: "marques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      ebill_config: {
        Row: {
          actif: boolean | null
          cree_le: string | null
          id: string
          organisation_id: string
          participant_id: string | null
          statut: string | null
        }
        Insert: {
          actif?: boolean | null
          cree_le?: string | null
          id?: string
          organisation_id: string
          participant_id?: string | null
          statut?: string | null
        }
        Update: {
          actif?: boolean | null
          cree_le?: string | null
          id?: string
          organisation_id?: string
          participant_id?: string | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ebill_config_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      ebill_envois: {
        Row: {
          cree_le: string | null
          date_acceptation: string | null
          date_envoi: string | null
          facture_id: string | null
          id: string
          organisation_id: string
          participant_destinataire: string | null
          reference_ebill: string | null
          statut: string | null
        }
        Insert: {
          cree_le?: string | null
          date_acceptation?: string | null
          date_envoi?: string | null
          facture_id?: string | null
          id?: string
          organisation_id: string
          participant_destinataire?: string | null
          reference_ebill?: string | null
          statut?: string | null
        }
        Update: {
          cree_le?: string | null
          date_acceptation?: string | null
          date_envoi?: string | null
          facture_id?: string | null
          id?: string
          organisation_id?: string
          participant_destinataire?: string | null
          reference_ebill?: string | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ebill_envois_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ebill_envois_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecritures_comptables: {
        Row: {
          compte_credit_id: string | null
          compte_debit_id: string | null
          cree_le: string | null
          date_ecriture: string
          depense_id: string | null
          devise: string | null
          exercice_id: string | null
          facture_id: string | null
          id: string
          libelle: string
          montant: number
          numero_piece: string | null
          organisation_id: string
          transaction_id: string | null
        }
        Insert: {
          compte_credit_id?: string | null
          compte_debit_id?: string | null
          cree_le?: string | null
          date_ecriture: string
          depense_id?: string | null
          devise?: string | null
          exercice_id?: string | null
          facture_id?: string | null
          id?: string
          libelle: string
          montant: number
          numero_piece?: string | null
          organisation_id: string
          transaction_id?: string | null
        }
        Update: {
          compte_credit_id?: string | null
          compte_debit_id?: string | null
          cree_le?: string | null
          date_ecriture?: string
          depense_id?: string | null
          devise?: string | null
          exercice_id?: string | null
          facture_id?: string | null
          id?: string
          libelle?: string
          montant?: number
          numero_piece?: string | null
          organisation_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecritures_comptables_compte_credit_id_fkey"
            columns: ["compte_credit_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_compte_debit_id_fkey"
            columns: ["compte_debit_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_depense_id_fkey"
            columns: ["depense_id"]
            isOneToOne: false
            referencedRelation: "depenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions_bancaires"
            referencedColumns: ["id"]
          },
        ]
      }
      employes: {
        Row: {
          actif: boolean | null
          adresse: string | null
          code_postal: string | null
          cree_le: string | null
          date_entree: string
          date_naissance: string | null
          date_sortie: string | null
          email: string | null
          iban: string | null
          id: string
          ijm_taux: number | null
          impot_source: boolean | null
          lpp_taux_employe: number | null
          mis_a_jour_le: string | null
          nom: string
          notes: string | null
          numero_avs: string | null
          organisation_id: string
          prenom: string
          salaire_brut_mensuel: number
          taux_activite: number | null
          taux_is: number | null
          telephone: string | null
          type_contrat: string | null
          ville: string | null
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          code_postal?: string | null
          cree_le?: string | null
          date_entree?: string
          date_naissance?: string | null
          date_sortie?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          ijm_taux?: number | null
          impot_source?: boolean | null
          lpp_taux_employe?: number | null
          mis_a_jour_le?: string | null
          nom: string
          notes?: string | null
          numero_avs?: string | null
          organisation_id: string
          prenom: string
          salaire_brut_mensuel?: number
          taux_activite?: number | null
          taux_is?: number | null
          telephone?: string | null
          type_contrat?: string | null
          ville?: string | null
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          code_postal?: string | null
          cree_le?: string | null
          date_entree?: string
          date_naissance?: string | null
          date_sortie?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          ijm_taux?: number | null
          impot_source?: boolean | null
          lpp_taux_employe?: number | null
          mis_a_jour_le?: string | null
          nom?: string
          notes?: string | null
          numero_avs?: string | null
          organisation_id?: string
          prenom?: string
          salaire_brut_mensuel?: number
          taux_activite?: number | null
          taux_is?: number | null
          telephone?: string | null
          type_contrat?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      envois_postaux: {
        Row: {
          couleur: boolean
          created_at: string
          destinataire: Json
          error_message: string | null
          expediteur: Json
          id: string
          invoice_id: string | null
          nombre_pages: number
          organisation_id: string
          prix_centimes: number
          reference_externe: string | null
          statut: string
          tracking_number: string | null
          type: string
          updated_at: string
        }
        Insert: {
          couleur?: boolean
          created_at?: string
          destinataire: Json
          error_message?: string | null
          expediteur: Json
          id?: string
          invoice_id?: string | null
          nombre_pages?: number
          organisation_id: string
          prix_centimes?: number
          reference_externe?: string | null
          statut?: string
          tracking_number?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          couleur?: boolean
          created_at?: string
          destinataire?: Json
          error_message?: string | null
          expediteur?: Json
          id?: string
          invoice_id?: string | null
          nombre_pages?: number
          organisation_id?: string
          prix_centimes?: number
          reference_externe?: string | null
          statut?: string
          tracking_number?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "envois_postaux_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envois_postaux_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercices_comptables: {
        Row: {
          annee: number
          cree_le: string | null
          date_debut: string
          date_fin: string
          id: string
          organisation_id: string
          statut: string | null
        }
        Insert: {
          annee: number
          cree_le?: string | null
          date_debut: string
          date_fin: string
          id?: string
          organisation_id: string
          statut?: string | null
        }
        Update: {
          annee?: number
          cree_le?: string | null
          date_debut?: string
          date_fin?: string
          id?: string
          organisation_id?: string
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercices_comptables_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          notes: string | null
          organisation_id: string | null
          organization_id: string | null
          receipt_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          organization_id?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          organization_id?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      exports_fiduciaire: {
        Row: {
          acces_id: string | null
          cree_le: string | null
          fichier_url: string | null
          id: string
          organisation_id: string
          periode_debut: string | null
          periode_fin: string | null
          type_export: string
        }
        Insert: {
          acces_id?: string | null
          cree_le?: string | null
          fichier_url?: string | null
          id?: string
          organisation_id: string
          periode_debut?: string | null
          periode_fin?: string | null
          type_export: string
        }
        Update: {
          acces_id?: string | null
          cree_le?: string | null
          fichier_url?: string | null
          id?: string
          organisation_id?: string
          periode_debut?: string | null
          periode_fin?: string | null
          type_export?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_fiduciaire_acces_id_fkey"
            columns: ["acces_id"]
            isOneToOne: false
            referencedRelation: "acces_fiduciaire"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exports_fiduciaire_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          archive_expiry_at: string | null
          archive_hash: string | null
          archived_at: string | null
          avoir_id: string | null
          client_address: string | null
          client_city: string | null
          client_company: string | null
          client_country: string | null
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          client_postal_code: string | null
          client_vat: string | null
          company_address: string
          company_city: string
          company_country: string
          company_email: string | null
          company_name: string
          company_phone: string | null
          company_postal_code: string
          company_vat: string | null
          conditions_paiement: number | null
          created_at: string | null
          date: string
          devise: string | null
          due_date: string
          facture_recurrente_id: string | null
          iban: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          items: Json
          marque_id: string | null
          montant_total: number | null
          notes: string | null
          numero_facture: string | null
          organisation_id: string | null
          recurrence_id: string | null
          reference_qr: string | null
          sous_total: number | null
          status: string
          subtotal: number
          tax_amount: number
          template_id: string | null
          terms: string | null
          total: number
          total_tva: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archive_expiry_at?: string | null
          archive_hash?: string | null
          archived_at?: string | null
          avoir_id?: string | null
          client_address?: string | null
          client_city?: string | null
          client_company?: string | null
          client_country?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          client_postal_code?: string | null
          client_vat?: string | null
          company_address: string
          company_city: string
          company_country: string
          company_email?: string | null
          company_name: string
          company_phone?: string | null
          company_postal_code: string
          company_vat?: string | null
          conditions_paiement?: number | null
          created_at?: string | null
          date: string
          devise?: string | null
          due_date: string
          facture_recurrente_id?: string | null
          iban?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          items?: Json
          marque_id?: string | null
          montant_total?: number | null
          notes?: string | null
          numero_facture?: string | null
          organisation_id?: string | null
          recurrence_id?: string | null
          reference_qr?: string | null
          sous_total?: number | null
          status: string
          subtotal: number
          tax_amount: number
          template_id?: string | null
          terms?: string | null
          total: number
          total_tva?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archive_expiry_at?: string | null
          archive_hash?: string | null
          archived_at?: string | null
          avoir_id?: string | null
          client_address?: string | null
          client_city?: string | null
          client_company?: string | null
          client_country?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          client_postal_code?: string | null
          client_vat?: string | null
          company_address?: string
          company_city?: string
          company_country?: string
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          company_postal_code?: string
          company_vat?: string | null
          conditions_paiement?: number | null
          created_at?: string | null
          date?: string
          devise?: string | null
          due_date?: string
          facture_recurrente_id?: string | null
          iban?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          items?: Json
          marque_id?: string | null
          montant_total?: number | null
          notes?: string | null
          numero_facture?: string | null
          organisation_id?: string | null
          recurrence_id?: string | null
          reference_qr?: string | null
          sous_total?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number
          template_id?: string | null
          terms?: string | null
          total?: number
          total_tva?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_facture_recurrente_id_fkey"
            columns: ["facture_recurrente_id"]
            isOneToOne: false
            referencedRelation: "factures_recurrentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_marque_id_fkey"
            columns: ["marque_id"]
            isOneToOne: false
            referencedRelation: "marques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates_facture"
            referencedColumns: ["id"]
          },
        ]
      }
      factures_recurrentes: {
        Row: {
          actif: boolean | null
          articles: Json
          client_id: string | null
          cree_le: string | null
          date_debut: string
          date_fin: string | null
          derniere_emission: string | null
          devise: string | null
          envoi_auto: boolean | null
          frequence: string
          id: string
          jour_emission: number | null
          mis_a_jour_le: string | null
          nom: string
          notes: string | null
          organisation_id: string
          prochaine_emission: string | null
          sous_total: number | null
          total: number | null
          total_tva: number | null
        }
        Insert: {
          actif?: boolean | null
          articles?: Json
          client_id?: string | null
          cree_le?: string | null
          date_debut?: string
          date_fin?: string | null
          derniere_emission?: string | null
          devise?: string | null
          envoi_auto?: boolean | null
          frequence?: string
          id?: string
          jour_emission?: number | null
          mis_a_jour_le?: string | null
          nom: string
          notes?: string | null
          organisation_id: string
          prochaine_emission?: string | null
          sous_total?: number | null
          total?: number | null
          total_tva?: number | null
        }
        Update: {
          actif?: boolean | null
          articles?: Json
          client_id?: string | null
          cree_le?: string | null
          date_debut?: string
          date_fin?: string | null
          derniere_emission?: string | null
          devise?: string | null
          envoi_auto?: boolean | null
          frequence?: string
          id?: string
          jour_emission?: number | null
          mis_a_jour_le?: string | null
          nom?: string
          notes?: string | null
          organisation_id?: string
          prochaine_emission?: string | null
          sous_total?: number | null
          total?: number | null
          total_tva?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_recurrentes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_recurrentes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiches_salaire: {
        Row: {
          ac_employe: number | null
          ac_employeur: number | null
          ai_employe: number | null
          ai_employeur: number | null
          allocations_familiales: number | null
          apg_employe: number | null
          apg_employeur: number | null
          autres_deductions: number | null
          avs_employe: number | null
          avs_employeur: number | null
          cout_total_employeur: number
          cree_le: string | null
          date_paiement: string | null
          employe_id: string
          heures_sup: number | null
          id: string
          ijm_employe: number | null
          impot_source: number | null
          indemnites: number | null
          lpp_employe: number | null
          lpp_employeur: number | null
          notes: string | null
          organisation_id: string
          periode: string
          primes: number | null
          salaire_brut: number
          salaire_net: number
          statut: string | null
          total_charges_patronales: number | null
          total_deductions: number | null
        }
        Insert: {
          ac_employe?: number | null
          ac_employeur?: number | null
          ai_employe?: number | null
          ai_employeur?: number | null
          allocations_familiales?: number | null
          apg_employe?: number | null
          apg_employeur?: number | null
          autres_deductions?: number | null
          avs_employe?: number | null
          avs_employeur?: number | null
          cout_total_employeur: number
          cree_le?: string | null
          date_paiement?: string | null
          employe_id: string
          heures_sup?: number | null
          id?: string
          ijm_employe?: number | null
          impot_source?: number | null
          indemnites?: number | null
          lpp_employe?: number | null
          lpp_employeur?: number | null
          notes?: string | null
          organisation_id: string
          periode: string
          primes?: number | null
          salaire_brut: number
          salaire_net: number
          statut?: string | null
          total_charges_patronales?: number | null
          total_deductions?: number | null
        }
        Update: {
          ac_employe?: number | null
          ac_employeur?: number | null
          ai_employe?: number | null
          ai_employeur?: number | null
          allocations_familiales?: number | null
          apg_employe?: number | null
          apg_employeur?: number | null
          autres_deductions?: number | null
          avs_employe?: number | null
          avs_employeur?: number | null
          cout_total_employeur?: number
          cree_le?: string | null
          date_paiement?: string | null
          employe_id?: string
          heures_sup?: number | null
          id?: string
          ijm_employe?: number | null
          impot_source?: number | null
          indemnites?: number | null
          lpp_employe?: number | null
          lpp_employeur?: number | null
          notes?: string | null
          organisation_id?: string
          periode?: string
          primes?: number | null
          salaire_brut?: number
          salaire_net?: number
          statut?: string | null
          total_charges_patronales?: number | null
          total_deductions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiches_salaire_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      fichiers_bancaires: {
        Row: {
          cree_le: string | null
          date_import: string | null
          id: string
          nb_transactions: number | null
          nom_fichier: string
          organisation_id: string
          statut: string | null
          type_fichier: string
        }
        Insert: {
          cree_le?: string | null
          date_import?: string | null
          id?: string
          nb_transactions?: number | null
          nom_fichier: string
          organisation_id: string
          statut?: string | null
          type_fichier: string
        }
        Update: {
          cree_le?: string | null
          date_import?: string | null
          id?: string
          nb_transactions?: number | null
          nom_fichier?: string
          organisation_id?: string
          statut?: string | null
          type_fichier?: string
        }
        Relationships: [
          {
            foreignKeyName: "fichiers_bancaires_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      fournisseurs: {
        Row: {
          actif: boolean
          adresse: string | null
          code_postal: string | null
          contact: string | null
          created_at: string
          delai_paiement: number
          email: string | null
          iban: string | null
          id: string
          nom: string
          notes: string | null
          numero: string | null
          organisation_id: string
          pays: string
          telephone: string | null
          tva_numero: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          code_postal?: string | null
          contact?: string | null
          created_at?: string
          delai_paiement?: number
          email?: string | null
          iban?: string | null
          id?: string
          nom: string
          notes?: string | null
          numero?: string | null
          organisation_id: string
          pays?: string
          telephone?: string | null
          tva_numero?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          code_postal?: string | null
          contact?: string | null
          created_at?: string
          delai_paiement?: number
          email?: string | null
          iban?: string | null
          id?: string
          nom?: string
          notes?: string | null
          numero?: string | null
          organisation_id?: string
          pays?: string
          telephone?: string | null
          tva_numero?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fournisseurs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          cree_le: string | null
          erreurs_detail: Json | null
          id: string
          nb_erreurs: number | null
          nb_importees: number | null
          nb_lignes: number | null
          organisation_id: string
          source: string
          statut: string | null
          type_donnees: string
        }
        Insert: {
          cree_le?: string | null
          erreurs_detail?: Json | null
          id?: string
          nb_erreurs?: number | null
          nb_importees?: number | null
          nb_lignes?: number | null
          organisation_id: string
          source: string
          statut?: string | null
          type_donnees: string
        }
        Update: {
          cree_le?: string | null
          erreurs_detail?: Json | null
          id?: string
          nb_erreurs?: number | null
          nb_importees?: number | null
          nb_lignes?: number | null
          organisation_id?: string
          source?: string
          statut?: string | null
          type_donnees?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations_organisation: {
        Row: {
          accepted: boolean
          created_at: string
          email: string
          id: string
          invited_by: string | null
          metadata: Json | null
          organisation_id: string
          role: string
          token: string | null
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          metadata?: Json | null
          organisation_id: string
          role?: string
          token?: string | null
        }
        Update: {
          accepted?: boolean
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          metadata?: Json | null
          organisation_id?: string
          role?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organisation_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      marques: {
        Row: {
          actif: boolean
          adresse: string | null
          conditions_paiement: string | null
          couleur_primaire: string
          couleur_secondaire: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_default: boolean
          logo_url: string | null
          mentions_legales: string | null
          nom: string
          organisation_id: string
          pied_facture: string | null
          police: string | null
          site_web: string | null
          slug: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          conditions_paiement?: string | null
          couleur_primaire?: string
          couleur_secondaire?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          mentions_legales?: string | null
          nom: string
          organisation_id: string
          pied_facture?: string | null
          police?: string | null
          site_web?: string | null
          slug: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          conditions_paiement?: string | null
          couleur_primaire?: string
          couleur_secondaire?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          mentions_legales?: string | null
          nom?: string
          organisation_id?: string
          pied_facture?: string | null
          police?: string | null
          site_web?: string | null
          slug?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marques_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_scans: {
        Row: {
          cree_le: string | null
          depense_id: string | null
          id: string
          image_url: string
          organisation_id: string
          resultat_json: Json | null
          statut: string
        }
        Insert: {
          cree_le?: string | null
          depense_id?: string | null
          id?: string
          image_url: string
          organisation_id: string
          resultat_json?: Json | null
          statut?: string
        }
        Update: {
          cree_le?: string | null
          depense_id?: string | null
          id?: string
          image_url?: string
          organisation_id?: string
          resultat_json?: Json | null
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_scans_depense_id_fkey"
            columns: ["depense_id"]
            isOneToOne: false
            referencedRelation: "depenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_scans_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          address_spacing: string | null
          adresse: string | null
          code_postal: string | null
          created_at: string | null
          cree_le: string
          email: string | null
          font_family: string | null
          header_bg_color: string | null
          iban: string | null
          id: string
          logo_url: string | null
          mis_a_jour_le: string
          nom: string
          numero_tva: string | null
          pays: string | null
          primary_color: string | null
          profil_metier: string | null
          proprietaire_id: string
          qr_position: string | null
          site_web: string | null
          subscription_plan: string | null
          subscription_status: string | null
          telephone: string | null
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          address_spacing?: string | null
          adresse?: string | null
          code_postal?: string | null
          created_at?: string | null
          cree_le?: string
          email?: string | null
          font_family?: string | null
          header_bg_color?: string | null
          iban?: string | null
          id?: string
          logo_url?: string | null
          mis_a_jour_le?: string
          nom: string
          numero_tva?: string | null
          pays?: string | null
          primary_color?: string | null
          profil_metier?: string | null
          proprietaire_id: string
          qr_position?: string | null
          site_web?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          telephone?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          address_spacing?: string | null
          adresse?: string | null
          code_postal?: string | null
          created_at?: string | null
          cree_le?: string
          email?: string | null
          font_family?: string | null
          header_bg_color?: string | null
          iban?: string | null
          id?: string
          logo_url?: string | null
          mis_a_jour_le?: string
          nom?: string
          numero_tva?: string | null
          pays?: string | null
          primary_color?: string | null
          profil_metier?: string | null
          proprietaire_id?: string
          qr_position?: string | null
          site_web?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          telephone?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          expires_at: string | null
          external_id: string | null
          external_transaction_id: string | null
          id: string
          invoice_id: string
          invoice_number: string
          paid_at: string | null
          payment_method: string | null
          payment_url: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_id?: string | null
          external_transaction_id?: string | null
          id?: string
          invoice_id: string
          invoice_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_url: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_id?: string | null
          external_transaction_id?: string | null
          id?: string
          invoice_id?: string
          invoice_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_url?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_comptable: {
        Row: {
          actif: boolean | null
          categorie: string | null
          cree_le: string | null
          est_systeme: boolean | null
          id: string
          nom: string
          numero: string
          organisation_id: string | null
          parent_id: string | null
          type_compte: string
        }
        Insert: {
          actif?: boolean | null
          categorie?: string | null
          cree_le?: string | null
          est_systeme?: boolean | null
          id?: string
          nom: string
          numero: string
          organisation_id?: string | null
          parent_id?: string | null
          type_compte: string
        }
        Update: {
          actif?: boolean | null
          categorie?: string | null
          cree_le?: string | null
          est_systeme?: boolean | null
          id?: string
          nom?: string
          numero?: string
          organisation_id?: string | null
          parent_id?: string | null
          type_compte?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_comptable_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comptable_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          enable_api: boolean
          enable_ebill: boolean
          enable_fiduciaire: boolean
          eur_to_chf: number
          hero_bg_color: string | null
          hero_button_bg_color: string | null
          hero_button_text_color: string | null
          hero_carousel_urls: string[]
          hero_cta_label: string | null
          hero_cta_url: string | null
          hero_image_url: string | null
          hero_media_type: string
          hero_secondary_cta_label: string | null
          hero_secondary_cta_url: string | null
          hero_subtitle: string | null
          hero_text_color: string | null
          hero_title: string | null
          hero_video_url: string | null
          id: boolean
          maintenance_mode: boolean
          max_invoices_business: number
          max_invoices_starter: number
          smtp_from: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_user: string | null
          trial_days: number
          updated_at: string
          updated_by: string | null
          usd_to_chf: number
        }
        Insert: {
          enable_api?: boolean
          enable_ebill?: boolean
          enable_fiduciaire?: boolean
          eur_to_chf?: number
          hero_bg_color?: string | null
          hero_button_bg_color?: string | null
          hero_button_text_color?: string | null
          hero_carousel_urls?: string[]
          hero_cta_label?: string | null
          hero_cta_url?: string | null
          hero_image_url?: string | null
          hero_media_type?: string
          hero_secondary_cta_label?: string | null
          hero_secondary_cta_url?: string | null
          hero_subtitle?: string | null
          hero_text_color?: string | null
          hero_title?: string | null
          hero_video_url?: string | null
          id?: boolean
          maintenance_mode?: boolean
          max_invoices_business?: number
          max_invoices_starter?: number
          smtp_from?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          trial_days?: number
          updated_at?: string
          updated_by?: string | null
          usd_to_chf?: number
        }
        Update: {
          enable_api?: boolean
          enable_ebill?: boolean
          enable_fiduciaire?: boolean
          eur_to_chf?: number
          hero_bg_color?: string | null
          hero_button_bg_color?: string | null
          hero_button_text_color?: string | null
          hero_carousel_urls?: string[]
          hero_cta_label?: string | null
          hero_cta_url?: string | null
          hero_image_url?: string | null
          hero_media_type?: string
          hero_secondary_cta_label?: string | null
          hero_secondary_cta_url?: string | null
          hero_subtitle?: string | null
          hero_text_color?: string | null
          hero_title?: string | null
          hero_video_url?: string | null
          id?: boolean
          maintenance_mode?: boolean
          max_invoices_business?: number
          max_invoices_starter?: number
          smtp_from?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          trial_days?: number
          updated_at?: string
          updated_by?: string | null
          usd_to_chf?: number
        }
        Relationships: []
      }
      portail_client_liens: {
        Row: {
          actif: boolean
          client_email: string
          client_nom: string | null
          created_at: string
          dernier_acces: string | null
          expires_at: string
          id: string
          message_accueil: string | null
          nb_acces: number
          organisation_id: string
          token: string
        }
        Insert: {
          actif?: boolean
          client_email: string
          client_nom?: string | null
          created_at?: string
          dernier_acces?: string | null
          expires_at?: string
          id?: string
          message_accueil?: string | null
          nb_acces?: number
          organisation_id: string
          token?: string
        }
        Update: {
          actif?: boolean
          client_email?: string
          client_nom?: string | null
          created_at?: string
          dernier_acces?: string | null
          expires_at?: string
          id?: string
          message_accueil?: string | null
          nb_acces?: number
          organisation_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "portail_client_liens_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          actif: boolean | null
          categorie: string | null
          cree_le: string | null
          description: string | null
          id: string
          mis_a_jour_le: string | null
          nom: string
          organisation_id: string
          prix_unitaire: number
          taux_tva: number
          unite: string | null
        }
        Insert: {
          actif?: boolean | null
          categorie?: string | null
          cree_le?: string | null
          description?: string | null
          id?: string
          mis_a_jour_le?: string | null
          nom: string
          organisation_id: string
          prix_unitaire?: number
          taux_tva?: number
          unite?: string | null
        }
        Update: {
          actif?: boolean | null
          categorie?: string | null
          cree_le?: string | null
          description?: string | null
          id?: string
          mis_a_jour_le?: string | null
          nom?: string
          organisation_id?: string
          prix_unitaire?: number
          taux_tva?: number
          unite?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produits_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      profils: {
        Row: {
          avatar_url: string | null
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string | null
          plan_abonnement: string
          referral_code: string | null
          referral_reward_granted_at: string | null
          referred_by_code: string | null
          referred_by_profile_id: string | null
          role: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean | null
          name?: string | null
          plan_abonnement?: string
          referral_code?: string | null
          referral_reward_granted_at?: string | null
          referred_by_code?: string | null
          referred_by_profile_id?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          plan_abonnement?: string
          referral_code?: string | null
          referral_reward_granted_at?: string | null
          referred_by_code?: string | null
          referred_by_profile_id?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profils_referred_by_profile_id_fkey"
            columns: ["referred_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      projets: {
        Row: {
          budget_heures: number | null
          client_id: string | null
          couleur: string | null
          cree_le: string | null
          date_debut: string | null
          date_fin: string | null
          description: string | null
          devise: string | null
          id: string
          mis_a_jour_le: string | null
          nom: string
          organisation_id: string
          statut: string | null
          tarif_horaire: number | null
        }
        Insert: {
          budget_heures?: number | null
          client_id?: string | null
          couleur?: string | null
          cree_le?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          devise?: string | null
          id?: string
          mis_a_jour_le?: string | null
          nom: string
          organisation_id: string
          statut?: string | null
          tarif_horaire?: number | null
        }
        Update: {
          budget_heures?: number | null
          client_id?: string | null
          couleur?: string | null
          cree_le?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          devise?: string | null
          id?: string
          mis_a_jour_le?: string | null
          nom?: string
          organisation_id?: string
          statut?: string | null
          tarif_horaire?: number | null
        }
        Relationships: []
      }
      rappels: {
        Row: {
          categorie: string
          contenu: string | null
          created_at: string | null
          cree_le: string | null
          date_echeance: string
          date_envoi: string | null
          description: string | null
          facture_id: string | null
          id: string
          niveau: number | null
          organisation_id: string | null
          statut: string
          titre: string
          type_rappel: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categorie?: string
          contenu?: string | null
          created_at?: string | null
          cree_le?: string | null
          date_echeance: string
          date_envoi?: string | null
          description?: string | null
          facture_id?: string | null
          id?: string
          niveau?: number | null
          organisation_id?: string | null
          statut?: string
          titre: string
          type_rappel?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categorie?: string
          contenu?: string | null
          created_at?: string | null
          cree_le?: string | null
          date_echeance?: string
          date_envoi?: string | null
          description?: string | null
          facture_id?: string | null
          id?: string
          niveau?: number | null
          organisation_id?: string | null
          statut?: string
          titre?: string
          type_rappel?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rappels_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_temps: {
        Row: {
          cree_le: string | null
          debut_at: string | null
          description: string | null
          duree_minutes: number | null
          facturable: boolean | null
          facture: boolean | null
          facture_id: string | null
          fin_at: string | null
          id: string
          projet_id: string
          user_id: string | null
        }
        Insert: {
          cree_le?: string | null
          debut_at?: string | null
          description?: string | null
          duree_minutes?: number | null
          facturable?: boolean | null
          facture?: boolean | null
          facture_id?: string | null
          fin_at?: string | null
          id?: string
          projet_id: string
          user_id?: string | null
        }
        Update: {
          cree_le?: string | null
          debut_at?: string | null
          description?: string | null
          duree_minutes?: number | null
          facturable?: boolean | null
          facture?: boolean | null
          facture_id?: string | null
          fin_at?: string | null
          id?: string
          projet_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_temps_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_demandes: {
        Row: {
          created_at: string
          document_id: string
          document_titre: string
          document_type: string
          expires_at: string
          id: string
          ip_signataire: string | null
          message_personnalise: string | null
          nom_signe: string | null
          organisation_id: string
          rappel_envoye_at: string | null
          refuse_raison: string | null
          signataire_email: string
          signataire_nom: string
          signature_data: string | null
          signature_type: string | null
          signe_at: string | null
          statut: string
          token: string
          user_agent_signataire: string | null
          vu_at: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          document_titre: string
          document_type: string
          expires_at?: string
          id?: string
          ip_signataire?: string | null
          message_personnalise?: string | null
          nom_signe?: string | null
          organisation_id: string
          rappel_envoye_at?: string | null
          refuse_raison?: string | null
          signataire_email: string
          signataire_nom: string
          signature_data?: string | null
          signature_type?: string | null
          signe_at?: string | null
          statut?: string
          token?: string
          user_agent_signataire?: string | null
          vu_at?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          document_titre?: string
          document_type?: string
          expires_at?: string
          id?: string
          ip_signataire?: string | null
          message_personnalise?: string | null
          nom_signe?: string | null
          organisation_id?: string
          rappel_envoye_at?: string | null
          refuse_raison?: string | null
          signataire_email?: string
          signataire_nom?: string
          signature_data?: string | null
          signature_type?: string | null
          signe_at?: string | null
          statut?: string
          token?: string
          user_agent_signataire?: string | null
          vu_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_demandes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_articles: {
        Row: {
          actif: boolean
          categorie: string | null
          cout_unitaire: number
          created_at: string
          description: string | null
          emplacement: string | null
          id: string
          nom: string
          organisation_id: string
          produit_id: string | null
          quantite: number
          quantite_max: number | null
          quantite_min: number
          reference: string | null
          unite: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          categorie?: string | null
          cout_unitaire?: number
          created_at?: string
          description?: string | null
          emplacement?: string | null
          id?: string
          nom: string
          organisation_id: string
          produit_id?: string | null
          quantite?: number
          quantite_max?: number | null
          quantite_min?: number
          reference?: string | null
          unite?: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          categorie?: string | null
          cout_unitaire?: number
          created_at?: string
          description?: string | null
          emplacement?: string | null
          id?: string
          nom?: string
          organisation_id?: string
          produit_id?: string | null
          quantite?: number
          quantite_max?: number | null
          quantite_min?: number
          reference?: string | null
          unite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_articles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_articles_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_mouvements: {
        Row: {
          article_id: string
          cout_unitaire: number | null
          created_at: string
          created_by: string | null
          id: string
          motif: string | null
          organisation_id: string
          quantite: number
          quantite_apres: number
          quantite_avant: number
          reference_doc: string | null
          type: string
        }
        Insert: {
          article_id: string
          cout_unitaire?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          motif?: string | null
          organisation_id: string
          quantite: number
          quantite_apres: number
          quantite_avant: number
          reference_doc?: string | null
          type: string
        }
        Update: {
          article_id?: string
          cout_unitaire?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          motif?: string | null
          organisation_id?: string
          quantite?: number
          quantite_apres?: number
          quantite_avant?: number
          reference_doc?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_mouvements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "stock_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mouvements_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      taches: {
        Row: {
          assignee_id: string | null
          cree_le: string | null
          date_echeance: string | null
          description: string | null
          heures_estimees: number | null
          heures_reelles: number | null
          id: string
          priorite: string | null
          projet_id: string
          statut: string | null
          titre: string
        }
        Insert: {
          assignee_id?: string | null
          cree_le?: string | null
          date_echeance?: string | null
          description?: string | null
          heures_estimees?: number | null
          heures_reelles?: number | null
          id?: string
          priorite?: string | null
          projet_id: string
          statut?: string | null
          titre: string
        }
        Update: {
          assignee_id?: string | null
          cree_le?: string | null
          date_echeance?: string | null
          description?: string | null
          heures_estimees?: number | null
          heures_reelles?: number | null
          id?: string
          priorite?: string | null
          projet_id?: string
          statut?: string | null
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "taches_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_facture: {
        Row: {
          config: Json
          cree_le: string | null
          description: string | null
          est_defaut: boolean | null
          est_systeme: boolean | null
          id: string
          nom: string
          organisation_id: string | null
        }
        Insert: {
          config?: Json
          cree_le?: string | null
          description?: string | null
          est_defaut?: boolean | null
          est_systeme?: boolean | null
          id?: string
          nom: string
          organisation_id?: string | null
        }
        Update: {
          config?: Json
          cree_le?: string | null
          description?: string | null
          est_defaut?: boolean | null
          est_systeme?: boolean | null
          id?: string
          nom?: string
          organisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_facture_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          cree_le: string
          description: string
          id: string
          mis_a_jour_le: string
          organisation_id: string
          priorite: Database["public"]["Enums"]["priorite_ticket"]
          statut: Database["public"]["Enums"]["statut_ticket"]
          titre: string
          utilisateur_id: string
        }
        Insert: {
          cree_le?: string
          description: string
          id?: string
          mis_a_jour_le?: string
          organisation_id: string
          priorite?: Database["public"]["Enums"]["priorite_ticket"]
          statut?: Database["public"]["Enums"]["statut_ticket"]
          titre: string
          utilisateur_id: string
        }
        Update: {
          cree_le?: string
          description?: string
          id?: string
          mis_a_jour_le?: string
          organisation_id?: string
          priorite?: Database["public"]["Enums"]["priorite_ticket"]
          statut?: Database["public"]["Enums"]["statut_ticket"]
          titre?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_bancaires: {
        Row: {
          compte_id: string
          cree_le: string | null
          date_comptable: string | null
          date_valeur: string
          depense_id: string | null
          description: string | null
          devise: string | null
          facture_id: string | null
          id: string
          montant: number
          organisation_id: string
          reference: string | null
          statut_rapprochement: string | null
          type: string | null
        }
        Insert: {
          compte_id: string
          cree_le?: string | null
          date_comptable?: string | null
          date_valeur: string
          depense_id?: string | null
          description?: string | null
          devise?: string | null
          facture_id?: string | null
          id?: string
          montant: number
          organisation_id: string
          reference?: string | null
          statut_rapprochement?: string | null
          type?: string | null
        }
        Update: {
          compte_id?: string
          cree_le?: string | null
          date_comptable?: string | null
          date_valeur?: string
          depense_id?: string | null
          description?: string | null
          devise?: string | null
          facture_id?: string | null
          id?: string
          montant?: number
          organisation_id?: string
          reference?: string | null
          statut_rapprochement?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bancaires_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "comptes_bancaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bancaires_depense_id_fkey"
            columns: ["depense_id"]
            isOneToOne: false
            referencedRelation: "depenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bancaires_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bancaires_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      utilisateurs_organisations: {
        Row: {
          cree_le: string
          id: string
          mis_a_jour_le: string | null
          organisation_id: string
          permissions: string[] | null
          role: Database["public"]["Enums"]["role_utilisateur"]
          utilisateur_id: string
        }
        Insert: {
          cree_le?: string
          id?: string
          mis_a_jour_le?: string | null
          organisation_id: string
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["role_utilisateur"]
          utilisateur_id: string
        }
        Update: {
          cree_le?: string
          id?: string
          mis_a_jour_le?: string | null
          organisation_id?: string
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["role_utilisateur"]
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilisateurs_organisations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes_pos: {
        Row: {
          client_id: string | null
          client_nom: string | null
          created_at: string
          id: string
          invoice_id: string | null
          lignes: Json
          mode_paiement: string
          monnaie_rendue: number | null
          montant_recu: number | null
          numero: string
          organisation_id: string
          remise_totale: number
          total_ht: number
          total_ttc: number
          total_tva: number
        }
        Insert: {
          client_id?: string | null
          client_nom?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          lignes?: Json
          mode_paiement: string
          monnaie_rendue?: number | null
          montant_recu?: number | null
          numero: string
          organisation_id: string
          remise_totale?: number
          total_ht?: number
          total_ttc?: number
          total_tva?: number
        }
        Update: {
          client_id?: string | null
          client_nom?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          lignes?: Json
          mode_paiement?: string
          monnaie_rendue?: number | null
          montant_recu?: number | null
          numero?: string
          organisation_id?: string
          remise_totale?: number
          total_ht?: number
          total_ttc?: number
          total_tva?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventes_pos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_pos_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_pos_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      payment_links_with_invoice: {
        Row: {
          amount_cents: number | null
          client_email: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          devise: string | null
          expires_at: string | null
          external_id: string | null
          external_transaction_id: string | null
          facture_number: string | null
          id: string | null
          invoice_id: string | null
          invoice_number: string | null
          organisation_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_url: string | null
          provider: string | null
          status: string | null
          total: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archiver_document: {
        Args: {
          p_document_id: string
          p_document_type: string
          p_hash: string
          p_metadata?: Json
          p_organisation_id: string
        }
        Returns: string
      }
      creer_organisation: {
        Args: { nom_organisation: string }
        Returns: string
      }
      generer_cle_api: { Args: never; Returns: string }
      get_homepage_hero: {
        Args: never
        Returns: {
          hero_bg_color: string
          hero_button_bg_color: string
          hero_button_text_color: string
          hero_carousel_urls: string[]
          hero_cta_label: string
          hero_cta_url: string
          hero_image_url: string
          hero_media_type: string
          hero_secondary_cta_label: string
          hero_secondary_cta_url: string
          hero_subtitle: string
          hero_text_color: string
          hero_title: string
          hero_video_url: string
        }[]
      }
      get_mes_filleuls: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          plan_abonnement: string
          referral_reward_granted_at: string
          subscription_status: string
        }[]
      }
      get_my_organisation_id: { Args: never; Returns: string }
      get_my_profil_metier: { Args: never; Returns: string }
      get_remaining_trial_days: { Args: { p_user_id: string }; Returns: number }
      get_user_org_ids: { Args: never; Returns: string[] }
      is_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_user_on_trial: { Args: { p_user_id: string }; Returns: boolean }
      set_profil_metier: {
        Args: { p_organisation_id: string; p_profil: string }
        Returns: undefined
      }
    }
    Enums: {
      priorite_ticket: "basse" | "normale" | "elevee" | "urgente"
      role_utilisateur: "admin" | "membre" | "lecteur"
      statut_ticket: "ouvert" | "en_cours" | "resolu"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      priorite_ticket: ["basse", "normale", "elevee", "urgente"],
      role_utilisateur: ["admin", "membre", "lecteur"],
      statut_ticket: ["ouvert", "en_cours", "resolu"],
    },
  },
} as const
