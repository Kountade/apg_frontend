// pages/soldes-conges/SoldeConges.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calculator, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Users, Calendar, TrendingUp, TrendingDown,
  Palmtree, CheckCircle, XCircle, Clock, Award, User,
  BarChart3, PieChart, Download, Printer, Target, AlertTriangle,
  Minus, PlusCircle, CalendarDays, Hash, Info
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const SoldeConges = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [soldes, setSoldes] = useState([]);
  const [soldesFiltres, setSoldesFiltres] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState(new Date().getFullYear());
  const [filtreEmploye, setFiltreEmploye] = useState(searchParams.get('employe') || 'all');
  const [filtreSolde, setFiltreSolde] = useState('all'); // 'all' | 'positif' | 'faible' | 'epuise'
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(15);
  const [soldeSelectionne, setSoldeSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalAjustement, setShowModalAjustement] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');

  // Formulaire d'ajustement
  const [ajustementData, setAjustementData] = useState({
    jours_acquis: 0,
    solde_initial: 0,
    commentaire: '',
  });

  // Années disponibles
  const anneesDisponibles = useMemo(() => {
    const anneeActuelle = new Date().getFullYear();
    return [anneeActuelle - 2, anneeActuelle - 1, anneeActuelle, anneeActuelle + 1];
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [filtreAnnee]);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [soldesRes, empRes] = await Promise.all([
        AxiosInstance.get(`/soldes-conges/?annee=${filtreAnnee}`).catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);

      const soldesData = soldesRes.data.results || soldesRes.data || [];
      const empData = empRes.data.results || empRes.data || [];

      setSoldes(soldesData);
      setSoldesFiltres(soldesData);
      setEmployes(empData.filter(e => e.statut === 'actif'));
      setTotalPages(Math.ceil(soldesData.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les soldes de congés');
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // FILTRES
  // ============================================
  useEffect(() => {
    let filtre = soldes;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(s =>
        s.employe_nom?.toLowerCase().includes(terme) ||
        s.employe_matricule?.toLowerCase().includes(terme)
      );
    }

    if (filtreEmploye !== 'all') {
      filtre = filtre.filter(s => String(s.employe) === String(filtreEmploye));
    }

    if (filtreSolde === 'positif') {
      filtre = filtre.filter(s => Number(s.solde_restant) > 5);
    } else if (filtreSolde === 'faible') {
      filtre = filtre.filter(s => Number(s.solde_restant) > 0 && Number(s.solde_restant) <= 5);
    } else if (filtreSolde === 'epuise') {
      filtre = filtre.filter(s => Number(s.solde_restant) <= 0);
    }

    setSoldesFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtreEmploye, filtreSolde, soldes]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return soldesFiltres.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  // ============================================
  // ACTIONS
  // ============================================
  const supprimerSolde = async () => {
    if (!soldeSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/soldes-conges/${soldeSelectionne.id}/`);
      setSoldes(soldes.filter(s => s.id !== soldeSelectionne.id));
      setShowModalSuppression(false);
      setSoldeSelectionne(null);
      setMessageSucces('Solde supprimé avec succès');
      setSucces(true);
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const ouvrirAjustement = (solde) => {
    setSoldeSelectionne(solde);
    setAjustementData({
      jours_acquis: solde.jours_acquis || 0,
      solde_initial: solde.solde_initial || 0,
      commentaire: '',
    });
    setShowModalAjustement(true);
  };

  const sauvegarderAjustement = async () => {
    if (!soldeSelectionne) return;
    setChargementAction(true);
    try {
      const nouveauxJoursAcquis = Number(ajustementData.jours_acquis);
      const nouveauSoldeInitial = Number(ajustementData.solde_initial);
      const joursPris = Number(soldeSelectionne.jours_pris) || 0;
      const nouveauSoldeRestant = nouveauSoldeInitial + nouveauxJoursAcquis - joursPris;

      await AxiosInstance.patch(`/soldes-conges/${soldeSelectionne.id}/`, {
        jours_acquis: nouveauxJoursAcquis,
        solde_initial: nouveauSoldeInitial,
        solde_restant: nouveauSoldeRestant,
      });

      setMessageSucces('Solde mis à jour avec succès');
      setSucces(true);
      setShowModalAjustement(false);
      setSoldeSelectionne(null);
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
  // FORMATAGE
  // ============================================
  const getCouleurSolde = (soldeRestant) => {
    const restant = Number(soldeRestant);
    if (restant <= 0) return { cls: 'text-error', bg: 'bg-error/10', label: 'Épuisé', icon: XCircle };
    if (restant <= 5) return { cls: 'text-warning', bg: 'bg-warning/10', label: 'Faible', icon: AlertTriangle };
    return { cls: 'text-success', bg: 'bg-success/10', label: 'Disponible', icon: CheckCircle };
  };

  const getBadgeSolde = (soldeRestant) => {
    const cfg = getCouleurSolde(soldeRestant);
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  // ============================================
  // STATISTIQUES
  // ============================================
  const stats = useMemo(() => {
    const total = soldes.length;
    const totalAcquis = soldes.reduce((acc, s) => acc + Number(s.jours_acquis || 0), 0);
    const totalPris = soldes.reduce((acc, s) => acc + Number(s.jours_pris || 0), 0);
    const totalRestant = soldes.reduce((acc, s) => acc + Number(s.solde_restant || 0), 0);
    const soldesFaibles = soldes.filter(s => {
      const r = Number(s.solde_restant);
      return r > 0 && r <= 5;
    }).length;
    const soldesEpuises = soldes.filter(s => Number(s.solde_restant) <= 0).length;

    return {
      total,
      totalAcquis,
      totalPris,
      totalRestant,
      soldesFaibles,
      soldesEpuises,
      moyenne: total > 0 ? totalRestant / total : 0,
    };
  }, [soldes]);

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
            <Link to="/conges" className="hover:text-primary">Congés</Link>
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Soldes</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            Soldes de congés
          </h1>
          <p className="text-base-content/60 mt-1">
            Année {filtreAnnee} • {soldesFiltres.length} employé{soldesFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2" disabled={chargementAction}>
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
          <button
            className="btn btn-ghost btn-sm gap-2"
            title="Exporter Excel (à venir)"
            disabled
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATISTIQUES GLOBALES                         */}
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
              <Award className="w-4 h-4 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Jours acquis</p>
              <p className="text-lg font-bold text-info">{stats.totalAcquis.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Jours pris</p>
              <p className="text-lg font-bold text-warning">{stats.totalPris.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Solde total</p>
              <p className="text-lg font-bold text-success">{stats.totalRestant.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Soldes faibles</p>
              <p className="text-lg font-bold text-warning">{stats.soldesFaibles}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Épuisés</p>
              <p className="text-lg font-bold text-error">{stats.soldesEpuises}</p>
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
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un employé (nom, matricule)..."
                  className="input input-bordered w-full pl-10 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            {/* Année */}
            <select
              className="select select-bordered focus:select-primary"
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(Number(e.target.value))}
            >
              {anneesDisponibles.map((y) => (
                <option key={y} value={y}>Année {y}</option>
              ))}
            </select>

            {/* Employé */}
            <select
              className="select select-bordered focus:select-primary"
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

            {/* Solde */}
            <select
              className="select select-bordered focus:select-primary"
              value={filtreSolde}
              onChange={(e) => setFiltreSolde(e.target.value)}
            >
              <option value="all">Tous les soldes</option>
              <option value="positif">Disponibles ({'>'} 5j)</option>
              <option value="faible">Faibles (0-5j)</option>
              <option value="epuise">Épuisés (≤ 0j)</option>
            </select>

            {/* Reset */}
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreEmploye('all');
                setFiltreSolde('all');
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TABLEAU DES SOLDES                            */}
      {/* ============================================ */}
      {soldesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Calculator className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun solde trouvé</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreEmploye !== 'all' || filtreSolde !== 'all'
              ? 'Essayez de modifier vos filtres'
              : `Aucun solde de congés enregistré pour ${filtreAnnee}`}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Solde initial</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Jours acquis</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Jours pris</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Solde restant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">État</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((solde) => {
                  const soldeRestant = Number(solde.solde_restant);
                  const cfg = getCouleurSolde(soldeRestant);
                  const pourcentageUtilise = (Number(solde.solde_initial) + Number(solde.jours_acquis)) > 0
                    ? Math.min(100, (Number(solde.jours_pris) / (Number(solde.solde_initial) + Number(solde.jours_acquis))) * 100)
                    : 0;

                  return (
                    <tr
                      key={solde.id}
                      className={`hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0 ${
                        soldeRestant <= 0 ? 'bg-error/5' :
                        soldeRestant <= 5 ? 'bg-warning/5' : ''
                      }`}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {solde.employe_nom?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/employes/${solde.employe}`}
                              className="font-medium text-sm truncate hover:text-primary transition-colors"
                            >
                              {solde.employe_nom || '—'}
                            </Link>
                            {solde.employe_matricule && (
                              <p className="text-xs text-base-content/40 font-mono">
                                {solde.employe_matricule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium">
                          {Number(solde.solde_initial || 0).toFixed(1)} j
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5 text-success" />
                          <span className="text-sm font-medium text-success">
                            +{Number(solde.jours_acquis || 0).toFixed(1)} j
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Minus className="w-3.5 h-3.5 text-warning" />
                          <span className="text-sm font-medium text-warning">
                            -{Number(solde.jours_pris || 0).toFixed(1)} j
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="min-w-[100px]">
                          <div className={`text-lg font-bold ${cfg.cls}`}>
                            {soldeRestant.toFixed(1)} j
                          </div>
                          {/* Barre de progression */}
                          <div className="w-full bg-base-300 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                soldeRestant <= 0 ? 'bg-error' :
                                soldeRestant <= 5 ? 'bg-warning' : 'bg-success'
                              }`}
                              style={{ width: `${pourcentageUtilise}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>{getBadgeSolde(soldeRestant)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => ouvrirAjustement(solde)}
                            className="btn btn-ghost btn-xs"
                            title="Ajuster le solde"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/conges?employe=${solde.employe}&annee=${filtreAnnee}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir les congés de l'employé"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setSoldeSelectionne(solde);
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
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, soldesFiltres.length)} sur{' '}
                {soldesFiltres.length} soldes
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
      {/* MODAL AJUSTEMENT                              */}
      {/* ============================================ */}
      {showModalAjustement && soldeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalAjustement(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Edit className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Ajuster le solde</h3>
                <p className="text-xs text-base-content/50">
                  {soldeSelectionne.employe_nom} — {filtreAnnee}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-info" />
                    Jours acquis
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full focus:input-primary"
                  value={ajustementData.jours_acquis}
                  onChange={(e) => setAjustementData(prev => ({ ...prev, jours_acquis: e.target.value }))}
                  min="0"
                  step="0.5"
                />
                <label className="label py-0 pt-1">
                  <span className="label-text-alt text-xs text-base-content/50">
                    Jours de congés acquis durant l'année
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-primary" />
                    Solde initial
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full focus:input-primary"
                  value={ajustementData.solde_initial}
                  onChange={(e) => setAjustementData(prev => ({ ...prev, solde_initial: e.target.value }))}
                  min="0"
                  step="0.5"
                />
                <label className="label py-0 pt-1">
                  <span className="label-text-alt text-xs text-base-content/50">
                    Solde reporté de l'année précédente
                  </span>
                </label>
              </div>

              {/* Aperçu du nouveau solde */}
              <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-info" />
                  <span className="text-sm font-medium text-info">Aperçu du nouveau solde</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-base-content/50 mb-1">Initial + Acquis</p>
                    <p className="text-lg font-bold">
                      {(Number(ajustementData.solde_initial || 0) + Number(ajustementData.jours_acquis || 0)).toFixed(1)} j
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 mb-1">Jours pris</p>
                    <p className="text-lg font-bold text-warning">
                      -{Number(soldeSelectionne.jours_pris || 0).toFixed(1)} j
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 mb-1">Nouveau solde</p>
                    <p className={`text-lg font-bold ${
                      (Number(ajustementData.solde_initial || 0) + Number(ajustementData.jours_acquis || 0) - Number(soldeSelectionne.jours_pris || 0)) <= 0
                        ? 'text-error'
                        : (Number(ajustementData.solde_initial || 0) + Number(ajustementData.jours_acquis || 0) - Number(soldeSelectionne.jours_pris || 0)) <= 5
                        ? 'text-warning'
                        : 'text-success'
                    }`}>
                      {(Number(ajustementData.solde_initial || 0) + Number(ajustementData.jours_acquis || 0) - Number(soldeSelectionne.jours_pris || 0)).toFixed(1)} j
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalAjustement(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary flex-1 gap-2"
                  onClick={sauvegarderAjustement}
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
      {showModalSuppression && soldeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le solde</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer le solde de{' '}
                <span className="font-bold">{soldeSelectionne.employe_nom}</span> pour {filtreAnnee} ?
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
                  onClick={supprimerSolde}
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
          .btn, .badge, button, style + * {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SoldeConges;