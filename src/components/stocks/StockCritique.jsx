// src/components/stocks/StockCritique.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Loader2, AlertCircle, RefreshCw, Search,
  Package, TrendingUp, CheckCircle, Filter
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const StockCritique = () => {
  const [articles, setArticles] = useState([]);
  const [filtres, setFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/articles/stock_critique/');
      const data = res.data.results || res.data || [];
      setArticles(data);
      setFiltres(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les articles critiques');
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
    setFiltres(filtre);
  }, [recherche, articles]);

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
        <button onClick={charger} className="btn btn-primary mt-4">
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
            <AlertTriangle className="w-3 h-3" /> Stocks
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-error" />
            Articles en stock critique
          </h1>
          <p className="text-base-content/60 mt-1">
            {filtres.length} article{filtres.length > 1 ? 's' : ''} à réapprovisionner
          </p>
        </div>
        <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* ALERTE */}
      {filtres.length > 0 && (
        <div className="alert alert-error mb-6">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-bold">Attention</p>
            <p className="text-sm">
              {filtres.length} article{filtres.length > 1 ? 's' : ''} en dessous du stock minimum.
              Une commande est nécessaire.
            </p>
          </div>
        </div>
      )}

      {/* FILTRE RECHERCHE */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              className="input input-bordered w-full pl-10"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* LISTE */}
      {filtres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            Aucun article en stock critique
          </p>
          <p className="text-sm text-base-content/40 mt-1">
            Tous les stocks sont au-dessus du minimum
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtres.map(a => (
            <div
              key={a.id}
              className="card bg-base-100 shadow-sm border-2 border-error/30 hover:shadow-md transition-shadow"
            >
              <div className="card-body p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-error" />
                  </div>
                  <span className="badge badge-error badge-sm gap-1">
                    <AlertCircle className="w-3 h-3" /> Critique
                  </span>
                </div>

                <h3 className="font-bold text-base truncate">{a.designation}</h3>
                <p className="text-xs font-mono text-base-content/50">{a.code}</p>
                {a.categorie_nom && (
                  <p className="text-xs text-base-content/60 mt-1">{a.categorie_nom}</p>
                )}

                <div className="divider my-3"></div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Stock actuel</p>
                    <p className="font-mono font-bold text-error text-2xl">
                      {a.stock_total || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Minimum</p>
                    <p className="font-mono font-bold text-lg">{a.stock_minimum}</p>
                  </div>
                </div>

                {a.unite && (
                  <p className="text-xs text-base-content/50 mt-2">
                    Unité : {a.unite}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/articles/${a.id}`}
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    Voir
                  </Link>
                  <Link
                    to={`/mouvements-stock/ajouter?article=${a.id}&type=entree`}
                    className="btn btn-success btn-sm flex-1 gap-1"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Réappro
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockCritique;