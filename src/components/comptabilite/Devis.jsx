// components/comptabilite/Devis.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, FileCheck, CheckCircle, XCircle,
  DollarSign, Send, Clock, FilePlus, ThumbsUp, ThumbsDown
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost', icon: FileText },
  envoye: { label: 'Envoyé', cls: 'badge-info', icon: Send },
  accepte: { label: 'Accepté', cls: 'badge-success', icon: ThumbsUp },
  refuse: { label: 'Refusé', cls: 'badge-error', icon: ThumbsDown },
  expire: { label: 'Expiré', cls: 'badge-warning', icon: Clock },
  transforme: { label: 'Transformé', cls: 'badge-primary', icon: FileCheck },
};

const Devis = () => {
  const navigate = useNavigate();
  const [devis, setDevis] = useState([]);
  const [devisFiltres, setDevisFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [devisSelectionne, setDevisSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDevis();
  }, []);

  const chargerDevis = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/devis/');
      const data = res.data.results || res.data || [];
      setDevis(data);
      setDevisFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les devis');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = devis;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(d =>
        d.numero?.toLowerCase().includes(terme) ||
        d.client_nom?.toLowerCase().includes(terme) ||
        d.objet?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(d => d.statut === filtreStatut);
    setDevisFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, devis]);

  const totalPages = Math.ceil(devisFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return devisFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerDevis = async () => {
    if (!devisSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/devis/${devisSelectionne.id}/`);
      setDevis(devis.filter(d => d.id !== devisSelectionne.id));
      setShowModalSuppression(false);
      setDevisSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

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
        <button onClick={chargerDevis} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: devis.length,
    brouillons: devis.filter(d => d.statut === 'brouillon').length,
    envoyes: devis.filter(d => d.statut === 'envoye').length,
    acceptes: devis.filter(d => d.statut === 'accepte').length,
    transformes: devis.filter(d => d.statut === 'transforme').length,
    montantTotal: devis.reduce((sum, d) => sum + Number(d.montant_ttc || 0), 0),
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Devis</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Devis commerciaux
          </h1>
          <p className="text-base-content/60 mt-1">
            {devisFiltres.length} devis trouvé{devisFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDevis} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/devis/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau devis
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
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Envoyés</p>
              <p className="text-xl font-bold text-info">{stats.envoyes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Acceptés</p>
              <p className="text-xl font-bold text-success">{stats.acceptes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Transformés</p>
              <p className="text-xl font-bold text-primary">{stats.transformes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MONTANT TOTAL */}
      <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm mb-6">
        <div className="card-body p-4">
          <p className="text-xs text-base-content/60 uppercase tracking-wider">Montant total des devis</p>
          <p className="text-2xl font-bold text-primary font-mono">{formaterMontant(stats.montantTotal)}</p>
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

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setRecherche(''); setFiltreStatut('all'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {devisFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun devis trouvé</p>
          <Link to="/devis/ajouter" className="btn btn-primary mt-4">Créer un devis</Link>
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
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Validité</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant TTC</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((d) => (
                  <tr key={d.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <Link
                        to={`/devis/${d.id}`}
                        className="font-mono text-sm font-medium text-primary hover:underline"
                      >
                        {d.numero}
                      </Link>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[180px]">{d.client_nom}</p>
                    </td>
                    <td>
                      <p className="text-sm truncate max-w-[200px]">{d.objet || '—'}</p>
                    </td>
                    <td>
                      <p className="text-xs">{formaterDate(d.date_validite)}</p>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-medium">
                        {formaterMontant(d.montant_ttc)}
                      </span>
                    </td>
                    <td>{getBadgeStatut(d.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/devis/${d.id}`} className="btn btn-ghost btn-xs" title="Voir">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link to={`/devis/${d.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setDevisSelectionne(d); setShowModalSuppression(true); }}
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
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, devisFiltres.length)} sur{' '}
                {devisFiltres.length} devis
              </p>
              <div className="flex gap-1">
                <button className="btn btn-sm btn-ghost" onClick={() => setPageActuelle(pageActuelle - 1)} disabled={pageActuelle === 1}>
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
                <button className="btn btn-sm btn-ghost" onClick={() => setPageActuelle(pageActuelle + 1)} disabled={pageActuelle === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && devisSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le devis</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le devis <span className="font-bold font-mono">{devisSelectionne.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerDevis} disabled={chargementAction}>
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

export default Devis;