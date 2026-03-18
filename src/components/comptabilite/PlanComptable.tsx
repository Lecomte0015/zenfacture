import React, { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { CompteComptable } from '@/services/comptabiliteService';

interface PlanComptableProps {
  comptes: CompteComptable[];
  onAddCompte: (compte: Omit<CompteComptable, 'id' | 'organisation_id' | 'cree_le'>) => Promise<void>;
  onEditCompte: (id: string, updates: Partial<CompteComptable>) => Promise<void>;
  onDeleteCompte: (id: string) => Promise<void>;
}

interface GroupedComptes {
  actif: { [key: string]: CompteComptable[] };
  passif: { [key: string]: CompteComptable[] };
  charge: { [key: string]: CompteComptable[] };
  produit: { [key: string]: CompteComptable[] };
}

export const PlanComptable: React.FC<PlanComptableProps> = ({
  comptes,
  onAddCompte,
  onEditCompte,
  onDeleteCompte,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['actif', 'passif', 'charge', 'produit']));
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    numero: '',
    nom: '',
    type_compte: 'actif' as 'actif' | 'passif' | 'charge' | 'produit',
    categorie: '',
  });

  // Grouper les comptes par type et catégorie
  const groupedComptes = useMemo(() => {
    const grouped: GroupedComptes = {
      actif: {},
      passif: {},
      charge: {},
      produit: {},
    };

    comptes.forEach((compte) => {
      const categorie = compte.categorie || 'Autres';
      if (!grouped[compte.type_compte][categorie]) {
        grouped[compte.type_compte][categorie] = [];
      }
      grouped[compte.type_compte][categorie].push(compte);
    });

    return grouped;
  }, [comptes]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await onEditCompte(editingId, formData);
      setEditingId(null);
    } else {
      await onAddCompte({ ...formData, est_systeme: false });
      setShowAddForm(false);
    }

    setFormData({
      numero: '',
      nom: '',
      type_compte: 'actif',
      categorie: '',
    });
  };

  const handleEdit = (compte: CompteComptable) => {
    if (compte.est_systeme) return;
    setEditingId(compte.id);
    setFormData({
      numero: compte.numero,
      nom: compte.nom,
      type_compte: compte.type_compte,
      categorie: compte.categorie,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (compte: CompteComptable) => {
    if (compte.est_systeme) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte ${compte.numero} - ${compte.nom} ?`)) {
      await onDeleteCompte(compte.id);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      actif: 'Actifs',
      passif: 'Passifs',
      charge: 'Charges',
      produit: 'Produits',
    };
    return labels[type] || type;
  };

  const renderCompteRow = (compte: CompteComptable) => (
    <tr
      key={compte.id}
      className={`border-b border-gray-200 hover:bg-gray-50 ${compte.est_systeme ? 'text-gray-500' : ''}`}
    >
      <td className="py-2 px-4 font-mono text-sm">{compte.numero}</td>
      <td className="py-2 px-4">{compte.nom}</td>
      <td className="py-2 px-4 text-sm capitalize">{compte.type_compte}</td>
      <td className="py-2 px-4 text-sm">{compte.categorie}</td>
      <td className="py-2 px-4 text-right">
        {!compte.est_systeme && (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleEdit(compte)}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Modifier"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(compte)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Plan Comptable</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setFormData({ numero: '', nom: '', type_compte: 'actif', categorie: '' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un compte
        </button>
      </div>

      {showAddForm && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: 1010"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: Caisse"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type_compte}
                onChange={(e) => setFormData({ ...formData, type_compte: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="actif">Actif</option>
                <option value="passif">Passif</option>
                <option value="charge">Charge</option>
                <option value="produit">Produit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <input
                type="text"
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: Trésorerie"
                required
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Modifier' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({ numero: '', nom: '', type_compte: 'actif', categorie: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-6">
        {(['actif', 'passif', 'charge', 'produit'] as const).map((type) => {
          const categories = groupedComptes[type];
          const isExpanded = expandedGroups.has(type);

          return (
            <div key={type} className="mb-6">
              <button
                onClick={() => toggleGroup(type)}
                className="flex items-center gap-2 w-full text-left font-semibold text-gray-800 mb-3 hover:text-blue-600 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                <span className="text-lg">{getTypeLabel(type)}</span>
              </button>

              {isExpanded && (
                <div className="ml-7">
                  {Object.entries(categories).map(([categorie, comptesCategorie]) => (
                    <div key={categorie} className="mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">
                        {categorie}
                      </h4>
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Numéro
                            </th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nom
                            </th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Catégorie
                            </th>
                            <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {comptesCategorie.map((compte) => renderCompteRow(compte))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
