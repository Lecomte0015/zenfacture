import { useState, useEffect, useCallback } from 'react';
import { TemplateData, getTemplates, createTemplate, updateTemplate, deleteTemplate, setDefaultTemplate } from '../services/templateService';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { organisationId } = useOrganisation();

  const fetchTemplates = useCallback(async () => {
    if (!isAuthenticated || !organisationId) return;
    setLoading(true);
    try {
      const data = await getTemplates(organisationId);
      setTemplates(data);
    } catch (err) {
      setError('Impossible de charger les templates.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId]);

  const addTemplate = async (data: Omit<TemplateData, 'id' | 'cree_le'>) => {
    const newTemplate = await createTemplate(data);
    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  };

  const editTemplate = async (id: string, updates: Partial<TemplateData>) => {
    const updated = await updateTemplate(id, updates);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    return updated;
  };

  const removeTemplate = async (id: string) => {
    await deleteTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const setDefault = async (id: string) => {
    if (!organisationId) return;
    await setDefaultTemplate(id, organisationId);
    setTemplates(prev => prev.map(t => ({ ...t, est_defaut: t.id === id })));
  };

  useEffect(() => {
    if (isAuthenticated && organisationId) fetchTemplates();
    else { setTemplates([]); setLoading(false); }
  }, [isAuthenticated, organisationId]);

  return { templates, loading, error, addTemplate, editTemplate, removeTemplate, setDefault, refreshTemplates: fetchTemplates, organisationId };
};
