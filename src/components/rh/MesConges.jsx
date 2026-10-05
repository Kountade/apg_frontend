// pages/conges/MesConges.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Plus, Loader2, AlertCircle, RefreshCw,
  Building2, Clock, CheckCircle, XCircle, Ban, Palmtree,
  Plane, Heart, Stethoscope, TrendingUp, Award, User,
  Calendar, FileText, Eye, Filter, ChevronDown, ChevronUp,
  Target, Info, Sparkles, AlertTriangle, ThumbsUp, ThumbsDown,
  UserCircle, Briefcase, BarChart3, Send, X, Calculator,
  MessageSquare, Timer
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MesConges = () => {
  const navigate = useNavigate();
  const [conges, setConges] = useState([]);
  const [solde, setSolde] = useState(null);
  const [employe, setEmploye] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreType, setFiltreType] = useState('all');
  const [showModalAnnulation, setShowModalAnnulation] = useState(false);
  const [congeSelectionne, setCongeSelectionne] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');
  const [ongletActif, setOngletActif] = useState('historique'); // 'historique' | 'calendrier'

  const anneeActuelle = new Date().getFullYear();

  useEffect(() => {
    chargerDonnees();
  }, []);

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Charger les congés de l'utilisateur + son solde
      const [congesRes, profilRes] = await Promise.all([
        AxiosInstance.get('/conges/mes_conges/').catch(() => ({ data: [] })),
        AxiosInstance.get('/profile/').catch(() => ({ data: null })),
      ]);

      const congesData = congesRes.data.results || congesRes.data || [];
      setConges(congesData);

      // Essayer de récupérer le profil employé via l'utilisateur connecté
      const userData = JSON.parse(localStorage.getItem('User') || '{}');
      setEmploye(userData);

      // Charger le solde de l'employé
      if (userData?.employe_id) {
        try {
          const soldeRes = await AxiosInstance.get(
            `/soldes-conges/?employe=${userData.employe_id}&annee=${anneeActuelle}`
          );
          const soldes = soldeRes.data.results || soldeRes.data || [];
          setSolde(soldes[0] || null);
        } catch (e) {
          // Silencieux
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger vos congés');
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // ANNULATION DE DEMANDE
  // ============================================
  const ouvrirAnnulation = (conge) => {
    setCongeSelectionne(conge);
    setShowModalAnnulation(true);
  };

  const annulerConge = async () => {
    if (!congeSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.patch(`/conges/${congeSelectionne.id}/`, {
        statut: 'annule',
      });

      setMessageSucces('Demande annulée avec succès');
      setSucces(true);
      setShowModalAnnulation(false);
      setCongeSelectionne(null);
      await chargerDonnees();
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de l\'annulation');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================
  // FILTRES & STATS
  // ============================================
  const congesFiltres = useMemo(() => {
    let filtre = conges;

    if (filtreStatut !== 'all') {
      filtre = filtre.filter(c => c.statut === filtreStatut);
    }

    if (filtreType !== 'all') {
      filtre = filtre.filter(c => c.type === filtreType);
    }

    return filtre;
  }, [conges, filtreStatut, filtreType]);

  const stats = useMemo(() => {
    return {
      total: conges.length,
      enAttente: conges.filter(c => c.statut === 'en_attente').length,
      valides: conges.filter(c => c.statut === 'valide').length,
      refuses: conges.filter(c => c.statut === 'refuse').length,
      annules: conges.filter(c => c.statut === 'annule').length,
      joursPris: conges
        .filter(c => c.statut === 'valide')
        .reduce((acc, c) => acc + Number(c.nombre_jours || 0), 0),
      joursEnAttente: conges
        .filter(c => c.statut === 'en_attente')
        .reduce((acc, c) => acc + Number(c.nombre_jours || 0), 0),
    };
  }, [conges]);

  // ============================================
  // FORMATAGE
  // ============================================
  const formaterDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getBadgeStatut = (statut) => {
    const configs = {
      en_attente: { label: 'En attente', cls: 'badge-warning', icon: Clock },
      valide: { label: 'Validé', cls: 'badge-success', icon: CheckCircle },
      refuse: { label: 'Refusé', cls: 'badge-error', icon: XCircle },
      annule: { label: 'Annulé', cls: 'badge-ghost', icon: Ban },
    };
    const cfg = configs[statut] || { label: statut, cls: 'badge-ghost', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeType = (type) => {
    const configs = {
      annuel: { label: 'Annuel', cls: 'badge-primary', icon: Palmtree },
      maladie: { label: 'Maladie', cls: 'badge-error', icon: Stethoscope },
      maternite: { label: 'Maternité', cls: 'badge-info', icon: Heart },
      exceptionnel: { label: 'Exceptionnel', cls: 'badge-warning', icon: Plane },
    };
    const cfg = configs[type] || { label: type, cls: 'badge-ghost', icon: CalendarDays };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm badge-outline gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  // ============================================
  // CHARGEMENT / ERREUR
  // ============================================
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

  // Solde restant
  const soldeRestant = Number(solde?.solde_restant || 0);
  const soldeInitial = Number(solde?.solde_initial || 0);
  const joursAcquis = Number(solde?.jours_acquis || 0);
  const joursPris = Number(solde?.jours_pris || 0);

  const getCouleurSolde = () => {
    if (soldeRestant <= 0) return { cls: 'text-error', bg: 'bg-error/10', label: 'Épuisé' };
    if (soldeRestant <= 5) return { cls: 'text-warning', bg: 'bg-warning/10', label: 'Faible' };
    return { cls: 'text-success', bg: 'bg-success/10', label: 'Disponible' };
  };

  const couleurSolde = getCouleurSolde();

  return (
    <div className="w-full p-6">

      {/* Toast succès */}
      {succes && (
        <div className="fixed top-4 right-4 z-50 alert alert-success shadow-lg max-w-md">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{messageSucces}</span>
        </div>
      )}

      {/* ============================================ */}
      {/* EN-TÊTE                                       */}
      {/* ============================================ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <UserCircle className="w-3 h-3" />
            Mon espace
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Mes congés</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Mes congés
          </h1>
          <p className="text-base-content/60 mt-1">
            Consultez vos demandes et votre solde {anneeActuelle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={chargerDonnees}
            className="btn btn-ghost btn-sm gap-2"
            disabled={chargementAction}
          >
            <RefreshCw className={`w-4 h-4 ${chargementAction ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          <Link to="/conges/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle demande
          </Link>
        </div>
      </div>

      {/* ============================================ */}
      {/* CARTE SOLDE                                   */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Solde principal */}
        <div className={`lg:col-span-2 card ${couleurSolde.bg} border-2 border-base-300 shadow-sm`}>
          <div className="card-body">
            <div className="flex flex-wrap items-center gap-6">

              {/* Graphique circulaire */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-base-300"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(soldeRestant / Math.max(soldeInitial + joursAcquis, 1)) * 264} 264`}
                    className={
                      soldeRestant <= 0 ? 'text-error' :
                      soldeRestant <= 5 ? 'text-warning' : 'text-success'
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${
                    soldeRestant <= 0 ? 'text-error' :
                    soldeRestant <= 5 ? 'text-warning' : 'text-success'
                  }`}>
                    {soldeRestant.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-base-content/50 uppercase tracking-wider">
                    jours
                  </span>
                </div>
              </div>

              {/* Détails solde */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-lg">Solde {anneeActuelle}</h2>
                  <span className={`badge badge-sm ${
                    soldeRestant <= 0 ? 'badge-error' :
                    soldeRestant <= 5 ? 'badge-warning' : 'badge-success'
                  }`}>
                    {couleurSolde.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-base-100 border border-base-300">
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">Initial</p>
                    <p className="text-xl font-bold text-info">{soldeInitial.toFixed(1)}j</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-base-100 border border-base-300">
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">Acquis</p>
                    <p className="text-xl font-bold text-success">+{joursAcquis.toFixed(1)}j</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-base-100 border border-base-300">
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">Pris</p>
                    <p className="text-xl font-bold text-warning">-{joursPris.toFixed(1)}j</p>
                  </div>
                </div>

                {stats.joursEnAttente > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-xs text-base-content/70">
                      <strong className="text-warning">{stats.joursEnAttente} jour(s)</strong> en attente de validation
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mini-stats */}
        <div className="lg:col-span-1 grid grid-cols-2 gap-3">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-3 text-center">
              <Clock className="w-6 h-6 text-warning mx-auto mb-1" />
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">En attente</p>
              <p className="text-2xl font-bold text-warning">{stats.enAttente}</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-3 text-center">
              <CheckCircle className="w-6 h-6 text-success mx-auto mb-1" />
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Validés</p>
              <p className="text-2xl font-bold text-success">{stats.valides}</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-3 text-center">
              <XCircle className="w-6 h-6 text-error mx-auto mb-1" />
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Refusés</p>
              <p className="text-2xl font-bold text-error">{stats.refuses}</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-3 text-center">
              <Ban className="w-6 h-6 text-base-content/40 mx-auto mb-1" />
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Annulés</p>
              <p className="text-2xl font-bold text-base-content/60">{stats.annules}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MES DERNIÈRES DEMANDES (Bandeau)              */}
      {/* ============================================ */}
      {stats.enAttente > 0 && (
        <div className="w-full mb-6">
          <div className="alert alert-warning rounded-xl border border-warning/30">
            <Clock className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium text-sm">
                {stats.enAttente} demande{stats.enAttente > 1 ? 's' : ''} en attente de validation
              </p>
              <p className="text-xs opacity-80">
                Vos demandes sont en cours d'examen par le service RH
              </p>
            </div>
            <button
              onClick={() => setFiltreStatut('en_attente')}
              className="btn btn-warning btn-sm gap-2"
            >
              Voir
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* FILTRES + RACCOURCIS                          */}
      {/* ============================================ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4 space-y-4">

          {/* Raccourcis statut */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setFiltreStatut('all'); setFiltreType('all'); }}
              className={`btn btn-sm gap-2 ${filtreStatut === 'all' && filtreType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <CalendarDays className="w-4 h-4" />
              Toutes
              <span className="badge badge-sm">{stats.total}</span>
            </button>

            <button
              onClick={() => setFiltreStatut('en_attente')}
              className={`btn btn-sm gap-2 ${filtreStatut === 'en_attente' ? 'btn-warning' : 'btn-ghost'}`}
            >
              <Clock className="w-4 h-4" />
              En attente
              {stats.enAttente > 0 && <span className="badge badge-sm">{stats.enAttente}</span>}
            </button>

            <button
              onClick={() => setFiltreStatut('valide')}
              className={`btn btn-sm gap-2 ${filtreStatut === 'valide' ? 'btn-success' : 'btn-ghost'}`}
            >
              <CheckCircle className="w-4 h-4" />
              Validés
            </button>

            <button
              onClick={() => setFiltreStatut('refuse')}
              className={`btn btn-sm gap-2 ${filtreStatut === 'refuse' ? 'btn-error' : 'btn-ghost'}`}
            >
              <XCircle className="w-4 h-4" />
              Refusés
            </button>

            {/* Filtre type à droite */}
            <select
              className="select select-bordered select-sm focus:select-primary ml-auto"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="annuel">Annuel</option>
              <option value="maladie">Maladie</option>
              <option value="maternite">Maternité</option>
              <option value="exceptionnel">Exceptionnel</option>
            </select>
          </div>

        </div>
      </div>

      {/* ============================================ */}
      {/* LISTE DES CONGÉS                              */}
      {/* ============================================ */}
      {congesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CalendarDays className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {conges.length === 0 ? 'Aucune demande de congé' : 'Aucun résultat'}
          </p>
          <p className="text-sm text-base-content/40 mt-2">
            {conges.length === 0
              ? 'Vous n\'avez pas encore fait de demande de congé'
              : 'Essayez de modifier vos filtres'}
          </p>
          {conges.length === 0 && (
            <Link to="/conges/ajouter" className="btn btn-primary mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Faire une demande
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {congesFiltres.map((conge) => (
            <div
              key={conge.id}
              className={`card bg-base-100 shadow-sm border transition-all hover:shadow-md ${
                conge.statut === 'en_attente' ? 'border-warning/30 bg-warning/5' :
                conge.statut === 'valide' ? 'border-success/30' :
                conge.statut === 'refuse' ? 'border-error/30 bg-error/5' :
                'border-base-300'
              }`}
            >
              <div className="card-body p-4">
                <div className="flex flex-wrap items-center gap-4">

                  {/* Icône type */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    conge.type === 'annuel' ? 'bg-primary/10 text-primary' :
                    conge.type === 'maladie' ? 'bg-error/10 text-error' :
                    conge.type === 'maternite' ? 'bg-info/10 text-info' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {conge.type === 'annuel' ? <Palmtree className="w-6 h-6" /> :
                     conge.type === 'maladie' ? <Stethoscope className="w-6 h-6" /> :
                     conge.type === 'maternite' ? <Heart className="w-6 h-6" /> :
                     <Plane className="w-6 h-6" />}
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-base-content/50">{conge.numero}</span>
                      {getBadgeType(conge.type)}
                      {getBadgeStatut(conge.statut)}
                    </div>
                    <p className="text-sm font-medium">
                      {formaterDate(conge.date_debut)} → {formaterDate(conge.date_fin)}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {conge.nombre_jours} jour{conge.nombre_jours > 1 ? 's' : ''}
                      {conge.motif && ` • ${conge.motif.substring(0, 60)}${conge.motif.length > 60 ? '...' : ''}`}
                    </p>
                  </div>

                  {/* Commentaire validation */}
                  {conge.commentaire && (conge.statut === 'valide' || conge.statut === 'refuse') && (
                    <div className={`hidden lg:block max-w-[250px] p-2 rounded-lg text-xs ${
                      conge.statut === 'valide' ? 'bg-success/5 border border-success/20' :
                      'bg-error/5 border border-error/20'
                    }`}>
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                          conge.statut === 'valide' ? 'text-success' : 'text-error'
                        }`} />
                        <span className="line-clamp-2 text-base-content/70">
                          {conge.commentaire}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/conges/${conge.id}`}
                      className="btn btn-ghost btn-sm gap-1"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Annuler si en attente */}
                    {conge.statut === 'en_attente' && (
                      <button
                        onClick={() => ouvrirAnnulation(conge)}
                        className="btn btn-ghost btn-sm text-error gap-1"
                        title="Annuler la demande"
                        disabled={chargementAction}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-3 pt-3 border-t border-base-200">
                  <div className="flex items-center justify-between text-xs text-base-content/50">
                    <div className="flex items-center gap-1.5">
                      <Send className="w-3 h-3" />
                      <span>Envoyée le {formaterDate(conge.created_at)}</span>
                    </div>
                    {conge.date_validation && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>Traitée le {formaterDate(conge.date_validation)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* AIDE                                          */}
      {/* ============================================ */}
      <div className="w-full mt-6">
        <div className="p-4 rounded-lg bg-info/5 border border-info/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm text-base-content/70 leading-relaxed">
            <p className="font-semibold text-info mb-1">Comment faire une demande de congé ?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Cliquez sur <strong>"Nouvelle demande"</strong> en haut de la page</li>
              <li>Choisissez le type de congé et les dates souhaitées</li>
              <li>Votre demande sera examinée par le service RH</li>
              <li>Vous pouvez suivre son statut dans la liste ci-dessus</li>
              <li>Tant que la demande est <strong>en attente</strong>, vous pouvez l'annuler</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL ANNULATION                              */}
      {/* ============================================ */}
      {showModalAnnulation && congeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalAnnulation(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                <Ban className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold mb-2">Annuler la demande</h3>
              <p className="text-base-content/60 mb-4">
                Voulez-vous vraiment annuler votre demande de congé du{' '}
                <span className="font-bold">{formaterDate(congeSelectionne.date_debut)}</span> ?
                <br />
                <span className="text-xs">Cette action ne peut pas être annulée.</span>
              </p>
              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalAnnulation(false)}
                  disabled={chargementAction}
                >
                  Retour
                </button>
                <button
                  className="btn btn-warning flex-1 gap-2"
                  onClick={annulerConge}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Annulation...
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MesConges;