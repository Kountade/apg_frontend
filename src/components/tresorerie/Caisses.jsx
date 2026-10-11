// components/tresorerie/Caisses.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Banknote, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Wallet, TrendingUp,
  TrendingDown, Users, Coins, RefreshCcw
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Caisses = () => {
  const navigate = useNavigate();
  const [caisses, setCaisses] = useState([]);
  const [caissesFiltrees, setCaissesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [caisseSelectionnee, setCaisseSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerCaisses();
  }, []);

  const chargerCaisses = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/caisses/');
      const data = res.data.results || res.data || [];
      setCaisses(data);
      setCaissesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les caisses');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = caisses;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.code?.toLowerCase().includes(terme) ||
        c.nom?.toLowerCase().includes(terme) ||
        c.responsable_nom?.toLowerCase().includes(terme)
      );
    }
    if (filtreActif !== 'all') {
      const actif = filtreActif === 'actif';
      filtre = filtre.filter(c => c.actif === actif);
    }
    setCaissesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreActif, caisses]);

  const totalPages = Math.ceil(caissesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return caissesFiltrees.slice(debut, debut + elementsParPage);
  };

  const supprimerCaisse = async () => {
    if (!caisseSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/caisses/${caisseSelectionnee.id}/`);
      setCaisses(caisses.filter(c => c.id !== caisseSelectionnee.id));
      setShowModalSuppression(false);
      setCaisseSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const recalculerSolde = async (caisse) => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/caisses/${caisse.id}/recalculer_solde/`);
      await chargerCaisses();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du recalcul');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

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
        <button onClick={chargerCaisses} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: caisses.length,
    actives: caisses.filter(c => c.actif).length,
    soldeTheorique: caisses.reduce((sum, c) => sum + Number(c.solde_theorique || 0), 0),
    soldePhysique: caisses.reduce((sum, c) => sum + Number(c.solde_physique || 0), 0),
    difference: caisses.reduce((sum, c) => sum + Number(c.difference || 0), 0),
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
            <span className="text-primary">Caisses</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Banknote className="w-8 h-8 text-primary" />
            Caisses
          </h1>
          <p className="text-base-content/60 mt-1">
            {caissesFiltrees.length} caisse{caissesFiltrees.length > 1 ? 's' : ''} trouvée{caissesFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerCaisses} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/caisses/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle caisse
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-primary" />
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
              <p className="text-xs text-base-content/50 uppercase">Actives</p>
              <p className="text-xl font-bold text-success">{stats.actives}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Solde théorique</p>
              <p className="text-sm font-bold text-info truncate font-mono">
                {formaterMontant(stats.soldeTheorique)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Solde physique</p>
              <p className="text-sm font-bold text-warning truncate font-mono">
                {formaterMontant(stats.soldePhysique)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ÉCART GLOBAL */}
      {stats.difference !== 0 && (
        <div className={`alert ${stats.difference > 0 ? 'alert-success' : 'alert-warning'} mb-6`}>
          {stats.difference > 0 ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
          <div>
            <p className="font-bold">Écart global de caisse</p>
            <p className="text-sm">
              Différence totale : <strong>{formaterMontant(stats.difference)}</strong>
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
                  placeholder="Rechercher par code, nom, responsable..."
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
              <option value="all">Toutes</option>
              <option value="actif">Actives uniquement</option>
              <option value="inactif">Inactives uniquement</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setRecherche(''); setFiltreActif('all'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {caissesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Banknote className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune caisse trouvée</p>
          <Link to="/caisses/ajouter" className="btn btn-primary mt-4">Créer une caisse</Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Code</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Nom</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Responsable</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Solde théorique</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Solde physique</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Écart</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((caisse) => {
                  const ecart = Number(caisse.difference || 0);
                  return (
                    <tr key={caisse.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <Link to={`/caisses/${caisse.id}`} className="font-mono text-sm font-bold text-primary hover:underline">
                          {caisse.code}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium">{caisse.nom}</p>
                      </td>
                      <td>
                        {caisse.responsable_nom ? (
                          <span className="text-sm flex items-center gap-1">
                            <Users className="w-3 h-3 text-base-content/40" />
                            {caisse.responsable_nom}
                          </span>
                        ) : (
                          <span className="text-base-content/30 text-sm">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm">{formaterMontant(caisse.solde_theorique)}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm">{formaterMontant(caisse.solde_physique)}</span>
                      </td>
                      <td className="text-right">
                        <span className={`font-mono text-sm font-bold ${
                          ecart === 0 ? 'text-success' :
                          ecart > 0 ? 'text-info' : 'text-error'
                        }`}>
                          {ecart === 0 ? '✓ 0' : formaterMontant(ecart)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${caisse.actif ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                          {caisse.actif ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link to={`/caisses/${caisse.id}`} className="btn btn-ghost btn-xs" title="Voir">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => recalculerSolde(caisse)}
                            className="btn btn-ghost btn-xs text-info"
                            title="Recalculer le solde"
                            disabled={chargementAction}
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                          </button>
                          <Link to={`/caisses/${caisse.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => { setCaisseSelectionnee(caisse); setShowModalSuppression(true); }}
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
                {Math.min(pageActuelle * elementsParPage, caissesFiltrees.length)} sur{' '}
                {caissesFiltrees.length} caisses
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
      {showModalSuppression && caisseSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la caisse</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la caisse <span className="font-bold font-mono">{caisseSelectionnee.code}</span> — {caisseSelectionnee.nom} ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerCaisse} disabled={chargementAction}>
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

export default Caisses;