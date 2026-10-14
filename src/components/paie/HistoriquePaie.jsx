// components/paie/HistoriquePaie.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History, Search, Loader2, AlertCircle, RefreshCw, Filter,
  ChevronLeft, ChevronRight, Calculator, Download, Calendar,
  Users, TrendingUp, Wallet, FileText, Eye, BarChart3,
  ArrowUpRight, ArrowDownRight, CalendarDays, Building2,
  User, Hash, Info, FileDown, Printer
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Mois
// ============================================================
const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const HistoriquePaie = () => {
  const [historique, setHistorique] = useState([]);
  const [historiqueFiltre, setHistoriqueFiltre] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState('all');
  const [filtreMois, setFiltreMois] = useState('all');
  const [filtreEmploye, setFiltreEmploye] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [vueMode, setVueMode] = useState('liste'); // 'liste' | 'groupe-employe'

  // ------------------------------------------------------------
  // Chargement
  // ------------------------------------------------------------
  useEffect(() => {
    chargerHistorique();
  }, []);

  const chargerHistorique = async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Récupère toutes les fiches de paie (= historique consolidé)
      const res = await AxiosInstance.get('/fiches-paie/');
      const data = res.data.results || res.data || [];
      setHistorique(data);
      setHistoriqueFiltre(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur("Impossible de charger l'historique de paie");
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Filtrage
  // ------------------------------------------------------------
  useEffect(() => {
    let filtre = historique;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(f =>
        f.employe_nom?.toLowerCase().includes(terme) ||
        f.bulletin_numero?.toLowerCase().includes(terme)
      );
    }
    if (filtreAnnee !== 'all') filtre = filtre.filter(f => String(f.annee) === String(filtreAnnee));
    if (filtreMois !== 'all') filtre = filtre.filter(f => String(f.mois) === String(filtreMois));
    if (filtreEmploye !== 'all') filtre = filtre.filter(f => String(f.employe) === String(filtreEmploye));
    setHistoriqueFiltre(filtre);
    setPageActuelle(1);
  }, [recherche, filtreAnnee, filtreMois, filtreEmploye, historique]);

  const totalPages = Math.ceil(historiqueFiltre.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return historiqueFiltre.slice(debut, debut + elementsParPage);
  };

  // ------------------------------------------------------------
  // Listes déroulantes dynamiques
  // ------------------------------------------------------------
  const anneesDisponibles = useMemo(() => {
    const set = new Set(historique.map(f => f.annee).filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [historique]);

  const employesDisponibles = useMemo(() => {
    const map = new Map();
    historique.forEach(f => {
      if (f.employe && f.employe_nom) {
        map.set(f.employe, f.employe_nom);
      }
    });
    return [...map.entries()]
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [historique]);

  // ------------------------------------------------------------
  // Groupement par employé
  // ------------------------------------------------------------
  const historiqueParEmploye = useMemo(() => {
    const groupes = {};
    historiqueFiltre.forEach(f => {
      const key = f.employe;
      if (!groupes[key]) {
        groupes[key] = {
          employe: f.employe,
          employe_nom: f.employe_nom,
          fiches: [],
          totalBrut: 0,
          totalNet: 0,
        };
      }
      groupes[key].fiches.push(f);
      groupes[key].totalBrut += Number(f.salaire_brut || 0);
      groupes[key].totalNet += Number(f.salaire_net || 0);
    });
    return Object.values(groupes).sort((a, b) =>
      (a.employe_nom || '').localeCompare(b.employe_nom || '')
    );
  }, [historiqueFiltre]);

  // ------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------
  const stats = useMemo(() => {
    const totalBrut = historiqueFiltre.reduce((s, f) => s + Number(f.salaire_brut || 0), 0);
    const totalNet = historiqueFiltre.reduce((s, f) => s + Number(f.salaire_net || 0), 0);
    const totalRetenues = totalBrut - totalNet;
    const nbEmployes = new Set(historiqueFiltre.map(f => f.employe)).size;
    return {
      total: historiqueFiltre.length,
      nbEmployes,
      totalBrut,
      totalNet,
      totalRetenues,
    };
  }, [historiqueFiltre]);

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

  // ------------------------------------------------------------
  // Export CSV
  // ------------------------------------------------------------
  const exporterCSV = () => {
    if (historiqueFiltre.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = [
      'Employé', 'Bulletin', 'Mois', 'Année',
      'Salaire brut (GNF)', 'Salaire net (GNF)', 'Retenues (GNF)'
    ];

    const lignes = historiqueFiltre.map(f => {
      const brut = Number(f.salaire_brut || 0);
      const net = Number(f.salaire_net || 0);
      return [
        f.employe_nom || '',
        f.bulletin_numero || '',
        MOIS_NOMS[(f.mois || 1) - 1],
        f.annee,
        brut,
        net,
        brut - net,
      ];
    });

    const csv = [
      headers.join(';'),
      ...lignes.map(l => l.map(v => `"${v}"`).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historique_paie_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtresActifs =
    recherche || filtreAnnee !== 'all' || filtreMois !== 'all' || filtreEmploye !== 'all';

  const resetFiltres = () => {
    setRecherche('');
    setFiltreAnnee('all');
    setFiltreMois('all');
    setFiltreEmploye('all');
  };

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
        <button onClick={chargerHistorique} className="btn btn-primary mt-4">
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
            <span className="text-primary">Historique</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Historique de paie
          </h1>
          <p className="text-base-content/60 mt-1">
            {historiqueFiltre.length} fiche{historiqueFiltre.length > 1 ? 's' : ''} •
            {' '}{stats.nbEmployes} employé{stats.nbEmployes > 1 ? 's' : ''}
            {filtresActifs && historique.length !== historiqueFiltre.length && (
              <span className="text-base-content/40"> (sur {historique.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerHistorique} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button
            onClick={exporterCSV}
            className="btn btn-outline btn-sm gap-2"
            disabled={historiqueFiltre.length === 0}
          >
            <FileDown className="w-4 h-4" /> Exporter CSV
          </button>
        </div>
      </div>

      {/* ============ STATISTIQUES ============ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Fiches</p>
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
              <p className="text-xl font-bold text-info">{stats.nbEmployes}</p>
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
                {formaterMontantCourt(stats.totalBrut)} GNF
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
                {formaterMontantCourt(stats.totalNet)} GNF
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ BANDEAU MASSE SALARIALE ============ */}
      <div className="card bg-gradient-to-r from-primary/10 via-primary/5 to-base-100 border border-primary/20 shadow-sm mb-6">
        <div className="card-body p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Total brut</p>
                <p className="text-lg font-bold font-mono">
                  {formaterMontant(stats.totalBrut)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-error/20 flex items-center justify-center flex-shrink-0">
                <ArrowDownRight className="w-6 h-6 text-error" />
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Total retenues</p>
                <p className="text-lg font-bold font-mono text-error">
                  -{formaterMontant(stats.totalRetenues)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Total net payé</p>
                <p className="text-lg font-bold font-mono text-success">
                  {formaterMontant(stats.totalNet)}
                </p>
              </div>
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
                  placeholder="Rechercher par employé, bulletin..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreEmploye}
              onChange={(e) => setFiltreEmploye(e.target.value)}
            >
              <option value="all">Tous les employés</option>
              {employesDisponibles.map(e => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreMois}
              onChange={(e) => setFiltreMois(e.target.value)}
            >
              <option value="all">Tous les mois</option>
              {MOIS_NOMS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>

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
              <button className="btn btn-ghost btn-sm gap-2" onClick={resetFiltres}>
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>

          {/* Switch vue Liste / Groupe */}
          <div className="divider my-2"></div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-base-content/50">
              Mode d'affichage :
            </div>
            <div className="tabs tabs-boxed tabs-sm">
              <button
                className={`tab ${vueMode === 'liste' ? 'tab-active' : ''}`}
                onClick={() => setVueMode('liste')}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Liste
              </button>
              <button
                className={`tab ${vueMode === 'groupe-employe' ? 'tab-active' : ''}`}
                onClick={() => setVueMode('groupe-employe')}
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Par employé
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ CONTENU ============ */}
      {historiqueFiltre.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <History className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs
              ? 'Aucune fiche ne correspond aux filtres'
              : "Aucun historique de paie disponible"}
          </p>
          {filtresActifs ? (
            <button className="btn btn-ghost mt-4" onClick={resetFiltres}>
              Réinitialiser les filtres
            </button>
          ) : (
            <div className="alert alert-info max-w-lg mx-auto mt-4">
              <Info className="w-5 h-5" />
              <span className="text-sm text-left">
                L'historique se remplit automatiquement dès que des
                <strong> périodes de paie sont validées</strong> et que des bulletins
                sont générés.
              </span>
            </div>
          )}
        </div>
      ) : vueMode === 'liste' ? (
        /* ============ VUE LISTE ============ */
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Bulletin</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Brut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Retenues</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Net</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((f) => {
                  const brut = Number(f.salaire_brut || 0);
                  const net = Number(f.salaire_net || 0);
                  const retenues = brut - net;
                  return (
                    <tr key={f.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <span className="badge badge-ghost badge-sm font-mono">
                          {MOIS_NOMS[(f.mois || 1) - 1]} {f.annee}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar placeholder">
                            <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                              <span>{(f.employe_nom?.[0] || '?').toUpperCase()}</span>
                            </div>
                          </div>
                          <span className="font-medium text-sm truncate max-w-[180px]">
                            {f.employe_nom || '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {f.bulletin ? (
                          <Link
                            to={`/bulletins-paie/${f.bulletin}`}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {f.bulletin_numero || `#${f.bulletin}`}
                          </Link>
                        ) : (
                          <span className="text-base-content/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-xs">
                          {formaterMontantCourt(brut)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-xs text-error">
                          -{formaterMontantCourt(retenues)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm font-bold text-success">
                          {formaterMontantCourt(net)}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/fiches-paie/${f.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir la fiche"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {f.fichier_pdf && (
                            <button
                              onClick={() => window.open(
                                f.fichier_pdf.startsWith('http')
                                  ? f.fichier_pdf
                                  : `${AxiosInstance.defaults.baseURL}${f.fichier_pdf}`,
                                '_blank'
                              )}
                              className="btn btn-ghost btn-xs text-primary"
                              title="Télécharger PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, historiqueFiltre.length)} sur{' '}
                {historiqueFiltre.length} fiche{historiqueFiltre.length > 1 ? 's' : ''}
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
      ) : (
        /* ============ VUE GROUPÉE PAR EMPLOYÉ ============ */
        <div className="space-y-4">
          {historiqueParEmploye.map((groupe) => (
            <div
              key={groupe.employe}
              className="card bg-base-100 shadow-sm border border-base-300"
            >
              <div className="card-body p-0">
                {/* En-tête employé */}
                <div className="px-5 py-3 bg-base-200/30 border-b border-base-300 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary/20 text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        <span>{(groupe.employe_nom?.[0] || '?').toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold">{groupe.employe_nom}</p>
                      <p className="text-xs text-base-content/50">
                        {groupe.fiches.length} fiche{groupe.fiches.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-xs text-base-content/50 uppercase">Total brut</p>
                      <p className="font-mono font-bold">
                        {formaterMontantCourt(groupe.totalBrut)} GNF
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-base-content/50 uppercase">Total net</p>
                      <p className="font-mono font-bold text-success">
                        {formaterMontantCourt(groupe.totalNet)} GNF
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tableau interne */}
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="border-b border-base-200">
                        <th className="text-xs text-base-content/50">Période</th>
                        <th className="text-xs text-base-content/50">Bulletin</th>
                        <th className="text-xs text-base-content/50 text-right">Brut</th>
                        <th className="text-xs text-base-content/50 text-right">Net</th>
                        <th className="text-xs text-base-content/50 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupe.fiches
                        .slice()
                        .sort((a, b) =>
                          b.annee - a.annee || b.mois - a.mois
                        )
                        .map((f) => (
                          <tr key={f.id} className="hover:bg-base-200/30">
                            <td>
                              <span className="text-xs font-mono">
                                {MOIS_NOMS[(f.mois || 1) - 1]} {f.annee}
                              </span>
                            </td>
                            <td>
                              {f.bulletin ? (
                                <Link
                                  to={`/bulletins-paie/${f.bulletin}`}
                                  className="font-mono text-xs text-primary hover:underline"
                                >
                                  {f.bulletin_numero || `#${f.bulletin}`}
                                </Link>
                              ) : (
                                <span className="text-base-content/30 text-xs">—</span>
                              )}
                            </td>
                            <td className="text-right">
                              <span className="font-mono text-xs">
                                {formaterMontantCourt(f.salaire_brut)}
                              </span>
                            </td>
                            <td className="text-right">
                              <span className="font-mono text-xs font-bold text-success">
                                {formaterMontantCourt(f.salaire_net)}
                              </span>
                            </td>
                            <td>
                              <div className="flex justify-end gap-1">
                                <Link
                                  to={`/fiches-paie/${f.id}`}
                                  className="btn btn-ghost btn-xs"
                                  title="Voir"
                                >
                                  <Eye className="w-3 h-3" />
                                </Link>
                                {f.fichier_pdf && (
                                  <button
                                    onClick={() => window.open(
                                      f.fichier_pdf.startsWith('http')
                                        ? f.fichier_pdf
                                        : `${AxiosInstance.defaults.baseURL}${f.fichier_pdf}`,
                                      '_blank'
                                    )}
                                    className="btn btn-ghost btn-xs text-primary"
                                    title="PDF"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoriquePaie;