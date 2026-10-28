// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Loader2, AlertCircle, RefreshCw, TrendingUp,
  TrendingDown, DollarSign, Users, Package, Truck, HardHat,
  Briefcase, Receipt, BarChart3, ArrowRight, WifiOff
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';
import {
  PieChartCard, SemiCircleCard, RadialBarCard, BarChartCard,
  AreaChartCard, COLORS, formaterMontant,
} from './charts/Charts';

const checkEnvConfig = () => {
  const baseURL = AxiosInstance.defaults.baseURL || '';
  const isProd = !window.location.hostname.includes('localhost') &&
                 !window.location.hostname.includes('127.0.0.1');
  const isLocalhostURL = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');
  return { isProd, isLocalhostURL, baseURL };
};

const formaterNombre = (n) => new Intl.NumberFormat('fr-FR').format(Number(n || 0));

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [erreurType, setErreurType] = useState(null);

  const envConfig = checkEnvConfig();

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    setErreurType(null);

    if (envConfig.isProd && envConfig.isLocalhostURL) {
      setErreurType('config');
      setErreur(`Configuration incorrecte : API "${envConfig.baseURL}" en production.`);
      setChargement(false);
      return;
    }

    try {
      const res = await AxiosInstance.get('/dashboard/', { timeout: 20000 });
      setData(res.data);
    } catch (err) {
      console.error('[Dashboard]', err);
      if (err.code === 'ECONNABORTED') {
        setErreurType('network');
        setErreur(`Timeout : le serveur ne répond pas à "${envConfig.baseURL}".`);
      } else if (!err.response) {
        setErreurType('network');
        setErreur(`Impossible de contacter "${envConfig.baseURL}".`);
      } else if ([401, 403].includes(err.response.status)) {
        setErreurType('auth');
        setErreur('Session expirée. Reconnectez-vous.');
      } else if (err.response.status === 404) {
        setErreurType('server');
        setErreur('Endpoint "/dashboard/" introuvable.');
      } else {
        setErreurType('server');
        setErreur(`Erreur ${err.response.status}`);
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // PRÉPARATION DES DONNÉES GRAPHES
  // ============================================================
  const financier = data?.financier || {};
  const clients = data?.clients || {};
  const stocks = data?.stocks || {};
  const vehicules = data?.vehicules || {};
  const achats = data?.achats || {};
  const exploitation = data?.exploitation || {};
  const rh = data?.rh || {};

  // Données camembert financier
  const pieFinancier = useMemo(() => {
    const f = financier.factures || {};
    return [
      { name: 'Payées', value: Number(f.payees || 0) },
      { name: 'Impayées', value: Number(f.impayees || 0) },
    ].filter(d => d.value > 0);
  }, [financier]);

  // Données semi-cercle tricycles
  const semiTricycles = useMemo(() => {
    const t = vehicules.tricycles || {};
    return [
      { name: 'Disponibles', value: Number(t.disponibles || 0) },
      { name: 'En mission', value: Number(t.en_mission || 0) },
      { name: 'En panne', value: Number(t.en_panne || 0) },
    ].filter(d => d.value > 0);
  }, [vehicules]);

  // Données radial bar : flux financier
  const radialFinancier = useMemo(() => {
    const e = financier.encaissements || {};
    const d = financier.decaissements || {};
    const c = financier.creances || {};
    return [
      { name: 'Encaissements', value: Number(e.mois || 0), fill: COLORS.success },
      { name: 'Décaissements', value: Number(d.mois || 0), fill: COLORS.warning },
      { name: 'Créances', value: Number(c.total || 0), fill: COLORS.error },
    ].filter(d => d.value > 0);
  }, [financier]);

  // Données bar chart : stocks critiques/alertes/actifs
  const barStocks = useMemo(() => {
    const a = stocks.articles || {};
    return [
      { name: 'Critiques', value: Number(a.critiques || 0), fill: COLORS.error },
      { name: 'Alertes', value: Number(a.alertes || 0), fill: COLORS.warning },
      { name: 'OK', value: Math.max(Number(a.actifs || 0) - Number(a.critiques || 0) - Number(a.alertes || 0), 0), fill: COLORS.success },
    ];
  }, [stocks]);

  // Données évolution CA (mini preview — 6 derniers mois)
  const evolutionPreview = useMemo(() => {
    // On n'a pas l'évolution dans /dashboard/, on la simulera avec les factures
    const f = financier.factures || {};
    return [
      { name: 'Total', value: Number(f.montant_total || 0) },
      { name: 'Ce mois', value: Number(f.montant_mois || 0) },
      { name: 'Cette année', value: Number(f.montant_annee || 0) },
    ];
  }, [financier]);

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (erreur) {
    const IconErreur = erreurType === 'network' ? WifiOff : AlertCircle;
    const couleurIcone = erreurType === 'config' ? 'warning' : 'error';
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className={`card bg-base-100 shadow-sm border-2 border-${couleurIcone}/30`}>
          <div className="card-body">
            <div className="text-center mb-4">
              <div className={`w-20 h-20 rounded-full bg-${couleurIcone}/10 flex items-center justify-center mx-auto mb-3`}>
                <IconErreur className={`w-10 h-10 text-${couleurIcone}`} />
              </div>
              <h2 className="text-xl font-bold mb-2">Tableau de bord indisponible</h2>
              <p className="text-sm text-base-content/70">{erreur}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={charger} className="btn btn-primary gap-2">
                <RefreshCw className="w-4 h-4" /> Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <LayoutDashboard className="w-3 h-3" /> Tableau de bord
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Vue d'ensemble
          </h1>
          <p className="text-base-content/60 mt-1">
            Données du {data?.date ? new Date(data.date).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric'
            }) : '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/statistiques" className="btn btn-primary btn-sm gap-2">
            <BarChart3 className="w-4 h-4" /> Statistiques
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* KPI CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link to="/factures" className="card bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 shadow-sm transition-all">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <Receipt className="w-6 h-6 text-primary" />
              <ArrowRight className="w-4 h-4 text-primary/50" />
            </div>
            <p className="text-xs text-primary/70 uppercase font-medium">Factures</p>
            <p className="text-3xl font-bold text-primary">{formaterNombre(financier.factures?.total)}</p>
            <p className="text-xs text-primary/60 mt-1 truncate">
              {formaterMontant(financier.factures?.montant_total)}
            </p>
          </div>
        </Link>

        <Link to="/creances" className="card bg-gradient-to-br from-error/10 to-error/5 hover:from-error/20 hover:to-error/10 border border-error/20 shadow-sm transition-all">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-6 h-6 text-error" />
              <ArrowRight className="w-4 h-4 text-error/50" />
            </div>
            <p className="text-xs text-error/70 uppercase font-medium">Créances</p>
            <p className="text-3xl font-bold text-error">{formaterNombre(financier.creances?.nombre)}</p>
            <p className="text-xs text-error/60 mt-1 truncate">
              {formaterMontant(financier.creances?.total)}
            </p>
          </div>
        </Link>

        <Link to="/articles" className="card bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10 border border-success/20 shadow-sm transition-all">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-6 h-6 text-success" />
              <ArrowRight className="w-4 h-4 text-success/50" />
            </div>
            <p className="text-xs text-success/70 uppercase font-medium">Articles</p>
            <p className="text-3xl font-bold text-success">{formaterNombre(stocks.articles?.total)}</p>
            <p className="text-xs text-success/60 mt-1">
              {formaterNombre(stocks.articles?.critiques)} critiques
            </p>
          </div>
        </Link>

        <Link to="/tricycles" className="card bg-gradient-to-br from-warning/10 to-warning/5 hover:from-warning/20 hover:to-warning/10 border border-warning/20 shadow-sm transition-all">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-6 h-6 text-warning" />
              <ArrowRight className="w-4 h-4 text-warning/50" />
            </div>
            <p className="text-xs text-warning/70 uppercase font-medium">Tricycles</p>
            <p className="text-3xl font-bold text-warning">{formaterNombre(vehicules.tricycles?.total)}</p>
            <p className="text-xs text-warning/60 mt-1">
              {formaterNombre(vehicules.tricycles?.disponibles)} dispo.
            </p>
          </div>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* GRAPHES FINANCIER */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Camembert : factures payées vs impayées */}
        {pieFinancier.length > 0 && (
          <PieChartCard
            title="État des factures"
            subtitle={`${formaterNombre(financier.factures?.total)} factures au total`}
            data={pieFinancier}
            formatter={(v) => formaterNombre(v)}
            height={280}
            innerRadius={40}
            outerRadius={90}
          />
        )}

        {/* Radial : flux financier mois */}
        {radialFinancier.length > 0 && (
          <RadialBarCard
            title="Flux financiers (mois)"
            subtitle="Encaissements vs décaissements vs créances"
            data={radialFinancier}
            height={280}
          />
        )}

        {/* Bar : stocks critiques */}
        {barStocks.length > 0 && (
          <BarChartCard
            title="Alertes stocks"
            subtitle="Répartition des articles"
            data={barStocks}
            formatter={(v) => formaterNombre(v)}
            height={280}
          />
        )}
      </div>

      {/* ============================================================ */}
      {/* SEMI-CERCLE TRICYCLES + EVOLUTION CA */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {semiTricycles.length > 0 && (
          <SemiCircleCard
            title="État du parc tricycles"
            subtitle={`${formaterNombre(vehicules.tricycles?.total)} tricycles`}
            data={semiTricycles}
            formatter={(v) => formaterNombre(v)}
            height={280}
          />
        )}

        <AreaChartCard
          title="Chiffre d'affaires"
          subtitle="Total vs mensuel vs annuel"
          data={evolutionPreview}
          dataKey="value"
          nameKey="name"
          formatter={(v) => formaterMontant(v)}
          color={COLORS.success}
          height={280}
        />
      </div>

      {/* ============================================================ */}
      {/* DÉTAILS PAR MODULE */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Clients */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-4 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm">Clients</h3>
          </div>
          <div className="card-body p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Total</p>
                <p className="text-2xl font-bold">{formaterNombre(clients.total)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Actifs</p>
                <p className="text-2xl font-bold text-success">{formaterNombre(clients.actifs)}</p>
              </div>
            </div>
            <Link to="/clients" className="btn btn-ghost btn-sm gap-1 w-full">
              Voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* RH */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-4 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Users className="w-4 h-4 text-info" />
            <h3 className="font-bold text-sm">Ressources Humaines</h3>
          </div>
          <div className="card-body p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Employés</p>
                <p className="text-2xl font-bold">{formaterNombre(rh.employes?.total)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Actifs</p>
                <p className="text-2xl font-bold text-success">{formaterNombre(rh.employes?.actifs)}</p>
              </div>
            </div>
            <Link to="/employes" className="btn btn-ghost btn-sm gap-1 w-full">
              Voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Achats */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-4 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-warning" />
            <h3 className="font-bold text-sm">Achats</h3>
          </div>
          <div className="card-body p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Fournisseurs</p>
                <p className="text-2xl font-bold">{formaterNombre(achats.fournisseurs?.total)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">BC en cours</p>
                <p className="text-2xl font-bold text-warning">{formaterNombre(achats.bons_commande?.en_cours)}</p>
              </div>
            </div>
            <Link to="/fournisseurs" className="btn btn-ghost btn-sm gap-1 w-full">
              Voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Exploitation */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-4 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <HardHat className="w-4 h-4 text-success" />
            <h3 className="font-bold text-sm">Exploitation</h3>
          </div>
          <div className="card-body p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Missions</p>
                <p className="text-2xl font-bold">{formaterNombre(exploitation.missions?.total)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">En cours</p>
                <p className="text-2xl font-bold text-info">{formaterNombre(exploitation.missions?.en_cours)}</p>
              </div>
            </div>
            <Link to="/missions" className="btn btn-ghost btn-sm gap-1 w-full">
              Voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Carburant */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-4 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Truck className="w-4 h-4 text-error" />
            <h3 className="font-bold text-sm">Carburant (mois)</h3>
          </div>
          <div className="card-body p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Litres</p>
                <p className="text-2xl font-bold">{formaterNombre(vehicules.carburant?.litres_mois)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Montant</p>
                <p className="text-sm font-bold font-mono text-error">
                  {formaterMontant(vehicules.carburant?.montant_mois)}
                </p>
              </div>
            </div>
            <Link to="/carburant" className="btn btn-ghost btn-sm gap-1 w-full">
              Voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Incidents */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-4 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-error" />
            <h3 className="font-bold text-sm">Incidents</h3>
          </div>
          <div className="card-body p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Ouverts</p>
                <p className="text-2xl font-bold text-error">{formaterNombre(exploitation.incidents?.ouverts)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Critiques</p>
                <p className="text-2xl font-bold text-error">{formaterNombre(exploitation.incidents?.critiques)}</p>
              </div>
            </div>
            <Link to="/incidents" className="btn btn-ghost btn-sm gap-1 w-full">
              Voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;