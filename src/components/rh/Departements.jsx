// pages/departements/Departements.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  UserPlus, Users, Briefcase, DollarSign, LayoutGrid
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Departements = () => {
  const navigate = useNavigate();
  const [departements, setDepartements] = useState([]);
  const [departementsFiltres, setDepartementsFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(10);
  const [departementSelectionne, setDepartementSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDepartements();
  }, []);

  const chargerDepartements = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get('/departements/');
      // Support pagination DRF ou liste brute
      const data = response.data.results || response.data || [];
      setDepartements(data);
      setDepartementsFiltres(data);
      setTotalPages(Math.ceil(data.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les départements');
      }
    } finally {
      setChargement(false);
    }
  };

  // Filtrer
  useEffect(() => {
    let filtre = departements;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(dep =>
        dep.nom?.toLowerCase().includes(terme) ||
        dep.code?.toLowerCase().includes(terme) ||
        dep.description?.toLowerCase().includes(terme) ||
        dep.responsable_nom?.toLowerCase().includes(terme)
      );
    }

    setDepartementsFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, departements]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return departementsFiltres.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  const supprimerDepartement = async () => {
    if (!departementSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/departements/${departementSelectionne.id}/`);
      setDepartements(departements.filter(d => d.id !== departementSelectionne.id));
      setShowModalSuppression(false);
      setDepartementSelectionne(null);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={chargerDepartements} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Départements
          </h1>
          <p className="text-base-content/60 mt-1">
            {departementsFiltres.length} département{departementsFiltres.length > 1 ? 's' : ''} trouvé{departementsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDepartements} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          <Link to="/departements/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Nouveau département
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un département..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => setRecherche('')}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {departementsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-xl">
          <Building2 className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun département trouvé</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche
              ? 'Essayez de modifier votre recherche'
              : 'Commencez par créer un nouveau département'}
          </p>
          <Link to="/departements/ajouter" className="btn btn-primary mt-4">
            Créer un département
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-xl">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200">
                  <th>Département</th>
                  <th>Code</th>
                  <th>Responsable</th>
                  <th>Employés</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((dep) => (
                  <tr key={dep.id} className="hover">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{dep.nom}</p>
                          <p className="text-xs text-base-content/40">ID: {dep.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {dep.code ? (
                        <span className="badge badge-ghost font-mono">{dep.code}</span>
                      ) : (
                        <span className="text-base-content/30">—</span>
                      )}
                    </td>
                    <td>
                      {dep.responsable_nom ? (
                        <span className="text-sm">{dep.responsable_nom}</span>
                      ) : (
                        <span className="text-base-content/30 text-sm">Non défini</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-primary badge-outline gap-1">
                        <Users className="w-3 h-3" />
                        {dep.nombre_employes || 0}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-base-content/60 line-clamp-1 max-w-xs">
                        {dep.description || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Link
                          to={`/departements/${dep.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir les détails"
                        >
                          <Eye className="w-3 h-3" />
                        </Link>
                        <Link
                          to={`/departements/${dep.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => {
                            setDepartementSelectionne(dep);
                            setShowModalSuppression(true);
                          }}
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
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
                {Math.min(pageActuelle * elementsParPage, departementsFiltres.length)} sur{' '}
                {departementsFiltres.length} départements
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
      {showModalSuppression && departementSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le département</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer le département{' '}
                <span className="font-bold">{departementSelectionne.nom}</span> ?
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
                  onClick={supprimerDepartement}
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

export default Departements;