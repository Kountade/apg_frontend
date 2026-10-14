// components/tresorerie/Decaissements.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Clock, DollarSign,
  User, Wallet, Banknote, Landmark, CreditCard, Building2,
  TrendingDown, MoreVertical, Ban, CheckSquare, XSquare
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des types de décaissement
// ============================================================
const TYPES_CONFIG = {
  paiement_salaire: { label: 'Paiement salaire', cls: 'badge-primary' },
  paiement_fournisseur: { label: 'Paiement fournisseur', cls: 'badge-info' },
  carburant: { label: 'Carburant', cls: 'badge-warning' },
  entretien: { label: 'Entretien', cls: 'badge-warning' },
  achat: { label: 'Achat', cls: 'badge-secondary' },
  transport: { label: 'Transport', cls: 'badge-ghost' },
  charge: { label: 'Charge', cls: 'badge-error' },
  avance: { label: 'Avance', cls: 'badge-accent' },
  depense_diverse: { label: 'Dépense diverse', cls: 'badge-ghost' },
  autre: { label: 'Autre', cls: 'badge-ghost' },
};

// ============================================================
// Configuration des statuts
// ============================================================
const STATUTS_CONFIG = {
  en_attente: { label: 'En attente', cls: 'badge-warning', icon: Clock },
  valide: { label: 'Validé', cls: 'badge-info', icon: CheckSquare },
  paye: { label: 'Payé', cls: 'badge-success', icon: CheckCircle },
  refuse: { label: 'Refusé', cls: 'badge-error', icon: XSquare },
  annule: { label: 'Annulé', cls: 'badge-neutral', icon: XCircle },
};

// ============================================================
// Actions de statut
// ============================================================
const ACTIONS_STATUT = [
  {
    action: 'valider',
    label: 'Valider la demande',
    icon: CheckSquare,
    color: 'info',
    from: ['en_attente'],
    confirmation: 'Valider cette demande de décaissement ?',
  },
  {
    action: 'refuser',
    label: 'Refuser la demande',
    icon: XSquare,
    color: 'error',
    danger: true,
    from: ['en_attente'],
    confirmation: 'Refuser cette demande de décaissement ?',
  },
  {
    action: 'marquer_paye',
    label: 'Marquer comme payé',
    icon: CheckCircle,
    color: 'success',
    from: ['valide'],
    confirmation: 'Confirmer le paiement de ce décaissement ? Le solde de la caisse sera impacté.',
  },
  {
    action: 'annuler',
    label: 'Annuler le décaissement',
    icon: Ban,
    color: 'error',
    danger: true,
    from: ['en_attente', 'valide'],
    confirmation: 'Annuler définitivement ce décaissement ?',
  },
];

const Decaissements = () => {
  const navigate = useNavigate();
  const [decaissements, setDecaissements] = useState([]);
  const [decaissementsFiltres, setDecaissementsFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [decaissementSelectionne, setDecaissementSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [menuOuvertId, setMenuOuvertId] = useState(null);

  useEffect(() => {
    chargerDecaissements();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setMenuOuvertId(null);
    if (menuOuvertId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOuvertId]);

  const chargerDecaissements = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/decaissements/');
      const data = res.data.results || res.data || [];
      setDecaissements(data);
      setDecaissementsFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les décaissements');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = decaissements;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(d =>
        d.numero?.toLowerCase().includes(terme) ||
        d.beneficiaire?.toLowerCase().includes(terme) ||
        d.motif?.toLowerCase().includes(terme) ||
        d.reference?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(d => d.type === filtreType);
    if (filtreStatut !== 'all') filtre = filtre.filter(d => d.statut === filtreStatut);
    setDecaissementsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreStatut, decaissements]);

  const totalPages = Math.ceil(decaissementsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return decaissementsFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerDecaissement = async () => {
    if (!decaissementSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/decaissements/${decaissementSelectionne.id}/`);
      setDecaissements(decaissements.filter(d => d.id !== decaissementSelectionne.id));
      setShowModalSuppression(false);
      setDecaissementSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const changerStatut = async (decaissement, action) => {
    if (!confirm(ACTIONS_STATUT.find(a => a.action === action)?.confirmation || 'Confirmer ?')) {
      setMenuOuvertId(null);
      return;
    }
    setChargementAction(true);
    setMenuOuvertId(null);
    try {
      await AxiosInstance.post(`/decaissements/${decaissement.id}/${action}/`);
      await chargerDecaissements();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || { label: type, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls} badge-sm`}>{cfg.label}</span>;
  };

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

  const getActionsDisponibles = (decaissement) => {
    return ACTIONS_STATUT.filter(a => a.from.includes(decaissement.statut));
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
        <button onClick={chargerDecaissements} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: decaissements.length,
    enAttente: decaissements.filter(d => d.statut === 'en_attente').length,
    valides: decaissements.filter(d => d.statut === 'valide').length,
    payes: decaissements.filter(d => d.statut === 'paye').length,
    montantPaye: decaissements.filter(d => d.statut === 'paye')
      .reduce((sum, d) => sum + Number(d.montant || 0), 0),
    montantEnAttente: decaissements.filter(d => d.statut === 'en_attente')
      .reduce((sum, d) => sum + Number(d.montant || 0), 0),
    montantAValider: decaissements.filter(d => d.statut === 'valide')
      .reduce((sum, d) => sum + Number(d.montant || 0), 0),
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Wallet className="w-3 h-3" />
            Trésorerie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Décaissements</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ArrowUpRight className="w-8 h-8 text-error" />
            Décaissements
          </h1>
          <p className="text-base-content/60 mt-1">
            {decaissementsFiltres.length} décaissement{decaissementsFiltres.length > 1 ? 's' : ''} trouvé{decaissementsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDecaissements} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/decaissements/ajouter" className="btn btn-error gap-2">
            <Plus className="w-5 h-5" /> Nouveau décaissement
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En attente</p>
              <p className="text-xl font-bold text-warning">{stats.enAttente}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Validés</p>
              <p className="text-xl font-bold text-info">{stats.valides}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Payés</p>
              <p className="text-xl font-bold text-success">{stats.payes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total payé</p>
              <p className="text-sm font-bold text-error truncate font-mono">
                {formaterMontant(stats.montantPaye)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {stats.montantEnAttente > 0 && (
        <div className="alert alert-warning mb-4">
          <Clock className="w-5 h-5" />
          <div>
            <p className="font-bold">Décaissements en attente de validation</p>
            <p className="text-sm">
              Montant total : <strong>{formaterMontant(stats.montantEnAttente)}</strong>
            </p>
          </div>
        </div>
      )}

      {stats.montantAValider > 0 && (
        <div className="alert alert-info mb-6">
          <CheckSquare className="w-5 h-5" />
          <div>
            <p className="font-bold">Décaissements validés à payer</p>
            <p className="text-sm">
              Montant total : <strong>{formaterMontant(stats.montantAValider)}</strong>
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
                  placeholder="Rechercher par numéro, bénéficiaire, motif..."
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
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUTS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setRecherche(''); setFiltreType('all'); setFiltreStatut('all'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {decaissementsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <ArrowUpRight className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun décaissement trouvé</p>
          <Link to="/decaissements/ajouter" className="btn btn-error mt-4">
            Créer un décaissement
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Bénéficiaire</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Motif</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((decaissement) => {
                  const actionsDisponibles = getActionsDisponibles(decaissement);
                  const menuOuvert = menuOuvertId === decaissement.id;

                  return (
                    <tr key={decaissement.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <Link to={`/decaissements/${decaissement.id}`} className="font-mono text-sm font-bold text-primary hover:underline">
                          {decaissement.numero}
                        </Link>
                      </td>
                      <td>
                        <p className="text-xs">{formaterDate(decaissement.date_demande)}</p>
                        {decaissement.date_paiement && (
                          <p className="text-xs text-success">
                            Payé: {formaterDate(decaissement.date_paiement)}
                          </p>
                        )}
                      </td>
                      <td>{getBadgeType(decaissement.type)}</td>
                      <td>
                        <p className="font-medium text-sm truncate max-w-[150px]">
                          {decaissement.beneficiaire || '—'}
                        </p>
                      </td>
                      <td>
                        <p className="text-xs truncate max-w-[200px]" title={decaissement.motif}>
                          {decaissement.motif || '—'}
                        </p>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm font-bold text-error">
                          -{formaterMontant(decaissement.montant)}
                        </span>
                      </td>
                      <td>{getBadgeStatut(decaissement.statut)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link to={`/decaissements/${decaissement.id}`} className="btn btn-ghost btn-xs" title="Voir">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {['en_attente'].includes(decaissement.statut) && (
                            <Link to={`/decaissements/${decaissement.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {actionsDisponibles.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOuvertId(menuOuvert ? null : decaissement.id);
                                }}
                                className="btn btn-ghost btn-xs"
                                title="Changer le statut"
                                disabled={chargementAction}
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {menuOuvert && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-64 bg-base-100 rounded-lg shadow-xl border border-base-300 z-20 py-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-3 py-1.5 text-[10px] text-base-content/40 uppercase tracking-wider border-b border-base-200">
                                    Changer le statut
                                  </div>
                                  {actionsDisponibles.map((a) => {
                                    const IconAction = a.icon;
                                    return (
                                      <button
                                        key={a.action}
                                        onClick={() => changerStatut(decaissement, a.action)}
                                        disabled={chargementAction}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left ${
                                          a.danger ? 'text-error hover:bg-error/10' : ''
                                        }`}
                                      >
                                        <IconAction className={`w-4 h-4 ${a.danger ? 'text-error' : `text-${a.color}`}`} />
                                        <span>{a.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => { setDecaissementSelectionne(decaissement); setShowModalSuppression(true); }}
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
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, decaissementsFiltres.length)} sur{' '}
                {decaissementsFiltres.length} décaissements
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
      {showModalSuppression && decaissementSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le décaissement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le décaissement <span className="font-bold font-mono">{decaissementSelectionne.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerDecaissement} disabled={chargementAction}>
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

export default Decaissements;