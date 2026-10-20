// components/comptabilite/Cloture.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, Unlock, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Calculator, ShieldCheck,
  Calendar, DollarSign, TrendingUp, TrendingDown, FileText,
  Info, AlertTriangle, FileDown
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost',    icon: FileText,    color: 'ghost' },
  en_cours:  { label: 'En cours',  cls: 'badge-info',     icon: Calculator,  color: 'info' },
  validee:   { label: 'Validée',   cls: 'badge-success',  icon: CheckCircle, color: 'success' },
  reouverte: { label: 'Réouverte', cls: 'badge-warning',  icon: Unlock,      color: 'warning' },
};

const TYPES_CONFIG = {
  mensuelle:     { label: 'Mensuelle',     color: 'primary' },
  trimestrielle: { label: 'Trimestrielle', color: 'info' },
  semestrielle:  { label: 'Semestrielle',  color: 'warning' },
  annuelle:      { label: 'Annuelle',      color: 'error' },
};

const Cloture = () => {
  const [clotures, setClotures] = useState([]);
  const [cloturesFiltrees, setCloturesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreAnnee, setFiltreAnnee] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [clotureSelectionnee, setClotureSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalCreation, setShowModalCreation] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [formData, setFormData] = useState({
    type: 'mensuelle',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    trimestre: 1,
    date_debut: '',
    date_fin: '',
    notes: '',
  });

  const MOIS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    chargerClotures();
  }, []);

  const chargerClotures = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/clotures/');
      const data = res.data.results || res.data || [];
      setClotures(data);
      setCloturesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les clôtures');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = clotures;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.numero?.toLowerCase().includes(terme) ||
        c.libelle?.toLowerCase().includes(terme) ||
        c.notes?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(c => c.statut === filtreStatut);
    if (filtreType !== 'all') filtre = filtre.filter(c => c.type === filtreType);
    if (filtreAnnee !== 'all') filtre = filtre.filter(c => String(c.annee) === String(filtreAnnee));
    setCloturesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreType, filtreAnnee, clotures]);

  const totalPages = Math.ceil(cloturesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return cloturesFiltrees.slice(debut, debut + elementsParPage);
  };

  const anneesDisponibles = useMemo(() => {
    const set = new Set(clotures.map(c => c.annee).filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [clotures]);

  // Auto-calcul dates lors de la création
  useEffect(() => {
    if (showModalCreation && formData.type) {
      const annee = parseInt(formData.annee);
      let dateDebut, dateFin;

      if (formData.type === 'mensuelle') {
        const mois = parseInt(formData.mois);
        dateDebut = new Date(annee, mois - 1, 1);
        dateFin = new Date(annee, mois, 0);
      } else if (formData.type === 'trimestrielle') {
        const trimestre = parseInt(formData.trimestre);
        const moisDebut = (trimestre - 1) * 3;
        const moisFin = trimestre * 3 - 1;
        dateDebut = new Date(annee, moisDebut, 1);
        dateFin = new Date(annee, moisFin + 1, 0);
      } else if (formData.type === 'semestrielle') {
        // On ne gère que S1/S2 via trimestre (1 = S1, 2 = S2)
        const semestre = parseInt(formData.trimestre) <= 2 ? 1 : 2;
        dateDebut = new Date(annee, (semestre - 1) * 6, 1);
        dateFin = new Date(annee, semestre * 6, 0);
      } else {
        // annuelle
        dateDebut = new Date(annee, 0, 1);
        dateFin = new Date(annee, 11, 31);
      }

      const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      setFormData(prev => ({
        ...prev,
        date_debut: fmt(dateDebut),
        date_fin: fmt(dateFin),
      }));
    }
  }, [formData.type, formData.mois, formData.annee, formData.trimestre, showModalCreation]);

  const creerCloture = async () => {
    setChargementAction(true);
    try {
      const dataToSend = { ...formData };
      if (formData.type !== 'mensuelle') delete dataToSend.mois;
      if (formData.type !== 'trimestrielle' && formData.type !== 'semestrielle') {
        delete dataToSend.trimestre;
      }
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          delete dataToSend[key];
        }
      });
      await AxiosInstance.post('/clotures/', dataToSend);
      await chargerClotures();
      setShowModalCreation(false);
    } catch (err) {
      alert(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Erreur lors de la création');
    } finally {
      setChargementAction(false);
    }
  };

  const executerAction = async (cloture, action) => {
    const confirmMessages = {
      calculer: `Calculer les totaux de la clôture "${cloture.libelle}" ?`,
      valider: `Valider définitivement la clôture "${cloture.libelle}" ?\nCette action verrouille la période.`,
      reouvrir: `Réouvrir la clôture "${cloture.libelle}" ?\nCela permettra de modifier les écritures.`,
    };

    if (!confirm(confirmMessages[action])) return;

    setChargementAction(true);
    try {
      await AxiosInstance.post(`/clotures/${cloture.id}/${action}/`);
      await chargerClotures();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du traitement');
    } finally {
      setChargementAction(false);
    }
  };

  const supprimerCloture = async () => {
    if (!clotureSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/clotures/${clotureSelectionnee.id}/`);
      setClotures(clotures.filter(c => c.id !== clotureSelectionnee.id));
      setShowModalSuppression(false);
      setClotureSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) === 0) return '0 GNF';
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
    const cfg = STATUTS_CONFIG[statut] || STATUTS_CONFIG.brouillon;
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || { label: type, color: 'ghost' };
    return (
      <span className={`badge badge-${cfg.color} badge-sm`}>
        {cfg.label}
      </span>
    );
  };

  const stats = useMemo(() => ({
    total: clotures.length,
    validees: clotures.filter(c => c.statut === 'validee').length,
    enCours: clotures.filter(c => c.statut === 'en_cours').length,
    benefice: clotures.filter(c => c.est_benefice && c.statut === 'validee').length,
  }), [clotures]);

  const filtresActifs = recherche || filtreStatut !== 'all' || filtreType !== 'all' || filtreAnnee !== 'all';

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
        <button onClick={chargerClotures} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Lock className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Clôture</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Lock className="w-8 h-8 text-primary" />
            Clôtures comptables
          </h1>
          <p className="text-base-content/60 mt-1">
            {cloturesFiltrees.length} clôture{cloturesFiltrees.length > 1 ? 's' : ''} trouvée{cloturesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && clotures.length !== cloturesFiltrees.length && (
              <span className="text-base-content/40"> (sur {clotures.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerClotures} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={() => setShowModalCreation(true)} className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle clôture
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="alert alert-info mb-6">
        <Info className="w-5 h-5" />
        <div>
          <p className="font-bold">Workflow de clôture</p>
          <p className="text-sm">
            <strong>Brouillon</strong> → <strong>En cours</strong> (calcul) → <strong>Validée</strong> (verrouillage).
            Une clôture validée ne peut plus être modifiée sans réouverture.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
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
              <p className="text-xs text-base-content/50 uppercase">Validées</p>
              <p className="text-xl font-bold text-success">{stats.validees}</p>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-info" />
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
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Bénéfices</p>
              <p className="text-xl font-bold text-success">{stats.benefice}</p>
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
                  placeholder="Rechercher par numéro, libellé..."
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
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPES_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {anneesDisponibles.length > 0 && (
              <select
                className="select select-bordered select-sm"
                value={filtreAnnee}
                onChange={(e) => setFiltreAnnee(e.target.value)}
              >
                <option value="all">Toutes les années</option>
                {anneesDisponibles.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreStatut('all');
                  setFiltreType('all');
                  setFiltreAnnee('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {cloturesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Lock className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune clôture ne correspond aux filtres' : 'Aucune clôture enregistrée'}
          </p>
          <button onClick={() => setShowModalCreation(true)} className="btn btn-primary mt-4">
            Créer une clôture
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Produits</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Charges</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Résultat</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((c) => (
                  <tr key={c.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">{c.numero}</span>
                    </td>
                    <td>
                      <p className="font-medium text-sm">{c.libelle}</p>
                      <p className="text-xs text-base-content/50">
                        {formaterDate(c.date_debut)} → {formaterDate(c.date_fin)}
                      </p>
                    </td>
                    <td>{getBadgeType(c.type)}</td>
                    <td className="text-right">
                      <span className="font-mono text-xs text-success">
                        {formaterMontantCourt(c.total_produits)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs text-error">
                        {formaterMontantCourt(c.total_charges)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`font-mono text-sm font-bold ${
                        c.est_benefice ? 'text-success' : 'text-error'
                      }`}>
                        {c.est_benefice ? '+' : ''}{formaterMontantCourt(c.resultat)}
                      </span>
                    </td>
                    <td>{getBadgeStatut(c.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {['brouillon', 'reouverte'].includes(c.statut) && (
                          <button
                            onClick={() => executerAction(c, 'calculer')}
                            disabled={chargementAction}
                            className="btn btn-ghost btn-xs text-info"
                            title="Calculer les totaux"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {c.statut === 'en_cours' && (
                          <button
                            onClick={() => executerAction(c, 'valider')}
                            disabled={chargementAction}
                            className="btn btn-ghost btn-xs text-success"
                            title="Valider"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {c.statut === 'validee' && (
                          <button
                            onClick={() => executerAction(c, 'reouvrir')}
                            disabled={chargementAction}
                            className="btn btn-ghost btn-xs text-warning"
                            title="Réouvrir"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setClotureSelectionnee(c);
                            setShowModalSuppression(true);
                          }}
                          disabled={c.statut === 'validee' || chargementAction}
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
                {Math.min(pageActuelle * elementsParPage, cloturesFiltrees.length)} sur{' '}
                {cloturesFiltrees.length} clôture{cloturesFiltrees.length > 1 ? 's' : ''}
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

      {/* MODAL CRÉATION */}
      {showModalCreation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalCreation(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nouvelle clôture
            </h3>

            <div className="space-y-4">
              <div className="form-control w-full">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">
                    Type de clôture <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  {Object.entries(TYPES_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {formData.type === 'mensuelle' && (
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Mois</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.mois}
                      onChange={(e) => setFormData(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
                    >
                      {MOIS.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(formData.type === 'trimestrielle' || formData.type === 'semestrielle') && (
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        {formData.type === 'trimestrielle' ? 'Trimestre' : 'Semestre'}
                      </span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.trimestre}
                      onChange={(e) => setFormData(prev => ({ ...prev, trimestre: parseInt(e.target.value) }))}
                    >
                      {formData.type === 'trimestrielle' ? (
                        <>
                          <option value={1}>T1 (Jan-Mar)</option>
                          <option value={2}>T2 (Avr-Juin)</option>
                          <option value={3}>T3 (Juil-Sep)</option>
                          <option value={4}>T4 (Oct-Déc)</option>
                        </>
                      ) : (
                        <>
                          <option value={1}>S1 (Jan-Juin)</option>
                          <option value={2}>S2 (Juil-Déc)</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">Année</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full font-mono"
                    value={formData.annee}
                    onChange={(e) => setFormData(prev => ({ ...prev, annee: parseInt(e.target.value) || new Date().getFullYear() }))}
                    min="2020"
                    max="2100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">Date début</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={formData.date_debut}
                    readOnly
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">Date fin</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={formData.date_fin}
                    readOnly
                  />
                </div>
              </div>

              <div className="alert alert-info py-2">
                <Info className="w-4 h-4" />
                <span className="text-xs">
                  Les dates sont <strong>calculées automatiquement</strong> selon le type et la période.
                </span>
              </div>

              <div className="form-control w-full">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="2"
                  placeholder="Notes sur la clôture..."
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="btn flex-1"
                onClick={() => setShowModalCreation(false)}
                disabled={chargementAction}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={creerCloture}
                disabled={chargementAction}
              >
                {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && clotureSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la clôture</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la clôture <strong className="font-mono">{clotureSelectionnee.numero}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerCloture} disabled={chargementAction}>
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

export default Cloture;