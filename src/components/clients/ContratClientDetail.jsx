// components/clients/ContratClientDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Edit, Trash2, Loader2, AlertCircle,
  Building2, Calendar, DollarSign, User, MapPin, Briefcase,
  CheckCircle, Clock, Users, Percent, Hash, TrendingUp
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ContratClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrat, setContrat] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalAction, setShowModalAction] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerContrat();
  }, [id]);

  const chargerContrat = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/contrats-clients/${id}/`);
      setContrat(response.data);
    } catch (err) {
      setErreur('Impossible de charger le contrat');
    } finally {
      setChargement(false);
    }
  };

  const executerAction = async () => {
    if (!actionType) return;
    setChargementAction(true);
    try {
      if (actionType === 'supprimer') {
        await AxiosInstance.delete(`/contrats-clients/${id}/`);
        navigate('/contrats-clients');
      } else if (actionType === 'valider') {
        await AxiosInstance.post(`/contrats-clients/${id}/valider/`);
        chargerContrat();
      } else if (actionType === 'suspendre') {
        await AxiosInstance.post(`/contrats-clients/${id}/suspendre/`);
        chargerContrat();
      } else if (actionType === 'resilier') {
        await AxiosInstance.post(`/contrats-clients/${id}/resilier/`);
        chargerContrat();
      }
      setShowModalSuppression(false);
      setShowModalAction(false);
      setActionType(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '—';

  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '—';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur}</p>
      </div>
    );
  }

  if (!contrat) return null;

  const expirant = contrat.jours_avant_expiration !== null
    && contrat.jours_avant_expiration >= 0
    && contrat.jours_avant_expiration <= 30;

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/contrats-clients')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-1">
              <Building2 className="w-3 h-3" />
              Clients & Contrats / <Link to="/contrats-clients" className="hover:text-primary">Contrats clients</Link> /
              <span className="text-primary font-mono">{contrat.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              {contrat.numero}
            </h1>
            <p className="text-base-content/60 mt-1">
              {contrat.client_nom} — {contrat.prestation}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/contrats-clients/${id}/modifier`} className="btn btn-primary gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>
          {contrat.statut === 'brouillon' && (
            <button
              onClick={() => { setActionType('valider'); setShowModalAction(true); }}
              className="btn btn-success gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Valider
            </button>
          )}
          {contrat.statut === 'actif' && (
            <button
              onClick={() => { setActionType('suspendre'); setShowModalAction(true); }}
              className="btn btn-warning gap-2"
            >
              <Clock className="w-4 h-4" /> Suspendre
            </button>
          )}
          <button
            onClick={() => setShowModalSuppression(true)}
            className="btn btn-error gap-2"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* ALERTE EXPIRATION */}
      {expirant && (
        <div className="alert alert-warning mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>⚠ Ce contrat expire dans <strong>{contrat.jours_avant_expiration} jours</strong></span>
        </div>
      )}

      {/* CONTENU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Informations principales */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Informations du contrat</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Numéro</label>
                <p className="font-medium mt-1 font-mono flex items-center gap-2">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  {contrat.numero}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Client</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-base-content/40" />
                  <Link to={`/clients/${contrat.client}`} className="text-primary hover:underline">
                    {contrat.client_nom}
                  </Link>
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-base-content/40 uppercase">Prestation</label>
                <p className="font-medium mt-1">{contrat.prestation}</p>
                {contrat.description && (
                  <p className="text-sm text-base-content/60 mt-1">{contrat.description}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Fréquence</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-base-content/40" />
                  {contrat.frequence_display || contrat.frequence}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Zone</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-base-content/40" />
                  {contrat.zone || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Période */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-info" />
              <h2 className="font-semibold text-sm">Période & Validité</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Date de début</label>
                <p className="font-medium mt-1">{formaterDate(contrat.date_debut)}</p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Date de fin</label>
                <p className="font-medium mt-1">
                  {contrat.date_fin ? formaterDate(contrat.date_fin) : 'En cours'}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Reconduction tacite</label>
                <p className="mt-1">
                  <span className={`badge badge-sm ${contrat.reconduction_tacite ? 'badge-success' : 'badge-ghost'}`}>
                    {contrat.reconduction_tacite ? 'Oui' : 'Non'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Jours de préavis</label>
                <p className="font-medium mt-1">{contrat.jours_preavis} jours</p>
              </div>
              {contrat.jours_avant_expiration !== null && (
                <div className="md:col-span-2">
                  <label className="text-xs text-base-content/40 uppercase">Jours avant expiration</label>
                  <p className="font-medium mt-1">
                    <span className={`badge ${
                      contrat.jours_avant_expiration < 0 ? 'badge-error' :
                      contrat.jours_avant_expiration <= 30 ? 'badge-warning' : 'badge-success'
                    }`}>
                      {contrat.jours_avant_expiration < 0
                        ? `Expiré depuis ${Math.abs(contrat.jours_avant_expiration)}j`
                        : `${contrat.jours_avant_expiration} jours`}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tarification */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              <h2 className="font-semibold text-sm">Tarification</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Tarif HT</label>
                <p className="font-medium mt-1 font-mono text-lg">{formaterMontant(contrat.tarif)}</p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">TVA</label>
                <p className="font-medium mt-1">{contrat.tva}%</p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Montant TTC</label>
                <p className="font-bold mt-1 font-mono text-lg text-success">{formaterMontant(contrat.montant_ttc)}</p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Modalité de paiement</label>
                <p className="font-medium mt-1">{contrat.modalite_paiement_display || contrat.modalite_paiement}</p>
              </div>
            </div>
          </div>

          {/* Équipe affectée */}
          {contrat.equipe_nom && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Équipe affectée</h2>
              </div>
              <div className="p-5">
                <p className="font-medium">{contrat.equipe_nom}</p>
              </div>
            </div>
          )}

          {/* Conditions particulières */}
          {contrat.conditions_particulieres && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-base-content/60" />
                <h2 className="font-semibold text-sm">Conditions particulières</h2>
              </div>
              <div className="p-5">
                <p className="text-sm whitespace-pre-wrap">{contrat.conditions_particulieres}</p>
              </div>
            </div>
          )}

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="space-y-6">

          {/* Carte statut */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body text-center">
              <FileText className="w-16 h-16 text-primary mx-auto" />
              <p className="font-mono text-xs text-base-content/50 mt-2">{contrat.numero}</p>
              <h3 className="text-lg font-bold">{contrat.client_nom}</h3>
              <div className="divider my-2"></div>
              <div className="stats stats-vertical shadow-sm">
                <div className="stat py-2">
                  <div className="stat-title text-xs">Montant TTC</div>
                  <div className="stat-value text-lg text-success">{formaterMontant(contrat.montant_ttc)}</div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <span className={`badge ${
                  contrat.statut === 'actif' ? 'badge-success' :
                  contrat.statut === 'brouillon' ? 'badge-ghost' :
                  contrat.statut === 'expire' || contrat.statut === 'resilie' ? 'badge-error' :
                  'badge-warning'
                }`}>
                  {contrat.statut_display || contrat.statut}
                </span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3">Actions rapides</h4>
              <div className="space-y-2">
                <Link to={`/clients/${contrat.client}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <User className="w-4 h-4" /> Voir le client
                </Link>
                <Link to={`/contrats-clients/${id}/modifier`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Edit className="w-4 h-4" /> Modifier
                </Link>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-base-content/50" />
                Informations système
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-base-content/40">Créé le :</span>
                  <p className="font-medium">{formaterDate(contrat.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/40">Modifié le :</span>
                  <p className="font-medium">{formaterDate(contrat.updated_at)}</p>
                </div>
                {contrat.date_validation && (
                  <div>
                    <span className="text-base-content/40">Validé le :</span>
                    <p className="font-medium">{formaterDate(contrat.date_validation)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le contrat</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le contrat <span className="font-bold font-mono">{contrat.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)}>Annuler</button>
                <button className="btn btn-error flex-1" onClick={executerAction} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTION */}
      {showModalAction && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModalAction(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full ${
                actionType === 'valider' ? 'bg-success/20' : 'bg-warning/20'
              } flex items-center justify-center mx-auto mb-4`}>
                {actionType === 'valider' ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <Clock className="w-8 h-8 text-warning" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {actionType === 'valider' ? 'Valider le contrat' : 'Suspendre le contrat'}
              </h3>
              <p className="text-base-content/60 mb-4">
                Confirmer pour <span className="font-bold font-mono">{contrat.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalAction(false)}>Annuler</button>
                <button
                  className={`btn flex-1 ${actionType === 'valider' ? 'btn-success' : 'btn-warning'}`}
                  onClick={executerAction}
                  disabled={chargementAction}
                >
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratClientDetail;