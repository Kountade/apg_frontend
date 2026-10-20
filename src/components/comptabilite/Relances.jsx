// components/comptabilite/Relances.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send, Search, Plus, Edit, Trash2, Eye, Loader2, AlertCircle,
  RefreshCw, Filter, ChevronLeft, ChevronRight, Mail, Phone,
  MessageSquare, MapPin, Clock, Calendar, User, DollarSign,
  FileText, CheckCircle, XCircle, History
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  email:    { label: 'Email',      icon: Mail,          color: 'info' },
  sms:      { label: 'SMS',        icon: MessageSquare, color: 'primary' },
  appel:    { label: 'Appel',      icon: Phone,         color: 'success' },
  courrier: { label: 'Courrier',   icon: FileText,      color: 'warning' },
  visite:   { label: 'Visite',     icon: MapPin,        color: 'secondary' },
};

const Relances = () => {
  const navigate = useNavigate();
  const [relances, setRelances] = useState([]);
  const [relancesFiltrees, setRelancesFiltrees] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreClient, setFiltreClient] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [relanceSelectionnee, setRelanceSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [relancesRes, clientsRes] = await Promise.all([
        AxiosInstance.get('/relances/').catch(() => ({ data: [] })),
        AxiosInstance.get('/clients/').catch(() => ({ data: [] })),
      ]);
      setRelances(relancesRes.data.results || relancesRes.data || []);
      setClients(clientsRes.data.results || clientsRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les relances');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = relances;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(r =>
        r.client_nom?.toLowerCase().includes(terme) ||
        r.facture_reference?.toLowerCase().includes(terme) ||
        r.message?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(r => r.type === filtreType);
    if (filtreClient !== 'all') filtre = filtre.filter(r => String(r.client) === String(filtreClient));
    setRelancesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreClient, relances]);

  const totalPages = Math.ceil(relancesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return relancesFiltrees.slice(debut, debut + elementsParPage);
  };

  const supprimerRelance = async () => {
    if (!relanceSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/relances/${relanceSelectionnee.id}/`);
      setRelances(relances.filter(r => r.id !== relanceSelectionnee.id));
      setShowModalSuppression(false);
      setRelanceSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || { label: type, icon: Mail, color: 'ghost' };
    const Icon = cfg.icon;
    return (
      <span className={`badge badge-${cfg.color} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const stats = useMemo(() => ({
    total: relances.length,
    ceMois: relances.filter(r => {
      const d = new Date(r.date_relance);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    avecReponse: relances.filter(r => r.reponse_client).length,
    aVenir: relances.filter(r => {
      if (!r.prochaine_relance) return false;
      return new Date(r.prochaine_relance) >= new Date();
    }).length,
  }), [relances]);

  const filtresActifs = recherche || filtreType !== 'all' || filtreClient !== 'all';

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
            <Send className="w-3 h-3" />
            Facturation & Recouvrement
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Relances</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Send className="w-8 h-8 text-primary" />
            Relances clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {relancesFiltrees.length} relance{relancesFiltrees.length > 1 ? 's' : ''} trouvée{relancesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && relances.length !== relancesFiltrees.length && (
              <span className="text-base-content/40"> (sur {relances.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/historique-relances" className="btn btn-ghost btn-sm gap-2">
            <History className="w-4 h-4" /> Historique
          </Link>
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/relances/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle relance
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Ce mois</p>
              <p className="text-xl font-bold text-info">{stats.ceMois}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Avec réponse</p>
              <p className="text-xl font-bold text-success">{stats.avecReponse}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">À venir</p>
              <p className="text-xl font-bold text-warning">{stats.aVenir}</p>
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
                  placeholder="Rechercher par client, facture, message..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPES_CONFIG).map(([key, cfg]) => (
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
                  setFiltreType('all');
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
      {relancesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Send className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune relance ne correspond aux filtres' : 'Aucune relance'}
          </p>
          <Link to="/relances/ajouter" className="btn btn-primary mt-4">
            Créer une relance
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Client</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Facture</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Prochaine</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((r) => (
                  <tr key={r.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <p className="text-xs font-mono">{formaterDate(r.date_relance)}</p>
                    </td>
                    <td>
                      <p className="font-medium text-sm truncate max-w-[180px]">{r.client_nom || '—'}</p>
                    </td>
                    <td>{getBadgeType(r.type)}</td>
                    <td>
                      {r.facture_reference ? (
                        <span className="font-mono text-xs text-base-content/70">
                          {r.facture_reference}
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold text-warning">
                        {formaterMontant(r.montant_reclame)}
                      </span>
                    </td>
                    <td>
                      {r.prochaine_relance ? (
                        <span className="badge badge-ghost badge-sm font-mono">
                          {formaterDate(r.prochaine_relance)}
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setRelanceSelectionnee(r);
                          }}
                          className="btn btn-ghost btn-xs"
                          title="Voir message"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/relances/${r.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setRelanceSelectionnee(r);
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
                {Math.min(pageActuelle * elementsParPage, relancesFiltrees.length)} sur{' '}
                {relancesFiltrees.length} relance{relancesFiltrees.length > 1 ? 's' : ''}
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
      {showModalSuppression && relanceSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la relance</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer cette relance pour <strong>{relanceSelectionnee.client_nom}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerRelance} disabled={chargementAction}>
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

export default Relances;