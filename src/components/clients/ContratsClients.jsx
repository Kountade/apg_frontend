// components/clients/ContratsClients.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Calendar, DollarSign, FilePlus, FileCheck,
  CalendarClock, TrendingUp, CheckCircle, XCircle, Pause,
  Play, Ban, Users
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ContratsClients = () => {
  const navigate = useNavigate();
  const [contrats, setContrats] = useState([]);
  const [contratsFiltres, setContratsFiltres] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreFrequence, setFiltreFrequence] = useState('all');
  const [filtreClient, setFiltreClient] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [contratSelectionne, setContratSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalAction, setShowModalAction] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [contratsRes, clientsRes] = await Promise.all([
        AxiosInstance.get('/contrats-clients/').catch(() => ({ data: [] })),
        AxiosInstance.get('/clients/').catch(() => ({ data: [] })),
      ]);
      const contratsData = contratsRes.data.results || contratsRes.data || [];
      const clientsData = clientsRes.data.results || clientsRes.data || [];
      setContrats(contratsData);
      setContratsFiltres(contratsData);
      setClients(clientsData);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les contrats');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = contrats;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.numero?.toLowerCase().includes(terme) ||
        c.client_nom?.toLowerCase().includes(terme) ||
        c.prestation?.toLowerCase().includes(terme) ||
        c.zone?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(c => c.statut === filtreStatut);
    if (filtreFrequence !== 'all') filtre = filtre.filter(c => c.frequence === filtreFrequence);
    if (filtreClient !== 'all') filtre = filtre.filter(c => String(c.client) === String(filtreClient));

    setContratsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreFrequence, filtreClient, contrats]);

  const totalPages = Math.ceil(contratsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return contratsFiltres.slice(debut, debut + elementsParPage);
  };

  const executerAction = async () => {
    if (!contratSelectionne || !actionType) return;
    setChargementAction(true);
    try {
      if (actionType === 'supprimer') {
        await AxiosInstance.delete(`/contrats-clients/${contratSelectionne.id}/`);
        setContrats(contrats.filter(c => c.id !== contratSelectionne.id));
      } else if (actionType === 'valider') {
        await AxiosInstance.post(`/contrats-clients/${contratSelectionne.id}/valider/`);
        chargerDonnees();
      } else if (actionType === 'suspendre') {
        await AxiosInstance.post(`/contrats-clients/${contratSelectionne.id}/suspendre/`);
        chargerDonnees();
      } else if (actionType === 'resilier') {
        await AxiosInstance.post(`/contrats-clients/${contratSelectionne.id}/resilier/`);
        chargerDonnees();
      }
      setShowModalAction(false);
      setShowModalSuppression(false);
      setContratSelectionne(null);
      setActionType(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '—';

  const getBadgeStatut = (statut) => {
    const configs = {
      brouillon: { label: 'Brouillon', cls: 'badge-ghost' },
      actif: { label: 'Actif', cls: 'badge-success' },
      suspendu: { label: 'Suspendu', cls: 'badge-warning' },
      expire: { label: 'Expiré', cls: 'badge-error' },
      resilie: { label: 'Résilié', cls: 'badge-error' },
      archive: { label: 'Archivé', cls: 'badge-neutral' },
    };
    const cfg = configs[statut] || { label: statut, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls} badge-sm`}>{cfg.label}</span>;
  };

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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  const stats = {
    total: contrats.length,
    actifs: contrats.filter(c => c.statut === 'actif').length,
    expirant: contrats.filter(c => c.jours_avant_expiration !== null
      && c.jours_avant_expiration >= 0
      && c.jours_avant_expiration <= 30).length,
    expirés: contrats.filter(c => c.statut === 'expire').length,
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Clients & Contrats
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Contrats clients</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Contrats clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {contratsFiltres.length} contrat{contratsFiltres.length > 1 ? 's' : ''} trouvé{contratsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/contrats-clients/expirant" className="btn btn-ghost btn-sm gap-2">
            <CalendarClock className="w-4 h-4" /> Expirants
          </Link>
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/contrats-clients/ajouter" className="btn btn-primary gap-2">
            <FilePlus className="w-5 h-5" /> Nouveau contrat
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
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
              <FileCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Expirant (30j)</p>
              <p className="text-xl font-bold text-warning">{stats.expirant}</p>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Expirés</p>
              <p className="text-xl font-bold text-error">{stats.expirés}</p>
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
                  placeholder="Rechercher par numéro, client, prestation..."
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
              <option value="brouillon">Brouillon</option>
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="expire">Expiré</option>
              <option value="resilie">Résilié</option>
              <option value="archive">Archivé</option>
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreFrequence}
              onChange={(e) => setFiltreFrequence(e.target.value)}
            >
              <option value="all">Toutes fréquences</option>
              <option value="quotidien">Quotidien</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="bimensuel">Bimensuel</option>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
              <option value="ponctuel">Ponctuel</option>
            </select>

            <select
              className="select select-bordered select-sm max-w-[200px]"
              value={filtreClient}
              onChange={(e) => setFiltreClient(e.target.value)}
            >
              <option value="all">Tous les clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom_complet || c.nom}
                </option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreStatut('all');
                setFiltreFrequence('all');
                setFiltreClient('all');
              }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {contratsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun contrat trouvé</p>
          <Link to="/contrats-clients/ajouter" className="btn btn-primary mt-4">
            Créer un contrat
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
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Prestation</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Tarif</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((c) => {
                  const expirant = c.jours_avant_expiration !== null
                    && c.jours_avant_expiration >= 0
                    && c.jours_avant_expiration <= 30;

                  return (
                    <tr key={c.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <Link
                          to={`/contrats-clients/${c.id}`}
                          className="font-mono text-sm font-medium text-primary hover:underline"
                        >
                          {c.numero}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium truncate max-w-[180px]">{c.client_nom || '—'}</p>
                      </td>
                      <td>
                        <p className="text-sm truncate max-w-[200px]">{c.prestation}</p>
                        <p className="text-xs text-base-content/40">{c.frequence}</p>
                      </td>
                      <td>
                        <div className="text-xs">
                          <p>{formaterDate(c.date_debut)}</p>
                          <p className="text-base-content/40">
                            → {c.date_fin ? formaterDate(c.date_fin) : 'En cours'}
                          </p>
                          {expirant && (
                            <p className="text-warning font-medium mt-0.5">
                              ⚠ Expire dans {c.jours_avant_expiration}j
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <p className="font-mono text-sm">{formaterMontant(c.tarif)}</p>
                      </td>
                      <td>{getBadgeStatut(c.statut)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/contrats-clients/${c.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/contrats-clients/${c.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          {c.statut === 'brouillon' && (
                            <button
                              onClick={() => {
                                setContratSelectionne(c);
                                setActionType('valider');
                                setShowModalAction(true);
                              }}
                              className="btn btn-ghost btn-xs text-success"
                              title="Valider"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {c.statut === 'actif' && (
                            <button
                              onClick={() => {
                                setContratSelectionne(c);
                                setActionType('suspendre');
                                setShowModalAction(true);
                              }}
                              className="btn btn-ghost btn-xs text-warning"
                              title="Suspendre"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setContratSelectionne(c);
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, contratsFiltres.length)} sur{' '}
                {contratsFiltres.length}
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let numPage = i + 1;
                  if (totalPages > 5 && pageActuelle > 3) {
                    numPage = pageActuelle - 2 + i;
                    if (numPage > totalPages) return null;
                  }
                  return (
                    <button
                      key={numPage}
                      className={`btn btn-sm ${pageActuelle === numPage ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setPageActuelle(numPage)}
                    >
                      {numPage}
                    </button>
                  );
                })}
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
      {showModalSuppression && contratSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le contrat</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le contrat{' '}
                <span className="font-bold font-mono">{contratSelectionne.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)}>Annuler</button>
                <button
                  className="btn btn-error flex-1"
                  onClick={() => {
                    setActionType('supprimer');
                    executerAction();
                  }}
                  disabled={chargementAction}
                >
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTION */}
      {showModalAction && contratSelectionne && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModalAction(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full ${
                actionType === 'valider' ? 'bg-success/20' : 'bg-warning/20'
              } flex items-center justify-center mx-auto mb-4`}>
                {actionType === 'valider' ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <Pause className="w-8 h-8 text-warning" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {actionType === 'valider' ? 'Valider le contrat' : 'Suspendre le contrat'}
              </h3>
              <p className="text-base-content/60 mb-4">
                Confirmer pour le contrat{' '}
                <span className="font-bold font-mono">{contratSelectionne.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalAction(false)}>Annuler</button>
                <button
                  className={`btn flex-1 ${
                    actionType === 'valider' ? 'btn-success' : 'btn-warning'
                  }`}
                  onClick={executerAction}
                  disabled={chargementAction}
                >
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratsClients;