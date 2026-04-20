import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';
import { BUSINESS_PROFILES, PROFIL_LIST, type ProfilMetier } from '@/config/businessProfiles';
import { useTranslation } from 'react-i18next';
import {
  BellIcon,
  CreditCardIcon,
  GlobeAltIcon,
  KeyIcon,
  EnvelopeIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { formatIbanDisplay } from '../services/swissQrService';
import { z } from 'zod';

// ─── Validation IBAN suisse ────────────────────────────────────────────────────

function validateSwissIban(val: string): boolean {
  const clean = val.replace(/\s/g, '').toUpperCase();
  if (!clean) return true; // facultatif
  if (!/^CH\d{19}$/.test(clean)) return false;
  // Vérification modulo 97 (ISO 7064)
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  return remainder === 1;
}

// ─── Schema Zod Organisation ───────────────────────────────────────────────────

export const orgSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  adresse: z.string().optional(),
  code_postal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional(),
  iban: z.string().refine(
    (val) => validateSwissIban(val),
    { message: 'IBAN suisse invalide (format : CH + 19 chiffres)' }
  ),
  numero_tva: z.string().optional(),
  logo_url: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').optional().or(z.literal('')),
  header_bg_color: z.string().optional(),
  font_family: z.string().optional(),
  qr_position: z.string().optional(),
  address_spacing: z.string().optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgForm {
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  iban: string;
  numero_tva: string;
  email: string;
  telephone: string;
  logo_url: string;
  primary_color: string;
  header_bg_color: string;
  font_family: string;
  qr_position: string;
  address_spacing: string;
}

const DEFAULT_ORG: OrgForm = {
  nom: '',
  adresse: '',
  code_postal: '',
  ville: '',
  pays: 'CH',
  iban: '',
  numero_tva: '',
  email: '',
  telephone: '',
  logo_url: '',
  primary_color: '#2563EB',
  header_bg_color: '#F3F4F6',
  font_family: 'helvetica',
  qr_position: 'center',
  address_spacing: 'normal',
};

// ─── Sélecteur de profil métier ───────────────────────────────────────────────

const ProfilMetierSection: React.FC<{
  profilMetier: ProfilMetier | null;
  onSave: (profil: ProfilMetier) => Promise<void>;
}> = ({ profilMetier, onSave }) => {
  const [selected, setSelected] = useState<ProfilMetier | null>(profilMetier);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await onSave(selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">🏢 Profil métier</h3>
      <p className="mt-1 text-sm text-gray-500 mb-5">
        Choisissez votre type d'activité pour adapter le menu et les outils affichés.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {PROFIL_LIST.map((id) => {
          const profile = BUSINESS_PROFILES[id];
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl leading-none">{profile.emoji}</span>
              <div>
                <p className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                  {profile.label}
                </p>
                <p className="text-xs text-gray-400">{profile.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={handleSave}
        disabled={!selected || saving || selected === profilMetier}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          selected && !saving && selected !== profilMetier
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {saving ? (
          <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Enregistrement…</>
        ) : saved ? (
          <><span>✓</span> Profil mis à jour</>
        ) : (
          'Enregistrer le profil'
        )}
      </button>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { organisationId, profilMetier, updateProfilMetier } = useOrganisation();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('organisation');

  // ── État Organisation ──
  const [orgForm, setOrgForm] = useState<OrgForm>(DEFAULT_ORG);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgFeedback, setOrgFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ibanError, setIbanError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const tabs = [
    { id: 'organisation', name: 'Organisation', icon: BuildingOfficeIcon },
    { id: 'personnalisation', name: '🎨 Personnalisation', icon: BuildingOfficeIcon },
    { id: 'account', name: 'Compte', icon: UserCircleIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'billing', name: 'Facturation', icon: CreditCardIcon },
    { id: 'security', name: 'Sécurité', icon: KeyIcon },
    { id: 'preferences', name: 'Préférences', icon: GlobeAltIcon },
    { id: 'emails', name: 'Emails', icon: EnvelopeIcon },
  ];

  // ── Charger les données de l'organisation ──
  useEffect(() => {
    if (!organisationId) {
      setOrgLoading(false); // évite le spinner infini si pas encore d'org
      return;
    }
    const fetchOrg = async () => {
      setOrgLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org, error } = await (supabase as any)
          .from('organisations')
          .select('nom, adresse, code_postal, ville, pays, iban, numero_tva, email, telephone, logo_url, primary_color, header_bg_color, font_family, qr_position, address_spacing')
          .eq('id', organisationId)
          .single();
        if (!error && org) {
          setOrgForm({
            nom: org.nom || '',
            adresse: org.adresse || '',
            code_postal: org.code_postal || '',
            ville: org.ville || '',
            pays: org.pays || 'CH',
            iban: org.iban || '',
            numero_tva: org.numero_tva || '',
            email: org.email || '',
            telephone: org.telephone || '',
            logo_url: org.logo_url || '',
            primary_color: org.primary_color || '#2563EB',
            header_bg_color: org.header_bg_color || '#F3F4F6',
            font_family: org.font_family || 'helvetica',
            qr_position: org.qr_position || 'center',
            address_spacing: org.address_spacing || 'normal',
          });
        }
      } catch (err) {
        console.error('Erreur chargement organisation:', err);
      } finally {
        setOrgLoading(false);
      }
    };
    fetchOrg();
  }, [organisationId]);

  // ── Upload du logo ──
  const handleLogoUpload = async (file: File) => {
    if (!organisationId) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${organisationId}/logo.${ext}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: uploadError } = await (supabase as any).storage
        .from('org-logos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: urlData } = (supabase as any).storage
        .from('org-logos')
        .getPublicUrl(path);
      const publicUrl = urlData?.publicUrl || '';
      setOrgForm(f => ({ ...f, logo_url: publicUrl + '?t=' + Date.now() }));
    } catch (err: any) {
      setLogoError(err?.message || 'Erreur lors de l\'upload du logo. Vérifiez que le bucket "org-logos" existe dans Supabase Storage.');
    } finally {
      setLogoUploading(false);
    }
  };

  // ── Saisie IBAN — pas de validation bloquante, on accepte tout RIB suisse ──
  const handleIbanChange = (value: string) => {
    setOrgForm(f => ({ ...f, iban: value }));
    setIbanError(null);
  };

  // ── Sauvegarder l'organisation ──
  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    // Validation Zod
    const validation = orgSchema.safeParse(orgForm);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      setOrgFeedback({ type: 'error', message: firstError.message });
      return;
    }

    setOrgSaving(true);
    setOrgFeedback(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('organisations')
        .update({
          nom: orgForm.nom,
          adresse: orgForm.adresse,
          code_postal: orgForm.code_postal,
          ville: orgForm.ville,
          pays: orgForm.pays,
          iban: orgForm.iban.replace(/\s/g, '').toUpperCase() || null,
          numero_tva: orgForm.numero_tva || null,
          email: orgForm.email || null,
          telephone: orgForm.telephone || null,
          logo_url: orgForm.logo_url || null,
          primary_color: orgForm.primary_color || '#2563EB',
          header_bg_color: orgForm.header_bg_color || '#F3F4F6',
          font_family: orgForm.font_family || 'helvetica',
          qr_position: orgForm.qr_position || 'center',
          address_spacing: orgForm.address_spacing || 'normal',
        })
        .eq('id', organisationId);

      if (error) throw error;
      setOrgFeedback({ type: 'success', message: 'Informations de l\'organisation mises à jour avec succès.' });
    } catch (err: any) {
      console.error('Erreur sauvegarde organisation:', err);
      setOrgFeedback({ type: 'error', message: err?.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setOrgSaving(false);
    }
  };

  const isOrgIncomplete = !orgForm.adresse || !orgForm.iban || !orgForm.ville || !orgForm.code_postal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('settings.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('settings.general')}
          </p>
        </div>
      </div>

      {/* Bannière si informations incomplètes */}
      {isOrgIncomplete && activeTab !== 'organisation' && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-800">
          <FiAlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
          <span>
            Votre profil d'organisation est incomplet (adresse, IBAN manquants). Les factures générées seront incomplètes.{' '}
            <button onClick={() => setActiveTab('organisation')} className="underline font-medium hover:text-amber-900">
              Compléter →
            </button>
          </span>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="lg:grid lg:grid-cols-12">
          <div className="lg:col-span-3 border-r border-gray-200">
            <nav className="space-y-1 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group border-l-4 px-3 py-2 flex items-center text-sm font-medium w-full text-left rounded-r-md transition-colors`}
                >
                  <tab.icon
                    className={`${
                      activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    } flex-shrink-0 -ml-1 mr-3 h-5 w-5`}
                  />
                  <span className="truncate">{tab.name}</span>
                  {tab.id === 'organisation' && isOrgIncomplete && (
                    <span className="ml-auto inline-block w-2 h-2 rounded-full bg-amber-400" title="Informations incomplètes" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-9 p-6">

            {/* ── Onglet Organisation ── */}
            {activeTab === 'organisation' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Profil de l'organisation</h3>
                  {!isOrgIncomplete && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <FiCheck className="w-3 h-3" /> Complet
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 mb-6">
                  Ces informations apparaissent sur vos factures et dans le QR-bill suisse. Complétez l'IBAN pour activer le paiement QR.
                </p>

                {isOrgIncomplete && (
                  <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                    <FiAlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <p className="font-semibold mb-0.5">Informations manquantes</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {!orgForm.adresse && <li>Adresse</li>}
                        {(!orgForm.code_postal || !orgForm.ville) && <li>Code postal / Ville</li>}
                        {!orgForm.iban && <li>IBAN — requis pour le QR-bill et le paiement en ligne</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {orgLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveOrg} className="space-y-6">
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'organisation / raison sociale <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orgForm.nom}
                        onChange={e => setOrgForm(f => ({ ...f, nom: e.target.value }))}
                        placeholder="Mon Entreprise Sàrl"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Adresse */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse (rue + numéro) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={orgForm.adresse}
                        onChange={e => setOrgForm(f => ({ ...f, adresse: e.target.value }))}
                        placeholder="Rue de la Paix 12"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Code postal + Ville */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Code postal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={orgForm.code_postal}
                          onChange={e => setOrgForm(f => ({ ...f, code_postal: e.target.value }))}
                          placeholder="1201"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ville <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={orgForm.ville}
                          onChange={e => setOrgForm(f => ({ ...f, ville: e.target.value }))}
                          placeholder="Genève"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Pays */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                        <select
                          value={orgForm.pays}
                          onChange={e => setOrgForm(f => ({ ...f, pays: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="CH">Suisse</option>
                          <option value="FR">France</option>
                          <option value="DE">Allemagne</option>
                          <option value="AT">Autriche</option>
                          <option value="IT">Italie</option>
                          <option value="LI">Liechtenstein</option>
                        </select>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* IBAN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IBAN <span className="text-xs font-normal text-gray-500">(requis pour QR-bill)</span>
                      </label>
                      <input
                        type="text"
                        value={orgForm.iban}
                        onChange={e => handleIbanChange(e.target.value)}
                        placeholder="CH44 3199 9123 0008 8901 2"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm text-sm font-mono focus:ring-blue-500 focus:border-blue-500 ${
                          ibanError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {ibanError && (
                        <p className="mt-1 text-xs text-red-600">{ibanError}</p>
                      )}
                      {!ibanError && orgForm.iban && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <FiCheck className="w-3 h-3" />
                          IBAN valide : {formatIbanDisplay(orgForm.iban.replace(/\s/g, ''))}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Format suisse : CH87 0029 0290 1615 8840 P (21 caractères au total)
                      </p>
                    </div>

                    {/* Numéro TVA */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Numéro IDE / TVA</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">CHE-</span>
                        <input
                          type="text"
                          value={orgForm.numero_tva}
                          onChange={e => setOrgForm(f => ({ ...f, numero_tva: e.target.value }))}
                          placeholder="123.456.789"
                          className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-r-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Email + Téléphone */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                        <input
                          type="email"
                          value={orgForm.email}
                          onChange={e => setOrgForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="contact@monentreprise.ch"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          value={orgForm.telephone}
                          onChange={e => setOrgForm(f => ({ ...f, telephone: e.target.value }))}
                          placeholder="+41 22 000 00 00"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Feedback */}
                    {orgFeedback && (
                      <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                        orgFeedback.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {orgFeedback.type === 'success' ? <FiCheck className="w-4 h-4" /> : <FiAlertTriangle className="w-4 h-4" />}
                        {orgFeedback.message}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={orgSaving || !!ibanError}
                        className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {orgSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Enregistrement…
                          </>
                        ) : (
                          <>
                            <FiCheck className="w-4 h-4" />
                            Enregistrer
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── Onglet Personnalisation ── */}
            {activeTab === 'personnalisation' && (
              <div>
                {/* ── Profil métier ───────────────────────────────────── */}
                <ProfilMetierSection
                  profilMetier={profilMetier}
                  onSave={updateProfilMetier}
                />

                <div className="border-t border-gray-200 my-8" />

                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">🎨 Personnalisation des factures</h3>
                <p className="mt-1 text-sm text-gray-500 mb-6">
                  Toutes ces options s'appliquent automatiquement sur vos factures (aperçu + PDF).
                </p>

                {orgLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveOrg} className="space-y-6">

                    {/* ── Logo ── */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Logo de l'entreprise</h4>
                      <p className="text-xs text-gray-500 mb-4">PNG, JPG, SVG — max 2 Mo. Format recommandé : 200×80 px.</p>
                      <div className="flex items-start gap-5">
                        <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-white overflow-hidden flex-shrink-0">
                          {orgForm.logo_url ? (
                            <img src={orgForm.logo_url} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                          ) : (
                            <span className="text-xs text-gray-400 text-center px-2">Aucun logo</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-colors ${
                            logoUploading
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                          }`}>
                            {logoUploading ? (
                              <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Upload…</>
                            ) : (
                              <>📁 Choisir un fichier</>
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                              className="sr-only"
                              disabled={logoUploading}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleLogoUpload(file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {orgForm.logo_url && (
                            <button type="button" onClick={() => setOrgForm(f => ({ ...f, logo_url: '' }))}
                              className="ml-2 text-xs text-red-500 hover:text-red-700 underline">
                              Supprimer le logo
                            </button>
                          )}
                          {logoError && <p className="mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{logoError}</p>}
                        </div>
                      </div>
                    </div>

                    {/* ── Couleurs ── */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">🎨 Couleurs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Couleur principale
                            <span className="ml-1 text-xs font-normal text-gray-500">(titre, accents, bordures)</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={orgForm.primary_color}
                              onChange={e => setOrgForm(f => ({ ...f, primary_color: e.target.value }))}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                            <input type="text" value={orgForm.primary_color}
                              onChange={e => setOrgForm(f => ({ ...f, primary_color: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                              placeholder="#2563EB" maxLength={7} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fond en-tête du tableau
                            <span className="ml-1 text-xs font-normal text-gray-500">(ligne Description/Qté)</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={orgForm.header_bg_color}
                              onChange={e => setOrgForm(f => ({ ...f, header_bg_color: e.target.value }))}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                            <input type="text" value={orgForm.header_bg_color}
                              onChange={e => setOrgForm(f => ({ ...f, header_bg_color: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                              placeholder="#F3F4F6" maxLength={7} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Police d'écriture ── */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">🔤 Police d'écriture</h4>
                      <p className="text-xs text-gray-500 mb-4">Appliquée à tout le texte de la facture PDF.</p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { value: 'helvetica', label: 'Helvetica', desc: 'Moderne, épuré', sample: 'Aa Bb Cc' },
                          { value: 'times',     label: 'Times New Roman', desc: 'Classique, formel', sample: 'Aa Bb Cc' },
                          { value: 'courier',   label: 'Courier', desc: 'Monospace, technique', sample: 'Aa Bb Cc' },
                        ] as { value: string; label: string; desc: string; sample: string }[]).map(font => (
                          <button
                            key={font.value}
                            type="button"
                            onClick={() => setOrgForm(f => ({ ...f, font_family: font.value }))}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer text-center ${
                              orgForm.font_family === font.value
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <span className={`text-xl font-bold ${
                              font.value === 'times' ? 'font-serif' :
                              font.value === 'courier' ? 'font-mono' : 'font-sans'
                            }`} style={{ fontFamily: font.value === 'helvetica' ? 'Arial, sans-serif' : font.value === 'times' ? 'Georgia, serif' : 'Courier New, monospace' }}>
                              {font.sample}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{font.label}</p>
                              <p className="text-xs text-gray-500">{font.desc}</p>
                            </div>
                            {orgForm.font_family === font.value && (
                              <span className="text-xs font-medium text-blue-600">✓ Sélectionnée</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Position du QR code ── */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">📱 Position du QR code</h4>
                      <p className="text-xs text-gray-500 mb-4">Placement du QR code dans le bulletin de paiement en bas de facture.</p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          {
                            value: 'left',
                            label: 'Gauche',
                            icon: (
                              <svg viewBox="0 0 80 40" className="w-full h-10" fill="none">
                                <rect x="2" y="2" width="76" height="36" rx="2" stroke="#d1d5db" strokeWidth="1"/>
                                <rect x="6" y="6" width="18" height="18" rx="1" fill="#3b82f6"/>
                                <line x1="28" y1="6" x2="28" y2="34" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2,2"/>
                                <rect x="32" y="8" width="14" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="32" y="12" width="10" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="32" y="16" width="12" height="2" rx="1" fill="#9ca3af"/>
                                <line x1="56" y1="6" x2="56" y2="34" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2,2"/>
                                <rect x="60" y="8" width="14" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="60" y="12" width="10" height="2" rx="1" fill="#9ca3af"/>
                              </svg>
                            ),
                          },
                          {
                            value: 'center',
                            label: 'Centre',
                            icon: (
                              <svg viewBox="0 0 80 40" className="w-full h-10" fill="none">
                                <rect x="2" y="2" width="76" height="36" rx="2" stroke="#d1d5db" strokeWidth="1"/>
                                <rect x="6" y="8" width="12" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="6" y="12" width="9" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="6" y="16" width="10" height="2" rx="1" fill="#9ca3af"/>
                                <line x1="26" y1="6" x2="26" y2="34" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2,2"/>
                                <rect x="30" y="6" width="20" height="20" rx="1" fill="#3b82f6"/>
                                <line x1="56" y1="6" x2="56" y2="34" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2,2"/>
                                <rect x="60" y="8" width="14" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="60" y="12" width="10" height="2" rx="1" fill="#9ca3af"/>
                              </svg>
                            ),
                          },
                          {
                            value: 'right',
                            label: 'Droite',
                            icon: (
                              <svg viewBox="0 0 80 40" className="w-full h-10" fill="none">
                                <rect x="2" y="2" width="76" height="36" rx="2" stroke="#d1d5db" strokeWidth="1"/>
                                <rect x="6" y="8" width="12" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="6" y="12" width="9" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="6" y="16" width="10" height="2" rx="1" fill="#9ca3af"/>
                                <line x1="26" y1="6" x2="26" y2="34" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2,2"/>
                                <rect x="30" y="8" width="14" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="30" y="12" width="10" height="2" rx="1" fill="#9ca3af"/>
                                <rect x="30" y="16" width="12" height="2" rx="1" fill="#9ca3af"/>
                                <line x1="56" y1="6" x2="56" y2="34" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2,2"/>
                                <rect x="58" y="6" width="18" height="18" rx="1" fill="#3b82f6"/>
                              </svg>
                            ),
                          },
                        ] as { value: string; label: string; icon: React.ReactNode }[]).map(pos => (
                          <button
                            key={pos.value}
                            type="button"
                            onClick={() => setOrgForm(f => ({ ...f, qr_position: pos.value }))}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              orgForm.qr_position === pos.value
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="w-full">{pos.icon}</div>
                            <p className="text-xs font-semibold text-gray-800">{pos.label}</p>
                            {orgForm.qr_position === pos.value && (
                              <span className="text-xs font-medium text-blue-600">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Espacement adresses ── */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">📐 Espacement des adresses</h4>
                      <p className="text-xs text-gray-500 mb-4">Contrôle l'interligne dans les blocs adresse émetteur et destinataire.</p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          {
                            value: 'compact',
                            label: 'Compact',
                            desc: 'Lignes très rapprochées',
                            preview: ['Entreprise SA', '12, Rue de la Paix', '1200 Genève'],
                            gap: 'gap-0.5',
                          },
                          {
                            value: 'normal',
                            label: 'Normal',
                            desc: 'Espacement standard',
                            preview: ['Entreprise SA', '12, Rue de la Paix', '1200 Genève'],
                            gap: 'gap-1.5',
                          },
                          {
                            value: 'spacious',
                            label: 'Aéré',
                            desc: 'Grandes marges',
                            preview: ['Entreprise SA', '12, Rue de la Paix', '1200 Genève'],
                            gap: 'gap-3',
                          },
                        ] as { value: string; label: string; desc: string; preview: string[]; gap: string }[]).map(sp => (
                          <button
                            key={sp.value}
                            type="button"
                            onClick={() => setOrgForm(f => ({ ...f, address_spacing: sp.value }))}
                            className={`flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                              orgForm.address_spacing === sp.value
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-full bg-white rounded border border-gray-100 px-2 py-2 flex flex-col ${sp.gap}`}>
                              {sp.preview.map((line, i) => (
                                <span key={i} className={`text-xs text-gray-700 ${i === 0 ? 'font-semibold' : ''}`}>{line}</span>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{sp.label}</p>
                              <p className="text-xs text-gray-500">{sp.desc}</p>
                            </div>
                            {orgForm.address_spacing === sp.value && (
                              <span className="text-xs font-medium text-blue-600">✓ Sélectionné</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Aperçu live ── */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">👁 Aperçu</h4>
                      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: orgForm.primary_color }}>
                          {orgForm.logo_url && <img src={orgForm.logo_url} alt="Logo" className="h-8 object-contain" />}
                          <span className={`font-bold text-white text-lg ml-auto ${
                            orgForm.font_family === 'times' ? 'font-serif' :
                            orgForm.font_family === 'courier' ? 'font-mono' : 'font-sans'
                          }`} style={{ fontFamily: orgForm.font_family === 'helvetica' ? 'Arial, sans-serif' : orgForm.font_family === 'times' ? 'Georgia, serif' : 'Courier New, monospace' }}>
                            FACTURE
                          </span>
                        </div>
                        <div className="px-4 py-2 grid grid-cols-4 gap-2 text-xs font-semibold text-gray-700" style={{ backgroundColor: orgForm.header_bg_color }}>
                          <span>DESCRIPTION</span><span className="text-right">QTÉ</span><span className="text-right">PRIX</span><span className="text-right">MONTANT</span>
                        </div>
                        <div className={`px-4 grid grid-cols-4 gap-2 text-xs text-gray-600 border-t border-gray-100 ${
                          orgForm.address_spacing === 'compact' ? 'py-1' :
                          orgForm.address_spacing === 'spacious' ? 'py-4' : 'py-2'
                        }`}>
                          <span>Exemple de service</span><span className="text-right">1</span><span className="text-right">500.00</span><span className="text-right font-medium">540.50</span>
                        </div>
                        <div className="px-4 py-2 flex justify-end border-t border-gray-200">
                          <span className="text-sm font-bold" style={{ color: orgForm.primary_color }}>Total : 540.50 CHF</span>
                        </div>
                        {/* Mini QR positionnement */}
                        <div className="px-4 py-2 border-t border-dashed border-gray-300 flex items-center gap-2 text-xs text-gray-400">
                          {orgForm.qr_position === 'left' && <><div className="w-8 h-8 bg-blue-200 rounded flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">QR</div><span>Récépissé · Section paiement</span></>}
                          {orgForm.qr_position === 'center' && <><span>Récépissé</span><div className="w-8 h-8 bg-blue-200 rounded flex items-center justify-center text-blue-600 font-bold text-xs mx-auto flex-shrink-0">QR</div><span className="ml-auto">Section paiement</span></>}
                          {orgForm.qr_position === 'right' && <><span>Récépissé · Section paiement</span><div className="w-8 h-8 bg-blue-200 rounded flex items-center justify-center text-blue-600 font-bold text-xs ml-auto flex-shrink-0">QR</div></>}
                        </div>
                      </div>
                    </div>

                    {/* Feedback */}
                    {orgFeedback && (
                      <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                        orgFeedback.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {orgFeedback.type === 'success' ? <FiCheck className="w-4 h-4" /> : <FiAlertTriangle className="w-4 h-4" />}
                        {orgFeedback.message}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={orgSaving}
                        className="inline-flex items-center gap-2 px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {orgSaving ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</>
                        ) : (
                          <><FiCheck className="w-4 h-4" />Enregistrer la personnalisation</>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── Onglet Compte ── */}
            {activeTab === 'account' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Informations du compte</h3>
                <p className="mt-1 text-sm text-gray-500 mb-6">
                  Ces informations sont liées à votre compte personnel.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Nom d'utilisateur
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        zenfacture.com/
                      </span>
                      <input
                        type="text"
                        name="username"
                        id="username"
                        autoComplete="username"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        defaultValue={user?.user_metadata?.username || ''}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                      À propos
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="about"
                        name="about"
                        rows={3}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        defaultValue={user?.user_metadata?.about || ''}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Photo</label>
                    <div className="mt-1 flex items-center space-x-4">
                      <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        {user?.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <UserCircleIcon className="h-full w-full text-gray-300" />
                        )}
                      </span>
                      <button
                        type="button"
                        className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Changer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet Notifications ── */}
            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Préférences de notification</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Contrôlez comment vous recevez les notifications.
                </p>

                <div className="mt-6 space-y-4">
                  <fieldset>
                    <legend className="text-base font-medium text-gray-900">Par email</legend>
                    <div className="mt-4 space-y-4">
                      {[
                        { id: 'comments', label: 'Commentaires', desc: 'Recevez des notifications lorsque quelqu\'un commente votre publication.' },
                        { id: 'candidates', label: 'Candidatures', desc: 'Recevez une notification lorsqu\'un candidat postule à une offre.' },
                        { id: 'offers', label: 'Offres spéciales', desc: 'Recevez des offres spéciales et des promotions.' },
                      ].map(n => (
                        <div key={n.id} className="flex items-start">
                          <input id={n.id} name={n.id} type="checkbox" defaultChecked
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded mt-0.5" />
                          <div className="ml-3 text-sm">
                            <label htmlFor={n.id} className="font-medium text-gray-700">{n.label}</label>
                            <p className="text-gray-500">{n.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            )}

            {/* ── Onglet Facturation ── */}
            {activeTab === 'billing' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Facturation et plans</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Gérez vos informations de facturation et consultez l'historique de paiement.
                </p>

                <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-lg font-medium text-gray-900">Plan actuel</h4>
                    <div className="mt-2 flex items-baseline text-2xl font-semibold text-blue-600">
                      Gratuit
                      <span className="ml-2 text-sm font-medium text-gray-500">jusqu'à 5 factures/mois</span>
                    </div>
                    <div className="mt-4">
                      <a href="/app/billing"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        Voir les plans
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet Sécurité ── */}
            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Sécurité du compte</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Protégez votre compte avec des paramètres de sécurité avancés.
                </p>

                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <KeyIcon className="h-5 w-5 text-gray-400" />
                      <h4 className="ml-2 text-base font-medium text-gray-900">Authentification à deux facteurs</h4>
                      <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Désactivée
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Ajoutez une couche de sécurité supplémentaire à votre compte.
                    </p>
                    <div className="mt-4">
                      <button type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Activer l'authentification à deux facteurs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet Préférences ── */}
            {activeTab === 'preferences' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Préférences</h3>
                <p className="mt-1 text-sm text-gray-500 mb-6">Personnalisez votre expérience sur ZenFacture.</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('settings.language')}</p>
                      <p className="text-sm text-gray-500">{t('settings.preferences')}</p>
                    </div>
                    <select
                      className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                      value={i18n.language}
                      onChange={(e) => i18n.changeLanguage(e.target.value)}
                    >
                      <option value="fr">{t('settings.languages.fr')}</option>
                      <option value="de">{t('settings.languages.de')}</option>
                      <option value="en">{t('settings.languages.en')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet Emails ── */}
            {activeTab === 'emails' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Préférences d'emails</h3>
                <p className="mt-1 text-sm text-gray-500 mb-6">
                  Contrôlez les emails que vous recevez de notre part.
                </p>

                <div className="space-y-4">
                  {[
                    { id: 'marketing-emails', label: 'Emails marketing', desc: 'Recevez des offres spéciales et des mises à jour.' },
                    { id: 'product-updates', label: 'Mises à jour produit', desc: 'Soyez informé des nouvelles fonctionnalités.' },
                    { id: 'security-emails', label: 'Alertes de sécurité', desc: 'Notifications importantes concernant la sécurité de votre compte.' },
                  ].map(e => (
                    <div key={e.id} className="flex items-start">
                      <input id={e.id} name={e.id} type="checkbox" defaultChecked
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded mt-0.5" />
                      <div className="ml-3 text-sm">
                        <label htmlFor={e.id} className="font-medium text-gray-700">{e.label}</label>
                        <p className="text-gray-500">{e.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
