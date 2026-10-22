// src/components/stocks/Articles.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package2, Search, Plus, Edit, Trash2, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, AlertTriangle, CheckCircle, DollarSign, Package
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [articlesFiltres, setArticlesFiltres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [articleSelectionne, setArticleSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        AxiosInstance.get('/articles/'),
        AxiosInstance.get('/categories-materiel/').catch(() => ({ data: [] })),
      ]);
      const artData = articlesRes.data.results || articlesRes.data || [];
      setArticles(artData);
      setArticlesFiltres(artData);
      setCategories(categoriesRes.data.results || categoriesRes.data || []);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les articles');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = articles;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.designation?.toLowerCase().includes(terme) ||
        a.code?.toLowerCase().includes(terme)
      );
    }
    if (filtreCategorie !== 'all') {
      filtre = filtre.filter(a => a.categorie_nom === filtreCategorie);
    }
    if (filtreStatut === 'critique') {
      filtre = filtre.filter(a => a.est_critique);
    } else if (filtreStatut === 'alerte') {
      filtre = filtre.filter(a => a.est_en_alerte && !a.est_critique);
    } else if (filtreStatut === 'ok') {
      filtre = filtre.filter(a => !a.est_en_alerte);
    }
    setArticlesFiltres(filtre);
  }, [recherche, filtreCategorie, filtreStatut, articles]);

  const supprimer = async () => {
    if (!articleSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/articles/${articleSelectionne.id}/`);
      setArticles(articles.filter(a => a.id !== articleSelectionne.id));
      setShowModalSuppression(false);
      setArticleSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const stats = useMemo(() => ({
    total: articles.length,
    critiques: articles.filter(a => a.est_critique).length,
    alertes: articles.filter(a => a.est_en_alerte && !a.est_critique).length,
    valeurTotal: articles.reduce(
      (sum, a) => sum + (Number(a.prix_achat || 0) * Number(a.stock_total || 0)),
      0
    ),
  }), [articles]);

  const filtresActifs =
    recherche || filtreCategorie !== 'all' || filtreStatut !== 'all';

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
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <Package2 className="w-3 h-3" /> Logistique / Articles
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package2 className="w-8 h-8 text-primary" />
            Articles (consommables)
          </h1>
          <p className="text-base-content/60 mt-1">
            {articlesFiltres.length} article{articlesFiltres.length > 1 ? 's' : ''}
            {filtresActifs && articles.length !== articlesFiltres.length && (
              <span className="text-base-content/40"> (sur {articles.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/articles/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvel article
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En alerte</p>
              <p className="text-xl font-bold text-warning">{stats.alertes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Critiques</p>
              <p className="text-xl font-bold text-error">{stats.critiques}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Valeur stock</p>
              <p className="text-sm font-bold font-mono truncate">
                {new Intl.NumberFormat('fr-FR').format(stats.valeurTotal)} GNF
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
                  placeholder="Rechercher par code, désignation..."
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
              <option value="all">Toutes catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.nom}>{c.nom}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              <option value="ok">Stock OK</option>
              <option value="alerte">En alerte</option>
              <option value="critique">Critique</option>
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

      {/* LISTE */}
      {articlesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Package2 className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun article ne correspond' : 'Aucun article'}
          </p>
          <Link to="/articles/ajouter" className="btn btn-primary mt-4">
            Créer un article
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Code</th>
                <th className="text-xs uppercase">Désignation</th>
                <th className="text-xs uppercase">Catégorie</th>
                <th className="text-xs uppercase">Unité</th>
                <th className="text-xs uppercase text-right">Stock</th>
                <th className="text-xs uppercase text-right">Prix achat</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articlesFiltres.map(a => (
                <tr
                  key={a.id}
                  className={`hover:bg-base-200/50 border-b border-base-200 last:border-0 ${
                    a.est_critique
                      ? 'bg-error/5'
                      : a.est_en_alerte
                      ? 'bg-warning/5'
                      : ''
                  }`}
                >
                  <td>
                    <span className="font-mono text-sm font-bold text-primary">
                      {a.code}
                    </span>
                  </td>
                  <td>
                    <p className="font-medium text-sm truncate max-w-[250px]">
                      {a.designation}
                    </p>
                  </td>
                  <td>
                    <span className="badge badge-ghost badge-sm">
                      {a.categorie_nom || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs">{a.unite || '—'}</span>
                  </td>
                  <td className="text-right">
                    <p className="font-mono font-bold">{a.stock_total || 0}</p>
                    <p className="text-xs text-base-content/50">
                      min: {a.stock_minimum}
                    </p>
                  </td>
                  <td className="text-right">
                    <span className="font-mono text-sm">
                      {formaterMontant(a.prix_achat)}
                    </span>
                  </td>
                  <td>
                    {a.est_critique ? (
                      <span className="badge badge-error badge-sm gap-1">
                        <AlertCircle className="w-3 h-3" /> Critique
                      </span>
                    ) : a.est_en_alerte ? (
                      <span className="badge badge-warning badge-sm gap-1">
                        <AlertTriangle className="w-3 h-3" /> Alerte
                      </span>
                    ) : (
                      <span className="badge badge-success badge-sm gap-1">
                        <CheckCircle className="w-3 h-3" /> OK
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/articles/${a.id}`}
                        className="btn btn-ghost btn-xs"
                        title="Voir"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={`/articles/${a.id}/modifier`}
                        className="btn btn-ghost btn-xs"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          setArticleSelectionne(a);
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
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && articleSelectionne && (
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
              <h3 className="text-xl font-bold mb-2">Supprimer l'article</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{articleSelectionne.designation}</strong> ?
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
                  {chargementAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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

export default Articles;