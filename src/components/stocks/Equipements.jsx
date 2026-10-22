// src/components/stocks/Equipements.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat, Search, Plus, Edit, Trash2, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, Shield, DollarSign, AlertTriangle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ETATS_CONFIG = {
  neuf:         { label: 'Neuf',          color: 'success' },
  bon:          { label: 'Bon état',      color: 'success' },
  usage:        { label: 'Usagé',         color: 'warning' },
  defectueux:   { label: 'Défectueux',    color: 'error' },
  hors_service: { label: 'Hors service',  color: 'error' },
  rebut:        { label: 'Mis au rebut',  color: 'ghost' },
};

const Equipements = () => {
  const [equipements, setEquipements] = useState([]);
  const [equipementsFiltres, setEquipementsFiltres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('all');
  const [filtreEtat, setFiltreEtat] = useState('all');
  const [equipementSelectionne, setEquipementSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [eqRes, catsRes] = await Promise.all([
        AxiosInstance.get('/equipements/'),
        AxiosInstance.get('/categories-materiel/?type=equipement').catch(() => ({ data: [] })),
      ]);
      const data = eqRes.data.results || eqRes.data || [];
      setEquipements(data);
      setEquipementsFiltres(data);
      setCategories(catsRes.data.results || catsRes.data || []);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les équipements');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = equipements;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(e =>
        e.designation?.toLowerCase().includes(terme) ||
        e.code?.toLowerCase().includes(terme) ||
        e.numero_serie?.toLowerCase().includes(terme) ||
        e.marque?.toLowerCase().includes(terme)
      );
    }
    if (filtreCategorie !== 'all') {
      filtre = filtre.filter(e => e.categorie_nom === filtreCategorie);
    }
    if (filtreEtat !== 'all') {
      filtre = filtre.filter(e => e.etat === filtreEtat);
    }
    setEquipementsFiltres(filtre);
  }, [recherche, filtreCategorie, filtreEtat, equipements]);

  const supprimer = async () => {
    if (!equipementSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/equipements/${equipementSelectionne.id}/`);
      setEquipements(equipements.filter(e => e.id !== equipementSelectionne.id));
      setShowModalSuppression(false);
      setEquipementSelectionne(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const stats = useMemo(() => ({
    total: equipements.length,
    bonEtat: equipements.filter(e => ['neuf', 'bon'].includes(e.etat)).length,
    defectueux: equipements.filter(e => ['defectueux', 'hors_service'].includes(e.etat)).length,
    valeurTotale: equipements.reduce((s, e) => s + Number(e.cout_acquisition || 0), 0),
  }), [equipements]);

  const filtresActifs =
    recherche || filtreCategorie !== 'all' || filtreEtat !== 'all';

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
            <HardHat className="w-3 h-3" /> Logistique / Équipements
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HardHat className="w-8 h-8 text-primary" />
            Équipements durables
          </h1>
          <p className="text-base-content/60 mt-1">
            {equipementsFiltres.length} équipement{equipementsFiltres.length > 1 ? 's' : ''}
            {filtresActifs && equipements.length !== equipementsFiltres.length && (
              <span className="text-base-content/40"> (sur {equipements.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/equipements/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvel équipement
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-primary" />
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
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En bon état</p>
              <p className="text-xl font-bold text-success">{stats.bonEtat}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Défectueux</p>
              <p className="text-xl font-bold text-error">{stats.defectueux}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Valeur totale</p>
              <p className="text-sm font-bold font-mono truncate">
                {new Intl.NumberFormat('fr-FR').format(stats.valeurTotale)} GNF
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
                  placeholder="Rechercher par code, n° série, marque..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
            >
              <option value="all">Toutes catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.nom}>{c.nom}</option>
              ))}
            </select>

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

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreCategorie('all');
                  setFiltreEtat('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {equipementsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <HardHat className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun équipement ne correspond' : 'Aucun équipement'}
          </p>
          <Link to="/equipements/ajouter" className="btn btn-primary mt-4">
            Créer un équipement
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Code</th>
                <th className="text-xs uppercase">Désignation</th>
                <th className="text-xs uppercase">N° série / Marque</th>
                <th className="text-xs uppercase">État</th>
                <th className="text-xs uppercase">Localisation</th>
                <th className="text-xs uppercase text-right">Valeur actuelle</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipementsFiltres.map(e => {
                const etatCfg = ETATS_CONFIG[e.etat] || ETATS_CONFIG.bon;
                return (
                  <tr
                    key={e.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {e.code}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm truncate max-w-[250px]">
                        {e.designation}
                      </p>
                    </td>
                    <td>
                      <p className="font-mono text-xs">{e.numero_serie || '—'}</p>
                      <p className="text-xs text-base-content/50">
                        {e.marque} {e.modele}
                      </p>
                    </td>
                    <td>
                      <span className={`badge badge-${etatCfg.color} badge-sm`}>
                        {etatCfg.label}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs truncate max-w-[150px]">
                        {e.localisation || '—'}
                      </p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold">
                        {formaterMontant(e.valeur_actuelle)}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/equipements/${e.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/equipements/${e.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setEquipementSelectionne(e);
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
      {showModalSuppression && equipementSelectionne && (
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
              <h3 className="text-xl font-bold mb-2">Supprimer l'équipement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{equipementSelectionne.designation}</strong> ?
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
                  {chargementAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipements;