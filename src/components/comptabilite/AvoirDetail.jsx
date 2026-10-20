// components/comptabilite/AvoirDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileMinus, Edit, Trash2, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, User, Calendar, DollarSign,
  FileText, Hash, Info, Printer, Percent, Receipt,
  ArrowUpRight, Layers, Copy, ExternalLink
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost',    icon: FileText,    description: 'En cours de rédaction' },
  emis:      { label: 'Émis',      cls: 'badge-info',     icon: CheckCircle, description: 'Avoir émis au client' },
  utilise:   { label: 'Utilisé',   cls: 'badge-success',  icon: CheckCircle, description: 'Avoir appliqué sur une facture' },
  annule:    { label: 'Annulé',    cls: 'badge-error',    icon: XCircle,     description: 'Avoir annulé' },
};

const AvoirDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [avoir, setAvoir] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [codeCopie, setCodeCopie] = useState(false);

  useEffect(() => {
    chargerAvoir();
  }, [id]);

  const chargerAvoir = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/avoirs/${id}/`);
      setAvoir(res.data);
    } catch (err) {
      setErreur(
        err.response?.status === 404
          ? "Cet avoir n'existe pas ou a été supprimé."
          : 'Impossible de charger l\'avoir.'
      );
    } finally {
      setChargement(false);
    }
  };

  const supprimerAvoir = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/avoirs/${id}/`);
      navigate('/avoirs');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setChargementAction(false);
    }
  };

  const copierNumero = () => {
    if (!avoir?.numero) return;
    navigator.clipboard.writeText(avoir.numero);
    setCodeCopie(true);
    setTimeout(() => setCodeCopie(false), 1500);
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formaterDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20 w-full px-6">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70 mb-4">{erreur}</p>
        <div className="flex justify-center gap-2">
          <button onClick={() => navigate('/avoirs')} className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button onClick={chargerAvoir} className="btn btn-primary">Réessayer</button>
        </div>
      </div>
    );
  }

  if (!avoir) return null;

  const statutCfg = STATUTS_CONFIG[avoir.statut] || STATUTS_CONFIG.brouillon;
  const StatutIcon = statutCfg.icon;
  const estModifiable = avoir.statut === 'brouillon';
  const estSupprimable = ['brouillon', 'annule'].includes(avoir.statut);

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/avoirs')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Receipt className="w-3 h-3" />
              Comptabilité / Avoirs /{' '}
              <span className="text-primary font-mono">{avoir.numero}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <FileMinus className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate">Avoir — {avoir.objet}</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {estModifiable && (
              <Link
                to={`/avoirs/${avoir.id}/modifier`}
                className="btn btn-ghost btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            )}
            {estSupprimable && (
              <button
                onClick={() => setShowModalSuppression(true)}
                className="btn btn-ghost btn-sm text-error gap-2"
                disabled={chargementAction}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )}
          </div>

          <span className={`badge ${statutCfg.cls} badge-lg gap-1.5`}>
            <StatutIcon className="w-4 h-4" />
            {statutCfg.label}
          </span>
        </div>
      </div>

      {/* CONTENU */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

        {/* COLONNE PRINCIPALE */}
        <div className="lg:col-span-2 space-y-6">

          {/* Carte montant */}
          <div className="card bg-gradient-to-br from-primary/10 via-primary/5 to-base-100 shadow-sm border border-primary/20">
            <div className="card-body">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <FileMinus className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">
                      Montant de l'avoir
                    </p>
                    <p className="text-3xl font-bold text-primary font-mono mt-1">
                      {formaterMontant(avoir.montant_ttc)}
                    </p>
                  </div>
                </div>
                <span className={`badge ${statutCfg.cls} badge-lg gap-1.5 flex-shrink-0`}>
                  <StatutIcon className="w-4 h-4" />
                  {statutCfg.label}
                </span>
              </div>

              <div className="divider my-2"></div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Montant HT</p>
                  <p className="font-mono font-bold">{formaterMontant(avoir.montant_ht)}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">TVA ({avoir.taux_tva}%)</p>
                  <p className="font-mono font-bold">{formaterMontant(avoir.montant_tva)}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Numéro</p>
                  <button
                    onClick={copierNumero}
                    className="flex items-center gap-1.5 font-mono font-bold text-primary hover:underline"
                  >
                    {avoir.numero}
                    {codeCopie ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Facture */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Client & Facture d'origine</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    <span>{(avoir.client_nom?.[0] || '?').toUpperCase()}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{avoir.client_nom || '—'}</p>
                  <Link
                    to={`/clients/${avoir.client}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Voir le client <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {avoir.facture_numero && (
                <>
                  <div className="divider my-2"></div>
                  <div className="flex items-center justify-between p-3 bg-info/5 border border-info/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-info" />
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Facture liée</p>
                        <p className="font-mono font-bold text-sm">{avoir.facture_numero}</p>
                      </div>
                    </div>
                    <Link
                      to={`/factures/${avoir.facture_origine}`}
                      className="btn btn-ghost btn-sm gap-1"
                    >
                      Voir <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Objet & Motif */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-base-content/60" />
              <h2 className="font-semibold text-sm">Objet & Motif</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-base-content/50 uppercase mb-1">Objet</p>
                <p className="font-medium">{avoir.objet}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase mb-1">Motif</p>
                <p className="text-sm text-base-content/80 whitespace-pre-wrap">{avoir.motif}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {avoir.notes && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Info className="w-4 h-4 text-base-content/60" />
                <h2 className="font-semibold text-sm">Notes internes</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-base-content/80 whitespace-pre-wrap">{avoir.notes}</p>
              </div>
            </div>
          )}

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="lg:col-span-1 space-y-6">

          {/* Statut & dates */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Informations</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Statut</span>
                  <span className={`badge ${statutCfg.cls} badge-sm gap-1`}>
                    <StatutIcon className="w-3 h-3" />
                    {statutCfg.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Date émission</span>
                  <span className="font-medium text-xs">{formaterDate(avoir.date_avoir)}</span>
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Créé le</span>
                  <span className="font-medium text-xs">{formaterDateTime(avoir.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Modifié le</span>
                  <span className="font-medium text-xs">{formaterDateTime(avoir.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h3 className="font-semibold text-sm mb-3">Actions</h3>
              <div className="space-y-2">
                {estModifiable && (
                  <Link
                    to={`/avoirs/${avoir.id}/modifier`}
                    className="btn btn-outline btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </Link>
                )}
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <Link
                  to="/avoirs"
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <FileMinus className="w-4 h-4" /> Tous les avoirs
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'avoir</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'avoir <strong className="font-mono">{avoir.numero}</strong> ?
                <br />
                <span className="text-sm">Cette action est irréversible.</span>
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerAvoir} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvoirDetail;