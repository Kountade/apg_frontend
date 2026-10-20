// components/comptabilite/Recouvrement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HandCoins, Loader2, AlertCircle, RefreshCw, Send, Users,
  DollarSign, TrendingDown, AlertTriangle, Clock, FileText,
  CheckCircle, Target, Zap, Activity, ArrowUpRight, Mail,
  Phone, MessageSquare, MapPin, ChevronRight, Calendar
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Recouvrement = () => {
  const [factures, setFactures] = useState([]);
  const [relances, setRelances] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [facturesRes, relancesRes] = await Promise.all([
        AxiosInstance.get('/factures/creances/').catch(() => ({ data: [] })),
        AxiosInstance.get('/relances/').catch(() => ({ data: [] })),
      ]);
      setFactures(facturesRes.data.results || facturesRes.data || []);
      setRelances(relancesRes.data.results || relancesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de recouvrement');
    } finally {
      setChargement(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterMontantCourt = (m) => {
    const num = Number(m || 0);
    if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
  };

  // Analyse des créances
  const analyse = useMemo(() => {
    const now = new Date();
    const total = factures.reduce((sum, f) => sum + Number(f.solde_restant || 0), 0);
    const nbClients = new Set(factures.map(f => f.client)).size;

    const parAnciennete = {
      aEchoir: { label: 'À échoir', factures: [], montant: 0, color: 'info' },
      faible: { label: '≤ 30 jours', factures: [], montant: 0, color: 'warning' },
      moyen: { label: '31 - 60 jours', factures: [], montant: 0, color: 'warning' },
      eleve: { label: '61 - 90 jours', factures: [], montant: 0, color: 'error' },
      critique: { label: '> 90 jours', factures: [], montant: 0, color: 'error' },
    };

    factures.forEach(f => {
      const jours = f.date_echeance
        ? Math.floor((now - new Date(f.date_echeance)) / (1000 * 60 * 60 * 24))
        : 0;
      const montant = Number(f.solde_restant || 0);

      let categorie = 'aEchoir';
      if (jours > 90) categorie = 'critique';
      else if (jours > 60) categorie = 'eleve';
      else if (jours > 30) categorie = 'moyen';
      else if (jours > 0) categorie = 'faible';

      parAnciennete[categorie].factures.push(f);
      parAnciennete[categorie].montant += montant;
    });

    // Top clients avec le plus de dettes
    const clientsMap = {};
    factures.forEach(f => {
      if (!f.client) return;
      if (!clientsMap[f.client]) {
        clientsMap[f.client] = {
          client: f.client,
          client_nom: f.client_nom,
          totalDu: 0,
          nbFactures: 0,
          factures: [],
        };
      }
      clientsMap[f.client].totalDu += Number(f.solde_restant || 0);
      clientsMap[f.client].nbFactures += 1;
      clientsMap[f.client].factures.push(f);
    });

    const topClients = Object.values(clientsMap)
      .sort((a, b) => b.totalDu - a.totalDu)
      .slice(0, 5);

    // Relances récentes (30 derniers jours)
    const relances30j = relances.filter(r => {
      const d = new Date(r.date_relance);
      return (now - d) / (1000 * 60 * 60 * 24) <= 30;
    });

    // Relances à venir
    const relancesAVenir = relances.filter(r => {
      if (!r.prochaine_relance) return false;
      const d = new Date(r.prochaine_relance);
      return d >= now && d <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    return {
      total,
      nbClients,
      nbFactures: factures.length,
      parAnciennete,
      topClients,
      relances30j: relances30j.length,
      relancesAVenir: relancesAVenir.length,
      relancesAVenirList: relancesAVenir,
    };
  }, [factures, relances]);

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

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <HandCoins className="w-3 h-3" />
            Facturation & Recouvrement
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Recouvrement</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HandCoins className="w-8 h-8 text-primary" />
            Tableau de bord recouvrement
          </h1>
          <p className="text-base-content/60 mt-1">
            Vue globale des créances et actions à mener
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/relances/ajouter" className="btn btn-primary gap-2">
            <Send className="w-5 h-5" /> Nouvelle relance
          </Link>
        </div>
      </div>

      {/* KPI GLOBAUX */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Montant total dû</p>
            </div>
            <p className="text-2xl font-bold font-mono truncate">{formaterMontantCourt(analyse.total)}</p>
            <p className="text-xs text-base-content/50 mt-1">GNF</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Factures</p>
            </div>
            <p className="text-2xl font-bold">{analyse.nbFactures}</p>
            <p className="text-xs text-base-content/50 mt-1">impayées</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-info" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Clients</p>
            </div>
            <p className="text-2xl font-bold text-info">{analyse.nbClients}</p>
            <p className="text-xs text-base-content/50 mt-1">concernés</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-error/10 to-error/5 border border-error/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-error" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Critiques</p>
            </div>
            <p className="text-2xl font-bold text-error">
              {analyse.parAnciennete.critique.factures.length}
            </p>
            <p className="text-xs text-base-content/50 mt-1">&gt; 90 jours</p>
          </div>
        </div>
      </div>

      {/* GRAPHIQUE ANCIENNETÉ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-0">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Répartition par ancienneté</h2>
            </div>
            <Link to="/creances" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir détails <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {Object.entries(analyse.parAnciennete).map(([key, data]) => {
                const pct = analyse.total > 0 ? (data.montant / analyse.total) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{data.label}</span>
                        <span className="badge badge-ghost badge-sm">
                          {data.factures.length} facture{data.factures.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="font-mono font-bold">{formaterMontant(data.montant)}</span>
                    </div>
                    <div className="w-full h-3 bg-base-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${data.color} transition-all`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2 COLONNES : TOP CLIENTS + RELANCES À VENIR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Top clients */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Top 5 clients débiteurs</h2>
            </div>
            <div className="p-5">
              {analyse.topClients.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune créance client</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyse.topClients.map((c, i) => {
                    const pct = analyse.total > 0 ? (c.totalDu / analyse.total) * 100 : 0;
                    return (
                      <div key={c.client} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                          i === 0 ? 'bg-error/20 text-error' :
                          i === 1 ? 'bg-warning/20 text-warning' :
                          i === 2 ? 'bg-info/20 text-info' :
                          'bg-base-300 text-base-content/60'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-2 mb-1">
                            <Link
                              to={`/clients/${c.client}`}
                              className="text-xs font-medium truncate hover:text-primary"
                            >
                              {c.client_nom}
                            </Link>
                            <span className="text-xs text-base-content/50 flex-shrink-0">
                              {c.nbFactures} fact.
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-base-200 rounded-full overflow-hidden mb-1">
                            <div
                              className="h-full bg-gradient-to-r from-warning to-error"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <p className="text-xs font-mono font-bold text-error">
                            {formaterMontantCourt(c.totalDu)} GNF
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

        {/* Relances à venir */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-warning" />
                <h2 className="font-semibold text-sm">Relances à venir (7j)</h2>
                <span className="badge badge-warning badge-sm">{analyse.relancesAVenir}</span>
              </div>
              <Link to="/historique-relances" className="text-xs text-primary hover:underline flex items-center gap-1">
                Tout voir <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5">
              {analyse.relancesAVenirList.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune relance planifiée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analyse.relancesAVenirList.slice(0, 5).map(r => (
                    <div
                      key={r.id}
                      className="p-3 bg-warning/5 border border-warning/20 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{r.client_nom}</p>
                        <span className="text-xs font-mono text-warning">
                          {new Date(r.prochaine_relance).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/60">
                        Type : {r.type_display || r.type}
                        {r.montant_reclame > 0 && (
                          <span className="ml-2 font-mono">
                            • {formaterMontantCourt(r.montant_reclame)} GNF
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ACTIONS RAPIDES */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-0">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Actions rapides</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/factures-echues"
                className="card bg-error/5 border border-error/20 hover:bg-error/10 transition-colors"
              >
                <div className="card-body p-4 items-center text-center">
                  <AlertTriangle className="w-8 h-8 text-error mb-2" />
                  <p className="text-xs font-semibold">Factures échues</p>
                  <p className="text-[10px] text-base-content/50">
                    {analyse.parAnciennete.critique.factures.length + analyse.parAnciennete.eleve.factures.length + analyse.parAnciennete.moyen.factures.length + analyse.parAnciennete.faible.factures.length}
                  </p>
                </div>
              </Link>

              <Link
                to="/creances"
                className="card bg-warning/5 border border-warning/20 hover:bg-warning/10 transition-colors"
              >
                <div className="card-body p-4 items-center text-center">
                  <HandCoins className="w-8 h-8 text-warning mb-2" />
                  <p className="text-xs font-semibold">Créances</p>
                  <p className="text-[10px] text-base-content/50">{analyse.nbFactures}</p>
                </div>
              </Link>

              <Link
                to="/relances"
                className="card bg-info/5 border border-info/20 hover:bg-info/10 transition-colors"
              >
                <div className="card-body p-4 items-center text-center">
                  <Send className="w-8 h-8 text-info mb-2" />
                  <p className="text-xs font-semibold">Relances</p>
                  <p className="text-[10px] text-base-content/50">{relances.length}</p>
                </div>
              </Link>

              <Link
                to="/paiements-clients"
                className="card bg-success/5 border border-success/20 hover:bg-success/10 transition-colors"
              >
                <div className="card-body p-4 items-center text-center">
                  <CheckCircle className="w-8 h-8 text-success mb-2" />
                  <p className="text-xs font-semibold">Paiements</p>
                  <p className="text-[10px] text-base-content/50">Encaisser</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Recouvrement;