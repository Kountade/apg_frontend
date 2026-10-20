// components/paie/PeriodePaieDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle, Calendar,
  Edit, Trash2, Calculator, ShieldCheck, CheckSquare, Send,
  Lock, XCircle, Eye, Info, Users, Wallet, TrendingUp,
  TrendingDown, FileText, Clock, PlayCircle, ChevronRight,
  Hash, CalendarDays, Printer, Download, RefreshCw, ArrowRight,
  Layers, Percent, Briefcase, Award
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Config statuts
// ============================================================
const STATUTS_CONFIG = {
  ouverte:             { label: 'Ouverte',             cls: 'badge-ghost',    icon: Clock,        color: 'ghost',    step: 1 },
  en_preparation:      { label: 'En préparation',      cls: 'badge-warning',  icon: FileText,     color: 'warning',  step: 2 },
  calculee:            { label: 'Calculée',            cls: 'badge-info',     icon: Calculator,   color: 'info',     step: 3 },
  controlee:           { label: 'Contrôlée',           cls: 'badge-accent',   icon: ShieldCheck,  color: 'accent',   step: 4 },
  validee:             { label: 'Validée',             cls: 'badge-primary',  icon: CheckSquare,  color: 'primary',  step: 5 },
  en_attente_paiement: { label: 'En attente paiement', cls: 'badge-secondary',icon: Send,         color: 'secondary',step: 6 },
  payee:               { label: 'Payée',               cls: 'badge-success',  icon: CheckCircle,  color: 'success',  step: 7 },
  cloturee:            { label: 'Clôturée',            cls: 'badge-neutral',  icon: Lock,         color: 'neutral',  step: 8 },
  annulee:             { label: 'Annulée',             cls: 'badge-error',    icon: XCircle,      color: 'error',    step: 0 },
};

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// ============================================================
// Actions workflow
// ============================================================
const ACTIONS_WORKFLOW = [
  {
    action: 'calculer',
    label: 'Calculer les bulletins',
    icon: Calculator,
    cls: 'btn-info',
    from: ['ouverte', 'en_preparation'],
    confirmation: 'Calculer tous les bulletins de cette période ?',
    description: 'Génère les bulletins de paie pour tous les employés actifs',
  },
  {
    action: 'controler',
    label: 'Contrôler',
    icon: ShieldCheck,
    cls: 'btn-accent',
    from: ['calculee'],
    confirmation: 'Marquer cette période comme contrôlée ?',
    description: 'Vérifiez les bulletins avant de valider définitivement',
  },
  {
    action: 'valider',
    label: 'Valider',
    icon: CheckSquare,
    cls: 'btn-primary',
    from: ['controlee'],
    confirmation: 'Valider définitivement cette période de paie ?',
    description: 'La période sera validée et prête pour le paiement',
  },
  {
    action: 'marquer_payee',
    label: 'Marquer payée',
    icon: Send,
    cls: 'btn-success',
    from: ['validee', 'en_attente_paiement'],
    confirmation: 'Marquer tous les bulletins comme payés ?',
    description: 'Enregistre le paiement de tous les salaires',
  },
  {
    action: 'cloturer',
    label: 'Clôturer',
    icon: Lock,
    cls: 'btn-neutral',
    from: ['payee'],
    confirmation: 'Clôturer définitivement cette période ? (archivage)',
    description: 'Archive la période. Aucune modification ne sera plus possible',
  },
];

const PeriodePaieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [periode, setPeriode] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [messageSucces, setMessageSucces] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(null);

  // ------------------------------------------------------------
  // Chargement
  // ------------------------------------------------------------
  useEffect(() => {
    chargerPeriode();
  }, [id]);

  const chargerPeriode = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/periodes-paie/${id}/`);
      setPeriode(res.data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(
        err.response?.status === 404
          ? "Cette période de paie n'existe pas ou a été supprimée."
          : 'Impossible de charger la période.'
      );
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Actions workflow
  // ------------------------------------------------------------
  const executerAction = async (action) => {
    const cfg = ACTIONS_WORKFLOW.find(a => a.action === action);
    if (!confirm(cfg?.confirmation || 'Confirmer ?')) return;

    setActionEnCours(action);
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/periodes-paie/${id}/${action}/`);
      setMessageSucces(`Période ${cfg.label.toLowerCase()} avec succès.`);
      await chargerPeriode();
      setTimeout(() => setMessageSucces(null), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
      setActionEnCours(null);
    }
  };

  const supprimerPeriode = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/periodes-paie/${id}/`);
      navigate('/periodes-paie');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setChargementAction(false);
    }
  };

  // ------------------------------------------------------------
  // Formatage
  // ------------------------------------------------------------
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterMontantCourt = (m) => {
    const num = Number(m || 0);
    if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
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
  // Rendu : chargement / erreur
  // ------------------------------------------------------------
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
          <button onClick={() => navigate('/periodes-paie')} className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button onClick={chargerPeriode} className="btn btn-primary">Réessayer</button>
        </div>
      </div>
    );
  }

  if (!periode) return null;

  const statutCfg = STATUTS_CONFIG[periode.statut] || STATUTS_CONFIG.ouverte;
  const StatutIcon = statutCfg.icon;
  const actionsDisponibles = ACTIONS_WORKFLOW.filter(a =>
    a.from.includes(periode.statut)
  );
  const estModifiable = ['ouverte', 'en_preparation'].includes(periode.statut);
  const estSupprimable = ['ouverte', 'en_preparation', 'annulee'].includes(periode.statut);

  const totalBrut = Number(periode.total_brut || 0);
  const totalNet = Number(periode.total_net || 0);
  const totalRetenues = Number(periode.total_retenues || 0);
  const totalCnss = Number(periode.total_cnss || 0);

  // Étapes du workflow (visuel)
  const etapes = [
    { key: 'ouverte', label: 'Ouverte' },
    { key: 'calculee', label: 'Calculée' },
    { key: 'controlee', label: 'Contrôlée' },
    { key: 'validee', label: 'Validée' },
    { key: 'payee', label: 'Payée' },
    { key: 'cloturee', label: 'Clôturée' },
  ];
  const etapeActuelle = STATUTS_CONFIG[periode.statut]?.step || 0;

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/periodes-paie')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Paie / Périodes /{' '}
              <span className="text-primary font-mono">#{periode.id}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate">
                {MOIS_NOMS[(periode.mois || 1) - 1]} {periode.annee}
              </span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {estModifiable && (
              <Link
                to={`/periodes-paie/${periode.id}/modifier`}
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

      {/* ============ WORKFLOW STEPPER ============ */}
      <div className="w-full px-6 pt-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Workflow de traitement</h3>
            </div>
            <ul className="steps steps-horizontal w-full">
              {etapes.map((e, idx) => {
                const step = idx + 1;
                const isActive = step === etapeActuelle;
                const isDone = step < etapeActuelle;
                return (
                  <li
                    key={e.key}
                    className={`step ${isActive ? 'step-primary' : ''} ${isDone ? 'step-success' : ''}`}
                    data-content={isDone ? '✓' : step}
                  >
                    {e.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* ============ CONTENU ============ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

        {/* ---------- COLONNE PRINCIPALE ---------- */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- Carte principale --- */}
          <div className="card bg-gradient-to-br from-primary/10 via-primary/5 to-base-100 shadow-sm border border-primary/20">
            <div className="card-body">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">
                      Période de paie
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {MOIS_NOMS[(periode.mois || 1) - 1]} {periode.annee}
                    </p>
                    {periode.libelle && (
                      <p className="text-sm text-base-content/60 mt-0.5">
                        {periode.libelle}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`badge ${statutCfg.cls} badge-lg gap-1.5 flex-shrink-0`}>
                  <StatutIcon className="w-4 h-4" />
                  {statutCfg.label}
                </span>
              </div>

              <div className="divider my-2"></div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Employés</p>
                  <p className="font-bold flex items-center gap-1">
                    <Users className="w-4 h-4 text-base-content/40" />
                    {periode.nombre_employes || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Total brut</p>
                  <p className="font-bold font-mono">{formaterMontantCourt(totalBrut)}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Total net</p>
                  <p className="font-bold font-mono text-success">{formaterMontantCourt(totalNet)}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Période</p>
                  <p className="font-mono text-xs">
                    {formaterDate(periode.date_debut)}<br />
                    → {formaterDate(periode.date_fin)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- Détail financier --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Détail financier</h2>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/70">Salaire brut total</span>
                    <span className="font-mono font-bold">{formaterMontant(totalBrut)}</span>
                  </div>

                  <div className="divider my-1"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/70 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-error" />
                      CNSS salarial
                    </span>
                    <span className="font-mono font-bold text-error">
                      -{formaterMontant(totalCnss)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/70 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-error" />
                      Autres retenues
                    </span>
                    <span className="font-mono font-bold text-error">
                      -{formaterMontant(totalRetenues - totalCnss)}
                    </span>
                  </div>

                  <div className="divider my-1"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Total retenues</span>
                    <span className="font-mono font-bold text-error">
                      -{formaterMontant(totalRetenues)}
                    </span>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="flex justify-between items-center bg-success/10 -mx-2 px-2 py-2 rounded">
                    <span className="font-bold">NET À PAYER</span>
                    <span className="font-mono font-bold text-success text-lg">
                      {formaterMontant(totalNet)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Informations --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Info className="w-4 h-4 text-base-content/60" />
                <h2 className="font-semibold text-sm">Informations</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Date de début</p>
                    <p className="font-medium">{formaterDate(periode.date_debut)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Date de fin</p>
                    <p className="font-medium">{formaterDate(periode.date_fin)}</p>
                  </div>
                  {periode.date_paiement_prevue && (
                    <div>
                      <p className="text-xs text-base-content/50 uppercase mb-1">Paiement prévu</p>
                      <p className="font-medium">{formaterDate(periode.date_paiement_prevue)}</p>
                    </div>
                  )}
                  {periode.date_paiement && (
                    <div>
                      <p className="text-xs text-base-content/50 uppercase mb-1">Payée le</p>
                      <p className="font-medium text-success">
                        {formaterDateTime(periode.date_paiement)}
                      </p>
                    </div>
                  )}
                </div>

                {periode.notes && (
                  <>
                    <div className="divider my-3"></div>
                    <div>
                      <p className="text-xs text-base-content/50 uppercase mb-1">Notes</p>
                      <p className="text-sm text-base-content/80 whitespace-pre-wrap">
                        {periode.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* --- Suivi workflow --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Historique du traitement</h2>
              </div>
              <div className="p-5">
                <ul className="timeline timeline-vertical timeline-compact">

                  {/* Création */}
                  <li>
                    <div className="timeline-middle">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">Création</p>
                      <p className="text-xs text-base-content/60">
                        {formaterDateTime(periode.created_at)}
                      </p>
                    </div>
                    <hr className="bg-success" />
                  </li>

                  {/* Calcul */}
                  <li>
                    <hr className={periode.statut !== 'ouverte' && periode.statut !== 'en_preparation' ? 'bg-success' : 'bg-base-300'} />
                    <div className="timeline-middle">
                      {['calculee', 'controlee', 'validee', 'en_attente_paiement', 'payee', 'cloturee'].includes(periode.statut) ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-base-content/30" />
                      )}
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">Calcul</p>
                      <p className="text-xs text-base-content/60">
                        {periode.preparee_par_nom ? `par ${periode.preparee_par_nom}` : 'En attente'}
                      </p>
                    </div>
                    <hr className={['controlee', 'validee', 'en_attente_paiement', 'payee', 'cloturee'].includes(periode.statut) ? 'bg-success' : 'bg-base-300'} />
                  </li>

                  {/* Contrôle */}
                  <li>
                    <div className="timeline-middle">
                      {['controlee', 'validee', 'en_attente_paiement', 'payee', 'cloturee'].includes(periode.statut) ? (
                        <ShieldCheck className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-base-content/30" />
                      )}
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">Contrôle</p>
                      <p className="text-xs text-base-content/60">
                        {periode.date_controle ? formaterDateTime(periode.date_controle) : 'En attente'}
                      </p>
                      {periode.controlee_par_nom && (
                        <p className="text-xs text-base-content/60">par {periode.controlee_par_nom}</p>
                      )}
                    </div>
                    <hr className={['validee', 'en_attente_paiement', 'payee', 'cloturee'].includes(periode.statut) ? 'bg-success' : 'bg-base-300'} />
                  </li>

                  {/* Validation */}
                  <li>
                    <div className="timeline-middle">
                      {['validee', 'en_attente_paiement', 'payee', 'cloturee'].includes(periode.statut) ? (
                        <CheckSquare className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-base-content/30" />
                      )}
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">Validation</p>
                      <p className="text-xs text-base-content/60">
                        {periode.date_validation ? formaterDateTime(periode.date_validation) : 'En attente'}
                      </p>
                      {periode.validee_par_nom && (
                        <p className="text-xs text-base-content/60">par {periode.validee_par_nom}</p>
                      )}
                    </div>
                    <hr className={['payee', 'cloturee'].includes(periode.statut) ? 'bg-success' : 'bg-base-300'} />
                  </li>

                  {/* Paiement */}
                  <li>
                    <div className="timeline-middle">
                      {['payee', 'cloturee'].includes(periode.statut) ? (
                        <Send className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-base-content/30" />
                      )}
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">Paiement</p>
                      <p className="text-xs text-base-content/60">
                        {periode.date_paiement ? formaterDateTime(periode.date_paiement) : 'En attente'}
                      </p>
                      {periode.payee_par_nom && (
                        <p className="text-xs text-base-content/60">par {periode.payee_par_nom}</p>
                      )}
                    </div>
                    <hr className={periode.statut === 'cloturee' ? 'bg-success' : 'bg-base-300'} />
                  </li>

                  {/* Clôture */}
                  <li>
                    <div className="timeline-middle">
                      {periode.statut === 'cloturee' ? (
                        <Lock className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-base-content/30" />
                      )}
                    </div>
                    <div className="timeline-end timeline-box bg-base-100 border-base-300">
                      <p className="font-semibold text-sm">Clôture</p>
                      <p className="text-xs text-base-content/60">
                        {periode.statut === 'cloturee' ? 'Terminée' : 'En attente'}
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

          {/* Actions workflow */}
          {actionsDisponibles.length > 0 && (
            <div className="card bg-base-100 shadow-sm border-2 border-primary/30">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Actions disponibles</h3>
                </div>
                <div className="space-y-2">
                  {actionsDisponibles.map(act => {
                    const IconAction = act.icon;
                    const isLoading = actionEnCours === act.action;
                    return (
                      <div key={act.action}>
                        <button
                          onClick={() => executerAction(act.action)}
                          disabled={chargementAction}
                          className={`btn ${act.cls} w-full gap-2 justify-start`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <IconAction className="w-4 h-4" />
                          )}
                          {act.label}
                        </button>
                        <p className="text-[10px] text-base-content/40 mt-1 pl-2">
                          {act.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {estModifiable && (
                  <>
                    <div className="divider my-2"></div>
                    <Link
                      to={`/periodes-paie/${periode.id}/modifier`}
                      className="btn btn-outline btn-sm w-full gap-2"
                    >
                      <Edit className="w-4 h-4" /> Modifier la période
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Résumé */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Résumé</h3>
              </div>
              <div className="stats stats-vertical shadow-sm w-full">
                <div className="stat py-3 px-0">
                  <div className="stat-title text-xs">Employés</div>
                  <div className="stat-value text-lg">{periode.nombre_employes || 0}</div>
                </div>
                <div className="stat py-3 px-0">
                  <div className="stat-title text-xs">Masse brute</div>
                  <div className="stat-value text-base font-mono">
                    {formaterMontantCourt(totalBrut)}
                  </div>
                </div>
                <div className="stat py-3 px-0">
                  <div className="stat-title text-xs">Masse nette</div>
                  <div className="stat-value text-base font-mono text-success">
                    {formaterMontantCourt(totalNet)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info workflow */}
          <div className="card bg-info/5 border border-info/20 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-info mb-1">Workflow</p>
                  <p className="text-base-content/70">
                    Le workflow est <strong>séquentiel</strong> : chaque étape doit être
                    complétée avant de passer à la suivante.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h3 className="font-semibold text-sm mb-3">Actions rapides</h3>
              <div className="space-y-2">
                <Link
                  to={`/fiches-paie?periode=${periode.id}`}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <FileText className="w-4 h-4" />
                  Voir les fiches
                </Link>
                <Link
                  to="/periodes-paie"
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Calendar className="w-4 h-4" />
                  Toutes les périodes
                </Link>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
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
              <h3 className="text-xl font-bold mb-2">Supprimer la période</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la période{' '}
                <strong>{MOIS_NOMS[(periode.mois || 1) - 1]} {periode.annee}</strong> ?
                <br />
                <span className="text-sm">Tous les bulletins associés seront également supprimés.</span>
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
                  onClick={supprimerPeriode}
                  disabled={chargementAction}
                >
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

export default PeriodePaieDetail;