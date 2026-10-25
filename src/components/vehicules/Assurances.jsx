// src/components/vehicules/Assurances.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Search, Plus, Eye, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, XCircle, AlertTriangle, Calendar,
  Building2, DollarSign, FileText, Clock
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Assurances = () => {
  const [assurances, setAssurances] = useState([]);
  const [assurancesFiltrees, setAssurancesFiltrees] = useState([]);
  const [engins, setEngins] = useState([]);
  const [compagnies, setCompagnies] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');  // all | valide | expire | expire_bientot
  const [filtreEngin, setFiltreEngin] = useState('all');
  const [filtreCompagnie, setFiltreCompagnie] = useState('all');
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
      const [assurancesRes, tricyclesRes, vehiculesRes] = await Promise.all([
        AxiosInstance.get('/assurances/?page_size=500'),
        AxiosInstance.get('/tricycles/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/vehicules/?page_size=500').catch(() => ({ data: [] })),
      ]);

      const dataAssurances = assurancesRes.data.results || assurancesRes.data || [];
      const dataTricycles = tricyclesRes.data.results || tricyclesRes.data || [];
      const dataVehicules = vehiculesRes.data.results || vehiculesRes.data || [];

      setAssurances(dataAssurances);
      setAssurancesFiltrees(dataAssurances);

      // Liste unifiée des engins
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

      // Extraire les compagnies uniques
      const compagniesUniques = [...new Set(
        dataAssurances.map(a => a.compagnie).filter(Boolean)
      )].sort();
      setCompagnies(compagniesUniques);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les assurances');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = assurances;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.compagnie?.toLowerCase().includes(terme) ||
        a.numero_police?.toLowerCase().includes(terme) ||
        a.type_couverture?.toLowerCase().includes(terme) ||
        a.engin_libelle?.toLowerCase().includes(terme)
      );
    }

    if (filtreStatut === 'valide') {
      filtre = filtre.filter(a => !a.est_expire);
    } else if (filtreStatut === 'expire') {
      filtre = filtre.filter(a => a.est_expire);
    } else if (filtreStatut === 'expire_bientot') {
      filtre = filtre.filter(a =>
        !a.est_expire && a.jours_avant_expiration !== null && a.jours_avant_expiration <= 30
      );
    }

    if (filtreEngin !== 'all') {
      if (filtreEngin.startsWith('tricycle-')) {
        const id = filtreEngin.replace('tricycle-', '');
        filtre = filtre.filter(a => String(a.tricycle) === id);
      } else if (filtreEngin.startsWith('vehicule-')) {
        const id = filtreEngin.replace('vehicule-', '');
        filtre = filtre.filter(a => String(a.vehicule) === id);
      }
    }

    if (filtreCompagnie !== 'all') {
      filtre = filtre.filter(a => a.compagnie === filtreCompagnie);
    }

    setAssurancesFiltrees(filtre);
  }, [recherche, filtreStatut, filtreEngin, filtreCompagnie, assurances]);

  const supprimer = async () => {
    if (!selectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/assurances/${selectionne.id}/`);
      setAssurances(assurances.filter(a => a.id !== selectionne.id));
      setShowModalSuppression(false);
      setSelectionne(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const stats = useMemo(() => {
    const valides = assurances.filter(a => !a.est_expire);
    const expirees = assurances.filter(a => a.est_expire);
    const expirentBientot = assurances.filter(a =>
      !a.est_expire && a.jours_avant_expiration !== null && a.jours_avant_expiration <= 30
    );
    const primeTotale = assurances.reduce((s, a) => s + Number(a.prime_annuelle || 0), 0);

    return {
      total: assurances.length,
      valides: valides.length,
      expirees: expirees.length,
      expirentBientot: expirentBientot.length,
      primeTotale,
    };
  }, [assurances]);

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const getStatutCfg = (a) => {
    if (a.est_expire) {
      return { label: 'Expirée', color: 'error', icon: XCircle };
    }
    if (a.jours_avant_expiration !== null && a.jours_avant_expiration <= 30) {
      return { label: `Expire dans ${a.jours_avant_expiration}j`, color: 'warning', icon: AlertTriangle };
    }
    return { label: 'Valide', color: 'success', icon: CheckCircle };
  };

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreEngin !== 'all' || filtreCompagnie !== 'all';

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
            <Shield className="w-3 h-3" /> Véhicules / Assurances
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Assurances véhicules
          </h1>
          <p className="text-base-content/60 mt-1">
            {assurancesFiltrees.length} assurance{assurancesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && assurances.length !== assurancesFiltrees.length && (
              <span className="text-base-content/40"> (sur {assurances.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/assurances/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle assurance
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
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
              <p className="text-xs text-base-content/50 uppercase">Valides</p>
              <p className="text-xl font-bold text-success">{stats.valides}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Bientôt expirées</p>
              <p className="text-xl font-bold text-warning">{stats.expirentBientot}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Expirées</p>
              <p className="text-xl font-bold text-error">{stats.expirees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Primes</p>
              <p className="text-sm font-bold font-mono text-info truncate">
                {formaterMontant(stats.primeTotale)}
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
                  placeholder="Rechercher par compagnie, n° police, engin..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

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
              className="select select-bordered select-sm max-w-[220px]"
              value={filtreCompagnie}
              onChange={(e) => setFiltreCompagnie(e.target.value)}
            >
              <option value="all">Toutes compagnies</option>
              {compagnies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              <option value="valide">Valides</option>
              <option value="expire_bientot">Expirent bientôt</option>
              <option value="expire">Expirées</option>
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreStatut('all');
                  setFiltreEngin('all');
                  setFiltreCompagnie('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {assurancesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Shield className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune assurance ne correspond' : 'Aucune assurance'}
          </p>
          <Link to="/assurances/ajouter" className="btn btn-primary mt-4">
            Créer une assurance
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Engin</th>
                <th className="text-xs uppercase">Compagnie</th>
                <th className="text-xs uppercase">N° Police</th>
                <th className="text-xs uppercase">Couverture</th>
                <th className="text-xs uppercase">Période</th>
                <th className="text-xs uppercase text-right">Prime</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assurancesFiltrees.map(a => {
                const statutCfg = getStatutCfg(a);
                const IconStatut = statutCfg.icon;
                return (
                  <tr
                    key={a.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <p className="text-sm truncate max-w-[180px]">
                        {a.engin_libelle || '—'}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-base-content/40" />
                        <span className="text-xs truncate max-w-[150px]">
                          {a.compagnie}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs">
                        {a.numero_police || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {a.type_couverture || '—'}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs font-mono">
                        {formaterDate(a.date_debut)} → {formaterDate(a.date_fin)}
                      </p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs font-bold">
                        {formaterMontant(a.prime_annuelle)}
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
                          to={`/assurances/${a.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectionne(a);
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
              <h3 className="text-xl font-bold mb-2">Supprimer l'assurance</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'assurance <strong>{selectionne.numero_police}</strong> de <strong>{selectionne.compagnie}</strong> ?
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

export default Assurances;