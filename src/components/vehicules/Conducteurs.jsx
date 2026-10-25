// src/components/vehicules/Conducteurs.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck, Search, Plus, Eye, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, XCircle, AlertTriangle, User,
  Award, Phone, Calendar, Shield
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CATEGORIES_PERMIS = [
  { value: 'A', label: 'A (Moto)' },
  { value: 'B', label: 'B (Voiture)' },
  { value: 'C', label: 'C (Camion)' },
  { value: 'D', label: 'D (Bus)' },
  { value: 'E', label: 'E (Remorque)' },
];

const Conducteurs = () => {
  const [conducteurs, setConducteurs] = useState([]);
  const [conducteursFiltres, setConducteursFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState('all');
  const [filtrePermis, setFiltrePermis] = useState('all');
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
      const res = await AxiosInstance.get('/conducteurs/?page_size=200');
      const data = res.data.results || res.data || [];
      setConducteurs(data);
      setConducteursFiltres(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les conducteurs');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = conducteurs;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.employe_nom?.toLowerCase().includes(terme) ||
        c.numero_permis?.toLowerCase().includes(terme) ||
        c.categorie_permis?.toLowerCase().includes(terme)
      );
    }
    if (filtreActif !== 'all') {
      filtre = filtre.filter(c => c.actif === (filtreActif === 'oui'));
    }
    if (filtrePermis === 'valide') {
      filtre = filtre.filter(c => c.permis_valide);
    } else if (filtrePermis === 'expire') {
      filtre = filtre.filter(c => c.date_expiration_permis && !c.permis_valide);
    } else if (filtrePermis === 'sans_permis') {
      filtre = filtre.filter(c => !c.numero_permis);
    }
    setConducteursFiltres(filtre);
  }, [recherche, filtreActif, filtrePermis, conducteurs]);

  const supprimer = async () => {
    if (!selectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/conducteurs/${selectionne.id}/`);
      setConducteurs(conducteurs.filter(c => c.id !== selectionne.id));
      setShowModalSuppression(false);
      setSelectionne(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: conducteurs.length,
      actifs: conducteurs.filter(c => c.actif).length,
      permisValides: conducteurs.filter(c => c.permis_valide).length,
      permisExpires: conducteurs.filter(c => c.date_expiration_permis && !c.permis_valide).length,
    };
  }, [conducteurs]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const filtresActifs = recherche || filtreActif !== 'all' || filtrePermis !== 'all';

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
            <UserCheck className="w-3 h-3" /> Véhicules / Conducteurs
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" />
            Conducteurs
          </h1>
          <p className="text-base-content/60 mt-1">
            {conducteursFiltres.length} conducteur{conducteursFiltres.length > 1 ? 's' : ''}
            {filtresActifs && conducteurs.length !== conducteursFiltres.length && (
              <span className="text-base-content/40"> (sur {conducteurs.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/conducteurs/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau conducteur
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-primary" />
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
              <p className="text-xs text-base-content/50 uppercase">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Permis valides</p>
              <p className="text-xl font-bold text-info">{stats.permisValides}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Permis expirés</p>
              <p className="text-xl font-bold text-error">{stats.permisExpires}</p>
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
                  placeholder="Rechercher par nom, permis, catégorie..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreActif}
              onChange={(e) => setFiltreActif(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="oui">Actifs</option>
              <option value="non">Inactifs</option>
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtrePermis}
              onChange={(e) => setFiltrePermis(e.target.value)}
            >
              <option value="all">Tous permis</option>
              <option value="valide">Valides</option>
              <option value="expire">Expirés</option>
              <option value="sans_permis">Sans permis</option>
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreActif('all');
                  setFiltrePermis('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {conducteursFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <UserCheck className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun conducteur ne correspond' : 'Aucun conducteur'}
          </p>
          <Link to="/conducteurs/ajouter" className="btn btn-primary mt-4">
            Créer un conducteur
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Employé</th>
                <th className="text-xs uppercase">Téléphone</th>
                <th className="text-xs uppercase">N° Permis</th>
                <th className="text-xs uppercase">Catégorie</th>
                <th className="text-xs uppercase">Expiration</th>
                <th className="text-xs uppercase text-center">Expérience</th>
                <th className="text-xs uppercase text-center">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conducteursFiltres.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[180px]">
                          {c.employe_nom || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.employe_telephone ? (
                      <p className="text-xs flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-base-content/40" />
                        {c.employe_telephone}
                      </p>
                    ) : (
                      <span className="text-xs text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-xs">
                      {c.numero_permis || '—'}
                    </span>
                  </td>
                  <td>
                    {c.categorie_permis ? (
                      <span className="badge badge-info badge-sm">
                        {c.categorie_permis}
                      </span>
                    ) : (
                      <span className="text-xs text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    {c.date_expiration_permis ? (
                      <div className="flex items-center gap-1">
                        <span className={`font-mono text-xs ${!c.permis_valide ? 'text-error font-bold' : ''}`}>
                          {formaterDate(c.date_expiration_permis)}
                        </span>
                        {!c.permis_valide && (
                          <AlertTriangle className="w-3 h-3 text-error" />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-base-content/40">—</span>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="font-mono text-xs">
                      {c.annees_experience || 0} an{c.annees_experience > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="text-center">
                    {c.actif ? (
                      <span className="badge badge-success badge-sm gap-1">
                        <CheckCircle className="w-3 h-3" /> Actif
                      </span>
                    ) : (
                      <span className="badge badge-ghost badge-sm gap-1">
                        <XCircle className="w-3 h-3" /> Inactif
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/conducteurs/${c.id}/modifier`}
                        className="btn btn-ghost btn-xs"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectionne(c);
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
              ))}
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
              <h3 className="text-xl font-bold mb-2">Supprimer le conducteur</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le profil conducteur de <strong>{selectionne.employe_nom}</strong> ?
              </p>
              <p className="text-xs text-base-content/50 mb-4">
                ⚠️ L'employé ne sera pas supprimé, seul son profil conducteur sera retiré.
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

export default Conducteurs;