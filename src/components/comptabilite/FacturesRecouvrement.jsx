// components/comptabilite/FacturesRecouvrement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, Search, Eye, Loader2, AlertCircle, RefreshCw, Filter,
  ChevronLeft, ChevronRight, Building2, Calendar, DollarSign,
  User, TrendingUp, HandCoins, Send, Clock, AlertTriangle,
  CheckCircle, Wallet, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon:            { label: 'Brouillon',           cls: 'badge-ghost',    icon: FileText },
  emise:                { label: 'Émise',               cls: 'badge-info',     icon: CheckCircle },
  envoyee:              { label: 'Envoyée',             cls: 'badge-primary',  icon: Send },
  partiellement_payee:  { label: 'Partiellement payée', cls: 'badge-warning',  icon: Clock },
  en_retard:            { label: 'En retard',           cls: 'badge-error',    icon: AlertTriangle },
  litige:               { label: 'En litige',           cls: 'badge-error',    icon: AlertTriangle },
  payee:                { label: 'Payée',               cls: 'badge-success',  icon: CheckCircle },
  annulee:              { label: 'Annulée',             cls: 'badge-ghost',    icon: FileText },
};

const FacturesRecouvrement = () => {
  const [factures, setFactures] = useState([]);
  const [facturesFiltrees, setFacturesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);

  useEffect(() => {
    chargerFactures();
  }, []);

  const chargerFactures = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/factures/impayees/');
      const data = res.data.results || res.data || [];
      setFactures(data);
      setFacturesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les factures impayées');
    } finally {
      setChargement(false);
    }
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
    if (filtreStatut !== 'all') filtre = filtre.filter(f => f.statut === filtreStatut);
    setFacturesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, factures]);

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

  const getBadgeStatut = (statut) => {
    const cfg = STATUTS_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const stats = useMemo(() => ({
    total: factures.length,
    montantTotal: factures.reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0),
    montantPaye: factures.reduce((sum, f) => sum + Number(f.montant_paye || 0), 0),
    soldeDu: factures.reduce((sum, f) => sum + Number(f.solde_restant || 0), 0),
    enRetard: factures.filter(f => f.est_en_retard).length,
  }), [factures]);

  const filtresActifs = recherche || filtreStatut !== 'all';

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
        <button onClick={chargerFactures} className="btn btn-primary mt-4">Réessayer</button>
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
            <span className="text-primary">Factures clients</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            Factures clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {facturesFiltrees.length} facture{facturesFiltrees.length > 1 ? 's' : ''} impayée{facturesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && factures.length !== facturesFiltrees.length && (
              <span className="text-base-content/40"> (sur {factures.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerFactures} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/recouvrement" className="btn btn-primary gap-2">
            <HandCoins className="w-5 h-5" /> Recouvrement
          </Link>
        </div>
      </div>

      {/* ALERTE */}
      {stats.soldeDu > 0 && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-bold">Créances à recouvrer</p>
            <p className="text-sm">
              <strong>{factures.length}</strong> factures impayées • Solde total dû : <strong>{formaterMontant(stats.soldeDu)}</strong>
              {stats.enRetard > 0 && (
                <span className="text-error ml-2">
                  • <strong>{stats.enRetard}</strong> en retard
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-primary" />
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
              <p className="text-xs text-base-content/50 uppercase">Montant TTC</p>
              <p className="text-sm font-bold font-mono truncate">
                {formaterMontantCourt(stats.montantTotal)} GNF
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Déjà payé</p>
              <p className="text-sm font-bold text-success font-mono truncate">
                {formaterMontantCourt(stats.montantPaye)} GNF
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Solde dû</p>
              <p className="text-sm font-bold text-error font-mono truncate">
                {formaterMontantCourt(stats.soldeDu)} GNF
              </p>
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
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUTS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreStatut('all');
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
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs
              ? 'Aucune facture ne correspond aux filtres'
              : 'Aucune facture impayée — tout est à jour !'}
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
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant TTC</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Solde dû</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((f) => {
                  const enRetard = f.est_en_retard;
                  return (
                    <tr key={f.id} className={`hover:bg-base-200/50 border-b border-base-200 last:border-0 ${enRetard ? 'bg-error/5' : ''}`}>
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
                        <div className="text-xs">
                          <p>{formaterDate(f.date_echeance)}</p>
                          {enRetard && (
                            <p className="text-error font-medium">
                              ⚠ En retard
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm">{formaterMontantCourt(f.montant_ttc)}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm font-bold text-error">
                          {formaterMontantCourt(f.solde_restant)}
                        </span>
                      </td>
                      <td>{getBadgeStatut(f.statut)}</td>
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
                            to={`/factures/${f.id}/modifier`}
                            className="btn btn-ghost btn-xs text-primary"
                            title="Modifier"
                          >
                            <FileText className="w-3.5 h-3.5" />
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
                {facturesFiltrees.length} facture{facturesFiltrees.length > 1 ? 's' : ''}
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

export default FacturesRecouvrement;