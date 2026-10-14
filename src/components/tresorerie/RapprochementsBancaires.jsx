// components/tresorerie/RapprochementsBancaires.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, Wallet, Landmark, Calendar, FileText,
  TrendingUp, TrendingDown, AlertTriangle, Info,
  CheckSquare, XCircle, Lock, Upload
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des statuts
// ============================================================
const STATUTS_CONFIG = {
  en_cours: { label: 'En cours', cls: 'badge-warning', icon: RefreshCw },
  equilibre: { label: 'Équilibré', cls: 'badge-success', icon: CheckCircle },
  ecart: { label: 'Écart détecté', cls: 'badge-error', icon: AlertTriangle },
  cloture: { label: 'Clôturé', cls: 'badge-info', icon: Lock },
};

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const RapprochementsBancaires = () => {
  const navigate = useNavigate();
  const [rapprochements, setRapprochements] = useState([]);
  const [rapprochementsFiltres, setRapprochementsFiltres] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreCompte, setFiltreCompte] = useState('all');
  const [filtreAnnee, setFiltreAnnee] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [rapprochementSelectionne, setRapprochementSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalCloture, setShowModalCloture] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [rappRes, comptesRes] = await Promise.all([
        AxiosInstance.get('/rapprochement-bancaire/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-bancaires/').catch(() => ({ data: [] })),
      ]);
      const data = rappRes.data.results || rappRes.data || [];
      setRapprochements(data);
      setRapprochementsFiltres(data);
      setComptes(comptesRes.data.results || comptesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les rapprochements');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = rapprochements;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(r =>
        r.compte_nom?.toLowerCase().includes(terme) ||
        r.notes?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(r => r.statut === filtreStatut);
    if (filtreCompte !== 'all') filtre = filtre.filter(r => String(r.compte_bancaire) === String(filtreCompte));
    if (filtreAnnee !== 'all') filtre = filtre.filter(r => String(r.annee) === String(filtreAnnee));
    setRapprochementsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreCompte, filtreAnnee, rapprochements]);

  const totalPages = Math.ceil(rapprochementsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return rapprochementsFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerRapprochement = async () => {
    if (!rapprochementSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/rapprochement-bancaire/${rapprochementSelectionne.id}/`);
      setRapprochements(rapprochements.filter(r => r.id !== rapprochementSelectionne.id));
      setShowModalSuppression(false);
      setRapprochementSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const cloturerRapprochement = async () => {
    if (!rapprochementSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/rapprochement-bancaire/${rapprochementSelectionne.id}/cloturer/`);
      await chargerDonnees();
      setShowModalCloture(false);
      setRapprochementSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la clôture');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (m === null || m === undefined) return '0 GNF';
    const num = Number(m);
    return (num >= 0 ? '' : '-') + new Intl.NumberFormat('fr-FR').format(Math.abs(num)) + ' GNF';
  };

  const formaterPeriode = (mois, annee) => {
    const nom = MOIS_NOMS[mois - 1] || 'Mois';
    return `${nom} ${annee}`;
  };

  const getBadgeStatut = (statut) => {
    const cfg = STATUTS_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: RefreshCw };
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

  // Années disponibles
  const anneesDisponibles = [...new Set(rapprochements.map(r => r.annee))].sort((a, b) => b - a);

  const stats = {
    total: rapprochements.length,
    enCours: rapprochements.filter(r => r.statut === 'en_cours').length,
    equilibres: rapprochements.filter(r => r.statut === 'equilibre').length,
    ecarts: rapprochements.filter(r => r.statut === 'ecart').length,
    clotures: rapprochements.filter(r => r.statut === 'cloture').length,
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
            <span className="text-primary">Rapprochement bancaire</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-primary" />
            Rapprochements bancaires
          </h1>
          <p className="text-base-content/60 mt-1">
            {rapprochementsFiltres.length} rapprochement{rapprochementsFiltres.length > 1 ? 's' : ''} trouvé{rapprochementsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/rapprochement-bancaire/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau rapprochement
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
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
              <RefreshCw className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En cours</p>
              <p className="text-xl font-bold text-warning">{stats.enCours}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Équilibrés</p>
              <p className="text-xl font-bold text-success">{stats.equilibres}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Écarts</p>
              <p className="text-xl font-bold text-error">{stats.ecarts}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Clôturés</p>
              <p className="text-xl font-bold text-info">{stats.clotures}</p>
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
                  placeholder="Rechercher par compte, notes..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreCompte}
              onChange={(e) => setFiltreCompte(e.target.value)}
            >
              <option value="all">Tous les comptes</option>
              {comptes.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.nom}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(e.target.value)}
            >
              <option value="all">Toutes les années</option>
              {anneesDisponibles.map(a => (
                <option key={a} value={a}>{a}</option>
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
              onClick={() => { setRecherche(''); setFiltreStatut('all'); setFiltreCompte('all'); setFiltreAnnee('all'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {rapprochementsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CheckCircle className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun rapprochement trouvé</p>
          <p className="text-sm text-base-content/40 mt-2">
            Créez un rapprochement pour comparer le solde comptable avec le relevé bancaire
          </p>
          <Link to="/rapprochement-bancaire/ajouter" className="btn btn-primary mt-4">
            Nouveau rapprochement
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Compte</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Solde relevé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Solde comptable</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Écart</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((r) => {
                  const ecart = Number(r.ecart || 0);
                  return (
                    <tr key={r.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <Link to={`/rapprochement-bancaire/${r.id}`} className="font-medium text-primary hover:underline">
                          {formaterPeriode(r.mois, r.annee)}
                        </Link>
                      </td>
                      <td>
                        <span className="text-sm flex items-center gap-1">
                          <Landmark className="w-3 h-3 text-base-content/40" />
                          {r.compte_nom}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm">
                          {formaterMontant(r.solde_releve)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm">
                          {formaterMontant(r.solde_comptable)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`font-mono text-sm font-bold ${
                          Math.abs(ecart) < 0.01 ? 'text-success' :
                          ecart > 0 ? 'text-info' : 'text-error'
                        }`}>
                          {Math.abs(ecart) < 0.01 ? '✓ 0' : formaterMontant(ecart)}
                        </span>
                      </td>
                      <td>{getBadgeStatut(r.statut)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link to={`/rapprochement-bancaire/${r.id}`} className="btn btn-ghost btn-xs" title="Voir">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {r.statut !== 'cloture' && (
                            <>
                              <Link to={`/rapprochement-bancaire/${r.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                                <Edit className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => { setRapprochementSelectionne(r); setShowModalCloture(true); }}
                                className="btn btn-ghost btn-xs text-info"
                                title="Clôturer"
                                disabled={chargementAction}
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => { setRapprochementSelectionne(r); setShowModalSuppression(true); }}
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
                {Math.min(pageActuelle * elementsParPage, rapprochementsFiltres.length)} sur{' '}
                {rapprochementsFiltres.length} rapprochements
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
      {showModalSuppression && rapprochementSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le rapprochement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le rapprochement de <strong>{formaterPeriode(rapprochementSelectionne.mois, rapprochementSelectionne.annee)}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerRapprochement} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CLÔTURE */}
      {showModalCloture && rapprochementSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalCloture(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-info/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-info" />
              </div>
              <h3 className="text-xl font-bold mb-2">Clôturer le rapprochement</h3>
              <p className="text-base-content/60 mb-4">
                Clôturer le rapprochement de <strong>{formaterPeriode(rapprochementSelectionne.mois, rapprochementSelectionne.annee)}</strong> ?
                <br />
                <span className="text-info text-sm">Cette action empêchera toute modification ultérieure.</span>
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalCloture(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-info flex-1" onClick={cloturerRapprochement} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clôturer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RapprochementsBancaires;