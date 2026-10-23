// src/components/achats/Fournisseurs.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Search, Plus, Edit, Trash2, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, Star, Phone, Mail, MapPin
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  materiel:    { label: 'Matériel',      color: 'primary' },
  piece:       { label: 'Pièces',        color: 'info' },
  epi:         { label: 'EPI',           color: 'success' },
  carburant:   { label: 'Carburant',     color: 'warning' },
  service:     { label: 'Service',       color: 'secondary' },
  maintenance: { label: 'Maintenance',   color: 'error' },
  autre:       { label: 'Autre',         color: 'ghost' },
};

const STATUTS_CONFIG = {
  actif:    { label: 'Actif',     color: 'success' },
  inactif:  { label: 'Inactif',   color: 'ghost' },
  suspendu: { label: 'Suspendu',  color: 'warning' },
  archive:  { label: 'Archivé',   color: 'error' },
};

const Fournisseurs = () => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [fournisseursFiltres, setFournisseursFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
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
      const res = await AxiosInstance.get('/fournisseurs/?page_size=200');
      const data = res.data.results || res.data || [];
      setFournisseurs(data);
      setFournisseursFiltres(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les fournisseurs');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = fournisseurs;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(f =>
        f.nom?.toLowerCase().includes(terme) ||
        f.code?.toLowerCase().includes(terme) ||
        f.sigle?.toLowerCase().includes(terme) ||
        f.telephone?.toLowerCase().includes(terme) ||
        f.email?.toLowerCase().includes(terme) ||
        f.ville?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(f => f.type === filtreType);
    if (filtreStatut !== 'all') filtre = filtre.filter(f => f.statut === filtreStatut);
    setFournisseursFiltres(filtre);
  }, [recherche, filtreType, filtreStatut, fournisseurs]);

  const supprimer = async () => {
    if (!selectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/fournisseurs/${selectionne.id}/`);
      setFournisseurs(fournisseurs.filter(f => f.id !== selectionne.id));
      setShowModalSuppression(false);
      setSelectionne(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const filtresActifs = recherche || filtreType !== 'all' || filtreStatut !== 'all';

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
            <Building2 className="w-3 h-3" /> Achats / Fournisseurs
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Fournisseurs
          </h1>
          <p className="text-base-content/60 mt-1">
            {fournisseursFiltres.length} fournisseur{fournisseursFiltres.length > 1 ? 's' : ''}
            {filtresActifs && fournisseurs.length !== fournisseursFiltres.length && (
              <span className="text-base-content/40"> (sur {fournisseurs.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/fournisseurs/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau fournisseur
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
                  placeholder="Rechercher par nom, code, téléphone, ville..."
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
                  setFiltreType('all');
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
      {fournisseursFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Building2 className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun fournisseur ne correspond' : 'Aucun fournisseur'}
          </p>
          <Link to="/fournisseurs/ajouter" className="btn btn-primary mt-4">
            Créer un fournisseur
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Code</th>
                <th className="text-xs uppercase">Fournisseur</th>
                <th className="text-xs uppercase">Type</th>
                <th className="text-xs uppercase">Contact</th>
                <th className="text-xs uppercase">Ville</th>
                <th className="text-xs uppercase text-center">Note</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fournisseursFiltres.map(f => {
                const typeCfg = TYPES_CONFIG[f.type] || TYPES_CONFIG.autre;
                const statutCfg = STATUTS_CONFIG[f.statut] || STATUTS_CONFIG.actif;
                return (
                  <tr
                    key={f.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-xs font-bold text-primary">
                        {f.code}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm truncate max-w-[220px]">
                        {f.nom}
                      </p>
                      {f.sigle && (
                        <p className="text-xs text-base-content/50">{f.sigle}</p>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${typeCfg.color} badge-sm`}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        {f.telephone && (
                          <p className="text-xs flex items-center gap-1">
                            <Phone className="w-3 h-3 text-base-content/40" />
                            {f.telephone}
                          </p>
                        )}
                        {f.email && (
                          <p className="text-xs flex items-center gap-1 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-base-content/40" />
                            {f.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <p className="text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-base-content/40" />
                        {f.ville || '—'}
                      </p>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                        <span className="text-xs font-bold">
                          {Number(f.note_moyenne || 0).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${statutCfg.color} badge-sm`}>
                        {statutCfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/fournisseurs/${f.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/fournisseurs/${f.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectionne(f);
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
              <h3 className="text-xl font-bold mb-2">Supprimer le fournisseur</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{selectionne.nom}</strong> ?
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

export default Fournisseurs;