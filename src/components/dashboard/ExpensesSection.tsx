import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiDollarSign, FiTag, FiCalendar, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
}

const categories = [
  'Fournitures de bureau',
  'Matériel informatique',
  'Frais de déplacement',
  'Formation',
  'Abonnements',
  'Autres'
];

const ExpensesSection: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({
    amount: 0,
    description: '',
    category: categories[0],
    date: new Date().toISOString().split('T')[0]
  });

  // Charger les dépenses depuis le localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('zenfacture_expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Sauvegarder les dépenses dans le localStorage
  const saveExpenses = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses);
    localStorage.setItem('zenfacture_expenses', JSON.stringify(updatedExpenses));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentExpense.description || !currentExpense.amount) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newExpense: Expense = {
      id: currentExpense.id || `exp-${Date.now()}`,
      amount: currentExpense.amount || 0,
      description: currentExpense.description || '',
      category: currentExpense.category || categories[0],
      date: currentExpense.date || new Date().toISOString().split('T')[0]
    };

    let updatedExpenses;
    if (currentExpense.id) {
      // Mise à jour d'une dépense existante
      updatedExpenses = expenses.map(exp => 
        exp.id === currentExpense.id ? newExpense : exp
      );
      toast.success('Dépense mise à jour avec succès');
    } else {
      // Ajout d'une nouvelle dépense
      updatedExpenses = [...expenses, newExpense];
      toast.success('Dépense ajoutée avec succès');
    }

    saveExpenses(updatedExpenses);
    resetForm();
  };

  const handleEdit = (expense: Expense) => {
    setCurrentExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      saveExpenses(updatedExpenses);
      toast.success('Dépense supprimée avec succès');
    }
  };

  const resetForm = () => {
    setCurrentExpense({
      amount: 0,
      description: '',
      category: categories[0],
      date: new Date().toISOString().split('T')[0]
    });
    setIsFormOpen(false);
  };

  // Calculer le total des dépenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'ajout */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Vos dépenses</h2>
          <p className="text-sm text-gray-500">
            Total: <span className="font-semibold">{totalExpenses.toFixed(2)} CHF</span>
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FiPlus className="-ml-1 mr-2 h-5 w-5" />
          Ajouter une dépense
        </button>
      </div>

      {/* Formulaire d'ajout/modification */}
      {isFormOpen && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {currentExpense.id ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  id="description"
                  value={currentExpense.description || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Catégorie
                </label>
                <select
                  id="category"
                  name="category"
                  value={currentExpense.category || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Montant (CHF) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">CHF</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    min="0"
                    step="0.05"
                    value={currentExpense.amount || ''}
                    onChange={handleInputChange}
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-14 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={currentExpense.date || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {currentExpense.id ? 'Mettre à jour' : 'Ajouter la dépense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des dépenses */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {expenses.length === 0 ? (
          <div className="text-center p-8">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune dépense</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par ajouter votre première dépense.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Nouvelle dépense
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString('fr-CH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {expense.amount.toFixed(2)} CHF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                    Total:
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {totalExpenses.toFixed(2)} CHF
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesSection;
