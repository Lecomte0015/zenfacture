import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCircleIcon, PhotoIcon, CheckIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabaseClient';

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
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                  Enregistrer les modifications
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEditClick}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Modifier le profil
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    // Envoyer un email de réinitialisation de mot de passe
                    // Par exemple: sendPasswordResetEmail(user.email);
                    alert('Un email de réinitialisation de mot de passe a été envoyé à votre adresse email.');
                  }}
                >
                  Réinitialiser le mot de passe
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
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="two-factor-auth"
                          className="sr-only"
                          // checked={twoFactorEnabled}
                          // onChange={handleTwoFactorToggle}
                        />
                        <div className="block bg-gray-200 w-14 h-8 rounded-full"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                      </div>
                    </div>
                    <label htmlFor="two-factor-auth" className="ml-3">
                      <span className="text-sm font-medium text-gray-700">
                        {false ? 'Activée' : 'Désactivée'}
                      </span>
                    </label>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
