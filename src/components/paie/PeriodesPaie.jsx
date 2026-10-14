// components/paie/PeriodesPaie.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Clock, DollarSign,
  CheckSquare, Lock, TrendingUp, Users, Activity,
  MoreVertical, Send, Ban
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des statuts
// ============================================================
const STATUTS_CONFIG = {
  ouverte: {
    label: 'Ouverte',
    cls: 'badge-ghost',
    icon: Clock,
    color: 'ghost',
    description: 'Nouvelle période',
  },
  en_preparation: {
    label: 'En préparation',
    cls: 'badge-info',
    icon: Activity,
    color: 'info',
    description: 'Préparation en cours',
  },
  calculee: {
    label: 'Calculée',
    cls: 'badge-primary',
    icon: Calculator,
    color: 'primary',
    description: 'Bulletins calculés',
  },
  controlee: {
    label: 'Contrôlée',
    cls: 'badge-warning',
    icon: CheckSquare,
    color: 'warning',
    description: 'En attente de validation',
  },
  validee: {
    label: 'Validée',
    cls: 'badge-success',
    icon: CheckCircle,
    color: 'success',
    description: 'Validée, prête à payer',
  },
  en_attente_paiement: {
    label: 'En attente paiement',
    cls: 'badge-warning',
    icon: Clock,
    color: 'warning',
    description: 'En attente de paiement',
  },
  payee: {
    label: 'Payée',
    cls: 'badge-success',
    icon: CheckCircle,
    color: 'success',
    description: 'Payée',
  },
  cloturee: {
    label: 'Clôturée',
    cls: 'badge-neutral',
    icon: Lock,
    color: 'neutral',
    description: 'Clôturée',
  },
  annulee: {
    label: 'Annulée',
    cls: 'badge-error',
    icon: XCircle,
    color: 'error',
    description: 'Annulée',
  },
};

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const PeriodesPaie = () => {
  const navigate = useNavigate();
  const [periodes, setPeriodes] = useState([]);
  const [periodesFiltrees, setPeriodesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreAnnee, setFiltreAnnee] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerPeriodes();
  }, []);

  const chargerPeriodes = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/periodes-paie/');
      const data = res.data.results || res.data || [];
      setPeriodes(data);
      setPeriodesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les périodes de paie');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = periodes;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(p =>
        p.libelle?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(p => p.statut === filtreStatut);
    if (filtreAnnee !== 'all') filtre = filtre.filter(p => String(p.annee) === String(filtreAnnee));
    setPeriodesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreAnnee, periodes]);

  const totalPages = Math.ceil(periodesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return periodesFiltrees.slice(debut, debut + elementsParPage);
  };

  const supprimerPeriode = async () => {
    if (!periodeSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/periodes-paie/${periodeSelectionnee.id}/`);
      setPeriodes(periodes.filter(p => p.id !== periodeSelectionnee.id));
      setShowModalSuppression(false);
      setPeriodeSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

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
  const formaterMoisAnnee = (mois, annee) => `${MOIS_NOMS[mois - 1] || 'Mois'} ${annee}`;

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
        <button onClick={chargerPeriodes} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const anneesDisponibles = [...new Set(periodes.map(p => p.annee))].sort((a, b) => b - a);

  const stats = {
    total: periodes.length,
    ouvertes: periodes.filter(p => p.statut === 'ouverte').length,
    enCours: periodes.filter(p => ['en_preparation', 'calculee', 'controlee'].includes(p.statut)).length,
    validees: periodes.filter(p => p.statut === 'validee').length,
    payees: periodes.filter(p => p.statut === 'payee').length,
    masseSalariale: periodes.filter(p => p.statut === 'payee')
      .reduce((sum, p) => sum + Number(p.total_net || 0), 0),
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
            <span className="text-primary">Périodes</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Périodes de paie
          </h1>
          <p className="text-base-content/60 mt-1">
            {periodesFiltrees.length} période{periodesFiltrees.length > 1 ? 's' : ''} trouvée{periodesFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerPeriodes} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/paie-periodes/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle période
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En cours</p>
              <p className="text-xl font-bold text-info">{stats.enCours}</p>
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
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Masse payée</p>
              <p className="text-sm font-bold text-warning truncate font-mono">
                {formaterMontantCourt(stats.masseSalariale)} GNF
              </p>
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
                  placeholder="Rechercher par libellé..."
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
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(e.target.value)}
            >
              <option value="all">Toutes les années</option>
              {anneesDisponibles.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setRecherche(''); setFiltreStatut('all'); setFiltreAnnee('all'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {periodesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CalendarDays className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune période trouvée</p>
          <Link to="/paie-periodes/ajouter" className="btn btn-primary mt-4">
            Créer une période
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Dates</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Employés</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Total brut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Total net</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((periode) => (
                  <tr key={periode.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <Link
                        to={`/paie-periodes/${periode.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {formaterMoisAnnee(periode.mois, periode.annee)}
                      </Link>
                      {periode.libelle && (
                        <p className="text-xs text-base-content/40">{periode.libelle}</p>
                      )}
                    </td>
                    <td>
                      <p className="text-xs">
                        {formaterDate(periode.date_debut)} → {formaterDate(periode.date_fin)}
                      </p>
                      {periode.date_paiement_prevue && (
                        <p className="text-xs text-info">
                          Paiement: {formaterDate(periode.date_paiement_prevue)}
                        </p>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="badge badge-ghost badge-sm gap-1">
                        <Users className="w-3 h-3" />
                        {periode.nombre_employes || 0}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm">
                        {formaterMontantCourt(periode.total_brut)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold text-primary">
                        {formaterMontantCourt(periode.total_net)}
                      </span>
                    </td>
                    <td>{getBadgeStatut(periode.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/paie-periodes/${periode.id}`} className="btn btn-ghost btn-xs" title="Voir">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {!['payee', 'cloturee', 'annulee'].includes(periode.statut) && (
                          <Link to={`/paie-periodes/${periode.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        <button
                          onClick={() => { setPeriodeSelectionnee(periode); setShowModalSuppression(true); }}
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
                {Math.min(pageActuelle * elementsParPage, periodesFiltrees.length)} sur{' '}
                {periodesFiltrees.length} périodes
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
      {showModalSuppression && periodeSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la période</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la période <strong>{formaterMoisAnnee(periodeSelectionnee.mois, periodeSelectionnee.annee)}</strong> ?
                <br />
                <span className="text-error text-sm">Tous les bulletins associés seront également supprimés.</span>
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerPeriode} disabled={chargementAction}>
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

export default PeriodesPaie;