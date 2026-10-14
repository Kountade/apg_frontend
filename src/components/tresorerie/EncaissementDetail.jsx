// components/tresorerie/EncaissementDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowDownRight, Edit, Trash2, Loader2, AlertCircle,
  Calculator, Calendar, DollarSign, User, Hash, FileText,
  CheckCircle, XCircle, Clock, Wallet, Landmark, Banknote,
  CreditCard, Info, Printer, MoreVertical, CheckSquare, Ban
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des statuts et actions
// ============================================================
const STATUTS_CONFIG = {
  en_attente: { label: 'En attente', cls: 'badge-warning', icon: Clock, description: 'En attente de validation' },
  valide: { label: 'Validé', cls: 'badge-success', icon: CheckCircle, description: 'Validé et comptabilisé' },
  annule: { label: 'Annulé', cls: 'badge-neutral', icon: XCircle, description: 'Annulé' },
};

const TYPES_CONFIG = {
  paiement_client: { label: 'Paiement client' },
  reglement_facture: { label: 'Règlement facture' },
  recette_diverse: { label: 'Recette diverse' },
  apport: { label: 'Apport' },
  financement: { label: 'Financement' },
  remboursement: { label: 'Remboursement' },
  autre: { label: 'Autre' },
};

const ACTIONS_STATUT = [
  {
    action: 'valider',
    label: 'Valider l\'encaissement',
    icon: CheckSquare,
    color: 'success',
    from: ['en_attente'],
    confirmation: 'Confirmer la validation ? Le solde de la caisse/compte sera mis à jour.',
  },
  {
    action: 'annuler',
    label: 'Annuler l\'encaissement',
    icon: Ban,
    color: 'error',
    danger: true,
    from: ['en_attente', 'valide'],
    confirmation: 'Annuler définitivement cet encaissement ? Cette action est irréversible.',
  },
];

const EncaissementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [encaissement, setEncaissement] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalConfirmation, setShowModalConfirmation] = useState(false);
  const [actionEnAttente, setActionEnAttente] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [menuStatutOuvert, setMenuStatutOuvert] = useState(false);

  useEffect(() => {
    chargerEncaissement();
  }, [id]);

  const chargerEncaissement = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/encaissements/${id}/`);
      setEncaissement(response.data);
    } catch (err) {
      setErreur('Encaissement introuvable');
    } finally {
      setChargement(false);
    }
  };

  const supprimerEncaissement = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/encaissements/${id}/`);
      navigate('/encaissements');
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
      await AxiosInstance.post(`/encaissements/${id}/${actionEnAttente.action}/`);
      await chargerEncaissement();
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

  if (erreur || !encaissement) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Encaissement introuvable'}</p>
        <Link to="/encaissements" className="btn btn-primary mt-4">Retour aux encaissements</Link>
      </div>
    );
  }

  const statutCfg = STATUTS_CONFIG[encaissement.statut] || { label: encaissement.statut, cls: 'badge-ghost', icon: Clock };
  const IconStatut = statutCfg.icon;
  const actionsDisponibles = ACTIONS_STATUT.filter(a => a.from.includes(encaissement.statut));

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/encaissements')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Trésorerie / <Link to="/encaissements" className="hover:text-primary">Encaissements</Link> /
              <span className="text-primary font-mono">{encaissement.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ArrowDownRight className="w-8 h-8 text-success" />
              {encaissement.numero}
            </h1>
            <p className="text-base-content/60 mt-1">
              {encaissement.client_nom || encaissement.origine || 'Sans origine'}
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

          {encaissement.statut === 'en_attente' && (
            <Link to={`/encaissements/${id}/modifier`} className="btn btn-primary gap-2">
              <Edit className="w-4 h-4" /> Modifier
            </Link>
          )}

          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* ALERTE EN ATTENTE */}
      {encaissement.statut === 'en_attente' && (
        <div className="alert alert-warning mb-6">
          <Clock className="w-5 h-5" />
          <div>
            <p className="font-bold">Encaissement en attente de validation</p>
            <p className="text-sm">
              Cet encaissement doit être validé pour impacter le solde de la caisse/compte.
            </p>
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
              <h2 className="font-semibold text-sm">Informations de l'encaissement</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Numéro</label>
                <p className="font-medium mt-1 font-mono flex items-center gap-2">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  {encaissement.numero}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Date</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-base-content/40" />
                  {formaterDate(encaissement.date_encaissement)}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Type</label>
                <p className="font-medium mt-1">
                  {TYPES_CONFIG[encaissement.type]?.label || encaissement.type}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Mode de paiement</label>
                <p className="font-medium mt-1">
                  {encaissement.mode_paiement_display || encaissement.mode_paiement}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-base-content/40 uppercase">Montant</label>
                <p className="font-bold text-3xl mt-1 font-mono text-success">
                  +{formaterMontant(encaissement.montant)}
                </p>
              </div>
            </div>
          </div>

          {/* Client / Origine */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <User className="w-4 h-4 text-info" />
              <h2 className="font-semibold text-sm">Client / Origine</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Client</label>
                <p className="font-medium mt-1">
                  {encaissement.client_nom ? (
                    <Link to={`/clients/${encaissement.client}`} className="text-primary hover:underline">
                      {encaissement.client_nom}
                    </Link>
                  ) : (
                    <span className="text-base-content/40">Aucun client</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Réf. facture</label>
                <p className="font-medium mt-1 font-mono">
                  {encaissement.facture_reference || '—'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-base-content/40 uppercase">Origine / Source</label>
                <p className="font-medium mt-1">{encaissement.origine || '—'}</p>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Destination</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Caisse</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-base-content/40" />
                  {encaissement.caisse_nom || 'Aucune'}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Compte bancaire</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-base-content/40" />
                  {encaissement.compte_nom || 'Aucun'}
                </p>
              </div>
            </div>
          </div>

          {/* Détails */}
          {(encaissement.reference || encaissement.motif) && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Info className="w-4 h-4 text-base-content/60" />
                <h2 className="font-semibold text-sm">Détails</h2>
              </div>
              <div className="p-5 space-y-4">
                {encaissement.reference && (
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Référence</label>
                    <p className="font-medium mt-1 font-mono">{encaissement.reference}</p>
                  </div>
                )}
                {encaissement.motif && (
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Motif</label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{encaissement.motif}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="space-y-6">

          {/* Résumé statut */}
          <div className="card bg-gradient-to-br from-success/5 to-success/10 border border-success/20 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Résumé
              </h3>
              <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Montant encaissé</div>
                  <div className="stat-value text-xl text-success font-mono">
                    {formaterMontant(encaissement.montant)}
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full ${
                    encaissement.statut === 'valide' ? 'bg-success/20' :
                    encaissement.statut === 'en_attente' ? 'bg-warning/20' : 'bg-base-300'
                  } flex items-center justify-center`}>
                    <IconStatut className={`w-4 h-4 ${
                      encaissement.statut === 'valide' ? 'text-success' :
                      encaissement.statut === 'en_attente' ? 'text-warning' : 'text-base-content/50'
                    }`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{statutCfg.label}</p>
                    <p className="text-xs text-base-content/60">{statutCfg.description}</p>
                  </div>
                </div>

                {encaissement.valide_par_nom && (
                  <>
                    <div className="divider my-2"></div>
                    <div className="text-xs">
                      <span className="text-base-content/50">Validé par :</span>
                      <p className="font-medium">{encaissement.valide_par_nom}</p>
                      <p className="text-base-content/40 text-[10px]">
                        {formaterDateHeure(encaissement.date_validation)}
                      </p>
                    </div>
                  </>
                )}
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
                {encaissement.client && (
                  <Link to={`/clients/${encaissement.client}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                    <User className="w-4 h-4" /> Voir le client
                  </Link>
                )}
                {encaissement.caisse && (
                  <Link to={`/caisses/${encaissement.caisse}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                    <Wallet className="w-4 h-4" /> Voir la caisse
                  </Link>
                )}
                {encaissement.compte_bancaire && (
                  <Link to={`/comptes-bancaires/${encaissement.compte_bancaire}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                    <Landmark className="w-4 h-4" /> Voir le compte
                  </Link>
                )}
                <button onClick={() => window.print()} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Printer className="w-4 h-4" /> Imprimer le reçu
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
                  <p className="font-medium">{formaterDateHeure(encaissement.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifié le :</span>
                  <p className="font-medium">{formaterDateHeure(encaissement.updated_at)}</p>
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
                actionEnAttente.danger ? 'bg-error/20' : 'bg-success/20'
              } flex items-center justify-center mx-auto mb-4`}>
                <actionEnAttente.icon className={`w-8 h-8 ${
                  actionEnAttente.danger ? 'text-error' : 'text-success'
                }`} />
              </div>

              <h3 className="text-xl font-bold mb-2">{actionEnAttente.label}</h3>
              <p className="text-base-content/60 mb-4">{actionEnAttente.confirmation}</p>

              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalConfirmation(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button
                  className={`btn flex-1 ${actionEnAttente.danger ? 'btn-error' : 'btn-success'}`}
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
              <h3 className="text-xl font-bold mb-2">Supprimer l'encaissement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'encaissement <span className="font-bold font-mono">{encaissement.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerEncaissement} disabled={chargementAction}>
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

export default EncaissementDetail;