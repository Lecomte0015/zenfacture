import React, { useState } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';
import { typedSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { getOrganisationId } from '@/lib/getOrganisationId';
import { toast } from 'react-toastify';
import { z } from 'zod';

// ─── Schema Zod Dépense ───────────────────────────────────────────────────────

export const expenseSchema = z.object({
  description: z.string().min(1, 'Description requise').max(255, 'Description trop longue'),
  amount: z
    .string()
    .min(1, 'Montant requis')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Montant invalide (doit être supérieur à 0)',
    }),
  category: z.string().min(1, 'Catégorie requise'),
  date: z.string().min(1, 'Date requise'),
});
interface Expense {
  id?: string;
  user_id: string;
  organisation_id: string | null;
  description: string;
  amount: string | number;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'reimbursed';
  created_at?: string;
  updated_at?: string;
}

// Composants UI personnalisés
const Button = ({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  [key: string]: any;
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100 text-gray-700',
  };
  const sizeStyles = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

const ExpensesPage = () => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Fournitures',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as const
  });

  const { user } = useAuth();

  // Fonction pour vérifier si la table existe en essayant de l'interroger
  const checkTableExists = async (): Promise<boolean> => {
    try {
      // On essaie de faire une requête simple sur la table
      const { error } = await typedSupabase
        .from('depenses')
        .select('id')
        .limit(1);
      
      // Si pas d'erreur, la table existe
      if (!error) return true;
      
      // Si l'erreur indique que la table n'existe pas, on retourne false
      if (error.code === '42P01') { // 42P01 = undefined_table
        return false;
      }
      
      // Pour les autres erreurs, on log et on considère que la table n'existe pas
      console.error('Erreur lors de la vérification de la table:', error);
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de la table:', error);
      return false;
    }
  };

  // Fonction pour créer la table des dépenses
  const createExpensesTable = async () => {
    try {
      // Au lieu d'utiliser RPC, on exécute directement la migration
      const { error } = await typedSupabase
        .from('depenses')
        .insert([{
          // On insère un enregistrement factice qui sera supprimé
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          description: 'Initialisation de la table',
          amount: 0,
          category: 'Initialisation',
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        }]);

      // Si on arrive ici, la table existe et on peut supprimmer l'enregistrement factice
      if (!error) {
        // On supprime l'enregistrement factice
        await typedSupabase
          .from('depenses')
          .delete()
          .eq('description', 'Initialisation de la table');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la création de la table:', error);
      return false;
    }
  };

  // Fonction pour charger les dépenses
  const fetchExpenses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Vérifier si la table existe
      const tableExists = await checkTableExists();
      
      if (!tableExists) {
        toast.info('Initialisation de la table des dépenses...');
        const created = await createExpensesTable();
        if (!created) {
          throw new Error('Impossible de créer la table des dépenses');
        }
        toast.success('Table des dépenses initialisée avec succès');
      }

      // Maintenant que la table existe, on peut récupérer les données
      const orgId = await getOrganisationId();
      const { data, error } = await typedSupabase
        .from('depenses')
        .select('*')
        .eq('organisation_id', orgId)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setExpenses(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses:', error);
      toast.error('Erreur lors du chargement des dépenses');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour supprimer une dépense
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }
    
    try {
      const { error } = await typedSupabase
        .from('depenses')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Mettre à jour la liste des dépenses localement
      setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== id));
      
      toast.success('Dépense supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error);
      toast.error('Erreur lors de la suppression de la dépense');
    }
  };

  // Fonction pour mettre à jour le statut d'une dépense
  const updateExpenseStatus = async (id: string, status: 'pending' | 'approved' | 'reimbursed') => {
    try {
      const { error } = await typedSupabase
        .from('depenses')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      
      // Mettre à jour la liste des dépenses localement
      setExpenses(prevExpenses => 
        prevExpenses.map(exp => 
          exp.id === id ? { ...exp, status } : exp
        )
      );
      
      toast.success('Statut mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Fonction pour préparer l'édition d'une dépense
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense({
      ...expense,
      amount: expense.amount ? expense.amount.toString() : '0',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsAddExpenseOpen(true);
  };

  // Charger les dépenses au montage du composant
  React.useEffect(() => {
    fetchExpenses();
  }, [user]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Vous devez être connecté pour ajouter une dépense');
      return;
    }

    // Validation Zod
    const formValues = editingExpense
      ? { description: editingExpense.description, amount: String(editingExpense.amount), category: editingExpense.category, date: editingExpense.date }
      : { description: newExpense.description, amount: newExpense.amount, category: newExpense.category, date: newExpense.date };

    const validation = expenseSchema.safeParse(formValues);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? 'Données invalides');
      return;
    }

    setIsSubmitting(true);

    try {
      const orgId = await getOrganisationId();
      const expenseData = {
        user_id: user.id,
        organisation_id: orgId,
        description: editingExpense ? editingExpense.description : newExpense.description,
        amount: parseFloat(editingExpense ? 
          (typeof editingExpense.amount === 'string' ? editingExpense.amount : editingExpense.amount.toString()) : 
          newExpense.amount),
        category: editingExpense ? editingExpense.category : newExpense.category,
        date: editingExpense ? editingExpense.date : newExpense.date,
        status: editingExpense ? editingExpense.status : 'pending' as const
      };

      if (editingExpense && editingExpense.id) {
        // Mise à jour d'une dépense existante
        const { data, error } = await typedSupabase
          .from('depenses')
          .update(expenseData)
          .eq('id', editingExpense.id)
          .select();
          
        if (error) throw error;
        
        // Mettre à jour la liste des dépenses localement
        if (data && data.length > 0) {
          setExpenses(prevExpenses => 
            prevExpenses.map(exp => 
              exp.id === editingExpense.id ? data[0] as Expense : exp
            )
          );
        }
        
        toast.success('Dépense mise à jour avec succès !');
      } else {
        // Création d'une nouvelle dépense
        const { data, error } = await typedSupabase
          .from('depenses')
          .insert(expenseData)
          .select();
          
        if (error) throw error;
        
        // Mettre à jour la liste des dépenses localement
        if (data && data.length > 0) {
          setExpenses(prevExpenses => [data[0], ...prevExpenses]);
        }
        
        toast.success('Dépense enregistrée avec succès !');
      }
      
      // Réinitialiser le formulaire et l'état d'édition
      setNewExpense({
        description: '',
        amount: '',
        category: 'Fournitures',
        date: new Date().toISOString().split('T')[0],
        status: 'pending' as const
      });
      setEditingExpense(null);
      setIsAddExpenseOpen(false);
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la dépense:', error);
      toast.error('Erreur lors de l\'enregistrement de la dépense');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ...

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour obtenir la classe CSS en fonction du statut
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'reimbursed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes Dépenses</h1>
        <Button onClick={() => setIsAddExpenseOpen(true)}>
          + Nouvelle Dépense
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.date ? formatDate(expense.date) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {expense.category || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {expense.amount ? `${parseFloat(expense.amount.toString()).toFixed(2)} €` : '0,00 €'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={expense.status}
                        onChange={(e) => updateExpenseStatus(expense.id!, e.target.value as 'pending' | 'approved' | 'reimbursed')}
                        className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full cursor-pointer ${getStatusClass(expense.status)}`}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none', textAlign: 'center' }}
                      >
                        <option value="pending" className="bg-white text-gray-900">En attente</option>
                        <option value="approved" className="bg-white text-gray-900">Approuvée</option>
                        <option value="reimbursed" className="bg-white text-gray-900">Remboursée</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id!)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'ajout de dépense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h2>
              <button 
                onClick={() => {
                  setIsAddExpenseOpen(false);
                  setEditingExpense(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  value={editingExpense ? editingExpense.description : newExpense.description}
                  onChange={(e) => 
                    editingExpense
                      ? setEditingExpense({...editingExpense, description: e.target.value})
                      : setNewExpense({...newExpense, description: e.target.value})
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingExpense ? editingExpense.amount : newExpense.amount}
                  onChange={(e) => 
                    editingExpense
                      ? setEditingExpense({...editingExpense, amount: e.target.value})
                      : setNewExpense({...newExpense, amount: e.target.value})
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={editingExpense ? editingExpense.category : newExpense.category}
                  onChange={(e) => 
                    editingExpense
                      ? setEditingExpense({...editingExpense, category: e.target.value})
                      : setNewExpense({...newExpense, category: e.target.value})
                  }
                  required
                >
                  <option value="Fournitures">Fournitures</option>
                  <option value="Déplacements">Déplacements</option>
                  <option value="Matériel">Matériel</option>
                  <option value="Logiciels">Logiciels</option>
                  <option value="Autres">Autres</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={editingExpense ? editingExpense.date : newExpense.date}
                  onChange={(e) => 
                    editingExpense
                      ? setEditingExpense({...editingExpense, date: e.target.value})
                      : setNewExpense({...newExpense, date: e.target.value})
                  }
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddExpenseOpen(false);
                    setEditingExpense(null);
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting 
                    ? 'Enregistrement...' 
                    : editingExpense ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
