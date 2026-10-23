// src/components/achats/ValidationDemandes.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare, Search, Eye, Loader2, AlertCircle, RefreshCw,
  CheckCircle, XCircle, Send, User, Briefcase, AlertTriangle,
  ShieldCheck, Clock
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const URGENCES_CONFIG = {
  basse:    { label: 'Basse',    color: 'ghost' },
  normale:  { label: 'Normale',  color: 'info' },
  haute:    { label: 'Haute',    color: 'warning' },
  critique: { label: 'Critique', color: 'error' },
};

const ValidationDemandes = () => {
  const [demandes, setDemandes] = useState([]);
  const [demandesFiltrees, setDemandesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreUrgence, setFiltreUrgence] = useState('all');
  const [chargementAction, setChargementAction] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/demandes-achat/en_attente/');
      const data = res.data.results || res.data || [];
      setDemandes(data);
      setDemandesFiltrees(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les demandes en attente');
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
    if (filtreUrgence !== 'all') filtre = filtre.filter(d => d.urgence === filtreUrgence);
    setDemandesFiltrees(filtre);
  }, [recherche, filtreUrgence, demandes]);

  const valider = async (id) => {
    if (!window.confirm('Valider cette demande ?')) return;
    setChargementAction(id);
    try {
      await AxiosInstance.post(`/demandes-achat/${id}/valider/`);
      setDemandes(demandes.filter(d => d.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setChargementAction(null);
    }
  };

  const refuser = async (id) => {
    const motif = window.prompt('Motif du refus (obligatoire) :');
    if (motif === null) return;
    if (!motif.trim()) {
      alert('Le motif est obligatoire pour refuser.');
      return;
    }
    setChargementAction(id);
    try {
      await AxiosInstance.post(`/demandes-achat/${id}/refuser/`, {
        commentaire_validation: motif,
      });
      setDemandes(demandes.filter(d => d.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du refus');
    } finally {
      setChargementAction(null);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const filtresActifs = recherche || filtreUrgence !== 'all';

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
            <CheckSquare className="w-3 h-3" /> Achats / Validation
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-primary" />
            Validation des demandes
          </h1>
          <p className="text-base-content/60 mt-1">
            {demandesFiltrees.length} demande{demandesFiltrees.length > 1 ? 's' : ''} en attente
            {filtresActifs && demandes.length !== demandesFiltrees.length && (
              <span className="text-base-content/40"> (sur {demandes.length})</span>
            )}
          </p>
        </div>
        <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* ALERTE */}
      {demandes.length > 0 && (
        <div className="alert alert-info mb-6">
          <Clock className="w-5 h-5" />
          <div>
            <p className="font-bold">En attente de validation</p>
            <p className="text-sm">
              {demandes.length} demande{demandes.length > 1 ? 's' : ''} attendent votre décision.
            </p>
          </div>
        </div>
      )}

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

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreUrgence('all');
                }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {demandesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune demande ne correspond' : 'Aucune demande en attente'}
          </p>
          <p className="text-sm text-base-content/40 mt-1">
            Toutes les demandes ont été traitées.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {demandesFiltrees.map(d => {
            const urgenceCfg = URGENCES_CONFIG[d.urgence] || URGENCES_CONFIG.normale;
            const isLoading = chargementAction === d.id;
            return (
              <div
                key={d.id}
                className="card bg-base-100 shadow-sm border border-base-300"
              >
                <div className="card-body p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-primary">
                          {d.numero}
                        </span>
                        <span className={`badge badge-${urgenceCfg.color} badge-sm`}>
                          {urgenceCfg.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-base truncate">{d.objet}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-base-content/60">
                        {d.demandeur_nom && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {d.demandeur_nom}
                          </span>
                        )}
                        {d.service && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {d.service}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formaterDate(d.date_demande)}
                        </span>
                      </div>
                    </div>
                    <span className="badge badge-info badge-lg gap-1">
                      <Send className="w-3 h-3" /> Soumise
                    </span>
                  </div>

                  <div className="divider my-1"></div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      to={`/demandes-achat/${d.id}`}
                      className="btn btn-ghost btn-sm gap-2"
                    >
                      <Eye className="w-4 h-4" /> Voir le détail
                    </Link>

                    <div className="flex gap-2">
                      <button
                        onClick={() => refuser(d.id)}
                        className="btn btn-error btn-sm gap-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Refuser
                      </button>
                      <button
                        onClick={() => valider(d.id)}
                        className="btn btn-success btn-sm gap-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        Valider
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ValidationDemandes;