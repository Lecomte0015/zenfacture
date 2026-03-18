import { useState } from 'react';
import {
  Layers, Plus, Pencil, Trash2, Star, X, Check, Loader2,
  Globe, Mail, Phone, MapPin, FileText, Eye,
} from 'lucide-react';
import { useMarques } from '@/hooks/useMarques';
import { Marque, MarqueInput, generateSlug } from '@/services/marqueService';

interface FormData {
  nom: string;
  slug: string;
  description: string;
  couleur_primaire: string;
  couleur_secondaire: string;
  email: string;
  telephone: string;
  adresse: string;
  site_web: string;
  pied_facture: string;
  conditions_paiement: string;
  is_default: boolean;
}

const defaultForm: FormData = {
  nom: '',
  slug: '',
  description: '',
  couleur_primaire: '#2563EB',
  couleur_secondaire: '#64748B',
  email: '',
  telephone: '',
  adresse: '',
  site_web: '',
  pied_facture: '',
  conditions_paiement: 'Paiement à 30 jours. Merci pour votre confiance.',
  is_default: false,
};

function PreviewCard({ form }: { form: FormData }) {
  return (
    <div
      className="border rounded-xl p-6 shadow-sm bg-white text-sm"
      style={{ borderTopColor: form.couleur_primaire, borderTopWidth: 4 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div
            className="text-lg font-bold"
            style={{ color: form.couleur_primaire }}
          >
            {form.nom || 'Nom de la marque'}
          </div>
          {form.adresse && <p className="text-xs text-gray-400 mt-0.5">{form.adresse}</p>}
          {form.email && <p className="text-xs text-gray-400">{form.email}</p>}
        </div>
        <div
          className="px-2 py-1 rounded text-xs font-bold text-white"
          style={{ backgroundColor: form.couleur_primaire }}
        >
          FACTURE
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Prestation de services</span>
          <span>CHF 1'000.00</span>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-3 pt-2 flex justify-between">
        <span className="text-xs text-gray-500">Total TTC</span>
        <span className="font-bold text-sm" style={{ color: form.couleur_primaire }}>CHF 1'081.00</span>
      </div>

      {form.pied_facture && (
        <p className="mt-3 text-xs text-gray-400 border-t border-gray-100 pt-2">{form.pied_facture}</p>
      )}
    </div>
  );
}

export default function MarquesPage() {
  const { marques, loading, create, update, remove, setDefault } = useMarques();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
    setShowPreview(false);
  };

  const openEdit = (m: Marque) => {
    setEditingId(m.id);
    setForm({
      nom: m.nom,
      slug: m.slug,
      description: m.description || '',
      couleur_primaire: m.couleur_primaire,
      couleur_secondaire: m.couleur_secondaire || '#64748B',
      email: m.email || '',
      telephone: m.telephone || '',
      adresse: m.adresse || '',
      site_web: m.site_web || '',
      pied_facture: m.pied_facture || '',
      conditions_paiement: m.conditions_paiement || '',
      is_default: m.is_default,
    });
    setShowForm(true);
    setShowPreview(false);
  };

  const handleNomChange = (nom: string) => {
    setForm(f => ({ ...f, nom, slug: !editingId ? generateSlug(nom) : f.slug }));
  };

  const handleSave = async () => {
    if (!form.nom) return;
    setSaving(true);
    try {
      const input: Omit<MarqueInput, 'organisation_id' | 'actif'> = {
        nom: form.nom,
        slug: form.slug || generateSlug(form.nom),
        description: form.description || undefined,
        couleur_primaire: form.couleur_primaire,
        couleur_secondaire: form.couleur_secondaire,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        adresse: form.adresse || undefined,
        site_web: form.site_web || undefined,
        pied_facture: form.pied_facture || undefined,
        conditions_paiement: form.conditions_paiement || undefined,
        is_default: form.is_default,
      };

      if (editingId) {
        await update(editingId, input);
      } else {
        await create(input);
      }
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            Multi-marques
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez plusieurs marques/entités et associez-les à vos factures et devis.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle marque
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Créez plusieurs marques pour facturer sous différentes identités visuelles
          (filiales, départements, activités distinctes). Chaque marque possède ses propres couleurs, coordonnées et pied de page.
        </p>
      </div>

      {/* Liste des marques */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : marques.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Aucune marque configurée</p>
          <p className="text-sm mt-1">Créez votre première marque pour personnaliser vos documents</p>
          <button
            onClick={openNew}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Créer une marque
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marques.map(marque => (
            <div
              key={marque.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Bandeau couleur */}
              <div
                className="h-2"
                style={{ backgroundColor: marque.couleur_primaire }}
              />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{marque.nom}</h3>
                      {marque.is_default && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                          <Star className="w-3 h-3" />
                          Défaut
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">/{marque.slug}</p>
                    {marque.description && <p className="text-sm text-gray-500 mt-1">{marque.description}</p>}
                  </div>
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: marque.couleur_primaire }}
                  />
                </div>

                {/* Infos contact */}
                <div className="space-y-1 mb-4">
                  {marque.email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail className="w-3 h-3" />
                      {marque.email}
                    </div>
                  )}
                  {marque.telephone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />
                      {marque.telephone}
                    </div>
                  )}
                  {marque.adresse && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {marque.adresse}
                    </div>
                  )}
                  {marque.site_web && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Globe className="w-3 h-3" />
                      {marque.site_web}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!marque.is_default && (
                    <button
                      onClick={() => setDefault(marque.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Définir par défaut
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(marque)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  {!marque.is_default && (
                    <button
                      onClick={() => setDeleteConfirm(marque.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  )}
                </div>

                {deleteConfirm === marque.id && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-700 flex-1">Supprimer cette marque ?</p>
                    <button onClick={() => handleDelete(marque.id)} className="px-2 py-0.5 bg-red-600 text-white text-xs rounded">Oui</button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">Non</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Formulaire marque */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl flex overflow-hidden max-h-[90vh]">
            {/* Formulaire */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
                <h3 className="font-semibold text-gray-800">
                  {editingId ? 'Modifier la marque' : 'Nouvelle marque'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Masquer aperçu' : 'Aperçu'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la marque *</label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={e => handleNomChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ma Marque Sàrl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug (identifiant)</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                    <input
                      type="url"
                      value={form.site_web}
                      onChange={e => setForm(f => ({ ...f, site_web: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={form.adresse}
                      onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Couleurs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.couleur_primaire}
                        onChange={e => setForm(f => ({ ...f, couleur_primaire: e.target.value }))}
                        className="w-10 h-9 rounded border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.couleur_primaire}
                        onChange={e => setForm(f => ({ ...f, couleur_primaire: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur secondaire</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.couleur_secondaire}
                        onChange={e => setForm(f => ({ ...f, couleur_secondaire: e.target.value }))}
                        className="w-10 h-9 rounded border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.couleur_secondaire}
                        onChange={e => setForm(f => ({ ...f, couleur_secondaire: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pied de page facture</label>
                    <textarea
                      rows={2}
                      value={form.pied_facture}
                      onChange={e => setForm(f => ({ ...f, pied_facture: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Coordonnées bancaires, mentions légales..."
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_default}
                        onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Définir comme marque par défaut</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-5 border-t border-gray-100 flex-shrink-0">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.nom}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </div>

            {/* Aperçu */}
            {showPreview && (
              <div className="w-72 border-l border-gray-100 bg-gray-50 p-5 flex-shrink-0 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Aperçu facture</p>
                <PreviewCard form={form} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
