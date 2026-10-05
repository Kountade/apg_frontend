// pages/employes/Employes.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Briefcase, Phone, Mail, Calendar,
  UserCheck, UserX, UserPlus, CheckCircle, XCircle,
  TrendingUp, DollarSign, MapPin
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Employes = () => {
  const navigate = useNavigate();
  const [employes, setEmployes] = useState([]);
  const [employesFiltres, setEmployesFiltres] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [postes, setPostes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreDepartement, setFiltreDepartement] = useState('all');
  const [filtrePoste, setFiltrePoste] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreContrat, setFiltreContrat] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(10);
  const [employeSelectionne, setEmployeSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [empRes, depRes, posRes] = await Promise.all([
        AxiosInstance.get('/employes/'),
        AxiosInstance.get('/departements/').catch(() => ({ data: [] })),
        AxiosInstance.get('/postes/').catch(() => ({ data: [] })),
      ]);

      const empData = empRes.data.results || empRes.data || [];
      const depData = depRes.data.results || depRes.data || [];
      const posData = posRes.data.results || posRes.data || [];

      setEmployes(empData);
      setEmployesFiltres(empData);
      setDepartements(depData);
      setPostes(posData);
      setTotalPages(Math.ceil(empData.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les employés');
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = employes;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(e =>
        e.nom?.toLowerCase().includes(terme) ||
        e.prenom?.toLowerCase().includes(terme) ||
        e.matricule?.toLowerCase().includes(terme) ||
        e.email?.toLowerCase().includes(terme) ||
        e.telephone?.toLowerCase().includes(terme) ||
        e.poste_nom?.toLowerCase().includes(terme) ||
        e.departement_nom?.toLowerCase().includes(terme)
      );
    }

    if (filtreDepartement !== 'all') {
      filtre = filtre.filter(e => String(e.departement) === String(filtreDepartement));
    }

    if (filtrePoste !== 'all') {
      filtre = filtre.filter(e => String(e.poste) === String(filtrePoste));
    }

    if (filtreStatut !== 'all') {
      filtre = filtre.filter(e => e.statut === filtreStatut);
    }

    if (filtreContrat !== 'all') {
      filtre = filtre.filter(e => e.type_contrat === filtreContrat);
    }

    setEmployesFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtreDepartement, filtrePoste, filtreStatut, filtreContrat, employes]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return employesFiltres.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  const supprimerEmploye = async () => {
    if (!employeSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/employes/${employeSelectionne.id}/`);
      setEmployes(employes.filter(e => e.id !== employeSelectionne.id));
      setShowModalSuppression(false);
      setEmployeSelectionne(null);
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

  const getBadgeStatut = (statut) => {
    const configs = {
      actif: { label: 'Actif', cls: 'badge-success' },
      suspendu: { label: 'Suspendu', cls: 'badge-warning' },
      parti: { label: 'Parti', cls: 'badge-ghost' },
    };
    const cfg = configs[statut] || { label: statut, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls} badge-sm`}>{cfg.label}</span>;
  };

  const getBadgeContrat = (type) => {
    const configs = {
      CDI: 'badge-primary',
      CDD: 'badge-info',
      STAGE: 'badge-warning',
      TEMPORAIRE: 'badge-ghost',
    };
    return <span className={`badge ${configs[type] || 'badge-ghost'} badge-sm badge-outline`}>{type}</span>;
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
    total: employes.length,
    actifs: employes.filter(e => e.statut === 'actif').length,
    suspendus: employes.filter(e => e.statut === 'suspendu').length,
    cdi: employes.filter(e => e.type_contrat === 'CDI').length,
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
            <span className="text-primary">Employés</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Employés
          </h1>
          <p className="text-base-content/60 mt-1">
            {employesFiltres.length} employé{employesFiltres.length > 1 ? 's' : ''} trouvé{employesFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          <Link to="/employes/ajouter" className="btn btn-primary gap-2">
            <UserPlus className="w-5 h-5" />
            Nouvel employé
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <UserX className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Suspendus</p>
              <p className="text-xl font-bold text-warning">{stats.suspendus}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">CDI</p>
              <p className="text-xl font-bold text-info">{stats.cdi}</p>
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
                  placeholder="Rechercher par nom, matricule, email, téléphone..."
                  className="input input-bordered w-full pl-10 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

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

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtrePoste}
              onChange={(e) => setFiltrePoste(e.target.value)}
            >
              <option value="all">Tous les postes</option>
              {postes.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="suspendu">Suspendus</option>
              <option value="parti">Partis</option>
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreContrat}
              onChange={(e) => setFiltreContrat(e.target.value)}
            >
              <option value="all">Tous les contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="TEMPORAIRE">Temporaire</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreDepartement('all');
                setFiltrePoste('all');
                setFiltreStatut('all');
                setFiltreContrat('all');
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {employesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Users className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun employé trouvé</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreDepartement !== 'all' || filtrePoste !== 'all' || filtreStatut !== 'all' || filtreContrat !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par créer un nouvel employé'}
          </p>
          <Link to="/employes/ajouter" className="btn btn-primary mt-4">
            Créer un employé
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Contact</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Poste</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Département</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Contrat</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((employe) => (
                  <tr key={employe.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0">
                    <td>
                      <div className="flex items-center gap-3">
                        {employe.photo ? (
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              <img src={employe.photo} alt={employe.nom} />
                            </div>
                          </div>
                        ) : (
                          <div className="avatar placeholder">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {employe.prenom?.charAt(0)?.toUpperCase() || '?'}
                                {employe.nom?.charAt(0)?.toUpperCase() || ''}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {employe.prenom} {employe.nom}
                          </p>
                          <p className="text-xs text-base-content/40 font-mono">
                            {employe.matricule || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs space-y-0.5">
                        {employe.telephone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-base-content/40" />
                            {employe.telephone}
                          </p>
                        )}
                        {employe.email && (
                          <p className="flex items-center gap-1.5 text-base-content/60 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-base-content/40 flex-shrink-0" />
                            <span className="truncate">{employe.email}</span>
                          </p>
                        )}
                        {!employe.telephone && !employe.email && (
                          <span className="text-base-content/30">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {employe.poste_nom ? (
                        <span className="text-sm">{employe.poste_nom}</span>
                      ) : (
                        <span className="text-base-content/30 text-sm">—</span>
                      )}
                    </td>
                    <td>
                      {employe.departement_nom ? (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <Building2 className="w-3 h-3" />
                          {employe.departement_nom}
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-sm">—</span>
                      )}
                    </td>
                    <td>{getBadgeContrat(employe.type_contrat)}</td>
                    <td>{getBadgeStatut(employe.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/employes/${employe.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir les détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/employes/${employe.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setEmployeSelectionne(employe);
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
                {Math.min(pageActuelle * elementsParPage, employesFiltres.length)} sur{' '}
                {employesFiltres.length} employés
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
      {showModalSuppression && employeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'employé</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer l'employé{' '}
                <span className="font-bold">{employeSelectionne.prenom} {employeSelectionne.nom}</span> ?
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
                  onClick={supprimerEmploye}
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

export default Employes;