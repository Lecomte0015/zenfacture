import React, { useEffect, useState, useCallback } from 'react';
import { FiCopy, FiCheck, FiGift, FiUsers } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  getMonCodeParrainage,
  getMesFilleuls,
  buildLienParrainage,
  type Filleul,
} from '@/services/parrainageService';

// Page dashboard client pour le programme de parrainage (voir migration
// 20260723000000_referral_program.sql + stripe-webhook/index.ts). Remplace le
// process manuel (envoyer un code promo par email à la main) : chaque client
// a ici son lien unique, et voit directement qui il a parrainé et si la
// récompense a été créditée.

const ParrainagePage: React.FC = () => {
  const [code, setCode] = useState<string | null>(null);
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const charger = useCallback(async () => {
    setLoading(true);
    const [monCode, mesFilleuls] = await Promise.all([
      getMonCodeParrainage(),
      getMesFilleuls(),
    ]);
    setCode(monCode);
    setFilleuls(mesFilleuls);
    setLoading(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const lien = code ? buildLienParrainage(code) : '';
  const nbCredites = filleuls.filter((f) => f.referral_reward_granted_at).length;

  const handleCopier = async () => {
    if (!lien) return;
    try {
      await navigator.clipboard.writeText(lien);
      setCopied(true);
      toast({ title: 'Lien copié', description: 'Ton lien de parrainage est dans le presse-papier.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Impossible de copier', description: lien, variant: 'destructive' });
    }
  };

  const statutBadge = (f: Filleul) => {
    if (f.referral_reward_granted_at) {
      return <Badge className="bg-green-100 text-green-700">1 mois offert crédité</Badge>;
    }
    if (f.subscription_status === 'active') {
      return <Badge className="bg-blue-100 text-blue-700">Client payant — récompense en cours</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-600">En essai</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiGift className="text-primary-600" /> Programme de parrainage
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Partage ton lien : dès qu'un filleul devient client payant, tu reçois automatiquement un mois offert.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ton lien de parrainage</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : code ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                readOnly
                value={lien}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700"
                onFocus={(e) => e.target.select()}
              />
              <Button onClick={handleCopier} className="shrink-0">
                {copied ? <FiCheck className="mr-2" /> : <FiCopy className="mr-2" />}
                {copied ? 'Copié' : 'Copier le lien'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-red-600">Impossible de charger ton code de parrainage.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
              <FiUsers />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filleuls.length}</p>
              <p className="text-sm text-gray-500">Filleuls inscrits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FiGift />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{nbCredites}</p>
              <p className="text-sm text-gray-500">Mois offerts crédités</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tes filleuls</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : filleuls.length === 0 ? (
            <p className="text-sm text-gray-500">
              Personne ne s'est encore inscrit avec ton lien. Partage-le pour commencer à cumuler des mois offerts.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Nom</th>
                    <th className="py-2 pr-4 font-medium">Inscrit le</th>
                    <th className="py-2 pr-4 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filleuls.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2 pr-4 text-gray-900">{f.name || f.email || 'Utilisateur ZenFacture'}</td>
                      <td className="py-2 pr-4 text-gray-600">
                        {format(parseISO(f.created_at), 'd MMMM yyyy', { locale: fr })}
                      </td>
                      <td className="py-2 pr-4">{statutBadge(f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParrainagePage;
