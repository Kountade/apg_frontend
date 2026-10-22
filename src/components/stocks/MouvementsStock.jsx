// src/components/stocks/MouvementsStock.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight, Search, Plus, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, TrendingUp, TrendingDown, ArrowLeft, ArrowRight
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  entree:      { label: 'Entrée',      color: 'success', icon: TrendingUp },
  sortie:      { label: 'Sortie',      color: 'error',   icon: TrendingDown },
  transfert:   { label: 'Transfert',   color: 'info',    icon: ArrowLeftRight },
  ajustement:  { label: 'Ajustement',  color: 'warning', icon: ArrowLeft },
  retour:      { label: 'Retour',      color: 'primary', icon: ArrowRight },
};

const MouvementsStock = () => {
  const [mouvements, setMouvements] = useState([]);
  const [mouvementsFiltres, setMouvementsFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/mouvements-stock/');
      const data = res.data.results || res.data || [];
      setMouvements(data);
      setMouvementsFiltres(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les mouvements');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = mouvements;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(m =>
        m.numero?.toLowerCase().includes(terme) ||
        m.article_code?.toLowerCase().includes(terme) ||
        m.article_designation?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') {
      filtre = filtre.filter(m => m.type === filtreType);
    }
    setMouvementsFiltres(filtre);
  }, [recherche, filtreType, mouvements]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

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
            <ArrowLeftRight className="w-3 h-3" /> Logistique / Mouvements
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-primary" />
            Mouvements de stock
          </h1>
          <p className="text-base-content/60 mt-1">
            {mouvementsFiltres.length} mouvement{mouvementsFiltres.length > 1 ? 's' : ''}
            {filtresActifs && mouvements.length !== mouvementsFiltres.length && (
              <span className="text-base-content/40"> (sur {mouvements.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/mouvements-stock/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau mouvement
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
                  placeholder="Rechercher par numéro, article..."
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
              {Object.entries(TYPES_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
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
      {mouvementsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <ArrowLeftRight className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun mouvement ne correspond' : 'Aucun mouvement'}
          </p>
          <Link to="/mouvements-stock/ajouter" className="btn btn-primary mt-4">
            Créer un mouvement
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Numéro</th>
                <th className="text-xs uppercase">Date</th>
                <th className="text-xs uppercase">Type</th>
                <th className="text-xs uppercase">Article</th>
                <th className="text-xs uppercase text-right">Quantité</th>
                <th className="text-xs uppercase">Trajet</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mouvementsFiltres.map(m => {
                const cfg = TYPES_CONFIG[m.type] || TYPES_CONFIG.ajustement;
                const Icon = cfg.icon;
                return (
                  <tr
                    key={m.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {m.numero}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {formaterDate(m.date_mouvement)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${cfg.color} badge-sm gap-1`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm font-medium truncate max-w-[250px]">
                        {m.article_designation}
                      </p>
                      <p className="text-xs font-mono text-base-content/50">
                        {m.article_code}
                      </p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono font-bold">{m.quantite}</span>
                    </td>
                    <td>
                      <div className="text-xs">
                        {m.magasin_source_nom && (
                          <p>De : {m.magasin_source_nom}</p>
                        )}
                        {m.magasin_destination_nom && (
                          <p>Vers : {m.magasin_destination_nom}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <Link
                        to={`/mouvements-stock/${m.id}`}
                        className="btn btn-ghost btn-xs"
                        title="Voir"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MouvementsStock;