// components/paie/DashboardPaie.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Loader2, AlertCircle, RefreshCw, Calculator,
  Wallet, Users, TrendingUp, TrendingDown, FileText, Calendar,
  HandCoins, CheckCircle, Clock, AlertTriangle, ChevronRight,
  ArrowUpRight, ArrowDownRight, BarChart3, History, Archive,
  FolderArchive, BadgeCheck, PlayCircle, ShieldCheck, Lock,
  User, Percent, Info, Zap, Target, Activity, XCircle,
  CheckSquare, Send, DollarSign, Building2, Bell
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Mois
// ============================================================
const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// ============================================================
// Config statuts période
// ============================================================
const STATUTS_PERIODE = {
  ouverte:             { label: 'Ouverte',             cls: 'badge-ghost',    icon: Clock,       color: 'ghost' },
  en_preparation:      { label: 'En préparation',      cls: 'badge-warning',  icon: FileText,    color: 'warning' },
  calculee:            { label: 'Calculée',            cls: 'badge-info',     icon: Calculator,  color: 'info' },
  controlee:           { label: 'Contrôlée',           cls: 'badge-accent',   icon: ShieldCheck, color: 'accent' },
  validee:             { label: 'Validée',             cls: 'badge-primary',  icon: CheckSquare, color: 'primary' },
  en_attente_paiement: { label: 'En attente paiement', cls: 'badge-secondary',icon: Send,        color: 'secondary' },
  payee:               { label: 'Payée',               cls: 'badge-success',  icon: CheckCircle, color: 'success' },
  cloturee:            { label: 'Clôturée',            cls: 'badge-neutral',  icon: Lock,        color: 'neutral' },
  annulee:             { label: 'Annulée',             cls: 'badge-error',    icon: XCircle,     color: 'error' },
};

const DashboardPaie = () => {
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [periodes, setPeriodes] = useState([]);
  const [fiches, setFiches] = useState([]);
  const [avances, setAvances] = useState([]);
  const [retenues, setRetenues] = useState([]);

  // ------------------------------------------------------------
  // Chargement global
  // ------------------------------------------------------------
  useEffect(() => {
    chargerDashboard();
  }, []);

  const chargerDashboard = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [resPeriodes, resFiches, resAvances, resRetenues] = await Promise.all([
        AxiosInstance.get('/periodes-paie/'),
        AxiosInstance.get('/fiches-paie/'),
        AxiosInstance.get('/avances-salaire/'),
        AxiosInstance.get('/retenues/'),
      ]);

      setPeriodes(resPeriodes.data.results || resPeriodes.data || []);
      setFiches(resFiches.data.results || resFiches.data || []);
      setAvances(resAvances.data.results || resAvances.data || []);
      setRetenues(resRetenues.data.results || resRetenues.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger le dashboard');
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Période courante (la plus récente non clôturée)
  // ------------------------------------------------------------
  const periodeCourante = useMemo(() => {
    const actives = periodes.filter(p =>
      !['cloturee', 'annulee'].includes(p.statut)
    );
    return actives.sort((a, b) => b.annee - a.annee || b.mois - a.mois)[0] || null;
  }, [periodes]);

  // ------------------------------------------------------------
  // KPI globaux
  // ------------------------------------------------------------
  const kpis = useMemo(() => {
    const anneeActuelle = new Date().getFullYear();
    const fichesAnnee = fiches.filter(f => f.annee === anneeActuelle);
    const totalBrut = fichesAnnee.reduce((s, f) => s + Number(f.salaire_brut || 0), 0);
    const totalNet = fichesAnnee.reduce((s, f) => s + Number(f.salaire_net || 0), 0);
    const totalRetenues = totalBrut - totalNet;
    const nbEmployes = new Set(fichesAnnee.map(f => f.employe)).size;

    return {
      totalBrut,
      totalNet,
      totalRetenues,
      nbEmployes,
      nbFiches: fichesAnnee.length,
      tauxRetenue: totalBrut > 0 ? (totalRetenues / totalBrut) * 100 : 0,
    };
  }, [fiches]);

  // ------------------------------------------------------------
  // Alertes / Actions urgentes
  // ------------------------------------------------------------
  const alertes = useMemo(() => {
    const list = [];

    // Avances en attente de validation
    const avancesDemandees = avances.filter(a => a.statut === 'demandee');
    if (avancesDemandees.length > 0) {
      const montant = avancesDemandees.reduce((s, a) => s + Number(a.montant || 0), 0);
      list.push({
        id: 'avances-demandees',
        type: 'warning',
        icon: Clock,
        titre: `${avancesDemandees.length} avance${avancesDemandees.length > 1 ? 's' : ''} à valider`,
        description: `Montant total : ${formaterMontantCourt(montant)} GNF`,
        lien: '/avances-salaire',
        cta: 'Traiter',
      });
    }

    // Avances validées à payer
    const avancesValidees = avances.filter(a => a.statut === 'validee');
    if (avancesValidees.length > 0) {
      const montant = avancesValidees.reduce((s, a) => s + Number(a.montant || 0), 0);
      list.push({
        id: 'avances-validees',
        type: 'info',
        icon: DollarSign,
        titre: `${avancesValidees.length} avance${avancesValidees.length > 1 ? 's' : ''} à payer`,
        description: `Montant total : ${formaterMontantCourt(montant)} GNF`,
        lien: '/avances-salaire',
        cta: 'Payer',
      });
    }

    // Périodes calculées à contrôler
    const periodesAControler = periodes.filter(p => p.statut === 'calculee');
    if (periodesAControler.length > 0) {
      list.push({
        id: 'periodes-a-controler',
        type: 'info',
        icon: ShieldCheck,
        titre: `${periodesAControler.length} période${periodesAControler.length > 1 ? 's' : ''} à contrôler`,
        description: `Vérifiez les bulletins avant validation`,
        lien: '/periodes-paie',
        cta: 'Contrôler',
      });
    }

    // Périodes validées à payer
    const periodesAPayer = periodes.filter(p => p.statut === 'validee');
    if (periodesAPayer.length > 0) {
      list.push({
        id: 'periodes-a-payer',
        type: 'success',
        icon: Send,
        titre: `${periodesAPayer.length} période${periodesAPayer.length > 1 ? 's' : ''} à payer`,
        description: `Prêtes pour le versement des salaires`,
        lien: '/periodes-paie',
        cta: 'Payer',
      });
    }

    return list;
  }, [avances, periodes]);

  // ------------------------------------------------------------
  // Évolution 6 derniers mois
  // ------------------------------------------------------------
  const evolution6Mois = useMemo(() => {
    const map = {};
    fiches.forEach(f => {
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
      .slice(-6);
  }, [fiches]);

  const maxBrut6Mois = useMemo(
    () => Math.max(...evolution6Mois.map(e => e.brut), 1),
    [evolution6Mois]
  );

  // ------------------------------------------------------------
  // Dernières périodes (5)
  // ------------------------------------------------------------
  const dernieresPeriodes = useMemo(() => {
    return [...periodes]
      .sort((a, b) => b.annee - a.annee || b.mois - a.mois)
      .slice(0, 5);
  }, [periodes]);

  // ------------------------------------------------------------
  // Dernières avances (5)
  // ------------------------------------------------------------
  const dernieresAvances = useMemo(() => {
    return [...avances]
      .sort((a, b) => new Date(b.date_demande) - new Date(a.date_demande))
      .slice(0, 5);
  }, [avances]);

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
        <button onClick={chargerDashboard} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  const statutCourantCfg = periodeCourante
    ? STATUTS_PERIODE[periodeCourante.statut] || STATUTS_PERIODE.ouverte
    : null;

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
            <span className="text-primary">Tableau de bord</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Tableau de bord — Paie
          </h1>
          <p className="text-base-content/60 mt-1">
            Vue d'ensemble et actions prioritaires
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDashboard} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/rapports-paie" className="btn btn-primary btn-sm gap-2">
            <BarChart3 className="w-4 h-4" /> Voir les rapports
          </Link>
        </div>
      </div>

      {/* ============ ALERTES / ACTIONS ============ */}
      {alertes.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-base-content/60">
              Actions prioritaires
            </h2>
            <span className="badge badge-warning badge-sm">{alertes.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {alertes.map((alerte) => {
              const IconAlerte = alerte.icon;
              return (
                <div
                  key={alerte.id}
                  className={`card bg-${alerte.type}/5 border border-${alerte.type}/20 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="card-body p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-${alerte.type}/20 flex items-center justify-center flex-shrink-0`}>
                        <IconAlerte className={`w-5 h-5 text-${alerte.type}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight">
                          {alerte.titre}
                        </p>
                        <p className="text-xs text-base-content/60 mt-1">
                          {alerte.description}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={alerte.lien}
                      className={`btn btn-${alerte.type} btn-sm w-full gap-1`}
                    >
                      {alerte.cta}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="alert alert-success mb-6">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-bold">Aucune action en attente</p>
            <p className="text-sm">Tout est à jour pour le moment.</p>
          </div>
        </div>
      )}

      {/* ============ CARTE PÉRIODE COURANTE ============ */}
      {periodeCourante && statutCourantCfg && (
        <div className="card bg-gradient-to-br from-primary/10 via-primary/5 to-base-100 border border-primary/20 shadow-sm mb-6">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-base-content/50 uppercase tracking-wider">
                    Période en cours
                  </p>
                  <h3 className="text-xl font-bold">
                    {MOIS_NOMS[(periodeCourante.mois || 1) - 1]} {periodeCourante.annee}
                  </h3>
                  {periodeCourante.libelle && (
                    <p className="text-sm text-base-content/60 truncate">
                      {periodeCourante.libelle}
                    </p>
                  )}
                </div>
                <span className={`badge ${statutCourantCfg.cls} badge-lg gap-1.5 ml-4 hidden md:inline-flex`}>
                  <statutCourantCfg.icon className="w-4 h-4" />
                  {statutCourantCfg.label}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-base-content/50 uppercase">Employés</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    <Users className="w-4 h-4 text-base-content/40" />
                    {periodeCourante.nombre_employes || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-base-content/50 uppercase">Total brut</p>
                  <p className="text-lg font-bold font-mono">
                    {formaterMontantCourt(periodeCourante.total_brut)} GNF
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-base-content/50 uppercase">Total net</p>
                  <p className="text-lg font-bold font-mono text-success">
                    {formaterMontantCourt(periodeCourante.total_net)} GNF
                  </p>
                </div>
                <Link
                  to={`/periodes-paie/${periodeCourante.id}`}
                  className="btn btn-primary gap-2 hidden md:inline-flex"
                >
                  Ouvrir
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="md:hidden mt-3">
              <Link
                to={`/periodes-paie/${periodeCourante.id}`}
                className="btn btn-primary w-full gap-2"
              >
                Ouvrir la période
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============ KPI GLOBAUX ANNÉE ============ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Employés</p>
            </div>
            <p className="text-2xl font-bold">{kpis.nbEmployes}</p>
            <p className="text-[10px] text-base-content/50 mt-0.5">
              {kpis.nbFiches} fiche{kpis.nbFiches > 1 ? 's' : ''} cette année
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Masse brute</p>
            </div>
            <p className="text-lg font-bold font-mono truncate">
              {formaterMontantCourt(kpis.totalBrut)} GNF
            </p>
            <p className="text-[10px] text-base-content/50 mt-0.5">
              Année {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
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

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-success" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Masse nette</p>
            </div>
            <p className="text-lg font-bold font-mono text-success truncate">
              {formaterMontantCourt(kpis.totalNet)} GNF
            </p>
            <p className="text-[10px] text-base-content/50 mt-0.5">
              Année {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* ============ GRILLE 2 COLONNES ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* --- Évolution 6 mois --- */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Évolution (6 derniers mois)</h2>
              </div>
              <Link to="/rapports-paie" className="text-xs text-primary hover:underline">
                Voir plus
              </Link>
            </div>
            <div className="p-5">
              {evolution6Mois.length === 0 ? (
                <div className="text-center py-8 text-base-content/40">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Pas encore de données</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evolution6Mois.map((e, i) => {
                    const pct = (e.brut / maxBrut6Mois) * 100;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold">
                            {MOIS_NOMS[(e.mois || 1) - 1]} {e.annee}
                          </span>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-base-content/50">
                              {e.nb} fiche{e.nb > 1 ? 's' : ''}
                            </span>
                            <span className="text-warning font-bold">
                              {formaterMontantCourt(e.brut)}
                            </span>
                            <span className="text-success font-bold">
                              {formaterMontantCourt(e.net)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <div className="flex-1 h-4 bg-base-200 rounded-l overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-warning/60 to-warning"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <div className="flex-1 h-4 bg-base-200 rounded-r overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-success/60 to-success"
                              style={{ width: `${(e.net / maxBrut6Mois) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-4 text-xs text-base-content/60 justify-center pt-2 border-t border-base-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-warning"></span>
                      Brut
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-success"></span>
                      Net
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Répartition rapide --- */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Aperçu rapide</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Périodes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Périodes
                  </span>
                  <span className="text-xs font-bold">{periodes.length}</span>
                </div>
                <div className="w-full h-2 bg-base-200 rounded-full overflow-hidden flex">
                  {['ouverte', 'en_preparation', 'calculee', 'controlee', 'validee', 'payee', 'cloturee'].map(statut => {
                    const count = periodes.filter(p => p.statut === statut).length;
                    if (count === 0) return null;
                    const pct = (count / periodes.length) * 100;
                    const colors = {
                      ouverte: 'bg-base-400',
                      en_preparation: 'bg-warning',
                      calculee: 'bg-info',
                      controlee: 'bg-accent',
                      validee: 'bg-primary',
                      payee: 'bg-success',
                      cloturee: 'bg-neutral',
                    };
                    return (
                      <div
                        key={statut}
                        className={`h-full ${colors[statut]}`}
                        style={{ width: `${pct}%` }}
                        title={`${STATUTS_PERIODE[statut]?.label}: ${count}`}
                      ></div>
                    );
                  })}
                </div>
              </div>

              <div className="divider my-1"></div>

              {/* Avances */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <HandCoins className="w-3.5 h-3.5 text-primary" />
                    Avances
                  </span>
                  <span className="text-xs font-bold">{avances.length}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-warning/10 rounded p-1.5">
                    <p className="text-[10px] text-base-content/50">Demandées</p>
                    <p className="text-sm font-bold text-warning">
                      {avances.filter(a => a.statut === 'demandee').length}
                    </p>
                  </div>
                  <div className="bg-info/10 rounded p-1.5">
                    <p className="text-[10px] text-base-content/50">Validées</p>
                    <p className="text-sm font-bold text-info">
                      {avances.filter(a => a.statut === 'validee').length}
                    </p>
                  </div>
                  <div className="bg-success/10 rounded p-1.5">
                    <p className="text-[10px] text-base-content/50">Payées</p>
                    <p className="text-sm font-bold text-success">
                      {avances.filter(a => a.statut === 'payee').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="divider my-1"></div>

              {/* Retenues */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-primary" />
                    Retenues
                  </span>
                  <span className="text-xs font-bold">{retenues.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-base-content/60">Actives</span>
                  <span className="badge badge-success badge-sm">
                    {retenues.filter(r => r.actif).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ============ DEUX TABLEAUX ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* --- Dernières périodes --- */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Dernières périodes</h2>
              </div>
              <Link
                to="/periodes-paie"
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Tout voir
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-3">
              {dernieresPeriodes.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Aucune période</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {dernieresPeriodes.map((p) => {
                    const cfg = STATUTS_PERIODE[p.statut] || STATUTS_PERIODE.ouverte;
                    const Icon = cfg.icon;
                    return (
                      <Link
                        key={p.id}
                        to={`/periodes-paie/${p.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {MOIS_NOMS[(p.mois || 1) - 1]} {p.annee}
                          </p>
                          <p className="text-[10px] text-base-content/50">
                            {p.nombre_employes || 0} employé{(p.nombre_employes || 0) > 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className={`badge ${cfg.cls} badge-sm gap-1 flex-shrink-0`}>
                          <Icon className="w-3 h-3" />
                          <span className="hidden md:inline">{cfg.label}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Dernières avances --- */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Dernières avances</h2>
              </div>
              <Link
                to="/avances-salaire"
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Tout voir
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-3">
              {dernieresAvances.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <HandCoins className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Aucune avance</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {dernieresAvances.map((a) => {
                    const cfg = {
                      demandee:   { label: 'Demandée',   cls: 'badge-warning', icon: Clock },
                      validee:    { label: 'Validée',    cls: 'badge-info',    icon: CheckSquare },
                      refusee:    { label: 'Refusée',    cls: 'badge-error',   icon: XCircle },
                      payee:      { label: 'Payée',      cls: 'badge-primary', icon: CheckCircle },
                      remboursee: { label: 'Remboursée', cls: 'badge-success', icon: BadgeCheck },
                    }[a.statut] || { label: a.statut, cls: 'badge-ghost', icon: Clock };
                    const Icon = cfg.icon;
                    return (
                      <Link
                        key={a.id}
                        to={`/avances-salaire/${a.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <div className="avatar placeholder">
                          <div className="bg-primary/10 text-primary rounded-full w-9 h-9 flex items-center justify-center text-xs font-bold">
                            <span>{(a.employe_nom?.[0] || '?').toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{a.employe_nom}</p>
                          <p className="text-[10px] text-base-content/50 font-mono">
                            {a.numero} • {formaterDate(a.date_demande)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-mono font-bold text-primary">
                            {formaterMontantCourt(a.montant)}
                          </p>
                          <span className={`badge ${cfg.cls} badge-xs gap-0.5 mt-0.5`}>
                            <Icon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ============ RACCOURCIS MODULES ============ */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-0">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Accès rapides</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link
                to="/periodes-paie"
                className="card bg-base-200/50 hover:bg-primary/10 transition-colors border border-base-300 group"
              >
                <div className="card-body p-4 items-center text-center">
                  <Calendar className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold mt-1">Périodes</p>
                </div>
              </Link>

              <Link
                to="/fiches-paie"
                className="card bg-base-200/50 hover:bg-info/10 transition-colors border border-base-300 group"
              >
                <div className="card-body p-4 items-center text-center">
                  <FileText className="w-7 h-7 text-info group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold mt-1">Fiches</p>
                </div>
              </Link>

              <Link
                to="/avances-salaire"
                className="card bg-base-200/50 hover:bg-warning/10 transition-colors border border-base-300 group"
              >
                <div className="card-body p-4 items-center text-center">
                  <HandCoins className="w-7 h-7 text-warning group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold mt-1">Avances</p>
                </div>
              </Link>

              <Link
                to="/retenues"
                className="card bg-base-200/50 hover:bg-error/10 transition-colors border border-base-300 group"
              >
                <div className="card-body p-4 items-center text-center">
                  <Percent className="w-7 h-7 text-error group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold mt-1">Retenues</p>
                </div>
              </Link>

              <Link
                to="/historique-paie"
                className="card bg-base-200/50 hover:bg-accent/10 transition-colors border border-base-300 group"
              >
                <div className="card-body p-4 items-center text-center">
                  <History className="w-7 h-7 text-accent group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold mt-1">Historique</p>
                </div>
              </Link>

              <Link
                to="/archives-paie"
                className="card bg-base-200/50 hover:bg-neutral/10 transition-colors border border-base-300 group"
              >
                <div className="card-body p-4 items-center text-center">
                  <FolderArchive className="w-7 h-7 text-neutral group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold mt-1">Archives</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============ PIED DE PAGE ============ */}
      <div className="mt-6 text-center text-xs text-base-content/40">
        <p>Dernière mise à jour : {new Date().toLocaleString('fr-FR')}</p>
      </div>
    </div>
  );
};

export default DashboardPaie;