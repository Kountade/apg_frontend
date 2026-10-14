// components/tresorerie/AlertesTresorerie.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, AlertTriangle, Info,
  Wallet, TrendingDown, TrendingUp, Clock, CheckSquare,
  MoreVertical, EyeOff, BellOff
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des niveaux
// ============================================================
const NIVEAUX_CONFIG = {
  info: {
    label: 'Information',
    cls: 'badge-info',
    icon: Info,
    color: 'info',
    bg: 'bg-info/5',
    border: 'border-info/30',
  },
  avertissement: {
    label: 'Avertissement',
    cls: 'badge-warning',
    icon: AlertTriangle,
    color: 'warning',
    bg: 'bg-warning/5',
    border: 'border-warning/30',
  },
  critique: {
    label: 'Critique',
    cls: 'badge-error',
    icon: AlertCircle,
    color: 'error',
    bg: 'bg-error/5',
    border: 'border-error/30',
  },
};

const AlertesTresorerie = () => {
  const navigate = useNavigate();
  const [alertes, setAlertes] = useState([]);
  const [alertesFiltrees, setAlertesFiltrees] = useState([]);
  const [caisses, setCaisses] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('all');
  const [filtreResolue, setFiltreResolue] = useState('active');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [alerteSelectionnee, setAlerteSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [alertesRes, caissesRes, comptesRes] = await Promise.all([
        AxiosInstance.get('/alertes-tresorerie/').catch(() => ({ data: [] })),
        AxiosInstance.get('/caisses/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-bancaires/').catch(() => ({ data: [] })),
      ]);
      const data = alertesRes.data.results || alertesRes.data || [];
      setAlertes(data);
      setAlertesFiltrees(data);
      setCaisses(caissesRes.data.results || caissesRes.data || []);
      setComptes(comptesRes.data.results || comptesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les alertes');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = alertes;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(a =>
        a.titre?.toLowerCase().includes(terme) ||
        a.message?.toLowerCase().includes(terme)
      );
    }
    if (filtreNiveau !== 'all') filtre = filtre.filter(a => a.niveau === filtreNiveau);
    if (filtreResolue === 'active') filtre = filtre.filter(a => !a.resolue);
    else if (filtreResolue === 'resolue') filtre = filtre.filter(a => a.resolue);
    setAlertesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreNiveau, filtreResolue, alertes]);

  const totalPages = Math.ceil(alertesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return alertesFiltrees.slice(debut, debut + elementsParPage);
  };

  const supprimerAlerte = async () => {
    if (!alerteSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/alertes-tresorerie/${alerteSelectionnee.id}/`);
      setAlertes(alertes.filter(a => a.id !== alerteSelectionnee.id));
      setShowModalSuppression(false);
      setAlerteSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const resoudreAlerte = async (alerte) => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/alertes-tresorerie/${alerte.id}/resoudre/`);
      await chargerDonnees();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterDateHeure = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  const getBadgeNiveau = (niveau) => {
    const cfg = NIVEAUX_CONFIG[niveau] || NIVEAUX_CONFIG.info;
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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: alertes.length,
    actives: alertes.filter(a => !a.resolue).length,
    critiques: alertes.filter(a => a.niveau === 'critique' && !a.resolue).length,
    avertissements: alertes.filter(a => a.niveau === 'avertissement' && !a.resolue).length,
    infos: alertes.filter(a => a.niveau === 'info' && !a.resolue).length,
    resolues: alertes.filter(a => a.resolue).length,
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Wallet className="w-3 h-3" />
            Trésorerie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Alertes</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Alertes de trésorerie
          </h1>
          <p className="text-base-content/60 mt-1">
            {alertesFiltrees.length} alerte{alertesFiltrees.length > 1 ? 's' : ''} trouvée{alertesFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/alertes-tresorerie/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle alerte
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Critiques</p>
              <p className="text-xl font-bold text-error">{stats.critiques}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Avertissements</p>
              <p className="text-xl font-bold text-warning">{stats.avertissements}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Infos</p>
              <p className="text-xl font-bold text-info">{stats.infos}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Résolues</p>
              <p className="text-xl font-bold text-success">{stats.resolues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTE CRITIQUE BANNER */}
      {stats.critiques > 0 && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-bold">
              {stats.critiques} alerte{stats.critiques > 1 ? 's' : ''} critique{stats.critiques > 1 ? 's' : ''} active{stats.critiques > 1 ? 's' : ''}
            </p>
            <p className="text-sm">Nécessite{stats.critiques > 1 ? 'nt' : ''} votre attention immédiate</p>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, message..."
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
              <option value="all">Tous les niveaux</option>
              {Object.entries(NIVEAUX_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreResolue}
              onChange={(e) => setFiltreResolue(e.target.value)}
            >
              <option value="active">Actives</option>
              <option value="resolue">Résolues</option>
              <option value="all">Toutes</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setRecherche(''); setFiltreNiveau('all'); setFiltreResolue('active'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {alertesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Bell className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune alerte trouvée</p>
          <p className="text-sm text-base-content/40 mt-2">
            {filtreResolue === 'active'
              ? 'Aucune alerte active - Tout est sous contrôle ✓'
              : 'Essayez de modifier les filtres'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {getElementsPage().map((alerte) => {
              const cfg = NIVEAUX_CONFIG[alerte.niveau] || NIVEAUX_CONFIG.info;
              const Icon = cfg.icon;

              return (
                <div
                  key={alerte.id}
                  className={`card shadow-sm border-2 ${cfg.border} ${cfg.bg} ${
                    alerte.resolue ? 'opacity-60' : ''
                  }`}
                >
                  <div className="card-body p-4">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Icône */}
                      <div className={`w-12 h-12 rounded-lg bg-${cfg.color}/20 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 text-${cfg.color}`} />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold">{alerte.titre}</h3>
                          {getBadgeNiveau(alerte.niveau)}
                          {alerte.resolue && (
                            <span className="badge badge-success badge-sm gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Résolue
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-base-content/70 mb-3">
                          {alerte.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-base-content/50">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formaterDateHeure(alerte.created_at)}
                          </span>

                          {alerte.caisse_nom && (
                            <span className="flex items-center gap-1">
                              <Wallet className="w-3 h-3" />
                              Caisse: {alerte.caisse_nom}
                            </span>
                          )}
                          {alerte.compte_nom && (
                            <span className="flex items-center gap-1">
                              <Landmark className="w-3 h-3" />
                              Compte: {alerte.compte_nom}
                            </span>
                          )}
                          {alerte.resolue && alerte.date_resolution && (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle className="w-3 h-3" />
                              Résolue le {formaterDate(alerte.date_resolution)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {!alerte.resolue && (
                          <button
                            onClick={() => resoudreAlerte(alerte)}
                            className="btn btn-ghost btn-sm text-success"
                            title="Marquer comme résolue"
                            disabled={chargementAction}
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          to={`/alertes-tresorerie/${alerte.id}/modifier`}
                          className="btn btn-ghost btn-sm"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => { setAlerteSelectionnee(alerte); setShowModalSuppression(true); }}
                          className="btn btn-ghost btn-sm text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, alertesFiltrees.length)} sur{' '}
                {alertesFiltrees.length} alertes
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
      {showModalSuppression && alerteSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'alerte</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'alerte <strong>"{alerteSelectionnee.titre}"</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerAlerte} disabled={chargementAction}>
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

export default AlertesTresorerie;