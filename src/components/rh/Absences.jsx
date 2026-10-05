// pages/absences/Absences.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, Search, Plus, Edit, Trash2, Eye, Loader2,
  RefreshCw, Filter, ChevronLeft, ChevronRight, Building2,
  Calendar, Users, Clock, CheckCircle, XCircle, AlertTriangle,
  FileText, UserX, TrendingDown, CalendarDays, UserCheck,
  Stethoscope, Shield, FileWarning
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Absences = () => {
  const navigate = useNavigate();
  const [absences, setAbsences] = useState([]);
  const [absencesFiltres, setAbsencesFiltres] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreEmploye, setFiltreEmploye] = useState('all');
  const [filtreMois, setFiltreMois] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(10);
  const [absenceSelectionnee, setAbsenceSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [absRes, empRes] = await Promise.all([
        AxiosInstance.get('/absences/'),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);

      const absData = absRes.data.results || absRes.data || [];
      const empData = empRes.data.results || empRes.data || [];

      setAbsences(absData);
      setAbsencesFiltres(absData);
      setEmployes(empData);
      setTotalPages(Math.ceil(absData.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les absences');
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = absences;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.employe_nom?.toLowerCase().includes(terme) ||
        a.employe_matricule?.toLowerCase().includes(terme) ||
        a.motif?.toLowerCase().includes(terme)
      );
    }

    if (filtreStatut !== 'all') {
      filtre = filtre.filter(a => a.statut === filtreStatut);
    }

    if (filtreType !== 'all') {
      filtre = filtre.filter(a => a.type === filtreType);
    }

    if (filtreEmploye !== 'all') {
      filtre = filtre.filter(a => String(a.employe) === String(filtreEmploye));
    }

    if (filtreMois) {
      filtre = filtre.filter(a => a.date_debut && a.date_debut.startsWith(filtreMois));
    }

    setAbsencesFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreType, filtreEmploye, filtreMois, absences]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return absencesFiltres.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  const supprimerAbsence = async () => {
    if (!absenceSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/absences/${absenceSelectionnee.id}/`);
      setAbsences(absences.filter(a => a.id !== absenceSelectionnee.id));
      setShowModalSuppression(false);
      setAbsenceSelectionnee(null);
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

  const calculerDuree = (debut, fin) => {
    if (!debut || !fin) return 0;
    const diff = Math.ceil((new Date(fin) - new Date(debut)) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  const getBadgeStatut = (statut) => {
    const configs = {
      en_attente: { label: 'En attente', cls: 'badge-warning', icon: Clock },
      valide: { label: 'Validé', cls: 'badge-success', icon: CheckCircle },
      refuse: { label: 'Refusé', cls: 'badge-error', icon: XCircle },
    };
    const cfg = configs[statut] || { label: statut, cls: 'badge-ghost', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeType = (type) => {
    const configs = {
      maladie: { label: 'Maladie', cls: 'badge-error', icon: Stethoscope },
      injustifiee: { label: 'Injustifiée', cls: 'badge-warning', icon: AlertTriangle },
      autorisee: { label: 'Autorisée', cls: 'badge-info', icon: Shield },
    };
    const cfg = configs[type] || { label: type, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm badge-outline gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
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
  const stats = {
    total: absences.length,
    enAttente: absences.filter(a => a.statut === 'en_attente').length,
    validees: absences.filter(a => a.statut === 'valide').length,
    refusees: absences.filter(a => a.statut === 'refuse').length,
    maladie: absences.filter(a => a.type === 'maladie').length,
  };

  return (
    <div className="w-full p-6">

      {/* En-tête */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Absences</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-warning" />
            Absences
          </h1>
          <p className="text-base-content/60 mt-1">
            {absencesFiltres.length} absence{absencesFiltres.length > 1 ? 's' : ''} enregistrée{absencesFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          <Link to="/absences/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle absence
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">En attente</p>
              <p className="text-xl font-bold text-warning">{stats.enAttente}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Validées</p>
              <p className="text-xl font-bold text-success">{stats.validees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Refusées</p>
              <p className="text-xl font-bold text-error">{stats.refusees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Maladie</p>
              <p className="text-xl font-bold text-info">{stats.maladie}</p>
            </div>
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
                  placeholder="Rechercher un employé, un motif..."
                  className="input input-bordered w-full pl-10 focus:input-primary"
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
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="maladie">Maladie</option>
              <option value="injustifiee">Injustifiée</option>
              <option value="autorisee">Autorisée</option>
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validées</option>
              <option value="refuse">Refusées</option>
            </select>

            <input
              type="month"
              className="input input-bordered input-sm focus:input-primary"
              value={filtreMois}
              onChange={(e) => setFiltreMois(e.target.value)}
              title="Filtrer par mois"
            />

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreStatut('all');
                setFiltreType('all');
                setFiltreEmploye('all');
                setFiltreMois('');
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {absencesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <AlertCircle className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune absence trouvée</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreStatut !== 'all' || filtreType !== 'all' || filtreEmploye !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par enregistrer une absence'}
          </p>
          <Link to="/absences/ajouter" className="btn btn-primary mt-4">
            Enregistrer une absence
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Durée</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Motif</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((absence) => {
                  const duree = calculerDuree(absence.date_debut, absence.date_fin);
                  return (
                    <tr key={absence.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-warning">
                              {absence.employe_nom?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {absence.employe_nom || '—'}
                            </p>
                            {absence.employe_matricule && (
                              <p className="text-xs text-base-content/40 font-mono">
                                {absence.employe_matricule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{getBadgeType(absence.type)}</td>
                      <td>
                        <div className="text-xs">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-base-content/40" />
                            {formaterDate(absence.date_debut)}
                          </p>
                          <p className="flex items-center gap-1.5 mt-0.5 text-base-content/50">
                            <span className="w-3"></span>
                            <span>→ {formaterDate(absence.date_fin)}</span>
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {duree} jour{duree > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        {absence.motif ? (
                          <span className="text-xs text-base-content/60 line-clamp-1 max-w-[200px]" title={absence.motif}>
                            {absence.motif}
                          </span>
                        ) : (
                          <span className="text-base-content/30 text-xs">—</span>
                        )}
                      </td>
                      <td>{getBadgeStatut(absence.statut)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/absences/${absence.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir les détails"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/absences/${absence.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setAbsenceSelectionnee(absence);
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, absencesFiltres.length)} sur{' '}
                {absencesFiltres.length} absences
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
      {showModalSuppression && absenceSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'absence</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer l'absence de{' '}
                <span className="font-bold">{absenceSelectionnee.employe_nom}</span> ?
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
                  onClick={supprimerAbsence}
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

export default Absences;