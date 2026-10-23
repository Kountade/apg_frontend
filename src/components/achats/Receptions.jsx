// src/components/achats/Receptions.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Search, Plus, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, XCircle, Clock, Package
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon:  { label: 'Brouillon',      color: 'ghost',   icon: Clock },
  en_attente: { label: 'En attente',     color: 'info',    icon: Clock },
  controlee:  { label: 'Contrôlée',      color: 'primary', icon: CheckCircle },
  validee:    { label: 'Validée',        color: 'success', icon: CheckCircle },
  refusee:    { label: 'Refusée',        color: 'error',   icon: XCircle },
};

const Receptions = () => {
  const [receptions, setReceptions] = useState([]);
  const [receptionsFiltrees, setReceptionsFiltrees] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreFournisseur, setFiltreFournisseur] = useState('all');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [recRes, fourRes] = await Promise.all([
        AxiosInstance.get('/receptions/?page_size=200'),
        AxiosInstance.get('/fournisseurs/?page_size=500').catch(() => ({ data: [] })),
      ]);
      const data = recRes.data.results || recRes.data || [];
      setReceptions(data);
      setReceptionsFiltrees(data);
      setFournisseurs(fourRes.data.results || fourRes.data || []);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les réceptions');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = receptions;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(r =>
        r.numero?.toLowerCase().includes(terme) ||
        r.numero_bon_livraison?.toLowerCase().includes(terme) ||
        r.bon_commande_numero?.toLowerCase().includes(terme) ||
        r.fournisseur_nom?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(r => r.statut === filtreStatut);
    if (filtreFournisseur !== 'all') filtre = filtre.filter(r => String(r.fournisseur) === String(filtreFournisseur));
    setReceptionsFiltrees(filtre);
  }, [recherche, filtreStatut, filtreFournisseur, receptions]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreFournisseur !== 'all';

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
            <Truck className="w-3 h-3" /> Achats / Réceptions
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            Réceptions de marchandises
          </h1>
          <p className="text-base-content/60 mt-1">
            {receptionsFiltrees.length} réception{receptionsFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && receptions.length !== receptionsFiltrees.length && (
              <span className="text-base-content/40"> (sur {receptions.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/receptions/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle réception
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
                  placeholder="Rechercher par numéro, BC, fournisseur..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreFournisseur}
              onChange={(e) => setFiltreFournisseur(e.target.value)}
            >
              <option value="all">Tous fournisseurs</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
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
                  setFiltreFournisseur('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {receptionsFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Truck className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune réception ne correspond' : 'Aucune réception'}
          </p>
          <Link to="/receptions/ajouter" className="btn btn-primary mt-4">
            Créer une réception
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Numéro</th>
                <th className="text-xs uppercase">Fournisseur</th>
                <th className="text-xs uppercase">Bon de commande</th>
                <th className="text-xs uppercase">Date réception</th>
                <th className="text-xs uppercase">N° BL</th>
                <th className="text-xs uppercase text-center">Lignes</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receptionsFiltrees.map(r => {
                const cfg = STATUTS_CONFIG[r.statut] || STATUTS_CONFIG.brouillon;
                const Icon = cfg.icon;
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {r.numero}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[180px]">
                        {r.fournisseur_nom}
                      </p>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-primary">
                        {r.bon_commande_numero || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {formaterDate(r.date_reception)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {r.numero_bon_livraison || '—'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-ghost badge-sm">
                        {r.nombre_lignes || 0}
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
                          to={`/receptions/${r.id}`}
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

export default Receptions;