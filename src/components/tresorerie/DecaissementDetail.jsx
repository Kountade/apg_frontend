// components/tresorerie/DecaissementDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, Edit, Trash2, Loader2, AlertCircle,
  Calculator, Calendar, DollarSign, User, Hash, FileText,
  CheckCircle, XCircle, Clock, Wallet, Landmark, Banknote,
  CreditCard, Info, Printer, MoreVertical, CheckSquare, XSquare,
  Ban, Building2, TrendingDown
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration statuts
// ============================================================
const STATUTS_CONFIG = {
  en_attente: { label: 'En attente', cls: 'badge-warning', icon: Clock, description: 'En attente de validation' },
  valide: { label: 'Validé', cls: 'badge-info', icon: CheckSquare, description: 'Validé, en attente de paiement' },
  paye: { label: 'Payé', cls: 'badge-success', icon: CheckCircle, description: 'Payé, solde mis à jour' },
  refuse: { label: 'Refusé', cls: 'badge-error', icon: XSquare, description: 'Refusé' },
  annule: { label: 'Annulé', cls: 'badge-neutral', icon: XCircle, description: 'Annulé' },
};

const TYPES_CONFIG = {
  paiement_salaire: { label: 'Paiement salaire' },
  paiement_fournisseur: { label: 'Paiement fournisseur' },
  carburant: { label: 'Carburant' },
  entretien: { label: 'Entretien' },
  achat: { label: 'Achat' },
  transport: { label: 'Transport' },
  charge: { label: 'Charge' },
  avance: { label: 'Avance' },
  depense_diverse: { label: 'Dépense diverse' },
  autre: { label: 'Autre' },
};

// ============================================================
// Actions par statut
// ============================================================
const ACTIONS_STATUT = [
  {
    action: 'valider',
    label: 'Valider la demande',
    icon: CheckSquare,
    color: 'info',
    from: ['en_attente'],
    confirmation: 'Valider cette demande de décaissement ?',
  },
  {
    action: 'refuser',
    label: 'Refuser la demande',
    icon: XSquare,
    color: 'error',
    danger: true,
    from: ['en_attente'],
    confirmation: 'Refuser cette demande ? Cette action est irréversible.',
  },
  {
    action: 'marquer_paye',
    label: 'Marquer comme payé',
    icon: CheckCircle,
    color: 'success',
    from: ['valide'],
    confirmation: 'Confirmer le paiement ? Le solde de la caisse sera impacté.',
  },
  {
    action: 'annuler',
    label: 'Annuler le décaissement',
    icon: Ban,
    color: 'error',
    danger: true,
    from: ['en_attente', 'valide'],
    confirmation: 'Annuler définitivement ce décaissement ? Cette action est irréversible.',
  },
];

const DecaissementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [decaissement, setDecaissement] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalConfirmation, setShowModalConfirmation] = useState(false);
  const [actionEnAttente, setActionEnAttente] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [menuStatutOuvert, setMenuStatutOuvert] = useState(false);

  useEffect(() => {
    chargerDecaissement();
  }, [id]);

  const chargerDecaissement = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/decaissements/${id}/`);
      setDecaissement(response.data);
    } catch (err) {
      setErreur('Décaissement introuvable');
    } finally {
      setChargement(false);
    }
  };

  const supprimerDecaissement = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/decaissements/${id}/`);
      navigate('/decaissements');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const executerAction = async () => {
    if (!actionEnAttente) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/decaissements/${id}/${actionEnAttente.action}/`);
      await chargerDecaissement();
      setShowModalConfirmation(false);
      setActionEnAttente(null);
      setMenuStatutOuvert(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const handleClickAction = (actionObj) => {
    setMenuStatutOuvert(false);
    setActionEnAttente(actionObj);
    setShowModalConfirmation(true);
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '—';

  const formaterDateHeure = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !decaissement) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Décaissement introuvable'}</p>
        <Link to="/decaissements" className="btn btn-primary mt-4">Retour aux décaissements</Link>
      </div>
    );
  }

  const statutCfg = STATUTS_CONFIG[decaissement.statut] || { label: decaissement.statut, cls: 'badge-ghost', icon: Clock };
  const IconStatut = statutCfg.icon;
  const actionsDisponibles = ACTIONS_STATUT.filter(a => a.from.includes(decaissement.statut));

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/decaissements')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Trésorerie / <Link to="/decaissements" className="hover:text-primary">Décaissements</Link> /
              <span className="text-primary font-mono">{decaissement.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ArrowUpRight className="w-8 h-8 text-error" />
              {decaissement.numero}
            </h1>
            <p className="text-base-content/60 mt-1">
              {decaissement.beneficiaire || 'Sans bénéficiaire'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className={`badge ${statutCfg.cls} badge-lg gap-2`}>
            <IconStatut className="w-4 h-4" />
            {statutCfg.label}
          </span>

          {/* Dropdown actions */}
          {actionsDisponibles.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setMenuStatutOuvert(!menuStatutOuvert)}
                className="btn btn-outline gap-2"
                disabled={chargementAction}
              >
                <MoreVertical className="w-4 h-4" />
                Changer le statut
              </button>

              {menuStatutOuvert && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuStatutOuvert(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-72 bg-base-100 rounded-lg shadow-xl border border-base-300 z-30 py-2">
                    <div className="px-4 py-2 text-xs text-base-content/40 uppercase tracking-wider border-b border-base-200 mb-1">
                      Actions disponibles
                    </div>
                    {actionsDisponibles.map((a) => {
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
                          <span className="font-medium">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {decaissement.statut === 'en_attente' && (
            <Link to={`/decaissements/${id}/modifier`} className="btn btn-primary gap-2">
              <Edit className="w-4 h-4" /> Modifier
            </Link>
          )}

          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* ALERTES */}
      {decaissement.statut === 'en_attente' && (
        <div className="alert alert-warning mb-6">
          <Clock className="w-5 h-5" />
          <div>
            <p className="font-bold">En attente de validation</p>
            <p className="text-sm">
              Cette demande doit être validée par un responsable avant paiement.
            </p>
          </div>
        </div>
      )}

      {decaissement.statut === 'valide' && (
        <div className="alert alert-info mb-6">
          <CheckSquare className="w-5 h-5" />
          <div>
            <p className="font-bold">Validé, en attente de paiement</p>
            <p className="text-sm">
              Le paiement n'a pas encore été effectué. Cliquez sur "Marquer comme payé" pour finaliser.
            </p>
          </div>
        </div>
      )}

      {decaissement.statut === 'refuse' && (
        <div className="alert alert-error mb-6">
          <XSquare className="w-5 h-5" />
          <div>
            <p className="font-bold">Demande refusée</p>
            <p className="text-sm">Cette demande de décaissement a été refusée.</p>
          </div>
        </div>
      )}

      {/* CONTENU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Informations */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Informations du décaissement</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Numéro</label>
                <p className="font-medium mt-1 font-mono flex items-center gap-2">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  {decaissement.numero}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Date de demande</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-base-content/40" />
                  {formaterDate(decaissement.date_demande)}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Type</label>
                <p className="font-medium mt-1">
                  {TYPES_CONFIG[decaissement.type]?.label || decaissement.type}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Mode de paiement</label>
                <p className="font-medium mt-1">
                  {decaissement.mode_paiement_display || decaissement.mode_paiement}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-base-content/40 uppercase">Montant</label>
                <p className="font-bold text-3xl mt-1 font-mono text-error">
                  -{formaterMontant(decaissement.montant)}
                </p>
              </div>
            </div>
          </div>

          {/* Bénéficiaire */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <User className="w-4 h-4 text-info" />
              <h2 className="font-semibold text-sm">Bénéficiaire</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Bénéficiaire</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-base-content/40" />
                  {decaissement.beneficiaire || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Référence fournisseur</label>
                <p className="font-medium mt-1 font-mono">
                  {decaissement.fournisseur_reference || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Source des fonds */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Source des fonds</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Caisse</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-base-content/40" />
                  {decaissement.caisse_nom || 'Aucune'}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Compte bancaire</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-base-content/40" />
                  {decaissement.compte_nom || 'Aucun'}
                </p>
              </div>
            </div>
          </div>

          {/* Motif */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-base-content/60" />
              <h2 className="font-semibold text-sm">Motif & Référence</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Motif</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{decaissement.motif || '—'}</p>
              </div>
              {decaissement.reference && (
                <div>
                  <label className="text-xs text-base-content/40 uppercase">Référence</label>
                  <p className="font-medium mt-1 font-mono">{decaissement.reference}</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="space-y-6">

          {/* Résumé statut */}
          <div className="card bg-gradient-to-br from-error/5 to-error/10 border border-error/20 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-error" />
                Résumé
              </h3>
              <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Montant décaissé</div>
                  <div className="stat-value text-xl text-error font-mono">
                    {formaterMontant(decaissement.montant)}
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full ${
                    decaissement.statut === 'paye' ? 'bg-success/20' :
                    decaissement.statut === 'valide' ? 'bg-info/20' :
                    decaissement.statut === 'en_attente' ? 'bg-warning/20' :
                    decaissement.statut === 'refuse' ? 'bg-error/20' : 'bg-base-300'
                  } flex items-center justify-center`}>
                    <IconStatut className={`w-4 h-4 ${
                      decaissement.statut === 'paye' ? 'text-success' :
                      decaissement.statut === 'valide' ? 'text-info' :
                      decaissement.statut === 'en_attente' ? 'text-warning' :
                      decaissement.statut === 'refuse' ? 'text-error' : 'text-base-content/50'
                    }`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{statutCfg.label}</p>
                    <p className="text-xs text-base-content/60">{statutCfg.description}</p>
                  </div>
                </div>

                {/* Workflow */}
                <div className="divider my-2"></div>

                <div className="space-y-2 text-xs">
                  {decaissement.demande_par_nom && (
                    <div>
                      <span className="text-base-content/50">Demandé par :</span>
                      <p className="font-medium">{decaissement.demande_par_nom}</p>
                    </div>
                  )}
                  {decaissement.valide_par_nom && (
                    <div>
                      <span className="text-base-content/50">Validé par :</span>
                      <p className="font-medium">{decaissement.valide_par_nom}</p>
                    </div>
                  )}
                  {decaissement.paye_par_nom && (
                    <div>
                      <span className="text-base-content/50">Payé par :</span>
                      <p className="font-medium">{decaissement.paye_par_nom}</p>
                    </div>
                  )}
                  {decaissement.date_paiement && (
                    <div>
                      <span className="text-base-content/50">Date de paiement :</span>
                      <p className="font-medium">{formaterDate(decaissement.date_paiement)}</p>
                    </div>
                  )}
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
                {decaissement.caisse && (
                  <Link to={`/caisses/${decaissement.caisse}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                    <Wallet className="w-4 h-4" /> Voir la caisse
                  </Link>
                )}
                {decaissement.compte_bancaire && (
                  <Link to={`/comptes-bancaires/${decaissement.compte_bancaire}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                    <Landmark className="w-4 h-4" /> Voir le compte
                  </Link>
                )}
                <button onClick={() => window.print()} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3">Informations système</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-base-content/50">Créé le :</span>
                  <p className="font-medium">{formaterDateHeure(decaissement.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifié le :</span>
                  <p className="font-medium">{formaterDateHeure(decaissement.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL CONFIRMATION STATUT */}
      {showModalConfirmation && actionEnAttente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalConfirmation(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full ${
                actionEnAttente.danger ? 'bg-error/20' : `bg-${actionEnAttente.color}/20`
              } flex items-center justify-center mx-auto mb-4`}>
                <actionEnAttente.icon className={`w-8 h-8 ${
                  actionEnAttente.danger ? 'text-error' : `text-${actionEnAttente.color}`
                }`} />
              </div>

              <h3 className="text-xl font-bold mb-2">{actionEnAttente.label}</h3>
              <p className="text-base-content/60 mb-4">{actionEnAttente.confirmation}</p>

              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalConfirmation(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button
                  className={`btn flex-1 ${actionEnAttente.danger ? 'btn-error' : `btn-${actionEnAttente.color}`}`}
                  onClick={executerAction}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Traitement...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Confirmer</>
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le décaissement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le décaissement <span className="font-bold font-mono">{decaissement.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerDecaissement} disabled={chargementAction}>
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

export default DecaissementDetail;