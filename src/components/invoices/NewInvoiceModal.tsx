import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { FiX, FiPlus, FiMinus } from 'react-icons/fi';
import { Invoice, InvoiceItem } from '../../types/invoice';

type FormData = Omit<Invoice, 'id' | 'items' | 'total' | 'createdAt' | 'updatedAt'>;

type NewInvoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  initialData?: Partial<Invoice>;
};

const NewInvoiceModal = ({ isOpen, onClose, onSave, initialData }: NewInvoiceModalProps) => {
  // Données de l'entreprise par défaut
  const defaultCompanyData: Partial<FormData> = {
    companyName: 'ZENFACTURE SA',
    companyAddress: '123 Rue de la Paix',
    companyCity: '1201 Genève',
    companyPostalCode: '1201',
    companyCountry: 'Suisse',
    companyVAT: 'CHE-123.456.789',
  };

  // État du formulaire
  const [formData, setFormData] = useState<FormData>(() => ({
    client: initialData?.client || '',
    clientAddress: initialData?.clientAddress || '',
    clientCity: initialData?.clientCity || '',
    clientPostalCode: initialData?.clientPostalCode || '',
    clientCountry: initialData?.clientCountry || 'Suisse',
    clientEmail: initialData?.clientEmail || '',
    companyName: initialData?.companyName || defaultCompanyData.companyName || '',
    companyAddress: initialData?.companyAddress || defaultCompanyData.companyAddress || '',
    companyCity: initialData?.companyCity || defaultCompanyData.companyCity || '',
    companyPostalCode: initialData?.companyPostalCode || defaultCompanyData.companyPostalCode || '',
    companyCountry: initialData?.companyCountry || defaultCompanyData.companyCountry || '',
    companyVAT: initialData?.companyVAT || defaultCompanyData.companyVAT || '',
    companyEmail: initialData?.companyEmail || '',
    companyPhone: initialData?.companyPhone || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: (initialData?.status as Invoice['status']) || 'draft',
    notes: initialData?.notes || '',
    terms: initialData?.terms || '',
    paymentMethod: initialData?.paymentMethod || '',
    paymentReference: initialData?.paymentReference || '',
  }));

  // Gestion des articles de la facture
  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items?.length 
      ? initialData.items.map(item => ({
          ...item,
          id: item.id || Date.now().toString(),
          amount: item.amount || (item.quantity || 0) * (item.unitPrice || 0)
        }))
      : [{
          id: Date.now().toString(),
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          taxRate: 0
        }]
  );
  
  const [total, setTotal] = useState(initialData?.total || 0);

  // Calcule le total des articles
  const calculateTotal = (items: InvoiceItem[]): number => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // Met à jour le total lorsque les articles changent
  useEffect(() => {
    setTotal(calculateTotal(items));
  }, [items]);

  // Gestion des changements sur les champs d'un article
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const numValue = Number(value);
      item[field] = numValue;
      
      // Recalculer le montant si la quantité ou le prix unitaire change
      if (field === 'quantity' || field === 'unitPrice') {
        item.amount = (item.quantity || 0) * (item.unitPrice || 0);
      }
    } else {
      (item as any)[field] = value;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  // Ajoute un nouvel article
  const addItem = () => {
    setItems([
      ...items, 
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        taxRate: 0
      }
    ]);
  };

  // Supprime un article
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // Soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Créer une facture complète avec les données du formulaire
    const invoice: Invoice = {
      ...formData,
      id: initialData?.id || `INV-${Date.now()}`,
      items: items.map(item => ({
        ...item,
        id: item.id || Date.now().toString(),
        amount: (item.quantity || 0) * (item.unitPrice || 0)
      })),
      total: calculateTotal(items),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    onSave(invoice);
  };

  // Gestion des changements de champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-10 overflow-y-auto"
      open={isOpen}
      onClose={onClose}
    >
      <div className="min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black opacity-30" />
        <span className="inline-block h-screen align-middle" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
              Nouvelle facture
            </Dialog.Title>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Émetteur</h3>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="companyAddress"
                    name="companyAddress"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      NPA
                    </label>
                    <input
                      type="text"
                      id="companyPostalCode"
                      name="companyPostalCode"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={formData.companyPostalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="companyCity" className="block text-sm font-medium text-gray-700 mb-1">
                      Localité
                    </label>
                    <input
                      type="text"
                      id="companyCity"
                      name="companyCity"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={formData.companyCity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="companyVAT" className="block text-sm font-medium text-gray-700 mb-1">
                    No TVA
                  </label>
                  <input
                    type="text"
                    id="companyVAT"
                    name="companyVAT"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={formData.companyVAT}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Client</h3>
                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du client
                  </label>
                  <input
                    type="text"
                    id="client"
                    name="client"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={formData.client}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="clientAddress"
                    name="clientAddress"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={formData.clientAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clientPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      NPA
                    </label>
                    <input
                      type="text"
                      id="clientPostalCode"
                      name="clientPostalCode"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={formData.clientPostalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="clientCity" className="block text-sm font-medium text-gray-700 mb-1">
                      Localité
                    </label>
                    <input
                      type="text"
                      id="clientCity"
                      name="clientCity"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={formData.clientCity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Échéance
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={formData.dueDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Articles</h4>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={addItem}
                >
                  <FiPlus className="mr-1 h-4 w-4" />
                  Ajouter un article
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-5">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Quantité</label>
                      <input
                        type="number"
                        min="1"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Prix unitaire (CHF)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2 flex items-end">
                      <div className="w-full">
                        <label className="block text-xs text-gray-500 mb-1">Montant (CHF)</label>
                        <div className="block w-full border border-gray-300 bg-gray-50 rounded-md py-2 px-3 text-sm">
                          {item.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                      >
                        <FiMinus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-4">
              <div className="text-lg font-medium">
                Total: <span className="text-primary-600">{total.toFixed(2)} CHF</span>
              </div>
              <div className="space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={onClose}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Enregistrer la facture
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};

export default NewInvoiceModal;
