// src/components/alertes/Alertes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, BellRing, Search, Loader2, AlertCircle, RefreshCw,
  Filter, AlertTriangle, AlertOctagon, Info, CheckCircle,
  TrendingUp, TrendingDown, Users, Package, Truck, FileText,
  HardHat, DollarSign, Calculator, Target, XCircle, ExternalLink,
  ChevronRight, Clock, Calendar
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MODULES_CONFIG = {
  rh:           { label: 'Ressources Humaines', icon: Users,        color: 'primary', path: '/alertes-rh' },
  paie:         { label: 'Paie',                icon: Calculator,   color: 'info',    path: '/alertes-rh' },
  achats:       { label: 'Achats',              icon: DollarSign,   color: 'warning', path: '/alertes-finance' },
  stocks:       { label: 'Stocks',              icon: Package,      color: 'success', path: '/alertes-logistique' },
  vehicules:    { label: 'Véhicules',           icon: Truck,        color: 'secondary', path: '/alertes-vehicules' },
  documents:    { label: 'Documents',           icon: FileText,     color: 'neutral', path: '/documents' },
  exploitation: { label: 'Exploitation',        icon: HardHat,      color: 'error',   path: '/alertes-exploitation' },
};

const GRAVITES_CONFIG = {
  critical: { label: 'Critique',       color: 'error',    icon: AlertOctagon, weight: 4 },
  error:    { label: 'Erreur',         color: 'error',    icon: AlertTriangle, weight: 3 },
  warning:  { label: 'Avertissement',  color: 'warning',  icon: AlertTriangle, weight: 2 },
  info:     { label: 'Information',    color: 'info',     icon: Info, weight: 1 },
};

const Alertes = () => {
  const [alertes, setAlertes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreModule, setFiltreModule] = useState('all');
  const [filtreGravite, setFiltreGravite] = useState('all');
  const [stats, setStats] = useState({ total: 0, par_module: {}, par_gravite: {} });

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/alertes/toutes/');
      const data = res.data || {};
      setAlertes(data.alertes || []);
      setStats({
        total: data.total || 0,
        par_module: data.par_module || {},
        par_gravite: data.par_gravite || {},
      });
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les alertes');
    } finally {
      setChargement(false);
    }
  };

  // Filtrage côté client
  const alertesFiltrees = useMemo(() => {
    let filtre = alertes;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.titre?.toLowerCase().includes(terme) ||
        a.description?.toLowerCase().includes(terme) ||
        a.module?.toLowerCase().includes(terme) ||
        a.type?.toLowerCase().includes(terme)
      );
    }

    if (filtreModule !== 'all') {
      filtre = filtre.filter(a => a.module === filtreModule);
    }

    if (filtreGravite !== 'all') {
      filtre = filtre.filter(a => a.gravite === filtreGravite);
    }

    return filtre;
  }, [alertes, recherche, filtreModule, filtreGravite]);

  // Groupement par module
  const alertesParModule = useMemo(() => {
    const groupes = {};
    alertesFiltrees.forEach(a => {
      if (!groupes[a.module]) groupes[a.module] = [];
      groupes[a.module].push(a);
    });
    return groupes;
  }, [alertesFiltrees]);

  const formaterDate = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      const maintenant = new Date();
      const diffMs = maintenant - date;
      const diffH = Math.floor(diffMs / (1000 * 60 * 60));
      const diffJ = Math.floor(diffH / 24);

      if (diffH < 1) return 'À l\'instant';
      if (diffH < 24) return `Il y a ${diffH}h`;
      if (diffJ < 7) return `Il y a ${diffJ}j`;
      return date.toLocaleDateString('fr-FR');
    } catch {
      return d;
    }
  };

  const filtresActifs = recherche || filtreModule !== 'all' || filtreGravite !== 'all';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Chargement des alertes...</p>
        </div>
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
            <BellRing className="w-3 h-3" /> Alertes / Toutes
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BellRing className="w-8 h-8 text-primary" />
            Centre d'alertes
          </h1>
          <p className="text-base-content/60 mt-1">
            {alertesFiltrees.length} alerte{alertesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && alertes.length !== alertesFiltrees.length && (
              <span className="text-base-content/40"> (sur {alertes.length})</span>
            )}
          </p>
        </div>
        <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* STATS GRAVITÉ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        {['critical', 'error', 'warning', 'info'].map(grav => {
          const cfg = GRAVITES_CONFIG[grav];
          const Icon = cfg.icon;
          const count = stats.par_gravite?.[grav] || 0;
          return (
            <div key={grav} className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4 flex-row items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${cfg.color}/10 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${cfg.color}`} />
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">{cfg.label}</p>
                  <p className={`text-xl font-bold text-${cfg.color}`}>{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODULES RÉSUMÉ */}
      {Object.keys(stats.par_module || {}).length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm mb-3">Répartition par module</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.par_module).map(([mod, count]) => {
                const cfg = MODULES_CONFIG[mod] || { label: mod, icon: Bell, color: 'ghost', path: '#' };
                const Icon = cfg.icon;
                return (
                  <Link
                    key={mod}
                    to={cfg.path}
                    className={`btn btn-${cfg.color} btn-outline btn-sm gap-2`}
                  >
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                    <span className="badge badge-sm">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, description, module..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreModule}
              onChange={(e) => setFiltreModule(e.target.value)}
            >
              <option value="all">Tous les modules</option>
              {Object.entries(MODULES_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreGravite}
              onChange={(e) => setFiltreGravite(e.target.value)}
            >
              <option value="all">Toutes gravités</option>
              {Object.entries(GRAVITES_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreModule('all');
                  setFiltreGravite('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE GROUPÉE */}
      {alertesFiltrees.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CheckCircle className="w-20 h-20 text-success mx-auto mb-4 opacity-50" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune alerte ne correspond' : 'Aucune alerte'}
          </p>
          <p className="text-sm text-base-content/40 mt-1">
            {filtresActifs ? 'Essayez d\'autres filtres.' : 'Tout est en ordre !'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(alertesParModule).map(([mod, items]) => {
            const cfg = MODULES_CONFIG[mod] || { label: mod, icon: Bell, color: 'ghost', path: '#' };
            const Icon = cfg.icon;
            return (
              <div key={mod}>
                {/* En-tête de module */}
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 text-${cfg.color}`} />
                  <h2 className="font-bold text-sm uppercase tracking-wide">
                    {cfg.label}
                  </h2>
                  <span className="badge badge-sm">{items.length}</span>
                  <Link
                    to={cfg.path}
                    className="link link-primary text-xs ml-auto"
                  >
                    Voir tout →
                  </Link>
                </div>

                {/* Liste des alertes du module */}
                <div className="space-y-2">
                  {items.map(alerte => {
                    const gravCfg = GRAVITES_CONFIG[alerte.gravite] || GRAVITES_CONFIG.info;
                    const GravIcon = gravCfg.icon;
                    return (
                      <div
                        key={alerte.id}
                        className={`card bg-base-100 shadow-sm border-l-4 border-${gravCfg.color} hover:shadow-md transition-shadow`}
                      >
                        <div className="card-body p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-${gravCfg.color}/10 flex items-center justify-center flex-shrink-0`}>
                              <GravIcon className={`w-5 h-5 text-${gravCfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-medium text-sm">
                                  {alerte.titre}
                                </p>
                                <span className={`badge badge-${gravCfg.color} badge-sm flex-shrink-0`}>
                                  {gravCfg.label}
                                </span>
                              </div>
                              {alerte.description && (
                                <p className="text-xs text-base-content/60 line-clamp-2">
                                  {alerte.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-base-content/50">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formaterDate(alerte.date)}
                                </span>
                                <span className="font-mono text-[10px]">
                                  {alerte.type}
                                </span>
                              </div>
                            </div>
                            {alerte.url && alerte.url !== '#' && (
                              <Link
                                to={alerte.url}
                                className="btn btn-ghost btn-sm gap-1 flex-shrink-0"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Voir
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alertes;