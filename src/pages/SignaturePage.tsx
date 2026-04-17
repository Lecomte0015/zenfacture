/**
 * SignaturePage — Page publique de signature électronique (Phase 8.4)
 * URL : /signer/:token
 *
 * Le signataire peut dessiner ou taper sa signature sans compte.
 * Canvas HTML5 pour la signature dessinée.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle, XCircle, Loader2, PenLine, Type,
  Eraser, Building2, FileText, AlertTriangle,
} from 'lucide-react';
import {
  SignaturePublicData,
  getSignatureParToken, enregistrerSignature, refuserSignature,
} from '../services/signatureService';
import { formatCurrency } from '../utils/format';

export default function SignaturePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SignaturePublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [mode, setMode] = useState<'dessinee' | 'tapee'>('dessinee');
  const [nomSigne, setNomSigne] = useState('');
  const [texteSigne, setTexteSigne] = useState('');
  const [accepte, setAccepte] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [refused, setRefused] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [raisonRefus, setRaisonRefus] = useState('');

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!token) { setErreur('Lien de signature invalide.'); setLoading(false); return; }
    getSignatureParToken(token)
      .then(d => {
        if (!d) setErreur('Ce lien de signature est invalide ou a expiré.');
        else {
          setData(d);
          setNomSigne(d.demande.signataire_nom);
          if (['signe', 'refuse'].includes(d.demande.statut)) {
            if (d.demande.statut === 'signe') setSigned(true);
            if (d.demande.statut === 'refuse') setRefused(true);
          }
        }
      })
      .catch(() => setErreur('Impossible de charger le document.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Canvas drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current!.x, lastPosRef.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPosRef.current = pos;
    setHasDrawn(true);
  };

  const stopDrawing = () => { isDrawingRef.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getSignatureData = (): string | undefined => {
    if (mode === 'dessinee') {
      if (!canvasRef.current || !hasDrawn) return undefined;
      return canvasRef.current.toDataURL('image/png');
    }
    return undefined; // Pour la signature tapée, on utilise nom_signe
  };

  const canSign = () => {
    if (!accepte) return false;
    if (!nomSigne.trim()) return false;
    if (mode === 'dessinee') return hasDrawn;
    if (mode === 'tapee') return texteSigne.trim().length >= 3;
    return false;
  };

  const handleSigner = async () => {
    if (!token || !canSign()) return;
    setSigning(true);
    try {
      const ok = await enregistrerSignature(token, {
        signature_data: getSignatureData(),
        signature_type: mode,
        nom_signe: (mode === 'tapee' ? texteSigne : nomSigne).trim(),
      });
      if (ok) setSigned(true);
      else setErreur('Erreur lors de la signature. Réessayez.');
    } finally {
      setSigning(false);
    }
  };

  const handleRefuser = async () => {
    if (!token) return;
    await refuserSignature(token, raisonRefus.trim() || undefined);
    setRefused(true);
    setShowRefuseModal(false);
  };

  // ─── ÉTATS FINAUX ────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-gray-500">Chargement du document…</p>
      </div>
    </div>
  );

  if (erreur) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
        <p className="text-gray-500">{erreur}</p>
      </div>
    </div>
  );

  if (signed) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Document signé !</h1>
        <p className="text-gray-500 mb-4">
          Vous avez signé le document <strong>{data?.document.titre}</strong>.<br />
          Une confirmation a été envoyée par email.
        </p>
        <p className="text-xs text-gray-400">
          Signé le {new Date().toLocaleString('fr-CH')}
        </p>
      </div>
    </div>
  );

  if (refused) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Document refusé</h1>
        <p className="text-gray-500">Vous avez refusé de signer ce document. L'expéditeur en sera informé.</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { demande, organisation, document: doc } = data;
  const couleur = organisation.couleur_principale || '#2563EB';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-5 px-4 shadow-md" style={{ backgroundColor: couleur }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {organisation.logo_url ? (
            <img src={organisation.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-white/20 p-1" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="font-bold">{organisation.nom}</p>
            <p className="text-white/70 text-sm">Demande de signature électronique</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Document */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: couleur + '15' }}>
              <FileText className="w-5 h-5" style={{ color: couleur }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg">{doc.titre}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                {doc.numero && <span>N° {doc.numero}</span>}
                {doc.date && <span>Du {new Date(doc.date).toLocaleDateString('fr-CH')}</span>}
                {doc.total !== undefined && <span className="font-semibold text-gray-700">{formatCurrency(doc.total, doc.devise || 'CHF')}</span>}
              </div>
            </div>
          </div>

          {demande.message_personnalise && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
              {demande.message_personnalise}
            </div>
          )}

          {doc.contenu_texte && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 whitespace-pre-wrap border border-gray-200">
              {doc.contenu_texte}
            </div>
          )}
        </div>

        {/* Zone de signature */}
        {!['signe', 'refuse', 'expire'].includes(demande.statut) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Votre signature</h2>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom complet *</label>
              <input type="text" value={nomSigne} onChange={e => setNomSigne(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Marie Dupont" />
            </div>

            {/* Mode signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode de signature</label>
              <div className="flex gap-2">
                <button onClick={() => setMode('dessinee')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${mode === 'dessinee' ? 'text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  style={mode === 'dessinee' ? { backgroundColor: couleur, borderColor: couleur } : {}}>
                  <PenLine className="w-4 h-4" />Signature dessinée
                </button>
                <button onClick={() => setMode('tapee')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${mode === 'tapee' ? 'text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  style={mode === 'tapee' ? { backgroundColor: couleur, borderColor: couleur } : {}}>
                  <Type className="w-4 h-4" />Signature tapée
                </button>
              </div>
            </div>

            {mode === 'dessinee' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-500">Dessinez votre signature ci-dessous</label>
                  <button onClick={clearCanvas} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                    <Eraser className="w-3.5 h-3.5" />Effacer
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
                    style={{ touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                {!hasDrawn && <p className="text-xs text-gray-400 mt-1 text-center">Utilisez la souris ou le doigt pour signer</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-500 mb-1">Tapez votre prénom et nom</label>
                <input type="text" value={texteSigne} onChange={e => setTexteSigne(e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-2xl font-signature text-blue-800 focus:outline-none focus:border-blue-400 bg-gray-50"
                  placeholder="Marie Dupont"
                  style={{ fontFamily: 'cursive, serif' }} />
              </div>
            )}

            {/* Acceptation légale */}
            <label className="flex items-start gap-3 cursor-pointer bg-blue-50 border border-blue-100 rounded-xl p-3">
              <input type="checkbox" checked={accepte} onChange={e => setAccepte(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-blue-800 leading-relaxed">
                Je certifie être <strong>{demande.signataire_nom}</strong> et j'accepte de signer électroniquement le document <strong>{doc.titre}</strong>.
                Cette signature électronique a la même valeur légale qu'une signature manuscrite conformément au droit suisse (CO art. 14 al. 2bis).
              </span>
            </label>

            {/* Boutons */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSigner} disabled={signing || !canSign()}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors"
                style={{ backgroundColor: canSign() ? couleur : '#9ca3af' }}>
                {signing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {signing ? 'Signature en cours…' : 'Signer le document'}
              </button>
              <button onClick={() => setShowRefuseModal(true)}
                className="px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors font-medium">
                Refuser
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              🔒 Connexion sécurisée · Ce lien expire le {new Date(demande.expires_at).toLocaleDateString('fr-CH')}
            </p>
          </div>
        )}

        {/* Statut si déjà vu */}
        {demande.statut === 'vu' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />Vous avez déjà consulté ce document.
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Propulsé par <span className="font-semibold text-gray-500">ZenFacture</span>
        </p>
      </div>

      {/* Modal refus */}
      {showRefuseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500/75" onClick={() => setShowRefuseModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Refuser de signer ?</h3>
              <p className="text-sm text-gray-500 mb-3">L'expéditeur sera informé de votre refus.</p>
              <textarea value={raisonRefus} onChange={e => setRaisonRefus(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-3"
                placeholder="Raison du refus (optionnel)…" />
              <div className="flex gap-2">
                <button onClick={() => setShowRefuseModal(false)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={handleRefuser} className="flex-1 px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium">Refuser</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
