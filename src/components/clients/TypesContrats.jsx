// components/contrats/TypesContrats.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Search, Plus, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, ChevronLeft, ChevronRight, Calculator,
  CheckCircle, XCircle, Clock, FileSignature, Shield, Briefcase,
  Building2, Lock, Hash, Calendar, Timer, Eye, Info, BookOpen,
  FileText, Download, FileDown, UserCheck, TrendingUp, Percent
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Config catégories
// ============================================================
const CATEGORIES_CONFIG = {
  emploi:       { label: 'Contrat de travail',      icon: Briefcase,     color: 'primary' },
  client:       { label: 'Contrat client',          icon: Building2,     color: 'info' },
  fournisseur:  { label: 'Contrat fournisseur',     icon: Building2,     color: 'secondary' },
  partenariat:  { label: 'Partenariat',             icon: Shield,        color: 'accent' },
  bail:         { label: 'Bail / location',         icon: FileSignature, color: 'warning' },
  maintenance:  { label: 'Maintenance',             icon: FileText,      color: 'success' },
  autre:        { label: 'Autre',                   icon: FileText,      color: 'ghost' },
};

const STATUTS_CONFIG = {
  actif:   { label: 'Actif',   cls: 'badge-success', icon: CheckCircle },
  inactif: { label: 'Inactif', cls: 'badge-warning', icon: Clock },
  archive: { label: 'Archivé', cls: 'badge-ghost',   icon: Lock },
};

const TypesContrats = () => {
  const [types, setTypes] = useState([]);
  const [typesFiltres, setTypesFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [typeSelectionne, setTypeSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  // ------------------------------------------------------------
  // Chargement
  // ------------------------------------------------------------
  useEffect(() => {
    chargerTypes();
  }, []);

  const chargerTypes = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/types-contrats/');
      const data = res.data.results || res.data || [];
      setTypes(data);
      setTypesFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les types de contrats');
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Filtrage
  // ------------------------------------------------------------
  useEffect(() => {
    let filtre = types;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(t =>
        t.code?.toLowerCase().includes(terme) ||
        t.titre?.toLowerCase().includes(terme) ||
        t.description?.toLowerCase().includes(terme)
      );
    }
    if (filtreCategorie !== 'all') filtre = filtre.filter(t => t.categorie === filtreCategorie);
    if (filtreStatut !== 'all') filtre = filtre.filter(t => t.statut === filtreStatut);
    setTypesFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreCategorie, filtreStatut, types]);

  const totalPages = Math.ceil(typesFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return typesFiltres.slice(debut, debut + elementsParPage);
  };

  // ------------------------------------------------------------
  // Suppression
  // ------------------------------------------------------------
  const supprimerType = async () => {
    if (!typeSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/types-contrats/${typeSelectionne.id}/`);
      setTypes(types.filter(t => t.id !== typeSelectionne.id));
      setShowModalSuppression(false);
      setTypeSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // ------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------
  const stats = useMemo(() => ({
    total: types.length,
    actifs: types.filter(t => t.statut === 'actif').length,
    emploi: types.filter(t => t.categorie === 'emploi').length,
    client: types.filter(t => t.categorie === 'client').length,
  }), [types]);

  const filtresActifs = recherche || filtreCategorie !== 'all' || filtreStatut !== 'all';

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const getCategorieCfg = (cat) => CATEGORIES_CONFIG[cat] || CATEGORIES_CONFIG.autre;
  const getStatutCfg = (statut) => STATUTS_CONFIG[statut] || STATUTS_CONFIG.actif;

  // ------------------------------------------------------------
  // Rendu : chargement / erreur
  // ------------------------------------------------------------
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
        <button onClick={chargerTypes} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full p-6">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Contrats
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Référentiel</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Layers className="w-8 h-8 text-primary" />
            Types de contrats
          </h1>
          <p className="text-base-content/60 mt-1">
            {typesFiltres.length} type{typesFiltres.length > 1 ? 's' : ''} de contrat{typesFiltres.length > 1 ? 's' : ''} disponible{typesFiltres.length > 1 ? 's' : ''}
            {filtresActifs && types.length !== typesFiltres.length && (
              <span className="text-base-content/40"> (sur {types.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerTypes} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/types-contrats/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau type
          </Link>
        </div>
      </div>

      {/* ============ INFO ============ */}
      <div className="alert alert-info mb-6">
        <Info className="w-5 h-5" />
        <div>
          <p className="font-bold">Référentiel centralisé</p>
          <p className="text-sm">
            Les types de contrats définis ici sont <strong>réutilisables</strong>.
            Lors de la signature d'un contrat (employé ou client), il suffit de
            <strong> choisir un type</strong> existant, sans ressaisir le contenu.
          </p>
        </div>
      </div>

      {/* ============ STATS ============ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileSignature className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total</p>
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
              <p className="text-xs text-base-content/50 uppercase">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Emploi</p>
              <p className="text-xl font-bold text-info">{stats.emploi}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Client</p>
              <p className="text-xl font-bold text-secondary">{stats.client}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ FILTRES ============ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, code, description..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
            >
              <option value="all">Toutes les catégories</option>
              {Object.entries(CATEGORIES_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUTS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreCategorie('all');
                  setFiltreStatut('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============ LISTE ============ */}
      {typesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Layers className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun type ne correspond aux filtres' : 'Aucun type de contrat défini'}
          </p>
          {filtresActifs ? (
            <button
              className="btn btn-ghost mt-4"
              onClick={() => {
                setRecherche('');
                setFiltreCategorie('all');
                setFiltreStatut('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          ) : (
            <Link to="/types-contrats/ajouter" className="btn btn-primary mt-4">
              Créer un type de contrat
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Code</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Titre</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Catégorie</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Durée</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Essai</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((t) => {
                  const catCfg = getCategorieCfg(t.categorie);
                  const statutCfg = getStatutCfg(t.statut);
                  const IconCat = catCfg.icon;
                  const IconStatut = statutCfg.icon;

                  return (
                    <tr key={t.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <span className="font-mono text-sm font-bold text-primary">
                          {t.code}
                        </span>
                      </td>
                      <td>
                        <p className="font-medium truncate max-w-[280px]">{t.titre}</p>
                        {t.description && (
                          <p className="text-xs text-base-content/40 truncate max-w-[280px]">
                            {t.description}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${catCfg.color} badge-sm gap-1`}>
                          <IconCat className="w-3 h-3" />
                          {catCfg.label}
                        </span>
                      </td>
                      <td className="text-center">
                        {t.duree_mois ? (
                          <span className="badge badge-ghost badge-sm font-mono gap-1">
                            <Calendar className="w-3 h-3" />
                            {t.duree_mois} mois
                          </span>
                        ) : (
                          <span className="text-base-content/30 text-xs">Indéterminée</span>
                        )}
                      </td>
                      <td className="text-center">
                        {t.periode_essai_jours ? (
                          <span className="badge badge-ghost badge-sm font-mono gap-1">
                            <Timer className="w-3 h-3" />
                            {t.periode_essai_jours}j
                          </span>
                        ) : (
                          <span className="text-base-content/30 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${statutCfg.cls} badge-sm gap-1`}>
                          <IconStatut className="w-3 h-3" />
                          {statutCfg.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/types-contrats/${t.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/types-contrats/${t.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setTypeSelectionne(t);
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
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, typesFiltres.length)} sur{' '}
                {typesFiltres.length} type{typesFiltres.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`btn btn-sm ${pageActuelle === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPageActuelle(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
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

      {/* ============ MODAL SUPPRESSION ============ */}
      {showModalSuppression && typeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalSuppression(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le type de contrat</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{typeSelectionne.titre}</strong> ?
                <br />
                <span className="text-sm">
                  Les contrats existants qui l'utilisent ne seront pas supprimés.
                </span>
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
                  onClick={supprimerType}
                  disabled={chargementAction}
                >
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypesContrats;