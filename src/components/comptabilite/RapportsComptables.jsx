// components/comptabilite/RapportsComptables.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet, Loader2, AlertCircle, RefreshCw, BarChart3,
  Scale, BookOpen, FileText, Landmark, TrendingUp, TrendingDown,
  Lock, CheckSquare, FileDown, ChevronRight, Activity,
  DollarSign, Calendar, Target, Zap, Info, Building2,
  Wallet, Receipt, Users, ArrowUpRight, ArrowDownRight,
  Percent, Clock, CheckCircle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// CONFIGURATION DES RAPPORTS
// ============================================================
const RAPPORTS_CONFIG = [
  {
    id: 'balance',
    titre: 'Balance générale',
    description: 'Tous les comptes mouvementés avec débit, crédit et solde',
    icone: Scale,
    couleur: 'primary',
    route: '/balance',
    badge: 'Essentiel',
    badgeColor: 'primary',
  },
  {
    id: 'grand-livre',
    titre: 'Grand livre',
    description: 'Détail chronologique des mouvements par compte',
    icone: BookOpen,
    couleur: 'info',
    route: '/grand-livre',
    badge: 'Détail',
    badgeColor: 'info',
  },
  {
    id: 'bilan',
    titre: 'Bilan comptable',
    description: 'Actif et Passif de l\'entreprise à date',
    icone: FileSpreadsheet,
    couleur: 'warning',
    route: '/bilan',
    badge: 'Synthèse',
    badgeColor: 'warning',
  },
  {
    id: 'compte-resultat',
    titre: 'Compte de résultat',
    description: 'Charges, Produits et Résultat de l\'exercice',
    icone: BarChart3,
    couleur: 'success',
    route: '/compte-resultat',
    badge: 'Synthèse',
    badgeColor: 'success',
  },
  {
    id: 'etats-financiers',
    titre: 'États financiers',
    description: 'Bilan + Compte de résultat combinés',
    icone: FileText,
    couleur: 'secondary',
    route: '/etats-financiers',
    badge: 'Combiné',
    badgeColor: 'secondary',
  },
  {
    id: 'declarations-fiscales',
    titre: 'Déclarations fiscales',
    description: 'TVA, IS, IR, CNSS et autres obligations',
    icone: Landmark,
    couleur: 'error',
    route: '/declarations-fiscales',
    badge: 'Fiscal',
    badgeColor: 'error',
  },
  {
    id: 'cloture',
    titre: 'Clôtures comptables',
    description: 'Périodes clôturées et archivées',
    icone: Lock,
    couleur: 'neutral',
    route: '/cloture',
    badge: 'Archivage',
    badgeColor: 'neutral',
  },
  {
    id: 'lettrage',
    titre: 'Lettrage',
    description: 'Pointage factures / paiements',
    icone: CheckSquare,
    couleur: 'accent',
    route: '/lettrage',
    badge: 'Rapprochement',
    badgeColor: 'accent',
  },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const RapportsComptables = () => {
  const [stats, setStats] = useState({
    factures: null,
    ecritures: null,
    clotures: null,
    chargement: true,
    erreur: null,
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setStats(prev => ({ ...prev, chargement: true, erreur: null }));
    try {
      const [facturesRes, ecrituresRes, cloturesRes] = await Promise.allSettled([
        AxiosInstance.get('/factures/statistiques/'),
        AxiosInstance.get('/ecritures-comptables/'),
        AxiosInstance.get('/clotures/statistiques/'),
      ]);

      // Extraction sécurisée
      const facturesData = facturesRes.status === 'fulfilled'
        ? (facturesRes.value?.data || {})
        : {};

      const ecrituresRaw = ecrituresRes.status === 'fulfilled'
        ? (ecrituresRes.value?.data?.results || ecrituresRes.value?.data || [])
        : [];
      const ecrituresData = Array.isArray(ecrituresRaw) ? ecrituresRaw : [];

      const cloturesData = cloturesRes.status === 'fulfilled'
        ? (cloturesRes.value?.data || {})
        : {};

      setStats({
        factures: facturesData,
        ecritures: {
          total: ecrituresData.length,
          brouillons: ecrituresData.filter(e => e?.statut === 'brouillon').length,
          validees: ecrituresData.filter(e => e?.statut === 'validee').length,
        },
        clotures: cloturesData,
        chargement: false,
        erreur: null,
      });
    } catch (err) {
      console.error('Erreur chargement rapports:', err);
      setStats(prev => ({
        ...prev,
        chargement: false,
        erreur: 'Certaines données n\'ont pas pu être chargées',
      }));
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formaterMontant = (m) => {
    const num = Number(m || 0);
    if (isNaN(num)) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(num) + ' GNF';
  };

  const formaterMontantCourt = (m) => {
    const num = Number(m || 0);
    if (isNaN(num)) return '0';
    const abs = Math.abs(num);
    if (abs >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (abs >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (abs >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
  };

  const tauxEncaissement = useMemo(() => {
    const total = Number(stats.factures?.montant_total || 0);
    const paye = Number(stats.factures?.montant_paye || 0);
    if (total === 0) return 0;
    return (paye / total) * 100;
  }, [stats.factures]);

  // ============================================================
  // RENDU : CHARGEMENT
  // ============================================================
  if (stats.chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // ============================================================
  // RENDU : PRINCIPAL
  // ============================================================
  return (
    <div className="w-full p-6">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <FileSpreadsheet className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Rapports</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            Rapports comptables
          </h1>
          <p className="text-base-content/60 mt-1">
            Accès rapide à tous les rapports, états financiers et déclarations
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
        </div>
      </div>

      {/* ============ ALERTE ERREUR PARTIELLE ============ */}
      {stats.erreur && (
        <div className="alert alert-warning mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{stats.erreur}</span>
          <button onClick={chargerDonnees} className="btn btn-sm btn-ghost">
            Réessayer
          </button>
        </div>
      )}

      {/* ============ KPI GLOBAUX ============ */}
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
              {formaterMontantCourt(stats.factures?.montant_total || 0)}
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
              {formaterMontantCourt(stats.factures?.montant_paye || 0)}
            </p>
            <p className="text-xs text-base-content/50 mt-1">
              {tauxEncaissement.toFixed(1)}% du CA
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-info" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Écritures</p>
            </div>
            <p className="text-2xl font-bold text-info">
              {stats.ecritures?.total || 0}
            </p>
            <p className="text-xs text-base-content/50 mt-1">
              {stats.ecritures?.brouillons || 0} à valider
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xs text-base-content/60 uppercase">Clôtures</p>
            </div>
            <p className="text-2xl font-bold text-warning">
              {stats.clotures?.validees || 0}
            </p>
            <p className="text-xs text-base-content/50 mt-1">
              sur {stats.clotures?.total || 0} au total
            </p>
          </div>
        </div>
      </div>

      {/* ============ BARRE DE PROGRESSION ENCAISSEMENT ============ */}
      {stats.factures?.montant_total > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Taux d'encaissement global</span>
              </div>
              <span className={`badge badge-lg gap-1 ${
                tauxEncaissement >= 80 ? 'badge-success' :
                tauxEncaissement >= 50 ? 'badge-warning' : 'badge-error'
              }`}>
                {tauxEncaissement.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-base-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  tauxEncaissement >= 80 ? 'bg-gradient-to-r from-success/60 to-success' :
                  tauxEncaissement >= 50 ? 'bg-gradient-to-r from-warning/60 to-warning' :
                  'bg-gradient-to-r from-error/60 to-error'
                }`}
                style={{ width: `${Math.min(tauxEncaissement, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-base-content/50 mt-2">
              <span>Encaissé : {formaterMontant(stats.factures?.montant_paye || 0)}</span>
              <span>Reste : {formaterMontant(stats.factures?.montant_impaye || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ============ GRILLE DE RAPPORTS ============ */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-base-content/60 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Tous les rapports disponibles
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {RAPPORTS_CONFIG.map((r) => {
          const Icon = r.icone;
          return (
            <Link
              key={r.id}
              to={r.route}
              className={`card bg-base-100 shadow-sm border border-base-300 hover:shadow-lg hover:border-${r.couleur}/50 hover:-translate-y-1 transition-all duration-200 group`}
            >
              <div className="card-body p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-${r.couleur}/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-6 h-6 text-${r.couleur}`} />
                  </div>
                  <span className={`badge badge-${r.badgeColor} badge-sm`}>
                    {r.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                  {r.titre}
                </h3>
                <p className="text-xs text-base-content/60 flex-1 leading-relaxed">
                  {r.description}
                </p>
                <div className="flex items-center justify-end mt-3 text-xs text-primary font-medium">
                  Consulter
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ============ WORKFLOW RECOMMANDÉ ============ */}
      <div className="card bg-gradient-to-br from-info/5 to-info/10 border border-info/20 shadow-sm mb-6">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-info" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base mb-2">Workflow comptable recommandé</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg border border-base-300">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Balance</p>
                    <p className="text-[10px] text-base-content/60">Vérifier l'équilibre</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg border border-base-300">
                  <span className="w-6 h-6 rounded-full bg-info text-info-content flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Résultat</p>
                    <p className="text-[10px] text-base-content/60">Analyser bénéfice</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg border border-base-300">
                  <span className="w-6 h-6 rounded-full bg-warning text-warning-content flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Bilan</p>
                    <p className="text-[10px] text-base-content/60">Vérifier actif/passif</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg border border-base-300">
                  <span className="w-6 h-6 rounded-full bg-success text-success-content flex items-center justify-center text-xs font-bold flex-shrink-0">
                    4
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Clôture</p>
                    <p className="text-[10px] text-base-content/60">Verrouiller période</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ ACTIONS RAPIDES ============ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-0">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Actions rapides</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/ecritures-comptables"
                className="btn btn-outline btn-sm gap-2 justify-start"
              >
                <FileText className="w-4 h-4" /> Nouvelle écriture
              </Link>
              <Link
                to="/factures"
                className="btn btn-outline btn-sm gap-2 justify-start"
              >
                <Receipt className="w-4 h-4" /> Voir les factures
              </Link>
              <Link
                to="/cloture"
                className="btn btn-outline btn-sm gap-2 justify-start"
              >
                <Lock className="w-4 h-4" /> Clôturer période
              </Link>
              <Link
                to="/plan-comptable"
                className="btn btn-outline btn-sm gap-2 justify-start"
              >
                <Scale className="w-4 h-4" /> Plan comptable
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============ INFO PIED DE PAGE ============ */}
      <div className="alert alert-info">
        <Info className="w-5 h-5" />
        <div>
          <p className="font-bold">À propos des rapports</p>
          <p className="text-sm">
            Tous les rapports sont <strong>calculés en temps réel</strong> à partir des écritures
            comptables validées. Les données non validées (brouillon) ne sont pas comptabilisées.
          </p>
        </div>
      </div>

    </div>
  );
};

export default RapportsComptables;