import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCircleIcon, PhotoIcon, CheckIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabaseClient';

/** Facteur MFA vérifié tel que renvoyé par supabase.auth.mfa.listFactors()/.enroll() */
interface TotpFactor {
  id: string;
  factor_type: string;
  status: 'verified' | 'unverified';
}

// ─── Schema Zod ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  email: z.string().email('Adresse email invalide'),
  phone: z.string().max(30, 'Numéro trop long').optional().default(''),
  company: z.string().max(100).optional().default(''),
  jobTitle: z.string().max(100).optional().default(''),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);

  // ── Réinitialisation du mot de passe ─────────────────────────────────────
  const [resetSending, setResetSending] = useState(false);
  const [infoModal, setInfoModal] = useState<{ variant: 'success' | 'error'; title: string; message: string } | null>(null);

  // ── Authentification à deux facteurs (Supabase MFA / TOTP) ───────────────
  const [totpFactor, setTotpFactor] = useState<TotpFactor | null>(null);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const refreshMfaFactors = async () => {
    setMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verified = (data?.totp || []).find(f => f.status === 'verified') || null;
      setTotpFactor(verified as TotpFactor | null);
    } catch (err) {
      console.error('Erreur lors du chargement des facteurs MFA:', err);
    } finally {
      setMfaLoading(false);
    }
  };

  useEffect(() => {
    refreshMfaFactors();
  }, []);

  const handleStartEnroll = async () => {
    setMfaError('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (err: any) {
      setMfaError(err.message || 'Impossible de démarrer l\'activation de la double authentification.');
    }
  };

  const handleVerifyEnroll = async () => {
    if (!enrollData || verifyCode.trim().length < 6) return;
    setVerifying(true);
    setMfaError('');
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: verifyCode.trim(),
      });
      if (error) throw error;
      setEnrollData(null);
      setVerifyCode('');
      await refreshMfaFactors();
      setInfoModal({
        variant: 'success',
        title: 'Double authentification activée',
        message: 'Votre compte est maintenant protégé par un second facteur : un code sera demandé à chaque connexion, en plus de votre mot de passe.',
      });
    } catch (err: any) {
      setMfaError(err.message || 'Code invalide. Vérifiez votre application d\'authentification et réessayez.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelEnroll = async () => {
    // Supprime le facteur non-vérifié créé par enroll() pour ne pas laisser de résidu
    if (enrollData) {
      try { await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId }); } catch { /* ignore */ }
    }
    setEnrollData(null);
    setVerifyCode('');
    setMfaError('');
  };

  const handleDisable2FA = async () => {
    if (!totpFactor) return;
    setDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      if (error) throw error;
      setTotpFactor(null);
      setShowDisableConfirm(false);
      setInfoModal({
        variant: 'success',
        title: 'Double authentification désactivée',
        message: 'Seul votre mot de passe sera désormais demandé pour vous connecter.',
      });
    } catch (err: any) {
      setShowDisableConfirm(false);
      setInfoModal({
        variant: 'error',
        title: 'Échec de la désactivation',
        message: err.message || 'Une erreur est survenue. Réessayez dans un instant.',
      });
    } finally {
      setDisabling(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email || resetSending) return;
    setResetSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setInfoModal({
        variant: 'success',
        title: 'Email envoyé',
        message: `Un lien de réinitialisation vient d'être envoyé à ${user.email}. Vérifiez votre boîte de réception (et vos spams).`,
      });
    } catch (err: any) {
      setInfoModal({
        variant: 'error',
        title: "Échec de l'envoi",
        message: err.message || "Une erreur est survenue lors de l'envoi de l'email. Réessayez dans un instant.",
      });
    } finally {
      setResetSending(false);
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
      company: user?.user_metadata?.company || '',
      jobTitle: user?.user_metadata?.job_title || '',
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const userId = user?.id;
      if (!userId) throw new Error('Utilisateur non connecté');

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload vers Supabase Storage (bucket: photo.profil)
      const { error: uploadError } = await supabase.storage
        .from('photo.profil')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('photo.profil')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setAvatar(publicUrl);

      // Mettre à jour le profil utilisateur avec l'URL de l'avatar
      await updateUser({
        user_metadata: {
          avatar_url: publicUrl,
        },
      });

    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Mettre à jour les informations du profil via user_metadata
      await updateUser({
        name: data.fullName,
        user_metadata: {
          full_name: data.fullName,
          phone: data.phone,
          company: data.company,
          job_title: data.jobTitle,
        },
        ...(data.email !== user?.email ? { email: data.email } : {}),
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Mon profil
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Vos informations et vos préférences, à jour en un coup d'œil.
        </p>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-2xl">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Informations personnelles
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Ces informations seront visibles par les membres de votre équipe
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-5 sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Photo de profil</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Cette photo sera visible par les membres de votre équipe.
                  </p>
                </div>
                
                <div className="mt-4 flex items-center">
                  <div className="relative group">
                    {avatar ? (
                      <img
                        className="h-20 w-20 rounded-full object-cover"
                        src={avatar}
                        alt=""
                      />
                    ) : (
                      <UserCircleIcon className="h-20 w-20 text-gray-300" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer p-2 rounded-full bg-white bg-opacity-75 text-gray-700 hover:text-gray-900"
                        title="Changer la photo"
                      >
                        <PhotoIcon className="h-5 w-5" />
                        <input
                          id="avatar-upload"
                          name="avatar-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                  {isUploading && (
                    <div className="ml-4 text-sm text-gray-500">
                      Téléchargement en cours...
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Nom complet
                      </label>
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            type="text"
                            id="fullName"
                            {...register('fullName')}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          {errors.fullName && (
                            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {user?.user_metadata?.full_name || 'Non renseigné'}
                        </p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Adresse email
                      </label>
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            id="email"
                            type="email"
                            {...register('email')}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Téléphone
                      </label>
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            type="tel"
                            id="phone"
                            {...register('phone')}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {user?.user_metadata?.phone || 'Non renseigné'}
                        </p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Entreprise
                      </label>
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            type="text"
                            id="company"
                            {...register('company')}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {user?.user_metadata?.company || 'Non renseignée'}
                        </p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                        Poste
                      </label>
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            type="text"
                            id="jobTitle"
                            {...register('jobTitle')}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {user?.user_metadata?.job_title || 'Non renseigné'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            {isEditing ? (
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                  Enregistrer les modifications
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEditClick}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Modifier le profil
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-2xl">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Paramètres de sécurité
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gérez votre mot de passe et vos paramètres de sécurité
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Changer de mot de passe</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Mettez à jour votre mot de passe pour sécuriser votre compte.
                  </p>
                </div>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <button
                  type="button"
                  disabled={resetSending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleResetPassword}
                >
                  {resetSending ? 'Envoi en cours…' : 'Réinitialiser le mot de passe'}
                </button>
                <p className="mt-2 text-sm text-gray-500">
                  Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <div className="px-4 sm:px-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Authentification à deux facteurs</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Ajoutez une couche de sécurité supplémentaire à votre compte.
                    </p>
                  </div>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  {mfaLoading ? (
                    <p className="text-sm text-gray-400">Chargement…</p>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!!totpFactor}
                          onClick={() => (totpFactor ? setShowDisableConfirm(true) : handleStartEnroll())}
                          className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            totpFactor ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                              totpFactor ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {totpFactor ? 'Activée' : 'Désactivée'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {totpFactor
                          ? 'Un code de votre application d\'authentification vous sera demandé à chaque connexion.'
                          : 'L\'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal d'activation 2FA (scan QR + code de vérification) ─────────── */}
      {enrollData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500/75" onClick={handleCancelEnroll} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                  Activer la double authentification
                </h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-gray-600">
                  Scannez ce code avec votre application d'authentification (Google Authenticator, 1Password, Authy…).
                </p>
                <div className="flex justify-center bg-gray-50 rounded-xl p-4">
                  {/* qr_code est un SVG encodé en data URI fourni par Supabase */}
                  <img src={enrollData.qrCode} alt="QR code d'activation" className="w-40 h-40" />
                </div>
                <p className="text-xs text-gray-500">
                  Impossible de scanner ? Entrez ce code manuellement dans votre application :
                </p>
                <p className="text-xs font-mono bg-gray-100 rounded-lg px-3 py-2 break-all select-all">
                  {enrollData.secret}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code à 6 chiffres
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {mfaError && <p className="mt-2 text-sm text-red-600">{mfaError}</p>}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={handleCancelEnroll}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleVerifyEnroll}
                  disabled={verifying || verifyCode.trim().length < 6}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {verifying ? 'Vérification…' : 'Vérifier et activer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmation de désactivation 2FA ───────────────────────── */}
      {showDisableConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500/75" onClick={() => setShowDisableConfirm(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Désactiver la double authentification ?</h3>
              <p className="mt-2 text-sm text-gray-500">
                Votre compte ne sera plus protégé que par votre mot de passe.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={() => setShowDisableConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={disabling}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  {disabling ? 'Désactivation…' : 'Désactiver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal d'information générique (succès / erreur) ──────────────────── */}
      {infoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500/75" onClick={() => setInfoModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4 ${
                  infoModal.variant === 'success' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {infoModal.variant === 'success' ? (
                  <CheckIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{infoModal.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{infoModal.message}</p>
              <button
                onClick={() => setInfoModal(null)}
                className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
