// src/components/stocks/Maintenances.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, Search, Plus, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, Clock, CheckCircle, XCircle, PlayCircle,
  Shield, AlertTriangle, RotateCcw, DollarSign
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  planifiee: { label: 'Planifiée',  color: 'info',    icon: Clock },
  en_cours:  { label: 'En cours',   color: 'warning', icon: PlayCircle },
  terminee:  { label: 'Terminée',   color: 'success', icon: CheckCircle },
  annulee:   { label: 'Annulée',    color: 'ghost',   icon: XCircle },
};

const TYPES_CONFIG = {
  preventive: { label: 'Préventive', color: 'info' },
  corrective: { label: 'Corrective', color: 'warning' },
  urgence:    { label: 'Urgence',    color: 'error' },
  revision:   { label: 'Révision',   color: 'primary' },
};

const Maintenances = () => {
  const [maintenances, setMaintenances] = useState([]);
  const [maintenancesFiltrees, setMaintenancesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreType, setFiltreType] = useState('all');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/maintenances/');
      const data = res.data.results || res.data || [];
      setMaintenances(data);
      setMaintenancesFiltrees(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les maintenances');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = maintenances;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(m =>
        m.numero?.toLowerCase().includes(terme) ||
        m.equipement_code?.toLowerCase().includes(terme) ||
        m.equipement_designation?.toLowerCase().includes(terme) ||
        m.technicien?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') {
      filtre = filtre.filter(m => m.statut === filtreStatut);
    }
    if (filtreType !== 'all') {
      filtre = filtre.filter(m => m.type === filtreType);
    }
    setMaintenancesFiltrees(filtre);
  }, [recherche, filtreStatut, filtreType, maintenances]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreType !== 'all';

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
            <Wrench className="w-3 h-3" /> Logistique / Maintenance
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wrench className="w-8 h-8 text-primary" />
            Maintenances équipements
          </h1>
          <p className="text-base-content/60 mt-1">
            {maintenancesFiltrees.length} intervention{maintenancesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && maintenances.length !== maintenancesFiltrees.length && (
              <span className="text-base-content/40"> (sur {maintenances.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/maintenances/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle maintenance
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
                  placeholder="Rechercher par numéro, équipement, technicien..."
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

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              {Object.entries(STATUTS_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreStatut('all');
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
      {maintenancesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Wrench className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune maintenance ne correspond' : 'Aucune maintenance'}
          </p>
          <Link to="/maintenances/ajouter" className="btn btn-primary mt-4">
            Créer une maintenance
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Numéro</th>
                <th className="text-xs uppercase">Équipement</th>
                <th className="text-xs uppercase">Type</th>
                <th className="text-xs uppercase">Dates</th>
                <th className="text-xs uppercase">Technicien</th>
                <th className="text-xs uppercase text-right">Coût total</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenancesFiltrees.map(m => {
                const statutCfg = STATUTS_CONFIG[m.statut] || STATUTS_CONFIG.planifiee;
                const typeCfg = TYPES_CONFIG[m.type] || TYPES_CONFIG.corrective;
                const IconStatut = statutCfg.icon;
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
                      <p className="font-mono text-xs text-base-content/60">
                        {m.equipement_code}
                      </p>
                      <p className="text-sm truncate max-w-[200px]">
                        {m.equipement_designation}
                      </p>
                    </td>
                    <td>
                      <span className={`badge badge-${typeCfg.color} badge-sm`}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs font-mono">
                        {formaterDate(m.date_debut)}
                      </p>
                      {m.date_fin && (
                        <p className="text-xs text-base-content/50 font-mono">
                          → {formaterDate(m.date_fin)}
                        </p>
                      )}
                    </td>
                    <td>
                      <p className="text-xs truncate max-w-[150px]">
                        {m.technicien || '—'}
                      </p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs font-bold">
                        {formaterMontant(m.cout_total)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${statutCfg.color} badge-sm gap-1`}>
                        <IconStatut className="w-3 h-3" /> {statutCfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/maintenances/${m.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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

export default Maintenances;