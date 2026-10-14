// components/tresorerie/Previsions.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Search, Plus, Edit, Trash2, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Wallet, TrendingUp,
  TrendingDown, ArrowDownRight, ArrowUpRight, Calendar,
  Info, Printer, CheckSquare, Clock
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des types
// ============================================================
const TYPES_CONFIG = {
  entree: {
    label: 'Entrée prévue',
    icon: ArrowDownRight,
    cls: 'badge-success',
    color: 'success',
  },
  sortie: {
    label: 'Sortie prévue',
    icon: ArrowUpRight,
    cls: 'badge-error',
    color: 'error',
  },
};

const Previsions = () => {
  const navigate = useNavigate();
  const [previsions, setPrevisions] = useState([]);
  const [previsionsFiltres, setPrevisionsFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreRealise, setFiltreRealise] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [previsionSelectionnee, setPrevisionSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  // Période
  const [dateDebut, setDateDebut] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    chargerPrevisions();
  }, []);

  const chargerPrevisions = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/previsions/');
      const data = res.data.results || res.data || [];
      setPrevisions(data);
      setPrevisionsFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les prévisions');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = previsions;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(p =>
        p.libelle?.toLowerCase().includes(terme) ||
        p.notes?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(p => p.type === filtreType);
    if (filtreRealise !== 'all') {
      const realise = filtreRealise === 'realise';
      filtre = filtre.filter(p => p.realise === realise);
    }
    if (dateDebut) filtre = filtre.filter(p => p.date_prevue >= dateDebut);
    if (dateFin) filtre = filtre.filter(p => p.date_prevue <= dateFin);
    setPrevisionsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreRealise, dateDebut, dateFin, previsions]);

  const totalPages = Math.ceil(previsionsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return previsionsFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerPrevision = async () => {
    if (!previsionSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/previsions/${previsionSelectionnee.id}/`);
      setPrevisions(previsions.filter(p => p.id !== previsionSelectionnee.id));
      setShowModalSuppression(false);
      setPrevisionSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const basculerRealise = async (prevision) => {
    setChargementAction(true);
    try {
      await AxiosInstance.patch(`/previsions/${prevision.id}/`, {
        realise: !prevision.realise,
      });
      await chargerPrevisions();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
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
        <button onClick={chargerPrevisions} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: previsionsFiltres.length,
    entreesPrevues: previsionsFiltres.filter(p => p.type === 'entree')
      .reduce((sum, p) => sum + Number(p.montant || 0), 0),
    sortiesPrevues: previsionsFiltres.filter(p => p.type === 'sortie')
      .reduce((sum, p) => sum + Number(p.montant || 0), 0),
    entreesRealisees: previsionsFiltres.filter(p => p.type === 'entree' && p.realise)
      .reduce((sum, p) => sum + Number(p.montant || 0), 0),
    sortiesRealisees: previsionsFiltres.filter(p => p.type === 'sortie' && p.realise)
      .reduce((sum, p) => sum + Number(p.montant || 0), 0),
    nombreRealisees: previsionsFiltres.filter(p => p.realise).length,
  };
  const soldeNet = stats.entreesPrevues - stats.sortiesPrevues;
  const soldeRealise = stats.entreesRealisees - stats.sortiesRealisees;

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Wallet className="w-3 h-3" />
            Trésorerie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Prévisions</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Prévisions de trésorerie
          </h1>
          <p className="text-base-content/60 mt-1">
            {previsionsFiltres.length} prévision{previsionsFiltres.length > 1 ? 's' : ''} sur la période
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerPrevisions} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <Link to="/previsions/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle prévision
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Entrées prévues</p>
              <p className="text-sm font-bold text-success truncate font-mono">
                +{formaterMontant(stats.entreesPrevues)}
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
              <p className="text-xs text-base-content/50 uppercase">Sorties prévues</p>
              <p className="text-sm font-bold text-error truncate font-mono">
                -{formaterMontant(stats.sortiesPrevues)}
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
              <p className="text-xs text-base-content/50 uppercase">Solde net prévu</p>
              <p className={`text-sm font-bold truncate font-mono ${
                soldeNet >= 0 ? 'text-success' : 'text-error'
              }`}>
                {soldeNet >= 0 ? '+' : ''}{formaterMontant(soldeNet)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Réalisées</p>
              <p className="text-sm font-bold text-info truncate">
                {stats.nombreRealisees} / {stats.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RÉALISÉ VS PRÉVU */}
      {stats.nombreRealisees > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Comparaison Prévisions vs Réalisations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <p className="text-xs text-base-content/60 uppercase">Entrées réalisées</p>
                <p className="text-lg font-bold text-success font-mono">
                  +{formaterMontant(stats.entreesRealisees)}
                </p>
              </div>
              <div className="p-3 bg-error/5 rounded-lg border border-error/20">
                <p className="text-xs text-base-content/60 uppercase">Sorties réalisées</p>
                <p className="text-lg font-bold text-error font-mono">
                  -{formaterMontant(stats.sortiesRealisees)}
                </p>
              </div>
              <div className={`p-3 rounded-lg border ${
                soldeRealise >= 0 ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20'
              }`}>
                <p className="text-xs text-base-content/60 uppercase">Solde réalisé</p>
                <p className={`text-lg font-bold font-mono ${
                  soldeRealise >= 0 ? 'text-success' : 'text-error'
                }`}>
                  {soldeRealise >= 0 ? '+' : ''}{formaterMontant(soldeRealise)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher par libellé..."
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
              value={filtreRealise}
              onChange={(e) => setFiltreRealise(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="realise">Réalisées</option>
              <option value="non_realise">Non réalisées</option>
            </select>

            <button
              className="btn btn-ghost gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreType('all');
                setFiltreRealise('all');
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
                const future = new Date();
                future.setMonth(future.getMonth() + 3);
                setDateDebut(today.toISOString().split('T')[0]);
                setDateFin(future.toISOString().split('T')[0]);
              }}
            >
              3 mois
            </button>
            <button
              className="btn btn-xs btn-outline"
              onClick={() => {
                const today = new Date();
                const future = new Date();
                future.setFullYear(future.getFullYear() + 1);
                setDateDebut(today.toISOString().split('T')[0]);
                setDateFin(future.toISOString().split('T')[0]);
              }}
            >
              12 mois
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
      {previsionsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CalendarDays className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune prévision trouvée</p>
          <p className="text-sm text-base-content/40 mt-2">
            Créez des prévisions pour anticiper vos flux de trésorerie
          </p>
          <Link to="/previsions/ajouter" className="btn btn-primary mt-4">
            Créer une prévision
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date prévue</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Libellé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Notes</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((p) => (
                  <tr key={p.id} className={`hover:bg-base-200/50 border-b border-base-200 last:border-0 ${
                    p.realise ? 'bg-success/5' : ''
                  }`}>
                    <td>
                      <p className="text-sm font-medium">{formaterDate(p.date_prevue)}</p>
                    </td>
                    <td>{getBadgeType(p.type)}</td>
                    <td>
                      <p className="font-medium truncate max-w-[250px]">{p.libelle}</p>
                    </td>
                    <td className="text-right">
                      <span className={`font-mono text-sm font-bold ${
                        p.type === 'entree' ? 'text-success' : 'text-error'
                      }`}>
                        {p.type === 'entree' ? '+' : '-'}{formaterMontant(p.montant)}
                      </span>
                    </td>
                    <td>
                      {p.realise ? (
                        <span className="badge badge-success badge-sm gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Réalisée
                        </span>
                      ) : (
                        <span className="badge badge-warning badge-sm gap-1">
                          <Clock className="w-3 h-3" />
                          À venir
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="text-xs text-base-content/60 truncate max-w-[200px]" title={p.notes}>
                        {p.notes || '—'}
                      </p>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => basculerRealise(p)}
                          className={`btn btn-ghost btn-xs ${
                            p.realise ? 'text-warning' : 'text-success'
                          }`}
                          title={p.realise ? 'Marquer non réalisée' : 'Marquer réalisée'}
                          disabled={chargementAction}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                        </button>
                        <Link to={`/previsions/${p.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setPrevisionSelectionnee(p); setShowModalSuppression(true); }}
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
              <tfoot>
                <tr className="border-t-2 border-base-300 bg-base-200/30">
                  <td colSpan="3" className="text-right font-bold text-sm">TOTAUX PRÉVUS</td>
                  <td className="text-right font-mono font-bold">
                    <span className="text-success">+{formaterMontant(stats.entreesPrevues)}</span>
                    <br />
                    <span className="text-error">-{formaterMontant(stats.sortiesPrevues)}</span>
                  </td>
                  <td colSpan="3" className="text-left pl-4">
                    <span className={`font-mono font-bold ${
                      soldeNet >= 0 ? 'text-success' : 'text-error'
                    }`}>
                      Solde : {soldeNet >= 0 ? '+' : ''}{formaterMontant(soldeNet)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, previsionsFiltres.length)} sur{' '}
                {previsionsFiltres.length} prévisions
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
      {showModalSuppression && previsionSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la prévision</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la prévision <span className="font-bold">{previsionSelectionnee.libelle}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerPrevision} disabled={chargementAction}>
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

export default Previsions;