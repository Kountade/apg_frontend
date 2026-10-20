// components/comptabilite/LitigeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Gavel, Edit, Trash2, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, User, Calendar, FileText,
  Info, Printer, ShieldCheck, AlertTriangle, DollarSign,
  Receipt, ArrowUpRight, ExternalLink, Scale, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  ouvert:   { label: 'Ouvert',   cls: 'badge-warning', icon: AlertTriangle, description: 'Litige déclaré' },
  en_cours: { label: 'En cours', cls: 'badge-info',    icon: Clock,         description: 'En cours de traitement' },
  resolu:   { label: 'Résolu',   cls: 'badge-success', icon: CheckCircle,   description: 'Litige résolu' },
  clos:     { label: 'Clos',     cls: 'badge-ghost',   icon: XCircle,       description: 'Dossier fermé' },
};

const LitigeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [litige, setLitige] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalResolution, setShowModalResolution] = useState(false);
  const [resolution, setResolution] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerLitige();
  }, [id]);

  const chargerLitige = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/litiges/${id}/`);
      setLitige(res.data);
    } catch (err) {
      setErreur(
        err.response?.status === 404
          ? "Ce litige n'existe pas."
          : 'Impossible de charger le litige.'
      );
    } finally {
      setChargement(false);
    }
  };

  const supprimerLitige = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/litiges/${id}/`);
      navigate('/litiges');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setChargementAction(false);
    }
  };

  const resoudreLitige = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/litiges/${id}/resoudre/`, { resolution });
      await chargerLitige();
      setShowModalResolution(false);
      setResolution('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la résolution');
    } finally {
      setChargementAction(false);
    }
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
        <button onClick={() => navigate('/litiges')} className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      </div>
    );
  }

  if (!litige) return null;

  const statutCfg = STATUTS_CONFIG[litige.statut] || STATUTS_CONFIG.ouvert;
  const StatutIcon = statutCfg.icon;
  const estResolvable = ['ouvert', 'en_cours'].includes(litige.statut);
  const estModifiable = ['ouvert', 'en_cours'].includes(litige.statut);

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/litiges')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Scale className="w-3 h-3" />
              Comptabilité / Litiges /{' '}
              <span className="text-primary font-mono">{litige.numero}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Gavel className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate">{litige.motif}</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {estModifiable && (
              <Link
                to={`/litiges/${litige.id}/modifier`}
                className="btn btn-ghost btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            )}
            {estResolvable && (
              <button
                onClick={() => {
                  setResolution('');
                  setShowModalResolution(true);
                }}
                className="btn btn-success btn-sm gap-2"
                disabled={chargementAction}
              >
                <ShieldCheck className="w-4 h-4" /> Résoudre
              </button>
            )}
            <button
              onClick={() => setShowModalSuppression(true)}
              className="btn btn-ghost btn-sm text-error gap-2"
              disabled={chargementAction}
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
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

          {/* Carte montant contesté */}
          <div className="card bg-gradient-to-br from-warning/10 via-warning/5 to-base-100 shadow-sm border border-warning/20">
            <div className="card-body">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                    <Gavel className="w-7 h-7 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">
                      Montant contesté
                    </p>
                    <p className="text-3xl font-bold text-warning font-mono mt-1">
                      {formaterMontant(litige.montant_conteste)}
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
                  <p className="text-xs text-base-content/50 uppercase mb-1">Numéro</p>
                  <p className="font-mono font-bold text-primary">{litige.numero}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Ouvert le</p>
                  <p className="font-mono font-bold text-xs">{formaterDate(litige.date_ouverture)}</p>
                </div>
                {litige.date_resolution && (
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Résolu le</p>
                    <p className="font-mono font-bold text-xs text-success">
                      {formaterDate(litige.date_resolution)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client & Facture */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Client & Facture concernée</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    <span>{(litige.client_nom?.[0] || '?').toUpperCase()}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{litige.client_nom || '—'}</p>
                  <Link
                    to={`/clients/${litige.client}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Voir le client <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {litige.facture_numero && (
                <>
                  <div className="divider my-2"></div>
                  <div className="flex items-center justify-between p-3 bg-info/5 border border-info/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-info" />
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Facture concernée</p>
                        <p className="font-mono font-bold text-sm">{litige.facture_numero}</p>
                      </div>
                    </div>
                    <Link
                      to={`/factures/${litige.facture}`}
                      className="btn btn-ghost btn-sm gap-1"
                    >
                      Voir <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Motif & Description */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h2 className="font-semibold text-sm">Motif & Description</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-base-content/50 uppercase mb-1">Motif</p>
                <p className="font-medium">{litige.motif}</p>
              </div>
              {litige.description && (
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Description</p>
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap">{litige.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Résolution */}
          {(litige.resolution || litige.statut === 'resolu') && (
            <div className="card bg-success/5 border border-success/20 shadow-sm">
              <div className="px-5 py-3 border-b border-success/20 bg-success/10 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success" />
                <h2 className="font-semibold text-sm text-success">Résolution</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-base-content/80 whitespace-pre-wrap">
                  {litige.resolution || 'Résolution en cours de rédaction...'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="lg:col-span-1 space-y-6">

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
                  <span className="text-base-content/60">Ouvert le</span>
                  <span className="font-medium text-xs">{formaterDate(litige.date_ouverture)}</span>
                </div>
                {litige.date_resolution && (
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/60">Résolu le</span>
                    <span className="font-medium text-xs text-success">
                      {formaterDate(litige.date_resolution)}
                    </span>
                  </div>
                )}
                <div className="divider my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Créé le</span>
                  <span className="font-medium text-xs">{formaterDateTime(litige.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Modifié le</span>
                  <span className="font-medium text-xs">{formaterDateTime(litige.updated_at)}</span>
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
                    to={`/litiges/${litige.id}/modifier`}
                    className="btn btn-outline btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </Link>
                )}
                {estResolvable && (
                  <button
                    onClick={() => {
                      setResolution('');
                      setShowModalResolution(true);
                    }}
                    className="btn btn-success btn-sm w-full gap-2 justify-start"
                  >
                    <ShieldCheck className="w-4 h-4" /> Marquer résolu
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <Link
                  to="/litiges"
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Gavel className="w-4 h-4" /> Tous les litiges
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL RÉSOLUTION */}
      {showModalResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalResolution(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Résoudre le litige</h3>
              <p className="text-base-content/60">
                Litige <strong className="font-mono">{litige.numero}</strong>
              </p>
            </div>

            <div className="form-control mb-4">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">Résolution</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows="4"
                placeholder="Décrivez la résolution du litige..."
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button className="btn flex-1" onClick={() => setShowModalResolution(false)} disabled={chargementAction}>
                Annuler
              </button>
              <button className="btn btn-success flex-1" onClick={resoudreLitige} disabled={chargementAction}>
                {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Résoudre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le litige</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le litige <strong className="font-mono">{litige.numero}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerLitige} disabled={chargementAction}>
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

export default LitigeDetail;