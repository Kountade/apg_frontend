// components/comptabilite/DeclarationsFiscales.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Clock, AlertTriangle,
  FileCheck, FileSpreadsheet, Banknote, Users, MoreVertical,
  Send, Ban, RefreshCcw, ChevronDown
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// CONFIGURATION DES TYPES
// ============================================================
const TYPE_CONFIG = {
  tva: { label: 'TVA', cls: 'badge-primary', icon: FileText },
  is: { label: 'Impôt sur les sociétés', cls: 'badge-warning', icon: Banknote },
  ir: { label: 'Impôt sur le revenu', cls: 'badge-info', icon: Banknote },
  cnss: { label: 'CNSS', cls: 'badge-secondary', icon: Users },
  autre: { label: 'Autre', cls: 'badge-ghost', icon: FileSpreadsheet },
};

// ============================================================
// CONFIGURATION DES STATUTS
// ============================================================
const STATUT_CONFIG = {
  a_preparer: {
    label: 'À préparer',
    cls: 'badge-ghost',
    icon: FileText,
    description: 'Non commencée',
  },
  preparee: {
    label: 'Préparée',
    cls: 'badge-info',
    icon: FileCheck,
    description: 'Prête à déposer',
  },
  deposee: {
    label: 'Déposée',
    cls: 'badge-warning',
    icon: Send,
    description: 'Déposée à l\'administration',
  },
  payee: {
    label: 'Payée',
    cls: 'badge-success',
    icon: CheckCircle,
    description: 'Payée',
  },
  annulee: {
    label: 'Annulée',
    cls: 'badge-neutral',
    icon: XCircle,
    description: 'Annulée',
  },
};

// ============================================================
// ACTIONS DE CHANGEMENT DE STATUT
// ============================================================
const ACTIONS_STATUT = [
  {
    action: 'preparer',
    label: 'Marquer préparée',
    icon: FileCheck,
    color: 'info',
    from: ['a_preparer'],
  },
  {
    action: 'deposer',
    label: 'Marquer déposée',
    icon: Send,
    color: 'warning',
    from: ['preparee'],
  },
  {
    action: 'marquer_payee',
    label: 'Marquer payée',
    icon: CheckCircle,
    color: 'success',
    from: ['deposee'],
  },
  {
    action: 'remettre_a_preparer',
    label: 'Remettre à préparer',
    icon: RefreshCcw,
    color: 'ghost',
    from: ['preparee', 'deposee'],
  },
  {
    action: 'annuler',
    label: 'Annuler',
    icon: Ban,
    color: 'error',
    danger: true,
    from: ['a_preparer', 'preparee', 'deposee'],
  },
];

const DeclarationsFiscales = () => {
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState([]);
  const [declarationsFiltrees, setDeclarationsFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [declarationSelectionnee, setDeclarationSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [menuOuvertId, setMenuOuvertId] = useState(null);

  useEffect(() => {
    chargerDeclarations();
  }, []);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setMenuOuvertId(null);
    if (menuOuvertId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOuvertId]);

  const chargerDeclarations = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/declarations-fiscales/');
      const data = res.data.results || res.data || [];
      setDeclarations(data);
      setDeclarationsFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les déclarations fiscales');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = declarations;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(d => d.periode?.toLowerCase().includes(terme));
    }
    if (filtreType !== 'all') filtre = filtre.filter(d => d.type === filtreType);
    if (filtreStatut !== 'all') filtre = filtre.filter(d => d.statut === filtreStatut);
    setDeclarationsFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreStatut, declarations]);

  const totalPages = Math.ceil(declarationsFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return declarationsFiltrees.slice(debut, debut + elementsParPage);
  };

  // ============================================================
  // Suppression
  // ============================================================
  const supprimerDeclaration = async () => {
    if (!declarationSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/declarations-fiscales/${declarationSelectionnee.id}/`);
      setDeclarations(declarations.filter(d => d.id !== declarationSelectionnee.id));
      setShowModalSuppression(false);
      setDeclarationSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================================
  // Changement de statut
  // ============================================================
  const changerStatut = async (declaration, action) => {
    setChargementAction(true);
    setMenuOuvertId(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      let dataToSend = {};

      switch (action) {
        case 'preparer':
          dataToSend = { statut: 'preparee' };
          break;

        case 'deposer':
          dataToSend = {
            statut: 'deposee',
            date_depot: declaration.date_depot || today,
          };
          break;

        case 'marquer_payee':
          dataToSend = {
            statut: 'payee',
            date_paiement: declaration.date_paiement || today,
            date_depot: declaration.date_depot || today,
          };
          break;

        case 'remettre_a_preparer':
          dataToSend = {
            statut: 'a_preparer',
            date_depot: null,
            date_paiement: null,
          };
          break;

        case 'annuler':
          dataToSend = { statut: 'annulee' };
          break;

        default:
          break;
      }

      await AxiosInstance.patch(`/declarations-fiscales/${declaration.id}/`, dataToSend);
      await chargerDeclarations();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================================
  // Formatters
  // ============================================================
  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const getBadgeType = (type) => {
    const cfg = TYPE_CONFIG[type] || { label: type, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeStatut = (statut) => {
    const cfg = STATUT_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const isEnRetard = (d) => {
    if (d.statut === 'payee' || d.statut === 'annulee') return false;
    return d.date_echeance && new Date(d.date_echeance) < new Date();
  };

  const getActionsDisponibles = (declaration) => {
    return ACTIONS_STATUT.filter(a => a.from.includes(declaration.statut));
  };

  // ============================================================
  // RENDU
  // ============================================================
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
        <button onClick={chargerDeclarations} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: declarations.length,
    aPreparer: declarations.filter(d => d.statut === 'a_preparer').length,
    preparees: declarations.filter(d => d.statut === 'preparee').length,
    deposees: declarations.filter(d => d.statut === 'deposee').length,
    payees: declarations.filter(d => d.statut === 'payee').length,
    annulees: declarations.filter(d => d.statut === 'annulee').length,
    montantTotal: declarations.reduce((sum, d) => sum + Number(d.montant || 0), 0),
    montantPaye: declarations.filter(d => d.statut === 'payee')
      .reduce((sum, d) => sum + Number(d.montant || 0), 0),
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Déclarations fiscales</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Déclarations fiscales
          </h1>
          <p className="text-base-content/60 mt-1">
            {declarationsFiltrees.length} déclaration{declarationsFiltrees.length > 1 ? 's' : ''} trouvée{declarationsFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDeclarations} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/declarations-fiscales/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle déclaration
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ghost/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-base-content/50" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">À préparer</p>
              <p className="text-xl font-bold">{stats.aPreparer}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Préparées</p>
              <p className="text-xl font-bold text-info">{stats.preparees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Déposées</p>
              <p className="text-xl font-bold text-warning">{stats.deposees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Payées</p>
              <p className="text-xl font-bold text-success">{stats.payees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MONTANTS */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase tracking-wider">Montant total déclaré</p>
            <p className="text-2xl font-bold text-primary font-mono">{formaterMontant(stats.montantTotal)}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-success/5 to-success/10 border border-success/20 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase tracking-wider">Montant payé</p>
            <p className="text-2xl font-bold text-success font-mono">{formaterMontant(stats.montantPaye)}</p>
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
                  placeholder="Rechercher par période..."
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
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
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
      {declarationsFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune déclaration trouvée</p>
          <Link to="/declarations-fiscales/ajouter" className="btn btn-primary mt-4">
            Créer une déclaration
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Échéance</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Dépôt</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Paiement</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((d) => {
                  const enRetard = isEnRetard(d);
                  const actionsDisponibles = getActionsDisponibles(d);
                  const menuOuvert = menuOuvertId === d.id;

                  return (
                    <tr key={d.id} className={`hover:bg-base-200/50 border-b border-base-200 last:border-0 ${enRetard ? 'bg-error/5' : ''}`}>
                      <td>{getBadgeType(d.type)}</td>
                      <td>
                        <Link
                          to={`/declarations-fiscales/${d.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {d.periode}
                        </Link>
                      </td>
                      <td>
                        <p className={`text-xs ${enRetard ? 'text-error font-bold' : ''}`}>
                          {formaterDate(d.date_echeance)}
                        </p>
                        {enRetard && (
                          <p className="text-xs text-error">⚠ En retard</p>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm font-medium">
                          {formaterMontant(d.montant)}
                        </span>
                      </td>
                      <td>
                        {d.date_depot ? (
                          <p className="text-xs">{formaterDate(d.date_depot)}</p>
                        ) : (
                          <span className="text-base-content/30 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {d.date_paiement ? (
                          <p className="text-xs text-success">{formaterDate(d.date_paiement)}</p>
                        ) : (
                          <span className="text-base-content/30 text-xs">—</span>
                        )}
                      </td>
                      <td>{getBadgeStatut(d.statut)}</td>
                      <td>
                        <div className="flex justify-end gap-1">

                          {/* VOIR */}
                          <Link
                            to={`/declarations-fiscales/${d.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir les détails"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* MODIFIER */}
                          <Link
                            to={`/declarations-fiscales/${d.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          {/* DROPDOWN CHANGER STATUT */}
                          {actionsDisponibles.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOuvertId(menuOuvert ? null : d.id);
                                }}
                                className="btn btn-ghost btn-xs"
                                title="Changer le statut"
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
                                    Changer le statut
                                  </div>
                                  {actionsDisponibles.map((a) => {
                                    const IconAction = a.icon;
                                    return (
                                      <button
                                        key={a.action}
                                        onClick={() => changerStatut(d, a.action)}
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

                          {/* SUPPRIMER */}
                          <button
                            onClick={() => { setDeclarationSelectionnee(d); setShowModalSuppression(true); }}
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
                {Math.min(pageActuelle * elementsParPage, declarationsFiltrees.length)} sur{' '}
                {declarationsFiltrees.length} déclarations
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
      {showModalSuppression && declarationSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la déclaration</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la déclaration <strong>{TYPE_CONFIG[declarationSelectionnee.type]?.label}</strong> —
                <strong> {declarationSelectionnee.periode}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerDeclaration} disabled={chargementAction}>
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

export default DeclarationsFiscales;