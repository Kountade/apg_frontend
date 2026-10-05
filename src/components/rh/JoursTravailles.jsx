// pages/jours-travailles/JoursTravailles.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Users, Calendar, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, BarChart3, Download, Printer,
  Calculator, UserCheck, UserX, AlertTriangle, Minus,
  PlusCircle, Briefcase, FileSpreadsheet, Info, Target
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const JoursTravailles = () => {
  const navigate = useNavigate();
  const [jours, setJours] = useState([]);
  const [joursFiltres, setJoursFiltres] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreMois, setFiltreMois] = useState(new Date().getMonth() + 1);
  const [filtreAnnee, setFiltreAnnee] = useState(new Date().getFullYear());
  const [filtreEmploye, setFiltreEmploye] = useState('all');
  const [filtreDepartement, setFiltreDepartement] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(15);
  const [jourSelectionne, setJourSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalEdition, setShowModalEdition] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');

  // Formulaire d'édition
  const [editData, setEditData] = useState({
    jours_theoriques: 0,
    jours_presents: 0,
    absences_non_justifiees: 0,
    jours_travailles: 0,
    commentaire: '',
  });

  const anneesDisponibles = useMemo(() => {
    const a = new Date().getFullYear();
    return [a - 2, a - 1, a, a + 1];
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [filtreMois, filtreAnnee]);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [joursRes, empRes, depRes] = await Promise.all([
        AxiosInstance.get(`/jours-travailles/?mois=${filtreMois}&annee=${filtreAnnee}`).catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
        AxiosInstance.get('/departements/').catch(() => ({ data: [] })),
      ]);

      const joursData = joursRes.data.results || joursRes.data || [];
      const empData = empRes.data.results || empRes.data || [];
      const depData = depRes.data.results || depRes.data || [];

      setJours(joursData);
      setJoursFiltres(joursData);
      setEmployes(empData);
      setDepartements(depData);
      setTotalPages(Math.ceil(joursData.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les jours travaillés');
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // FILTRES
  // ============================================
  useEffect(() => {
    let filtre = jours;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(j =>
        j.employe_nom?.toLowerCase().includes(terme) ||
        j.employe_matricule?.toLowerCase().includes(terme)
      );
    }

    if (filtreEmploye !== 'all') {
      filtre = filtre.filter(j => String(j.employe) === String(filtreEmploye));
    }

    if (filtreDepartement !== 'all') {
      filtre = filtre.filter(j => {
        const emp = employes.find(e => String(e.id) === String(j.employe));
        return emp && String(emp.departement) === String(filtreDepartement);
      });
    }

    setJoursFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtreEmploye, filtreDepartement, jours, employes]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return joursFiltres.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  // ============================================
  // ACTIONS
  // ============================================
  const supprimerJour = async () => {
    if (!jourSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/jours-travailles/${jourSelectionne.id}/`);
      setJours(jours.filter(j => j.id !== jourSelectionne.id));
      setShowModalSuppression(false);
      setJourSelectionne(null);
      setMessageSucces('Enregistrement supprimé avec succès');
      setSucces(true);
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const ouvrirEdition = (jour) => {
    setJourSelectionne(jour);
    setEditData({
      jours_theoriques: jour.jours_theoriques || 0,
      jours_presents: jour.jours_presents || 0,
      absences_non_justifiees: jour.absences_non_justifiees || 0,
      jours_travailles: jour.jours_travailles || 0,
      commentaire: jour.commentaire || '',
    });
    setShowModalEdition(true);
  };

  // Recalcul auto du nombre de jours travaillés
  useEffect(() => {
    const theoriques = Number(editData.jours_theoriques) || 0;
    const presents = Number(editData.jours_presents) || 0;
    const absences = Number(editData.absences_non_justifiees) || 0;
    const calcul = Math.max(0, presents - absences);
    setEditData(prev => ({ ...prev, jours_travailles: calcul }));
  }, [editData.jours_theoriques, editData.jours_presents, editData.absences_non_justifiees]);

  const sauvegarderEdition = async () => {
    if (!jourSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.patch(`/jours-travailles/${jourSelectionne.id}/`, editData);
      setMessageSucces('Jours travaillés mis à jour');
      setSucces(true);
      setShowModalEdition(false);
      setJourSelectionne(null);
      await chargerDonnees();
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================
  // STATISTIQUES
  // ============================================
  const stats = useMemo(() => {
    const total = jours.length;
    const totalTheoriques = jours.reduce((acc, j) => acc + Number(j.jours_theoriques || 0), 0);
    const totalPresents = jours.reduce((acc, j) => acc + Number(j.jours_presents || 0), 0);
    const totalAbsences = jours.reduce((acc, j) => acc + Number(j.absences_non_justifiees || 0), 0);
    const totalTravailles = jours.reduce((acc, j) => acc + Number(j.jours_travailles || 0), 0);

    const tauxPresence = totalTheoriques > 0
      ? Math.round((totalPresents / totalTheoriques) * 100)
      : 0;

    const tauxAbsenteisme = totalTheoriques > 0
      ? Math.round((totalAbsences / totalTheoriques) * 100)
      : 0;

    return {
      total,
      totalTheoriques,
      totalPresents,
      totalAbsences,
      totalTravailles,
      tauxPresence,
      tauxAbsenteisme,
      moyenne: total > 0 ? totalTravailles / total : 0,
    };
  }, [jours]);

  // ============================================
  // FORMATAGE
  // ============================================
  const getCouleurTaux = (taux) => {
    if (taux >= 90) return 'text-success';
    if (taux >= 75) return 'text-info';
    if (taux >= 60) return 'text-warning';
    return 'text-error';
  };

  const getTauxEmploye = (jour) => {
    const th = Number(jour.jours_theoriques) || 0;
    const pr = Number(jour.jours_presents) || 0;
    if (th === 0) return 0;
    return Math.round((pr / th) * 100);
  };

  // ============================================
  // CHARGEMENT / ERREUR
  // ============================================
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

  return (
    <div className="w-full p-6">

      {/* Toast succès */}
      {succes && (
        <div className="fixed top-4 right-4 z-50 alert alert-success shadow-lg max-w-md animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{messageSucces}</span>
        </div>
      )}

      {/* ============================================ */}
      {/* EN-TÊTE                                       */}
      {/* ============================================ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Jours Travaillés</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Jours Travaillés
          </h1>
          <p className="text-base-content/60 mt-1">
            {MOIS_LABELS[filtreMois - 1]} {filtreAnnee} • {joursFiltres.length} employé{joursFiltres.length > 1 ? 's' : ''}
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
          <button
            className="btn btn-ghost btn-sm gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <Link
            to={`/jours-travailles/ajouter?mois=${filtreMois}&annee=${filtreAnnee}`}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            Enregistrer
          </Link>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATISTIQUES DU MOIS                          */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Employés</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Jours théoriques</p>
              <p className="text-lg font-bold text-info">{stats.totalTheoriques}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Jours présents</p>
              <p className="text-lg font-bold text-success">{stats.totalPresents}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <UserX className="w-4 h-4 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Absences NJ</p>
              <p className="text-lg font-bold text-error">{stats.totalAbsences}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Total travaillé</p>
              <p className="text-lg font-bold text-primary">{stats.totalTravailles}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success/10 to-success/5 shadow-sm border border-success/20">
          <div className="card-body p-3">
            <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Taux présence</p>
            <p className={`text-lg font-bold ${getCouleurTaux(stats.tauxPresence)}`}>
              {stats.tauxPresence}%
            </p>
            <div className="w-full bg-base-300 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  stats.tauxPresence >= 90 ? 'bg-success' :
                  stats.tauxPresence >= 75 ? 'bg-info' :
                  stats.tauxPresence >= 60 ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${stats.tauxPresence}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FILTRES                                       */}
      {/* ============================================ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Recherche */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un employé..."
                  className="input input-bordered input-sm w-full pl-10 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            {/* Mois */}
            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreMois}
              onChange={(e) => setFiltreMois(Number(e.target.value))}
            >
              {MOIS_LABELS.map((mois, idx) => (
                <option key={idx} value={idx + 1}>{mois}</option>
              ))}
            </select>

            {/* Année */}
            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(Number(e.target.value))}
            >
              {anneesDisponibles.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Département */}
            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreDepartement}
              onChange={(e) => setFiltreDepartement(e.target.value)}
            >
              <option value="all">Tous les départements</option>
              {departements.map((dep) => (
                <option key={dep.id} value={dep.id}>{dep.nom}</option>
              ))}
            </select>

            {/* Employé */}
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

            {/* Reset */}
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreEmploye('all');
                setFiltreDepartement('all');
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TABLEAU                                       */}
      {/* ============================================ */}
      {joursFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CalendarDays className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune donnée pour cette période</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreEmploye !== 'all' || filtreDepartement !== 'all'
              ? 'Essayez de modifier vos filtres'
              : `Aucun jour travaillé enregistré pour ${MOIS_LABELS[filtreMois - 1]} ${filtreAnnee}`}
          </p>
          <Link
            to={`/jours-travailles/ajouter?mois=${filtreMois}&annee=${filtreAnnee}`}
            className="btn btn-primary mt-4"
          >
            Enregistrer les jours travaillés
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Théoriques</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Présents</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Absences NJ</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Travaillés</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Taux</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((jour) => {
                  const taux = getTauxEmploye(jour);
                  const couleurTaux = getCouleurTaux(taux);

                  return (
                    <tr key={jour.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {jour.employe_nom?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/employes/${jour.employe}`}
                              className="font-medium text-sm truncate hover:text-primary transition-colors"
                            >
                              {jour.employe_nom || '—'}
                            </Link>
                            {jour.employe_matricule && (
                              <p className="text-xs text-base-content/40 font-mono">
                                {jour.employe_matricule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="text-center">
                        <span className="badge badge-ghost badge-sm font-mono">
                          {jour.jours_theoriques}
                        </span>
                      </td>

                      <td className="text-center">
                        <span className="badge badge-success badge-sm font-mono">
                          {jour.jours_presents}
                        </span>
                      </td>

                      <td className="text-center">
                        {Number(jour.absences_non_justifiees) > 0 ? (
                          <span className="badge badge-error badge-sm font-mono">
                            {jour.absences_non_justifiees}
                          </span>
                        ) : (
                          <span className="text-base-content/30 text-sm">0</span>
                        )}
                      </td>

                      <td className="text-center">
                        <span className="text-base font-bold text-primary font-mono">
                          {jour.jours_travailles}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-xs font-bold ${couleurTaux}`}>{taux}%</span>
                            </div>
                            <div className="w-full bg-base-300 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  taux >= 90 ? 'bg-success' :
                                  taux >= 75 ? 'bg-info' :
                                  taux >= 60 ? 'bg-warning' : 'bg-error'
                                }`}
                                style={{ width: `${taux}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => ouvrirEdition(jour)}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/presences?employe=${jour.employe}&mois=${filtreMois}&annee=${filtreAnnee}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir les présences"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setJourSelectionne(jour);
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
                  );
                })}
              </tbody>
              {/* Ligne récapitulative */}
              <tfoot>
                <tr className="bg-base-200/50 border-t-2 border-base-300">
                  <td className="font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Total du mois
                    </div>
                  </td>
                  <td className="text-center font-bold text-info font-mono">
                    {stats.totalTheoriques}
                  </td>
                  <td className="text-center font-bold text-success font-mono">
                    {stats.totalPresents}
                  </td>
                  <td className="text-center font-bold text-error font-mono">
                    {stats.totalAbsences}
                  </td>
                  <td className="text-center font-bold text-primary font-mono">
                    {stats.totalTravailles}
                  </td>
                  <td className="font-bold">
                    <span className={getCouleurTaux(stats.tauxPresence)}>
                      {stats.tauxPresence}%
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, joursFiltres.length)} sur{' '}
                {joursFiltres.length} enregistrements
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

      {/* ============================================ */}
      {/* MODAL ÉDITION                                 */}
      {/* ============================================ */}
      {showModalEdition && jourSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalEdition(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Edit className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Modifier les jours travaillés</h3>
                <p className="text-xs text-base-content/50">
                  {jourSelectionne.employe_nom} — {MOIS_LABELS[filtreMois - 1]} {filtreAnnee}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-info" />
                      Jours théoriques
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full focus:input-primary"
                    value={editData.jours_theoriques}
                    onChange={(e) => setEditData(prev => ({ ...prev, jours_theoriques: e.target.value }))}
                    min="0"
                    max="31"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-success" />
                      Jours présents
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full focus:input-primary"
                    value={editData.jours_presents}
                    onChange={(e) => setEditData(prev => ({ ...prev, jours_presents: e.target.value }))}
                    min="0"
                    max="31"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5 text-error" />
                      Absences non justifiées
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full focus:input-primary"
                    value={editData.absences_non_justifiees}
                    onChange={(e) => setEditData(prev => ({ ...prev, absences_non_justifiees: e.target.value }))}
                    min="0"
                    max="31"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-primary" />
                      Jours travaillés
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full bg-primary/5 focus:input-primary"
                    value={editData.jours_travailles}
                    readOnly
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-info/5 border border-info/20 flex items-center gap-2">
                <Info className="w-4 h-4 text-info flex-shrink-0" />
                <span className="text-xs text-base-content/70">
                  Le total est calculé automatiquement : <strong>Jours présents − Absences non justifiées</strong>
                </span>
              </div>

              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Commentaire (optionnel)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full focus:textarea-primary"
                  rows="2"
                  value={editData.commentaire}
                  onChange={(e) => setEditData(prev => ({ ...prev, commentaire: e.target.value }))}
                  placeholder="Notes, observations..."
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalEdition(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary flex-1 gap-2"
                  onClick={sauvegarderEdition}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL SUPPRESSION                             */}
      {/* ============================================ */}
      {showModalSuppression && jourSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'enregistrement</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer les jours travaillés de{' '}
                <span className="font-bold">{jourSelectionne.employe_nom}</span> pour {MOIS_LABELS[filtreMois - 1]} {filtreAnnee} ?
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
                  onClick={supprimerJour}
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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @media print {
          button, .btn, .badge {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default JoursTravailles;