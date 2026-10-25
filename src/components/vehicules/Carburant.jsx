// src/components/vehicules/Carburant.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet, Search, Plus, Eye, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, TrendingUp, DollarSign, Gauge,
  Calendar, MapPin, User, Fuel, AlertTriangle, Car
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CARBURANT = {
  essence: { label: 'Essence', color: 'warning' },
  gasoil:  { label: 'Gasoil',  color: 'info' },
  huile:   { label: 'Huile',   color: 'secondary' },
};

const Carburant = () => {
  const [pleins, setPleins] = useState([]);
  const [pleinsFiltres, setPleinsFiltres] = useState([]);
  const [engins, setEngins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreEngin, setFiltreEngin] = useState('all');
  const [dateDebut, setDateDebut] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]
  );
  const [dateFin, setDateFin] = useState(
    new Date().toISOString().split('T')[0]
  );
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
      const [pleinsRes, tricyclesRes, vehiculesRes] = await Promise.all([
        AxiosInstance.get('/pleins-carburant/?page_size=500'),
        AxiosInstance.get('/tricycles/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/vehicules/?page_size=500').catch(() => ({ data: [] })),
      ]);
      const dataPleins = pleinsRes.data.results || pleinsRes.data || [];
      const dataTricycles = tricyclesRes.data.results || tricyclesRes.data || [];
      const dataVehicules = vehiculesRes.data.results || vehiculesRes.data || [];

      setPleins(dataPleins);
      setPleinsFiltres(dataPleins);

      // Construire la liste unifiée des engins
      const tousEngins = [
        ...dataTricycles.map(t => ({
          id: `tricycle-${t.id}`,
          type: 'tricycle',
          numero: t.numero_interne,
          label: `Tricycle ${t.numero_interne}${t.immatriculation ? ` (${t.immatriculation})` : ''}`,
          rawId: t.id,
        })),
        ...dataVehicules.map(v => ({
          id: `vehicule-${v.id}`,
          type: 'vehicule',
          numero: v.numero_interne,
          label: `Véhicule ${v.numero_interne}${v.immatriculation ? ` (${v.immatriculation})` : ''}`,
          rawId: v.id,
        })),
      ];
      setEngins(tousEngins);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les pleins de carburant');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = pleins;

    // Filtre par date
    filtre = filtre.filter(p => {
      if (!p.date) return false;
      if (dateDebut && p.date < dateDebut) return false;
      if (dateFin && p.date > dateFin) return false;
      return true;
    });

    // Recherche
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(p =>
        p.engin_libelle?.toLowerCase().includes(terme) ||
        p.station?.toLowerCase().includes(terme) ||
        p.conducteur_nom?.toLowerCase().includes(terme)
      );
    }

    // Type carburant
    if (filtreType !== 'all') {
      filtre = filtre.filter(p => p.type_carburant === filtreType);
    }

    // Engin
    if (filtreEngin !== 'all') {
      if (filtreEngin.startsWith('tricycle-')) {
        const id = filtreEngin.replace('tricycle-', '');
        filtre = filtre.filter(p => String(p.tricycle) === id);
      } else if (filtreEngin.startsWith('vehicule-')) {
        const id = filtreEngin.replace('vehicule-', '');
        filtre = filtre.filter(p => String(p.vehicule) === id);
      }
    }

    setPleinsFiltres(filtre);
  }, [recherche, filtreType, filtreEngin, dateDebut, dateFin, pleins]);

  const supprimer = async () => {
    if (!selectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/pleins-carburant/${selectionne.id}/`);
      setPleins(pleins.filter(p => p.id !== selectionne.id));
      setShowModalSuppression(false);
      setSelectionne(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const litres = pleinsFiltres.reduce((s, p) => s + Number(p.litres || 0), 0);
    const montant = pleinsFiltres.reduce((s, p) => s + Number(p.montant || 0), 0);
    const prixMoyen = litres > 0 ? montant / litres : 0;
    const consommations = pleinsFiltres
      .map(p => p.consommation)
      .filter(c => c !== null && c !== undefined && c > 0);
    const consoMoyenne = consommations.length > 0
      ? consommations.reduce((s, c) => s + c, 0) / consommations.length
      : 0;

    return {
      total: pleinsFiltres.length,
      litres,
      montant,
      prixMoyen,
      consoMoyenne,
    };
  }, [pleinsFiltres]);

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';
  };

  const formaterNombre = (n, dec = 2) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      .format(Number(n || 0));

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const filtresActifs = recherche || filtreType !== 'all' || filtreEngin !== 'all';

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
            <Droplet className="w-3 h-3" /> Véhicules / Carburant
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Droplet className="w-8 h-8 text-warning" />
            Pleins de carburant
          </h1>
          <p className="text-base-content/60 mt-1">
            {pleinsFiltres.length} plein{pleinsFiltres.length > 1 ? 's' : ''} sur la période
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/carburant/ajouter" className="btn btn-warning gap-2">
            <Plus className="w-5 h-5" /> Nouveau plein
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Fuel className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Pleins</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Litres</p>
              <p className="text-xl font-bold font-mono text-info truncate">
                {formaterNombre(stats.litres, 1)} L
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Montant total</p>
              <p className="text-sm font-bold font-mono text-success truncate">
                {formaterMontant(stats.montant)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Conso. moy.</p>
              <p className="text-sm font-bold font-mono text-primary">
                {stats.consoMoyenne > 0 ? `${formaterNombre(stats.consoMoyenne, 1)} L/100km` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4 space-y-3">
          {/* Ligne dates */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="form-control">
              <label className="label py-0 pb-1">
                <span className="label-text text-xs font-medium">Du</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label py-0 pb-1">
                <span className="label-text text-xs font-medium">Au</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label py-0 pb-1">
                <span className="label-text text-xs font-medium">Recherche</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Engin, station, conducteur..."
                  className="input input-bordered input-sm w-full pl-9"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Ligne filtres */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="select select-bordered select-sm max-w-[280px]"
              value={filtreEngin}
              onChange={(e) => setFiltreEngin(e.target.value)}
            >
              <option value="all">Tous les engins</option>
              {engins.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous types</option>
              {Object.entries(TYPES_CARBURANT).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreType('all');
                  setFiltreEngin('all');
                  setDateDebut(
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                      .toISOString().split('T')[0]
                  );
                  setDateFin(new Date().toISOString().split('T')[0]);
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {pleinsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Droplet className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun plein ne correspond' : 'Aucun plein sur la période'}
          </p>
          <Link to="/carburant/ajouter" className="btn btn-warning mt-4">
            Enregistrer un plein
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Date</th>
                <th className="text-xs uppercase">Engin</th>
                <th className="text-xs uppercase">Type</th>
                <th className="text-xs uppercase text-right">Litres</th>
                <th className="text-xs uppercase text-right">Prix/L</th>
                <th className="text-xs uppercase text-right">Montant</th>
                <th className="text-xs uppercase text-right">Km compteur</th>
                <th className="text-xs uppercase text-right">Distance</th>
                <th className="text-xs uppercase text-right">Conso.</th>
                <th className="text-xs uppercase">Station</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pleinsFiltres.map(p => {
                const typeCfg = TYPES_CARBURANT[p.type_carburant] || TYPES_CARBURANT.essence;
                const conso = p.consommation;
                const consoAlerte = conso !== null && conso > 20;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="text-xs font-mono">
                        {formaterDate(p.date)}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[180px]">
                        {p.engin_libelle || '—'}
                      </p>
                    </td>
                    <td>
                      <span className={`badge badge-${typeCfg.color} badge-sm`}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs font-bold">
                        {formaterNombre(p.litres, 1)} L
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs">
                        {formaterMontant(p.prix_litre)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs font-bold text-success">
                        {formaterMontant(p.montant)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs">
                        {new Intl.NumberFormat('fr-FR').format(Number(p.km_compteur || 0))} km
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs">
                        {p.distance_parcourue !== null && p.distance_parcourue !== undefined
                          ? `${new Intl.NumberFormat('fr-FR').format(Math.round(p.distance_parcourue))} km`
                          : '—'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`font-mono text-xs font-bold ${
                        consoAlerte ? 'text-error' : conso ? 'text-primary' : 'text-base-content/40'
                      }`}>
                        {conso !== null && conso !== undefined
                          ? `${formaterNombre(conso, 1)} L/100`
                          : '—'}
                        {consoAlerte && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs truncate max-w-[120px]">
                        {p.station || '—'}
                      </p>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/carburant/${p.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectionne(p);
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
              <h3 className="text-xl font-bold mb-2">Supprimer le plein</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le plein du <strong>{formaterDate(selectionne.date)}</strong> pour <strong>{selectionne.engin_libelle}</strong> ?
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

export default Carburant;