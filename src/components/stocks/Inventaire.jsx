// src/components/stocks/Inventaire.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Search, Plus, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, XCircle, Clock
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  en_cours: { label: 'En cours', color: 'info', icon: Clock },
  valide:   { label: 'Validé',   color: 'success', icon: CheckCircle },
  annule:   { label: 'Annulé',   color: 'ghost', icon: XCircle },
};

const Inventaire = () => {
  const [inventaires, setInventaires] = useState([]);
  const [inventairesFiltres, setInventairesFiltres] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreMagasin, setFiltreMagasin] = useState('all');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [invRes, magRes] = await Promise.all([
        AxiosInstance.get('/inventaires/'),
        AxiosInstance.get('/magasins/?actif=true').catch(() => ({ data: [] })),
      ]);
      const data = invRes.data.results || invRes.data || [];
      setInventaires(data);
      setInventairesFiltres(data);
      setMagasins(magRes.data.results || magRes.data || []);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les inventaires');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = inventaires;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(i =>
        i.reference?.toLowerCase().includes(terme) ||
        i.magasin_nom?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') {
      filtre = filtre.filter(i => i.statut === filtreStatut);
    }
    if (filtreMagasin !== 'all') {
      filtre = filtre.filter(i => String(i.magasin) === String(filtreMagasin));
    }
    setInventairesFiltres(filtre);
  }, [recherche, filtreStatut, filtreMagasin, inventaires]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreMagasin !== 'all';

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
            <ClipboardList className="w-3 h-3" /> Stocks / Inventaire
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            Inventaires physiques
          </h1>
          <p className="text-base-content/60 mt-1">
            {inventairesFiltres.length} session{inventairesFiltres.length > 1 ? 's' : ''}
            {filtresActifs && inventaires.length !== inventairesFiltres.length && (
              <span className="text-base-content/40"> (sur {inventaires.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/inventaire/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvel inventaire
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
                  placeholder="Rechercher par référence, magasin..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreMagasin}
              onChange={(e) => setFiltreMagasin(e.target.value)}
            >
              <option value="all">Tous magasins</option>
              {magasins.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
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
                  setFiltreMagasin('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {inventairesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <ClipboardList className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun inventaire ne correspond' : 'Aucun inventaire'}
          </p>
          <Link to="/inventaire/ajouter" className="btn btn-primary mt-4">
            Créer un inventaire
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Référence</th>
                <th className="text-xs uppercase">Date</th>
                <th className="text-xs uppercase">Magasin</th>
                <th className="text-xs uppercase">Responsable</th>
                <th className="text-xs uppercase text-center">Lignes</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventairesFiltres.map(i => {
                const cfg = STATUTS_CONFIG[i.statut] || STATUTS_CONFIG.en_cours;
                const Icon = cfg.icon;
                return (
                  <tr
                    key={i.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {i.reference}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {formaterDate(i.date_inventaire)}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[180px]">{i.magasin_nom || '—'}</p>
                    </td>
                    <td>
                      <p className="text-xs truncate max-w-[150px]">
                        {i.responsable_nom || '—'}
                      </p>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-ghost badge-sm">
                        {i.nombre_lignes || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${cfg.color} badge-sm gap-1`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/inventaire/${i.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir / Valider"
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

export default Inventaire;