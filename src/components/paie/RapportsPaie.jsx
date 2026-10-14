// components/paie/RapportsPaie.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Search, Loader2, AlertCircle, RefreshCw, Filter,
  Calculator, Download, Calendar, Users, TrendingUp, Wallet,
  FileText, FileDown, Info, TrendingDown, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Target, Building2, Percent,
  Award, UserCheck, Clock, ChevronRight
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Mois
// ============================================================
const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const RapportsPaie = () => {
  const [fiches, setFiches] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [avances, setAvances] = useState([]);
  const [retenues, setRetenues] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreAnnee, setFiltreAnnee] = useState('all');

  // ------------------------------------------------------------
  // Chargement des données depuis plusieurs endpoints
  // ------------------------------------------------------------
  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [resFiches, resPeriodes, resAvances, resRetenues] = await Promise.all([
        AxiosInstance.get('/fiches-paie/'),
        AxiosInstance.get('/periodes-paie/'),
        AxiosInstance.get('/avances-salaire/'),
        AxiosInstance.get('/retenues/'),
      ]);

      setFiches(resFiches.data.results || resFiches.data || []);
      setPeriodes(resPeriodes.data.results || resPeriodes.data || []);
      setAvances(resAvances.data.results || resAvances.data || []);
      setRetenues(resRetenues.data.results || resRetenues.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de rapport');
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Années disponibles
  // ------------------------------------------------------------
  const anneesDisponibles = useMemo(() => {
    const set = new Set(fiches.map(f => f.annee).filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [fiches]);

  // ------------------------------------------------------------
  // Fiches filtrées
  // ------------------------------------------------------------
  const fichesFiltrees = useMemo(() => {
    if (filtreAnnee === 'all') return fiches;
    return fiches.filter(f => String(f.annee) === String(filtreAnnee));
  }, [fiches, filtreAnnee]);

  // ------------------------------------------------------------
  // KPI globaux
  // ------------------------------------------------------------
  const kpis = useMemo(() => {
    const totalBrut = fichesFiltrees.reduce((s, f) => s + Number(f.salaire_brut || 0), 0);
    const totalNet = fichesFiltrees.reduce((s, f) => s + Number(f.salaire_net || 0), 0);
    const totalRetenues = totalBrut - totalNet;
    const nbFiches = fichesFiltrees.length;
    const nbEmployes = new Set(fichesFiltrees.map(f => f.employe)).size;
    const moyenneBrut = nbFiches > 0 ? totalBrut / nbFiches : 0;
    const moyenneNet = nbFiches > 0 ? totalNet / nbFiches : 0;
    const tauxRetenue = totalBrut > 0 ? (totalRetenues / totalBrut) * 100 : 0;

    return {
      totalBrut,
      totalNet,
      totalRetenues,
      nbFiches,
      nbEmployes,
      moyenneBrut,
      moyenneNet,
      tauxRetenue,
    };
  }, [fichesFiltrees]);

  // ------------------------------------------------------------
  // Évolution mensuelle (12 derniers mois)
  // ------------------------------------------------------------
  const evolutionMensuelle = useMemo(() => {
    const map = {};
    fichesFiltrees.forEach(f => {
      const key = `${f.annee}-${String(f.mois || 1).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = { annee: f.annee, mois: f.mois, brut: 0, net: 0, nb: 0 };
      }
      map[key].brut += Number(f.salaire_brut || 0);
      map[key].net += Number(f.salaire_net || 0);
      map[key].nb += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.annee - b.annee || a.mois - b.mois)
      .slice(-12);
  }, [fichesFiltrees]);

  const maxBrut = useMemo(
    () => Math.max(...evolutionMensuelle.map(e => e.brut), 1),
    [evolutionMensuelle]
  );

  // ------------------------------------------------------------
  // Top employés (par net perçu)
  // ------------------------------------------------------------
  const topEmployes = useMemo(() => {
    const map = {};
    fichesFiltrees.forEach(f => {
      const key = f.employe;
      if (!key) return;
      if (!map[key]) {
        map[key] = { employe: key, nom: f.employe_nom, brut: 0, net: 0, nb: 0 };
      }
      map[key].brut += Number(f.salaire_brut || 0);
      map[key].net += Number(f.salaire_net || 0);
      map[key].nb += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.net - a.net)
      .slice(0, 10);
  }, [fichesFiltrees]);

  const maxNetEmploye = useMemo(
    () => Math.max(...topEmployes.map(e => e.net), 1),
    [topEmployes]
  );

  // ------------------------------------------------------------
  // Analyse des retenues (types configurés)
  // ------------------------------------------------------------
  const repartitionRetenues = useMemo(() => {
    const map = {};
    retenues.forEach(r => {
      if (!map[r.type]) {
        map[r.type] = { type: r.type, label: r.type_display || r.type, count: 0 };
      }
      map[r.type].count += 1;
    });
    return Object.values(map);
  }, [retenues]);

  // ------------------------------------------------------------
  // Statistiques avances
  // ------------------------------------------------------------
  const statsAvances = useMemo(() => {
    const total = avances.length;
    const montantTotal = avances.reduce((s, a) => s + Number(a.montant || 0), 0);
    const payees = avances.filter(a => a.statut === 'payee');
    const montantPaye = payees.reduce((s, a) => s + Number(a.montant || 0), 0);
    const demandees = avances.filter(a => a.statut === 'demandee').length;
    const validees = avances.filter(a => a.statut === 'validee').length;
    return { total, montantTotal, montantPaye, demandees, validees };
  }, [avances]);

  // ------------------------------------------------------------
  // Statistiques périodes
  // ------------------------------------------------------------
  const statsPeriodes = useMemo(() => {
    const total = periodes.length;
    const enCours = periodes.filter(p => !['cloturee', 'annulee'].includes(p.statut)).length;
    const payees = periodes.filter(p => p.statut === 'payee').length;
    const cloturees = periodes.filter(p => p.statut === 'cloturee').length;
    return { total, enCours, payees, cloturees };
  }, [periodes]);

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
  // Export CSV global
  // ------------------------------------------------------------
  const exporterRapportCSV = () => {
    const lignes = [
      ['RAPPORT DE PAIE', ''],
      ['Date', new Date().toLocaleDateString('fr-FR')],
      ['Filtre année', filtreAnnee === 'all' ? 'Toutes' : filtreAnnee],
      ['', ''],
      ['KPI GLOBAUX', ''],
      ['Nombre de fiches', kpis.nbFiches],
      ['Nombre d\'employés', kpis.nbEmployes],
      ['Total brut (GNF)', kpis.totalBrut],
      ['Total retenues (GNF)', kpis.totalRetenues],
      ['Total net (GNF)', kpis.totalNet],
      ['Salaire brut moyen (GNF)', Math.round(kpis.moyenneBrut)],
      ['Salaire net moyen (GNF)', Math.round(kpis.moyenneNet)],
      ['Taux de retenue (%)', kpis.tauxRetenue.toFixed(2)],
      ['', ''],
      ['ÉVOLUTION MENSUELLE', ''],
      ['Mois', 'Brut', 'Net', 'Nb fiches'],
      ...evolutionMensuelle.map(e => [
        `${MOIS_NOMS[(e.mois || 1) - 1]} ${e.annee}`,
        e.brut,
        e.net,
        e.nb,
      ]),
    ];

    const csv = lignes.map(l => l.map(v => `"${v}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_paie_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">
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
            <span className="text-primary">Rapports & Analyses</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Rapports de paie
          </h1>
          <p className="text-base-content/60 mt-1">
            Analyse de la masse salariale, répartition et tendances
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button
            onClick={exporterRapportCSV}
            className="btn btn-primary btn-sm gap-2"
          >
            <FileDown className="w-4 h-4" /> Exporter le rapport
          </button>
        </div>
      </div>

      {/* ============ KPI GLOBAUX ============ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Fiches</p>
            </div>
            <p className="text-2xl font-bold">{kpis.nbFiches}</p>
            <p className="text-[10px] text-base-content/50 mt-0.5">
              {kpis.nbEmployes} employé{kpis.nbEmployes > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Masse brute</p>
            </div>
            <p className="text-lg font-bold font-mono truncate">
              {formaterMontantCourt(kpis.totalBrut)} GNF
            </p>
            <p className="text-[10px] text-base-content/50 mt-0.5">
              Moyenne : {formaterMontantCourt(kpis.moyenneBrut)} / fiche
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-error/10 to-error/5 border border-error/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-error" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Retenues</p>
            </div>
            <p className="text-lg font-bold font-mono text-error truncate">
              -{formaterMontantCourt(kpis.totalRetenues)} GNF
            </p>
            <p className="text-[10px] text-base-content/50 mt-0.5">
              Taux : {kpis.tauxRetenue.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-success" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Masse nette</p>
            </div>
            <p className="text-lg font-bold font-mono text-success truncate">
              {formaterMontantCourt(kpis.totalNet)} GNF
            </p>
            <p className="text-[10px] text-base-content/50 mt-0.5">
              Moyenne : {formaterMontantCourt(kpis.moyenneNet)} / fiche
            </p>
          </div>
        </div>
      </div>

      {/* ============ GRILLE 2 COLONNES ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* --- Évolution mensuelle --- */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Évolution mensuelle</h2>
              </div>
              <span className="text-xs text-base-content/50">
                {evolutionMensuelle.length} mois
              </span>
            </div>
            <div className="p-5">
              {evolutionMensuelle.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Pas assez de données</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evolutionMensuelle.map((e, i) => {
                    const pct = (e.brut / maxBrut) * 100;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold">
                            {MOIS_NOMS[(e.mois || 1) - 1].slice(0, 3)} {String(e.annee).slice(-2)}
                          </span>
                          <span className="text-base-content/60 font-mono">
                            {formaterMontantCourt(e.brut)} GNF
                            <span className="text-base-content/30 ml-2">
                              ({e.nb} fiche{e.nb > 1 ? 's' : ''})
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-6 bg-base-200 rounded-md overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-warning/60 to-warning flex items-center justify-end pr-2 transition-all"
                            style={{ width: `${pct}%` }}
                          >
                            {pct > 20 && (
                              <span className="text-[10px] text-warning-content font-mono font-bold">
                                {formaterMontantCourt(e.brut)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Top employés --- */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Top 10 employés (net)</h2>
              </div>
              <span className="text-xs text-base-content/50">
                {topEmployes.length}
              </span>
            </div>
            <div className="p-5">
              {topEmployes.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Pas assez de données</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topEmployes.map((e, i) => {
                    const pct = (e.net / maxNetEmploye) * 100;
                    return (
                      <div key={e.employe} className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                            i === 0
                              ? 'bg-warning/20 text-warning'
                              : i === 1
                              ? 'bg-base-300 text-base-content/70'
                              : i === 2
                              ? 'bg-orange-500/20 text-orange-600'
                              : 'bg-base-200 text-base-content/50'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{e.nom}</p>
                          <div className="w-full h-1.5 bg-base-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-success/60 to-success"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-mono font-bold text-success">
                            {formaterMontantCourt(e.net)}
                          </p>
                          <p className="text-[10px] text-base-content/40">
                            {e.nb} fiche{e.nb > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ============ GRILLE 3 COLONNES ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* --- Répartition retenues --- */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Types de retenues</h2>
            </div>
            <div className="p-5">
              {repartitionRetenues.length === 0 ? (
                <div className="text-center py-4 text-base-content/40">
                  <Percent className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Aucune retenue configurée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {repartitionRetenues.map(r => (
                    <div key={r.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-sm">{r.label}</span>
                      </div>
                      <span className="badge badge-ghost badge-sm font-mono">
                        {r.count}
                      </span>
                    </div>
                  ))}
                  <div className="divider my-2"></div>
                  <Link
                    to="/retenues"
                    className="btn btn-ghost btn-xs w-full gap-1"
                  >
                    Voir toutes les retenues
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Avances --- */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Avances sur salaire</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Total demandes</span>
                <span className="font-bold">{statsAvances.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Montant demandé</span>
                <span className="font-mono font-bold text-xs">
                  {formaterMontantCourt(statsAvances.montantTotal)} GNF
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Montant payé</span>
                <span className="font-mono font-bold text-xs text-success">
                  {formaterMontantCourt(statsAvances.montantPaye)} GNF
                </span>
              </div>

              <div className="divider my-1"></div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-warning/10 rounded-lg p-2">
                  <p className="text-[10px] text-base-content/50 uppercase">Demandées</p>
                  <p className="font-bold text-warning">{statsAvances.demandees}</p>
                </div>
                <div className="bg-info/10 rounded-lg p-2">
                  <p className="text-[10px] text-base-content/50 uppercase">À payer</p>
                  <p className="font-bold text-info">{statsAvances.validees}</p>
                </div>
              </div>

              <Link
                to="/avances-salaire"
                className="btn btn-ghost btn-xs w-full gap-1"
              >
                Voir toutes les avances
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* --- Périodes --- */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Périodes de paie</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Total</span>
                <span className="font-bold">{statsPeriodes.total}</span>
              </div>

              <div className="divider my-1"></div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-info/10 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-base-content/50 uppercase">En cours</p>
                  <p className="font-bold text-info">{statsPeriodes.enCours}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-base-content/50 uppercase">Payées</p>
                  <p className="font-bold text-primary">{statsPeriodes.payees}</p>
                </div>
                <div className="bg-neutral/10 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-base-content/50 uppercase">Clôturées</p>
                  <p className="font-bold text-neutral">{statsPeriodes.cloturees}</p>
                </div>
              </div>

              <Link
                to="/periodes-paie"
                className="btn btn-ghost btn-xs w-full gap-1"
              >
                Voir toutes les périodes
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ============ RAPPORTS RAPIDES ============ */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-0">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Rapports rapides</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                to="/historique-paie"
                className="card bg-base-200/50 hover:bg-base-200 transition-colors border border-base-300"
              >
                <div className="card-body p-4 flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Historique complet</p>
                    <p className="text-xs text-base-content/50">Toutes les fiches</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/archives-paie"
                className="card bg-base-200/50 hover:bg-base-200 transition-colors border border-base-300"
              >
                <div className="card-body p-4 flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-neutral" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Archives</p>
                    <p className="text-xs text-base-content/50">Périodes clôturées</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/fiches-paie"
                className="card bg-base-200/50 hover:bg-base-200 transition-colors border border-base-300"
              >
                <div className="card-body p-4 flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-info" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Fiches de paie</p>
                    <p className="text-xs text-base-content/50">PDF & détails</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/periodes-paie"
                className="card bg-base-200/50 hover:bg-base-200 transition-colors border border-base-300"
              >
                <div className="card-body p-4 flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Périodes</p>
                    <p className="text-xs text-base-content/50">Gestion des cycles</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============ PIED DE PAGE INFO ============ */}
      <div className="alert alert-info mt-6">
        <Info className="w-5 h-5" />
        <span className="text-sm">
          Ces rapports sont <strong>calculés en temps réel</strong> à partir des
          fiches de paie, avances et retenues enregistrées.
          Utilisez le filtre <strong>Année</strong> pour affiner l'analyse.
        </span>
      </div>
    </div>
  );
};

export default RapportsPaie;