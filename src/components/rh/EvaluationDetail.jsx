// pages/evaluations/EvaluationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Award, Edit, Trash2, Loader2, AlertCircle,
  Calendar, Clock, Building2, User, FileText, TrendingUp,
  Star, Target, ThumbsUp, ThumbsDown, MessageSquare,
  Download, Printer, Briefcase, Users, BarChart3, CheckCircle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const EvaluationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [employe, setEmploye] = useState(null);
  const [evaluateur, setEvaluateur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerEvaluation();
  }, [id]);

  const chargerEvaluation = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/evaluations/${id}/`);
      setEvaluation(response.data);

      // Charger employé et évaluateur en parallèle
      const promises = [];
      if (response.data.employe) {
        promises.push(
          AxiosInstance.get(`/employes/${response.data.employe}/`)
            .then(res => setEmploye(res.data))
            .catch(() => null)
        );
      }
      if (response.data.evaluateur) {
        promises.push(
          AxiosInstance.get(`/employes/${response.data.evaluateur}/`)
            .then(res => setEvaluateur(res.data))
            .catch(() => null)
        );
      }
      await Promise.all(promises);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger l\'évaluation');
      if (err.response?.status === 404) {
        setErreur('Évaluation non trouvée');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerEvaluation = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/evaluations/${id}/`);
      navigate('/evaluations');
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setShowModalSuppression(false);
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

  const getNoteInfo = (note) => {
    const n = Number(note);
    if (n >= 16) return { label: 'Excellent', cls: 'text-success', bg: 'bg-success/10', icon: Star };
    if (n >= 12) return { label: 'Bon', cls: 'text-info', bg: 'bg-info/10', icon: ThumbsUp };
    if (n >= 8) return { label: 'Moyen', cls: 'text-warning', bg: 'bg-warning/10', icon: TrendingUp };
    return { label: 'Faible', cls: 'text-error', bg: 'bg-error/10', icon: AlertCircle };
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
        <button onClick={chargerEvaluation} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!evaluation) return null;

  const noteInfo = getNoteInfo(evaluation.note_globale);
  const NoteIcon = noteInfo.icon;
  const etoiles = Math.round((Number(evaluation.note_globale) / 20) * 5);
  const pourcentage = (Number(evaluation.note_globale) / 20) * 100;

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/evaluations')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <Link to="/evaluations" className="hover:text-primary">Évaluations</Link>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">Détail</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Award className="w-8 h-8 text-primary" />
              Évaluation
            </h1>
            <p className="text-base-content/60 mt-1">
              {employe ? `${employe.prenom} ${employe.nom}` : 'Employé'} • {evaluation.periode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost gap-2"
            onClick={() => window.print()}
            title="Imprimer"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <Link
            to={`/evaluations/${id}/modifier`}
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

      {/* CONTENU */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Carte de note prominente */}
          <div className={`card ${noteInfo.bg} border-2 border-base-300 shadow-sm`}>
            <div className="card-body">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl ${noteInfo.bg} border-2 border-base-300 flex items-center justify-center flex-shrink-0`}>
                    <NoteIcon className={`w-10 h-10 ${noteInfo.cls}`} />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider mb-1">Note globale</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold ${noteInfo.cls}`}>
                        {Number(evaluation.note_globale).toFixed(1)}
                      </span>
                      <span className="text-2xl text-base-content/40 font-medium">/20</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < etoiles ? 'fill-warning text-warning' : 'text-base-content/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`badge ${noteInfo.cls.replace('text-', 'badge-')} badge-lg`}>
                    {noteInfo.label}
                  </span>
                  <p className="text-xs text-base-content/50 mt-2">
                    {pourcentage.toFixed(0)}% de réussite
                  </p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-base-300 rounded-full h-3 mt-4">
                <div
                  className={`h-3 rounded-full transition-all ${
                    Number(evaluation.note_globale) >= 16 ? 'bg-success' :
                    Number(evaluation.note_globale) >= 12 ? 'bg-info' :
                    Number(evaluation.note_globale) >= 8 ? 'bg-warning' : 'bg-error'
                  }`}
                  style={{ width: `${pourcentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Informations générales</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Période évaluée</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {evaluation.periode}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date d'évaluation</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(evaluation.date_evaluation)}
                    </p>
                  </div>

                  {evaluateur && (
                    <div>
                      <label className="text-xs text-base-content/40 uppercase tracking-wider">Évaluateur</label>
                      <p className="font-medium mt-1 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-base-content/40" />
                        {evaluateur.prenom} {evaluateur.nom}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Points forts */}
          {evaluation.points_forts && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-success/5 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm text-success">Points forts</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-base-content/80 whitespace-pre-line leading-relaxed">
                    {evaluation.points_forts}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Points à améliorer */}
          {evaluation.points_ameliorer && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-warning/5 flex items-center gap-2">
                  <Target className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm text-warning">Points à améliorer</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-base-content/80 whitespace-pre-line leading-relaxed">
                    {evaluation.points_ameliorer}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Objectifs */}
          {evaluation.objectifs && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-primary/5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm text-primary">Objectifs futurs</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-base-content/80 whitespace-pre-line leading-relaxed">
                    {evaluation.objectifs}
                  </p>
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
                      {formaterDateHeure(evaluation.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Modifié le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(evaluation.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="lg:col-span-1 space-y-6">

          {/* Employé évalué */}
          {employe && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Employé évalué</h2>
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
                            <Briefcase className="w-3 h-3" />
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

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <button
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  Imprimer la fiche
                </button>
                <Link
                  to={`/evaluations/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier l'évaluation
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
                    to={`/evaluations?employe=${employe.id}`}
                    className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Toutes ses évaluations
                  </Link>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal suppression */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'évaluation</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement cette évaluation ?
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
                  onClick={supprimerEvaluation}
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

      <style jsx>{`
        @media print {
          button, .btn, .badge, header, nav, aside {
            display: none !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EvaluationDetail;