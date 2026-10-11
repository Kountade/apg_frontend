// components/tresorerie/ComptesBancaires.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Landmark, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Wallet, TrendingUp,
  Smartphone, Building2, CreditCard, Coins, Hash
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des types de comptes
// ============================================================
const TYPES_CONFIG = {
  banque: { label: 'Compte bancaire', icon: Landmark, cls: 'badge-primary', color: 'primary' },
  mobile_money: { label: 'Mobile Money', icon: Smartphone, cls: 'badge-success', color: 'success' },
  caisse_populaire: { label: 'Caisse populaire', icon: Building2, cls: 'badge-warning', color: 'warning' },
  autre: { label: 'Autre', icon: CreditCard, cls: 'badge-ghost', color: 'ghost' },
};

const ComptesBancaires = () => {
  const navigate = useNavigate();
  const [comptes, setComptes] = useState([]);
  const [comptesFiltres, setComptesFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreActif, setFiltreActif] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [compteSelectionne, setCompteSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerComptes();
  }, []);

  const chargerComptes = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/comptes-bancaires/');
      const data = res.data.results || res.data || [];
      setComptes(data);
      setComptesFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les comptes bancaires');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = comptes;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.code?.toLowerCase().includes(terme) ||
        c.nom?.toLowerCase().includes(terme) ||
        c.banque?.toLowerCase().includes(terme) ||
        c.numero_compte?.toLowerCase().includes(terme) ||
        c.titulaire?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(c => c.type === filtreType);
    if (filtreActif !== 'all') {
      const actif = filtreActif === 'actif';
      filtre = filtre.filter(c => c.actif === actif);
    }
    setComptesFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreActif, comptes]);

  const totalPages = Math.ceil(comptesFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return comptesFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerCompte = async () => {
    if (!compteSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/comptes-bancaires/${compteSelectionne.id}/`);
      setComptes(comptes.filter(c => c.id !== compteSelectionne.id));
      setShowModalSuppression(false);
      setCompteSelectionne(null);
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
    const cfg = TYPES_CONFIG[type] || { label: type, cls: 'badge-ghost', icon: CreditCard };
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
        <button onClick={chargerComptes} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  // Stats
  const stats = {
    total: comptes.length,
    actifs: comptes.filter(c => c.actif).length,
    banques: comptes.filter(c => c.type === 'banque').length,
    mobileMoney: comptes.filter(c => c.type === 'mobile_money').length,
    soldeTotal: comptes.reduce((sum, c) => sum + Number(c.solde_actuel || 0), 0),
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
            <span className="text-primary">Comptes bancaires</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Landmark className="w-8 h-8 text-primary" />
            Comptes bancaires
          </h1>
          <p className="text-base-content/60 mt-1">
            {comptesFiltres.length} compte{comptesFiltres.length > 1 ? 's' : ''} trouvé{comptesFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerComptes} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/comptes-bancaires/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau compte
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-primary" />
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
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Banques</p>
              <p className="text-xl font-bold text-primary">{stats.banques}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Mobile Money</p>
              <p className="text-xl font-bold text-success">{stats.mobileMoney}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SOLDE TOTAL */}
      <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm mb-6">
        <div className="card-body p-4">
          <p className="text-xs text-base-content/60 uppercase tracking-wider">Solde total consolidé</p>
          <p className="text-3xl font-bold text-primary font-mono">
            {formaterMontant(stats.soldeTotal)}
          </p>
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
                  placeholder="Rechercher par code, nom, banque, numéro..."
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
      {comptesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Landmark className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun compte bancaire trouvé</p>
          <Link to="/comptes-bancaires/ajouter" className="btn btn-primary mt-4">
            Créer un compte
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
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Banque</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">N° Compte</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Solde</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((compte) => (
                  <tr key={compte.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <Link to={`/comptes-bancaires/${compte.id}`} className="font-mono text-sm font-bold text-primary hover:underline">
                        {compte.code}
                      </Link>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[180px]">{compte.nom}</p>
                    </td>
                    <td>{getBadgeType(compte.type)}</td>
                    <td>
                      <p className="text-sm truncate max-w-[150px]">{compte.banque || '—'}</p>
                    </td>
                    <td>
                      <p className="font-mono text-xs text-base-content/60">
                        {compte.numero_compte || '—'}
                      </p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold">
                        {formaterMontant(compte.solde_actuel)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${compte.actif ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                        {compte.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/comptes-bancaires/${compte.id}`} className="btn btn-ghost btn-xs" title="Voir">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link to={`/comptes-bancaires/${compte.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setCompteSelectionne(compte); setShowModalSuppression(true); }}
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
                {Math.min(pageActuelle * elementsParPage, comptesFiltres.length)} sur{' '}
                {comptesFiltres.length} comptes
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
      {showModalSuppression && compteSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le compte</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le compte <span className="font-bold font-mono">{compteSelectionne.code}</span> — {compteSelectionne.nom} ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerCompte} disabled={chargementAction}>
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

export default ComptesBancaires;