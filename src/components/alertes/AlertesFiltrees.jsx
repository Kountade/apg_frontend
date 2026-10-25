// src/components/alertes/AlertesFiltrees.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Loader2, AlertCircle, RefreshCw, Search, Filter,
  AlertTriangle, AlertOctagon, Info, CheckCircle, Clock,
  ExternalLink, ArrowLeft, Calendar
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const GRAVITES_CONFIG = {
  critical: { label: 'Critique',       color: 'error',    icon: AlertOctagon, weight: 4 },
  error:    { label: 'Erreur',         color: 'error',    icon: AlertTriangle, weight: 3 },
  warning:  { label: 'Avertissement',  color: 'warning',  icon: AlertTriangle, weight: 2 },
  info:     { label: 'Information',    color: 'info',     icon: Info, weight: 1 },
};

const AlertesFiltrees = ({
  endpoint,           // ex: '/alertes/rh/'
  titre,              // ex: 'Alertes RH'
  sousTitre,          // ex: 'Congés, contrats, présences'
  icone: IconeHeader, // composant lucide
  couleur,            // ex: 'primary', 'warning'...
  moduleFiltre,       // ex: 'rh' (optionnel — pour filtrer si endpoint renvoie tout)
}) => {
  const [alertes, setAlertes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreGravite, setFiltreGravite] = useState('all');

  useEffect(() => {
    charger();
  }, [endpoint]);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(endpoint);
      const data = res.data || {};
      let liste = data.alertes || data.results || data || [];

      // Si l'endpoint retourne tout et qu'on veut filtrer
      if (moduleFiltre && Array.isArray(liste)) {
        liste = liste.filter(a => a.module === moduleFiltre);
      }

      setAlertes(Array.isArray(liste) ? liste : []);
    } catch (err) {
      console.error(err);
      setErreur(`Impossible de charger ${titre.toLowerCase()}`);
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
        a.type?.toLowerCase().includes(terme)
      );
    }

    if (filtreGravite !== 'all') {
      filtre = filtre.filter(a => a.gravite === filtreGravite);
    }

    return filtre;
  }, [alertes, recherche, filtreGravite]);

  // Stats gravité
  const statsGravite = useMemo(() => {
    const stats = { critical: 0, error: 0, warning: 0, info: 0 };
    alertes.forEach(a => {
      if (stats[a.gravite] !== undefined) stats[a.gravite]++;
    });
    return stats;
  }, [alertes]);

  const formaterDate = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      const diffH = Math.floor((new Date() - date) / (1000 * 60 * 60));
      const diffJ = Math.floor(diffH / 24);
      if (diffH < 1) return 'À l\'instant';
      if (diffH < 24) return `Il y a ${diffH}h`;
      if (diffJ < 7) return `Il y a ${diffJ}j`;
      return date.toLocaleDateString('fr-FR');
    } catch { return d; }
  };

  const filtresActifs = recherche || filtreGravite !== 'all';

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
        <Link to="/alertes" className="btn btn-ghost mt-4 ml-2 gap-2">
          <ArrowLeft className="w-4 h-4" /> Toutes les alertes
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <Link to="/alertes" className="hover:text-primary flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Alertes
            </Link>
            <span>/</span>
            <span>{titre}</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {IconeHeader && <IconeHeader className={`w-8 h-8 text-${couleur}`} />}
            {titre}
          </h1>
          <p className="text-base-content/60 mt-1">
            {sousTitre && <>{sousTitre} · </>}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['critical', 'error', 'warning', 'info'].map(grav => {
          const cfg = GRAVITES_CONFIG[grav];
          const Icon = cfg.icon;
          const count = statsGravite[grav];
          return (
            <div key={grav} className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4 flex-row items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${cfg.color}/10 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${cfg.color}`} />
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">{cfg.label}</p>
                  <p className={`text-xl font-bold ${count > 0 ? `text-${cfg.color}` : ''}`}>
                    {count}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
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
                  placeholder="Rechercher..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

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
                  setFiltreGravite('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {alertesFiltrees.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CheckCircle className="w-20 h-20 text-success mx-auto mb-4 opacity-50" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune alerte ne correspond' : `Aucune alerte ${titre.toLowerCase()}`}
          </p>
          <p className="text-sm text-base-content/40 mt-1">
            {filtresActifs ? 'Essayez d\'autres filtres.' : 'Tout est en ordre !'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alertesFiltrees.map(alerte => {
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
                        <p className="font-medium text-sm">{alerte.titre}</p>
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
                        <span className="font-mono text-[10px]">{alerte.type}</span>
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
      )}

      {/* Pied de page */}
      {alertesFiltrees.length > 0 && (
        <div className="mt-6 text-center">
          <Link to="/alertes" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Toutes les alertes
          </Link>
        </div>
      )}
    </div>
  );
};

export default AlertesFiltrees;