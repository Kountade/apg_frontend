// src/components/stocks/CategoriesArticles.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tags, Search, Plus, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, Shield, Wrench, Package, Boxes
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  epi:         { label: 'EPI',           color: 'primary',   icon: Shield },
  outil:       { label: 'Outil',         color: 'info',      icon: Wrench },
  consommable: { label: 'Consommable',   color: 'warning',   icon: Package },
  piece:       { label: 'Pièce détachée',color: 'secondary', icon: Boxes },
  equipement:  { label: 'Équipement',    color: 'success',   icon: Tags },
  autre:       { label: 'Autre',         color: 'ghost',     icon: Tags },
};

const CategoriesArticles = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesFiltrees, setCategoriesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [catSelectionnee, setCatSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerCategories();
  }, []);

  const chargerCategories = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/categories-materiel/');
      const data = res.data.results || res.data || [];
      setCategories(data);
      setCategoriesFiltrees(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les catégories');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = categories;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.nom?.toLowerCase().includes(terme) ||
        c.code?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(c => c.type === filtreType);
    setCategoriesFiltrees(filtre);
  }, [recherche, filtreType, categories]);

  const supprimer = async () => {
    if (!catSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/categories-materiel/${catSelectionnee.id}/`);
      setCategories(categories.filter(c => c.id !== catSelectionnee.id));
      setShowModalSuppression(false);
      setCatSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || TYPES_CONFIG.autre;
    const Icon = cfg.icon;
    return (
      <span className={`badge badge-${cfg.color} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const filtresActifs = recherche || filtreType !== 'all';

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
        <button onClick={chargerCategories} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <Tags className="w-3 h-3" /> Logistique / Catégories
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Tags className="w-8 h-8 text-primary" />
            Catégories de matériel
          </h1>
          <p className="text-base-content/60 mt-1">
            {categoriesFiltrees.length} catégorie{categoriesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && categories.length !== categoriesFiltrees.length && (
              <span className="text-base-content/40"> (sur {categories.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerCategories} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/categories-articles/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle catégorie
          </Link>
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
                  placeholder="Rechercher par nom, code..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPES_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreType('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {categoriesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Tags className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune catégorie ne correspond' : 'Aucune catégorie'}
          </p>
          <Link to="/categories-articles/ajouter" className="btn btn-primary mt-4">
            Créer une catégorie
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesFiltrees.map(c => {
            const cfg = TYPES_CONFIG[c.type] || TYPES_CONFIG.autre;
            const Icon = cfg.icon;
            return (
              <div key={c.id} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-${cfg.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 text-${cfg.color}`} />
                    </div>
                    <span className={`badge ${c.actif ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                      {c.actif ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base mb-1 truncate">{c.nom}</h3>
                  {c.code && (
                    <p className="text-xs font-mono text-base-content/50 mb-2">{c.code}</p>
                  )}
                  <div className="mb-2">{getBadgeType(c.type)}</div>
                  {c.description && (
                    <p className="text-xs text-base-content/60 line-clamp-2">{c.description}</p>
                  )}
                  <div className="divider my-3"></div>
                  <div className="flex gap-2">
                    <Link
                      to={`/categories-articles/${c.id}/modifier`}
                      className="btn btn-ghost btn-sm flex-1 gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Modifier
                    </Link>
                    <button
                      onClick={() => {
                        setCatSelectionnee(c);
                        setShowModalSuppression(true);
                      }}
                      className="btn btn-ghost btn-sm text-error"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && catSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la catégorie</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{catSelectionnee.nom}</strong> ?
                <br />
                <span className="text-sm">Les articles liés ne seront pas supprimés.</span>
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
                  onClick={supprimer}
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

export default CategoriesArticles;