// components/comptabilite/DashboardComptabilite.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Loader2, AlertCircle, RefreshCw, Calculator,
  FileText, BookOpen, Scale, TrendingUp, TrendingDown, Wallet,
  Receipt, Users, Clock, AlertTriangle, CheckCircle, BarChart3,
  DollarSign, Target, ArrowUpRight, ArrowDownRight, Activity,
  Layers, FileSpreadsheet, Percent, HandCoins, Landmark,
  ChevronRight, Building2
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const DashboardComptabilite = () => {
  const [stats, setStats] = useState(null);
  const [factures, setFactures] = useState([]);
  const [ecritures, setEcritures] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [statsRes, facturesRes, ecrituresRes, paiementsRes] = await Promise.all([
        AxiosInstance.get('/factures/statistiques/').catch(() => ({ data: {} })),
        AxiosInstance.get('/factures/').catch(() => ({ data: [] })),
        AxiosInstance.get('/ecritures-comptables/').catch(() => ({ data: [] })),
        AxiosInstance.get('/paiements-clients/').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setFactures(facturesRes.data.results || facturesRes.data || []);
      setEcritures(ecrituresRes.data.results || ecrituresRes.data || []);
      setPaiements(paiementsRes.data.results || paiementsRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données comptables');
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

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  // Analyses
  const analyse = useMemo(() => {
    const now = new Date();
    const moisActuel = now.getMonth();
    const anneeActuelle = now.getFullYear();

    // Factures du mois
    const facturesMois = factures.filter(f => {
      const d = new Date(f.date_emission);
      return d.getMonth() === moisActuel && d.getFullYear() === anneeActuelle;
    });

    // Écritures du mois
    const ecrituresMois = ecritures.filter(e => {
      const d = new Date(e.date_ecriture);
      return d.getMonth() === moisActuel && d.getFullYear() === anneeActuelle;
    });

    // Écritures par statut
    const ecrituresBrouillon = ecritures.filter(e => e.statut === 'brouillon');
    const ecrituresValidees = ecritures.filter(e => e.statut === 'validee');

    // Paiements récents
    const paiementsRecents = paiements
      .sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement))
      .slice(0, 5);

    // Dernières factures
    const dernieresFactures = [...factures]
      .sort((a, b) => new Date(b.date_emission) - new Date(a.date_emission))
      .slice(0, 5);

    return {
      facturesMois: facturesMois.length,
      montantFacturesMois: facturesMois.reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0),
      ecrituresMois: ecrituresMois.length,
      ecrituresBrouillon: ecrituresBrouillon.length,
      ecrituresValidees: ecrituresValidees.length,
      paiementsRecents,
      dernieresFactures,
    };
  }, [factures, ecritures, paiements]);

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
            <Calculator className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Tableau de bord</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Tableau de bord comptable
          </h1>
          <p className="text-base-content/60 mt-1">
            Vue d'ensemble de l'activité comptable — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/rapports-comptables" className="btn btn-primary btn-sm gap-2">
            <BarChart3 className="w-4 h-4" /> Rapports
          </Link>
        </div>
      </div>

      {/* KPI CHIFFRE D'AFFAIRES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Chiffre d'affaires</p>
            </div>
            <p className="text-2xl font-bold font-mono truncate">
              {formaterMontantCourt(stats?.montant_total || 0)}
            </p>
            <p className="text-xs text-base-content/50 mt-1">GNF total facturé</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Encaissé</p>
            </div>
            <p className="text-2xl font-bold text-success font-mono truncate">
              {formaterMontantCourt(stats?.montant_paye || 0)}
            </p>
            <p className="text-xs text-base-content/50 mt-1">
              {stats?.montant_total > 0
                ? `${((stats.montant_paye / stats.montant_total) * 100).toFixed(1)}% du CA`
                : '0% du CA'}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Impayé</p>
            </div>
            <p className="text-2xl font-bold text-warning font-mono truncate">
              {formaterMontantCourt(stats?.montant_impaye || 0)}
            </p>
            <p className="text-xs text-base-content/50 mt-1">
              {stats?.impayees || 0} facture{(stats?.impayees || 0) > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-error/10 to-error/5 border border-error/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-error" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">En retard</p>
            </div>
            <p className="text-2xl font-bold text-error">
              {stats?.en_retard || 0}
            </p>
            <p className="text-xs text-base-content/50 mt-1">factures échues</p>
          </div>
        </div>
      </div>

      {/* STATS DU MOIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Activité du mois */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Activité du mois</h2>
              </div>
              <span className="text-xs text-base-content/50">
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-base-content/50 uppercase mb-1">Factures émises</p>
                  <p className="text-xl font-bold text-primary">{analyse.facturesMois}</p>
                  <p className="text-xs text-base-content/50 mt-0.5 font-mono">
                    {formaterMontantCourt(analyse.montantFacturesMois)} GNF
                  </p>
                </div>

                <div className="bg-info/5 border border-info/20 rounded-lg p-3">
                  <p className="text-xs text-base-content/50 uppercase mb-1">Écritures</p>
                  <p className="text-xl font-bold text-info">{analyse.ecrituresMois}</p>
                  <p className="text-xs text-base-content/50 mt-0.5">ce mois</p>
                </div>

                <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                  <p className="text-xs text-base-content/50 uppercase mb-1">À valider</p>
                  <p className="text-xl font-bold text-warning">{analyse.ecrituresBrouillon}</p>
                  <p className="text-xs text-base-content/50 mt-0.5">brouillons</p>
                </div>

                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <p className="text-xs text-base-content/50 uppercase mb-1">Validées</p>
                  <p className="text-xl font-bold text-success">{analyse.ecrituresValidees}</p>
                  <p className="text-xs text-base-content/50 mt-0.5">écritures</p>
                </div>
              </div>

              {/* Barre progression encaissement */}
              {stats?.montant_total > 0 && (
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-base-content/60 font-medium">Taux d'encaissement</span>
                    <span className="font-bold text-success">
                      {((stats.montant_paye / stats.montant_total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-base-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-success/60 to-success transition-all"
                      style={{ width: `${(stats.montant_paye / stats.montant_total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-base-content/50 mt-1">
                    <span>Encaissé : {formaterMontantCourt(stats.montant_paye)}</span>
                    <span>Reste : {formaterMontantCourt(stats.montant_impaye)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Accès rapides</h2>
            </div>
            <div className="p-3 space-y-1">
              <Link
                to="/plan-comptable"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Plan comptable</p>
                  <p className="text-[10px] text-base-content/50">Comptes SYSCOHADA</p>
                </div>
                <ChevronRight className="w-4 h-4 text-base-content/30" />
              </Link>

              <Link
                to="/journaux"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-info" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Journaux</p>
                  <p className="text-[10px] text-base-content/50">AC, VE, BQ, CA...</p>
                </div>
                <ChevronRight className="w-4 h-4 text-base-content/30" />
              </Link>

              <Link
                to="/ecritures-comptables"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Écritures</p>
                  <p className="text-[10px] text-base-content/50">Saisie & validation</p>
                </div>
                <ChevronRight className="w-4 h-4 text-base-content/30" />
              </Link>

              <Link
                to="/balance"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Balance</p>
                  <p className="text-[10px] text-base-content/50">Générale</p>
                </div>
                <ChevronRight className="w-4 h-4 text-base-content/30" />
              </Link>

              <Link
                to="/grand-livre"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Grand livre</p>
                  <p className="text-[10px] text-base-content/50">Par compte</p>
                </div>
                <ChevronRight className="w-4 h-4 text-base-content/30" />
              </Link>

              <Link
                to="/declarations-fiscales"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-4 h-4 text-error" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Déclarations</p>
                  <p className="text-[10px] text-base-content/50">TVA, IS, CNSS</p>
                </div>
                <ChevronRight className="w-4 h-4 text-base-content/30" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2 COLONNES : DERNIÈRES FACTURES + PAIEMENTS RÉCENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Dernières factures */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Dernières factures</h2>
              </div>
              <Link to="/factures" className="text-xs text-primary hover:underline">
                Tout voir →
              </Link>
            </div>
            <div className="p-3">
              {analyse.dernieresFactures.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Aucune facture</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {analyse.dernieresFactures.map(f => (
                    <Link
                      key={f.id}
                      to={`/factures/${f.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono font-bold truncate">{f.numero}</p>
                        <p className="text-xs text-base-content/50 truncate">
                          {f.client_nom} • {formaterDate(f.date_emission)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono font-bold text-primary">
                          {formaterMontantCourt(f.montant_ttc)}
                        </p>
                        <span className={`badge badge-xs ${
                          f.statut === 'payee' ? 'badge-success' :
                          f.statut === 'annulee' ? 'badge-ghost' :
                          f.est_en_retard ? 'badge-error' : 'badge-warning'
                        }`}>
                          {f.statut_display || f.statut}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Paiements récents */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                <h2 className="font-semibold text-sm">Paiements récents</h2>
              </div>
              <Link to="/paiements-clients" className="text-xs text-primary hover:underline">
                Tout voir →
              </Link>
            </div>
            <div className="p-3">
              {analyse.paiementsRecents.length === 0 ? (
                <div className="text-center py-6 text-base-content/40">
                  <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Aucun paiement</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {analyse.paiementsRecents.map(p => (
                    <Link
                      key={p.id}
                      to={`/paiements-clients/${p.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono font-bold truncate">{p.numero}</p>
                        <p className="text-xs text-base-content/50 truncate">
                          {p.client_nom} • {formaterDate(p.date_paiement)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono font-bold text-success">
                          {formaterMontantCourt(p.montant)}
                        </p>
                        <span className={`badge badge-xs ${
                          p.statut === 'valide' ? 'badge-success' :
                          p.statut === 'en_attente' ? 'badge-warning' : 'badge-error'
                        }`}>
                          {p.statut_display || p.statut}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardComptabilite;