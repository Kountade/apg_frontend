// pages/conges/Conges.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Users, Clock, CheckCircle, XCircle, AlertTriangle,
  FileText, TrendingUp, UserCheck, Palmtree, Plane, Heart,
  Stethoscope, Ban, Calendar, ThumbsUp, ThumbsDown, List,
  LayoutGrid, ChevronDown, User
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Conges = () => {
  const navigate = useNavigate();
  const [conges, setConges] = useState([]);
  const [congesFiltres, setCongesFiltres] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [vueMode, setVueMode] = useState('liste'); // 'liste' | 'calendrier'
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreEmploye, setFiltreEmploye] = useState('all');
  const [filtreAnnee, setFiltreAnnee] = useState(new Date().getFullYear());
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(10);
  const [congeSelectionne, setCongeSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalValidation, setShowModalValidation] = useState(false);
  const [actionValidation, setActionValidation] = useState('valider');
  const [commentaireValidation, setCommentaireValidation] = useState('');
  const [chargementAction, setChargementAction] = useState(false);
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');

  // État du calendrier
  const [moisCalendrier, setMoisCalendrier] = useState(new Date().getMonth());
  const [anneeCalendrier, setAnneeCalendrier] = useState(new Date().getFullYear());

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [congesRes, empRes] = await Promise.all([
        AxiosInstance.get('/conges/'),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);

      const congesData = congesRes.data.results || congesRes.data || [];
      const empData = empRes.data.results || empRes.data || [];

      setConges(congesData);
      setCongesFiltres(congesData);
      setEmployes(empData);
      setTotalPages(Math.ceil(congesData.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les congés');
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // FILTRES APPLIQUÉS
  // ============================================
  useEffect(() => {
    let filtre = conges;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.numero?.toLowerCase().includes(terme) ||
        c.employe_nom?.toLowerCase().includes(terme) ||
        c.motif?.toLowerCase().includes(terme)
      );
    }

    if (filtreStatut !== 'all') {
      filtre = filtre.filter(c => c.statut === filtreStatut);
    }

    if (filtreType !== 'all') {
      filtre = filtre.filter(c => c.type === filtreType);
    }

    if (filtreEmploye !== 'all') {
      filtre = filtre.filter(c => String(c.employe) === String(filtreEmploye));
    }

    if (filtreAnnee) {
      filtre = filtre.filter(c => {
        if (!c.date_debut) return false;
        return c.date_debut.startsWith(String(filtreAnnee));
      });
    }

    setCongesFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreType, filtreEmploye, filtreAnnee, conges]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return congesFiltres.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  // ============================================
  // ACTIONS
  // ============================================
  const supprimerConge = async () => {
    if (!congeSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/conges/${congeSelectionne.id}/`);
      setConges(conges.filter(c => c.id !== congeSelectionne.id));
      setShowModalSuppression(false);
      setCongeSelectionne(null);
      setMessageSucces('Congé supprimé avec succès');
      setSucces(true);
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const ouvrirValidation = (conge, action) => {
    setCongeSelectionne(conge);
    setActionValidation(action);
    setCommentaireValidation('');
    setShowModalValidation(true);
  };

  const validerConge = async () => {
    if (!congeSelectionne) return;
    setChargementAction(true);
    try {
      const endpoint = actionValidation === 'valider'
        ? `/conges/${congeSelectionne.id}/valider/`
        : `/conges/${congeSelectionne.id}/refuser/`;

      await AxiosInstance.post(endpoint, {
        commentaire: commentaireValidation,
      });

      setMessageSucces(
        actionValidation === 'valider'
          ? 'Congé validé avec succès'
          : 'Congé refusé'
      );
      setSucces(true);
      setShowModalValidation(false);
      setCongeSelectionne(null);
      setCommentaireValidation('');
      await chargerDonnees();
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setChargementAction(false);
    }
  };

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
  // CALENDRIER : constructions des données
  // ============================================
  const joursDansMois = useMemo(() => {
    const premierJour = new Date(anneeCalendrier, moisCalendrier, 1);
    const dernierJour = new Date(anneeCalendrier, moisCalendrier + 1, 0);
    const jours = [];

    // Jours du mois précédent (pour compléter la première semaine)
    const jourSemaineDebut = premierJour.getDay(); // 0=dimanche
    const joursAvant = jourSemaineDebut === 0 ? 6 : jourSemaineDebut - 1; // Lundi = 0
    for (let i = joursAvant - 1; i >= 0; i--) {
      const d = new Date(anneeCalendrier, moisCalendrier, -i);
      jours.push({ date: d, horsMois: true });
    }

    // Jours du mois
    for (let i = 1; i <= dernierJour.getDate(); i++) {
      jours.push({
        date: new Date(anneeCalendrier, moisCalendrier, i),
        horsMois: false,
      });
    }

    // Compléter la dernière semaine
    const reste = 7 - (jours.length % 7);
    if (reste < 7) {
      for (let i = 1; i <= reste; i++) {
        const d = new Date(anneeCalendrier, moisCalendrier + 1, i);
        jours.push({ date: d, horsMois: true });
      }
    }

    return jours;
  }, [moisCalendrier, anneeCalendrier]);

  // Congés actifs par jour (map dateStr → liste de congés)
  const congesParJour = useMemo(() => {
    const map = new Map();
    congesFiltres.forEach(conge => {
      if (conge.statut === 'refuse' || conge.statut === 'annule') return;

      const debut = new Date(conge.date_debut);
      const fin = new Date(conge.date_fin);

      let current = new Date(debut);
      while (current <= fin) {
        const dateStr = current.toISOString().split('T')[0];
        if (!map.has(dateStr)) map.set(dateStr, []);
        map.get(dateStr).push(conge);
        current.setDate(current.getDate() + 1);
      }
    });
    return map;
  }, [congesFiltres]);

  const getCongesDuJour = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return congesParJour.get(dateStr) || [];
  };

  const couleurType = (type) => {
    const map = {
      annuel: 'bg-primary/70 text-primary-content',
      maladie: 'bg-error/70 text-error-content',
      maternite: 'bg-info/70 text-info-content',
      exceptionnel: 'bg-warning/70 text-warning-content',
    };
    return map[type] || 'bg-base-300 text-base-content';
  };

  const nomMois = (mois) => {
    return new Date(2024, mois, 1).toLocaleDateString('fr-FR', { month: 'long' });
  };

  const allerMoisPrecedent = () => {
    if (moisCalendrier === 0) {
      setMoisCalendrier(11);
      setAnneeCalendrier(a => a - 1);
    } else {
      setMoisCalendrier(m => m - 1);
    }
  };

  const allerMoisSuivant = () => {
    if (moisCalendrier === 11) {
      setMoisCalendrier(0);
      setAnneeCalendrier(a => a + 1);
    } else {
      setMoisCalendrier(m => m + 1);
    }
  };

  const allerAujourdhui = () => {
    setMoisCalendrier(new Date().getMonth());
    setAnneeCalendrier(new Date().getFullYear());
  };

  const estAujourdhui = (date) => {
    const auj = new Date();
    return date.getDate() === auj.getDate() &&
           date.getMonth() === auj.getMonth() &&
           date.getFullYear() === auj.getFullYear();
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

  // ============================================
  // STATISTIQUES
  // ============================================
  const stats = {
    total: conges.length,
    enAttente: conges.filter(c => c.statut === 'en_attente').length,
    valides: conges.filter(c => c.statut === 'valide').length,
    refuses: conges.filter(c => c.statut === 'refuse').length,
    annuel: conges.filter(c => c.type === 'annuel').length,
  };

  const joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="w-full p-6">

      {/* Toast succès */}
      {succes && (
        <div className="fixed top-4 right-4 z-50 alert alert-success shadow-lg max-w-md animate-slideDown">
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
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Congés</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Congés
          </h1>
          <p className="text-base-content/60 mt-1">
            {congesFiltres.length} demande{congesFiltres.length > 1 ? 's' : ''} de congé
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          <Link to="/conges/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle demande
          </Link>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATISTIQUES                                  */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">En attente</p>
              <p className="text-xl font-bold text-warning">{stats.enAttente}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Validés</p>
              <p className="text-xl font-bold text-success">{stats.valides}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Refusés</p>
              <p className="text-xl font-bold text-error">{stats.refuses}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Palmtree className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Annuels</p>
              <p className="text-xl font-bold text-info">{stats.annuel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SÉLECTEUR DE VUE + FILTRES                    */}
      {/* ============================================ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4 space-y-4">

          {/* Sélecteur de vue */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="join">
              <button
                onClick={() => setVueMode('liste')}
                className={`btn btn-sm join-item gap-2 ${vueMode === 'liste' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <List className="w-4 h-4" />
                Vue Liste
              </button>
              <button
                onClick={() => setVueMode('calendrier')}
                className={`btn btn-sm join-item gap-2 ${vueMode === 'calendrier' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Calendrier
              </button>
            </div>

            {/* Raccourcis */}
            <div className="flex flex-wrap gap-2">
              <Link to="/conges/en_attente" className="btn btn-sm btn-warning gap-2">
                <Clock className="w-4 h-4" />
                En attente
                {stats.enAttente > 0 && <span className="badge badge-sm">{stats.enAttente}</span>}
              </Link>
              <Link to="/conges/mes_conges" className="btn btn-sm btn-ghost gap-2">
                <UserCheck className="w-4 h-4" />
                Mes congés
              </Link>
              <Link to="/soldes-conges" className="btn btn-sm btn-ghost gap-2">
                <TrendingUp className="w-4 h-4" />
                Soldes
              </Link>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-base-300">

            {/* Recherche */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, employé, motif..."
                  className="input input-bordered input-sm w-full pl-9 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreEmploye}
              onChange={(e) => setFiltreEmploye(e.target.value)}
            >
              <option value="all">Tous les employés</option>
              {employes.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.prenom} {emp.nom}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="annuel">Annuel</option>
              <option value="maladie">Maladie</option>
              <option value="maternite">Maternité</option>
              <option value="exceptionnel">Exceptionnel</option>
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validés</option>
              <option value="refuse">Refusés</option>
              <option value="annule">Annulés</option>
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreStatut('all');
                setFiltreType('all');
                setFiltreEmploye('all');
                setFiltreAnnee(new Date().getFullYear());
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CONTENU : LISTE ou CALENDRIER                 */}
      {/* ============================================ */}

      {/* ---------- VUE LISTE ---------- */}
      {vueMode === 'liste' && (
        <>
          {congesFiltres.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
              <CalendarDays className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <p className="text-xl text-base-content/60">Aucun congé trouvé</p>
              <p className="text-sm text-base-content/40 mt-2">
                {recherche || filtreStatut !== 'all' || filtreType !== 'all' || filtreEmploye !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez par créer une demande de congé'}
              </p>
              <Link to="/conges/ajouter" className="btn btn-primary mt-4">
                Nouvelle demande
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-200/50 border-b border-base-300">
                      <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">N°</th>
                      <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                      <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                      <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                      <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Jours</th>
                      <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                      <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getElementsPageActuelle().map((conge) => (
                      <tr key={conge.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0">
                        <td>
                          <span className="font-mono text-sm">{conge.numero}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {conge.employe_nom?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {conge.employe_nom || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>{getBadgeType(conge.type)}</td>
                        <td>
                          <div className="text-xs">
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-base-content/40" />
                              {formaterDate(conge.date_debut)}
                            </p>
                            <p className="flex items-center gap-1.5 mt-0.5 text-base-content/50">
                              <span className="w-3"></span>
                              <span>→ {formaterDate(conge.date_fin)}</span>
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ghost badge-sm font-medium">
                            {conge.nombre_jours} j
                          </span>
                        </td>
                        <td>{getBadgeStatut(conge.statut)}</td>
                        <td>
                          <div className="flex justify-end gap-1">
                            {conge.statut === 'en_attente' && (
                              <>
                                <button
                                  onClick={() => ouvrirValidation(conge, 'valider')}
                                  className="btn btn-ghost btn-xs text-success"
                                  title="Valider"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => ouvrirValidation(conge, 'refuser')}
                                  className="btn btn-ghost btn-xs text-error"
                                  title="Refuser"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <Link
                              to={`/conges/${conge.id}`}
                              className="btn btn-ghost btn-xs"
                              title="Voir les détails"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              to={`/conges/${conge.id}/modifier`}
                              className="btn btn-ghost btn-xs"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => {
                                setCongeSelectionne(conge);
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
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-base-content/60">
                    Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                    {Math.min(pageActuelle * elementsParPage, congesFiltres.length)} sur{' '}
                    {congesFiltres.length} congés
                  </p>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => allerPage(pageActuelle - 1)}
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
                          onClick={() => allerPage(numPage)}
                        >
                          {numPage}
                        </button>
                      );
                    })}
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => allerPage(pageActuelle + 1)}
                      disabled={pageActuelle === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ---------- VUE CALENDRIER ---------- */}
      {vueMode === 'calendrier' && (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">

          {/* En-tête du calendrier */}
          <div className="px-5 py-4 border-b border-base-300 bg-base-200/30 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={allerMoisPrecedent}
                className="btn btn-ghost btn-sm btn-circle"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold capitalize min-w-[200px] text-center">
                {nomMois(moisCalendrier)} {anneeCalendrier}
              </h2>
              <button
                onClick={allerMoisSuivant}
                className="btn btn-ghost btn-sm btn-circle"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={allerAujourdhui} className="btn btn-sm btn-ghost">
                Aujourd'hui
              </button>
            </div>

            {/* Légende */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary/70"></span>
                <span className="text-base-content/60">Annuel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-error/70"></span>
                <span className="text-base-content/60">Maladie</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-info/70"></span>
                <span className="text-base-content/60">Maternité</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-warning/70"></span>
                <span className="text-base-content/60">Exceptionnel</span>
              </div>
            </div>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 border-b border-base-300 bg-base-200/20">
            {joursSemaine.map((jour) => (
              <div
                key={jour}
                className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-base-content/60"
              >
                {jour}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7">
            {joursDansMois.map((jour, idx) => {
              const congesDuJour = getCongesDuJour(jour.date);
              const aujourd = estAujourdhui(jour.date);
              const nbConges = congesDuJour.length;

              return (
                <div
                  key={idx}
                  className={`
                    min-h-[110px] border-r border-b border-base-200 last:border-r-0 p-2 transition-colors
                    ${jour.horsMois ? 'bg-base-200/20 text-base-content/30' : 'hover:bg-base-200/30'}
                    ${aujourd ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''}
                  `}
                >
                  {/* Numéro du jour */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`
                      text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center
                      ${aujourd
                        ? 'bg-primary text-primary-content'
                        : jour.horsMois
                        ? 'text-base-content/30'
                        : 'text-base-content/70'
                      }
                    `}>
                      {jour.date.getDate()}
                    </span>
                    {nbConges > 0 && (
                      <span className="badge badge-xs badge-primary">
                        {nbConges}
                      </span>
                    )}
                  </div>

                  {/* Badges des congés */}
                  <div className="space-y-1">
                    {congesDuJour.slice(0, 3).map((conge) => (
                      <Link
                        key={conge.id}
                        to={`/conges/${conge.id}`}
                        className={`
                          block text-[10px] px-1.5 py-0.5 rounded truncate font-medium
                          hover:opacity-80 transition-opacity
                          ${couleurType(conge.type)}
                        `}
                        title={`${conge.employe_nom} — ${conge.type} (${conge.statut})`}
                      >
                        {conge.employe_nom?.split(' ')[0] || '—'}
                      </Link>
                    ))}
                    {congesDuJour.length > 3 && (
                      <div className="text-[10px] text-base-content/50 pl-1.5">
                        +{congesDuJour.length - 3} autre{congesDuJour.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pied du calendrier */}
          <div className="px-5 py-3 border-t border-base-300 bg-base-200/20 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-base-content/50">
              {congesFiltres.filter(c => c.statut !== 'refuse' && c.statut !== 'annule').length} congé(s) affiché(s) dans le calendrier
            </p>
            <p className="text-xs text-base-content/40">
              Cliquez sur un badge pour voir les détails
            </p>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL VALIDATION                              */}
      {/* ============================================ */}
      {showModalValidation && congeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalValidation(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                actionValidation === 'valider' ? 'bg-success/20' : 'bg-error/20'
              }`}>
                {actionValidation === 'valider' ? (
                  <ThumbsUp className="w-8 h-8 text-success" />
                ) : (
                  <ThumbsDown className="w-8 h-8 text-error" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {actionValidation === 'valider' ? 'Valider le congé' : 'Refuser le congé'}
              </h3>
              <p className="text-base-content/60 mb-4">
                {actionValidation === 'valider'
                  ? 'Confirmez-vous la validation du congé de'
                  : 'Confirmez-vous le refus du congé de'}{' '}
                <span className="font-bold">{congeSelectionne.employe_nom}</span> ?
              </p>

              <div className="form-control w-full text-left mb-4">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Commentaire (optionnel)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full focus:textarea-primary"
                  rows="3"
                  value={commentaireValidation}
                  onChange={(e) => setCommentaireValidation(e.target.value)}
                  placeholder={actionValidation === 'valider' ? 'Notes de validation...' : 'Motif du refus...'}
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalValidation(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className={`btn flex-1 ${actionValidation === 'valider' ? 'btn-success' : 'btn-error'}`}
                  onClick={validerConge}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Traitement...
                    </>
                  ) : (
                    actionValidation === 'valider' ? 'Valider' : 'Refuser'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL SUPPRESSION                             */}
      {/* ============================================ */}
      {showModalSuppression && congeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le congé</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer le congé{' '}
                <span className="font-bold font-mono">{congeSelectionne.numero}</span> ?
                <br />
                <span className="text-error text-sm">Cette action est irréversible !</span>
              </p>
              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalSuppression(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-error flex-1"
                  onClick={supprimerConge}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Conges;