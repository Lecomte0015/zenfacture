import React, { useEffect, useState } from 'react';
import {
  Search,
  Mail,
  Calendar,
  Shield,
  Ban,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Send,
  Megaphone
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logAdminAction } from '@/services/adminAuditService';
import { sendMarketingEmail } from '@/services/transactionalEmailService';

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  is_active: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Composition d'un email marketing (ciblé sur un utilisateur, ou en diffusion)
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [marketingScope, setMarketingScope] = useState<'single' | 'broadcast'>('single');
  const [marketingForm, setMarketingForm] = useState({ subject: '', heading: '', bodyHtml: '', ctaLabel: '', ctaUrl: '' });
  const [marketingSending, setMarketingSending] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profils')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir bloquer cet utilisateur ?`)) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profils')
        .update({
          is_active: false,
          blocked_at: new Date().toISOString(),
          blocked_reason: reason || 'Bloqué par l\'administrateur'
        })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction('block_user', 'profils', userId, { reason: reason || 'Bloqué par l\'administrateur' });

      alert('Utilisateur bloqué avec succès');
      await loadUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors du blocage:', error);
      alert('Erreur lors du blocage de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir débloquer cet utilisateur ?')) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profils')
        .update({
          is_active: true,
          blocked_at: null,
          blocked_reason: null
        })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction('unblock_user', 'profils', userId);

      alert('Utilisateur débloqué avec succès');
      await loadUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors du déblocage:', error);
      alert('Erreur lors du déblocage de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmText = 'SUPPRIMER';
    const userInput = window.prompt(
      `⚠️ ATTENTION : Cette action est irréversible !\n\nTapez "${confirmText}" pour confirmer la suppression définitive de cet utilisateur et toutes ses données :`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) {
        alert('Suppression annulée. Le texte de confirmation ne correspond pas.');
      }
      return;
    }

    setActionLoading(true);
    try {
      const targetEmail = users.find((u) => u.id === userId)?.email || null;

      const { error } = await supabase
        .from('profils')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction('delete_user', 'profils', userId, { email: targetEmail });

      alert('Utilisateur supprimé avec succès');
      await loadUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!window.confirm(`Changer le rôle de cet utilisateur en "${newRole}" ?`)) return;

    setActionLoading(true);
    try {
      const previousRole = users.find((u) => u.id === userId)?.role;

      const { error } = await supabase
        .from('profils')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction('change_role', 'profils', userId, { from: previousRole, to: newRole });

      alert('Rôle mis à jour avec succès');
      await loadUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      alert('Erreur lors du changement de rôle');
    } finally {
      setActionLoading(false);
    }
  };

  const openMarketingModal = (scope: 'single' | 'broadcast') => {
    setMarketingScope(scope);
    setMarketingForm({ subject: '', heading: '', bodyHtml: '', ctaLabel: '', ctaUrl: '' });
    setShowMarketingModal(true);
  };

  const handleSendMarketingEmail = async () => {
    const { subject, heading, bodyHtml, ctaLabel, ctaUrl } = marketingForm;
    if (!subject.trim() || !heading.trim() || !bodyHtml.trim()) {
      alert('Veuillez renseigner au minimum le sujet, le titre et le message.');
      return;
    }

    const recipients = marketingScope === 'single'
      ? (selectedUser?.email ? [selectedUser] : [])
      : users.filter((u) => u.is_active && u.email);

    if (recipients.length === 0) {
      alert("Aucun destinataire valide (email manquant ou aucun utilisateur actif).");
      return;
    }

    if (marketingScope === 'broadcast') {
      const confirmText = 'ENVOYER';
      const userInput = window.prompt(
        `⚠️ Vous allez envoyer cet email à ${recipients.length} utilisateur${recipients.length > 1 ? 's' : ''} actif${recipients.length > 1 ? 's' : ''}.\n\nTapez "${confirmText}" pour confirmer la diffusion :`
      );
      if (userInput !== confirmText) {
        if (userInput !== null) alert('Diffusion annulée. Le texte de confirmation ne correspond pas.');
        return;
      }
    }

    setMarketingSending(true);
    try {
      const results = await Promise.allSettled(
        recipients.map((u) =>
          sendMarketingEmail({
            to: u.email as string,
            recipientName: u.name || u.email || '',
            subject,
            heading,
            bodyHtml,
            ctaLabel: ctaLabel || undefined,
            ctaUrl: ctaUrl || undefined,
          })
        )
      );

      const failures = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

      await logAdminAction('send_marketing_email', 'profils', marketingScope === 'single' ? selectedUser?.id : undefined, {
        scope: marketingScope,
        recipientCount: recipients.length,
        failureCount: failures.length,
        subject,
      });

      if (failures.length === 0) {
        alert(`Email envoyé avec succès à ${recipients.length} destinataire${recipients.length > 1 ? 's' : ''}.`);
      } else {
        alert(`Envoi terminé : ${recipients.length - failures.length} réussi(s), ${failures.length} échec(s). Voir la console pour le détail.`);
      }

      setShowMarketingModal(false);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email marketing:", error);
      alert("Erreur lors de l'envoi de l'email marketing");
    } finally {
      setMarketingSending(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Administrateur',
      user: 'Utilisateur',
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-2">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => openMarketingModal('broadcast')}
          className="shrink-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Megaphone className="w-4 h-4 mr-2" />
          Diffusion marketing
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par email ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || user.email || 'Sans nom'}
                      </div>
                      {user.email && user.name && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                      <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_active ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Actif
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <XCircle className="w-4 h-4 mr-1" />
                      Bloqué
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedUser.name || selectedUser.email}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {selectedUser.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Informations */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informations</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedUser.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nom</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedUser.name || 'Non renseigné'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                    <dd className="mt-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Statut</dt>
                    <dd className="mt-1">
                      {selectedUser.is_active ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Actif
                        </span>
                      ) : (
                        <div>
                          <span className="flex items-center text-red-600 mb-2">
                            <XCircle className="w-4 h-4 mr-1" />
                            Bloqué
                          </span>
                          {selectedUser.blocked_at && (
                            <p className="text-xs text-gray-500">
                              Bloqué le {format(new Date(selectedUser.blocked_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          )}
                          {selectedUser.blocked_reason && (
                            <p className="text-xs text-gray-700 mt-1 bg-red-50 p-2 rounded">
                              Raison : {selectedUser.blocked_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Inscrit le</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedUser.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Dernière mise à jour</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedUser.updated_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Email marketing ciblé */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Send className="w-5 h-5 mr-2 text-blue-600" />
                  Communication
                </h3>
                <button
                  onClick={() => openMarketingModal('single')}
                  disabled={!selectedUser.email}
                  className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer un email marketing à cet utilisateur
                </button>
              </div>

              {/* Changer le rôle */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Changer le rôle
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChangeRole(selectedUser.id, 'user')}
                    disabled={actionLoading || selectedUser.role === 'user'}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Utilisateur
                  </button>
                  <button
                    onClick={() => handleChangeRole(selectedUser.id, 'admin')}
                    disabled={actionLoading || selectedUser.role === 'admin'}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Administrateur
                  </button>
                  <button
                    onClick={() => handleChangeRole(selectedUser.id, 'super_admin')}
                    disabled={actionLoading || selectedUser.role === 'super_admin'}
                    className="px-4 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Super Admin
                  </button>
                </div>
              </div>

              {/* Actions dangereuses */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Zone dangereuse</h3>
                <div className="space-y-3">
                  {selectedUser.is_active ? (
                    <button
                      onClick={() => {
                        const reason = window.prompt('Raison du blocage (optionnel) :');
                        if (reason !== null) {
                          handleBlockUser(selectedUser.id, reason);
                        }
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Bloquer l'utilisateur
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnblockUser(selectedUser.id)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Débloquer l'utilisateur
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de composition d'email marketing */}
      {showMarketingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Megaphone className="w-5 h-5 mr-2 text-blue-600" />
                    {marketingScope === 'single' ? 'Email à un utilisateur' : 'Diffusion marketing'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {marketingScope === 'single'
                      ? `Destinataire : ${selectedUser?.email}`
                      : `Envoyé à tous les utilisateurs actifs (${users.filter((u) => u.is_active && u.email).length})`}
                  </p>
                </div>
                <button onClick={() => setShowMarketingModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de l'email</label>
                <input
                  type="text"
                  value={marketingForm.subject}
                  onChange={(e) => setMarketingForm({ ...marketingForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex : Découvrez les nouveautés ZenFacture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre affiché en en-tête</label>
                <input
                  type="text"
                  value={marketingForm.heading}
                  onChange={(e) => setMarketingForm({ ...marketingForm, heading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex : Une nouveauté vous attend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={marketingForm.bodyHtml}
                  onChange={(e) => setMarketingForm({ ...marketingForm, bodyHtml: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre message..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Libellé du bouton (optionnel)</label>
                  <input
                    type="text"
                    value={marketingForm.ctaLabel}
                    onChange={(e) => setMarketingForm({ ...marketingForm, ctaLabel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex : Découvrir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lien du bouton (optionnel)</label>
                  <input
                    type="url"
                    value={marketingForm.ctaUrl}
                    onChange={(e) => setMarketingForm({ ...marketingForm, ctaUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowMarketingModal(false)}
                disabled={marketingSending}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMarketingEmail}
                disabled={marketingSending}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {marketingSending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
