// pages/evaluations/Evaluations.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Users, Calendar, TrendingUp, Star, Target,
  CheckCircle, XCircle, Clock, BarChart3, Download, Printer,
  User, Briefcase, FileText, Medal, ThumbsUp, MessageSquare
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Evaluations = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationsFiltrees, setEvaluationsFiltrees] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('all');
  const [filtreNote, setFiltreNote] = useState('all'); // 'all' | 'excellent' | 'bon' | 'moyen' | 'faible'
  const [filtreEmploye, setFiltreEmploye] = useState('all');
  const [filtreAnnee, setFiltreAnnee] = useState(new Date().getFullYear());
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(10);
  const [evaluationSelectionnee, setEvaluationSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');

  useEffect(() => {
    chargerDonnees();
  }, [filtreAnnee]);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [evalRes, empRes] = await Promise.all([
        AxiosInstance.get('/evaluations/'),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);

      const evalData = evalRes.data.results || evalRes.data || [];
      const empData = empRes.data.results || empRes.data || [];

      setEvaluations(evalData);
      setEvaluationsFiltrees(evalData);
      setEmployes(empData);
      setTotalPages(Math.ceil(evalData.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les évaluations');
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = evaluations;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(e =>
        e.employe_nom?.toLowerCase().includes(terme) ||
        e.evaluateur_nom?.toLowerCase().includes(terme) ||
        e.periode?.toLowerCase().includes(terme) ||
        e.points_forts?.toLowerCase().includes(terme) ||
        e.objectifs?.toLowerCase().includes(terme)
      );
    }

    if (filtrePeriode !== 'all') {
      filtre = filtre.filter(e => e.periode === filtrePeriode);
    }

    if (filtreNote !== 'all') {
      filtre = filtre.filter(e => {
        const note = Number(e.note_globale);
        if (filtreNote === 'excellent') return note >= 16;
        if (filtreNote === 'bon') return note >= 12 && note < 16;
        if (filtreNote === 'moyen') return note >= 8 && note < 12;
        if (filtreNote === 'faible') return note < 8;
        return true;
      });
    }

    if (filtreEmploye !== 'all') {
      filtre = filtre.filter(e => String(e.employe) === String(filtreEmploye));
    }

    if (filtreAnnee) {
      filtre = filtre.filter(e => {
        if (!e.date_evaluation) return false;
        return e.date_evaluation.startsWith(String(filtreAnnee));
      });
    }

    setEvaluationsFiltrees(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtrePeriode, filtreNote, filtreEmploye, filtreAnnee, evaluations]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return evaluationsFiltrees.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  const supprimerEvaluation = async () => {
    if (!evaluationSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/evaluations/${evaluationSelectionnee.id}/`);
      setEvaluations(evaluations.filter(e => e.id !== evaluationSelectionnee.id));
      setShowModalSuppression(false);
      setEvaluationSelectionnee(null);
      setMessageSucces('Évaluation supprimée avec succès');
      setSucces(true);
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Notes et couleurs
  const getNoteInfo = (note) => {
    const n = Number(note);
    if (n >= 16) return { label: 'Excellent', cls: 'text-success', badge: 'badge-success', icon: Star };
    if (n >= 12) return { label: 'Bon', cls: 'text-info', badge: 'badge-info', icon: ThumbsUp };
    if (n >= 8) return { label: 'Moyen', cls: 'text-warning', badge: 'badge-warning', icon: Clock };
    return { label: 'Faible', cls: 'text-error', badge: 'badge-error', icon: AlertCircle };
  };

  const getBadgeNote = (note) => {
    const info = getNoteInfo(note);
    const Icon = info.icon;
    return (
      <div className="flex items-center gap-2">
        <span className={`badge ${info.badge} badge-sm gap-1`}>
          <Icon className="w-3 h-3" />
          {Number(note).toFixed(1)}/20
        </span>
      </div>
    );
  };

  // Étoiles visuelles
  const getStars = (note) => {
    const n = Number(note);
    const etoiles = Math.round((n / 20) * 5);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < etoiles ? 'fill-warning text-warning' : 'text-base-content/20'
            }`}
          />
        ))}
      </div>
    );
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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  // Statistiques
  const notes = evaluations.map(e => Number(e.note_globale) || 0);
  const moyenneGlobale = notes.length > 0 ? (notes.reduce((a, b) => a + b, 0) / notes.length) : 0;
  const stats = {
    total: evaluations.length,
    excellent: notes.filter(n => n >= 16).length,
    bon: notes.filter(n => n >= 12 && n < 16).length,
    moyen: notes.filter(n => n >= 8 && n < 12).length,
    faible: notes.filter(n => n < 8).length,
    moyenne: moyenneGlobale.toFixed(1),
  };

  return (
    <div className="w-full p-6">

      {/* Toast succès */}
      {succes && (
        <div className="fixed top-4 right-4 z-50 alert alert-success shadow-lg max-w-md">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{messageSucces}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Évaluations</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            Évaluations
          </h1>
          <p className="text-base-content/60 mt-1">
            {evaluationsFiltrees.length} évaluation{evaluationsFiltrees.length > 1 ? 's' : ''} trouvée{evaluationsFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={chargerDonnees}
            className="btn btn-ghost btn-sm gap-2"
            disabled={chargementAction}
          >
            <RefreshCw className={`w-4 h-4 ${chargementAction ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          <Link to="/evaluations/ajouter" className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle évaluation
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Excellent</p>
              <p className="text-lg font-bold text-success">{stats.excellent}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <ThumbsUp className="w-4 h-4 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Bon</p>
              <p className="text-lg font-bold text-info">{stats.bon}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Moyen</p>
              <p className="text-lg font-bold text-warning">{stats.moyen}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Faible</p>
              <p className="text-lg font-bold text-error">{stats.faible}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm border border-primary/20">
          <div className="card-body p-3">
            <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Moyenne</p>
            <p className={`text-lg font-bold ${
              Number(stats.moyenne) >= 16 ? 'text-success' :
              Number(stats.moyenne) >= 12 ? 'text-info' :
              Number(stats.moyenne) >= 8 ? 'text-warning' : 'text-error'
            }`}>
              {stats.moyenne}/20
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un employé, une période..."
                  className="input input-bordered input-sm w-full pl-10 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreEmploye}
              onChange={(e) => setFiltreEmploye(e.target.value)}
            >
              <option value="all">Tous les employés</option>
              {employes.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.prenom} {emp.nom}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreNote}
              onChange={(e) => setFiltreNote(e.target.value)}
            >
              <option value="all">Toutes les notes</option>
              <option value="excellent">Excellent (16-20)</option>
              <option value="bon">Bon (12-15)</option>
              <option value="moyen">Moyen (8-11)</option>
              <option value="faible">Faible (0-7)</option>
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreNote('all');
                setFiltreEmploye('all');
                setFiltreAnnee(new Date().getFullYear());
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {evaluationsFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Award className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune évaluation trouvée</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreNote !== 'all' || filtreEmploye !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par créer une évaluation'}
          </p>
          <Link to="/evaluations/ajouter" className="btn btn-primary mt-4">
            Nouvelle évaluation
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé évalué</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Évaluateur</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Note</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Appréciation</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {evaluation.employe_nom?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/employes/${evaluation.employe}`}
                            className="font-medium text-sm truncate hover:text-primary transition-colors"
                          >
                            {evaluation.employe_nom || '—'}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-base-content/40" />
                        <span>{evaluation.evaluateur_nom || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm gap-1">
                        <Calendar className="w-3 h-3" />
                        {evaluation.periode}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">{formaterDate(evaluation.date_evaluation)}</span>
                    </td>
                    <td>{getBadgeNote(evaluation.note_globale)}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {getStars(evaluation.note_globale)}
                        <span className={`text-xs font-medium ${getNoteInfo(evaluation.note_globale).cls}`}>
                          {getNoteInfo(evaluation.note_globale).label}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/evaluations/${evaluation.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir les détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/evaluations/${evaluation.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setEvaluationSelectionnee(evaluation);
                            setShowModalSuppression(true);
                          }}
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, evaluationsFiltrees.length)} sur{' '}
                {evaluationsFiltrees.length} évaluations
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => allerPage(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let numPage = i + 1;
                  if (totalPages > 5 && pageActuelle > 3) {
                    numPage = pageActuelle - 2 + i;
                    if (numPage > totalPages) return null;
                  }
                  return (
                    <button
                      key={numPage}
                      className={`btn btn-sm ${pageActuelle === numPage ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => allerPage(numPage)}
                    >
                      {numPage}
                    </button>
                  );
                })}
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => allerPage(pageActuelle + 1)}
                  disabled={pageActuelle === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal suppression */}
      {showModalSuppression && evaluationSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'évaluation</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer l'évaluation de{' '}
                <span className="font-bold">{evaluationSelectionnee.employe_nom}</span> ?
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
    </div>
  );
};

export default Evaluations;