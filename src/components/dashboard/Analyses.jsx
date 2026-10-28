// src/components/dashboard/Analyses.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Loader2, AlertCircle, RefreshCw, TrendingUp,
  Package, Fuel, Target, Award, Users, ShoppingCart
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';
import {
  PieChartCard, SemiCircleCard, BarChartCard,
  AreaChartCard, LineChartCard, COLORS, formaterMontant,
} from './charts/Charts';

const formaterNombre = (n) => new Intl.NumberFormat('fr-FR').format(Number(n || 0));

const Analyses = () => {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/analyses/', { timeout: 20000 });
      setData(res.data);
    } catch (err) {
      console.error('[Analyses]', err);
      setErreur('Impossible de charger les analyses');
    } finally {
      setChargement(false);
    }
  };

  const evolutionCA = data?.evolution_ca || [];
  const topClients = data?.top_clients || [];
  const topArticles = data?.top_articles || [];
  const consommationCarburant = data?.consommation_carburant || [];
  const performances = data?.performances_missions || {};

  // Données graphiques
  const areaCA = useMemo(() => {
    return evolutionCA.map(e => ({
      name: e.mois,
      montant: e.montant,
      nombre: e.nombre,
    }));
  }, [evolutionCA]);

  const barTopClients = useMemo(() => {
    return topClients.map(c => ({
      name: c.code || c.nom,
      montant: c.montant_total,
    }));
  }, [topClients]);

  const barTopArticles = useMemo(() => {
    return topArticles.map(a => ({
      name: a.code,
      quantite: Number(a.quantite_totale || 0),
    }));
  }, [topArticles]);

  const barConsoCarburant = useMemo(() => {
    return consommationCarburant
      .filter(c => c.consommation_l_100km !== null)
      .map(c => ({
        name: c.tricycle,
        consommation: c.consommation_l_100km,
      }));
  }, [consommationCarburant]);

  const piePerformances = useMemo(() => {
    if (!performances.total) return [];
    return [
      { name: 'Terminées', value: Number(performances.terminees || 0) },
      { name: 'Annulées', value: Number(performances.annulees || 0) },
      { name: 'Incidents', value: Number(performances.incidents || 0) },
    ].filter(d => d.value > 0);
  }, [performances]);

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

  return (
    <div className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <BarChart3 className="w-3 h-3" /> Analyses
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Analyses & Rapports avancés
          </h1>
        </div>
        <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Missions totales" value={formaterNombre(performances.total)} color="primary" />
        <KpiCard label="Terminées" value={formaterNombre(performances.terminees)} color="success" />
        <KpiCard label="Taux réussite" value={`${performances.taux_reussite || 0}%`} color="info" />
        <KpiCard label="Tonnage total" value={`${formaterNombre(performances.tonnage_total)} kg`} color="warning" />
      </div>

      {/* ÉVOLUTION CA */}
      {areaCA.length > 0 && (
        <div className="mb-6">
          <AreaChartCard
            title="Évolution du chiffre d'affaires"
            subtitle="Sur 12 mois"
            data={areaCA}
            dataKey="montant"
            nameKey="name"
            formatter={(v) => formaterMontant(v)}
            color={COLORS.success}
            height={320}
          />
        </div>
      )}

      {/* TOP CLIENTS / ARTICLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {barTopClients.length > 0 && (
          <BarChartCard
            title="Top 10 clients (CA)"
            data={barTopClients}
            dataKey="montant"
            nameKey="name"
            formatter={(v) => formaterMontant(v)}
            color={COLORS.warning}
            height={350}
          />
        )}
        {barTopArticles.length > 0 && (
          <BarChartCard
            title="Top 10 articles mouvementés"
            data={barTopArticles}
            dataKey="quantite"
            nameKey="name"
            formatter={formaterNombre}
            color={COLORS.info}
            height={350}
          />
        )}
      </div>

      {/* CONSO CARBURANT + PERFORMANCES MISSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {barConsoCarburant.length > 0 && (
          <BarChartCard
            title="Consommation carburant"
            subtitle="L/100 km par tricycle"
            data={barConsoCarburant}
            dataKey="consommation"
            nameKey="name"
            formatter={(v) => `${Number(v).toFixed(1)}`}
            color={COLORS.error}
            height={350}
          />
        )}
        {piePerformances.length > 0 && (
          <PieChartCard
            title="Performances des missions"
            subtitle={`Taux de réussite : ${performances.taux_reussite || 0}%`}
            data={piePerformances}
            formatter={formaterNombre}
            height={350}
            innerRadius={50}
            outerRadius={110}
          />
        )}
      </div>

      {/* DÉTAILS TABLEAUX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients détaillé */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Award className="w-4 h-4 text-warning" />
            <h2 className="font-semibold text-sm">Détail top clients</h2>
          </div>
          <div className="card-body p-0">
            {topClients.length === 0 ? (
              <p className="text-center text-base-content/40 py-8">Aucune donnée</p>
            ) : (
              <table className="table table-sm">
                <thead>
                  <tr className="border-b border-base-300">
                    <th className="text-xs uppercase">#</th>
                    <th className="text-xs uppercase">Client</th>
                    <th className="text-xs uppercase text-right">Montant</th>
                    <th className="text-xs uppercase text-right">Factures</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((c, i) => (
                    <tr key={i} className="border-b border-base-200 last:border-0">
                      <td><span className={`badge badge-sm ${i < 3 ? 'badge-warning' : 'badge-ghost'}`}>{i + 1}</span></td>
                      <td className="truncate max-w-[150px]">{c.nom || c.code}</td>
                      <td className="text-right font-mono text-xs">{formaterMontant(c.montant_total)}</td>
                      <td className="text-right font-mono text-xs">{c.nombre_factures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Conso carburant détaillée */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Fuel className="w-4 h-4 text-error" />
            <h2 className="font-semibold text-sm">Consommation carburant</h2>
          </div>
          <div className="card-body p-0">
            {consommationCarburant.length === 0 ? (
              <p className="text-center text-base-content/40 py-8">Aucune donnée</p>
            ) : (
              <table className="table table-sm">
                <thead>
                  <tr className="border-b border-base-300">
                    <th className="text-xs uppercase">Tricycle</th>
                    <th className="text-xs uppercase text-right">Distance</th>
                    <th className="text-xs uppercase text-right">Litres</th>
                    <th className="text-xs uppercase text-right">L/100</th>
                  </tr>
                </thead>
                <tbody>
                  {consommationCarburant.map((c, i) => (
                    <tr key={i} className="border-b border-base-200 last:border-0">
                      <td className="font-mono text-xs">{c.tricycle}</td>
                      <td className="text-right font-mono text-xs">{formaterNombre(c.distance_km)} km</td>
                      <td className="text-right font-mono text-xs">{formaterNombre(c.total_litres)} L</td>
                      <td className="text-right">
                        <span className={`font-mono text-xs font-bold ${c.consommation_l_100km > 20 ? 'text-error' : 'text-success'}`}>
                          {c.consommation_l_100km?.toFixed(1) || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, color = 'primary' }) => (
  <div className={`card bg-gradient-to-br from-${color}/10 to-${color}/5 border border-${color}/20 shadow-sm`}>
    <div className="card-body p-4">
      <p className={`text-xs text-${color}/70 uppercase font-medium`}>{label}</p>
      <p className={`text-2xl font-bold text-${color} truncate`}>{value}</p>
    </div>
  </div>
);

export default Analyses;