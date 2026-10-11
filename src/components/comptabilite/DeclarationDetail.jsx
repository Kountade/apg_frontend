// components/comptabilite/DeclarationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Edit, Trash2, Loader2, AlertCircle,
  Calculator, Calendar, DollarSign, FileCheck, CheckCircle,
  XCircle, Clock, Building2, Printer, Send, Upload,
  CheckSquare, AlertTriangle, Info, RefreshCw, MoreVertical,
  Ban, FileSignature, ChevronDown
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// CONFIGURATION COMPLÈTE DES STATUTS
// ============================================================
const STATUTS_CONFIG = {
  a_preparer: {
    label: 'À préparer',
    cls: 'badge-ghost',
    icon: FileText,
    description: 'Déclaration non commencée',
  },
  preparee: {
    label: 'Préparée',
    cls: 'badge-info',
    icon: FileCheck,
    description: 'Prête à être déposée',
  },
  deposee: {
    label: 'Déposée',
    cls: 'badge-warning',
    icon: Send,
    description: 'Déposée à l\'administration',
  },
  payee: {
    label: 'Payée',
    cls: 'badge-success',
    icon: CheckCircle,
    description: 'Entièrement payée',
  },
  annulee: {
    label: 'Annulée',
    cls: 'badge-neutral',
    icon: XCircle,
    description: 'Déclaration annulée',
  },
};

const TYPES_CONFIG = {
  tva: { label: 'TVA', cls: 'badge-primary', icon: FileText },
  is: { label: 'Impôt sur les sociétés', cls: 'badge-warning', icon: DollarSign },
  ir: { label: 'Impôt sur le revenu', cls: 'badge-info', icon: DollarSign },
  cnss: { label: 'CNSS', cls: 'badge-secondary', icon: Building2 },
  autre: { label: 'Autre', cls: 'badge-ghost', icon: FileText },
};

// ============================================================
// ACTIONS DE STATUT DISPONIBLES
// ============================================================
const ACTIONS_STATUT = [
  {
    action: 'preparer',
    label: 'Marquer comme préparée',
    icon: FileCheck,
    color: 'info',
    from: ['a_preparer'],
    confirmation: 'Marquer cette déclaration comme préparée ?',
  },
  {
    action: 'deposer',
    label: 'Marquer comme déposée',
    icon: Send,
    color: 'warning',
    from: ['preparee'],
    confirmation: 'Confirmer le dépôt de cette déclaration ?',
  },
  {
    action: 'marquer_payee',
    label: 'Marquer comme payée',
    icon: CheckCircle,
    color: 'success',
    from: ['deposee'],
    confirmation: 'Confirmer le paiement de cette déclaration ?',
  },
  {
    action: 'remettre_a_preparer',
    label: 'Remettre à préparer',
    icon: RefreshCw,
    color: 'ghost',
    from: ['preparee', 'deposee'],
    confirmation: 'Remettre cette déclaration à l\'état "À préparer" ?',
  },
  {
    action: 'annuler',
    label: 'Annuler la déclaration',
    icon: Ban,
    color: 'error',
    danger: true,
    from: ['a_preparer', 'preparee', 'deposee'],
    confirmation: 'Annuler définitivement cette déclaration ? Cette action est irréversible.',
  },
];

const DeclarationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [declaration, setDeclaration] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Modals
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalStatut, setShowModalStatut] = useState(false);
  const [actionEnAttente, setActionEnAttente] = useState(null);
  const [menuStatutOuvert, setMenuStatutOuvert] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDeclaration();
  }, [id]);

  const chargerDeclaration = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/declarations-fiscales/${id}/`);
      setDeclaration(response.data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Déclaration introuvable');
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // Suppression
  // ============================================================
  const supprimerDeclaration = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/declarations-fiscales/${id}/`);
      navigate('/declarations-fiscales');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================================
  // Changer le statut
  // ============================================================
  const executerChangementStatut = async (actionObj) => {
    setChargementAction(true);
    setShowModalStatut(false);
    try {
      const today = new Date().toISOString().split('T')[0];
      let dataToSend = {};

      switch (actionObj.action) {
        case 'preparer':
          dataToSend = { statut: 'preparee' };
          break;

        case 'deposer':
          dataToSend = {
            statut: 'deposee',
            date_depot: declaration.date_depot || today,
          };
          break;

        case 'marquer_payee':
          dataToSend = {
            statut: 'payee',
            date_paiement: declaration.date_paiement || today,
            date_depot: declaration.date_depot || today,
          };
          break;

        case 'remettre_a_preparer':
          dataToSend = {
            statut: 'a_preparer',
            date_depot: null,
            date_paiement: null,
          };
          break;

        case 'annuler':
          dataToSend = { statut: 'annulee' };
          break;

        default:
          break;
      }

      await AxiosInstance.patch(`/declarations-fiscales/${id}/`, dataToSend);
      await chargerDeclaration();
      setActionEnAttente(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
    }
  };

  // Clic sur une action dans le menu
  const handleClickAction = (actionObj) => {
    setMenuStatutOuvert(false);

    // Actions sans confirmation (directes)
    const actionsDirectes = ['preparer', 'marquer_payee'];
    if (actionsDirectes.includes(actionObj.action)) {
      executerChangementStatut(actionObj);
      return;
    }

    // Actions avec confirmation
    setActionEnAttente(actionObj);
    setShowModalStatut(true);
  };

  // ============================================================
  // Actions disponibles selon le statut
  // ============================================================
  const getActionsDisponibles = () => {
    if (!declaration) return [];
    return ACTIONS_STATUT.filter(a => a.from.includes(declaration.statut));
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '—';

  const formaterDateHeure = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || { label: type, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-lg gap-2`}>
        <Icon className="w-4 h-4" />
        {cfg.label}
      </span>
    );
  };

  const isEnRetard = () => {
    if (!declaration) return false;
    if (declaration.statut === 'payee' || declaration.statut === 'annulee') return false;
    return declaration.date_echeance && new Date(declaration.date_echeance) < new Date();
  };

  const getJoursRestants = () => {
    if (!declaration?.date_echeance) return null;
    const diff = Math.ceil(
      (new Date(declaration.date_echeance) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !declaration) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Déclaration introuvable'}</p>
        <Link to="/declarations-fiscales" className="btn btn-primary mt-4">
          Retour aux déclarations
        </Link>
      </div>
    );
  }

  const actions = getActionsDisponibles();
  const enRetard = isEnRetard();
  const joursRestants = getJoursRestants();
  const statutCfg = STATUTS_CONFIG[declaration.statut] || { label: declaration.statut, cls: 'badge-ghost', icon: FileText };
  const IconStatut = statutCfg.icon;

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/declarations-fiscales')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Comptabilité /
              <Link to="/declarations-fiscales" className="hover:text-primary">Déclarations</Link> /
              <span className="text-primary">{declaration.periode}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              {declaration.periode}
              {getBadgeType(declaration.type)}
            </h1>
            <p className="text-base-content/60 mt-1">
              Déclaration {TYPES_CONFIG[declaration.type]?.label || declaration.type}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">

          {/* BADGE STATUT ACTUEL */}
          <span className={`badge ${statutCfg.cls} badge-lg gap-2`}>
            <IconStatut className="w-4 h-4" />
            {statutCfg.label}
          </span>

          {/* DROPDOWN CHANGER STATUT */}
          {actions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setMenuStatutOuvert(!menuStatutOuvert)}
                className="btn btn-outline btn-sm gap-2"
                disabled={chargementAction}
              >
                <MoreVertical className="w-4 h-4" />
                Changer le statut
                <ChevronDown className="w-3 h-3" />
              </button>

              {menuStatutOuvert && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuStatutOuvert(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-72 bg-base-100 rounded-lg shadow-xl border border-base-300 z-30 py-2">
                    <div className="px-4 py-2 text-xs text-base-content/40 uppercase tracking-wider border-b border-base-200 mb-1">
                      Actions disponibles
                    </div>
                    {actions.map((a) => {
                      const IconAction = a.icon;
                      return (
                        <button
                          key={a.action}
                          onClick={() => handleClickAction(a)}
                          disabled={chargementAction}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left ${
                            a.danger ? 'text-error hover:bg-error/10' : ''
                          }`}
                        >
                          <IconAction className={`w-4 h-4 ${a.danger ? 'text-error' : `text-${a.color}`}`} />
                          <div className="flex-1">
                            <p className="font-medium">{a.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <Link to={`/declarations-fiscales/${id}/modifier`} className="btn btn-primary gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>

          <button
            onClick={() => setShowModalSuppression(true)}
            className="btn btn-error gap-2"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* ALERTES */}
      {enRetard && (
        <div className="alert alert-error mb-6">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-bold">Déclaration en retard</p>
            <p className="text-sm">
              L'échéance du <strong>{formaterDate(declaration.date_echeance)}</strong> est dépassée
              (retard de <strong>{Math.abs(joursRestants)} jours</strong>)
            </p>
          </div>
        </div>
      )}

      {!enRetard && joursRestants !== null && joursRestants <= 7 && joursRestants >= 0 && declaration.statut !== 'payee' && (
        <div className="alert alert-warning mb-6">
          <Clock className="w-5 h-5" />
          <div>
            <p className="font-bold">Échéance proche</p>
            <p className="text-sm">
              Il reste <strong>{joursRestants} jour{joursRestants > 1 ? 's' : ''}</strong> avant l'échéance
              du {formaterDate(declaration.date_echeance)}
            </p>
          </div>
        </div>
      )}

      {/* CONTENU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Informations de la déclaration</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Type</label>
                <p className="font-medium mt-1">{getBadgeType(declaration.type)}</p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Période</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-base-content/40" />
                  {declaration.periode}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-base-content/40 uppercase">Montant</label>
                <p className="font-bold text-2xl mt-1 font-mono text-primary">
                  {formaterMontant(declaration.montant)}
                </p>
              </div>
            </div>
          </div>

          {/* Dates clés */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-info" />
              <h2 className="font-semibold text-sm">Dates clés</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* Échéance */}
                <div className={`p-4 rounded-lg border-2 ${
                  enRetard ? 'border-error bg-error/5' :
                  joursRestants !== null && joursRestants <= 7 ? 'border-warning bg-warning/5' :
                  'border-base-300 bg-base-200/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className={`w-4 h-4 ${
                      enRetard ? 'text-error' :
                      joursRestants !== null && joursRestants <= 7 ? 'text-warning' :
                      'text-base-content/50'
                    }`} />
                    <span className="text-xs text-base-content/60 uppercase font-semibold">
                      Échéance
                    </span>
                  </div>
                  <p className="font-bold text-base">{formaterDate(declaration.date_echeance)}</p>
                  {joursRestants !== null && (
                    <p className={`text-xs mt-1 ${
                      enRetard ? 'text-error' :
                      joursRestants <= 7 ? 'text-warning' :
                      'text-base-content/50'
                    }`}>
                      {enRetard
                        ? `Retard de ${Math.abs(joursRestants)} jours`
                        : joursRestants === 0
                          ? 'Aujourd\'hui'
                          : `Dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`}
                    </p>
                  )}
                </div>

                {/* Dépôt */}
                <div className={`p-4 rounded-lg border-2 ${
                  declaration.date_depot ? 'border-success bg-success/5' : 'border-base-300 bg-base-200/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Send className={`w-4 h-4 ${
                      declaration.date_depot ? 'text-success' : 'text-base-content/50'
                    }`} />
                    <span className="text-xs text-base-content/60 uppercase font-semibold">
                      Date de dépôt
                    </span>
                  </div>
                  <p className="font-bold text-base">
                    {declaration.date_depot ? formaterDate(declaration.date_depot) : 'Non déposée'}
                  </p>
                  {declaration.date_depot && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Déposée
                    </p>
                  )}
                </div>

                {/* Paiement */}
                <div className={`p-4 rounded-lg border-2 ${
                  declaration.date_paiement ? 'border-success bg-success/5' : 'border-base-300 bg-base-200/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={`w-4 h-4 ${
                      declaration.date_paiement ? 'text-success' : 'text-base-content/50'
                    }`} />
                    <span className="text-xs text-base-content/60 uppercase font-semibold">
                      Date de paiement
                    </span>
                  </div>
                  <p className="font-bold text-base">
                    {declaration.date_paiement ? formaterDate(declaration.date_paiement) : 'Non payée'}
                  </p>
                  {declaration.date_paiement && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Payée
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {declaration.notes && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-base-content/60" />
                <h2 className="font-semibold text-sm">Notes</h2>
              </div>
              <div className="p-5">
                <p className="text-sm whitespace-pre-wrap">{declaration.notes}</p>
              </div>
            </div>
          )}

          {/* Document */}
          {declaration.document && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Upload className="w-4 h-4 text-info" />
                <h2 className="font-semibold text-sm">Document joint</h2>
              </div>
              <div className="p-5">
                <a
                  href={declaration.document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Télécharger le document
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">

          {/* Résumé statut */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Statut actuel
              </h3>

              <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-${statutCfg.cls.replace('badge-', '')}/20 flex items-center justify-center`}>
                    <IconStatut className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">{statutCfg.label}</p>
                    <p className="text-xs text-base-content/60">{statutCfg.description}</p>
                  </div>
                </div>

                <div className="divider my-3"></div>

                {/* Progression */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-base-content/60">Progression</span>
                    <span className="font-bold">
                      {declaration.statut === 'a_preparer' ? '25%' :
                       declaration.statut === 'preparee' ? '50%' :
                       declaration.statut === 'deposee' ? '75%' :
                       declaration.statut === 'payee' ? '100%' : '0%'}
                    </span>
                  </div>
                  <progress
                    className="progress progress-primary w-full"
                    value={
                      declaration.statut === 'a_preparer' ? 25 :
                      declaration.statut === 'preparee' ? 50 :
                      declaration.statut === 'deposee' ? 75 :
                      declaration.statut === 'payee' ? 100 : 0
                    }
                    max="100"
                  ></progress>

                  {/* Étapes */}
                  <div className="space-y-2 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        ['a_preparer', 'preparee', 'deposee', 'payee'].includes(declaration.statut)
                          ? 'bg-primary text-primary-content' : 'bg-base-300'
                      }`}>
                        {['a_preparer', 'preparee', 'deposee', 'payee'].includes(declaration.statut) && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </div>
                      <span className={['a_preparer', 'preparee', 'deposee', 'payee'].includes(declaration.statut) ? 'font-medium' : 'text-base-content/40'}>
                        Création
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        ['preparee', 'deposee', 'payee'].includes(declaration.statut)
                          ? 'bg-primary text-primary-content' : 'bg-base-300'
                      }`}>
                        {['preparee', 'deposee', 'payee'].includes(declaration.statut) && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </div>
                      <span className={['preparee', 'deposee', 'payee'].includes(declaration.statut) ? 'font-medium' : 'text-base-content/40'}>
                        Préparation
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        ['deposee', 'payee'].includes(declaration.statut)
                          ? 'bg-primary text-primary-content' : 'bg-base-300'
                      }`}>
                        {['deposee', 'payee'].includes(declaration.statut) && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </div>
                      <span className={['deposee', 'payee'].includes(declaration.statut) ? 'font-medium' : 'text-base-content/40'}>
                        Dépôt
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        declaration.statut === 'payee'
                          ? 'bg-success text-success-content' : 'bg-base-300'
                      }`}>
                        {declaration.statut === 'payee' && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </div>
                      <span className={declaration.statut === 'payee' ? 'font-medium text-success' : 'text-base-content/40'}>
                        Paiement
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <MoreVertical className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <Link
                  to={`/declarations-fiscales/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" /> Modifier
                </Link>
                <button
                  onClick={() => window.print()}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <Link
                  to="/declarations-fiscales"
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <FileText className="w-4 h-4" /> Voir toutes les déclarations
                </Link>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-base-content/50" />
                Informations système
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-base-content/50">Créée le :</span>
                  <p className="font-medium">{formaterDateHeure(declaration.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifiée le :</span>
                  <p className="font-medium">{formaterDateHeure(declaration.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aide statuts */}
          <div className="card bg-info/5 border border-info/20 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-info mb-2">Cycle de vie</p>
                  <ul className="text-base-content/70 space-y-1">
                    <li>• <strong>À préparer</strong> → Non commencée</li>
                    <li>• <strong>Préparée</strong> → Prête à déposer</li>
                    <li>• <strong>Déposée</strong> → Envoyée à l'administration</li>
                    <li>• <strong>Payée</strong> → Paiement effectué</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL CONFIRMATION STATUT */}
      {showModalStatut && actionEnAttente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalStatut(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full ${
                actionEnAttente.danger ? 'bg-error/20' : 'bg-primary/20'
              } flex items-center justify-center mx-auto mb-4`}>
                <actionEnAttente.icon className={`w-8 h-8 ${
                  actionEnAttente.danger ? 'text-error' : `text-${actionEnAttente.color}`
                }`} />
              </div>

              <h3 className="text-xl font-bold mb-2">
                {actionEnAttente.label}
              </h3>

              <p className="text-base-content/60 mb-4">
                {actionEnAttente.confirmation}
              </p>

              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalStatut(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className={`btn flex-1 ${
                    actionEnAttente.danger ? 'btn-error' : 'btn-primary'
                  }`}
                  onClick={() => executerChangementStatut(actionEnAttente)}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
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
              <h3 className="text-xl font-bold mb-2">Supprimer la déclaration</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la déclaration <strong>{TYPES_CONFIG[declaration.type]?.label}</strong> —
                <strong> {declaration.periode}</strong> ?
                <br />
                <span className="text-error text-sm">Cette action est irréversible !</span>
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
                  onClick={supprimerDeclaration}
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

export default DeclarationDetail;