// components/paie/ArchivesPaie.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive, Search, Loader2, AlertCircle, RefreshCw, Filter,
  ChevronLeft, ChevronRight, Calculator, Download, Calendar,
  Users, TrendingUp, Wallet, FileText, Eye, Lock, Shield,
  CalendarDays, Info, FileDown, Building2, Hash, Clock,
  PackageOpen, CheckCircle, FolderArchive, Database
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Mois
// ============================================================
const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const ArchivesPaie = () => {
  const [archives, setArchives] = useState([]);
  const [archivesFiltrees, setArchivesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(12);

  // ------------------------------------------------------------
  // Chargement : uniquement les périodes clôturées
  // ------------------------------------------------------------
  useEffect(() => {
    chargerArchives();
  }, []);

  const chargerArchives = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/periodes-paie/?statut=cloturee');
      const data = res.data.results || res.data || [];
      setArchives(data);
      setArchivesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les archives de paie');
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Filtrage
  // ------------------------------------------------------------
  useEffect(() => {
    let filtre = archives;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.libelle?.toLowerCase().includes(terme) ||
        `${MOIS_NOMS[(a.mois || 1) - 1]} ${a.annee}`.toLowerCase().includes(terme)
      );
    }
    if (filtreAnnee !== 'all') filtre = filtre.filter(a => String(a.annee) === String(filtreAnnee));
    setArchivesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreAnnee, archives]);

  const totalPages = Math.ceil(archivesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return archivesFiltrees.slice(debut, debut + elementsParPage);
  };

  const anneesDisponibles = useMemo(() => {
    const set = new Set(archives.map(a => a.annee).filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [archives]);

  // ------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------
  const stats = useMemo(() => ({
    total: archives.length,
    masseBrute: archives.reduce((s, a) => s + Number(a.total_brut || 0), 0),
    masseNette: archives.reduce((s, a) => s + Number(a.total_net || 0), 0),
    totalEmployes: archives.reduce((s, a) => s + Number(a.nombre_employes || 0), 0),
  }), [archives]);

  // ------------------------------------------------------------
  // Formatage
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // Export CSV des archives
  // ------------------------------------------------------------
  const exporterCSV = () => {
    if (archivesFiltrees.length === 0) {
      alert('Aucune archive à exporter');
      return;
    }

    const headers = [
      'Période', 'Libellé', 'Date début', 'Date fin',
      'Employés', 'Total brut (GNF)', 'Total retenues (GNF)', 'Total net (GNF)'
    ];

    const lignes = archivesFiltrees.map(a => [
      `${MOIS_NOMS[(a.mois || 1) - 1]} ${a.annee}`,
      a.libelle || '',
      a.date_debut || '',
      a.date_fin || '',
      a.nombre_employes || 0,
      Number(a.total_brut || 0),
      Number(a.total_retenues || 0),
      Number(a.total_net || 0),
    ]);

    const csv = [
      headers.join(';'),
      ...lignes.map(l => l.map(v => `"${v}"`).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archives_paie_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtresActifs = recherche || filtreAnnee !== 'all';

  // ------------------------------------------------------------
  // Rendu : chargement / erreur
  // ------------------------------------------------------------
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
        <button onClick={chargerArchives} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full p-6">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Paie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Archives</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderArchive className="w-8 h-8 text-primary" />
            Archives de paie
          </h1>
          <p className="text-base-content/60 mt-1">
            {archivesFiltrees.length} période{archivesFiltrees.length > 1 ? 's' : ''} archivée{archivesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && archives.length !== archivesFiltrees.length && (
              <span className="text-base-content/40"> (sur {archives.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerArchives} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button
            onClick={exporterCSV}
            className="btn btn-outline btn-sm gap-2"
            disabled={archivesFiltrees.length === 0}
          >
            <FileDown className="w-4 h-4" /> Exporter CSV
          </button>
        </div>
      </div>

      {/* ============ BANDEAU INFO ============ */}
      <div className="alert alert-info mb-6">
        <Shield className="w-5 h-5" />
        <div>
          <p className="font-bold">Archives sécurisées</p>
          <p className="text-sm">
            Les périodes archivées sont <strong>clôturées et immuables</strong>.
            Elles restent consultables et téléchargeables pour vos obligations
            légales et comptables.
          </p>
        </div>
      </div>

      {/* ============ STATISTIQUES ============ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Archive className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Périodes</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Employés</p>
              <p className="text-xl font-bold text-info">{stats.totalEmployes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Masse brute</p>
              <p className="text-sm font-bold truncate font-mono">
                {formaterMontantCourt(stats.masseBrute)} GNF
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Masse nette</p>
              <p className="text-sm font-bold text-success truncate font-mono">
                {formaterMontantCourt(stats.masseNette)} GNF
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ FILTRES ============ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par libellé, mois..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            {anneesDisponibles.length > 0 && (
              <select
                className="select select-bordered select-sm"
                value={filtreAnnee}
                onChange={(e) => setFiltreAnnee(e.target.value)}
              >
                <option value="all">Toutes les années</option>
                {anneesDisponibles.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreAnnee('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============ LISTE ============ */}
      {archivesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <PackageOpen className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs
              ? 'Aucune archive ne correspond aux filtres'
              : 'Aucune archive de paie disponible'}
          </p>
          {filtresActifs ? (
            <button
              className="btn btn-ghost mt-4"
              onClick={() => {
                setRecherche('');
                setFiltreAnnee('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          ) : (
            <div className="alert alert-info max-w-lg mx-auto mt-4">
              <Info className="w-5 h-5" />
              <span className="text-sm text-left">
                Les archives contiennent les <strong>périodes de paie clôturées</strong>.
                Pour archiver une période, ouvrez-la et cliquez sur
                <strong> « Clôturer »</strong> depuis sa page de détail.
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ============ GRILLE DE CARTES ============ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getElementsPage().map((a) => (
              <div
                key={a.id}
                className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow"
              >
                <div className="card-body p-5">
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-lg truncate">
                          {MOIS_NOMS[(a.mois || 1) - 1]} {a.annee}
                        </p>
                        {a.libelle && (
                          <p className="text-xs text-base-content/50 truncate">
                            {a.libelle}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="badge badge-neutral badge-sm gap-1 flex-shrink-0">
                      <Lock className="w-3 h-3" />
                      Clôturée
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-xs text-base-content/60 mb-3">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{formaterDate(a.date_debut)}</span>
                    <span className="text-base-content/30">→</span>
                    <span>{formaterDate(a.date_fin)}</span>
                  </div>

                  <div className="divider my-2"></div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] text-base-content/50 uppercase mb-0.5">
                        Employés
                      </p>
                      <p className="font-bold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-base-content/40" />
                        {a.nombre_employes || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-base-content/50 uppercase mb-0.5">
                        Total brut
                      </p>
                      <p className="font-mono font-bold text-xs">
                        {formaterMontantCourt(a.total_brut)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-base-content/50 uppercase mb-0.5">
                        Total net payé
                      </p>
                      <p className="font-mono font-bold text-success">
                        {formaterMontant(a.total_net)}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/periodes-paie/${a.id}`}
                      className="btn btn-outline btn-sm flex-1 gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Voir
                    </Link>
                    <Link
                      to={`/historique-paie?annee=${a.annee}&mois=${a.mois}`}
                      className="btn btn-ghost btn-sm gap-1"
                      title="Voir l'historique de cette période"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ============ PAGINATION ============ */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 flex-wrap gap-2">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, archivesFiltrees.length)} sur{' '}
                {archivesFiltrees.length} archive{archivesFiltrees.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
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

      {/* ============ PIED DE PAGE INFO ============ */}
      <div className="card bg-base-200/50 border border-base-300 shadow-sm mt-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-info" />
              </div>
              <div className="text-xs">
                <p className="font-medium">Conservation légale</p>
                <p className="text-base-content/60">
                  Les archives de paie sont conservées conformément aux
                  obligations légales en vigueur.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-base-content/50">
              <Shield className="w-3.5 h-3.5" />
              Accès en lecture seule
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivesPaie;