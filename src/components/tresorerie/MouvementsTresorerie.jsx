// components/tresorerie/MouvementsTresorerie.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Coins, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Wallet, TrendingUp,
  TrendingDown, ArrowDownRight, ArrowUpRight, Landmark,
  Banknote, Calendar, User, FileText, Info, Printer
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des types
// ============================================================
const TYPES_CONFIG = {
  entree: { label: 'Entrée', icon: ArrowDownRight, cls: 'badge-success', color: 'success' },
  sortie: { label: 'Sortie', icon: ArrowUpRight, cls: 'badge-error', color: 'error' },
};

const MODES_PAIEMENT = {
  especes: { label: 'Espèces', icon: Banknote },
  virement: { label: 'Virement', icon: Landmark },
  cheque: { label: 'Chèque', icon: FileText },
  mobile_money: { label: 'Mobile Money', icon: Wallet },
  prelevement: { label: 'Prélèvement', icon: CreditCard },
  carte: { label: 'Carte bancaire', icon: CreditCard },
};

import { CreditCard } from 'lucide-react';

const MouvementsTresorerie = () => {
  const navigate = useNavigate();
  const [mouvements, setMouvements] = useState([]);
  const [mouvementsFiltres, setMouvementsFiltres] = useState([]);
  const [caisses, setCaisses] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreSource, setFiltreSource] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [mouvementSelectionne, setMouvementSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  // Période
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [mvtRes, caissesRes, comptesRes] = await Promise.all([
        AxiosInstance.get('/mouvements-tresorerie/').catch(() => ({ data: [] })),
        AxiosInstance.get('/caisses/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-bancaires/').catch(() => ({ data: [] })),
      ]);
      const data = mvtRes.data.results || mvtRes.data || [];
      setMouvements(data);
      setMouvementsFiltres(data);
      setCaisses(caissesRes.data.results || caissesRes.data || []);
      setComptes(comptesRes.data.results || comptesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les mouvements');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = mouvements;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(m =>
        m.numero?.toLowerCase().includes(terme) ||
        m.origine?.toLowerCase().includes(terme) ||
        m.reference?.toLowerCase().includes(terme) ||
        m.motif?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(m => m.type === filtreType);
    if (filtreSource !== 'all') {
      if (filtreSource === 'caisse') filtre = filtre.filter(m => m.caisse);
      else if (filtreSource === 'compte') filtre = filtre.filter(m => m.compte_bancaire);
    }
    if (dateDebut) filtre = filtre.filter(m => m.date_mouvement >= dateDebut);
    if (dateFin) filtre = filtre.filter(m => m.date_mouvement <= dateFin);

    setMouvementsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreSource, dateDebut, dateFin, mouvements]);

  const totalPages = Math.ceil(mouvementsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return mouvementsFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerMouvement = async () => {
    if (!mouvementSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/mouvements-tresorerie/${mouvementSelectionne.id}/`);
      setMouvements(mouvements.filter(m => m.id !== mouvementSelectionne.id));
      setShowModalSuppression(false);
      setMouvementSelectionne(null);
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

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || TYPES_CONFIG.entree;
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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: mouvementsFiltres.length,
    entrees: mouvementsFiltres.filter(m => m.type === 'entree').length,
    sorties: mouvementsFiltres.filter(m => m.type === 'sortie').length,
    totalEntrees: mouvementsFiltres.filter(m => m.type === 'entree')
      .reduce((sum, m) => sum + Number(m.montant || 0), 0),
    totalSorties: mouvementsFiltres.filter(m => m.type === 'sortie')
      .reduce((sum, m) => sum + Number(m.montant || 0), 0),
  };
  const soldeNet = stats.totalEntrees - stats.totalSorties;

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Wallet className="w-3 h-3" />
            Trésorerie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Mouvements</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Coins className="w-8 h-8 text-primary" />
            Mouvements de trésorerie
          </h1>
          <p className="text-base-content/60 mt-1">
            {mouvementsFiltres.length} mouvement{mouvementsFiltres.length > 1 ? 's' : ''} sur la période
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
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
              <ArrowDownRight className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Entrées</p>
              <p className="text-sm font-bold text-success truncate font-mono">
                +{formaterMontant(stats.totalEntrees)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Sorties</p>
              <p className="text-sm font-bold text-error truncate font-mono">
                -{formaterMontant(stats.totalSorties)}
              </p>
            </div>
          </div>
        </div>

        <div className={`card shadow-sm border-2 ${
          soldeNet >= 0 ? 'bg-success/5 border-success/30' : 'bg-error/5 border-error/30'
        }`}>
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${soldeNet >= 0 ? 'bg-success/20' : 'bg-error/20'} flex items-center justify-center`}>
              {soldeNet >= 0 ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-error" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Solde net</p>
              <p className={`text-sm font-bold truncate font-mono ${
                soldeNet >= 0 ? 'text-success' : 'text-error'
              }`}>
                {soldeNet >= 0 ? '+' : ''}{formaterMontant(soldeNet)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="input input-bordered w-full pl-10"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>

            <select
              className="select select-bordered w-full"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="entree">Entrées uniquement</option>
              <option value="sortie">Sorties uniquement</option>
            </select>

            <select
              className="select select-bordered w-full"
              value={filtreSource}
              onChange={(e) => setFiltreSource(e.target.value)}
            >
              <option value="all">Toutes les sources</option>
              <option value="caisse">Caisses uniquement</option>
              <option value="compte">Comptes bancaires uniquement</option>
            </select>

            <button
              className="btn btn-ghost gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreType('all');
                setFiltreSource('all');
              }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>

          {/* Période */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-base-200">
            <span className="text-xs text-base-content/50 uppercase">Période :</span>
            <input
              type="date"
              className="input input-bordered input-sm w-auto"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
            <span className="text-xs">→</span>
            <input
              type="date"
              className="input input-bordered input-sm w-auto"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
            <button
              className="btn btn-xs btn-outline"
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateDebut(firstDay.toISOString().split('T')[0]);
                setDateFin(today.toISOString().split('T')[0]);
              }}
            >
              Ce mois
            </button>
            <button
              className="btn btn-xs btn-outline"
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), 0, 1);
                setDateDebut(firstDay.toISOString().split('T')[0]);
                setDateFin(today.toISOString().split('T')[0]);
              }}
            >
              Cette année
            </button>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => { setDateDebut(''); setDateFin(''); }}
            >
              Tout
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {mouvementsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Coins className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun mouvement trouvé</p>
          <p className="text-sm text-base-content/40 mt-2">
            Les mouvements sont créés automatiquement lors de la validation d'encaissements ou de décaissements
          </p>
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
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Source / Destination</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Origine</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Mode</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((m) => {
                  const modeCfg = MODES_PAIEMENT[m.mode_paiement] || MODES_PAIEMENT.especes;
                  const ModeIcon = modeCfg.icon;

                  return (
                    <tr key={m.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <span className="font-mono text-sm font-bold text-primary">
                          {m.numero}
                        </span>
                      </td>
                      <td>
                        <p className="text-xs">{formaterDate(m.date_mouvement)}</p>
                      </td>
                      <td>{getBadgeType(m.type)}</td>
                      <td>
                        {m.caisse_nom ? (
                          <span className="text-sm flex items-center gap-1">
                            <Wallet className="w-3 h-3 text-base-content/40" />
                            {m.caisse_nom}
                          </span>
                        ) : m.compte_nom ? (
                          <span className="text-sm flex items-center gap-1">
                            <Landmark className="w-3 h-3 text-base-content/40" />
                            {m.compte_nom}
                          </span>
                        ) : (
                          <span className="text-base-content/30 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <p className="text-sm truncate max-w-[180px]">{m.origine || '—'}</p>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs">
                          <ModeIcon className="w-3.5 h-3.5 text-base-content/50" />
                          {modeCfg.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`font-mono text-sm font-bold ${
                          m.type === 'entree' ? 'text-success' : 'text-error'
                        }`}>
                          {m.type === 'entree' ? '+' : '-'}{formaterMontant(m.montant)}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link to={`/mouvements-tresorerie/${m.id}`} className="btn btn-ghost btn-xs" title="Voir">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => { setMouvementSelectionne(m); setShowModalSuppression(true); }}
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
              <tfoot>
                <tr className="border-t-2 border-base-300 bg-base-200/30">
                  <td colSpan="5" className="text-right font-bold text-sm">TOTAUX DE LA PÉRIODE</td>
                  <td className="text-right font-mono font-bold text-success">
                    +{formaterMontant(stats.totalEntrees)}
                  </td>
                  <td className="text-right font-mono font-bold text-error">
                    -{formaterMontant(stats.totalSorties)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-t border-base-300 bg-base-200/20">
                  <td colSpan="6" className="text-right font-bold text-sm">SOLDE NET</td>
                  <td className={`text-right font-mono font-bold text-lg ${
                    soldeNet >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    {soldeNet >= 0 ? '+' : ''}{formaterMontant(soldeNet)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, mouvementsFiltres.length)} sur{' '}
                {mouvementsFiltres.length} mouvements
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
      {showModalSuppression && mouvementSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le mouvement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le mouvement <span className="font-bold font-mono">{mouvementSelectionne.numero}</span> ?
                <br />
                <span className="text-error text-sm">Le solde de la caisse sera recalculé.</span>
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerMouvement} disabled={chargementAction}>
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

export default MouvementsTresorerie;