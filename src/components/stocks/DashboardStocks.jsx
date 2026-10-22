// src/components/stocks/DashboardStocks.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Loader2, AlertCircle, RefreshCw, Package2,
  AlertTriangle, HardHat, Warehouse, PlusCircle, Wrench,
  CheckCircle, Layers, DollarSign
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const DashboardStocks = () => {
  const [stats, setStats] = useState({
    articles: {},
    equipements: {},
    critiques: [],
    maintenances: [],
  });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [articlesRes, equipementsRes, critiquesRes, maintenanceRes] = await Promise.all([
        AxiosInstance.get('/articles/statistiques/').catch(() => ({ data: {} })),
        AxiosInstance.get('/equipements/statistiques/').catch(() => ({ data: {} })),
        AxiosInstance.get('/articles/stock_critique/').catch(() => ({ data: [] })),
        AxiosInstance.get('/maintenances/?statut=en_cours').catch(() => ({ data: [] })),
      ]);
      setStats({
        articles: articlesRes.data || {},
        equipements: equipementsRes.data || {},
        critiques: critiquesRes.data.results || critiquesRes.data || [],
        maintenances: maintenanceRes.data.results || maintenanceRes.data || [],
      });
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les données');
    } finally {
      setChargement(false);
    }
  };

  const formatMontantCourt = (m) => {
    const num = Number(m || 0);
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (num >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-1">
            <Package className="w-3 h-3" /> Logistique & Stocks
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Tableau de bord stocks
          </h1>
          <p className="text-base-content/60 mt-1">
            Vue d'ensemble du parc matériel APG
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/articles/ajouter" className="btn btn-primary gap-2">
            <PlusCircle className="w-5 h-5" /> Nouvel article
          </Link>
        </div>
      </div>

      {erreur && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Package2 className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Articles</p>
            </div>
            <p className="text-2xl font-bold">{stats.articles?.total || 0}</p>
            <p className="text-xs text-base-content/50">{stats.articles?.actifs || 0} actifs</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <HardHat className="w-4 h-4 text-info" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Équipements</p>
            </div>
            <p className="text-2xl font-bold">{stats.equipements?.total || 0}</p>
            <p className="text-xs text-base-content/50">
              {formatMontantCourt(stats.equipements?.valeur_totale || 0)} GNF
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-error/10 to-error/5 border border-error/20">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-error" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Critiques</p>
            </div>
            <p className="text-2xl font-bold text-error">{stats.articles?.critiques || 0}</p>
            <p className="text-xs text-base-content/50">{stats.articles?.en_alerte || 0} en alerte</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Maintenances</p>
            </div>
            <p className="text-2xl font-bold text-warning">{stats.maintenances.length}</p>
            <p className="text-xs text-base-content/50">en cours</p>
          </div>
        </div>
      </div>

      {/* 2 COLONNES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Articles critiques */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-error/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-error" />
                <h2 className="font-semibold text-sm">Articles critiques</h2>
              </div>
              <Link to="/stock-critique" className="text-xs text-primary hover:underline">
                Tout voir →
              </Link>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {stats.critiques.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun article critique</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.critiques.slice(0, 8).map(a => (
                    <Link key={a.id} to={`/articles/${a.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-error/5">
                      <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-error" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.designation}</p>
                        <p className="text-xs font-mono text-base-content/50">{a.code}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-sm font-bold text-error">{a.stock_total}</p>
                        <p className="text-[10px] text-base-content/50">min: {a.stock_minimum}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Maintenances en cours */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-warning/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-warning" />
                <h2 className="font-semibold text-sm">Maintenances en cours</h2>
              </div>
              <Link to="/maintenance" className="text-xs text-primary hover:underline">
                Tout voir →
              </Link>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {stats.maintenances.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune maintenance en cours</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.maintenances.slice(0, 8).map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-warning/5">
                      <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-4 h-4 text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{m.equipement_designation}</p>
                        <p className="text-xs text-base-content/50">{m.type_display}</p>
                      </div>
                      <span className="badge badge-warning badge-sm">{m.statut_display}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/articles" className="card bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
          <div className="card-body p-4 text-center">
            <Package2 className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="font-semibold text-sm">Articles</p>
          </div>
        </Link>
        <Link to="/equipements" className="card bg-info/5 border border-info/20 hover:bg-info/10 transition-colors">
          <div className="card-body p-4 text-center">
            <HardHat className="w-8 h-8 mx-auto text-info mb-2" />
            <p className="font-semibold text-sm">Équipements</p>
          </div>
        </Link>
        <Link to="/magasins" className="card bg-warning/5 border border-warning/20 hover:bg-warning/10 transition-colors">
          <div className="card-body p-4 text-center">
            <Warehouse className="w-8 h-8 mx-auto text-warning mb-2" />
            <p className="font-semibold text-sm">Magasins</p>
          </div>
        </Link>
        <Link to="/inventaire" className="card bg-success/5 border border-success/20 hover:bg-success/10 transition-colors">
          <div className="card-body p-4 text-center">
            <Layers className="w-8 h-8 mx-auto text-success mb-2" />
            <p className="font-semibold text-sm">Inventaire</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardStocks;