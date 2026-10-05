// pages/conges/CongeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Edit, Trash2, Loader2, AlertCircle,
  Calendar, Clock, Building2, User, FileText, TrendingUp,
  CheckCircle, XCircle, AlertTriangle, Download, Printer,
  Palmtree, Plane, Heart, Stethoscope, UserCheck, Hash,
  ThumbsUp, ThumbsDown, Ban, MessageSquare, Shield
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CongeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conge, setConge] = useState(null);
  const [employe, setEmploye] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalValidation, setShowModalValidation] = useState(false);
  const [actionValidation, setActionValidation] = useState('valider');
  const [commentaireValidation, setCommentaireValidation] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerConge();
  }, [id]);

  const chargerConge = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/conges/${id}/`);
      setConge(response.data);

      if (response.data.employe) {
        try {
          const empRes = await AxiosInstance.get(`/employes/${response.data.employe}/`);
          setEmploye(empRes.data);
        } catch (e) {
          // Silencieux
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger le congé');
      if (err.response?.status === 404) {
        setErreur('Congé non trouvé');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerConge = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/conges/${id}/`);
      navigate('/conges');
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setShowModalSuppression(false);
    } finally {
      setChargementAction(false);
    }
  };

  const ouvrirValidation = (action) => {
    setActionValidation(action);
    setCommentaireValidation('');
    setShowModalValidation(true);
  };

  const validerConge = async () => {
    setChargementAction(true);
    try {
      const endpoint = actionValidation === 'valider'
        ? `/conges/${id}/valider/`
        : `/conges/${id}/refuser/`;

      await AxiosInstance.post(endpoint, {
        commentaire: commentaireValidation,
      });

      setShowModalValidation(false);
      await chargerConge();
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors du traitement');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formaterDateHeure = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={chargerConge} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!conge) return null;

  const getBadgeType = () => {
    const configs = {
      annuel: { label: 'Congé annuel', cls: 'badge-primary', icon: Palmtree },
      maladie: { label: 'Congé maladie', cls: 'badge-error', icon: Stethoscope },
      maternite: { label: 'Congé maternité', cls: 'badge-info', icon: Heart },
      exceptionnel: { label: 'Congé exceptionnel', cls: 'badge-warning', icon: Plane },
    };
    const cfg = configs[conge.type] || { label: conge.type, cls: 'badge-ghost', icon: CalendarDays };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} gap-1`}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeStatut = () => {
    const configs = {
      en_attente: { label: 'En attente', cls: 'badge-warning', icon: Clock },
      valide: { label: 'Validé', cls: 'badge-success', icon: CheckCircle },
      refuse: { label: 'Refusé', cls: 'badge-error', icon: XCircle },
      annule: { label: 'Annulé', cls: 'badge-ghost', icon: Ban },
    };
    const cfg = configs[conge.statut] || { label: conge.statut, cls: 'badge-ghost', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} gap-1`}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    );
  };

  const peutEtreValide = conge.statut === 'en_attente';

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/conges')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <Link to="/conges" className="hover:text-primary">Congés</Link>
              <span className="text-base-content/30">/</span>
              <span className="text-primary font-mono">{conge.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-primary" />
              <span className="font-mono">{conge.numero}</span>
            </h1>
            <p className="text-base-content/60 mt-1">
              {employe ? `${employe.prenom} ${employe.nom}` : 'Employé'} • {conge.nombre_jours} jour{conge.nombre_jours > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {peutEtreValide && (
            <>
              <button
                onClick={() => ouvrirValidation('valider')}
                className="btn btn-success gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Valider
              </button>
              <button
                onClick={() => ouvrirValidation('refuser')}
                className="btn btn-error gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Refuser
              </button>
            </>
          )}
          <Link
            to={`/conges/${id}/modifier`}
            className="btn btn-primary gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowModalSuppression(true)}
            className="btn btn-error gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Bandeau statut */}
      {conge.statut === 'en_attente' && (
        <div className="w-full alert alert-warning rounded-xl border border-warning/30 mb-6">
          <Clock className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-medium text-sm">Cette demande est en attente de validation</p>
            <p className="text-xs opacity-80">
              Validez ou refusez cette demande pour permettre son traitement
            </p>
          </div>
        </div>
      )}

      {conge.statut === 'valide' && (
        <div className="w-full alert alert-success rounded-xl border border-success/30 mb-6">
          <CheckCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-medium text-sm">Cette demande a été validée</p>
            {conge.valide_par_nom && (
              <p className="text-xs opacity-80">
                Validée par {conge.valide_par_nom} le {formaterDateHeure(conge.date_validation)}
              </p>
            )}
          </div>
        </div>
      )}

      {conge.statut === 'refuse' && (
        <div className="w-full alert alert-error rounded-xl border border-error/30 mb-6">
          <XCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-medium text-sm">Cette demande a été refusée</p>
            {conge.valide_par_nom && (
              <p className="text-xs opacity-80">
                Refusée par {conge.valide_par_nom} le {formaterDateHeure(conge.date_validation)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* CONTENU */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations du congé */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Informations du congé</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Numéro</label>
                    <p className="font-medium mt-1 font-mono flex items-center gap-2">
                      <Hash className="w-4 h-4 text-base-content/40" />
                      {conge.numero}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Type</label>
                    <p className="mt-1">{getBadgeType()}</p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de début</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(conge.date_debut)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de fin</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(conge.date_fin)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Statut</label>
                    <p className="mt-1">{getBadgeStatut()}</p>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-base-200">
                  <div className="stat bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="stat-title text-xs text-primary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Nombre de jours
                    </div>
                    <div className="stat-value text-2xl text-primary">
                      {conge.nombre_jours} jour{conge.nombre_jours > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {conge.motif && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Motif
                    </label>
                    <p className="mt-2 text-base-content/80 whitespace-pre-line text-sm">
                      {conge.motif}
                    </p>
                  </div>
                )}

                {conge.commentaire && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Commentaire de validation
                    </label>
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                      conge.statut === 'valide' ? 'bg-success/5 border border-success/20' :
                      conge.statut === 'refuse' ? 'bg-error/5 border border-error/20' :
                      'bg-base-200'
                    }`}>
                      <p className="text-base-content/80 whitespace-pre-line">
                        {conge.commentaire}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employé concerné */}
          {employe && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Employé concerné</h2>
                </div>

                <div className="p-5">
                  <Link
                    to={`/employes/${employe.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-base-200/50 transition-colors"
                  >
                    {employe.photo ? (
                      <div className="avatar">
                        <div className="w-14 h-14 rounded-full">
                          <img src={employe.photo} alt={employe.nom} />
                        </div>
                      </div>
                    ) : (
                      <div className="avatar placeholder">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {employe.prenom?.charAt(0)?.toUpperCase()}
                            {employe.nom?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base">
                        {employe.prenom} {employe.nom}
                      </p>
                      <p className="text-xs text-base-content/50 font-mono">
                        {employe.matricule}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {employe.poste_nom && (
                          <span className="badge badge-ghost badge-sm gap-1">
                            <Building2 className="w-3 h-3" />
                            {employe.poste_nom}
                          </span>
                        )}
                        {employe.departement_nom && (
                          <span className="badge badge-ghost badge-sm">
                            {employe.departement_nom}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Informations système */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <Clock className="w-4 h-4 text-base-content/50" />
                <h2 className="font-semibold text-sm">Informations système</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Créé le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(conge.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Modifié le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(conge.updated_at)}
                    </p>
                  </div>
                  {conge.valide_par_nom && (
                    <>
                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Validé par</label>
                        <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                          <UserCheck className="w-4 h-4 text-base-content/40" />
                          {conge.valide_par_nom}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de validation</label>
                        <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-base-content/40" />
                          {formaterDateHeure(conge.date_validation)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="lg:col-span-1 space-y-6">

          {/* Carte résumé */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body text-center">
              <div className="avatar placeholder mx-auto">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  conge.type === 'annuel' ? 'bg-primary/20' :
                  conge.type === 'maladie' ? 'bg-error/20' :
                  conge.type === 'maternite' ? 'bg-info/20' : 'bg-warning/20'
                }`}>
                  {conge.type === 'annuel' ? (
                    <Palmtree className="w-10 h-10 text-primary" />
                  ) : conge.type === 'maladie' ? (
                    <Stethoscope className="w-10 h-10 text-error" />
                  ) : conge.type === 'maternite' ? (
                    <Heart className="w-10 h-10 text-info" />
                  ) : (
                    <Plane className="w-10 h-10 text-warning" />
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold mt-2 font-mono">{conge.numero}</h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {getBadgeType()}
                {getBadgeStatut()}
              </div>

              <div className="stats stats-vertical shadow-sm mt-4">
                <div className="stat py-2">
                  <div className="stat-title text-xs">Jours demandés</div>
                  <div className="stat-value text-2xl text-primary">
                    {conge.nombre_jours}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions de validation */}
          {peutEtreValide && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Actions de validation
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => ouvrirValidation('valider')}
                    className="btn btn-success btn-sm justify-start w-full gap-2"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Valider la demande
                  </button>
                  <button
                    onClick={() => ouvrirValidation('refuser')}
                    className="btn btn-error btn-sm justify-start w-full gap-2"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Refuser la demande
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <button
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <Link
                  to={`/conges/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Link>
                {employe && (
                  <Link
                    to={`/employes/${employe.id}`}
                    className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  >
                    <User className="w-4 h-4" />
                    Voir la fiche employé
                  </Link>
                )}
                {employe && (
                  <Link
                    to={`/soldes-conges?employe=${employe.id}`}
                    className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Voir le solde
                  </Link>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal validation */}
      {showModalValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalValidation(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                actionValidation === 'valider' ? 'bg-success/20' : 'bg-error/20'
              }`}>
                {actionValidation === 'valider' ? (
                  <ThumbsUp className="w-8 h-8 text-success" />
                ) : (
                  <ThumbsDown className="w-8 h-8 text-error" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {actionValidation === 'valider' ? 'Valider le congé' : 'Refuser le congé'}
              </h3>
              <p className="text-base-content/60 mb-4">
                {actionValidation === 'valider'
                  ? 'Confirmez-vous la validation de cette demande de congé ?'
                  : 'Confirmez-vous le refus de cette demande de congé ?'}
              </p>

              <div className="form-control w-full text-left mb-4">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">
                    Commentaire (optionnel)
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full focus:textarea-primary"
                  rows="3"
                  value={commentaireValidation}
                  onChange={(e) => setCommentaireValidation(e.target.value)}
                  placeholder={actionValidation === 'valider'
                    ? 'Notes de validation...'
                    : 'Motif du refus...'}
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalValidation(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className={`btn flex-1 ${actionValidation === 'valider' ? 'btn-success' : 'btn-error'}`}
                  onClick={validerConge}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Traitement...
                    </>
                  ) : (
                    actionValidation === 'valider' ? 'Valider' : 'Refuser'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le congé</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement le congé{' '}
                <span className="font-bold font-mono">{conge.numero}</span> ?
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
                  onClick={supprimerConge}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Suppression...
                    </>
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

export default CongeDetail;