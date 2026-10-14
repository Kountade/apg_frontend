// components/paie/AvanceSalaireDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Loader2, AlertCircle, CheckCircle,
  HandCoins, User, Hash, Calendar, FileText, Calculator,
  Clock, CheckSquare, XCircle, DollarSign, BadgeCheck,
  Printer, Download, TrendingUp, Info, Wallet, Percent,
  Building2, Briefcase, Phone, Mail, CreditCard, ArrowRight
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des statuts
// ============================================================
const STATUTS_CONFIG = {
  demandee:   { label: 'Demandée',   cls: 'badge-warning', icon: Clock,        description: 'En attente de validation',  step: 1 },
  validee:    { label: 'Validée',    cls: 'badge-info',    icon: CheckSquare,  description: 'Validée, à payer',          step: 2 },
  refusee:    { label: 'Refusée',    cls: 'badge-error',   icon: XCircle,      description: 'Refusée',                   step: 0 },
  payee:      { label: 'Payée',      cls: 'badge-primary', icon: CheckCircle,  description: 'Payée',                     step: 3 },
  remboursee: { label: 'Remboursée', cls: 'badge-success', icon: BadgeCheck,   description: 'Remboursée',                step: 4 },
};

// ============================================================
// Actions de workflow
// ============================================================
const ACTIONS_WORKFLOW = [
  {
    action: 'valider',
    label: 'Valider',
    icon: CheckSquare,
    cls: 'btn-info',
    from: ['demandee'],
    confirmation: 'Valider cette demande d\'avance ?',
  },
  {
    action: 'refuser',
    label: 'Refuser',
    icon: XCircle,
    cls: 'btn-error',
    from: ['demandee'],
    confirmation: 'Refuser cette demande d\'avance ?',
  },
  {
    action: 'marquer_payee',
    label: 'Marquer payée',
    icon: DollarSign,
    cls: 'btn-success',
    from: ['validee'],
    confirmation: 'Marquer cette avance comme payée ?',
  },
];

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const AvanceSalaireDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [avance, setAvance] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [messageSucces, setMessageSucces] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);

  // ------------------------------------------------------------
  // Chargement
  // ------------------------------------------------------------
  useEffect(() => {
    chargerAvance();
  }, [id]);

  const chargerAvance = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/avances-salaire/${id}/`);
      setAvance(res.data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(
        err.response?.status === 404
          ? "Cette avance n'existe pas ou a été supprimée."
          : "Impossible de charger l'avance."
      );
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Actions de workflow
  // ------------------------------------------------------------
  const executerAction = async (action) => {
    const cfg = ACTIONS_WORKFLOW.find(a => a.action === action);
    if (!confirm(cfg?.confirmation || 'Confirmer ?')) return;

    setChargementAction(true);
    try {
      await AxiosInstance.post(`/avances-salaire/${id}/${action}/`);
      setMessageSucces(`Avance ${cfg.label.toLowerCase()} avec succès.`);
      await chargerAvance();
      setTimeout(() => setMessageSucces(null), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
    }
  };

  const supprimerAvance = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/avances-salaire/${id}/`);
      navigate('/avances-salaire');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setChargementAction(false);
    }
  };

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formaterDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ------------------------------------------------------------
  // Rendu : chargement
  // ------------------------------------------------------------
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // ------------------------------------------------------------
  // Rendu : erreur
  // ------------------------------------------------------------
  if (erreur) {
    return (
      <div className="text-center py-20 w-full px-6">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70 mb-4">{erreur}</p>
        <div className="flex justify-center gap-2">
          <button onClick={() => navigate('/avances-salaire')} className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
          <button onClick={chargerAvance} className="btn btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!avance) return null;

  const statutCfg = STATUTS_CONFIG[avance.statut] || STATUTS_CONFIG.demandee;
  const StatutIcon = statutCfg.icon;
  const actionsDisponibles = ACTIONS_WORKFLOW.filter(a =>
    a.from.includes(avance.statut)
  );
  const estModifiable = ['demandee', 'validee'].includes(avance.statut);
  const estSupprimable = ['demandee', 'refusee'].includes(avance.statut);

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/avances-salaire')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Paie / Avances /{' '}
              <span className="text-primary font-mono">{avance.numero}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <HandCoins className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate">Avance sur salaire</span>
            </h1>
          </div>

          {/* Actions rapides */}
          <div className="hidden md:flex items-center gap-2">
            {estModifiable && (
              <Link
                to={`/avances-salaire/${avance.id}/modifier`}
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

      {/* ============ MESSAGES ============ */}
      {messageSucces && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>{messageSucces}</span>
        </div>
      )}

      {/* ============ CONTENU ============ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

        {/* ---------- COLONNE PRINCIPALE ---------- */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- Carte principale : montant --- */}
          <div className="card bg-gradient-to-br from-primary/10 via-primary/5 to-base-100 shadow-sm border border-primary/20">
            <div className="card-body">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">
                      Montant de l'avance
                    </p>
                    <p className="text-3xl font-bold text-primary font-mono mt-1">
                      {formaterMontant(avance.montant)}
                    </p>
                  </div>
                </div>
                <span className={`badge ${statutCfg.cls} badge-lg gap-1.5 flex-shrink-0`}>
                  <StatutIcon className="w-4 h-4" />
                  {statutCfg.label}
                </span>
              </div>

              <div className="divider my-2"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-base-content/40" />
                  <span className="text-base-content/60">Déduction prévue :</span>
                  <span className="font-medium ml-auto">
                    {MOIS_NOMS[(avance.mois_deduction || 1) - 1]} {avance.annee_deduction}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  <span className="text-base-content/60">Numéro :</span>
                  <span className="font-mono font-bold text-primary ml-auto">
                    {avance.numero}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* --- Employé --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Employé concerné</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-primary/20 text-primary rounded-full w-14 h-14 flex items-center justify-center text-xl font-bold">
                      <span>
                        {(avance.employe_nom?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lg truncate">{avance.employe_nom || '—'}</p>
                    <Link
                      to={`/employes/${avance.employe}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      Voir la fiche employé
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Motif --- */}
          {avance.motif && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Motif de la demande</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap">
                    {avance.motif}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- Workflow / Historique --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Suivi du traitement</h2>
              </div>
              <div className="p-5">
                <ul className="timeline timeline-vertical timeline-compact">

                  {/* Demande */}
                  <li>
                    <div className="timeline-middle">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">Demande créée</p>
                      <p className="text-xs text-base-content/60">
                        {formaterDate(avance.date_demande)}
                      </p>
                    </div>
                    <hr className="bg-success" />
                  </li>

                  {/* Validation */}
                  <li>
                    <hr className={avance.date_validation ? 'bg-success' : 'bg-base-300'} />
                    <div className="timeline-middle">
                      {avance.date_validation ? (
                        avance.statut === 'refusee'
                          ? <XCircle className="w-5 h-5 text-error" />
                          : <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-base-content/30" />
                      )}
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">
                        {avance.statut === 'refusee' ? 'Refusée' : 'Validée'}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {avance.date_validation
                          ? formaterDateTime(avance.date_validation)
                          : 'En attente'}
                      </p>
                      {avance.validee_par_nom && (
                        <p className="text-xs text-base-content/60 mt-0.5">
                          par <strong>{avance.validee_par_nom}</strong>
                        </p>
                      )}
                    </div>
                    <hr className={avance.date_paiement ? 'bg-success' : 'bg-base-300'} />
                  </li>

                  {/* Paiement */}
                  <li>
                    <hr className={avance.date_paiement ? 'bg-success' : 'bg-base-300'} />
                    <div className="timeline-middle">
                      {avance.date_paiement ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-base-content/30" />
                      )}
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">Paiement</p>
                      <p className="text-xs text-base-content/60">
                        {avance.date_paiement
                          ? formaterDate(avance.date_paiement)
                          : 'En attente'}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* ---------- COLONNE LATÉRALE ---------- */}
        <div className="lg:col-span-1 space-y-6">

          {/* --- Actions de workflow --- */}
          {actionsDisponibles.length > 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Actions disponibles</h3>
                </div>
                <div className="space-y-2">
                  {actionsDisponibles.map(act => {
                    const IconAction = act.icon;
                    return (
                      <button
                        key={act.action}
                        onClick={() => executerAction(act.action)}
                        disabled={chargementAction}
                        className={`btn ${act.cls} w-full gap-2 justify-start`}
                      >
                        {chargementAction ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <IconAction className="w-4 h-4" />
                        )}
                        {act.label}
                      </button>
                    );
                  })}
                </div>

                {estModifiable && (
                  <>
                    <div className="divider my-2"></div>
                    <Link
                      to={`/avances-salaire/${avance.id}/modifier`}
                      className="btn btn-outline btn-sm w-full gap-2"
                    >
                      <Edit className="w-4 h-4" /> Modifier l'avance
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* --- Informations --- */}
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
                  <span className="text-base-content/60">Payée</span>
                  <span className={`badge badge-sm ${avance.payee ? 'badge-success' : 'badge-ghost'}`}>
                    {avance.payee ? 'Oui' : 'Non'}
                  </span>
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Date demande</span>
                  <span className="font-medium text-xs">
                    {formaterDate(avance.date_demande)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Déduction</span>
                  <span className="font-medium text-xs">
                    {MOIS_NOMS[(avance.mois_deduction || 1) - 1]} {avance.annee_deduction}
                  </span>
                </div>
                {avance.date_paiement && (
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/60">Date paiement</span>
                    <span className="font-medium text-xs">
                      {formaterDate(avance.date_paiement)}
                    </span>
                  </div>
                )}
                <div className="divider my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Créée le</span>
                  <span className="font-medium text-xs">
                    {formaterDateTime(avance.created_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Modifiée le</span>
                  <span className="font-medium text-xs">
                    {formaterDateTime(avance.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* --- Rappel règles --- */}
          <div className="card bg-info/5 border border-info/20 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-info mb-1">À savoir</p>
                  <ul className="text-base-content/70 space-y-1">
                    <li>• Une avance <strong>payée</strong> n'est plus modifiable.</li>
                    <li>• La déduction se fait automatiquement sur le bulletin du mois choisi.</li>
                    <li>• Seules les avances <strong>demandées</strong> ou <strong>refusées</strong> peuvent être supprimées.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============ MODAL SUPPRESSION ============ */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalSuppression(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'avance</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'avance{' '}
                <strong className="font-mono">{avance.numero}</strong> ?<br />
                <span className="text-sm">Cette action est irréversible.</span>
              </p>
              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalSuppression(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-error flex-1"
                  onClick={supprimerAvance}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvanceSalaireDetail;