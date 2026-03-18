import React, { useState, useMemo } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import { format, parseISO, isBefore, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdminReminders } from '@/hooks/useAdminReminders';
import { AdminReminder, ReminderStatus } from '@/services/adminReminderService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const STATUS_LABELS: Record<ReminderStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
};

const STATUS_COLORS: Record<ReminderStatus, string> = {
  todo: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};

const CATEGORIES = [
  'TVA',
  'Impôt sur le revenu',
  'Impôt sur les sociétés',
  'AVS',
  'LPP',
  'Assurance maladie',
  'Autre',
];

const AdminRemindersPage: React.FC = () => {
  const { reminders, loading, error, addReminder, updateReminder, removeReminder } = useAdminReminders();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<AdminReminder | null>(null);
  const { toast } = useToast();

  // État pour le formulaire
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    due_date: string;
    status: ReminderStatus;
    category: string;
  }>({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'todo',
    category: 'Autre',
  });

  // Filtrer les rappels par statut
  const { upcoming, past, others } = useMemo(() => {
    const now = new Date();

    return reminders.reduce<{ upcoming: AdminReminder[]; past: AdminReminder[]; others: AdminReminder[] }>(
      (acc, reminder) => {
        const dueDate = parseISO(reminder.due_date);
        
        if (isBefore(dueDate, now)) {
          acc.past.push(reminder);
        } else if (isToday(dueDate) || isTomorrow(dueDate)) {
          acc.upcoming.push(reminder);
        } else {
          acc.others.push(reminder);
        }
        
        return acc;
      },
      { upcoming: [], past: [], others: [] }
    );
  }, [reminders]);

  // Gérer les changements du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Ouvrir le dialogue d'ajout
  const handleOpenAddDialog = () => {
    setFormData({
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      status: 'todo',
      category: 'Autre',
    });
    setEditingReminder(null);
    setIsDialogOpen(true);
  };

  // Ouvrir le dialogue d'édition
  const handleOpenEditDialog = (reminder: AdminReminder) => {
    setFormData({
      title: reminder.title,
      description: reminder.description,
      due_date: reminder.due_date.split('T')[0],
      status: reminder.status,
      category: reminder.category,
    });
    setEditingReminder(reminder);
    setIsDialogOpen(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id!, {
          ...formData,
          due_date: new Date(formData.due_date).toISOString(),
        });
        toast({
          title: 'Rappel mis à jour',
          description: 'Le rappel a été mis à jour avec succès.',
        });
      } else {
        await addReminder({
          ...formData,
          due_date: new Date(formData.due_date).toISOString(),
        });
        toast({
          title: 'Rappel ajouté',
          description: 'Le rappel a été ajouté avec succès.',
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire :', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde du rappel.',
        variant: 'destructive',
      });
    }
  };

  // Supprimer un rappel
  const handleDeleteReminder = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rappel ?')) {
      try {
        await removeReminder(id);
        toast({
          title: 'Rappel supprimé',
          description: 'Le rappel a été supprimé avec succès.',
        });
      } catch (error) {
        console.error('Erreur lors de la suppression du rappel :', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la suppression du rappel.',
          variant: 'destructive',
        });
      }
    }
  };

  // Formater la date pour l'affichage
  const formatReminderDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return 'Aujourd\'hui';
    }
    
    if (isTomorrow(date)) {
      return 'Demain';
    }
    
    return format(date, 'PPP', { locale: fr });
  };

  if (loading && reminders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <p className="font-medium">Erreur lors du chargement des rappels</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Rappels administratifs</h1>
        <Button onClick={handleOpenAddDialog}>
          <FiPlus className="mr-2 h-4 w-4" />
          Ajouter un rappel
        </Button>
      </div>

      {/* Rappels à venir */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiAlertTriangle className="text-yellow-500 mr-2" />
            À faire bientôt
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={handleOpenEditDialog}
                onDelete={handleDeleteReminder}
                formatDate={formatReminderDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tous les rappels */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Tous les rappels</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'échéance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...upcoming, ...others, ...past].map(reminder => (
                <tr key={reminder.id} className={isBefore(parseISO(reminder.due_date), new Date()) ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{reminder.title}</div>
                    <div className="text-sm text-gray-500">{reminder.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{formatReminderDate(reminder.due_date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">{reminder.category}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={STATUS_COLORS[reminder.status]}>
                      {STATUS_LABELS[reminder.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenEditDialog(reminder)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogue d'ajout/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Titre
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Titre du rappel"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Détails du rappel"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="due_date" className="text-sm font-medium">
                    Date d'échéance
                  </label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Statut
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, status: value as ReminderStatus }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Catégorie
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingReminder ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Composant de carte pour les rappels
const ReminderCard: React.FC<{
  reminder: AdminReminder;
  onEdit: (reminder: AdminReminder) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
}> = ({ reminder, onEdit, onDelete, formatDate }) => {
  const isOverdue = isBefore(parseISO(reminder.due_date), new Date()) && reminder.status !== 'done';
  
  return (
    <Card className={`${isOverdue ? 'border-red-300' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{reminder.title}</CardTitle>
          <Badge className={STATUS_COLORS[reminder.status]}>
            {STATUS_LABELS[reminder.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{reminder.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <FiCalendar className="mr-1.5 h-4 w-4" />
            <span>{formatDate(reminder.due_date)}</span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(reminder)}
              className="text-blue-600 hover:bg-blue-50"
            >
              <FiEdit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(reminder.id!)}
              className="text-red-600 hover:bg-red-50"
            >
              <FiTrash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminRemindersPage;
