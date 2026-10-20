// components/comptabilite/Litiges.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, User, Calendar, FileText,
  Gavel, Info, Scale, DollarSign, ShieldCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  ouvert:    { label: 'Ouvert',    cls: 'badge-warning',  icon: AlertTriangle },
  en_cours:  { label: 'En cours',  cls: 'badge-info',     icon: Clock },
  resolu:    { label: 'Résolu',    cls: 'badge-success',  icon: CheckCircle },
  clos:      { label: 'Clos',      cls: 'badge-ghost',    icon: XCircle },
};

const Litiges = () => {
  const navigate = useNavigate();
  const [litiges, setLitiges] = useState([]);
  const [litigesFiltres, setLitigesFiltres] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreClient, setFiltreClient] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [litigeSelectionne, setLitigeSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalResolution, setShowModalResolution] = useState(false);
  const [resolution, setResolution] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [litigesRes, clientsRes] = await Promise.all([
        AxiosInstance.get('/litiges/').catch(() => ({ data: [] })),
        AxiosInstance.get('/clients/').catch(() => ({ data: [] })),
      ]);
      setLitiges(litigesRes.data.results || litigesRes.data || []);
      setClients(clientsRes.data.results || clientsRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les litiges');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = litiges;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(l =>
        l.numero?.toLowerCase().includes(terme) ||
        l.client_nom?.toLowerCase().includes(terme) ||
        l.facture_numero?.toLowerCase().includes(terme) ||
        l.motif?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(l => l.statut === filtreStatut);
    if (filtreClient !== 'all') filtre = filtre.filter(l => String(l.client) === String(filtreClient));
    setLitigesFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreClient, litiges]);

  const totalPages = Math.ceil(litigesFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return litigesFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerLitige = async () => {
    if (!litigeSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/litiges/${litigeSelectionne.id}/`);
      setLitiges(litiges.filter(l => l.id !== litigeSelectionne.id));
      setShowModalSuppression(false);
      setLitigeSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const resoudreLitige = async () => {
    if (!litigeSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/litiges/${litigeSelectionne.id}/resoudre/`, {
        resolution: resolution
      });
      await chargerDonnees();
      setShowModalResolution(false);
      setLitigeSelectionne(null);
      setResolution('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la résolution');
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
    const cfg = STATUTS_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: AlertTriangle };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const stats = useMemo(() => ({
    total: litiges.length,
    ouverts: litiges.filter(l => l.statut === 'ouvert').length,
    enCours: litiges.filter(l => l.statut === 'en_cours').length,
    resolus: litiges.filter(l => l.statut === 'resolu').length,
    montantConteste: litiges
      .filter(l => l.statut !== 'resolu' && l.statut !== 'clos')
      .reduce((sum, l) => sum + Number(l.montant_conteste || 0), 0),
  }), [litiges]);

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
            <Scale className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Litiges</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gavel className="w-8 h-8 text-primary" />
            Litiges clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {litigesFiltres.length} litige{litigesFiltres.length > 1 ? 's' : ''} trouvé{litigesFiltres.length > 1 ? 's' : ''}
            {filtresActifs && litiges.length !== litigesFiltres.length && (
              <span className="text-base-content/40"> (sur {litiges.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/litiges/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau litige
          </Link>
        </div>
      </div>

      {/* ALERTE GLOBALE */}
      {stats.ouverts > 0 && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-bold">
              {stats.ouverts} litige{stats.ouverts > 1 ? 's' : ''} ouvert{stats.ouverts > 1 ? 's' : ''}
            </p>
            <p className="text-sm">
              Montant contesté total : <strong>{formaterMontant(stats.montantConteste)}</strong>
            </p>
          </div>
          <button
            onClick={() => setFiltreStatut('ouvert')}
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
              <Gavel className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Ouverts</p>
              <p className="text-xl font-bold text-warning">{stats.ouverts}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">En cours</p>
              <p className="text-xl font-bold text-info">{stats.enCours}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Résolus</p>
              <p className="text-xl font-bold text-success">{stats.resolus}</p>
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
                  placeholder="Rechercher par numéro, client, motif..."
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
      {litigesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Gavel className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun litige ne correspond aux filtres' : 'Aucun litige trouvé'}
          </p>
          <Link to="/litiges/ajouter" className="btn btn-primary mt-4">
            Créer un litige
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
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Motif</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((l) => (
                  <tr key={l.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">{l.numero}</span>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[180px]">{l.client_nom || '—'}</p>
                    </td>
                    <td>
                      {l.facture_numero ? (
                        <Link
                          to={`/factures/${l.facture}`}
                          className="font-mono text-xs text-info hover:underline"
                        >
                          {l.facture_numero}
                        </Link>
                      ) : (
                        <span className="text-base-content/30 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[220px]">{l.motif}</p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold text-error">
                        {formaterMontant(l.montant_conteste)}
                      </span>
                    </td>
                    <td>{getBadgeStatut(l.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/litiges/${l.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {['ouvert', 'en_cours'].includes(l.statut) && (
                          <button
                            onClick={() => {
                              setLitigeSelectionne(l);
                              setResolution('');
                              setShowModalResolution(true);
                            }}
                            className="btn btn-ghost btn-xs text-success"
                            title="Résoudre"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setLitigeSelectionne(l);
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
                {Math.min(pageActuelle * elementsParPage, litigesFiltres.length)} sur{' '}
                {litigesFiltres.length} litige{litigesFiltres.length > 1 ? 's' : ''}
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
      {showModalSuppression && litigeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le litige</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le litige <strong className="font-mono">{litigeSelectionne.numero}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerLitige} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÉSOLUTION */}
      {showModalResolution && litigeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalResolution(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Résoudre le litige</h3>
              <p className="text-base-content/60">
                Litige <strong className="font-mono">{litigeSelectionne.numero}</strong>
              </p>
            </div>

            <div className="form-control mb-4">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">Résolution</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows="4"
                placeholder="Décrivez la résolution du litige..."
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button className="btn flex-1" onClick={() => setShowModalResolution(false)} disabled={chargementAction}>
                Annuler
              </button>
              <button className="btn btn-success flex-1" onClick={resoudreLitige} disabled={chargementAction}>
                {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Résoudre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Litiges;