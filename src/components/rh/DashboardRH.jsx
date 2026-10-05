// pages/dashboard/DashboardRH.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, CalendarDays,
  Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp,
  TrendingDown, Award, BookOpen, Calculator, DollarSign,
  ArrowRight, Plus, Eye, FileText, UserCheck, UserX,
  AlertCircle, RefreshCw, Loader2, Sparkles, Target,
  PieChart, BarChart3, Activity, Calendar, User,
  Bell, ChevronRight, Palmtree, GraduationCap, ClipboardCheck,
  Timer, BadgeCheck, Hash, Zap,
  Info  
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const DashboardRH = () => {
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // États des données
  const [employes, setEmployes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [postes, setPostes] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [conges, setConges] = useState([]);
  const [congesEnAttente, setCongesEnAttente] = useState([]);
  const [presencesAujourdhui, setPresencesAujourdhui] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [formations, setFormations] = useState([]);
  const [soldesConges, setSoldesConges] = useState([]);

  useEffect(() => {
    chargerDonnees();
  }, [refresh]);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const annee = new Date().getFullYear();

      const [
        empRes, depRes, posRes, contratsRes,
        congesRes, congesAttenteRes,
        presencesRes, absencesRes,
        evalRes, formRes, soldesRes
      ] = await Promise.all([
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
        AxiosInstance.get('/departements/').catch(() => ({ data: [] })),
        AxiosInstance.get('/postes/').catch(() => ({ data: [] })),
        AxiosInstance.get('/contrats/').catch(() => ({ data: [] })),
        AxiosInstance.get('/conges/').catch(() => ({ data: [] })),
        AxiosInstance.get('/conges/en_attente/').catch(() => ({ data: [] })),
        AxiosInstance.get('/presences/aujourdhui/').catch(() => ({ data: [] })),
        AxiosInstance.get('/absences/').catch(() => ({ data: [] })),
        AxiosInstance.get('/evaluations/').catch(() => ({ data: [] })),
        AxiosInstance.get('/formations/').catch(() => ({ data: [] })),
        AxiosInstance.get(`/soldes-conges/?annee=${annee}`).catch(() => ({ data: [] })),
      ]);

      setEmployes(empRes.data.results || empRes.data || []);
      setDepartements(depRes.data.results || depRes.data || []);
      setPostes(posRes.data.results || posRes.data || []);
      setContrats(contratsRes.data.results || contratsRes.data || []);
      setConges(congesRes.data.results || congesRes.data || []);
      setCongesEnAttente(congesAttenteRes.data.results || congesAttenteRes.data || []);
      setPresencesAujourdhui(presencesRes.data.results || presencesRes.data || []);
      setAbsences(absencesRes.data.results || absencesRes.data || []);
      setEvaluations(evalRes.data.results || evalRes.data || []);
      setFormations(formRes.data.results || formRes.data || []);
      setSoldesConges(soldesRes.data.results || soldesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setErreur('Impossible de charger les données du tableau de bord');
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // STATISTIQUES CALCULÉES
  // ============================================
  const stats = useMemo(() => {
    const aujourd = new Date();
    const annee = aujourd.getFullYear();

    // Employés
    const employesActifs = employes.filter(e => e.statut === 'actif');
    const employesSuspendus = employes.filter(e => e.statut === 'suspendu');
    const employesPartis = employes.filter(e => e.statut === 'parti');
    const employesFemmes = employesActifs.filter(e => e.sexe === 'F');
    const employesHommes = employesActifs.filter(e => e.sexe === 'M');

    // Contrats
    const contratsActifs = contrats.filter(c => c.statut === 'actif');
    const contratsExpirant30j = contrats.filter(c => {
      if (c.statut !== 'actif' || !c.date_fin) return false;
      const diff = Math.ceil((new Date(c.date_fin) - aujourd) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    });
    const contratsExpires = contrats.filter(c => {
      if (c.statut !== 'actif' || !c.date_fin) return false;
      return new Date(c.date_fin) < aujourd;
    });

    const cdi = contratsActifs.filter(c => c.type === 'CDI').length;
    const cdd = contratsActifs.filter(c => c.type === 'CDD').length;
    const stage = contratsActifs.filter(c => c.type === 'STAGE').length;
    const temporaire = contratsActifs.filter(c => c.type === 'TEMPORAIRE').length;

    // Congés
    const congesEnAttenteCount = congesEnAttente.length;
    const congesValidesCetteAnnee = conges.filter(c =>
      c.statut === 'valide' && c.date_debut?.startsWith(String(annee))
    );
    const congesValidesMois = conges.filter(c => {
      if (c.statut !== 'valide') return false;
      const date = new Date(c.date_debut);
      return date.getMonth() === aujourd.getMonth() && date.getFullYear() === aujourd.getFullYear();
    });

    // Présences du jour
    const presentsAujourdhui = presencesAujourdhui.filter(p => p.statut === 'present');
    const absentsAujourdhui = presencesAujourdhui.filter(p => p.statut === 'absent');
    const retardsAujourdhui = presencesAujourdhui.filter(p => p.statut === 'retard');
    const missionsAujourdhui = presencesAujourdhui.filter(p => p.statut === 'mission');
    const tauxPresenceJour = employesActifs.length > 0
      ? Math.round((presentsAujourdhui.length / employesActifs.length) * 100)
      : 0;

    // Absences
    const absencesEnAttente = absences.filter(a => a.statut === 'en_attente');
    const absencesMois = absences.filter(a => {
      const date = new Date(a.date_debut);
      return date.getMonth() === aujourd.getMonth() && date.getFullYear() === aujourd.getFullYear();
    });

    // Évaluations
    const notes = evaluations.map(e => Number(e.note_globale)).filter(n => !isNaN(n));
    const moyenneNotes = notes.length > 0
      ? notes.reduce((a, b) => a + b, 0) / notes.length
      : 0;
    const evaluationsExcellent = evaluations.filter(e => Number(e.note_globale) >= 16).length;
    const evaluationsFaibles = evaluations.filter(e => Number(e.note_globale) < 8).length;

    // Formations
    const formationsAVenir = formations.filter(f => new Date(f.date_debut) > aujourd);
    const formationsEnCours = formations.filter(f => {
      const debut = new Date(f.date_debut);
      const fin = new Date(f.date_fin);
      return debut <= aujourd && aujourd <= fin;
    });
    const formationsTerminees = formations.filter(f => new Date(f.date_fin) < aujourd);
    const coutFormationsAnnee = formations.reduce((acc, f) => acc + Number(f.cout || 0), 0);

    // Soldes de congés
    const soldesFaibles = soldesConges.filter(s => {
      const r = Number(s.solde_restant);
      return r > 0 && r <= 5;
    });
    const soldesEpuises = soldesConges.filter(s => Number(s.solde_restant) <= 0);

    // Ancienneté moyenne
    const anciennetes = employesActifs
      .map(e => e.anciennete_annees)
      .filter(a => typeof a === 'number' && a >= 0);
    const ancienneteMoyenne = anciennetes.length > 0
      ? anciennetes.reduce((a, b) => a + b, 0) / anciennetes.length
      : 0;

    return {
      // Employés
      totalEmployes: employes.length,
      employesActifs: employesActifs.length,
      employesSuspendus: employesSuspendus.length,
      employesPartis: employesPartis.length,
      employesFemmes: employesFemmes.length,
      employesHommes: employesHommes.length,
      totalDepartements: departements.length,
      totalPostes: postes.length,

      // Contrats
      contratsActifs: contratsActifs.length,
      contratsExpirant30j: contratsExpirant30j.length,
      contratsExpires: contratsExpires.length,
      cdi, cdd, stage, temporaire,

      // Congés
      congesEnAttente: congesEnAttenteCount,
      congesValidesAnnee: congesValidesCetteAnnee.length,
      congesValidesMois: congesValidesMois.length,

      // Présences
      presentsAujourdhui: presentsAujourdhui.length,
      absentsAujourdhui: absentsAujourdhui.length,
      retardsAujourdhui: retardsAujourdhui.length,
      missionsAujourdhui: missionsAujourdhui.length,
      tauxPresenceJour,

      // Absences
      absencesEnAttente: absencesEnAttente.length,
      absencesMois: absencesMois.length,

      // Évaluations
      totalEvaluations: evaluations.length,
      moyenneNotes: moyenneNotes.toFixed(1),
      evaluationsExcellent,
      evaluationsFaibles,

      // Formations
      totalFormations: formations.length,
      formationsAVenir: formationsAVenir.length,
      formationsEnCours: formationsEnCours.length,
      formationsTerminees: formationsTerminees.length,
      coutFormationsAnnee,

      // Soldes
      soldesFaibles: soldesFaibles.length,
      soldesEpuises: soldesEpuises.length,

      // Ancienneté
      ancienneteMoyenne: ancienneteMoyenne.toFixed(1),
    };
  }, [employes, departements, postes, contrats, conges, congesEnAttente, presencesAujourdhui, absences, evaluations, formations, soldesConges]);

  // Top 5 départements par effectif
  const topDepartements = useMemo(() => {
    const map = {};
    employes.filter(e => e.statut === 'actif').forEach(e => {
      const nom = e.departement_nom || 'Non affecté';
      map[nom] = (map[nom] || 0) + 1;
    });
    return Object.entries(map)
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [employes]);

  // Répartition contrats
  const repartitionContrats = useMemo(() => {
    return [
      { label: 'CDI', value: stats.cdi, color: 'bg-primary' },
      { label: 'CDD', value: stats.cdd, color: 'bg-info' },
      { label: 'Stage', value: stats.stage, color: 'bg-warning' },
      { label: 'Temporaire', value: stats.temporaire, color: 'bg-base-content/40' },
    ];
  }, [stats]);

  // Alertes actives
  const alertes = useMemo(() => {
    const liste = [];
    if (stats.contratsExpirant30j > 0) {
      liste.push({
        type: 'warning',
        icon: AlertTriangle,
        titre: `${stats.contratsExpirant30j} contrat(s) expirant`,
        message: 'Expirent dans les 30 prochains jours',
        lien: '/contrats/expirant',
      });
    }
    if (stats.congesEnAttente > 0) {
      liste.push({
        type: 'warning',
        icon: Clock,
        titre: `${stats.congesEnAttente} demande(s) de congé en attente`,
        message: 'À valider ou refuser',
        lien: '/conges/en_attente',
      });
    }
    if (stats.absencesEnAttente > 0) {
      liste.push({
        type: 'info',
        icon: AlertCircle,
        titre: `${stats.absencesEnAttente} absence(s) à traiter`,
        message: 'En attente de validation',
        lien: '/absences',
      });
    }
    if (stats.soldesEpuises > 0) {
      liste.push({
        type: 'error',
        icon: AlertCircle,
        titre: `${stats.soldesEpuises} solde(s) épuisé(s)`,
        message: 'Employés sans congés disponibles',
        lien: '/soldes-conges',
      });
    }
    if (stats.contratsExpires > 0) {
      liste.push({
        type: 'error',
        icon: XCircle,
        titre: `${stats.contratsExpires} contrat(s) expiré(s)`,
        message: 'À renouveler ou clôturer',
        lien: '/contrats',
      });
    }
    return liste;
  }, [stats]);

  // ============================================
  // CHARGEMENT / ERREUR
  // ============================================
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-base-content/50">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={() => setRefresh(!refresh)} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full p-6">

      {/* ============================================ */}
      {/* EN-TÊTE                                       */}
      {/* ============================================ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Tableau de bord</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Tableau de bord RH
          </h1>
          <p className="text-base-content/60 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="capitalize">{dateAujourdhui}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRefresh(!refresh)}
            className="btn btn-ghost btn-sm gap-2"
            disabled={chargement}
          >
            <RefreshCw className={`w-4 h-4 ${chargement ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          <Link to="/employes/ajouter" className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" />
            Nouvel employé
          </Link>
        </div>
      </div>

      {/* ============================================ */}
      {/* BANDEAU D'ALERTES                             */}
      {/* ============================================ */}
      {alertes.length > 0 && (
        <div className="w-full mb-6">
          <div className="card bg-warning/5 border border-warning/20 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-warning" />
                <h3 className="font-semibold text-sm text-warning">
                  {alertes.length} alerte{alertes.length > 1 ? 's' : ''} en cours
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {alertes.map((alerte, idx) => {
                  const Icon = alerte.icon;
                  return (
                    <Link
                      key={idx}
                      to={alerte.lien}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:shadow-sm ${
                        alerte.type === 'error' ? 'bg-error/5 border border-error/20' :
                        alerte.type === 'warning' ? 'bg-warning/5 border border-warning/20' :
                        'bg-info/5 border border-info/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        alerte.type === 'error' ? 'bg-error/10 text-error' :
                        alerte.type === 'warning' ? 'bg-warning/10 text-warning' :
                        'bg-info/10 text-info'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alerte.titre}</p>
                        <p className="text-xs text-base-content/60 truncate">{alerte.message}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-base-content/30 flex-shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* KPIs PRINCIPAUX                               */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Effectif total */}
        <Link to="/employes" className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-all">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className="text-xs text-base-content/50 uppercase tracking-wider">Employés actifs</p>
            <p className="text-3xl font-bold text-primary">{stats.employesActifs}</p>
            <p className="text-xs text-base-content/40 mt-1">
              sur {stats.totalEmployes} total
            </p>
          </div>
        </Link>

        {/* Taux présence */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-success" />
              </div>
              <span className={`badge badge-sm ${
                stats.tauxPresenceJour >= 90 ? 'badge-success' :
                stats.tauxPresenceJour >= 75 ? 'badge-info' : 'badge-warning'
              }`}>
                {stats.tauxPresenceJour}%
              </span>
            </div>
            <p className="text-xs text-base-content/50 uppercase tracking-wider">Présents aujourd'hui</p>
            <p className="text-3xl font-bold text-success">{stats.presentsAujourdhui}</p>
            <div className="w-full bg-base-300 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  stats.tauxPresenceJour >= 90 ? 'bg-success' :
                  stats.tauxPresenceJour >= 75 ? 'bg-info' : 'bg-warning'
                }`}
                style={{ width: `${stats.tauxPresenceJour}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Congés en attente */}
        <Link to="/conges/en_attente" className={`card shadow-sm border hover:shadow-md transition-all ${
          stats.congesEnAttente > 0 ? 'bg-warning/5 border-warning/30' : 'bg-base-100 border-base-300'
        }`}>
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stats.congesEnAttente > 0 ? 'bg-warning/10' : 'bg-base-200'
              }`}>
                <Clock className={`w-5 h-5 ${stats.congesEnAttente > 0 ? 'text-warning' : 'text-base-content/40'}`} />
              </div>
              {stats.congesEnAttente > 0 && (
                <span className="badge badge-warning badge-sm animate-pulse">
                  À traiter
                </span>
              )}
            </div>
            <p className="text-xs text-base-content/50 uppercase tracking-wider">Congés en attente</p>
            <p className={`text-3xl font-bold ${stats.congesEnAttente > 0 ? 'text-warning' : 'text-base-content/40'}`}>
              {stats.congesEnAttente}
            </p>
            <p className="text-xs text-base-content/40 mt-1">
              {stats.congesValidesMois} validé(s) ce mois
            </p>
          </div>
        </Link>

        {/* Contrats expirant */}
        <Link to="/contrats/expirant" className={`card shadow-sm border hover:shadow-md transition-all ${
          stats.contratsExpirant30j > 0 ? 'bg-error/5 border-error/30' : 'bg-base-100 border-base-300'
        }`}>
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stats.contratsExpirant30j > 0 ? 'bg-error/10' : 'bg-base-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${stats.contratsExpirant30j > 0 ? 'text-error' : 'text-base-content/40'}`} />
              </div>
              {stats.contratsExpirant30j > 0 && (
                <span className="badge badge-error badge-sm">Urgent</span>
              )}
            </div>
            <p className="text-xs text-base-content/50 uppercase tracking-wider">Contrats expirant</p>
            <p className={`text-3xl font-bold ${stats.contratsExpirant30j > 0 ? 'text-error' : 'text-base-content/40'}`}>
              {stats.contratsExpirant30j}
            </p>
            <p className="text-xs text-base-content/40 mt-1">
              Dans les 30 jours
            </p>
          </div>
        </Link>
      </div>

      {/* ============================================ */}
      {/* LIGNE 2 : PRÉSENCES + RÉPARTITION CONTRATS    */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Présences du jour */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Présences du jour</h3>
              </div>
              <Link to="/presences/aujourdhui" className="btn btn-ghost btn-xs gap-1">
                Voir détails
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
                <UserCheck className="w-6 h-6 text-success mx-auto mb-1" />
                <p className="text-2xl font-bold text-success">{stats.presentsAujourdhui}</p>
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Présents</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-error/5 border border-error/20">
                <UserX className="w-6 h-6 text-error mx-auto mb-1" />
                <p className="text-2xl font-bold text-error">{stats.absentsAujourdhui}</p>
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Absents</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
                <Clock className="w-6 h-6 text-warning mx-auto mb-1" />
                <p className="text-2xl font-bold text-warning">{stats.retardsAujourdhui}</p>
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Retards</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-info/5 border border-info/20">
                <TrendingUp className="w-6 h-6 text-info mx-auto mb-1" />
                <p className="text-2xl font-bold text-info">{stats.missionsAujourdhui}</p>
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Missions</p>
              </div>
            </div>

            {/* Barre de progression globale */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-base-content/60">Taux de présence global</span>
                <span className={`text-sm font-bold ${
                  stats.tauxPresenceJour >= 90 ? 'text-success' :
                  stats.tauxPresenceJour >= 75 ? 'text-info' : 'text-warning'
                }`}>
                  {stats.tauxPresenceJour}%
                </span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    stats.tauxPresenceJour >= 90 ? 'bg-success' :
                    stats.tauxPresenceJour >= 75 ? 'bg-info' : 'bg-warning'
                  }`}
                  style={{ width: `${stats.tauxPresenceJour}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Répartition des contrats */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm">Répartition contrats</h3>
            </div>

            <div className="space-y-3">
              {repartitionContrats.map((item) => {
                const total = repartitionContrats.reduce((a, b) => a + b.value, 0);
                const pourcentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-base-content/70">{item.label}</span>
                      <span className="text-xs font-bold">
                        {item.value} <span className="text-base-content/40">({pourcentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${item.color}`}
                        style={{ width: `${pourcentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="divider my-3"></div>

            <Link to="/contrats" className="btn btn-ghost btn-sm w-full gap-2">
              <Eye className="w-4 h-4" />
              Voir tous les contrats
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LIGNE 3 : TOP DÉPARTEMENTS + STATS RAPIDES    */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Top départements */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-info" />
                <h3 className="font-bold">Effectifs par département</h3>
              </div>
              <Link to="/departements" className="btn btn-ghost btn-xs gap-1">
                Voir tous
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {topDepartements.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-base-content/20 mx-auto mb-2" />
                <p className="text-sm text-base-content/50">Aucun département</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topDepartements.map((dep, idx) => {
                  const maxEffectif = topDepartements[0].count;
                  const pourcentage = (dep.count / maxEffectif) * 100;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        idx === 0 ? 'bg-warning/10 text-warning' :
                        idx === 1 ? 'bg-base-content/10 text-base-content/60' :
                        idx === 2 ? 'bg-orange-500/10 text-orange-500' :
                        'bg-base-200 text-base-content/40'
                      }`}>
                        <span className="text-xs font-bold">#{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{dep.nom}</span>
                          <span className="text-sm font-bold text-primary ml-2">
                            {dep.count}
                          </span>
                        </div>
                        <div className="w-full bg-base-300 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              idx === 0 ? 'bg-primary' :
                              idx === 1 ? 'bg-info' :
                              idx === 2 ? 'bg-warning' : 'bg-base-content/40'
                            }`}
                            style={{ width: `${pourcentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ancienneté + genre */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-info" />
              <h3 className="font-bold text-sm">Analyse démographique</h3>
            </div>

            {/* Ancienneté */}
            <div className="stat p-3 rounded-lg bg-info/5 border border-info/20">
              <div className="stat-title text-xs">Ancienneté moyenne</div>
              <div className="stat-value text-2xl text-info">
                {stats.ancienneteMoyenne} <span className="text-sm">ans</span>
              </div>
            </div>

            {/* Répartition genre */}
            <div className="divider my-2"></div>
            <p className="text-xs text-base-content/50 uppercase tracking-wider mb-3">
              Répartition par genre
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{stats.employesHommes}</p>
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Hommes</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-info/5 border border-info/20">
                <p className="text-2xl font-bold text-info">{stats.employesFemmes}</p>
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Femmes</p>
              </div>
            </div>

            {/* Statut */}
            <div className="divider my-2"></div>
            <p className="text-xs text-base-content/50 uppercase tracking-wider mb-2">
              Statut employés
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  Actifs
                </span>
                <span className="font-bold">{stats.employesActifs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning"></span>
                  Suspendus
                </span>
                <span className="font-bold">{stats.employesSuspendus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-base-content/40"></span>
                  Partis
                </span>
                <span className="font-bold">{stats.employesPartis}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LIGNE 4 : ÉVALUATIONS + FORMATIONS            */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Évaluations */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-warning" />
                <h3 className="font-bold text-sm">Évaluations</h3>
              </div>
              <Link to="/evaluations" className="btn btn-ghost btn-xs gap-1">
                Voir
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                Number(stats.moyenneNotes) >= 16 ? 'bg-success/10' :
                Number(stats.moyenneNotes) >= 12 ? 'bg-info/10' :
                Number(stats.moyenneNotes) >= 8 ? 'bg-warning/10' : 'bg-error/10'
              }`}>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${
                    Number(stats.moyenneNotes) >= 16 ? 'text-success' :
                    Number(stats.moyenneNotes) >= 12 ? 'text-info' :
                    Number(stats.moyenneNotes) >= 8 ? 'text-warning' : 'text-error'
                  }`}>
                    {stats.moyenneNotes}
                  </p>
                  <p className="text-[10px] text-base-content/50">/20</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-base-content/50 uppercase tracking-wider mb-1">
                  Moyenne globale
                </p>
                <p className="text-sm text-base-content/70">
                  Sur {stats.totalEvaluations} évaluation{stats.totalEvaluations > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-success/5 border border-success/20 text-center">
                <p className="text-lg font-bold text-success">{stats.evaluationsExcellent}</p>
                <p className="text-[10px] text-base-content/50">Excellent</p>
              </div>
              <div className="p-2 rounded-lg bg-error/5 border border-error/20 text-center">
                <p className="text-lg font-bold text-error">{stats.evaluationsFaibles}</p>
                <p className="text-[10px] text-base-content/50">Faible</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formations */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm">Formations</h3>
              </div>
              <Link to="/formations" className="btn btn-ghost btn-xs gap-1">
                Voir
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-info/5 border border-info/20 text-center">
                <Clock className="w-4 h-4 text-info mx-auto mb-1" />
                <p className="text-lg font-bold text-info">{stats.formationsAVenir}</p>
                <p className="text-[10px] text-base-content/50">À venir</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/5 border border-warning/20 text-center">
                <Sparkles className="w-4 h-4 text-warning mx-auto mb-1" />
                <p className="text-lg font-bold text-warning">{stats.formationsEnCours}</p>
                <p className="text-[10px] text-base-content/50">En cours</p>
              </div>
              <div className="p-2 rounded-lg bg-success/5 border border-success/20 text-center">
                <CheckCircle className="w-4 h-4 text-success mx-auto mb-1" />
                <p className="text-lg font-bold text-success">{stats.formationsTerminees}</p>
                <p className="text-[10px] text-base-content/50">Terminées</p>
              </div>
            </div>

            <div className="stat p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="stat-title text-xs">Coût total formations</div>
              <div className="stat-value text-xl text-primary">
                {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(stats.coutFormationsAnnee)} GNF
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* RACCOURCIS RAPIDES                            */}
      {/* ============================================ */}
      <div className="w-full">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm">Actions rapides</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link
                to="/employes/ajouter"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-center"
              >
                <Users className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium">Nouvel employé</span>
              </Link>

              <Link
                to="/contrats/ajouter"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-base-300 hover:border-info hover:bg-info/5 transition-all text-center"
              >
                <FileText className="w-6 h-6 text-info" />
                <span className="text-xs font-medium">Nouveau contrat</span>
              </Link>

              <Link
                to="/conges/ajouter"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-base-300 hover:border-warning hover:bg-warning/5 transition-all text-center"
              >
                <Palmtree className="w-6 h-6 text-warning" />
                <span className="text-xs font-medium">Demande congé</span>
              </Link>

              <Link
                to="/presences/ajouter"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-base-300 hover:border-success hover:bg-success/5 transition-all text-center"
              >
                <ClipboardCheck className="w-6 h-6 text-success" />
                <span className="text-xs font-medium">Pointer présence</span>
              </Link>

              <Link
                to="/evaluations/ajouter"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-base-300 hover:border-error hover:bg-error/5 transition-all text-center"
              >
                <Award className="w-6 h-6 text-error" />
                <span className="text-xs font-medium">Nouvelle évaluation</span>
              </Link>

              <Link
                to="/formations/ajouter"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-center"
              >
                <BookOpen className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium">Nouvelle formation</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FOOTER INFORMATIF                             */}
      {/* ============================================ */}
      <div className="w-full mt-6">
        <div className="p-4 rounded-lg bg-info/5 border border-info/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm text-base-content/70 leading-relaxed">
            <p className="font-semibold text-info mb-1">Bienvenue sur votre tableau de bord RH</p>
            <p className="text-xs">
              Ce tableau de bord vous donne une vue d'ensemble du service RH.
              Utilisez les <strong>alertes</strong> pour prioriser les actions urgentes,
              et les <strong>raccourcis rapides</strong> pour accéder aux tâches fréquentes.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardRH;