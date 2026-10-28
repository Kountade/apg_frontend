// src/components/dashboard/Statistiques.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Loader2, AlertCircle, RefreshCw, DollarSign,
  Users, Package, Truck, HardHat, Briefcase, Download
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';
import {
  PieChartCard, SemiCircleCard, RadialBarCard, BarChartCard,
  AreaChartCard, COLORS, formaterMontant,
} from './charts/Charts';

const formaterNombre = (n) => new Intl.NumberFormat('fr-FR').format(Number(n || 0));

const Statistiques = () => {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [onglet, setOnglet] = useState('financier');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/statistiques/', { timeout: 20000 });
      setData(res.data);
    } catch (err) {
      console.error('[Statistiques]', err);
      setErreur(err.response?.data?.detail || 'Impossible de charger les statistiques');
    } finally {
      setChargement(false);
    }
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
        <button onClick={charger} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const onglets = [
    { id: 'financier', label: 'Financier', icon: DollarSign },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'stocks', label: 'Stocks', icon: Package },
    { id: 'vehicules', label: 'Véhicules', icon: Truck },
    { id: 'achats', label: 'Achats', icon: Briefcase },
    { id: 'exploitation', label: 'Exploitation', icon: HardHat },
  ];

  return (
    <div className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <BarChart3 className="w-3 h-3" /> Statistiques détaillées
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Statistiques par module
          </h1>
        </div>
        <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      <div className="tabs tabs-boxed bg-base-100 border border-base-300 mb-6 flex-wrap">
        {onglets.map(o => {
          const Icon = o.icon;
          return (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`tab gap-2 ${onglet === o.id ? 'tab-active' : ''}`}
            >
              <Icon className="w-4 h-4" /> {o.label}
            </button>
          );
        })}
      </div>

      {onglet === 'financier' && <SectionFinancier data={data?.financier} />}
      {onglet === 'clients' && <SectionClients data={data?.clients} />}
      {onglet === 'stocks' && <SectionStocks data={data?.stocks} />}
      {onglet === 'vehicules' && <SectionVehicules data={data?.vehicules} />}
      {onglet === 'achats' && <SectionAchats data={data?.achats} />}
      {onglet === 'exploitation' && <SectionExploitation data={data?.exploitation} />}
    </div>
  );
};

// ============================================================
// SECTION FINANCIER
// ============================================================
const SectionFinancier = ({ data }) => {
  const pieFactures = useMemo(() => {
    if (!data?.factures) return [];
    return [
      { name: 'Payées', value: Number(data.factures.payees || 0) },
      { name: 'Impayées', value: Number(data.factures.impayees || 0) },
    ].filter(d => d.value > 0);
  }, [data]);

  const radialFlux = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Encaissements', value: Number(data.encaissements?.mois || 0), fill: COLORS.success },
      { name: 'Décaissements', value: Number(data.decaissements?.mois || 0), fill: COLORS.warning },
      { name: 'Créances', value: Number(data.creances?.total || 0), fill: COLORS.error },
    ].filter(d => d.value > 0);
  }, [data]);

  const barComparaison = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Encaissements', value: Number(data.encaissements?.total || 0), fill: COLORS.success },
      { name: 'Décaissements', value: Number(data.decaissements?.total || 0), fill: COLORS.warning },
      { name: 'Créances', value: Number(data.creances?.total || 0), fill: COLORS.error },
    ];
  }, [data]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPIs rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Factures" value={formaterNombre(data.factures?.total)} sub={formaterMontant(data.factures?.montant_total)} color="primary" />
        <KpiCard label="Payées" value={formaterNombre(data.factures?.payees)} color="success" />
        <KpiCard label="Impayées" value={formaterNombre(data.factures?.impayees)} color="error" />
        <KpiCard label="Créances" value={formaterMontant(data.creances?.total)} color="warning" mono />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pieFactures.length > 0 && (
          <PieChartCard
            title="Répartition des factures"
            data={pieFactures}
            formatter={formaterNombre}
            height={280}
            innerRadius={40}
            outerRadius={90}
          />
        )}
        {radialFlux.length > 0 && (
          <RadialBarCard
            title="Flux financiers (mois)"
            data={radialFlux}
            height={280}
          />
        )}
        {barComparaison.length > 0 && (
          <BarChartCard
            title="Comparaison globale"
            data={barComparaison}
            formatter={(v) => formaterMontant(v)}
            height={280}
          />
        )}
      </div>

      {/* Détails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSection titre="Factures">
          <Ligne label="Total" valeur={formaterNombre(data.factures?.total)} />
          <Ligne label="Ce mois" valeur={formaterMontant(data.factures?.montant_mois)} mono />
          <Ligne label="Cette année" valeur={formaterMontant(data.factures?.montant_annee)} mono />
        </CardSection>
        <CardSection titre="Trésorerie">
          <Ligne label="Encaissements (mois)" valeur={formaterMontant(data.encaissements?.mois)} color="success" mono />
          <Ligne label="Décaissements (mois)" valeur={formaterMontant(data.decaissements?.mois)} color="warning" mono />
        </CardSection>
      </div>
    </div>
  );
};

// ============================================================
// SECTION CLIENTS
// ============================================================
const SectionClients = ({ data }) => {
  const pieTypes = useMemo(() => {
    if (!data?.par_type) return [];
    return data.par_type.map(t => ({
      name: t.type || 'Autre',
      value: Number(t.total || 0),
    })).filter(d => d.value > 0);
  }, [data]);

  const semiContrats = useMemo(() => {
    if (!data?.contrats) return [];
    const c = data.contrats;
    return [
      { name: 'Actifs', value: Number(c.actifs || 0) },
      { name: 'Expirent 30j', value: Number(c.expirant_30j || 0) },
      { name: 'Autres', value: Math.max(Number(c.total || 0) - Number(c.actifs || 0) - Number(c.expirant_30j || 0), 0) },
    ].filter(d => d.value > 0);
  }, [data]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Clients" value={formaterNombre(data.total)} color="primary" />
        <KpiCard label="Actifs" value={formaterNombre(data.actifs)} color="success" />
        <KpiCard label="Nouveaux (mois)" value={formaterNombre(data.nouveaux_mois)} color="info" />
        <KpiCard label="Contrats actifs" value={formaterNombre(data.contrats?.actifs)} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieTypes.length > 0 && (
          <PieChartCard
            title="Répartition par type de client"
            data={pieTypes}
            formatter={formaterNombre}
            height={300}
          />
        )}
        {semiContrats.length > 0 && (
          <SemiCircleCard
            title="État des contrats"
            data={semiContrats}
            formatter={formaterNombre}
            height={300}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSection titre="Clients">
          <Ligne label="Total" valeur={formaterNombre(data.total)} />
          <Ligne label="Actifs" valeur={formaterNombre(data.actifs)} color="success" />
          <Ligne label="Nouveaux (mois)" valeur={formaterNombre(data.nouveaux_mois)} color="info" />
        </CardSection>
        <CardSection titre="Contrats">
          <Ligne label="Total" valeur={formaterNombre(data.contrats?.total)} />
          <Ligne label="Actifs" valeur={formaterNombre(data.contrats?.actifs)} color="success" />
          <Ligne label="Expirent (30j)" valeur={formaterNombre(data.contrats?.expirant_30j)} color="warning" />
        </CardSection>
      </div>
    </div>
  );
};

// ============================================================
// SECTION STOCKS
// ============================================================
const SectionStocks = ({ data }) => {
  const pieArticles = useMemo(() => {
    if (!data?.articles) return [];
    const a = data.articles;
    return [
      { name: 'Critiques', value: Number(a.critiques || 0) },
      { name: 'Alertes', value: Number(a.alertes || 0) },
      { name: 'OK', value: Math.max(Number(a.actifs || 0) - Number(a.critiques || 0) - Number(a.alertes || 0), 0) },
    ].filter(d => d.value > 0);
  }, [data]);

  const barMouvements = useMemo(() => {
    if (!data?.mouvements) return [];
    return [
      { name: 'Total', value: Number(data.mouvements.total || 0), fill: COLORS.primary },
      { name: 'Ce mois', value: Number(data.mouvements.ce_mois || 0), fill: COLORS.success },
    ];
  }, [data]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Articles" value={formaterNombre(data.articles?.total)} color="primary" />
        <KpiCard label="Critiques" value={formaterNombre(data.articles?.critiques)} color="error" />
        <KpiCard label="Équipements" value={formaterNombre(data.equipements?.total)} color="info" />
        <KpiCard label="Valeur stock" value={formaterMontant(data.articles?.valeur_stock)} color="success" mono />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieArticles.length > 0 && (
          <PieChartCard
            title="État des articles"
            subtitle="Critiques vs alertes vs OK"
            data={pieArticles}
            formatter={formaterNombre}
            height={300}
            innerRadius={40}
            outerRadius={100}
          />
        )}
        {barMouvements.length > 0 && (
          <BarChartCard
            title="Mouvements de stock"
            data={barMouvements}
            formatter={formaterNombre}
            height={300}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSection titre="Articles">
          <Ligne label="Total" valeur={formaterNombre(data.articles?.total)} />
          <Ligne label="Actifs" valeur={formaterNombre(data.articles?.actifs)} color="success" />
          <Ligne label="Critiques" valeur={formaterNombre(data.articles?.critiques)} color="error" />
          <Ligne label="En alerte" valeur={formaterNombre(data.articles?.alertes)} color="warning" />
        </CardSection>
        <CardSection titre="Équipements & Mouvements">
          <Ligne label="Équipements" valeur={formaterNombre(data.equipements?.total)} />
          <Ligne label="Valeur acquisition" valeur={formaterMontant(data.equipements?.valeur_acquisition)} mono />
          <Ligne label="Mouvements" valeur={formaterNombre(data.mouvements?.total)} />
        </CardSection>
      </div>
    </div>
  );
};

// ============================================================
// SECTION VÉHICULES
// ============================================================
const SectionVehicules = ({ data }) => {
  const pieTricycles = useMemo(() => {
    if (!data?.tricycles) return [];
    const t = data.tricycles;
    return [
      { name: 'Disponibles', value: Number(t.disponibles || 0) },
      { name: 'En mission', value: Number(t.en_mission || 0) },
      { name: 'En panne', value: Number(t.en_panne || 0) },
    ].filter(d => d.value > 0);
  }, [data]);

  const semiCarburant = useMemo(() => {
    if (!data?.carburant) return [];
    return [
      { name: 'Litres', value: Number(data.carburant.litres_mois || 0) },
      { name: 'Pleins', value: Number(data.carburant.nombre_pleins || 0) },
    ].filter(d => d.value > 0);
  }, [data]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Tricycles" value={formaterNombre(data.tricycles?.total)} color="primary" />
        <KpiCard label="Disponibles" value={formaterNombre(data.tricycles?.disponibles)} color="success" />
        <KpiCard label="Conducteurs" value={formaterNombre(data.conducteurs?.total)} color="info" />
        <KpiCard label="Carburant (mois)" value={formaterMontant(data.carburant?.montant_mois)} color="warning" mono />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieTricycles.length > 0 && (
          <PieChartCard
            title="État du parc tricycles"
            data={pieTricycles}
            formatter={formaterNombre}
            height={300}
            innerRadius={40}
            outerRadius={100}
          />
        )}
        {semiCarburant.length > 0 && (
          <SemiCircleCard
            title="Consommation carburant (mois)"
            data={semiCarburant}
            formatter={formaterNombre}
            height={300}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSection titre="Tricycles">
          <Ligne label="Total" valeur={formaterNombre(data.tricycles?.total)} />
          <Ligne label="Disponibles" valeur={formaterNombre(data.tricycles?.disponibles)} color="success" />
          <Ligne label="En mission" valeur={formaterNombre(data.tricycles?.en_mission)} color="info" />
          <Ligne label="En panne" valeur={formaterNombre(data.tricycles?.en_panne)} color="error" />
        </CardSection>
        <CardSection titre="Conducteurs & Carburant">
          <Ligne label="Conducteurs" valeur={formaterNombre(data.conducteurs?.total)} />
          <Ligne label="Permis expirés" valeur={formaterNombre(data.conducteurs?.permis_expires)} color="error" />
          <Ligne label="Litres (mois)" valeur={`${formaterNombre(data.carburant?.litres_mois)} L`} mono />
          <Ligne label="Montant (mois)" valeur={formaterMontant(data.carburant?.montant_mois)} color="warning" mono />
        </CardSection>
      </div>
    </div>
  );
};

// ============================================================
// SECTION ACHATS
// ============================================================
const SectionAchats = ({ data }) => {
  const pieBC = useMemo(() => {
    if (!data?.bons_commande) return [];
    const bc = data.bons_commande;
    return [
      { name: 'En cours', value: Number(bc.en_cours || 0) },
      { name: 'Reçus', value: Number(bc.recus || 0) },
      { name: 'Autres', value: Math.max(Number(bc.total || 0) - Number(bc.en_cours || 0) - Number(bc.recus || 0), 0) },
    ].filter(d => d.value > 0);
  }, [data]);

  const barFactures = useMemo(() => {
    if (!data?.factures) return [];
    const f = data.factures;
    return [
      { name: 'Total', value: Number(f.montant_total || 0), fill: COLORS.primary },
      { name: 'Payé', value: Number(f.montant_paye || 0), fill: COLORS.success },
    ];
  }, [data]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Fournisseurs" value={formaterNombre(data.fournisseurs?.total)} color="primary" />
        <KpiCard label="BC en cours" value={formaterNombre(data.bons_commande?.en_cours)} color="warning" />
        <KpiCard label="Factures" value={formaterNombre(data.factures?.total)} color="info" />
        <KpiCard label="Factures impayées" value={formaterNombre(data.factures?.impayees)} color="error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieBC.length > 0 && (
          <PieChartCard
            title="Bons de commande"
            data={pieBC}
            formatter={formaterNombre}
            height={300}
          />
        )}
        {barFactures.length > 0 && (
          <BarChartCard
            title="Factures fournisseurs"
            data={barFactures}
            formatter={(v) => formaterMontant(v)}
            height={300}
          />
        )}
      </div>

      <CardSection titre="Détails">
        <Ligne label="Fournisseurs actifs" valeur={formaterNombre(data.fournisseurs?.actifs)} color="success" />
        <Ligne label="BC total" valeur={formaterNombre(data.bons_commande?.total)} />
        <Ligne label="BC montant" valeur={formaterMontant(data.bons_commande?.montant_total)} mono />
        <Ligne label="Factures montant" valeur={formaterMontant(data.factures?.montant_total)} mono />
        <Ligne label="Factures payées" valeur={formaterMontant(data.factures?.montant_paye)} color="success" mono />
        <Ligne label="Paiements" valeur={formaterNombre(data.paiements?.total)} />
      </CardSection>
    </div>
  );
};

// ============================================================
// SECTION EXPLOITATION
// ============================================================
const SectionExploitation = ({ data }) => {
  const pieMissions = useMemo(() => {
    if (!data?.missions) return [];
    const m = data.missions;
    return [
      { name: 'En cours', value: Number(m.en_cours || 0) },
      { name: 'Terminées', value: Number(m.terminees || 0) },
      { name: 'Autres', value: Math.max(Number(m.total || 0) - Number(m.en_cours || 0) - Number(m.terminees || 0), 0) },
    ].filter(d => d.value > 0);
  }, [data]);

  const semiEquipes = useMemo(() => {
    if (!data?.equipes) return [];
    const e = data.equipes;
    return [
      { name: 'Disponibles', value: Number(e.disponibles || 0) },
      { name: 'En mission', value: Number(e.en_mission || 0) },
    ].filter(d => d.value > 0);
  }, [data]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Missions" value={formaterNombre(data.missions?.total)} color="primary" />
        <KpiCard label="En cours" value={formaterNombre(data.missions?.en_cours)} color="info" />
        <KpiCard label="Incidents" value={formaterNombre(data.incidents?.ouverts)} color="error" />
        <KpiCard label="Tonnage (mois)" value={`${formaterNombre(data.activites?.tonnage_mois)} kg`} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieMissions.length > 0 && (
          <PieChartCard
            title="Missions"
            data={pieMissions}
            formatter={formaterNombre}
            height={300}
            innerRadius={40}
            outerRadius={100}
          />
        )}
        {semiEquipes.length > 0 && (
          <SemiCircleCard
            title="Équipes"
            data={semiEquipes}
            formatter={formaterNombre}
            height={300}
          />
        )}
      </div>

      <CardSection titre="Détails">
        <Ligne label="Missions terminées" valeur={formaterNombre(data.missions?.terminees)} color="success" />
        <Ligne label="Équipes total" valeur={formaterNombre(data.equipes?.total)} />
        <Ligne label="Incidents critiques" valeur={formaterNombre(data.incidents?.critiques)} color="error" />
        <Ligne label="Activités (mois)" valeur={formaterNombre(data.activites?.ce_mois)} color="info" />
        <Ligne label="Tonnage (mois)" valeur={`${formaterNombre(data.activites?.tonnage_mois)} kg`} color="success" mono />
      </CardSection>
    </div>
  );
};

// ============================================================
// COMPOSANTS RÉUTILISABLES
// ============================================================
const KpiCard = ({ label, value, sub, color = 'primary', mono = false }) => (
  <div className={`card bg-gradient-to-br from-${color}/10 to-${color}/5 border border-${color}/20 shadow-sm`}>
    <div className="card-body p-4">
      <p className={`text-xs text-${color}/70 uppercase font-medium`}>{label}</p>
      <p className={`text-2xl font-bold text-${color} ${mono ? 'font-mono' : ''} truncate`}>
        {value}
      </p>
      {sub && <p className={`text-xs text-${color}/60 mt-1 truncate`}>{sub}</p>}
    </div>
  </div>
);

const CardSection = ({ titre, children }) => (
  <div className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body">
      <h3 className="font-bold text-sm uppercase text-base-content/60 mb-3">{titre}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  </div>
);

const Ligne = ({ label, valeur, color = 'primary', mono = false }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-base-content/60">{label}</span>
    <span className={`font-bold ${mono ? 'font-mono' : ''} ${color !== 'primary' ? `text-${color}` : ''}`}>
      {valeur}
    </span>
  </div>
);

export default Statistiques;