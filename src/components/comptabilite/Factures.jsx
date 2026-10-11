// components/comptabilite/Factures.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Receipt, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, FileText, CheckCircle, XCircle,
  DollarSign, Send, AlertTriangle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des statuts de facture
// ============================================================
const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost', icon: FileText },
  emise: { label: 'Émise', cls: 'badge-info', icon: Send },
  envoyee: { label: 'Envoyée', cls: 'badge-primary', icon: Send },
  partiellement_payee: { label: 'Partiellement payée', cls: 'badge-warning', icon: DollarSign },
  payee: { label: 'Payée', cls: 'badge-success', icon: CheckCircle },
  en_retard: { label: 'En retard', cls: 'badge-error', icon: AlertTriangle },
  litige: { label: 'Litige', cls: 'badge-error', icon: AlertCircle },
  annulee: { label: 'Annulée', cls: 'badge-neutral', icon: XCircle },
};

const TYPES_CONFIG = {
  proforma: { label: 'Pro-forma', cls: 'badge-outline' },
  definitive: { label: 'Définitive', cls: 'badge-primary' },
  avoir: { label: 'Avoir', cls: 'badge-warning' },
};

const Factures = () => {
  const navigate = useNavigate();
  const [factures, setFactures] = useState([]);
  const [facturesFiltres, setFacturesFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreType, setFiltreType] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerFactures();
  }, []);

  const chargerFactures = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/factures/');
      const data = res.data.results || res.data || [];
      setFactures(data);
      setFacturesFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les factures');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = factures;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(f =>
        f.numero?.toLowerCase().includes(terme) ||
        f.client_nom?.toLowerCase().includes(terme) ||
        f.objet?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(f => f.statut === filtreStatut);
    if (filtreType !== 'all') filtre = filtre.filter(f => f.type === filtreType);

    setFacturesFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreType, factures]);

  const totalPages = Math.ceil(facturesFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return facturesFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerFacture = async () => {
    if (!factureSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/factures/${factureSelectionnee.id}/`);
      setFactures(factures.filter(f => f.id !== factureSelectionnee.id));
      setShowModalSuppression(false);
      setFactureSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const getBadgeStatut = (statut) => {
    const cfg = STATUTS_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || { label: type, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls} badge-sm`}>{cfg.label}</span>;
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
        <button onClick={chargerFactures} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  const stats = {
    total: factures.length,
    payees: factures.filter(f => f.statut === 'payee').length,
    impayees: factures.filter(f => ['emise', 'envoyee', 'partiellement_payee', 'en_retard'].includes(f.statut)).length,
    enRetard: factures.filter(f => f.statut === 'en_retard' || (f.est_en_retard && f.statut !== 'payee')).length,
    montantTotal: factures.reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0),
    montantPaye: factures.reduce((sum, f) => sum + Number(f.montant_paye || 0), 0),
    montantImpaye: factures.reduce((sum, f) => sum + Number(f.solde_restant || 0), 0),
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
            <span className="text-primary">Factures</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            Factures clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {facturesFiltres.length} facture{facturesFiltres.length > 1 ? 's' : ''} trouvée{facturesFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerFactures} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/factures/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle facture
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
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
              <p className="text-xs text-base-content/50 uppercase">Payées</p>
              <p className="text-xl font-bold text-success">{stats.payees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Impayées</p>
              <p className="text-xl font-bold text-warning">{stats.impayees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En retard</p>
              <p className="text-xl font-bold text-error">{stats.enRetard}</p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS MONTANTS */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase tracking-wider">Montant total facturé</p>
            <p className="text-2xl font-bold text-primary font-mono">{formaterMontant(stats.montantTotal)}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-success/5 to-success/10 border border-success/20 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase tracking-wider">Montant encaissé</p>
            <p className="text-2xl font-bold text-success font-mono">{formaterMontant(stats.montantPaye)}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-error/5 to-error/10 border border-error/20 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase tracking-wider">Reste à recouvrer</p>
            <p className="text-2xl font-bold text-error font-mono">{formaterMontant(stats.montantImpaye)}</p>
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
                  placeholder="Rechercher par numéro, client, objet..."
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
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUTS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="proforma">Pro-forma</option>
              <option value="definitive">Définitive</option>
              <option value="avoir">Avoir</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreStatut('all');
                setFiltreType('all');
              }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {facturesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Receipt className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune facture trouvée</p>
          <Link to="/factures/ajouter" className="btn btn-primary mt-4">
            Créer une facture
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Client</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Objet</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Échéance</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant TTC</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Reste dû</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((facture) => {
                  const enRetard = facture.est_en_retard && facture.statut !== 'payee';
                  return (
                    <tr key={facture.id} className={`hover:bg-base-200/50 border-b border-base-200 last:border-0 ${enRetard ? 'bg-error/5' : ''}`}>
                      <td>
                        <Link
                          to={`/factures/${facture.id}`}
                          className="font-mono text-sm font-medium text-primary hover:underline"
                        >
                          {facture.numero}
                        </Link>
                        <div className="mt-0.5">{getBadgeType(facture.type)}</div>
                      </td>
                      <td>
                        <p className="font-medium truncate max-w-[180px]">{facture.client_nom}</p>
                      </td>
                      <td>
                        <p className="text-sm truncate max-w-[200px]">{facture.objet || '—'}</p>
                      </td>
                      <td>
                        <p className={`text-xs ${enRetard ? 'text-error font-bold' : ''}`}>
                          {formaterDate(facture.date_echeance)}
                        </p>
                        {enRetard && (
                          <p className="text-xs text-error">
                            +{facture.jours_retard}j de retard
                          </p>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm font-medium">
                          {formaterMontant(facture.montant_ttc)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`font-mono text-sm font-medium ${
                          Number(facture.solde_restant) > 0 ? 'text-error' : 'text-success'
                        }`}>
                          {formaterMontant(facture.solde_restant)}
                        </span>
                      </td>
                      <td>{getBadgeStatut(facture.statut)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/factures/${facture.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/factures/${facture.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setFactureSelectionnee(facture);
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, facturesFiltres.length)} sur{' '}
                {facturesFiltres.length} factures
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let numPage = i + 1;
                  if (totalPages > 5 && pageActuelle > 3) {
                    numPage = pageActuelle - 2 + i;
                    if (numPage > totalPages) return null;
                  }
                  return (
                    <button
                      key={numPage}
                      className={`btn btn-sm ${pageActuelle === numPage ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setPageActuelle(numPage)}
                    >
                      {numPage}
                    </button>
                  );
                })}
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

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && factureSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la facture</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer la facture{' '}
                <span className="font-bold font-mono">{factureSelectionnee.numero}</span> ?
                <br />
                <span className="text-error text-sm">Cette action est irréversible !</span>
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerFacture} disabled={chargementAction}>
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

export default Factures;