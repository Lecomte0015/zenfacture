import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganisation } from '../../context/OrganisationContext';
import { generateInvoiceQrCode } from '../../services/swissQrService';
// Utilisation d'alertes natives au lieu de react-hot-toast

interface Client {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  vatNumber?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

interface InvoiceFormProps {
  onClose: () => void;
  onInvoiceAdded?: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, onInvoiceAdded }) => {
  const { organisationId } = useOrganisation();

  // États pour les informations de base
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 jours par défaut
    return date.toISOString().split('T')[0];
  });

  // États pour les clients
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État pour les lignes de facturation
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 8.1, // TVA suisse standard 2024+
      total: 0,
    },
  ]);

  // États pour les totaux
  const [subtotal, setSubtotal] = useState(0);
  const [vatTotal, setVatTotal] = useState(0);
  const [total, setTotal] = useState(0);

  // État pour le QR code
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrError, setQrError] = useState<string | null>(null);
  const qrDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // État pour les données de l'organisation (émetteur)
  const [orgData, setOrgData] = useState<{
    nom: string;
    adresse?: string;
    code_postal?: string;
    ville?: string;
    pays?: string;
    iban?: string;
    numero_tva?: string;
    email?: string;
    telephone?: string;
    logo_url?: string;
    primary_color?: string;
    header_bg_color?: string;
  } | null>(null);

  // Charger les données de l'organisation (émetteur) au montage
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!organisationId) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org } = await (supabase as any)
          .from('organisations')
          .select('nom, adresse, code_postal, ville, pays, iban, numero_tva, email, telephone, logo_url, primary_color, header_bg_color')
          .eq('id', organisationId)
          .single();

        if (org) setOrgData(org);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'organisation:', error);
      }
    };
    fetchOrgData();
  }, [organisationId]);

  // Charger les clients depuis Supabase
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: clientsData, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('nom', { ascending: true });

        if (error) {
          console.error('Erreur lors du chargement des clients:', error);
          setClients([]);
        } else {
          setClients((clientsData || []).map((c: any) => ({
            id: c.id,
            name: c.nom || c.entreprise || '',
            address: c.adresse || '',
            postalCode: c.code_postal || '',
            city: c.ville || '',
            country: c.pays || 'Suisse',
            vatNumber: c.numero_tva,
          })));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        setClients([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Générer un numéro de facture
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`FACT-${year}${month}-${random}`);
  }, []);

  // Calculer les totaux lorsque les articles changent
  const { subTotal, vatAmount, itemsWithTotals } = useMemo(() => {
    let subTotal = 0;
    let vatAmount = 0;

    const itemsWithTotals = items.map(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemVat = itemTotal * (item.vatRate / 100);
      
      subTotal += itemTotal;
      vatAmount += itemVat;
      
      return {
        ...item,
        total: itemTotal + itemVat,
      };
    });

    return { subTotal, vatAmount, itemsWithTotals };
  }, [items]);

  // Mettre à jour les totaux lorsque les articles changent
  useEffect(() => {
    setSubtotal(subTotal);
    setVatTotal(vatAmount);
    setTotal(subTotal + vatAmount);
  }, [subTotal, vatAmount]);

  // Mettre à jour les totaux des articles
  useEffect(() => {
    if (JSON.stringify(items) !== JSON.stringify(itemsWithTotals)) {
      setItems(itemsWithTotals);
    }
  }, [itemsWithTotals]);

  // Récupérer le client sélectionné
  const selectedClient = clients.find(client => client.id === selectedClientId);

  // Générer le QR code avec debounce (évite de régénérer à chaque frappe)
  useEffect(() => {
    if (qrDebounceRef.current) clearTimeout(qrDebounceRef.current);

    if (total <= 0 || !orgData) {
      setQrCodeDataUrl('');
      setQrError(null);
      return;
    }

    qrDebounceRef.current = setTimeout(async () => {
      setQrError(null);
      try {
        const url = await generateInvoiceQrCode({
          creditorIban: orgData.iban || '',
          creditorName: orgData.nom || '',
          creditorStreet: orgData.adresse,
          creditorPostalCode: orgData.code_postal || '',
          creditorCity: orgData.ville || '',
          creditorCountry: orgData.pays,
          debtorName: selectedClient?.name,
          debtorStreet: selectedClient?.address,
          debtorPostalCode: selectedClient?.postalCode,
          debtorCity: selectedClient?.city,
          debtorCountry: selectedClient?.country,
          amount: total,
          currency: 'CHF',
          invoiceNumber: invoiceNumber,
        }, { size: 200 });
        setQrCodeDataUrl(url);
      } catch (error: any) {
        console.error('Erreur QR code:', error);
        setQrError(error?.message ?? 'Erreur lors de la génération du QR code.');
        setQrCodeDataUrl('');
      }
    }, 600); // Debounce 600ms

    return () => {
      if (qrDebounceRef.current) clearTimeout(qrDebounceRef.current);
    };
  }, [total, orgData, selectedClient, invoiceNumber]);

  // Gestion des changements dans les lignes de facturation
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Ajouter une nouvelle ligne de facturation
  const addNewLine = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 8.1, // TVA suisse standard 2024+
        total: 0,
      },
    ]);
  };

  // Supprimer une ligne de facturation
  const removeLine = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Soumettre la facture
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Vérifier si l'utilisateur est connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Vérifier qu'un client est sélectionné
      if (!selectedClient) {
        throw new Error('Veuillez sélectionner un client');
      }

      console.log('ID de l\'utilisateur connecté:', user?.id);

      // Utiliser l'organisation depuis le contexte
      const orgId = organisationId;

      if (!orgId) {
        throw new Error('Organisation introuvable. Veuillez vous reconnecter.');
      }

      // Récupérer les détails de l'organisation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: org, error: orgDetailsError } = await (supabase as any)
        .from('organisations')
        .select('nom, adresse, code_postal, ville, pays, iban, numero_tva, email, telephone')
        .eq('id', orgId)
        .single();

      if (orgDetailsError || !org) {
        throw new Error('Impossible de charger les détails de l\'organisation');
      }

      // Préparer les données de la facture
      const invoiceData = {
        user_id: user.id,
        organisation_id: orgId,
        invoice_number: invoiceNumber,
        client_name: selectedClient.name,
        client_company: selectedClient.vatNumber ? selectedClient.name : null,
        client_address: selectedClient.address,
        client_city: selectedClient.city,
        client_postal_code: selectedClient.postalCode,
        client_country: selectedClient.country,
        company_name: org.nom || 'Votre entreprise',
        company_address: org.adresse || '',
        company_city: org.ville || '',
        company_postal_code: org.code_postal || '',
        company_country: org.pays || 'CH',
        company_vat: org.numero_tva || '',
        company_email: org.email || user.email,
        iban: org.iban || null,
        devise: 'CHF',
        date: issueDate,
        due_date: dueDate,
        status: 'draft',
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          vat_rate: item.vatRate,
          total: item.total
        })),
        subtotal: subtotal,
        tax_amount: vatTotal,
        total: total,
        notes: ''
      };

      // Enregistrer la facture dans la base de données
      const { data: invoice, error: invoiceError } = await supabase
        .from('factures')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) {
        console.error('Erreur lors de l\'enregistrement de la facture:', invoiceError);
        throw new Error('Erreur lors de l\'enregistrement de la facture');
      }

      console.log('Facture enregistrée avec succès:', invoice);
      
      // Appeler le callback si fourni
      if (onInvoiceAdded) {
        onInvoiceAdded();
      }
      
      // Fermer le formulaire
      if (onClose) {
        onClose();
      }
      
      // Afficher un message de succès
      alert('Facture enregistrée avec succès');
      
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement de la facture:', error);
      const errorMessage = error?.message || 'Une erreur est survenue lors de l\'enregistrement de la facture';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Nouvelle facture</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Informations de l'émetteur */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Émetteur</h3>
              {orgData ? (
                <div className="space-y-1">
                  {/* Logo */}
                  {orgData.logo_url && (
                    <img
                      src={orgData.logo_url}
                      alt="Logo"
                      className="max-h-12 max-w-[130px] object-contain mb-2"
                    />
                  )}
                  {/* Couleur primaire — aperçu */}
                  {orgData.primary_color && (
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: orgData.primary_color }}
                      />
                      <span className="text-xs text-gray-500">Couleur facture</span>
                    </div>
                  )}
                  <p className="font-semibold text-gray-900">{orgData.nom}</p>
                  {orgData.adresse && <p className="text-xs text-gray-600">{orgData.adresse}</p>}
                  {(orgData.code_postal || orgData.ville) && (
                    <p className="text-xs text-gray-600">{orgData.code_postal} {orgData.ville}</p>
                  )}
                  <p className="text-xs text-gray-600">{orgData.pays || 'Suisse'}</p>
                  {orgData.numero_tva && <p className="text-xs text-gray-500">IDE: CHE-{orgData.numero_tva}</p>}
                  {orgData.iban && <p className="text-xs text-gray-500 font-mono mt-1">IBAN: {orgData.iban}</p>}
                  {(!orgData.logo_url || !orgData.primary_color) && (
                    <a
                      href="/dashboard/settings"
                      className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⚙️ Configurer logo &amp; couleurs →
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chargement des données de l'entreprise...</p>
              )}
            </div>

            {/* Informations du destinataire */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Destinataire</h3>
              {isLoading ? (
                <p className="text-sm text-gray-500">Chargement des clients...</p>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              )}
              
              {selectedClient && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium">{selectedClient.name}</p>
                  <p className="text-sm text-gray-600">{selectedClient.address}</p>
                  <p className="text-sm text-gray-600">
                    {selectedClient.postalCode} {selectedClient.city}
                  </p>
                  <p className="text-sm text-gray-600">{selectedClient.country}</p>
                  {selectedClient.vatNumber && (
                    <p className="text-sm text-gray-600">TVA: {selectedClient.vatNumber}</p>
                  )}
                </div>
              )}
            </div>

            {/* Détails de la facture */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Facture</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'émission</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'échéance</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lignes de facturation */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-900">Articles</h3>
              <button
                type="button"
                onClick={addNewLine}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-3 w-3 mr-1" />
                Ajouter une ligne
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire (CHF)</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">TVA</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total (CHF)</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, _) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Description de l'article"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          className="block w-20 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.05"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                          className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={item.vatRate}
                          onChange={(e) => handleItemChange(item.id, 'vatRate', Number(e.target.value))}
                          className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="8.1">8.1% (normal)</option>
                          <option value="2.6">2.6% (réduit)</option>
                          <option value="3.8">3.8% (hébergement)</option>
                          <option value="0">0% (exonéré)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Récapitulatif et QR code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                <textarea
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Ajoutez des notes ou des conditions de paiement..."
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sous-total:</span>
                  <span className="text-sm font-medium">{subtotal.toFixed(2)} CHF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">TVA:</span>
                  <span className="text-sm font-medium">{vatTotal.toFixed(2)} CHF</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-base font-bold">Total:</span>
                  <span className="text-base font-bold">{total.toFixed(2)} CHF</span>
                </div>
                
                {qrError && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      ⚠️ {qrError}
                    </p>
                  </div>
                )}
                {qrCodeDataUrl && !qrError && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Paiement par QR-bill (SPC v2.0)</p>
                    <div className="flex justify-center">
                      <img src={qrCodeDataUrl} alt="QR Code de paiement suisse" className="h-32 w-32" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Scannez pour payer</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedClientId || items.some(item => !item.description || item.unitPrice <= 0)}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
