// components/stocks/Magasins.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Warehouse, Search, Plus, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, MapPin, User, Building2, CheckCircle, Truck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  principal: { label: 'Dépôt principal', color: 'primary', icon: Warehouse },
  secondaire: { label: 'Dépôt secondaire', color: 'info', icon: Building2 },
  vehicule: { label: 'Stock véhicule', color: 'warning', icon: Truck },
  chantier: { label: 'Stock chantier', color: 'success', icon: MapPin },
};

const Magasins = () => {
  const [magasins, setMagasins] = useState([]);
  const [magasinsFiltres, setMagasinsFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [magasinSelectionne, setMagasinSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => { chargerMagasins(); }, []);

  const chargerMagasins = async () => {
    setChargement(true);
    try {
      const res = await AxiosInstance.get('/magasins/');
      const data = res.data.results || res.data || [];
      setMagasins(data);
      setMagasinsFiltres(data);
    } catch (err) {
      setErreur('Impossible de charger les magasins');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = magasins;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(m =>
        m.nom?.toLowerCase().includes(terme) ||
        m.code?.toLowerCase().includes(terme) ||
        m.zone?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(m => m.type === filtreType);
    setMagasinsFiltres(filtre);
  }, [recherche, filtreType, magasins]);

  const supprimer = async () => {
    if (!magasinSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/magasins/${magasinSelectionne.id}/`);
      setMagasins(magasins.filter(m => m.id !== magasinSelectionne.id));
      setShowModalSuppression(false);
      setMagasinSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur suppression');
    } finally {
      setChargementAction(false);
    }
  };

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
        <button onClick={chargerMagasins} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <Warehouse className="w-3 h-3" /> Logistique / Magasins
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Warehouse className="w-8 h-8 text-primary" />
            Magasins / Dépôts
          </h1>
          <p className="text-base-content/60 mt-1">
            {magasinsFiltres.length} magasin{magasinsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerMagasins} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/magasins/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau magasin
          </Link>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input type="text" placeholder="Rechercher..." className="input input-bordered w-full pl-10"
                  value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              </div>
            </div>
            <select className="select select-bordered select-sm" value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}>
              <option value="all">Tous les types</option>
              {Object.entries(TYPES_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            {(recherche || filtreType !== 'all') && (
              <button className="btn btn-ghost btn-sm gap-2"
                onClick={() => { setRecherche(''); setFiltreType('all'); }}>
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {magasinsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Warehouse className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun magasin</p>
          <Link to="/magasins/ajouter" className="btn btn-primary mt-4">Créer un magasin</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {magasinsFiltres.map(m => {
            const cfg = TYPES_CONFIG[m.type] || TYPES_CONFIG.principal;
            const Icon = cfg.icon;
            return (
              <div key={m.id} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md">
                <div className="card-body p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-${cfg.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 text-${cfg.color}`} />
                    </div>
                    <span className={`badge ${m.actif ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                      {m.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base">{m.nom}</h3>
                  <p className="text-xs font-mono text-base-content/50">{m.code}</p>
                  <span className={`badge badge-${cfg.color} badge-sm mt-2 gap-1`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  {m.zone && (
                    <p className="text-xs text-base-content/60 flex items-center gap-1 mt-2">
                      <MapPin className="w-3 h-3" /> {m.zone}
                    </p>
                  )}
                  {m.responsable_nom && (
                    <p className="text-xs text-base-content/60 flex items-center gap-1">
                      <User className="w-3 h-3" /> {m.responsable_nom}
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Link to={`/magasins/${m.id}/modifier`} className="btn btn-ghost btn-sm flex-1 gap-1">
                      <Edit className="w-3.5 h-3.5" /> Modifier
                    </Link>
                    <button
                      onClick={() => { setMagasinSelectionne(m); setShowModalSuppression(true); }}
                      className="btn btn-ghost btn-sm text-error"
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

      {showModalSuppression && magasinSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le magasin</h3>
              <p className="text-base-content/60 mb-4">Supprimer <strong>{magasinSelectionne.nom}</strong> ?</p>
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

export default Magasins;