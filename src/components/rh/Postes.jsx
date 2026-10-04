// pages/postes/Postes.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, DollarSign, Users, TrendingUp
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Postes = () => {
  const navigate = useNavigate();
  const [postes, setPostes] = useState([]);
  const [postesFiltres, setPostesFiltres] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreDepartement, setFiltreDepartement] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(10);
  const [posteSelectionne, setPosteSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [postesRes, depRes] = await Promise.all([
        AxiosInstance.get('/postes/'),
        AxiosInstance.get('/departements/').catch(() => ({ data: [] })),
      ]);

      const postesData = postesRes.data.results || postesRes.data || [];
      const depData = depRes.data.results || depRes.data || [];

      setPostes(postesData);
      setPostesFiltres(postesData);
      setDepartements(depData);
      setTotalPages(Math.ceil(postesData.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les postes');
      }
    } finally {
      setChargement(false);
    }
  };

  // Filtres
  useEffect(() => {
    let filtre = postes;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(p =>
        p.nom?.toLowerCase().includes(terme) ||
        p.departement_nom?.toLowerCase().includes(terme) ||
        p.description?.toLowerCase().includes(terme)
      );
    }

    if (filtreDepartement !== 'all') {
      filtre = filtre.filter(p => String(p.departement) === String(filtreDepartement));
    }

    setPostesFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtreDepartement, postes]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return postesFiltres.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  const supprimerPoste = async () => {
    if (!posteSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/postes/${posteSelectionne.id}/`);
      setPostes(postes.filter(p => p.id !== posteSelectionne.id));
      setShowModalSuppression(false);
      setPosteSelectionne(null);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (montant) => {
    if (!montant || montant === '0') return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(montant)) + ' GNF';
  };

  const calculerMoyenne = (min, max) => {
    const minNum = Number(min) || 0;
    const maxNum = Number(max) || 0;
    if (!minNum && !maxNum) return 0;
    if (!minNum) return maxNum;
    if (!maxNum) return minNum;
    return (minNum + maxNum) / 2;
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

  return (
    <div className="w-full p-6">

      {/* En-tête */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Postes</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Postes
          </h1>
          <p className="text-base-content/60 mt-1">
            {postesFiltres.length} poste{postesFiltres.length > 1 ? 's' : ''} trouvé{postesFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          <Link to="/postes/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Nouveau poste
          </Link>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Total postes</p>
              <p className="text-2xl font-bold">{postes.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Départements</p>
              <p className="text-2xl font-bold">{departements.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Salaire moyen</p>
              <p className="text-2xl font-bold">
                {postes.length > 0
                  ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
                      postes.reduce((acc, p) => acc + calculerMoyenne(p.salaire_min, p.salaire_max), 0) / postes.length
                    ) + ' GNF'
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un poste, un département..."
                  className="input input-bordered w-full pl-10 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered focus:select-primary"
              value={filtreDepartement}
              onChange={(e) => setFiltreDepartement(e.target.value)}
            >
              <option value="all">Tous les départements</option>
              {departements.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.nom}
                </option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreDepartement('all');
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {postesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Briefcase className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun poste trouvé</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreDepartement !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par créer un nouveau poste'}
          </p>
          <Link to="/postes/ajouter" className="btn btn-primary mt-4">
            Créer un poste
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Poste</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Département</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Fourchette salariale</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employés</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((poste) => (
                  <tr key={poste.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{poste.nom}</p>
                          {poste.description && (
                            <p className="text-xs text-base-content/40 line-clamp-1 max-w-xs">
                              {poste.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {poste.departement_nom ? (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <Building2 className="w-3 h-3" />
                          {poste.departement_nom}
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-sm">—</span>
                      )}
                    </td>
                    <td>
                      {poste.salaire_min || poste.salaire_max ? (
                        <div className="text-sm">
                          <p className="font-medium">
                            {formaterMontant(poste.salaire_min)}
                            {poste.salaire_max && poste.salaire_max !== poste.salaire_min && (
                              <span className="text-base-content/50"> → {formaterMontant(poste.salaire_max)}</span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-base-content/30 text-sm">Non défini</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-primary badge-outline gap-1">
                        <Users className="w-3 h-3" />
                        {poste.nombre_employes || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/postes/${poste.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir les détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/postes/${poste.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setPosteSelectionne(poste);
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, postesFiltres.length)} sur{' '}
                {postesFiltres.length} postes
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
      {showModalSuppression && posteSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le poste</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer le poste{' '}
                <span className="font-bold">{posteSelectionne.nom}</span> ?
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
                  onClick={supprimerPoste}
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

export default Postes;