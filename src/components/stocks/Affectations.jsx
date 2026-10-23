// src/components/stocks/Affectations.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck, Search, Plus, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, Clock, RotateCcw, User
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Affectations = () => {
  const [affectations, setAffectations] = useState([]);
  const [affectationsFiltrees, setAffectationsFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all'); // all | en_cours | retournees

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/affectations-equipements/');
      const data = res.data.results || res.data || [];
      setAffectations(data);
      setAffectationsFiltrees(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les affectations');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = affectations;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.equipement_code?.toLowerCase().includes(terme) ||
        a.equipement_designation?.toLowerCase().includes(terme) ||
        a.employe_nom?.toLowerCase().includes(terme) ||
        a.equipe_nom?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut === 'en_cours') {
      filtre = filtre.filter(a => !a.date_retour);
    } else if (filtreStatut === 'retournees') {
      filtre = filtre.filter(a => a.date_retour);
    }
    setAffectationsFiltrees(filtre);
  }, [recherche, filtreStatut, affectations]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const filtresActifs = recherche || filtreStatut !== 'all';

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
            <UserCheck className="w-3 h-3" /> Logistique / Affectations
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" />
            Affectations d'équipements
          </h1>
          <p className="text-base-content/60 mt-1">
            {affectationsFiltrees.length} affectation{affectationsFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && affectations.length !== affectationsFiltrees.length && (
              <span className="text-base-content/40"> (sur {affectations.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/affectations/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle affectation
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
                  placeholder="Rechercher par code équipement, employé..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Toutes les affectations</option>
              <option value="en_cours">En cours</option>
              <option value="retournees">Retournées</option>
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
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
      {affectationsFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <UserCheck className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune affectation ne correspond' : 'Aucune affectation'}
          </p>
          <Link to="/affectations/ajouter" className="btn btn-primary mt-4">
            Créer une affectation
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Équipement</th>
                <th className="text-xs uppercase">Bénéficiaire</th>
                <th className="text-xs uppercase">Date affectation</th>
                <th className="text-xs uppercase">Date retour</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {affectationsFiltrees.map(a => {
                const estEnCours = !a.date_retour;
                return (
                  <tr
                    key={a.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <p className="font-mono text-sm font-bold text-primary">
                        {a.equipement_code}
                      </p>
                      <p className="text-xs text-base-content/60 truncate max-w-[220px]">
                        {a.equipement_designation}
                      </p>
                    </td>
                    <td>
                      {a.employe_nom ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-base-content/40" />
                          <span className="text-sm truncate max-w-[180px]">
                            {a.employe_nom}
                          </span>
                        </div>
                      ) : a.equipe_nom ? (
                        <span className="text-sm">{a.equipe_nom}</span>
                      ) : (
                        <span className="text-xs text-base-content/40">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {formaterDate(a.date_affectation)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {formaterDate(a.date_retour)}
                      </span>
                    </td>
                    <td>
                      {estEnCours ? (
                        <span className="badge badge-info badge-sm gap-1">
                          <Clock className="w-3 h-3" /> En cours
                        </span>
                      ) : (
                        <span className="badge badge-success badge-sm gap-1">
                          <CheckCircle className="w-3 h-3" /> Retournée
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/affectations/${a.id}`}
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

export default Affectations;