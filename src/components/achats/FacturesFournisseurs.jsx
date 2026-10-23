// src/components/achats/FacturesFournisseurs.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, Search, Plus, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, XCircle, Clock,
  AlertTriangle, DollarSign, TrendingDown
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  recue:                 { label: 'Reçue',           color: 'info',    icon: Receipt },
  controlee:             { label: 'Contrôlée',       color: 'primary', icon: CheckCircle },
  validee:               { label: 'Validée',         color: 'success', icon: CheckCircle },
  partiellement_payee:   { label: 'Part. payée',     color: 'warning', icon: Clock },
  payee:                 { label: 'Payée',           color: 'success', icon: CheckCircle },
  litige:                { label: 'En litige',       color: 'error',   icon: AlertTriangle },
  annulee:               { label: 'Annulée',         color: 'ghost',   icon: XCircle },
};

const FacturesFournisseurs = () => {
  const [factures, setFactures] = useState([]);
  const [facturesFiltrees, setFacturesFiltrees] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreFournisseur, setFiltreFournisseur] = useState('all');
  const [filtreEcheance, setFiltreEcheance] = useState('all'); // all | en_retard | impayees

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [facRes, fourRes] = await Promise.all([
        AxiosInstance.get('/factures-fournisseurs/?page_size=200'),
        AxiosInstance.get('/fournisseurs/?page_size=500').catch(() => ({ data: [] })),
      ]);
      const data = facRes.data.results || facRes.data || [];
      setFactures(data);
      setFacturesFiltrees(data);
      setFournisseurs(fourRes.data.results || fourRes.data || []);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les factures');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = factures;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(f =>
        f.numero_interne?.toLowerCase().includes(terme) ||
        f.numero_facture_fournisseur?.toLowerCase().includes(terme) ||
        f.objet?.toLowerCase().includes(terme) ||
        f.fournisseur_nom?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(f => f.statut === filtreStatut);
    if (filtreFournisseur !== 'all') filtre = filtre.filter(f => String(f.fournisseur) === String(filtreFournisseur));
    if (filtreEcheance === 'en_retard') filtre = filtre.filter(f => f.est_en_retard);
    if (filtreEcheance === 'impayees') filtre = filtre.filter(f => Number(f.solde_du) > 0);
    setFacturesFiltrees(filtre);
  }, [recherche, filtreStatut, filtreFournisseur, filtreEcheance, factures]);

  const stats = useMemo(() => {
    const total = factures.length;
    const impayees = factures.filter(f => Number(f.solde_du) > 0).length;
    const enRetard = factures.filter(f => f.est_en_retard).length;
    const totalTTC = factures.reduce((s, f) => s + Number(f.montant_ttc || 0), 0);
    const totalPaye = factures.reduce((s, f) => s + Number(f.montant_paye || 0), 0);
    const soldeDu = totalTTC - totalPaye;
    return { total, impayees, enRetard, totalTTC, totalPaye, soldeDu };
  }, [factures]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';
  };

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreFournisseur !== 'all' || filtreEcheance !== 'all';

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
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <Receipt className="w-3 h-3" /> Achats / Factures
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            Factures fournisseurs
          </h1>
          <p className="text-base-content/60 mt-1">
            {facturesFiltrees.length} facture{facturesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && factures.length !== facturesFiltrees.length && (
              <span className="text-base-content/40"> (sur {factures.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/factures-fournisseurs/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle facture
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Impayées</p>
              <p className="text-xl font-bold text-warning">{stats.impayees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En retard</p>
              <p className="text-xl font-bold text-error">{stats.enRetard}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Solde dû</p>
              <p className="text-sm font-bold font-mono truncate text-error">
                {formaterMontant(stats.soldeDu)}
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
                  placeholder="Rechercher par numéro, objet, fournisseur..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreFournisseur}
              onChange={(e) => setFiltreFournisseur(e.target.value)}
            >
              <option value="all">Tous fournisseurs</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreEcheance}
              onChange={(e) => setFiltreEcheance(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="impayees">Impayées uniquement</option>
              <option value="en_retard">En retard</option>
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              {Object.entries(STATUTS_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreStatut('all');
                  setFiltreFournisseur('all');
                  setFiltreEcheance('all');
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
          <Receipt className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune facture ne correspond' : 'Aucune facture'}
          </p>
          <Link to="/factures-fournisseurs/ajouter" className="btn btn-primary mt-4">
            Créer une facture
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">N° interne</th>
                <th className="text-xs uppercase">N° fournisseur</th>
                <th className="text-xs uppercase">Fournisseur</th>
                <th className="text-xs uppercase">Date</th>
                <th className="text-xs uppercase">Échéance</th>
                <th className="text-xs uppercase text-right">TTC</th>
                <th className="text-xs uppercase text-right">Solde dû</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {facturesFiltrees.map(f => {
                const cfg = STATUTS_CONFIG[f.statut] || STATUTS_CONFIG.recue;
                const Icon = cfg.icon;
                const solde = Number(f.solde_du || 0);
                return (
                  <tr
                    key={f.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {f.numero_interne}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs">
                        {f.numero_facture_fournisseur || '—'}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[180px]">
                        {f.fournisseur_nom}
                      </p>
                    </td>
                    <td>
                      <span className="text-xs font-mono">{formaterDate(f.date_facture)}</span>
                    </td>
                    <td>
                      <span className={`text-xs font-mono ${f.est_en_retard ? 'text-error font-bold' : ''}`}>
                        {formaterDate(f.date_echeance)}
                      </span>
                      {f.est_en_retard && (
                        <span className="badge badge-error badge-xs ml-1">Retard</span>
                      )}
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs font-bold">
                        {formaterMontant(f.montant_ttc)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`font-mono text-xs font-bold ${solde > 0 ? 'text-error' : 'text-success'}`}>
                        {solde > 0 ? formaterMontant(solde) : 'Payée'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${cfg.color} badge-sm gap-1`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/factures-fournisseurs/${f.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FacturesFournisseurs;