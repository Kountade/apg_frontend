// src/components/achats/PaiementsFournisseurs.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, Search, Plus, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, CheckCircle, XCircle, Clock,
  Banknote, Smartphone, Landmark, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MODES_CONFIG = {
  especes:      { label: 'Espèces',       icon: Banknote,   color: 'success' },
  virement:     { label: 'Virement',      icon: Landmark,   color: 'info' },
  cheque:       { label: 'Chèque',        icon: FileText,   color: 'primary' },
  mobile_money: { label: 'Mobile Money',  icon: Smartphone, color: 'warning' },
  prelevement:  { label: 'Prélèvement',   icon: CreditCard, color: 'secondary' },
};

const STATUTS_CONFIG = {
  en_attente: { label: 'En attente',  color: 'info',    icon: Clock },
  valide:     { label: 'Validé',      color: 'success', icon: CheckCircle },
  rejete:     { label: 'Rejeté',      color: 'error',   icon: XCircle },
  annule:     { label: 'Annulé',      color: 'ghost',   icon: XCircle },
};

const PaiementsFournisseurs = () => {
  const [paiements, setPaiements] = useState([]);
  const [paiementsFiltres, setPaiementsFiltres] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreMode, setFiltreMode] = useState('all');
  const [filtreFournisseur, setFiltreFournisseur] = useState('all');

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [paiRes, fourRes] = await Promise.all([
        AxiosInstance.get('/paiements-fournisseurs/?page_size=200'),
        AxiosInstance.get('/fournisseurs/?page_size=500').catch(() => ({ data: [] })),
      ]);
      const data = paiRes.data.results || paiRes.data || [];
      setPaiements(data);
      setPaiementsFiltres(data);
      setFournisseurs(fourRes.data.results || fourRes.data || []);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les paiements');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = paiements;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(p =>
        p.numero?.toLowerCase().includes(terme) ||
        p.reference?.toLowerCase().includes(terme) ||
        p.fournisseur_nom?.toLowerCase().includes(terme) ||
        p.facture_numero?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(p => p.statut === filtreStatut);
    if (filtreMode !== 'all') filtre = filtre.filter(p => p.mode === filtreMode);
    if (filtreFournisseur !== 'all') filtre = filtre.filter(p => String(p.fournisseur) === String(filtreFournisseur));
    setPaiementsFiltres(filtre);
  }, [recherche, filtreStatut, filtreMode, filtreFournisseur, paiements]);

  const stats = useMemo(() => {
    const total = paiements.length;
    const totalMontant = paiements
      .filter(p => p.statut === 'valide')
      .reduce((s, p) => s + Number(p.montant || 0), 0);
    const enAttente = paiements.filter(p => p.statut === 'en_attente').length;
    return { total, totalMontant, enAttente };
  }, [paiements]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';
  };

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreMode !== 'all' || filtreFournisseur !== 'all';

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
            <CreditCard className="w-3 h-3" /> Achats / Paiements
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            Paiements fournisseurs
          </h1>
          <p className="text-base-content/60 mt-1">
            {paiementsFiltres.length} paiement{paiementsFiltres.length > 1 ? 's' : ''}
            {filtresActifs && paiements.length !== paiementsFiltres.length && (
              <span className="text-base-content/40"> (sur {paiements.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/paiements-fournisseurs/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau paiement
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total validé</p>
              <p className="text-sm font-bold font-mono truncate text-success">
                {formaterMontant(stats.totalMontant)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">En attente</p>
              <p className="text-xl font-bold text-info">{stats.enAttente}</p>
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
                  placeholder="Rechercher par numéro, fournisseur, facture..."
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
              value={filtreMode}
              onChange={(e) => setFiltreMode(e.target.value)}
            >
              <option value="all">Tous modes</option>
              {Object.entries(MODES_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
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
                  setFiltreMode('all');
                  setFiltreFournisseur('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {paiementsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CreditCard className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun paiement ne correspond' : 'Aucun paiement'}
          </p>
          <Link to="/paiements-fournisseurs/ajouter" className="btn btn-primary mt-4">
            Créer un paiement
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Numéro</th>
                <th className="text-xs uppercase">Facture</th>
                <th className="text-xs uppercase">Fournisseur</th>
                <th className="text-xs uppercase">Date</th>
                <th className="text-xs uppercase">Mode</th>
                <th className="text-xs uppercase">Référence</th>
                <th className="text-xs uppercase text-right">Montant</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paiementsFiltres.map(p => {
                const modeCfg = MODES_CONFIG[p.mode] || MODES_CONFIG.virement;
                const statutCfg = STATUTS_CONFIG[p.statut] || STATUTS_CONFIG.valide;
                const ModeIcon = modeCfg.icon;
                const StatutIcon = statutCfg.icon;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {p.numero}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs">
                        {p.facture_numero || '—'}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[180px]">
                        {p.fournisseur_nom}
                      </p>
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {formaterDate(p.date_paiement)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${modeCfg.color} badge-sm gap-1`}>
                        <ModeIcon className="w-3 h-3" /> {modeCfg.label}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono truncate max-w-[150px] block">
                        {p.reference || '—'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold text-success">
                        {formaterMontant(p.montant)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${statutCfg.color} badge-sm gap-1`}>
                        <StatutIcon className="w-3 h-3" /> {statutCfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/paiements-fournisseurs/${p.id}`}
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

export default PaiementsFournisseurs;