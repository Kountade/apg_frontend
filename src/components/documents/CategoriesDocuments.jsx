// src/components/documents/CategoriesDocuments.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, Search, Plus, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, Folder, FileText, Layers, ChevronRight,
  ChevronDown, Info
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  rh:            { label: 'Ressources Humaines', color: 'primary' },
  comptable:     { label: 'Comptabilité',        color: 'warning' },
  client:        { label: 'Client',              color: 'info' },
  fournisseur:   { label: 'Fournisseur',         color: 'secondary' },
  vehicule:      { label: 'Véhicule',            color: 'success' },
  exploitation:  { label: 'Exploitation',        color: 'error' },
  contrat:       { label: 'Contrat',             color: 'primary' },
  facture:       { label: 'Facture',             color: 'warning' },
  administratif: { label: 'Administratif',       color: 'ghost' },
  autre:         { label: 'Autre',               color: 'ghost' },
};

const CategoriesDocuments = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesFiltrees, setCategoriesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [vue, setVue] = useState('liste'); // liste | arbre
  const [selectionne, setSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/categories-documents/?page_size=500');
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
        c.code?.toLowerCase().includes(terme) ||
        c.description?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') {
      filtre = filtre.filter(c => c.type === filtreType);
    }
    setCategoriesFiltrees(filtre);
  }, [recherche, filtreType, categories]);

  const supprimer = async () => {
    if (!selectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/categories-documents/${selectionne.id}/`);
      setCategories(categories.filter(c => c.id !== selectionne.id));
      setShowModalSuppression(false);
      setSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la suppression (peut-être utilisée par des documents)');
    } finally {
      setChargementAction(false);
    }
  };

  // Construire l'arbre hiérarchique
  const construireArbre = () => {
    const racines = categoriesFiltrees.filter(c => !c.parent);
    const enfantsDe = (parentId) => categoriesFiltrees.filter(c => c.parent === parentId);

    const renderNode = (cat, niveau = 0) => {
      const enfants = enfantsDe(cat.id);
      const typeCfg = TYPES_CONFIG[cat.type] || TYPES_CONFIG.autre;
      return (
        <div key={cat.id} style={{ marginLeft: `${niveau * 20}px` }} className="py-1">
          <div className="flex items-center gap-2 group hover:bg-base-200/50 rounded-lg p-2">
            {niveau > 0 && <ChevronRight className="w-3 h-3 text-base-content/40" />}
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-base-content/50">{cat.code}</span>
            <span className="text-sm font-medium">{cat.nom}</span>
            <span className={`badge badge-${typeCfg.color} badge-xs`}>{typeCfg.label}</span>
            <span className="badge badge-ghost badge-xs">{cat.nombre_documents} doc.</span>
            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link to={`/categories-documents/${cat.id}/modifier`} className="btn btn-ghost btn-xs">
                <Edit className="w-3 h-3" />
              </Link>
              <button onClick={() => { setSelectionne(cat); setShowModalSuppression(true); }} className="btn btn-ghost btn-xs text-error">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {enfants.length > 0 && enfants.map(e => renderNode(e, niveau + 1))}
        </div>
      );
    };

    return racines.map(r => renderNode(r));
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
        <button onClick={charger} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <FolderOpen className="w-3 h-3" /> Documents / Catégories
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary" />
            Catégories de documents
          </h1>
          <p className="text-base-content/60 mt-1">
            {categoriesFiltrees.length} catégorie{categoriesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && categories.length !== categoriesFiltrees.length && (
              <span className="text-base-content/40"> (sur {categories.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="join">
            <button
              onClick={() => setVue('liste')}
              className={`btn btn-sm join-item gap-1 ${vue === 'liste' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Layers className="w-4 h-4" /> Liste
            </button>
            <button
              onClick={() => setVue('arbre')}
              className={`btn btn-sm join-item gap-1 ${vue === 'arbre' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Folder className="w-4 h-4" /> Arbre
            </button>
          </div>
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/categories-documents/ajouter" className="btn btn-primary gap-2">
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
              <option value="all">Tous types</option>
              {Object.entries(TYPES_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => { setRecherche(''); setFiltreType('all'); }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VUE LISTE */}
      {vue === 'liste' && (
        categoriesFiltrees.length === 0 ? (
          <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
            <FolderOpen className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
            <p className="text-xl text-base-content/60">
              {filtresActifs ? 'Aucune catégorie ne correspond' : 'Aucune catégorie'}
            </p>
            <Link to="/categories-documents/ajouter" className="btn btn-primary mt-4">
              Créer une catégorie
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase">Code</th>
                  <th className="text-xs uppercase">Nom</th>
                  <th className="text-xs uppercase">Type</th>
                  <th className="text-xs uppercase">Parent</th>
                  <th className="text-xs uppercase text-center">Ordre</th>
                  <th className="text-xs uppercase text-center">Documents</th>
                  <th className="text-xs uppercase text-center">Statut</th>
                  <th className="text-xs uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesFiltrees.map(c => {
                  const typeCfg = TYPES_CONFIG[c.type] || TYPES_CONFIG.autre;
                  const parent = categories.find(p => p.id === c.parent);
                  return (
                    <tr key={c.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <span className="font-mono text-xs font-bold text-primary">{c.code}</span>
                      </td>
                      <td>
                        <p className="font-medium text-sm truncate max-w-[250px]">{c.nom}</p>
                        {c.description && (
                          <p className="text-xs text-base-content/50 truncate max-w-[250px]">{c.description}</p>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${typeCfg.color} badge-sm`}>{typeCfg.label}</span>
                      </td>
                      <td>
                        {parent ? (
                          <span className="text-xs">{parent.nom}</span>
                        ) : (
                          <span className="text-xs text-base-content/40">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="font-mono text-xs">{c.ordre}</span>
                      </td>
                      <td className="text-center">
                        <Link to={`/documents?categorie=${c.id}`} className="badge badge-ghost badge-sm hover:badge-primary">
                          {c.nombre_documents || 0}
                        </Link>
                      </td>
                      <td className="text-center">
                        {c.actif ? (
                          <span className="badge badge-success badge-sm">Active</span>
                        ) : (
                          <span className="badge badge-ghost badge-sm">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link to={`/categories-documents/${c.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => { setSelectionne(c); setShowModalSuppression(true); }}
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
        )
      )}

      {/* VUE ARBRE */}
      {vue === 'arbre' && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            {categoriesFiltrees.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                <p className="text-xl text-base-content/60">Aucune catégorie</p>
              </div>
            ) : (
              <div>
                {construireArbre()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && selectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la catégorie</h3>
              <p className="text-base-content/60 mb-4">Supprimer <strong>{selectionne.nom}</strong> ?</p>
              <p className="text-xs text-base-content/50 mb-4">
                ⚠️ Si des documents sont rattachés, la suppression échouera.
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimer} disabled={chargementAction}>
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

export default CategoriesDocuments;