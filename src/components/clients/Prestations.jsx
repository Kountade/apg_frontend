// components/clients/Prestations.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Search, Plus, Edit, Trash2, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, DollarSign, FilePlus, CheckCircle, XCircle,
  Package, TrendingUp, Hash, Tag
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Prestations = () => {
  const navigate = useNavigate();
  const [prestations, setPrestations] = useState([]);
  const [prestationsFiltrees, setPrestationsFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [prestationSelectionnee, setPrestationSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerPrestations();
  }, []);

  const chargerPrestations = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/prestations/');
      const data = res.data.results || res.data || [];
      setPrestations(data);
      setPrestationsFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les prestations');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = prestations;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(p =>
        p.code?.toLowerCase().includes(terme) ||
        p.nom?.toLowerCase().includes(terme) ||
        p.description?.toLowerCase().includes(terme) ||
        p.unite?.toLowerCase().includes(terme)
      );
    }

    if (filtreActif !== 'all') {
      const actif = filtreActif === 'actif';
      filtre = filtre.filter(p => p.actif === actif);
    }

    setPrestationsFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreActif, prestations]);

  const totalPages = Math.ceil(prestationsFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return prestationsFiltrees.slice(debut, debut + elementsParPage);
  };

  const supprimerPrestation = async () => {
    if (!prestationSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/prestations/${prestationSelectionnee.id}/`);
      setPrestations(prestations.filter(p => p.id !== prestationSelectionnee.id));
      setShowModalSuppression(false);
      setPrestationSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) === 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
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
        <button onClick={chargerPrestations} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  const stats = {
    total: prestations.length,
    actives: prestations.filter(p => p.actif).length,
    inactives: prestations.filter(p => !p.actif).length,
    tarifMoyen: prestations.length > 0
      ? prestations.reduce((sum, p) => sum + Number(p.tarif_base || 0), 0) / prestations.length
      : 0,
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Clients & Contrats
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Prestations</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Catalogue des prestations
          </h1>
          <p className="text-base-content/60 mt-1">
            {prestationsFiltrees.length} prestation{prestationsFiltrees.length > 1 ? 's' : ''} trouvée{prestationsFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerPrestations} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/prestations/ajouter" className="btn btn-primary gap-2">
            <FilePlus className="w-5 h-5" /> Nouvelle prestation
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-primary" />
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
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Actives</p>
              <p className="text-xl font-bold text-success">{stats.actives}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ghost/10 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-base-content/50" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Inactives</p>
              <p className="text-xl font-bold">{stats.inactives}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Tarif moyen</p>
              <p className="text-sm font-bold text-warning truncate">
                {formaterMontant(stats.tarifMoyen)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par code, nom, description..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreActif}
              onChange={(e) => setFiltreActif(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="actif">Actives uniquement</option>
              <option value="inactif">Inactives uniquement</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreActif('all');
              }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {prestationsFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Briefcase className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune prestation trouvée</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreActif !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par créer une nouvelle prestation'}
          </p>
          <Link to="/prestations/ajouter" className="btn btn-primary mt-4">
            Créer une prestation
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Code</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Prestation</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Description</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Tarif de base</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Unité</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((prestation) => (
                  <tr key={prestation.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <span className="font-mono text-sm font-medium flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 text-base-content/40" />
                        {prestation.code}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[200px]">{prestation.nom}</p>
                    </td>
                    <td>
                      <p className="text-sm text-base-content/60 truncate max-w-[280px]">
                        {prestation.description || '—'}
                      </p>
                    </td>
                    <td>
                      <span className="font-mono text-sm">{formaterMontant(prestation.tarif_base)}</span>
                    </td>
                    <td>
                      {prestation.unite ? (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <Tag className="w-3 h-3" />
                          {prestation.unite}
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-sm">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${prestation.actif ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                        {prestation.actif ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/prestations/${prestation.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setPrestationSelectionnee(prestation);
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
                {Math.min(pageActuelle * elementsParPage, prestationsFiltrees.length)} sur{' '}
                {prestationsFiltrees.length} prestations
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
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
                      onClick={() => setPageActuelle(numPage)}
                    >
                      {numPage}
                    </button>
                  );
                })}
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle + 1)}
                  disabled={pageActuelle === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && prestationSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la prestation</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer{' '}
                <span className="font-bold">{prestationSelectionnee.nom}</span> ?
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
                  onClick={supprimerPrestation}
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

export default Prestations;