import { useState, useEffect } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Wallet,
  Smartphone, Building, Ticket, CheckCircle, Search,
  Package, TrendingUp, Loader2, X, Calculator,
} from 'lucide-react';
import {
  ProduitPOS, LignePanier, ModePaiement, VentePOS,
  getProduitsPOS, enregistrerVente, getVentesPOS,
  getStatsPOS, calculerTotalPanier,
} from '@/services/posService';

const MODE_PAIEMENT_CONFIG: { mode: ModePaiement; label: string; icon: typeof CreditCard; color: string }[] = [
  { mode: 'carte', label: 'Carte', icon: CreditCard, color: 'bg-blue-600 hover:bg-blue-700' },
  { mode: 'twint', label: 'TWINT', icon: Smartphone, color: 'bg-orange-600 hover:bg-orange-700' },
  { mode: 'especes', label: 'Espèces', icon: Wallet, color: 'bg-green-600 hover:bg-green-700' },
  { mode: 'virement', label: 'Virement', icon: Building, color: 'bg-purple-600 hover:bg-purple-700' },
  { mode: 'bon', label: 'Bon', icon: Ticket, color: 'bg-amber-600 hover:bg-amber-700' },
];

function formatCHF(v: number) {
  return `CHF ${v.toFixed(2)}`;
}

export default function POSPage() {
  const { organisation } = useOrganisation();
  const [produits, setProduits] = useState<ProduitPOS[]>([]);
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategorie, setActiveCategorie] = useState<string>('all');
  const [processing, setProcessing] = useState(false);
  const [lastVente, setLastVente] = useState<VentePOS | null>(null);
  const [ventes, setVentes] = useState<VentePOS[]>([]);
  const [stats, setStats] = useState<{ ventes_aujourd_hui: number; ca_aujourd_hui: number; ventes_mois: number; ca_mois: number } | null>(null);
  const [tab, setTab] = useState<'caisse' | 'historique'>('caisse');
  const [montantRecu, setMontantRecu] = useState('');

  useEffect(() => {
    if (!organisation?.id) return;
    Promise.all([
      getProduitsPOS(organisation.id),
      getVentesPOS(organisation.id, 20),
      getStatsPOS(organisation.id),
    ]).then(([p, v, s]) => {
      setProduits(p);
      setVentes(v);
      setStats(s);
    }).catch(console.error);
  }, [organisation?.id, lastVente]);

  const categories = ['all', ...Array.from(new Set(produits.map(p => p.categorie || 'Autre').filter(Boolean)))];

  const produitsFiltres = produits.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategorie === 'all' || (p.categorie || 'Autre') === activeCategorie;
    return matchSearch && matchCat;
  });

  const ajouterAuPanier = (produit: ProduitPOS) => {
    setPanier(prev => {
      const existant = prev.find(l => l.produit.id === produit.id);
      if (existant) {
        return prev.map(l => l.produit.id === produit.id
          ? { ...l, quantite: l.quantite + 1 }
          : l
        );
      }
      return [...prev, { produit, quantite: 1, remise_pct: 0 }];
    });
  };

  const modifierQuantite = (id: string, delta: number) => {
    setPanier(prev => prev
      .map(l => l.produit.id === id ? { ...l, quantite: Math.max(0, l.quantite + delta) } : l)
      .filter(l => l.quantite > 0)
    );
  };

  const modifierRemise = (id: string, remise: number) => {
    setPanier(prev => prev.map(l =>
      l.produit.id === id ? { ...l, remise_pct: Math.min(100, Math.max(0, remise)) } : l
    ));
  };

  const supprimerLigne = (id: string) => {
    setPanier(prev => prev.filter(l => l.produit.id !== id));
  };

  const totaux = calculerTotalPanier(panier);
  const montantRecuNum = parseFloat(montantRecu) || 0;
  const monnaie = montantRecuNum > 0 ? Math.max(0, montantRecuNum - totaux.ttc) : 0;

  const handlePaiement = async (mode: ModePaiement) => {
    if (!organisation?.id || panier.length === 0) return;
    setProcessing(true);
    try {
      const vente = await enregistrerVente(
        organisation.id,
        panier,
        mode,
        {
          montant_recu: montantRecuNum || undefined,
          generer_facture: true,
        }
      );
      setLastVente(vente);
      setPanier([]);
      setMontantRecu('');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Point de vente (POS)
          </h1>
          <p className="text-gray-500 mt-1">Caisse enregistreuse avec génération automatique de factures.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('caisse')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${tab === 'caisse' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            Caisse
          </button>
          <button
            onClick={() => setTab('historique')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${tab === 'historique' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            Historique
          </button>
        </div>
      </div>

      {/* Stats du jour */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Ventes aujourd\'hui', value: stats.ventes_aujourd_hui, sub: '' },
            { label: 'CA aujourd\'hui', value: formatCHF(stats.ca_aujourd_hui), sub: '' },
            { label: 'Ventes ce mois', value: stats.ventes_mois, sub: '' },
            { label: 'CA ce mois', value: formatCHF(stats.ca_mois), sub: '' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'caisse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Catalogue produits */}
          <div className="lg:col-span-2 space-y-3">
            {/* Recherche + catégories */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Chercher un produit..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategorie(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeCategorie === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'Tous' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille produits */}
            {produitsFiltres.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Aucun produit trouvé</p>
                <a href="/dashboard/produits" className="text-blue-600 text-sm hover:underline mt-1 block">
                  Configurer le catalogue →
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {produitsFiltres.map(produit => (
                  <button
                    key={produit.id}
                    onClick={() => ajouterAuPanier(produit)}
                    className="p-3 bg-white border border-gray-200 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2 text-sm font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {produit.nom.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{produit.nom}</p>
                    {produit.reference && <p className="text-xs text-gray-400 truncate">{produit.reference}</p>}
                    <p className="text-sm font-bold text-blue-700 mt-1">{formatCHF(produit.prix)}</p>
                    <p className="text-xs text-gray-400">TVA {produit.taux_tva}%</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panier + paiement */}
          <div className="space-y-4">
            {/* Confirmation dernière vente */}
            {lastVente && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="font-semibold text-green-800 text-sm">Vente {lastVente.numero}</p>
                  </div>
                  <button onClick={() => setLastVente(null)} className="text-green-500 hover:text-green-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {formatCHF(lastVente.total_ttc)} — Facture générée automatiquement
                </p>
                {lastVente.monnaie_rendue && lastVente.monnaie_rendue > 0 && (
                  <p className="text-sm text-green-700">Monnaie : {formatCHF(lastVente.monnaie_rendue)}</p>
                )}
              </div>
            )}

            {/* Panier */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                  Panier ({panier.reduce((sum, l) => sum + l.quantite, 0)} article{panier.reduce((sum, l) => sum + l.quantite, 0) !== 1 ? 's' : ''})
                </h3>
                {panier.length > 0 && (
                  <button
                    onClick={() => setPanier([])}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Vider
                  </button>
                )}
              </div>

              {panier.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-1 opacity-30" />
                  Cliquez sur un produit pour l'ajouter
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {panier.map(ligne => (
                    <div key={ligne.produit.id} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{ligne.produit.nom}</p>
                          <p className="text-xs text-gray-400">{formatCHF(ligne.produit.prix)} × {ligne.quantite}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => modifierQuantite(ligne.produit.id, -1)}
                            className="p-0.5 text-gray-400 hover:text-gray-700"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{ligne.quantite}</span>
                          <button
                            onClick={() => modifierQuantite(ligne.produit.id, 1)}
                            className="p-0.5 text-gray-400 hover:text-gray-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => supprimerLigne(ligne.produit.id)}
                            className="p-0.5 text-red-400 hover:text-red-600 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-gray-800 w-16 text-right">
                          {formatCHF(ligne.produit.prix * ligne.quantite * (1 - ligne.remise_pct / 100))}
                        </p>
                      </div>
                      {/* Remise */}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-400">Remise:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ligne.remise_pct}
                          onChange={e => modifierRemise(ligne.produit.id, parseFloat(e.target.value) || 0)}
                          className="w-12 text-xs border border-gray-200 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totaux */}
              {panier.length > 0 && (
                <div className="p-3 border-t border-gray-100 space-y-1 bg-gray-50 rounded-b-xl text-sm">
                  {totaux.remise > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Remise</span>
                      <span>-{formatCHF(totaux.remise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>HT</span>
                    <span>{formatCHF(totaux.ht)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>TVA</span>
                    <span>{formatCHF(totaux.tva)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-1 mt-1">
                    <span>Total</span>
                    <span className="text-blue-700">{formatCHF(totaux.ttc)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Montant reçu (espèces) */}
            {panier.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <Calculator className="w-4 h-4 text-gray-400" />
                  Montant remis (espèces)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={0.05}
                    value={montantRecu}
                    onChange={e => setMontantRecu(e.target.value)}
                    placeholder={formatCHF(totaux.ttc)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {monnaie > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 font-bold whitespace-nowrap">
                      Rendu: {formatCHF(monnaie)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Boutons paiement */}
            {panier.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode de paiement</p>
                <div className="grid grid-cols-2 gap-2">
                  {MODE_PAIEMENT_CONFIG.map(({ mode, label, icon: Icon, color }) => (
                    <button
                      key={mode}
                      onClick={() => handlePaiement(mode)}
                      disabled={processing}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 ${color}`}
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'historique' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-800">Dernières ventes</h3>
          </div>
          {ventes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucune vente enregistrée</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {ventes.map(vente => {
                const modeConf = MODE_PAIEMENT_CONFIG.find(m => m.mode === vente.mode_paiement);
                const ModeIcon = modeConf?.icon || CreditCard;
                return (
                  <div key={vente.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <ModeIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800">{vente.numero}</p>
                      <p className="text-xs text-gray-400">
                        {vente.client_nom || 'Client comptant'} — {Array.isArray(vente.lignes) ? vente.lignes.length : 0} ligne{Array.isArray(vente.lignes) && vente.lignes.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{formatCHF(vente.total_ttc)}</span>
                    <span className="text-xs text-gray-400">{new Date(vente.created_at).toLocaleString('fr-CH')}</span>
                    {vente.invoice_id && (
                      <span className="text-xs text-green-600 flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" />
                        Facturé
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
