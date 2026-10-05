// pages/presences/PresencesAujourdhui.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, Building2, Calendar,
  Users, Clock, UserCheck, UserX, CheckCircle, XCircle,
  AlertTriangle, Sunrise, Sunset, TrendingUp, CalendarDays,
  Fingerprint, Zap, Save, ChevronRight, Download, Printer,
  CheckSquare, XSquare
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const PresencesAujourdhui = () => {
  const navigate = useNavigate();
  const [presences, setPresences] = useState([]);
  const [employesSansPointage, setEmployesSansPointage] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [chargementAction, setChargementAction] = useState(false);
  const [modeSaisieRapide, setModeSaisieRapide] = useState(true);
  const [saisieEnCours, setSaisieEnCours] = useState({});
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');

  const aujourdhui = new Date().toISOString().split('T')[0];
  const dateFormatee = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [presencesRes, empRes] = await Promise.all([
        AxiosInstance.get('/presences/aujourdhui/').catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);

      const presencesData = presencesRes.data.results || presencesRes.data || [];
      const empData = empRes.data.results || empRes.data || [];

      setPresences(presencesData);
      setEmployes(empData.filter(e => e.statut === 'actif'));

      // Identifier les employés sans pointage aujourd'hui
      const employesPresents = new Set(
        presencesData.map(p => String(p.employe))
      );
      const sansPointage = empData
        .filter(e => e.statut === 'actif')
        .filter(e => !employesPresents.has(String(e.id)));

      setEmployesSansPointage(sansPointage);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger les présences du jour');
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // SAISIE RAPIDE
  // ============================================
  const initSaisieRapide = (employe) => {
    setSaisieEnCours(prev => ({
      ...prev,
      [employe.id]: {
        employe: employe.id,
        date: aujourdhui,
        heure_arrivee: new Date().toTimeString().slice(0, 5),
        heure_depart: '',
        statut: 'present',
        motif: '',
      },
    }));
  };

  const annulerSaisie = (employeId) => {
    setSaisieEnCours(prev => {
      const next = { ...prev };
      delete next[employeId];
      return next;
    });
  };

  const handleSaisieChange = (employeId, field, value) => {
    setSaisieEnCours(prev => ({
      ...prev,
      [employeId]: {
        ...prev[employeId],
        [field]: value,
      },
    }));
  };

  const validerSaisie = async (employeId) => {
    const data = saisieEnCours[employeId];
    if (!data) return;

    setChargementAction(true);
    try {
      await AxiosInstance.post('/presences/', data);
      setMessageSucces('Présence enregistrée avec succès !');
      setSucces(true);
      annulerSaisie(employeId);
      await chargerDonnees();
      setTimeout(() => setSucces(false), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================
  // POINTAGE RAPIDE : Marquer tous présents
  // ============================================
  const pointerTousPresents = async () => {
    if (!confirm(`Marquer tous les ${employesSansPointage.length} employés sans pointage comme PRÉSENTS ?`)) return;

    setChargementAction(true);
    try {
      const heureActuelle = new Date().toTimeString().slice(0, 5);
      const promises = employesSansPointage.map(emp =>
        AxiosInstance.post('/presences/', {
          employe: emp.id,
          date: aujourdhui,
          heure_arrivee: heureActuelle,
          statut: 'present',
        }).catch(() => null)
      );

      await Promise.all(promises);
      setMessageSucces(`${employesSansPointage.length} employés pointés présents`);
      setSucces(true);
      await chargerDonnees();
      setTimeout(() => setSucces(false), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors du pointage groupé');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================
  // SUPPRESSION
  // ============================================
  const supprimerPresence = async (presenceId) => {
    if (!confirm('Supprimer cette présence ?')) return;

    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/presences/${presenceId}/`);
      await chargerDonnees();
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================
  // FORMATAGE
  // ============================================
  const formaterHeure = (heureStr) => {
    if (!heureStr) return '—';
    return heureStr.slice(0, 5);
  };

  const getBadgeStatut = (statut) => {
    const configs = {
      present: { label: 'Présent', cls: 'badge-success', icon: CheckCircle },
      absent: { label: 'Absent', cls: 'badge-error', icon: XCircle },
      retard: { label: 'Retard', cls: 'badge-warning', icon: Clock },
      mission: { label: 'Mission', cls: 'badge-info', icon: TrendingUp },
      conge: { label: 'Congé', cls: 'badge-primary', icon: CalendarDays },
      repos: { label: 'Repos', cls: 'badge-ghost', icon: Clock },
      depart_anticipe: { label: 'Départ anticipé', cls: 'badge-warning', icon: Sunset },
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

  // ============================================
  // FILTRES
  // ============================================
  const presencesFiltrees = presences.filter(p => {
    if (recherche) {
      const terme = recherche.toLowerCase();
      const matchNom = p.employe_nom?.toLowerCase().includes(terme);
      const matchMatricule = p.employe_matricule?.toLowerCase().includes(terme);
      if (!matchNom && !matchMatricule) return false;
    }
    if (filtreStatut !== 'all' && p.statut !== filtreStatut) return false;
    return true;
  });

  const employesSansPointageFiltres = employesSansPointage.filter(e => {
    if (!recherche) return true;
    const terme = recherche.toLowerCase();
    return (
      e.nom?.toLowerCase().includes(terme) ||
      e.prenom?.toLowerCase().includes(terme) ||
      e.matricule?.toLowerCase().includes(terme)
    );
  });

  // ============================================
  // STATISTIQUES DU JOUR
  // ============================================
  const stats = {
    total: presences.length,
    presents: presences.filter(p => p.statut === 'present').length,
    absents: presences.filter(p => p.statut === 'absent').length,
    retards: presences.filter(p => p.statut === 'retard').length,
    missions: presences.filter(p => p.statut === 'mission').length,
    sansPointage: employesSansPointage.length,
    totalActifs: employes.length,
  };

  const tauxPresence = stats.totalActifs > 0
    ? Math.round((stats.presents / stats.totalActifs) * 100)
    : 0;

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

  return (
    <div className="w-full p-6">

      {/* MESSAGE SUCCÈS */}
      {succes && (
        <div className="fixed top-4 right-4 z-50 alert alert-success shadow-lg max-w-md animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{messageSucces}</span>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <Link to="/presences" className="hover:text-primary">Présences</Link>
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Aujourd'hui</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Sunrise className="w-8 h-8 text-warning" />
            Présences du jour
          </h1>
          <p className="text-base-content/60 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="capitalize">{dateFormatee}</span>
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
          <button
            onClick={pointerTousPresents}
            className="btn btn-success btn-sm gap-2"
            disabled={chargementAction || employesSansPointage.length === 0}
            title={employesSansPointage.length === 0 ? 'Tous les employés sont pointés' : 'Marquer tous présents'}
          >
            <Zap className="w-4 h-4" />
            Pointer tous présents
            {employesSansPointage.length > 0 && (
              <span className="badge badge-sm">{employesSansPointage.length}</span>
            )}
          </button>
          <Link to="/presences/ajouter" className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle présence
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Présents</p>
              <p className="text-lg font-bold text-success">{stats.presents}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <UserX className="w-4 h-4 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Absents</p>
              <p className="text-lg font-bold text-error">{stats.absents}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Retards</p>
              <p className="text-lg font-bold text-warning">{stats.retards}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Missions</p>
              <p className="text-lg font-bold text-info">{stats.missions}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Non pointés</p>
              <p className="text-lg font-bold text-primary">{stats.sansPointage}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success/10 to-success/5 shadow-sm border border-success/20">
          <div className="card-body p-3">
            <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Taux présence</p>
            <p className="text-lg font-bold text-success">{tauxPresence}%</p>
            <div className="w-full bg-base-300 rounded-full h-1.5 mt-1">
              <div
                className="bg-success h-1.5 rounded-full transition-all"
                style={{ width: `${tauxPresence}%` }}
              ></div>
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
                  placeholder="Rechercher un employé..."
                  className="input input-bordered w-full pl-10 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="present">Présents</option>
              <option value="absent">Absents</option>
              <option value="retard">Retards</option>
              <option value="mission">Missions</option>
              <option value="conge">Congés</option>
              <option value="repos">Repos</option>
              <option value="depart_anticipe">Départs anticipés</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreStatut('all');
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION : EMPLOYÉS SANS POINTAGE              */}
      {/* ============================================ */}
      {employesSansPointageFiltres.length > 0 && (
        <div className="card bg-warning/5 border border-warning/30 shadow-sm mb-6">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b border-warning/20 bg-warning/10 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h2 className="font-semibold text-sm text-warning">
                Employés sans pointage aujourd'hui
              </h2>
              <span className="badge badge-warning badge-sm ml-auto">
                {employesSansPointageFiltres.length}
              </span>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {employesSansPointageFiltres.map((employe) => {
                  const saisie = saisieEnCours[employe.id];
                  const estEnSaisie = !!saisie;

                  return (
                    <div
                      key={employe.id}
                      className={`card bg-base-100 shadow-sm border transition-all ${
                        estEnSaisie ? 'border-primary/40 ring-2 ring-primary/20' : 'border-base-300'
                      }`}
                    >
                      <div className="card-body p-3">
                        {/* En-tête employé */}
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-warning">
                                {employe.prenom?.charAt(0)?.toUpperCase()}
                                {employe.nom?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {employe.prenom} {employe.nom}
                            </p>
                            <p className="text-xs text-base-content/50 font-mono truncate">
                              {employe.matricule}
                            </p>
                          </div>
                        </div>

                        {/* Mode saisie rapide */}
                        {!estEnSaisie ? (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => initSaisieRapide(employe)}
                              className="btn btn-success btn-sm flex-1 gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Pointer
                            </button>
                            <Link
                              to={`/presences/ajouter?employe=${employe.id}&date=${aujourdhui}`}
                              className="btn btn-ghost btn-sm gap-1"
                              title="Saisie détaillée"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {/* Choix statut */}
                            <select
                              className="select select-bordered select-xs w-full"
                              value={saisie.statut}
                              onChange={(e) => handleSaisieChange(employe.id, 'statut', e.target.value)}
                            >
                              <option value="present">Présent</option>
                              <option value="retard">Retard</option>
                              <option value="absent">Absent</option>
                              <option value="mission">Mission</option>
                              <option value="conge">Congé</option>
                              <option value="repos">Repos</option>
                            </select>

                            {/* Heures */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-base-content/50">Arrivée</label>
                                <input
                                  type="time"
                                  className="input input-bordered input-xs w-full"
                                  value={saisie.heure_arrivee}
                                  onChange={(e) => handleSaisieChange(employe.id, 'heure_arrivee', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-base-content/50">Départ</label>
                                <input
                                  type="time"
                                  className="input input-bordered input-xs w-full"
                                  value={saisie.heure_depart}
                                  onChange={(e) => handleSaisieChange(employe.id, 'heure_depart', e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => validerSaisie(employe.id)}
                                className="btn btn-success btn-xs flex-1 gap-1"
                                disabled={chargementAction}
                              >
                                {chargementAction ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                                Valider
                              </button>
                              <button
                                onClick={() => annulerSaisie(employe.id)}
                                className="btn btn-ghost btn-xs"
                                disabled={chargementAction}
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION : PRÉSENCES ENREGISTRÉES              */}
      {/* ============================================ */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-0">
          <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <h2 className="font-semibold text-sm">Présences enregistrées aujourd'hui</h2>
            <span className="badge badge-success badge-sm ml-auto">
              {presencesFiltrees.length}
            </span>
          </div>

          {presencesFiltrees.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
              <p className="text-lg text-base-content/60">Aucune présence enregistrée</p>
              <p className="text-sm text-base-content/40 mt-2">
                Utilisez la section "Employés sans pointage" ci-dessus pour pointer rapidement
              </p>
              <Link to="/presences/ajouter" className="btn btn-primary mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle présence
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-base-200/30 border-b border-base-300">
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Arrivée</th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Départ</th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Heures</th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Motif</th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {presencesFiltrees.map((presence) => (
                    <tr
                      key={presence.id}
                      className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {presence.employe_nom?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {presence.employe_nom || '—'}
                            </p>
                            {presence.employe_matricule && (
                              <p className="text-xs text-base-content/40 font-mono">
                                {presence.employe_matricule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Sunrise className="w-3.5 h-3.5 text-info" />
                          <span className="font-mono">{formaterHeure(presence.heure_arrivee)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Sunset className="w-3.5 h-3.5 text-warning" />
                          <span className="font-mono">{formaterHeure(presence.heure_depart)}</span>
                        </div>
                      </td>
                      <td>
                        {presence.heures_travaillees > 0 ? (
                          <span className="text-sm font-medium text-success">
                            {Number(presence.heures_travaillees).toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-base-content/30 text-sm">—</span>
                        )}
                      </td>
                      <td>{getBadgeStatut(presence.statut)}</td>
                      <td>
                        {presence.motif ? (
                          <span className="text-xs text-base-content/60 line-clamp-1 max-w-[200px]" title={presence.motif}>
                            {presence.motif}
                          </span>
                        ) : (
                          <span className="text-base-content/30 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/presences/${presence.id}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/presences/${presence.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => supprimerPresence(presence.id)}
                            className="btn btn-ghost btn-xs text-error"
                            title="Supprimer"
                            disabled={chargementAction}
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
          )}
        </div>
      </div>

      {/* Pied de page : actions secondaires */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
        <div className="flex items-center gap-2 text-sm text-base-content/50">
          <Calendar className="w-4 h-4" />
          <span>Données du <span className="capitalize font-medium">{dateFormatee}</span></span>
        </div>
        <div className="flex gap-2">
          <Link to="/presences" className="btn btn-ghost btn-sm gap-2">
            <Clock className="w-4 h-4" />
            Historique complet
          </Link>
          <Link to="/pointage" className="btn btn-ghost btn-sm gap-2">
            <Fingerprint className="w-4 h-4" />
            Pointage terrain
          </Link>
        </div>
      </div>

      {/* Animation */}
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

export default PresencesAujourdhui;