// components/tresorerie/DashboardTresorerie.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Loader2, AlertCircle, RefreshCw,
  Wallet, Landmark, TrendingUp, TrendingDown, Coins,
  ArrowDownRight, ArrowUpRight, AlertTriangle, Bell,
  Calculator, Calendar, DollarSign, CheckCircle,
  Clock, Info, BarChart3, Eye, ChevronRight,
  PieChart as PieChartIcon, Activity, ArrowRight,
  CreditCard, Users
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Palette de couleurs pour les graphiques
// ============================================================
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6',
  orange: '#F97316',
};

const PIE_COLORS = [COLORS.success, COLORS.error, COLORS.warning, COLORS.info, COLORS.purple];

const DashboardTresorerie = () => {
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [etablissement, setEtablissement] = useState(null);

  // Données
  const [caisses, setCaisses] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [encaissements, setEncaissements] = useState([]);
  const [decaissements, setDecaissements] = useState([]);
  const [previsions, setPrevisions] = useState([]);
  const [alertes, setAlertes] = useState([]);

  // Période pour les graphiques
  const [periode, setPeriode] = useState('6m');

  useEffect(() => {
    chargerDashboard();
    chargerEtablissement();
  }, []);

  useEffect(() => {
    if (!chargement) chargerDashboard();
  }, [periode]);

  const chargerEtablissement = async () => {
    try {
      const res = await AxiosInstance.get('/etablissements/unique/');
      if (res.data) setEtablissement(res.data);
    } catch (err) {
      setEtablissement({ nom: 'APG ASSAINISSEMENT', sigle: 'APG' });
    }
  };

  const chargerDashboard = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [caissesRes, comptesRes, encRes, decRes, prevRes, alertesRes] = await Promise.all([
        AxiosInstance.get('/caisses/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-bancaires/').catch(() => ({ data: [] })),
        AxiosInstance.get('/encaissements/').catch(() => ({ data: [] })),
        AxiosInstance.get('/decaissements/').catch(() => ({ data: [] })),
        AxiosInstance.get('/previsions/').catch(() => ({ data: [] })),
        AxiosInstance.get('/alertes-tresorerie/').catch(() => ({ data: [] })),
      ]);

      setCaisses(caissesRes.data.results || caissesRes.data || []);
      setComptes(comptesRes.data.results || comptesRes.data || []);
      setEncaissements(encRes.data.results || encRes.data || []);
      setDecaissements(decRes.data.results || decRes.data || []);
      setPrevisions(prevRes.data.results || prevRes.data || []);
      setAlertes(alertesRes.data.results || alertesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger le dashboard');
    } finally {
      setChargement(false);
    }
  };

  const formaterMontant = (m) => {
    if (m === null || m === undefined) return '0 GNF';
    const num = Number(m);
    return (num >= 0 ? '' : '-') + new Intl.NumberFormat('fr-FR').format(Math.abs(num)) + ' GNF';
  };

  const formaterMontantCourt = (m) => {
    const num = Number(m || 0);
    if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMois = (date) => date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

  // ============================================================
  // CALCULS
  // ============================================================
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
        <button onClick={chargerDashboard} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  // Soldes
  const soldeCaissesTotal = caisses.reduce((sum, c) => sum + Number(c.solde_theorique || 0), 0);
  const soldeComptesTotal = comptes.reduce((sum, c) => sum + Number(c.solde_actuel || 0), 0);
  const soldeTotalTresorerie = soldeCaissesTotal + soldeComptesTotal;

  // Mois actuel
  const now = new Date();

  const encaissementsMois = encaissements.filter(item => {
    const dateEnc = new Date(item.date_encaissement);
    return dateEnc.getMonth() === now.getMonth() && dateEnc.getFullYear() === now.getFullYear();
  });
  const decaissementsMois = decaissements.filter(item => {
    const dateDec = new Date(item.date_demande);
    return dateDec.getMonth() === now.getMonth() && dateDec.getFullYear() === now.getFullYear();
  });

  const totalEncMois = encaissementsMois
    .filter(item => item.statut === 'valide')
    .reduce((sum, item) => sum + Number(item.montant || 0), 0);

  const totalDecMois = decaissementsMois
    .filter(item => item.statut === 'paye')
    .reduce((sum, item) => sum + Number(item.montant || 0), 0);

  // En attente
  const encEnAttente = encaissements.filter(item => item.statut === 'en_attente');
  const decEnAttente = decaissements.filter(item => item.statut === 'en_attente');
  const decAValider = decaissements.filter(item => item.statut === 'valide');

  const totalEncEnAttente = encEnAttente.reduce((sum, item) => sum + Number(item.montant || 0), 0);
  const totalDecEnAttente = decEnAttente.reduce((sum, item) => sum + Number(item.montant || 0), 0);
  const totalDecAValider = decAValider.reduce((sum, item) => sum + Number(item.montant || 0), 0);

  // Alertes
  const alertesActives = alertes.filter(a => !a.resolue);
  const alertesCritiques = alertesActives.filter(a => a.niveau === 'critique');
  const alertesAvertissements = alertesActives.filter(a => a.niveau === 'avertissement');

  // Prévisions à venir
  const previsionsAVenir = previsions
    .filter(p => !p.realise && new Date(p.date_prevue) >= now)
    .slice(0, 5);

  // ============================================================
  // DONNÉES POUR GRAPHIQUES
  // ============================================================

  // 1. Évolution mensuelle
  const nombreMois = periode === '3m' ? 3 : periode === '6m' ? 6 : 12;
  const donneesEvolution = [];

  for (let i = nombreMois - 1; i >= 0; i--) {
    const datePeriode = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const moisPeriode = datePeriode.getMonth();
    const anneePeriode = datePeriode.getFullYear();

    const encMois = encaissements.filter(item => {
      const dateEnc = new Date(item.date_encaissement);
      return dateEnc.getMonth() === moisPeriode
        && dateEnc.getFullYear() === anneePeriode
        && item.statut === 'valide';
    });
    const decMois = decaissements.filter(item => {
      const dateDec = new Date(item.date_demande);
      return dateDec.getMonth() === moisPeriode
        && dateDec.getFullYear() === anneePeriode
        && item.statut === 'paye';
    });

    const totalEnc = encMois.reduce((sum, item) => sum + Number(item.montant || 0), 0);
    const totalDec = decMois.reduce((sum, item) => sum + Number(item.montant || 0), 0);

    donneesEvolution.push({
      mois: formaterMois(datePeriode),
      entrees: totalEnc,
      sorties: totalDec,
      solde: totalEnc - totalDec,
    });
  }

  // 2. Encaissements par type
  const donneesEncParType = {};
  encaissements.filter(item => item.statut === 'valide').forEach(item => {
    const type = item.type_display || item.type || 'Autre';
    donneesEncParType[type] = (donneesEncParType[type] || 0) + Number(item.montant || 0);
  });
  const donneesPieEnc = Object.entries(donneesEncParType).map(([name, value]) => ({ name, value }));

  // 3. Décaissements par type
  const donneesDecParType = {};
  decaissements.filter(item => item.statut === 'paye').forEach(item => {
    const type = item.type_display || item.type || 'Autre';
    donneesDecParType[type] = (donneesDecParType[type] || 0) + Number(item.montant || 0);
  });
  const donneesPieDec = Object.entries(donneesDecParType).map(([name, value]) => ({ name, value }));

  // 4. Répartition des soldes
  const donneesSoldes = [
    { name: 'Caisses', value: soldeCaissesTotal, color: COLORS.info },
    { name: 'Comptes bancaires', value: soldeComptesTotal, color: COLORS.success },
  ].filter(d => d.value > 0);

  // 5. Top 5 caisses
  const topCaisses = [...caisses]
    .sort((a, b) => Number(b.solde_theorique || 0) - Number(a.solde_theorique || 0))
    .slice(0, 5)
    .map(c => ({
      nom: c.nom.length > 15 ? c.nom.substring(0, 15) + '...' : c.nom,
      solde: Number(c.solde_theorique || 0),
    }));

  // 6. Top 5 comptes
  const topComptes = [...comptes]
    .sort((a, b) => Number(b.solde_actuel || 0) - Number(a.solde_actuel || 0))
    .slice(0, 5)
    .map(c => ({
      nom: c.nom.length > 15 ? c.nom.substring(0, 15) + '...' : c.nom,
      solde: Number(c.solde_actuel || 0),
    }));

  // 7. Statuts encaissements
  const donneesEncStatuts = [
    { name: 'Validés', value: encaissements.filter(item => item.statut === 'valide').length, fill: COLORS.success },
    { name: 'En attente', value: encEnAttente.length, fill: COLORS.warning },
    { name: 'Annulés', value: encaissements.filter(item => item.statut === 'annule').length, fill: COLORS.error },
  ].filter(d => d.value > 0);

  // 8. Statuts décaissements
  const donneesDecStatuts = [
    { name: 'Payés', value: decaissements.filter(item => item.statut === 'paye').length, fill: COLORS.success },
    { name: 'Validés', value: decAValider.length, fill: COLORS.info },
    { name: 'En attente', value: decEnAttente.length, fill: COLORS.warning },
    { name: 'Refusés', value: decaissements.filter(item => item.statut === 'refuse').length, fill: COLORS.error },
  ].filter(d => d.value > 0);

  // 9. Alertes par niveau
  const donneesAlertes = [
    { name: 'Critiques', value: alertesCritiques.length, color: COLORS.error },
    { name: 'Avertissements', value: alertesAvertissements.length, color: COLORS.warning },
    { name: 'Infos', value: alertesActives.filter(a => a.niveau === 'info').length, color: COLORS.info },
  ].filter(d => d.value > 0);

  // ============================================================
  // Composants Tooltip personnalisés
  // ============================================================
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-base-100 p-3 rounded-lg shadow-xl border border-base-300">
          <p className="font-bold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-base-content/60">{entry.name}:</span>
              <span className="font-mono font-medium">{formaterMontant(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipShort = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-base-100 p-3 rounded-lg shadow-xl border border-base-300">
          <p className="font-bold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-base-content/60">{entry.name}:</span>
              <span className="font-mono font-medium">{formaterMontantCourt(entry.value)} GNF</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
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
            <span className="text-primary">Tableau de bord</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Tableau de bord Trésorerie
          </h1>
          <p className="text-base-content/60 mt-1">
            {etablissement?.nom || 'APG ASSAINISSEMENT'} — Vue consolidée
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="join">
            <button
              onClick={() => setPeriode('3m')}
              className={`btn btn-sm join-item ${periode === '3m' ? 'btn-primary' : 'btn-outline'}`}
            >
              3 mois
            </button>
            <button
              onClick={() => setPeriode('6m')}
              className={`btn btn-sm join-item ${periode === '6m' ? 'btn-primary' : 'btn-outline'}`}
            >
              6 mois
            </button>
            <button
              onClick={() => setPeriode('12m')}
              className={`btn btn-sm join-item ${periode === '12m' ? 'btn-primary' : 'btn-outline'}`}
            >
              12 mois
            </button>
          </div>
          <button onClick={chargerDashboard} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
        </div>
      </div>

      {/* ALERTES CRITIQUES */}
      {alertesCritiques.length > 0 && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-bold">
              {alertesCritiques.length} alerte{alertesCritiques.length > 1 ? 's' : ''} critique{alertesCritiques.length > 1 ? 's' : ''} en cours
            </p>
            <p className="text-sm">Action immédiate requise</p>
          </div>
          <Link to="/alertes-tresorerie" className="btn btn-sm">
            Voir les alertes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* SOLDE TOTAL */}
      <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm mb-6">
        <div className="card-body">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-base-content/60 uppercase tracking-wider mb-2">
                Solde total de trésorerie
              </p>
              <p className="text-4xl font-bold text-primary font-mono">
                {formaterMontant(soldeTotalTresorerie)}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-info" />
                  <span className="text-base-content/60">Caisses :</span>
                  <span className="font-mono font-bold text-info">
                    {formaterMontant(soldeCaissesTotal)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-success" />
                  <span className="text-base-content/60">Comptes :</span>
                  <span className="font-mono font-bold text-success">
                    {formaterMontant(soldeComptesTotal)}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Coins className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* CARTES STATS */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-success" />
              </div>
              <Link to="/encaissements" className="text-base-content/40 hover:text-primary">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs text-base-content/50 uppercase">Encaissements (mois)</p>
            <p className="text-lg font-bold text-success font-mono">
              +{formaterMontantCourt(totalEncMois)} GNF
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-error" />
              </div>
              <Link to="/decaissements" className="text-base-content/40 hover:text-primary">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs text-base-content/50 uppercase">Décaissements (mois)</p>
            <p className="text-lg font-bold text-error font-mono">
              -{formaterMontantCourt(totalDecMois)} GNF
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <Link to="/decaissements" className="text-base-content/40 hover:text-primary">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs text-base-content/50 uppercase">En attente</p>
            <p className="text-lg font-bold text-warning">
              {encEnAttente.length + decEnAttente.length}
            </p>
            <p className="text-[10px] text-base-content/40 mt-1">
              {encEnAttente.length} enc. + {decEnAttente.length} déc.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-xs text-base-content/50 uppercase">À payer</p>
            <p className="text-lg font-bold text-info">
              {decAValider.length}
            </p>
            <p className="text-[10px] text-base-content/40 mt-1 font-mono">
              {formaterMontantCourt(totalDecAValider)} GNF
            </p>
          </div>
        </div>
      </div>

      {/* GRAPHIQUE 1 — ÉVOLUTION MENSUELLE */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Évolution des flux — {nombreMois} derniers mois</h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }}></span>
              Entrées
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.error }}></span>
              Sorties
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></span>
              Solde net
            </span>
          </div>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={donneesEvolution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.error} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.error} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formaterMontantCourt(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="entrees"
                name="Entrées"
                stroke={COLORS.success}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEntrees)"
              />
              <Area
                type="monotone"
                dataKey="sorties"
                name="Sorties"
                stroke={COLORS.error}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSorties)"
              />
              <Line
                type="monotone"
                dataKey="solde"
                name="Solde net"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ r: 4, fill: COLORS.primary }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RÉPARTITIONS (PIE CHARTS) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Répartition des soldes */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-info" />
            <h3 className="font-semibold text-sm">Répartition du solde total</h3>
          </div>
          <div className="p-5">
            {donneesSoldes.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={donneesSoldes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {donneesSoldes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltipShort />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="divider my-2"></div>

                <div className="space-y-2">
                  {donneesSoldes.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {formaterMontant(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-base-content/50 text-sm py-12">
                Aucune donnée disponible
              </p>
            )}
          </div>
        </div>

        {/* Alertes par niveau */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Bell className="w-4 h-4 text-warning" />
            <h3 className="font-semibold text-sm">Alertes actives par niveau</h3>
          </div>
          <div className="p-5">
            {donneesAlertes.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={donneesAlertes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {donneesAlertes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="divider my-2"></div>

                <div className="space-y-2">
                  {donneesAlertes.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-mono font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-3" />
                <p className="text-success font-medium">Aucune alerte active</p>
                <p className="text-xs text-base-content/50 mt-1">Tout est sous contrôle</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RÉPARTITION PAR TYPE */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Encaissements par type */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-success" />
            <h3 className="font-semibold text-sm">Encaissements par type</h3>
          </div>
          <div className="p-5">
            {donneesPieEnc.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={donneesPieEnc} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => formaterMontantCourt(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip content={<CustomTooltipShort />} />
                  <Bar dataKey="value" name="Montant" radius={[0, 8, 8, 0]}>
                    {donneesPieEnc.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-base-content/50 text-sm py-12">
                Aucun encaissement validé
              </p>
            )}
          </div>
        </div>

        {/* Décaissements par type */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-error" />
            <h3 className="font-semibold text-sm">Décaissements par type</h3>
          </div>
          <div className="p-5">
            {donneesPieDec.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={donneesPieDec} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => formaterMontantCourt(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip content={<CustomTooltipShort />} />
                  <Bar dataKey="value" name="Montant" radius={[0, 8, 8, 0]}>
                    {donneesPieDec.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-base-content/50 text-sm py-12">
                Aucun décaissement payé
              </p>
            )}
          </div>
        </div>

      </div>

      {/* TOP CAISSES & COMPTES */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Top 5 caisses */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-info" />
              <h3 className="font-semibold text-sm">Top 5 caisses</h3>
            </div>
            <Link to="/caisses" className="btn btn-xs btn-ghost gap-1">
              Voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {topCaisses.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topCaisses}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="nom" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => formaterMontantCourt(value)} />
                  <Tooltip content={<CustomTooltipShort />} />
                  <Bar dataKey="solde" name="Solde" fill={COLORS.info} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-base-content/50 text-sm py-12">
                Aucune caisse
              </p>
            )}
          </div>
        </div>

        {/* Top 5 comptes */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-success" />
              <h3 className="font-semibold text-sm">Top 5 comptes bancaires</h3>
            </div>
            <Link to="/comptes-bancaires" className="btn btn-xs btn-ghost gap-1">
              Voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {topComptes.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topComptes}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="nom" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => formaterMontantCourt(value)} />
                  <Tooltip content={<CustomTooltipShort />} />
                  <Bar dataKey="solde" name="Solde" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-base-content/50 text-sm py-12">
                Aucun compte
              </p>
            )}
          </div>
        </div>

      </div>

      {/* STATUTS ENC/DÉC (RADIAL BAR) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Statuts encaissements */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-success" />
            <h3 className="font-semibold text-sm">Statuts des encaissements</h3>
          </div>
          <div className="p-5">
            {donneesEncStatuts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="90%"
                  barSize={20}
                  data={donneesEncStatuts}
                >
                  <RadialBar
                    minAngle={15}
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }}
                    background
                    clockWise
                    dataKey="value"
                  />
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-base-content/50 text-sm py-12">
                Aucun encaissement
              </p>
            )}
          </div>
        </div>

        {/* Statuts décaissements */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-error" />
            <h3 className="font-semibold text-sm">Statuts des décaissements</h3>
          </div>
          <div className="p-5">
            {donneesDecStatuts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="90%"
                  barSize={20}
                  data={donneesDecStatuts}
                >
                  <RadialBar
                    minAngle={15}
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }}
                    background
                    clockWise
                    dataKey="value"
                  />
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-base-content/50 text-sm py-12">
                Aucun décaissement
              </p>
            )}
          </div>
        </div>

      </div>

      {/* PRÉVISIONS + ACTIONS RAPIDES */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Prévisions à venir */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-info" />
              <h3 className="font-semibold text-sm">Prévisions à venir</h3>
            </div>
            <Link to="/previsions" className="btn btn-xs btn-ghost gap-1">
              Tout voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {previsionsAVenir.length > 0 ? (
              <div className="space-y-2">
                {previsionsAVenir.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-base-200/30 hover:bg-base-200/60 transition-colors">
                    <div className="flex items-center gap-3">
                      {p.type === 'entree' ? (
                        <ArrowDownRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-error" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{p.libelle}</p>
                        <p className="text-xs text-base-content/50">
                          {formaterDate(p.date_prevue)}
                        </p>
                      </div>
                    </div>
                    <p className={`font-mono text-sm font-bold ${
                      p.type === 'entree' ? 'text-success' : 'text-error'
                    }`}>
                      {p.type === 'entree' ? '+' : '-'}{formaterMontant(p.montant)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-base-content/50 text-sm py-8">
                Aucune prévision à venir
              </p>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Actions rapides
            </h3>
            <div className="space-y-2">
              <Link to="/encaissements/ajouter" className="btn btn-success btn-sm justify-start w-full gap-2">
                <ArrowDownRight className="w-4 h-4" /> Nouvel encaissement
              </Link>
              <Link to="/decaissements/ajouter" className="btn btn-error btn-sm justify-start w-full gap-2">
                <ArrowUpRight className="w-4 h-4" /> Nouveau décaissement
              </Link>
              <Link to="/etat-caisse" className="btn btn-outline btn-sm justify-start w-full gap-2">
                <Eye className="w-4 h-4" /> État de caisse
              </Link>
              <Link to="/mouvements-tresorerie" className="btn btn-outline btn-sm justify-start w-full gap-2">
                <Coins className="w-4 h-4" /> Mouvements
              </Link>
              <Link to="/previsions/ajouter" className="btn btn-outline btn-sm justify-start w-full gap-2">
                <Calendar className="w-4 h-4" /> Nouvelle prévision
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardTresorerie;