// components/paie/Primes.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Percent, BadgeDollarSign,
  FileText, Award, Heart, Gift, TrendingUp
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des types
// ============================================================
const TYPES_CONFIG = {
  prime: {
    label: 'Prime',
    cls: 'badge-primary',
    icon: Award,
    color: 'primary',
    description: 'Prime versée aux employés',
  },
  indemnite: {
    label: 'Indemnité',
    cls: 'badge-info',
    icon: BadgeDollarSign,
    color: 'info',
    description: 'Indemnité compensatoire',
  },
  avantage: {
    label: 'Avantage en nature',
    cls: 'badge-warning',
    icon: Gift,
    color: 'warning',
    description: 'Avantage en nature',
  },
};

const Primes = () => {
  const navigate = useNavigate();
  const [primes, setPrimes] = useState([]);
  const [primesFiltrees, setPrimesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreActif, setFiltreActif] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [primeSelectionnee, setPrimeSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerPrimes();
  }, []);

  const chargerPrimes = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/primes/');
      const data = res.data.results || res.data || [];
      setPrimes(data);
      setPrimesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les primes');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = primes;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(p =>
        p.code?.toLowerCase().includes(terme) ||
        p.nom?.toLowerCase().includes(terme) ||
        p.description?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(p => p.type === filtreType);
    if (filtreActif !== 'all') {
      const actif = filtreActif === 'actif';
      filtre = filtre.filter(p => p.actif === actif);
    }
    setPrimesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreActif, primes]);

  const totalPages = Math.ceil(primesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return primesFiltrees.slice(debut, debut + elementsParPage);
  };

  const supprimerPrime = async () => {
    if (!primeSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/primes/${primeSelectionnee.id}/`);
      setPrimes(primes.filter(p => p.id !== primeSelectionnee.id));
      setShowModalSuppression(false);
      setPrimeSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || TYPES_CONFIG.prime;
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

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
        <button onClick={chargerPrimes} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: primes.length,
    primes: primes.filter(p => p.type === 'prime').length,
    indemnites: primes.filter(p => p.type === 'indemnite').length,
    avantages: primes.filter(p => p.type === 'avantage').length,
    actives: primes.filter(p => p.actif).length,
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Paie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Primes & Indemnités</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary" />
            Primes & Indemnités
          </h1>
          <p className="text-base-content/60 mt-1">
            {primesFiltrees.length} élément{primesFiltrees.length > 1 ? 's' : ''} trouvé{primesFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerPrimes} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/primes/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle prime
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Primes</p>
              <p className="text-xl font-bold text-primary">{stats.primes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <BadgeDollarSign className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Indemnités</p>
              <p className="text-xl font-bold text-info">{stats.indemnites}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Actives</p>
              <p className="text-xl font-bold text-success">{stats.actives}</p>
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
                  placeholder="Rechercher par code, nom..."
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
              {Object.entries(TYPES_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreActif}
              onChange={(e) => setFiltreActif(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="actif">Actifs uniquement</option>
              <option value="inactif">Inactifs uniquement</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setRecherche(''); setFiltreType('all'); setFiltreActif('all'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {primesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <DollarSign className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune prime trouvée</p>
          <Link to="/primes/ajouter" className="btn btn-primary mt-4">
            Créer une prime
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Code</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Nom</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant fixe</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">% Salaire</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Imposable</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((p) => (
                  <tr key={p.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {p.code}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[220px]">{p.nom}</p>
                      {p.description && (
                        <p className="text-xs text-base-content/40 truncate max-w-[220px]">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td>{getBadgeType(p.type)}</td>
                    <td className="text-right">
                      <span className="font-mono text-sm">
                        {formaterMontant(p.montant_fixe)}
                      </span>
                    </td>
                    <td className="text-right">
                      {Number(p.pourcentage_salaire) > 0 ? (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <Percent className="w-3 h-3" />
                          {p.pourcentage_salaire}%
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      {p.imposable ? (
                        <span className="badge badge-success badge-xs">Oui</span>
                      ) : (
                        <span className="badge badge-ghost badge-xs">Non</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.actif ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/primes/${p.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setPrimeSelectionnee(p); setShowModalSuppression(true); }}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, primesFiltrees.length)} sur{' '}
                {primesFiltrees.length} éléments
              </p>
              <div className="flex gap-1">
                <button className="btn btn-sm btn-ghost" onClick={() => setPageActuelle(pageActuelle - 1)} disabled={pageActuelle === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`btn btn-sm ${pageActuelle === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPageActuelle(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="btn btn-sm btn-ghost" onClick={() => setPageActuelle(pageActuelle + 1)} disabled={pageActuelle === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && primeSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la prime</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{primeSelectionnee.nom}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerPrime} disabled={chargementAction}>
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

export default Primes;