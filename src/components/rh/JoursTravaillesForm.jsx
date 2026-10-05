// pages/jours-travailles/JoursTravaillesForm.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Save, Edit, Loader2, AlertCircle,
  CheckCircle, Plus, Info, Building2, Users, Calendar,
  Calculator, Target, UserCheck, UserX, TrendingUp, Zap,
  RefreshCw, Eye, Filter, Search, CheckSquare, XSquare,
  BarChart3, Printer, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const JoursTravaillesForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');

  // Filtres
  const aujourdHui = new Date();
  const [mois, setMois] = useState(
    Number(searchParams.get('mois')) || aujourdHui.getMonth() + 1
  );
  const [annee, setAnnee] = useState(
    Number(searchParams.get('annee')) || aujourdHui.getFullYear()
  );
  const [filtreDepartement, setFiltreDepartement] = useState('all');
  const [recherche, setRecherche] = useState('');

  // Données
  const [employes, setEmployes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [joursExistants, setJoursExistants] = useState({});

  // Formulaire
  const [saisie, setSaisie] = useState({});

  // ============================================
  // ✅ DÉCLARATION 1 : jours ouvrés du mois (useMemo)
  // ============================================
  const joursTheoriquesMois = useMemo(() => {
    const fin = new Date(annee, mois, 0);
    let jours = 0;
    for (let d = 1; d <= fin.getDate(); d++) {
      const jour = new Date(annee, mois - 1, d);
      const dayOfWeek = jour.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) jours++;
    }
    return jours;
  }, [mois, annee]);

  // ============================================
  // ✅ DÉCLARATION 2 : employés filtrés (useMemo)
  // ============================================
  const employesFiltres = useMemo(() => {
    return employes.filter(emp => {
      if (recherche) {
        const terme = recherche.toLowerCase();
        const match =
          emp.nom?.toLowerCase().includes(terme) ||
          emp.prenom?.toLowerCase().includes(terme) ||
          emp.matricule?.toLowerCase().includes(terme);
        if (!match) return false;
      }
      if (filtreDepartement !== 'all') {
        if (String(emp.departement) !== String(filtreDepartement)) return false;
      }
      return true;
    });
  }, [employes, recherche, filtreDepartement]);

  // ============================================
  // ✅ DÉCLARATION 3 : initialiserSaisie (useCallback)
  // ============================================
  const initialiserSaisie = useCallback((existants = {}, emps = [], theoriques = 0) => {
    const nouvelle = {};
    emps.forEach(emp => {
      const existant = existants[String(emp.id)];
      if (existant) {
        nouvelle[emp.id] = {
          employe: emp.id,
          jours_theoriques: existant.jours_theoriques ?? theoriques,
          jours_presents: existant.jours_presents ?? 0,
          absences_non_justifiees: existant.absences_non_justifiees ?? 0,
          jours_travailles: existant.jours_travailles ?? 0,
          commentaire: existant.commentaire || '',
          dejaEnregistre: true,
          id: existant.id,
        };
      } else {
        nouvelle[emp.id] = {
          employe: emp.id,
          jours_theoriques: theoriques,
          jours_presents: theoriques,
          absences_non_justifiees: 0,
          jours_travailles: theoriques,
          commentaire: '',
          dejaEnregistre: false,
          id: null,
        };
      }
    });
    return nouvelle;
  }, []);

  // ============================================
  // ✅ DÉCLARATION 4 : statistiques de saisie (useMemo)
  // ============================================
  const statsSaisie = useMemo(() => {
    let totalTheoriques = 0;
    let totalPresents = 0;
    let totalAbsences = 0;
    let totalTravailles = 0;
    let nbDejaEnregistres = 0;
    let nbNouveaux = 0;

    employesFiltres.forEach(emp => {
      const s = saisie[emp.id];
      if (!s) return;

      totalTheoriques += Number(s.jours_theoriques) || 0;
      totalPresents += Number(s.jours_presents) || 0;
      totalAbsences += Number(s.absences_non_justifiees) || 0;
      totalTravailles += Number(s.jours_travailles) || 0;

      if (s.dejaEnregistre) nbDejaEnregistres++;
      else nbNouveaux++;
    });

    const taux = totalTheoriques > 0
      ? Math.round((totalPresents / totalTheoriques) * 100)
      : 0;

    return {
      totalTheoriques,
      totalPresents,
      totalAbsences,
      totalTravailles,
      taux,
      nbDejaEnregistres,
      nbNouveaux,
    };
  }, [saisie, employesFiltres]);

  // ============================================
  // EFFET 1 : charger données de référence
  // ============================================
  useEffect(() => {
    const chargerReference = async () => {
      try {
        const [empRes, depRes] = await Promise.all([
          AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
          AxiosInstance.get('/departements/').catch(() => ({ data: [] })),
        ]);

        const empData = empRes.data.results || empRes.data || [];
        const depData = depRes.data.results || depRes.data || [];

        setEmployes(empData.filter(e => e.statut === 'actif'));
        setDepartements(depData);
      } catch (err) {
        console.error('Erreur:', err);
        setErreur('Impossible de charger les données de référence');
      } finally {
        setChargementInitial(false);
      }
    };
    chargerReference();
  }, []);

  // ============================================
  // EFFET 2 : charger jours existants quand mois/année change
  // ============================================
  useEffect(() => {
    if (chargementInitial) return;

    const chargerJours = async () => {
      setChargement(true);
      try {
        const res = await AxiosInstance.get(
          `/jours-travailles/?mois=${mois}&annee=${annee}`
        );
        const data = res.data.results || res.data || [];

        const map = {};
        data.forEach(j => {
          map[String(j.employe)] = j;
        });
        setJoursExistants(map);
      } catch (err) {
        console.error('Erreur:', err);
        setJoursExistants({});
      } finally {
        setChargement(false);
      }
    };
    chargerJours();
  }, [mois, annee, chargementInitial]);

  // ============================================
  // EFFET 3 : initialiser la saisie quand les données sont prêtes
  // ============================================
  useEffect(() => {
    if (employes.length > 0) {
      const nouvelleSaisie = initialiserSaisie(
        joursExistants,
        employes,
        joursTheoriquesMois
      );
      setSaisie(nouvelleSaisie);
    }
  }, [employes, joursExistants, joursTheoriquesMois, initialiserSaisie]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleChange = (employeId, field, value) => {
    setSaisie(prev => {
      const updated = {
        ...prev,
        [employeId]: {
          ...prev[employeId],
          [field]: value,
        },
      };

      const emp = updated[employeId];
      const presents = Number(emp.jours_presents) || 0;
      const absences = Number(emp.absences_non_justifiees) || 0;
      updated[employeId].jours_travailles = Math.max(0, presents - absences);

      return updated;
    });
  };

  const appliquerATous = (field, value) => {
    if (!confirm(`Appliquer la valeur ${value} à ${employesFiltres.length} employé(s) filtré(s) ?`)) return;

    setSaisie(prev => {
      const updated = { ...prev };
      employesFiltres.forEach(emp => {
        if (updated[emp.id]) {
          updated[emp.id] = { ...updated[emp.id], [field]: value };

          const e = updated[emp.id];
          const presents = Number(e.jours_presents) || 0;
          const absences = Number(e.absences_non_justifiees) || 0;
          e.jours_travailles = Math.max(0, presents - absences);
        }
      });
      return updated;
    });
  };

  const reinitialiser = () => {
    if (!confirm(`Réinitialiser avec ${joursTheoriquesMois} jours ouvrés pour tous ?`)) return;
    const nouvelleSaisie = initialiserSaisie(joursExistants, employes, joursTheoriquesMois);
    setSaisie(nouvelleSaisie);
  };

  // ============================================
  // SOUMISSION
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      if (employesFiltres.length === 0) {
        setErreur('Aucun employé à enregistrer.');
        setChargement(false);
        return;
      }

      const aCreer = [];
      const aMettreAJour = [];

      employesFiltres.forEach(emp => {
        const s = saisie[emp.id];
        if (!s) return;

        const payload = {
          employe: emp.id,
          mois: Number(mois),
          annee: Number(annee),
          jours_theoriques: Number(s.jours_theoriques) || 0,
          jours_presents: Number(s.jours_presents) || 0,
          absences_non_justifiees: Number(s.absences_non_justifiees) || 0,
          jours_travailles: Number(s.jours_travailles) || 0,
          commentaire: s.commentaire || '',
        };

        if (s.dejaEnregistre && s.id) {
          aMettreAJour.push({ id: s.id, payload });
        } else {
          aCreer.push(payload);
        }
      });

      const promises = [
        ...aCreer.map(p => AxiosInstance.post('/jours-travailles/', p)),
        ...aMettreAJour.map(({ id, payload }) =>
          AxiosInstance.patch(`/jours-travailles/${id}/`, payload)
        ),
      ];

      const resultats = await Promise.allSettled(promises);
      const echecs = resultats.filter(r => r.status === 'rejected');

      if (echecs.length > 0) {
        setErreur(`${echecs.length} enregistrement(s) ont échoué.`);
      } else {
        setMessageSucces(`${aCreer.length} créé(s) • ${aMettreAJour.length} mis à jour`);
        setSucces(true);
        setTimeout(() => navigate('/jours-travailles'), 1500);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-32">

      {/* EN-TÊTE STICKY */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            type="button"
            onClick={() => navigate('/jours-travailles')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-0.5">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <button
                type="button"
                onClick={() => navigate('/jours-travailles')}
                className="hover:text-primary"
              >
                Jours Travaillés
              </button>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">Saisie de masse</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Zap className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate">
                Saisie groupée — {MOIS_LABELS[mois - 1]} {annee}
              </span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
            <Target className="w-3.5 h-3.5" />
            {joursTheoriquesMois} jours ouvrés
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 shadow-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{messageSucces}</span>
          <span className="text-xs opacity-70 ml-auto">Redirection...</span>
        </div>
      )}

      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 shadow-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{erreur}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* FILTRES PÉRIODE */}
        <div className="w-full p-6 pb-3">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 space-y-4">

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-base-content/70">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Période :</span>
                </div>

                <select
                  className="select select-bordered select-sm focus:select-primary min-w-[140px]"
                  value={mois}
                  onChange={(e) => setMois(Number(e.target.value))}
                >
                  {MOIS_LABELS.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  className="select select-bordered select-sm focus:select-primary"
                  value={annee}
                  onChange={(e) => setAnnee(Number(e.target.value))}
                >
                  {[annee - 1, annee, annee + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <div className="hidden md:flex items-center gap-2 ml-auto text-xs text-base-content/50">
                  <Info className="w-3.5 h-3.5" />
                  <span>
                    {statsSaisie.nbDejaEnregistres} déjà enregistré(s) •{' '}
                    {statsSaisie.nbNouveaux} nouveau(x)
                  </span>
                </div>
              </div>

              <div className="divider my-0"></div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                    <input
                      type="text"
                      placeholder="Rechercher un employé..."
                      className="input input-bordered input-sm w-full pl-9 focus:input-primary"
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                    />
                  </div>
                </div>

                <select
                  className="select select-bordered select-sm focus:select-primary"
                  value={filtreDepartement}
                  onChange={(e) => setFiltreDepartement(e.target.value)}
                >
                  <option value="all">Tous les départements</option>
                  {departements.map((dep) => (
                    <option key={dep.id} value={dep.id}>{dep.nom}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={reinitialiser}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réinitialiser
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* STATISTIQUES */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-6">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-3 flex-row items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Théoriques</p>
                <p className="text-lg font-bold text-info">{statsSaisie.totalTheoriques}</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-3 flex-row items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-4 h-4 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Présents</p>
                <p className="text-lg font-bold text-success">{statsSaisie.totalPresents}</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-3 flex-row items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                <UserX className="w-4 h-4 text-error" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Absences NJ</p>
                <p className="text-lg font-bold text-error">{statsSaisie.totalAbsences}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm border border-primary/20">
            <div className="card-body p-3">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Taux présence</p>
              <p className={`text-lg font-bold ${
                statsSaisie.taux >= 90 ? 'text-success' :
                statsSaisie.taux >= 75 ? 'text-info' :
                statsSaisie.taux >= 60 ? 'text-warning' : 'text-error'
              }`}>
                {statsSaisie.taux}%
              </p>
              <div className="w-full bg-base-300 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    statsSaisie.taux >= 90 ? 'bg-success' :
                    statsSaisie.taux >= 75 ? 'bg-info' :
                    statsSaisie.taux >= 60 ? 'bg-warning' : 'bg-error'
                  }`}
                  style={{ width: `${statsSaisie.taux}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS DE MASSE */}
        {employesFiltres.length > 0 && (
          <div className="w-full px-6 pb-6">
            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-info" />
                  <h3 className="font-semibold text-sm text-info">Actions de masse</h3>
                  <span className="text-xs text-base-content/50 ml-auto">
                    Applique à {employesFiltres.length} employé{employesFiltres.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => appliquerATous('jours_theoriques', joursTheoriquesMois)}
                    className="btn btn-sm btn-outline gap-2"
                  >
                    <Target className="w-3.5 h-3.5" />
                    Théoriques = {joursTheoriquesMois}j
                  </button>

                  <button
                    type="button"
                    onClick={() => appliquerATous('jours_presents', joursTheoriquesMois)}
                    className="btn btn-sm btn-outline btn-success gap-2"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Tous présents ({joursTheoriquesMois}j)
                  </button>

                  <button
                    type="button"
                    onClick={() => appliquerATous('absences_non_justifiees', 0)}
                    className="btn btn-sm btn-outline gap-2"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Aucune absence
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm('Marquer tous comme 0 jour présent ?')) return;
                      appliquerATous('jours_presents', 0);
                    }}
                    className="btn btn-sm btn-outline btn-error gap-2"
                  >
                    <XSquare className="w-3.5 h-3.5" />
                    Aucun présent
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLEAU DE SAISIE */}
        <div className="w-full px-6">
          {employesFiltres.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
              <Users className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <p className="text-xl text-base-content/60">Aucun employé trouvé</p>
              <p className="text-sm text-base-content/40 mt-2">
                Modifiez vos filtres pour afficher des employés
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="bg-base-200/50 border-b border-base-300">
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 sticky left-0 bg-base-200/50 z-10">
                      Employé
                    </th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center w-24">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="w-3 h-3 text-info" />
                        Théoriques
                      </div>
                    </th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center w-24">
                      <div className="flex items-center justify-center gap-1">
                        <UserCheck className="w-3 h-3 text-success" />
                        Présents
                      </div>
                    </th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center w-24">
                      <div className="flex items-center justify-center gap-1">
                        <UserX className="w-3 h-3 text-error" />
                        Absences
                      </div>
                    </th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center w-24">
                      <div className="flex items-center justify-center gap-1">
                        <Calculator className="w-3 h-3 text-primary" />
                        Travaillés
                      </div>
                    </th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 w-40">
                      Commentaire
                    </th>
                    <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center w-20">
                      État
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employesFiltres.map((emp) => {
                    const s = saisie[emp.id];
                    if (!s) return null;

                    const presents = Number(s.jours_presents) || 0;
                    const absences = Number(s.absences_non_justifiees) || 0;
                    const theoriques = Number(s.jours_theoriques) || 0;
                    const surplus = (presents + absences) > theoriques;

                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-base-200/30 transition-colors border-b border-base-200 last:border-0 ${
                          surplus ? 'bg-error/5' : ''
                        }`}
                      >
                        <td className="sticky left-0 bg-base-100 z-10">
                          <div className="flex items-center gap-2 min-w-[180px]">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-primary">
                                {emp.prenom?.charAt(0)?.toUpperCase()}
                                {emp.nom?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {emp.prenom} {emp.nom}
                              </p>
                              <p className="text-[10px] text-base-content/40 font-mono">
                                {emp.matricule}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            max="31"
                            className="input input-bordered input-sm w-20 text-center font-mono focus:input-primary mx-auto"
                            value={s.jours_theoriques}
                            onChange={(e) => handleChange(emp.id, 'jours_theoriques', e.target.value)}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            max="31"
                            className={`input input-bordered input-sm w-20 text-center font-mono mx-auto ${
                              surplus ? 'input-error' : 'focus:input-primary'
                            }`}
                            value={s.jours_presents}
                            onChange={(e) => handleChange(emp.id, 'jours_presents', e.target.value)}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            max="31"
                            className={`input input-bordered input-sm w-20 text-center font-mono mx-auto ${
                              surplus ? 'input-error' : 'focus:input-primary'
                            }`}
                            value={s.absences_non_justifiees}
                            onChange={(e) => handleChange(emp.id, 'absences_non_justifiees', e.target.value)}
                          />
                        </td>

                        <td>
                          <div className="text-center">
                            <span className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold font-mono">
                              {s.jours_travailles}
                            </span>
                          </div>
                        </td>

                        <td>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full focus:input-primary"
                            placeholder="Observation..."
                            value={s.commentaire}
                            onChange={(e) => handleChange(emp.id, 'commentaire', e.target.value)}
                          />
                        </td>

                        <td className="text-center">
                          {surplus ? (
                            <div className="tooltip tooltip-left" data-tip="Présents + Absences > Théoriques">
                              <AlertTriangle className="w-5 h-5 text-error mx-auto" />
                            </div>
                          ) : s.dejaEnregistre ? (
                            <div className="tooltip tooltip-left" data-tip="Déjà enregistré - sera mis à jour">
                              <CheckCircle className="w-5 h-5 text-success mx-auto" />
                            </div>
                          ) : (
                            <div className="tooltip tooltip-left" data-tip="Nouvel enregistrement">
                              <Plus className="w-5 h-5 text-info mx-auto" />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-base-200/50 border-t-2 border-base-300">
                    <td className="sticky left-0 bg-base-200/50 z-10 font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Total ({employesFiltres.length})
                      </div>
                    </td>
                    <td className="text-center font-bold text-info font-mono">
                      {statsSaisie.totalTheoriques}
                    </td>
                    <td className="text-center font-bold text-success font-mono">
                      {statsSaisie.totalPresents}
                    </td>
                    <td className="text-center font-bold text-error font-mono">
                      {statsSaisie.totalAbsences}
                    </td>
                    <td className="text-center font-bold text-primary font-mono">
                      {statsSaisie.totalTravailles}
                    </td>
                    <td></td>
                    <td className="text-center">
                      <span className={`badge badge-sm ${
                        statsSaisie.taux >= 90 ? 'badge-success' :
                        statsSaisie.taux >= 75 ? 'badge-info' :
                        statsSaisie.taux >= 60 ? 'badge-warning' : 'badge-error'
                      }`}>
                        {statsSaisie.taux}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* AIDE */}
        <div className="w-full px-6 pt-4">
          <div className="p-3 rounded-lg bg-info/5 border border-info/20 flex items-start gap-2">
            <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
            <div className="text-xs text-base-content/70 leading-relaxed">
              <p className="font-semibold text-info mb-1">Comment utiliser</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Modifiez les valeurs directement dans le tableau — le calcul est automatique</li>
                <li>Utilisez les <strong>actions de masse</strong> pour appliquer une valeur à tous les employés filtrés</li>
                <li>Les lignes avec <AlertTriangle className="w-3 h-3 inline text-error" /> ont un total incohérent</li>
                <li>
                  <CheckCircle className="w-3 h-3 inline text-success" /> = mise à jour •{' '}
                  <Plus className="w-3 h-3 inline text-info" /> = nouvel enregistrement
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-between gap-4 px-6 py-3">

            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-info" />
                <span className="text-base-content/60">
                  <span className="font-bold text-info">{statsSaisie.nbNouveaux}</span> création(s)
                </span>
              </div>
              <span className="text-base-content/20">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                <span className="text-base-content/60">
                  <span className="font-bold text-success">{statsSaisie.nbDejaEnregistres}</span> mise(s) à jour
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate('/jours-travailles')}
                className="btn btn-ghost gap-2"
                disabled={chargement}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 min-w-[200px]"
                disabled={chargement || employesFiltres.length === 0}
              >
                {chargement ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer ({employesFiltres.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </form>

      <style jsx>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default JoursTravaillesForm;