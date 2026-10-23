// src/components/achats/DemandesAchat.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus, Search, Plus, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, XCircle, Clock, Send,
  AlertTriangle, User, Briefcase
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon',  color: 'ghost',   icon: FilePlus },
  soumise:   { label: 'Soumise',    color: 'info',    icon: Send },
  validee:   { label: 'Validée',    color: 'success', icon: CheckCircle },
  refusee:   { label: 'Refusée',    color: 'error',   icon: XCircle },
  convertie: { label: 'Convertie',  color: 'primary', icon: CheckCircle },
  annulee:   { label: 'Annulée',    color: 'ghost',   icon: XCircle },
};

const URGENCES_CONFIG = {
  basse:    { label: 'Basse',    color: 'ghost' },
  normale:  { label: 'Normale',  color: 'info' },
  haute:    { label: 'Haute',    color: 'warning' },
  critique: { label: 'Critique', color: 'error' },
};

const DemandesAchat = () => {
  const [demandes, setDemandes] = useState([]);
  const [demandesFiltrees, setDemandesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreUrgence, setFiltreUrgence] = useState('all');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/demandes-achat/?page_size=200');
      const data = res.data.results || res.data || [];
      setDemandes(data);
      setDemandesFiltrees(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les demandes');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = demandes;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(d =>
        d.numero?.toLowerCase().includes(terme) ||
        d.objet?.toLowerCase().includes(terme) ||
        d.service?.toLowerCase().includes(terme) ||
        d.demandeur_nom?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(d => d.statut === filtreStatut);
    if (filtreUrgence !== 'all') filtre = filtre.filter(d => d.urgence === filtreUrgence);
    setDemandesFiltrees(filtre);
  }, [recherche, filtreStatut, filtreUrgence, demandes]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreUrgence !== 'all';

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
            <FilePlus className="w-3 h-3" /> Achats / Demandes
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FilePlus className="w-8 h-8 text-primary" />
            Demandes d'achat
          </h1>
          <p className="text-base-content/60 mt-1">
            {demandesFiltrees.length} demande{demandesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && demandes.length !== demandesFiltrees.length && (
              <span className="text-base-content/40"> (sur {demandes.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/demandes-achat/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle demande
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
                  placeholder="Rechercher par numéro, objet, service..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreUrgence}
              onChange={(e) => setFiltreUrgence(e.target.value)}
            >
              <option value="all">Toutes urgences</option>
              {Object.entries(URGENCES_CONFIG).map(([k, c]) => (
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
                  setFiltreUrgence('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {demandesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <FilePlus className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune demande ne correspond' : 'Aucune demande'}
          </p>
          <Link to="/demandes-achat/ajouter" className="btn btn-primary mt-4">
            Créer une demande
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Numéro</th>
                <th className="text-xs uppercase">Date</th>
                <th className="text-xs uppercase">Objet</th>
                <th className="text-xs uppercase">Demandeur</th>
                <th className="text-xs uppercase text-center">Urgence</th>
                <th className="text-xs uppercase text-center">Lignes</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demandesFiltrees.map(d => {
                const statutCfg = STATUTS_CONFIG[d.statut] || STATUTS_CONFIG.brouillon;
                const urgenceCfg = URGENCES_CONFIG[d.urgence] || URGENCES_CONFIG.normale;
                const IconStatut = statutCfg.icon;
                return (
                  <tr
                    key={d.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {d.numero}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {formaterDate(d.date_demande)}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm truncate max-w-[250px]">
                        {d.objet}
                      </p>
                      {d.service && (
                        <p className="text-xs text-base-content/50 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {d.service}
                        </p>
                      )}
                    </td>
                    <td>
                      <p className="text-xs truncate max-w-[150px]">
                        {d.demandeur_nom || '—'}
                      </p>
                    </td>
                    <td className="text-center">
                      <span className={`badge badge-${urgenceCfg.color} badge-sm`}>
                        {urgenceCfg.label}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-ghost badge-sm">
                        {d.nombre_lignes || 0}
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
                          to={`/demandes-achat/${d.id}`}
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

export default DemandesAchat;