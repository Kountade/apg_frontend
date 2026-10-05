// pages/presences/Presences.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Calendar, Users, Clock, UserCheck, UserX,
  CheckCircle, XCircle, AlertTriangle, Fingerprint,
  TrendingUp, CalendarDays, Sunrise, Sunset
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Presences = () => {
  const navigate = useNavigate();
  const [presences, setPresences] = useState([]);
  const [presencesFiltres, setPresencesFiltres] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreEmploye, setFiltreEmploye] = useState('all');
  const [filtreMois, setFiltreMois] = useState('');
  const [filtreDate, setFiltreDate] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(15);
  const [presenceSelectionnee, setPresenceSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [vueActuelle, setVueActuelle] = useState('aujourdhui'); // 'aujourdhui' | 'historique'

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [presencesRes, empRes] = await Promise.all([
        AxiosInstance.get('/presences/'),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);

      const presencesData = presencesRes.data.results || presencesRes.data || [];
      const empData = empRes.data.results || empRes.data || [];

      setPresences(presencesData);
      setPresencesFiltres(presencesData);
      setEmployes(empData);
      setTotalPages(Math.ceil(presencesData.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les présences');
      }
    } finally {
      setChargement(false);
    }
  };

  const chargerAujourdhui = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get('/presences/aujourdhui/');
      const data = response.data.results || response.data || [];
      setPresences(data);
      setPresencesFiltres(data);
      setTotalPages(Math.ceil(data.length / elementsParPage));
      setVueActuelle('aujourdhui');
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setChargement(false);
    }
  };

  const chargerHistorique = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get('/presences/');
      const data = response.data.results || response.data || [];
      setPresences(data);
      setPresencesFiltres(data);
      setTotalPages(Math.ceil(data.length / elementsParPage));
      setVueActuelle('historique');
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = presences;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(p =>
        p.employe_nom?.toLowerCase().includes(terme) ||
        p.employe_matricule?.toLowerCase().includes(terme) ||
        p.motif?.toLowerCase().includes(terme)
      );
    }

    if (filtreStatut !== 'all') {
      filtre = filtre.filter(p => p.statut === filtreStatut);
    }

    if (filtreEmploye !== 'all') {
      filtre = filtre.filter(p => String(p.employe) === String(filtreEmploye));
    }

    if (filtreMois) {
      filtre = filtre.filter(p => p.date && p.date.startsWith(filtreMois));
    }

    if (filtreDate) {
      filtre = filtre.filter(p => p.date === filtreDate);
    }

    setPresencesFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreEmploye, filtreMois, filtreDate, presences]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return presencesFiltres.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  const supprimerPresence = async () => {
    if (!presenceSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/presences/${presenceSelectionnee.id}/`);
      setPresences(presences.filter(p => p.id !== presenceSelectionnee.id));
      setShowModalSuppression(false);
      setPresenceSelectionnee(null);
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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formaterHeure = (heureStr) => {
    if (!heureStr) return '—';
    return heureStr.slice(0, 5);
  };

  const getBadgeStatut = (statut) => {
    const configs = {
      present: { label: 'Présent', cls: 'badge-success', icon: CheckCircle },
      absent: { label: 'Absent', cls: 'badge-error', icon: XCircle },
      retard: { label: 'Retard', cls: 'badge-warning', icon: Clock },
      mission: { label: 'Mission', cls: 'badge-info', icon: TrendingUp },
      conge: { label: 'Congé', cls: 'badge-primary', icon: CalendarDays },
      repos: { label: 'Repos', cls: 'badge-ghost', icon: Clock },
      depart_anticipe: { label: 'Départ anticipé', cls: 'badge-warning', icon: Sunset },
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
  const aujourdhui = new Date().toISOString().split('T')[0];
  const stats = {
    total: presences.length,
    presents: presences.filter(p => p.statut === 'present').length,
    absents: presences.filter(p => p.statut === 'absent').length,
    retards: presences.filter(p => p.statut === 'retard').length,
    aujourdhui: presences.filter(p => p.date === aujourdhui).length,
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
            <span className="text-primary">Présences</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Présences
          </h1>
          <p className="text-base-content/60 mt-1">
            {presencesFiltres.length} enregistrement{presencesFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          <Link to="/presences/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle présence
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Présents</p>
              <p className="text-lg font-bold text-success">{stats.presents}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <UserX className="w-4 h-4 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Absents</p>
              <p className="text-lg font-bold text-error">{stats.absents}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Retards</p>
              <p className="text-lg font-bold text-warning">{stats.retards}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Aujourd'hui</p>
              <p className="text-lg font-bold text-info">{stats.aujourdhui}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vues rapides */}
      <div className="w-full flex gap-2 mb-6">
        <button
          onClick={chargerAujourdhui}
          className={`btn btn-sm gap-2 ${vueActuelle === 'aujourdhui' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <CalendarDays className="w-4 h-4" />
          Aujourd'hui
        </button>
        <button
          onClick={chargerHistorique}
          className={`btn btn-sm gap-2 ${vueActuelle === 'historique' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Clock className="w-4 h-4" />
          Historique complet
        </button>
        <Link
          to="/pointage"
          className="btn btn-sm btn-outline gap-2 ml-auto"
        >
          <Fingerprint className="w-4 h-4" />
          Pointage
        </Link>
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
                  placeholder="Rechercher un employé, un matricule..."
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
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="present">Présents</option>
              <option value="absent">Absents</option>
              <option value="retard">Retards</option>
              <option value="mission">Missions</option>
              <option value="conge">Congés</option>
              <option value="repos">Repos</option>
              <option value="depart_anticipe">Départs anticipés</option>
            </select>

            <input
              type="date"
              className="input input-bordered input-sm focus:input-primary"
              value={filtreDate}
              onChange={(e) => setFiltreDate(e.target.value)}
              placeholder="Date précise"
              title="Filtrer par date précise"
            />

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
                setFiltreEmploye('all');
                setFiltreMois('');
                setFiltreDate('');
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {presencesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <ClipboardCheck className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune présence trouvée</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreStatut !== 'all' || filtreEmploye !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par enregistrer une présence'}
          </p>
          <Link to="/presences/ajouter" className="btn btn-primary mt-4">
            Enregistrer une présence
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Arrivée</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Départ</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Heures</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((presence) => (
                  <tr key={presence.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0">
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-base-content/40" />
                        <span className="text-sm">{formaterDate(presence.date)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {presence.employe_nom?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {presence.employe_nom || '—'}
                          </p>
                          {presence.employe_matricule && (
                            <p className="text-xs text-base-content/40 font-mono">
                              {presence.employe_matricule}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Sunrise className="w-3.5 h-3.5 text-info" />
                        {formaterHeure(presence.heure_arrivee)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Sunset className="w-3.5 h-3.5 text-warning" />
                        {formaterHeure(presence.heure_depart)}
                      </div>
                    </td>
                    <td>
                      {presence.heures_travaillees > 0 ? (
                        <span className="text-sm font-medium">
                          {Number(presence.heures_travaillees).toFixed(1)}h
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-sm">—</span>
                      )}
                    </td>
                    <td>{getBadgeStatut(presence.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/presences/${presence.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir les détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/presences/${presence.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setPresenceSelectionnee(presence);
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
                {Math.min(pageActuelle * elementsParPage, presencesFiltres.length)} sur{' '}
                {presencesFiltres.length} présences
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
      {showModalSuppression && presenceSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la présence</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer la présence de{' '}
                <span className="font-bold">{presenceSelectionnee.employe_nom}</span>{' '}
                du {formaterDate(presenceSelectionnee.date)} ?
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
                  onClick={supprimerPresence}
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

export default Presences;