// components/comptabilite/PaiementsClients.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, DollarSign, FileText, User,
  Calendar, Wallet, Hash, Banknote, Smartphone, Percent
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MODES_CONFIG = {
  especes:      { label: 'Espèces',      icon: Banknote,     color: 'success' },
  virement:     { label: 'Virement',     icon: Wallet,       color: 'info' },
  cheque:       { label: 'Chèque',       icon: FileText,     color: 'warning' },
  mobile_money: { label: 'Mobile Money', icon: Smartphone,   color: 'primary' },
  prelevement:  { label: 'Prélèvement',  icon: CreditCard,   color: 'secondary' },
};

const STATUTS_CONFIG = {
  en_attente: { label: 'En attente', cls: 'badge-warning',  icon: Clock },
  valide:     { label: 'Validé',     cls: 'badge-success',  icon: CheckCircle },
  rejete:     { label: 'Rejeté',     cls: 'badge-error',    icon: XCircle },
  annule:     { label: 'Annulé',     cls: 'badge-ghost',    icon: XCircle },
};

const PaiementsClients = () => {
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState([]);
  const [paiementsFiltres, setPaiementsFiltres] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreMode, setFiltreMode] = useState('all');
  const [filtreClient, setFiltreClient] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [paiementSelectionne, setPaiementSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [paiementsRes, clientsRes] = await Promise.all([
        AxiosInstance.get('/paiements-clients/').catch(() => ({ data: [] })),
        AxiosInstance.get('/clients/').catch(() => ({ data: [] })),
      ]);
      setPaiements(paiementsRes.data.results || paiementsRes.data || []);
      setClients(clientsRes.data.results || clientsRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
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
        p.client_nom?.toLowerCase().includes(terme) ||
        p.facture_numero?.toLowerCase().includes(terme) ||
        p.reference?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(p => p.statut === filtreStatut);
    if (filtreMode !== 'all') filtre = filtre.filter(p => p.mode === filtreMode);
    if (filtreClient !== 'all') filtre = filtre.filter(p => String(p.client) === String(filtreClient));
    setPaiementsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreMode, filtreClient, paiements]);

  const totalPages = Math.ceil(paiementsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return paiementsFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerPaiement = async () => {
    if (!paiementSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/paiements-clients/${paiementSelectionne.id}/`);
      setPaiements(paiements.filter(p => p.id !== paiementSelectionne.id));
      setShowModalSuppression(false);
      setPaiementSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const getBadgeStatut = (statut) => {
    const cfg = STATUTS_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeMode = (mode) => {
    const cfg = MODES_CONFIG[mode] || { label: mode, icon: CreditCard, color: 'ghost' };
    const Icon = cfg.icon;
    return (
      <span className={`badge badge-${cfg.color} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const stats = useMemo(() => ({
    total: paiements.length,
    valides: paiements.filter(p => p.statut === 'valide').length,
    enAttente: paiements.filter(p => p.statut === 'en_attente').length,
    montantTotal: paiements
      .filter(p => p.statut === 'valide')
      .reduce((sum, p) => sum + Number(p.montant || 0), 0),
  }), [paiements]);

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreMode !== 'all' || filtreClient !== 'all';

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
            <CreditCard className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Paiements clients</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            Paiements clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {paiementsFiltres.length} paiement{paiementsFiltres.length > 1 ? 's' : ''} trouvé{paiementsFiltres.length > 1 ? 's' : ''}
            {filtresActifs && paiements.length !== paiementsFiltres.length && (
              <span className="text-base-content/40"> (sur {paiements.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/paiements-clients/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau paiement
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Validés</p>
              <p className="text-xl font-bold text-success">{stats.valides}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">En attente</p>
              <p className="text-xl font-bold text-warning">{stats.enAttente}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Montant total</p>
              <p className="text-sm font-bold text-success truncate font-mono">
                {new Intl.NumberFormat('fr-FR').format(stats.montantTotal)}
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
                  placeholder="Rechercher par numéro, client, facture..."
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

            <select
              className="select select-bordered select-sm"
              value={filtreMode}
              onChange={(e) => setFiltreMode(e.target.value)}
            >
              <option value="all">Tous les modes</option>
              {Object.entries(MODES_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm max-w-[220px]"
              value={filtreClient}
              onChange={(e) => setFiltreClient(e.target.value)}
            >
              <option value="all">Tous les clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom_complet || c.nom}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreStatut('all');
                  setFiltreMode('all');
                  setFiltreClient('all');
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
            {filtresActifs ? 'Aucun paiement ne correspond aux filtres' : 'Aucun paiement trouvé'}
          </p>
          <Link to="/paiements-clients/ajouter" className="btn btn-primary mt-4">
            Créer un paiement
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Client</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Facture</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Mode</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((p) => (
                  <tr key={p.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">{p.numero}</span>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[180px]">{p.client_nom || '—'}</p>
                    </td>
                    <td>
                      {p.facture_numero ? (
                        <Link
                          to={`/factures/${p.facture}`}
                          className="font-mono text-xs text-info hover:underline"
                        >
                          {p.facture_numero}
                        </Link>
                      ) : (
                        <span className="text-base-content/30 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <p className="text-xs">{formaterDate(p.date_paiement)}</p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold text-success">
                        {formaterMontant(p.montant)}
                      </span>
                    </td>
                    <td>{getBadgeMode(p.mode)}</td>
                    <td>{getBadgeStatut(p.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/paiements-clients/${p.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {p.statut === 'en_attente' && (
                          <Link
                            to={`/paiements-clients/${p.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setPaiementSelectionne(p);
                            setShowModalSuppression(true);
                          }}
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <p className="text-sm text-base-content/60">
                {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, paiementsFiltres.length)} sur{' '}
                {paiementsFiltres.length} paiement{paiementsFiltres.length > 1 ? 's' : ''}
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

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && paiementSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le paiement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le paiement <strong className="font-mono">{paiementSelectionne.numero}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerPaiement} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaiementsClients;