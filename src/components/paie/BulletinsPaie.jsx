// components/paie/BulletinsPaie.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Clock, DollarSign,
  CheckSquare, Lock, TrendingUp, Users, Activity,
  MoreVertical, Send, Ban, Receipt, CalendarDays
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des statuts
// ============================================================
const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost', icon: Clock },
  calcule: { label: 'Calculé', cls: 'badge-info', icon: Calculator },
  controle: { label: 'Contrôlé', cls: 'badge-warning', icon: CheckSquare },
  valide: { label: 'Validé', cls: 'badge-primary', icon: CheckCircle },
  en_attente_paiement: { label: 'En attente paiement', cls: 'badge-warning', icon: Clock },
  paye: { label: 'Payé', cls: 'badge-success', icon: CheckCircle },
  annule: { label: 'Annulé', cls: 'badge-error', icon: XCircle },
};

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const BulletinsPaie = () => {
  const navigate = useNavigate();
  const [bulletins, setBulletins] = useState([]);
  const [bulletinsFiltres, setBulletinsFiltres] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtrePeriode, setFiltrePeriode] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [bulletinSelectionne, setBulletinSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [bulletinsRes, periodesRes] = await Promise.all([
        AxiosInstance.get('/bulletins-paie/').catch(() => ({ data: [] })),
        AxiosInstance.get('/periodes-paie/').catch(() => ({ data: [] })),
      ]);
      const data = bulletinsRes.data.results || bulletinsRes.data || [];
      setBulletins(data);
      setBulletinsFiltres(data);
      setPeriodes(periodesRes.data.results || periodesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les bulletins');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = bulletins;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(b =>
        b.numero?.toLowerCase().includes(terme) ||
        b.employe_nom?.toLowerCase().includes(terme) ||
        b.matricule_snapshot?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(b => b.statut === filtreStatut);
    if (filtrePeriode !== 'all') filtre = filtre.filter(b => String(b.periode) === String(filtrePeriode));
    setBulletinsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtrePeriode, bulletins]);

  const totalPages = Math.ceil(bulletinsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return bulletinsFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerBulletin = async () => {
    if (!bulletinSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/bulletins-paie/${bulletinSelectionne.id}/`);
      setBulletins(bulletins.filter(b => b.id !== bulletinSelectionne.id));
      setShowModalSuppression(false);
      setBulletinSelectionne(null);
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

  const formaterPeriode = (b) => {
    if (b.periode_libelle) return b.periode_libelle;
    const periode = periodes.find(p => p.id === b.periode);
    if (!periode) return '—';
    return `${String(periode.mois).padStart(2, '0')}/${periode.annee}`;
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
    total: bulletins.length,
    enAttente: bulletins.filter(b => ['calcule', 'controle'].includes(b.statut)).length,
    valides: bulletins.filter(b => b.statut === 'valide').length,
    payes: bulletins.filter(b => b.statut === 'paye').length,
    masseSalariale: bulletins.filter(b => b.statut === 'paye')
      .reduce((sum, b) => sum + Number(b.salaire_net || 0), 0),
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
            <span className="text-primary">Bulletins</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            Bulletins de paie
          </h1>
          <p className="text-base-content/60 mt-1">
            {bulletinsFiltres.length} bulletin{bulletinsFiltres.length > 1 ? 's' : ''} trouvé{bulletinsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/paie-periodes" className="btn btn-outline btn-sm gap-2">
            <CalendarDays className="w-4 h-4" /> Périodes
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
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
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Masse payée</p>
              <p className="text-sm font-bold text-info truncate font-mono">
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
                  placeholder="Rechercher par numéro, employé, matricule..."
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
              value={filtrePeriode}
              onChange={(e) => setFiltrePeriode(e.target.value)}
            >
              <option value="all">Toutes les périodes</option>
              {periodes.map(p => (
                <option key={p.id} value={p.id}>
                  {MOIS_NOMS[p.mois - 1]} {p.annee}
                </option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setRecherche(''); setFiltreStatut('all'); setFiltrePeriode('all'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {bulletinsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <FileSpreadsheet className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun bulletin trouvé</p>
          <p className="text-sm text-base-content/40 mt-2">
            Les bulletins sont générés automatiquement lors du calcul d'une période
          </p>
          <Link to="/paie-periodes" className="btn btn-primary mt-4">
            Voir les périodes
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Brut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Retenues</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Net</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((b) => (
                  <tr key={b.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <Link to={`/paie-bulletins/${b.id}`} className="font-mono text-sm font-bold text-primary hover:underline">
                        {b.numero}
                      </Link>
                    </td>
                    <td>
                      <p className="font-medium text-sm truncate max-w-[180px]">{b.employe_nom}</p>
                      {b.matricule_snapshot && (
                        <p className="text-xs text-base-content/40 font-mono">{b.matricule_snapshot}</p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm font-mono">
                        {formaterPeriode(b)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm">
                        {formaterMontantCourt(b.salaire_brut)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm text-error">
                        {formaterMontantCourt(b.total_retenues)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold text-primary">
                        {formaterMontantCourt(b.salaire_net)}
                      </span>
                    </td>
                    <td>{getBadgeStatut(b.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/paie-bulletins/${b.id}`} className="btn btn-ghost btn-xs" title="Voir">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setBulletinSelectionne(b); setShowModalSuppression(true); }}
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
                {Math.min(pageActuelle * elementsParPage, bulletinsFiltres.length)} sur{' '}
                {bulletinsFiltres.length} bulletins
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
      {showModalSuppression && bulletinSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le bulletin</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le bulletin <strong className="font-mono">{bulletinSelectionne.numero}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerBulletin} disabled={chargementAction}>
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

export default BulletinsPaie;