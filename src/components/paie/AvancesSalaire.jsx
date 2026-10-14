// components/paie/AvancesSalaire.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HandCoins, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Clock, DollarSign,
  MoreVertical, CheckSquare, Wallet, TrendingUp, Users,
  FileText, BadgeCheck, Ban, ArrowUpRight
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des statuts
// ============================================================
const STATUTS_CONFIG = {
  demandee:   { label: 'Demandée',   cls: 'badge-warning', icon: Clock,        color: 'warning', description: 'En attente de validation' },
  validee:    { label: 'Validée',    cls: 'badge-info',    icon: CheckSquare,  color: 'info',    description: 'Validée, à payer' },
  refusee:    { label: 'Refusée',    cls: 'badge-error',   icon: XCircle,      color: 'error',   description: 'Refusée' },
  payee:      { label: 'Payée',      cls: 'badge-primary', icon: CheckCircle,  color: 'primary', description: 'Payée' },
  remboursee: { label: 'Remboursée', cls: 'badge-success', icon: BadgeCheck,   color: 'success', description: 'Remboursée' },
};

// ============================================================
// Actions de statut
// ============================================================
const ACTIONS_STATUT = [
  {
    action: 'valider',
    label: 'Valider',
    icon: CheckSquare,
    color: 'info',
    from: ['demandee'],
    confirmation: 'Valider cette demande d\'avance ?',
    primary: true,
  },
  {
    action: 'refuser',
    label: 'Refuser',
    icon: XCircle,
    color: 'error',
    danger: true,
    from: ['demandee'],
    confirmation: 'Refuser cette demande d\'avance ?',
  },
  {
    action: 'marquer_payee',
    label: 'Marquer payée',
    icon: DollarSign,
    color: 'success',
    from: ['validee'],
    confirmation: 'Marquer cette avance comme payée ?',
    primary: true,
  },
];

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const AvancesSalaire = () => {
  const [avances, setAvances] = useState([]);
  const [avancesFiltrees, setAvancesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreMois, setFiltreMois] = useState('all');
  const [filtreAnnee, setFiltreAnnee] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [avanceSelectionnee, setAvanceSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [menuOuvertId, setMenuOuvertId] = useState(null);

  // ------------------------------------------------------------
  // Chargement
  // ------------------------------------------------------------
  useEffect(() => {
    chargerAvances();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setMenuOuvertId(null);
    if (menuOuvertId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOuvertId]);

  const chargerAvances = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/avances-salaire/');
      const data = res.data.results || res.data || [];
      setAvances(data);
      setAvancesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les avances');
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Filtrage
  // ------------------------------------------------------------
  useEffect(() => {
    let filtre = avances;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.numero?.toLowerCase().includes(terme) ||
        a.employe_nom?.toLowerCase().includes(terme) ||
        a.motif?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(a => a.statut === filtreStatut);
    if (filtreMois !== 'all') filtre = filtre.filter(a => String(a.mois_deduction) === String(filtreMois));
    if (filtreAnnee !== 'all') filtre = filtre.filter(a => String(a.annee_deduction) === String(filtreAnnee));
    setAvancesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreMois, filtreAnnee, avances]);

  const totalPages = Math.ceil(avancesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return avancesFiltrees.slice(debut, debut + elementsParPage);
  };

  // ------------------------------------------------------------
  // Années disponibles (pour le filtre)
  // ------------------------------------------------------------
  const anneesDisponibles = useMemo(() => {
    const set = new Set(avances.map(a => a.annee_deduction).filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [avances]);

  // ------------------------------------------------------------
  // Suppression
  // ------------------------------------------------------------
  const supprimerAvance = async () => {
    if (!avanceSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/avances-salaire/${avanceSelectionnee.id}/`);
      setAvances(avances.filter(a => a.id !== avanceSelectionnee.id));
      setShowModalSuppression(false);
      setAvanceSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // ------------------------------------------------------------
  // Changement de statut
  // ------------------------------------------------------------
  const changerStatut = async (avance, action) => {
    const cfg = ACTIONS_STATUT.find(a => a.action === action);
    if (!confirm(cfg?.confirmation || 'Confirmer ?')) {
      setMenuOuvertId(null);
      return;
    }
    setChargementAction(true);
    setMenuOuvertId(null);
    try {
      await AxiosInstance.post(`/avances-salaire/${avance.id}/${action}/`);
      await chargerAvances();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
    }
  };

  // ------------------------------------------------------------
  // Formatage
  // ------------------------------------------------------------
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const formaterMontantCourt = (m) => {
    const num = Number(m || 0);
    if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const getCouleurMontant = (statut) => {
    if (statut === 'payee' || statut === 'remboursee') return 'text-success';
    if (statut === 'refusee') return 'text-base-content/40 line-through';
    if (statut === 'validee') return 'text-info';
    return 'text-primary';
  };

  // ------------------------------------------------------------
  // Badges
  // ------------------------------------------------------------
  const getBadgeStatut = (statut) => {
    const cfg = STATUTS_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const getActionsDisponibles = (avance) => {
    return ACTIONS_STATUT.filter(a => a.from.includes(avance.statut));
  };

  const getActionPrincipale = (avance) => {
    return ACTIONS_STATUT.find(a => a.primary && a.from.includes(avance.statut));
  };

  // ------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------
  const stats = useMemo(() => ({
    total: avances.length,
    demandees: avances.filter(a => a.statut === 'demandee').length,
    validees: avances.filter(a => a.statut === 'validee').length,
    payees: avances.filter(a => a.statut === 'payee').length,
    refusees: avances.filter(a => a.statut === 'refusee').length,
    montantPaye: avances.filter(a => a.statut === 'payee')
      .reduce((sum, a) => sum + Number(a.montant || 0), 0),
    montantEnAttente: avances.filter(a => ['demandee', 'validee'].includes(a.statut))
      .reduce((sum, a) => sum + Number(a.montant || 0), 0),
  }), [avances]);

  const filtresActifs =
    recherche || filtreStatut !== 'all' || filtreMois !== 'all' || filtreAnnee !== 'all';

  // ------------------------------------------------------------
  // Rendu : chargement
  // ------------------------------------------------------------
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // ------------------------------------------------------------
  // Rendu : erreur
  // ------------------------------------------------------------
  if (erreur) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={chargerAvances} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full p-6">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Paie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Avances sur salaire</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HandCoins className="w-8 h-8 text-primary" />
            Avances sur salaire
          </h1>
          <p className="text-base-content/60 mt-1">
            {avancesFiltrees.length} avance{avancesFiltrees.length > 1 ? 's' : ''} trouvée{avancesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && avances.length !== avancesFiltrees.length && (
              <span className="text-base-content/40"> (sur {avances.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerAvances} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/avances-salaire/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle avance
          </Link>
        </div>
      </div>

      {/* ============ STATISTIQUES ============ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <HandCoins className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Demandées</p>
              <p className="text-xl font-bold text-warning">{stats.demandees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">À payer</p>
              <p className="text-xl font-bold text-info">{stats.validees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Montant payé</p>
              <p className="text-sm font-bold text-success truncate font-mono">
                {formaterMontantCourt(stats.montantPaye)} GNF
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ ALERTE ============ */}
      {stats.montantEnAttente > 0 && (
        <div className="alert alert-warning mb-6">
          <Clock className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-bold">
              {stats.demandees + stats.validees} avance{stats.demandees + stats.validees > 1 ? 's' : ''} en attente de traitement
            </p>
            <p className="text-sm">
              Montant total en attente : <strong>{formaterMontant(stats.montantEnAttente)}</strong>
            </p>
          </div>
          {(stats.demandees > 0 || stats.validees > 0) && (
            <button
              onClick={() => setFiltreStatut(stats.demandees > 0 ? 'demandee' : 'validee')}
              className="btn btn-sm btn-ghost gap-1"
            >
              Voir <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* ============ FILTRES ============ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, employé, motif..."
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
              <option value="all">Tous les statuts ({avances.length})</option>
              {Object.entries(STATUTS_CONFIG).map(([key, cfg]) => {
                const count = avances.filter(a => a.statut === key).length;
                return (
                  <option key={key} value={key}>
                    {cfg.label} ({count})
                  </option>
                );
              })}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreMois}
              onChange={(e) => setFiltreMois(e.target.value)}
            >
              <option value="all">Tous les mois</option>
              {MOIS_NOMS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>

            {anneesDisponibles.length > 0 && (
              <select
                className="select select-bordered select-sm"
                value={filtreAnnee}
                onChange={(e) => setFiltreAnnee(e.target.value)}
              >
                <option value="all">Toutes les années</option>
                {anneesDisponibles.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreStatut('all');
                  setFiltreMois('all');
                  setFiltreAnnee('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============ LISTE ============ */}
      {avancesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <HandCoins className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune avance ne correspond aux filtres' : 'Aucune avance trouvée'}
          </p>
          {filtresActifs ? (
            <button
              className="btn btn-ghost mt-4"
              onClick={() => {
                setRecherche('');
                setFiltreStatut('all');
                setFiltreMois('all');
                setFiltreAnnee('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          ) : (
            <Link to="/avances-salaire/ajouter" className="btn btn-primary mt-4">
              Créer une avance
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date demande</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Déduction</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((a) => {
                  const actionsDisponibles = getActionsDisponibles(a);
                  const actionPrincipale = getActionPrincipale(a);
                  const menuOuvert = menuOuvertId === a.id;
                  const actionsSecondaires = actionPrincipale
                    ? actionsDisponibles.filter(act => act.action !== actionPrincipale.action)
                    : actionsDisponibles;

                  return (
                    <tr key={a.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <Link
                          to={`/avances-salaire/${a.id}`}
                          className="font-mono text-sm font-bold text-primary hover:underline"
                        >
                          {a.numero}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium text-sm truncate max-w-[180px]">
                          {a.employe_nom}
                        </p>
                      </td>
                      <td>
                        <p className="text-xs">{formaterDate(a.date_demande)}</p>
                      </td>
                      <td className="text-right">
                        <span className={`font-mono text-sm font-bold ${getCouleurMontant(a.statut)}`}>
                          {formaterMontantCourt(a.montant)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm font-mono">
                          {MOIS_NOMS[(a.mois_deduction || 1) - 1]} {a.annee_deduction}
                        </span>
                      </td>
                      <td>{getBadgeStatut(a.statut)}</td>
                      <td>
                        <div className="flex justify-end gap-1 items-center">
                          <Link
                            to={`/avances-salaire/${a.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {['demandee', 'validee'].includes(a.statut) && (
                            <Link
                              to={`/avances-salaire/${a.id}/modifier`}
                              className="btn btn-ghost btn-xs"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {/* Action principale directe */}
                          {actionPrincipale && (
                            <button
                              onClick={() => changerStatut(a, actionPrincipale.action)}
                              disabled={chargementAction}
                              className={`btn btn-${actionPrincipale.color} btn-xs gap-1`}
                              title={actionPrincipale.label}
                            >
                              {chargementAction ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <actionPrincipale.icon className="w-3 h-3" />
                              )}
                              <span className="hidden md:inline">{actionPrincipale.label}</span>
                            </button>
                          )}

                          {/* Menu pour actions secondaires */}
                          {actionsSecondaires.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOuvertId(menuOuvert ? null : a.id);
                                }}
                                className="btn btn-ghost btn-xs"
                                title="Plus d'actions"
                                disabled={chargementAction}
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {menuOuvert && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-56 bg-base-100 rounded-lg shadow-xl border border-base-300 z-20 py-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-3 py-1.5 text-[10px] text-base-content/40 uppercase tracking-wider border-b border-base-200">
                                    Actions
                                  </div>
                                  {actionsSecondaires.map((act) => {
                                    const IconAction = act.icon;
                                    return (
                                      <button
                                        key={act.action}
                                        onClick={() => changerStatut(a, act.action)}
                                        disabled={chargementAction}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left ${
                                          act.danger ? 'text-error hover:bg-error/10' : ''
                                        }`}
                                      >
                                        <IconAction className={`w-4 h-4 ${act.danger ? 'text-error' : `text-${act.color}`}`} />
                                        <span>{act.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => { setAvanceSelectionnee(a); setShowModalSuppression(true); }}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, avancesFiltrees.length)} sur{' '}
                {avancesFiltrees.length} avance{avancesFiltrees.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
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
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle + 1)}
                  disabled={pageActuelle === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============ MODAL SUPPRESSION ============ */}
      {showModalSuppression && avanceSelectionnee && (
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
              <h3 className="text-xl font-bold mb-2">Supprimer l'avance</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'avance <strong className="font-mono">{avanceSelectionnee.numero}</strong> ?
                <br />
                <span className="text-sm">Cette action est irréversible.</span>
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
                  onClick={supprimerAvance}
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

export default AvancesSalaire;