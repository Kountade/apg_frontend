// components/comptabilite/Avoirs.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileMinus, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, User, Calendar, DollarSign,
  FileText, Receipt, Info, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost',    icon: FileText },
  emis:      { label: 'Émis',      cls: 'badge-info',     icon: CheckCircle },
  utilise:   { label: 'Utilisé',   cls: 'badge-success',  icon: CheckCircle },
  annule:    { label: 'Annulé',    cls: 'badge-error',    icon: XCircle },
};

const Avoirs = () => {
  const navigate = useNavigate();
  const [avoirs, setAvoirs] = useState([]);
  const [avoirsFiltres, setAvoirsFiltres] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreClient, setFiltreClient] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [avoirSelectionne, setAvoirSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [avoirsRes, clientsRes] = await Promise.all([
        AxiosInstance.get('/avoirs/').catch(() => ({ data: [] })),
        AxiosInstance.get('/clients/').catch(() => ({ data: [] })),
      ]);
      setAvoirs(avoirsRes.data.results || avoirsRes.data || []);
      setClients(clientsRes.data.results || clientsRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les avoirs');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = avoirs;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.numero?.toLowerCase().includes(terme) ||
        a.client_nom?.toLowerCase().includes(terme) ||
        a.objet?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(a => a.statut === filtreStatut);
    if (filtreClient !== 'all') filtre = filtre.filter(a => String(a.client) === String(filtreClient));
    setAvoirsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreClient, avoirs]);

  const totalPages = Math.ceil(avoirsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return avoirsFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerAvoir = async () => {
    if (!avoirSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/avoirs/${avoirSelectionne.id}/`);
      setAvoirs(avoirs.filter(a => a.id !== avoirSelectionne.id));
      setShowModalSuppression(false);
      setAvoirSelectionne(null);
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
    total: avoirs.length,
    brouillon: avoirs.filter(a => a.statut === 'brouillon').length,
    emis: avoirs.filter(a => a.statut === 'emis').length,
    utilise: avoirs.filter(a => a.statut === 'utilise').length,
    montantTotal: avoirs
      .filter(a => a.statut === 'emis' || a.statut === 'utilise')
      .reduce((sum, a) => sum + Number(a.montant_ttc || 0), 0),
  }), [avoirs]);

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreClient !== 'all';

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
            <Receipt className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Avoirs</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileMinus className="w-8 h-8 text-primary" />
            Avoirs clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {avoirsFiltres.length} avoir{avoirsFiltres.length > 1 ? 's' : ''} trouvé{avoirsFiltres.length > 1 ? 's' : ''}
            {filtresActifs && avoirs.length !== avoirsFiltres.length && (
              <span className="text-base-content/40"> (sur {avoirs.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/avoirs/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvel avoir
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileMinus className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ghost/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-base-content/60" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Brouillon</p>
              <p className="text-xl font-bold">{stats.brouillon}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Émis</p>
              <p className="text-xl font-bold text-info">{stats.emis}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Montant</p>
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
      {avoirsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <FileMinus className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun avoir ne correspond aux filtres' : 'Aucun avoir trouvé'}
          </p>
          <Link to="/avoirs/ajouter" className="btn btn-primary mt-4">
            Créer un avoir
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
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Objet</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Facture origine</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant TTC</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((a) => (
                  <tr key={a.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">{a.numero}</span>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[180px]">{a.client_nom || '—'}</p>
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[200px]">{a.objet}</p>
                    </td>
                    <td>
                      {a.facture_numero ? (
                        <Link
                          to={`/factures/${a.facture_origine}`}
                          className="font-mono text-xs text-info hover:underline"
                        >
                          {a.facture_numero}
                        </Link>
                      ) : (
                        <span className="text-base-content/30 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <p className="text-xs">{formaterDate(a.date_avoir)}</p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold text-warning">
                        {formaterMontant(a.montant_ttc)}
                      </span>
                    </td>
                    <td>{getBadgeStatut(a.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/avoirs/${a.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {['brouillon'].includes(a.statut) && (
                          <Link
                            to={`/avoirs/${a.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setAvoirSelectionne(a);
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
                {Math.min(pageActuelle * elementsParPage, avoirsFiltres.length)} sur{' '}
                {avoirsFiltres.length} avoir{avoirsFiltres.length > 1 ? 's' : ''}
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
      {showModalSuppression && avoirSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'avoir</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'avoir <strong className="font-mono">{avoirSelectionne.numero}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerAvoir} disabled={chargementAction}>
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

export default Avoirs;