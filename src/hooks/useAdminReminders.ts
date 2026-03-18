import { useState, useEffect, useCallback } from 'react';
import { AdminReminder, getAdminReminders, createAdminReminder, updateAdminReminder, deleteAdminReminder, getUpcomingAdminReminders } from '@/services/adminReminderService';
import { useAuth } from '@/context/AuthContext';

type UseAdminRemindersReturn = {
  reminders: AdminReminder[];
  upcomingReminders: AdminReminder[];
  loading: boolean;
  error: Error | null;
  addReminder: (reminder: Omit<AdminReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<AdminReminder>) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  refreshReminders: () => Promise<void>;
};

/**
 * Hook personnalisé pour gérer les rappels administratifs
 */
export const useAdminReminders = (): UseAdminRemindersReturn => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<AdminReminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<AdminReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Charger les rappels
  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger tous les rappels
      const allReminders = await getAdminReminders();
      setReminders(allReminders);
      
      // Charger les rappels à venir (7 prochains jours par défaut)
      const upcoming = await getUpcomingAdminReminders(7);
      setUpcomingReminders(upcoming);
    } catch (err) {
      console.error('Erreur lors du chargement des rappels :', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Ajouter un rappel
  const addReminder = useCallback(async (reminder: Omit<AdminReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setLoading(true);
      const newReminder = await createAdminReminder({
        ...reminder,
        user_id: user.id,
        status: 'todo' as const,
      });
      setReminders(prev => [...prev, newReminder]);
      
      // Mettre à jour les rappels à venir si nécessaire
      const now = new Date();
      const reminderDate = new Date(reminder.due_date);
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);
      
      if (reminderDate <= weekFromNow) {
        setUpcomingReminders(prev => [...prev, newReminder]);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du rappel :', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour un rappel
  const updateReminder = useCallback(async (id: string, updates: Partial<AdminReminder>) => {
    try {
      setLoading(true);
      const updatedReminder = await updateAdminReminder(id, updates);
      
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === id ? updatedReminder : reminder
        )
      );
      
      // Mettre à jour les rappels à venir si nécessaire
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);
      
      setUpcomingReminders(prev => {
        const reminderDate = new Date(updates.due_date || '');
        const isUpcoming = reminderDate <= weekFromNow && reminderDate >= now;
        
        return prev.some(r => r.id === id)
          ? prev.map(r => r.id === id ? updatedReminder : r)
          : isUpcoming
            ? [...prev, updatedReminder]
            : prev;
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du rappel :', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un rappel
  const removeReminder = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await deleteAdminReminder(id);
      
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
      setUpcomingReminders(prev => prev.filter(reminder => reminder.id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression du rappel :', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Rafraîchir les rappels
  const refreshReminders = useCallback(async () => {
    await loadReminders();
  }, [loadReminders]);

  return {
    reminders,
    upcomingReminders,
    loading,
    error,
    addReminder,
    updateReminder,
    removeReminder,
    refreshReminders,
  };
};

export default useAdminReminders;
