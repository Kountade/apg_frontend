// src/components/vehicules/Tricycles.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Search, Plus, Eye, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, XCircle, Clock, Wrench,
  AlertTriangle, MapPin, User, Gauge, TrendingUp, DollarSign,
  Calendar, Shield
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ETATS_CONFIG = {
  disponible:    { label: 'Disponible',    color: 'success', icon: CheckCircle },
  en_mission:    { label: 'En mission',    color: 'primary', icon: Truck },
  en_maintenance:{ label: 'En maintenance',color: 'warning', icon: Wrench },
  en_panne:      { label: 'En panne',      color: 'error',   icon: AlertTriangle },
  hors_service:  { label: 'Hors service',  color: 'ghost',   icon: XCircle },
};

const STATUTS_CONFIG = {
  actif:   { label: 'Actif',   color: 'success' },
  vendu:   { label: 'Vendu',   color: 'info' },
  reforme: { label: 'Réformé', color: 'warning' },
  archive: { label: 'Archivé', color: 'ghost' },
};

const Tricycles = () => {
  const [tricycles, setTricycles] = useState([]);
  const [tricyclesFiltres, setTricyclesFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreEtat, setFiltreEtat] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
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
      // ✅ FIX : URL corrigée (sans /vehicules/ en préfixe)
      const res = await AxiosInstance.get('/tricycles/?page_size=200');
      const data = res.data.results || res.data || [];
      setTricycles(data);
      setTricyclesFiltres(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les tricycles');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = tricycles;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(t =>
        t.numero_interne?.toLowerCase().includes(terme) ||
        t.immatriculation?.toLowerCase().includes(terme) ||
        t.marque?.toLowerCase().includes(terme) ||
        t.modele?.toLowerCase().includes(terme) ||
        t.conducteur_nom?.toLowerCase().includes(terme) ||
        t.zone_exploitation?.toLowerCase().includes(terme)
      );
    }
    if (filtreEtat !== 'all') filtre = filtre.filter(t => t.etat === filtreEtat);
    if (filtreStatut !== 'all') filtre = filtre.filter(t => t.statut === filtreStatut);
    setTricyclesFiltres(filtre);
  }, [recherche, filtreEtat, filtreStatut, tricycles]);

  const supprimer = async () => {
    if (!selectionne) return;
    setChargementAction(true);
    try {
      // ✅ FIX : URL corrigée
      await AxiosInstance.delete(`/tricycles/${selectionne.id}/`);
      setTricycles(tricycles.filter(t => t.id !== selectionne.id));
      setShowModalSuppression(false);
      setSelectionne(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: tricycles.length,
      disponibles: tricycles.filter(t => t.etat === 'disponible').length,
      enMission: tricycles.filter(t => t.etat === 'en_mission').length,
      enPanne: tricycles.filter(t => ['en_panne', 'hors_service'].includes(t.etat)).length,
      valeurTotale: tricycles.reduce((s, t) => s + Number(t.valeur_actuelle || 0), 0),
    };
  }, [tricycles]);

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';
  };

  const formaterKm = (km) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(km || 0)) + ' km';
  };

  const filtresActifs = recherche || filtreEtat !== 'all' || filtreStatut !== 'all';

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
            <Truck className="w-3 h-3" /> Véhicules / Tricycles
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            Parc de tricycles
          </h1>
          <p className="text-base-content/60 mt-1">
            {tricyclesFiltres.length} tricycle{tricyclesFiltres.length > 1 ? 's' : ''}
            {filtresActifs && tricycles.length !== tricyclesFiltres.length && (
              <span className="text-base-content/40"> (sur {tricycles.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/tricycles/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau tricycle
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Disponibles</p>
              <p className="text-xl font-bold text-success">{stats.disponibles}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En mission</p>
              <p className="text-xl font-bold text-info">{stats.enMission}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En panne</p>
              <p className="text-xl font-bold text-error">{stats.enPanne}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Valeur totale</p>
              <p className="text-sm font-bold font-mono truncate">
                {formaterMontant(stats.valeurTotale)}
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
                  placeholder="Rechercher par numéro, plaque, marque, conducteur..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreEtat}
              onChange={(e) => setFiltreEtat(e.target.value)}
            >
              <option value="all">Tous états</option>
              {Object.entries(ETATS_CONFIG).map(([k, c]) => (
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
                  setFiltreEtat('all');
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
      {tricyclesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Truck className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun tricycle ne correspond' : 'Aucun tricycle'}
          </p>
          <Link to="/tricycles/ajouter" className="btn btn-primary mt-4">
            Créer un tricycle
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">N° interne</th>
                <th className="text-xs uppercase">Immatriculation</th>
                <th className="text-xs uppercase">Marque / Modèle</th>
                <th className="text-xs uppercase">Conducteur</th>
                <th className="text-xs uppercase">Zone</th>
                <th className="text-xs uppercase text-right">Km</th>
                <th className="text-xs uppercase text-right">Valeur</th>
                <th className="text-xs uppercase">État</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tricyclesFiltres.map(t => {
                const etatCfg = ETATS_CONFIG[t.etat] || ETATS_CONFIG.disponible;
                const IconEtat = etatCfg.icon;
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {t.numero_interne}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs">
                        {t.immatriculation || '—'}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[180px]">
                        {t.marque} {t.modele}
                      </p>
                    </td>
                    <td>
                      {t.conducteur_nom ? (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-base-content/40" />
                          <span className="text-xs truncate max-w-[130px]">
                            {t.conducteur_nom}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-base-content/40">—</span>
                      )}
                    </td>
                    <td>
                      {t.zone_exploitation ? (
                        <p className="text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-base-content/40" />
                          {t.zone_exploitation}
                        </p>
                      ) : (
                        <span className="text-xs text-base-content/40">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs">
                        {formaterKm(t.kilometrage_actuel)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs font-bold text-success">
                        {formaterMontant(t.valeur_actuelle)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${etatCfg.color} badge-sm gap-1`}>
                        <IconEtat className="w-3 h-3" /> {etatCfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/tricycles/${t.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/tricycles/${t.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectionne(t);
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
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && selectionne && (
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
              <h3 className="text-xl font-bold mb-2">Supprimer le tricycle</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{selectionne.numero_interne}</strong> ?
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

export default Tricycles;