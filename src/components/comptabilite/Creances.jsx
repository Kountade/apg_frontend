// components/comptabilite/Creances.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HandCoins, Search, Eye, Loader2, AlertCircle, RefreshCw,
  Filter, ChevronLeft, ChevronRight, User, TrendingUp,
  DollarSign, Clock, FileText, AlertTriangle, Send, Users
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Creances = () => {
  const [factures, setFactures] = useState([]);
  const [facturesFiltrees, setFacturesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);

  useEffect(() => {
    chargerCreances();
  }, []);

  const chargerCreances = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/factures/creances/');
      const data = res.data.results || res.data || [];
      setFactures(data);
      setFacturesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les créances');
    } finally {
      setChargement(false);
    }
  };

  const getNiveauRisque = (facture) => {
    if (!facture.date_echeance) return 'faible';
    const jours = Math.floor((new Date() - new Date(facture.date_echeance)) / (1000 * 60 * 60 * 24));
    if (jours > 90) return 'critique';
    if (jours > 60) return 'eleve';
    if (jours > 30) return 'moyen';
    if (jours > 0) return 'faible';
    return 'aucun';
  };

  useEffect(() => {
    let filtre = factures;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(f =>
        f.numero?.toLowerCase().includes(terme) ||
        f.client_nom?.toLowerCase().includes(terme) ||
        f.objet?.toLowerCase().includes(terme)
      );
    }
    if (filtreNiveau !== 'all') {
      if (filtreNiveau === 'aucun') {
        filtre = filtre.filter(f => getNiveauRisque(f) === 'aucun');
      } else {
        filtre = filtre.filter(f => getNiveauRisque(f) === filtreNiveau);
      }
    }
    setFacturesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreNiveau, factures]);

  const totalPages = Math.ceil(facturesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return facturesFiltrees.slice(debut, debut + elementsParPage);
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

  const getBadgeNiveau = (niveau) => {
    const configs = {
      aucun:    { label: 'À échoir',   cls: 'badge-info',    icon: FileText },
      faible:   { label: '≤ 30j',      cls: 'badge-warning', icon: Clock },
      moyen:    { label: '31-60j',     cls: 'badge-warning', icon: AlertTriangle },
      eleve:    { label: '61-90j',     cls: 'badge-error',   icon: AlertTriangle },
      critique: { label: '> 90j',      cls: 'badge-error',   icon: AlertCircle },
    };
    const cfg = configs[niveau] || configs.aucun;
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const stats = useMemo(() => {
    const total = factures.reduce((sum, f) => sum + Number(f.solde_restant || 0), 0);
    const nbClients = new Set(factures.map(f => f.client)).size;
    const critique = factures.filter(f => getNiveauRisque(f) === 'critique');
    const eleve = factures.filter(f => getNiveauRisque(f) === 'eleve');
    const montantCritique = critique.reduce((sum, f) => sum + Number(f.solde_restant || 0), 0);
    return {
      total: factures.length,
      montant: total,
      nbClients,
      critique: critique.length,
      eleve: eleve.length,
      montantCritique,
    };
  }, [factures]);

  const filtresActifs = recherche || filtreNiveau !== 'all';

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
        <button onClick={chargerCreances} className="btn btn-primary mt-4">Réessayer</button>
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
            <span className="text-primary">Créances clients</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HandCoins className="w-8 h-8 text-primary" />
            Créances clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {facturesFiltrees.length} créance{facturesFiltrees.length > 1 ? 's' : ''} • {stats.nbClients} client{stats.nbClients > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerCreances} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/recouvrement" className="btn btn-primary gap-2">
            <Send className="w-5 h-5" /> Recouvrement
          </Link>
        </div>
      </div>

      {/* ALERTE CRITIQUE */}
      {stats.critique > 0 && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-bold">Créances critiques (&gt; 90 jours)</p>
            <p className="text-sm">
              <strong>{stats.critique}</strong> factures • Montant : <strong>{formaterMontant(stats.montantCritique)}</strong>
            </p>
          </div>
          <button
            onClick={() => setFiltreNiveau('critique')}
            className="btn btn-sm btn-ghost"
          >
            Voir
          </button>
        </div>
      )}

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <HandCoins className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Factures</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Montant total</p>
              <p className="text-sm font-bold font-mono truncate">
                {formaterMontantCourt(stats.montant)} GNF
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Clients</p>
              <p className="text-xl font-bold text-info">{stats.nbClients}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-error/30">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Critiques</p>
              <p className="text-xl font-bold text-error">{stats.critique}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, client, objet..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreNiveau}
              onChange={(e) => setFiltreNiveau(e.target.value)}
            >
              <option value="all">Toutes les anciennetés</option>
              <option value="aucun">À échoir</option>
              <option value="faible">≤ 30 jours</option>
              <option value="moyen">31 - 60 jours</option>
              <option value="eleve">61 - 90 jours</option>
              <option value="critique">&gt; 90 jours</option>
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreNiveau('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {facturesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <HandCoins className="w-16 h-16 text-success mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs
              ? 'Aucune créance ne correspond aux filtres'
              : 'Aucune créance — tout est réglé !'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Client</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Objet</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Échéance</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Ancienneté</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant TTC</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Solde dû</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((f) => {
                  const niveau = getNiveauRisque(f);
                  return (
                    <tr key={f.id} className={`hover:bg-base-200/50 border-b border-base-200 last:border-0 ${
                      niveau === 'critique' ? 'bg-error/10' : niveau === 'eleve' ? 'bg-error/5' : ''
                    }`}>
                      <td>
                        <Link
                          to={`/factures/${f.id}`}
                          className="font-mono text-sm font-bold text-primary hover:underline"
                        >
                          {f.numero}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium text-sm truncate max-w-[180px]">{f.client_nom || '—'}</p>
                      </td>
                      <td>
                        <p className="text-sm truncate max-w-[200px]">{f.objet}</p>
                      </td>
                      <td>
                        <p className="text-xs">{formaterDate(f.date_echeance)}</p>
                      </td>
                      <td className="text-center">{getBadgeNiveau(niveau)}</td>
                      <td className="text-right">
                        <span className="font-mono text-xs">{formaterMontantCourt(f.montant_ttc)}</span>
                      </td>
                      <td className="text-right">
                        <span className={`font-mono text-sm font-bold ${
                          niveau === 'critique' ? 'text-error' : 'text-warning'
                        }`}>
                          {formaterMontantCourt(f.solde_restant)}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/factures/${f.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/relances/ajouter?facture=${f.id}`}
                            className="btn btn-ghost btn-xs text-warning"
                            title="Relancer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Link>
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
                {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, facturesFiltrees.length)} sur{' '}
                {facturesFiltrees.length} créance{facturesFiltrees.length > 1 ? 's' : ''}
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
      )}
    </div>
  );
};

export default Creances;