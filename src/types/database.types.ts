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
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          id: string
          nom_organisation: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom_organisation: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom_organisation?: string
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
