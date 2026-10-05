// pages/pointage/Pointage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Fingerprint, Loader2, AlertCircle, RefreshCw, Search,
  Building2, User, CheckCircle, XCircle, Clock, Users,
  Sunrise, Sunset, MapPin, Navigation, Camera, Save,
  Zap, ChevronRight, Filter, Calendar, Briefcase,
  TrendingUp, CalendarDays, Hash, UserCheck, UserX,
  AlertTriangle, Send, Wifi, WifiOff
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Pointage = () => {
  const navigate = useNavigate();
  const [employes, setEmployes] = useState([]);
  const [presencesAujourdhui, setPresencesAujourdhui] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreDepartement, setFiltreDepartement] = useState('all');
  const [departements, setDepartements] = useState([]);
  const [chargementAction, setChargementAction] = useState(false);
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');
  const [heureActuelle, setHeureActuelle] = useState(new Date());
  const [enLigne, setEnLigne] = useState(navigator.onLine);
  const [geolocalisation, setGeolocalisation] = useState(null);

  const aujourdhui = new Date().toISOString().split('T')[0];

  // Horloge temps réel
  useEffect(() => {
    const timer = setInterval(() => setHeureActuelle(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Détection online/offline
  useEffect(() => {
    const handleOnline = () => setEnLigne(true);
    const handleOffline = () => setEnLigne(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocalisation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Silencieux si refusé
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [empRes, presRes, depRes] = await Promise.all([
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
        AxiosInstance.get('/presences/aujourdhui/').catch(() => ({ data: [] })),
        AxiosInstance.get('/departements/').catch(() => ({ data: [] })),
      ]);

      const empData = empRes.data.results || empRes.data || [];
      const presData = presRes.data.results || presRes.data || [];
      const depData = depRes.data.results || depRes.data || [];

      setEmployes(empData.filter(e => e.statut === 'actif'));
      setPresencesAujourdhui(presData);
      setDepartements(depData);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger les données');
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // MAP : employés avec leur statut de pointage
  // ============================================
  const employesAvecStatut = useMemo(() => {
    const presencesMap = new Map();
    presencesAujourdhui.forEach(p => {
      presencesMap.set(String(p.employe), p);
    });

    return employes.map(emp => ({
      ...emp,
      presence: presencesMap.get(String(emp.id)) || null,
      estPointe: presencesMap.has(String(emp.id)),
    }));
  }, [employes, presencesAujourdhui]);

  // ============================================
  // FILTRES
  // ============================================
  const employesFiltres = useMemo(() => {
    return employesAvecStatut.filter(e => {
      if (recherche) {
        const terme = recherche.toLowerCase();
        const match =
          e.nom?.toLowerCase().includes(terme) ||
          e.prenom?.toLowerCase().includes(terme) ||
          e.matricule?.toLowerCase().includes(terme);
        if (!match) return false;
      }
      if (filtreDepartement !== 'all') {
        if (String(e.departement) !== String(filtreDepartement)) return false;
      }
      return true;
    });
  }, [employesAvecStatut, recherche, filtreDepartement]);

  // ============================================
  // POINTAGE RAPIDE
  // ============================================
  const pointer = async (employe, statut = 'present') => {
    setChargementAction(true);
    try {
      const heure = new Date().toTimeString().slice(0, 5);
      const payload = {
        employe: employe.id,
        date: aujourdhui,
        heure_arrivee: statut === 'present' || statut === 'retard' ? heure : null,
        statut: statut,
      };

      // Ajouter GPS si disponible
      if (geolocalisation) {
        payload.latitude = geolocalisation.latitude;
        payload.longitude = geolocalisation.longitude;
      }

      await AxiosInstance.post('/presences/', payload);

      setMessageSucces(`${employe.prenom} ${employe.nom} pointé ${statut === 'present' ? 'présent' : statut}`);
      setSucces(true);
      await chargerDonnees();
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors du pointage');
    } finally {
      setChargementAction(false);
    }
  };

  const pointerArrivee = async (employe) => {
    // Si déjà pointé, mettre à jour heure de départ
    if (employe.presence && employe.presence.heure_arrivee && !employe.presence.heure_depart) {
      await pointerDepart(employe);
      return;
    }
    await pointer(employe, 'present');
  };

  const pointerDepart = async (employe) => {
    setChargementAction(true);
    try {
      const heure = new Date().toTimeString().slice(0, 5);
      await AxiosInstance.patch(`/presences/${employe.presence.id}/`, {
        heure_depart: heure,
      });

      setMessageSucces(`Départ de ${employe.prenom} ${employe.nom} enregistré`);
      setSucces(true);
      await chargerDonnees();
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors du pointage de départ');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================
  // ACTIONS GROUPÉES
  // ============================================
  const pointerTousPresents = async () => {
    const nonPointes = employesFiltres.filter(e => !e.estPointe);
    if (nonPointes.length === 0) return;

    if (!confirm(`Pointer ${nonPointes.length} employé${nonPointes.length > 1 ? 's' : ''} comme PRÉSENT${nonPointes.length > 1 ? 'S' : ''} ?`)) return;

    setChargementAction(true);
    try {
      const heure = new Date().toTimeString().slice(0, 5);
      await Promise.all(
        nonPointes.map(emp =>
          AxiosInstance.post('/presences/', {
            employe: emp.id,
            date: aujourdhui,
            heure_arrivee: heure,
            statut: 'present',
          }).catch(() => null)
        )
      );

      setMessageSucces(`${nonPointes.length} employé${nonPointes.length > 1 ? 's' : ''} pointé${nonPointes.length > 1 ? 's' : ''}`);
      setSucces(true);
      await chargerDonnees();
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors du pointage groupé');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterHeure = (heureStr) => {
    if (!heureStr) return '—';
    return heureStr.slice(0, 5);
  };

  const heureFormatee = heureActuelle.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateFormatee = heureActuelle.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Statistiques
  const stats = {
    total: employesAvecStatut.length,
    pointes: employesAvecStatut.filter(e => e.estPointe).length,
    nonPointes: employesAvecStatut.filter(e => !e.estPointe).length,
    enCours: employesAvecStatut.filter(e => e.estPointe && e.presence?.heure_arrivee && !e.presence?.heure_depart).length,
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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-6">

      {/* ============================================ */}
      {/* EN-TÊTE — HORLOGE TEMPS RÉEL                */}
      {/* ============================================ */}
      <div className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-content shadow-lg">
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Breadcrumb + Titre */}
            <div>
              <div className="flex items-center gap-2 text-xs text-primary-content/70 uppercase tracking-wider font-medium mb-1">
                <Fingerprint className="w-3 h-3" />
                Pointage Terrain
                <span className="text-primary-content/40">/</span>
                <span>{dateFormatee}</span>
              </div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Fingerprint className="w-7 h-7" />
                Pointage
              </h1>
            </div>

            {/* Horloge */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold font-mono tabular-nums tracking-wider">
                  {heureFormatee}
                </div>
                <div className="text-xs text-primary-content/70 flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  {new Date().toLocaleDateString('fr-FR')}
                </div>
              </div>

              {/* Statut connexion */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                enLigne ? 'bg-success/20' : 'bg-error/20'
              }`}>
                {enLigne ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  {enLigne ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>

              {/* GPS */}
              {geolocalisation && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-content/10">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">GPS actif</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MESSAGE SUCCÈS                                */}
      {/* ============================================ */}
      {succes && (
        <div className="fixed top-4 right-4 z-50 alert alert-success shadow-lg max-w-md animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{messageSucces}</span>
        </div>
      )}

      {/* ============================================ */}
      {/* STATISTIQUES RAPIDES                          */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 p-6 pb-0">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Pointés</p>
              <p className="text-xl font-bold text-success">{stats.pointes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <UserX className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Non pointés</p>
              <p className="text-xl font-bold text-warning">{stats.nonPointes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wider">En cours</p>
              <p className="text-xl font-bold text-info">{stats.enCours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ACTIONS RAPIDES                               */}
      {/* ============================================ */}
      <div className="w-full p-6 pb-3">
        <div className="flex flex-wrap items-center gap-3">

          {/* Recherche */}
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher un employé (nom, matricule)..."
                className="input input-bordered w-full pl-9 focus:input-primary"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>
          </div>

          {/* Filtre département */}
          <select
            className="select select-bordered focus:select-primary"
            value={filtreDepartement}
            onChange={(e) => setFiltreDepartement(e.target.value)}
          >
            <option value="all">Tous les départements</option>
            {departements.map((dep) => (
              <option key={dep.id} value={dep.id}>{dep.nom}</option>
            ))}
          </select>

          {/* Bouton refresh */}
          <button
            onClick={chargerDonnees}
            className="btn btn-ghost btn-sm gap-2"
            disabled={chargementAction}
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${chargementAction ? 'animate-spin' : ''}`} />
          </button>

          {/* Pointer tous */}
          <button
            onClick={pointerTousPresents}
            className="btn btn-success gap-2"
            disabled={chargementAction || stats.nonPointes === 0}
          >
            <Zap className="w-4 h-4" />
            Pointer tous présents
            {stats.nonPointes > 0 && (
              <span className="badge badge-sm">{stats.nonPointes}</span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* LISTE DES EMPLOYÉS                            */}
      {/* ============================================ */}
      <div className="w-full p-6">

        {employesFiltres.length === 0 ? (
          <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
            <Users className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
            <p className="text-xl text-base-content/60">Aucun employé trouvé</p>
            <p className="text-sm text-base-content/40 mt-2">
              {recherche || filtreDepartement !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Aucun employé actif'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {employesFiltres.map((employe) => {
              const presence = employe.presence;
              const estPointe = employe.estPointe;
              const estEnCours = estPointe && presence?.heure_arrivee && !presence?.heure_depart;
              const estTermine = estPointe && presence?.heure_depart;

              return (
                <div
                  key={employe.id}
                  className={`card shadow-sm border-2 transition-all hover:shadow-md ${
                    estTermine
                      ? 'bg-base-100 border-base-300'
                      : estEnCours
                      ? 'bg-info/5 border-info/30'
                      : estPointe
                      ? 'bg-success/5 border-success/30'
                      : 'bg-base-100 border-base-300'
                  }`}
                >
                  <div className="card-body p-4">

                    {/* En-tête employé */}
                    <div className="flex items-center gap-3">
                      {employe.photo ? (
                        <div className="avatar">
                          <div className="w-14 h-14 rounded-full ring-2 ring-primary/20">
                            <img src={employe.photo} alt={employe.nom} />
                          </div>
                        </div>
                      ) : (
                        <div className="avatar placeholder">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                            estPointe ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'
                          }`}>
                            <span className="text-base font-bold">
                              {employe.prenom?.charAt(0)?.toUpperCase()}
                              {employe.nom?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                          {employe.prenom} {employe.nom}
                        </p>
                        <p className="text-xs text-base-content/50 font-mono">
                          {employe.matricule}
                        </p>
                        {employe.poste_nom && (
                          <p className="text-xs text-base-content/60 truncate mt-0.5">
                            {employe.poste_nom}
                          </p>
                        )}
                      </div>

                      {/* Badge état */}
                      {estTermine ? (
                        <div className="badge badge-success gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Terminé
                        </div>
                      ) : estEnCours ? (
                        <div className="badge badge-info gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          En cours
                        </div>
                      ) : estPointe ? (
                        <div className="badge badge-success gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Pointé
                        </div>
                      ) : (
                        <div className="badge badge-warning gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          À pointer
                        </div>
                      )}
                    </div>

                    {/* Infos présence */}
                    {estPointe && (
                      <div className="mt-3 p-3 rounded-lg bg-base-200/50 border border-base-300">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-1 text-base-content/50 mb-0.5">
                              <Sunrise className="w-3 h-3 text-info" />
                              Arrivée
                            </div>
                            <p className="font-mono font-bold text-sm">
                              {formaterHeure(presence.heure_arrivee)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-base-content/50 mb-0.5">
                              <Sunset className="w-3 h-3 text-warning" />
                              Départ
                            </div>
                            <p className="font-mono font-bold text-sm">
                              {formaterHeure(presence.heure_depart)}
                            </p>
                          </div>
                        </div>

                        {presence.heures_travaillees > 0 && (
                          <div className="mt-2 pt-2 border-t border-base-300 flex items-center justify-between">
                            <span className="text-xs text-base-content/50">Heures travaillées</span>
                            <span className="text-sm font-bold text-success">
                              {Number(presence.heures_travaillees).toFixed(2)}h
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3">
                      {!estPointe ? (
                        // Non pointé : bouton Arrivée
                        <button
                          onClick={() => pointerArrivee(employe)}
                          className="btn btn-success w-full gap-2 min-h-[3.5rem] text-base"
                          disabled={chargementAction}
                        >
                          {chargementAction ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sunrise className="w-5 h-5" />
                          )}
                          Pointer l'arrivée
                        </button>
                      ) : !estTermine ? (
                        // En cours : bouton Départ
                        <button
                          onClick={() => pointerDepart(employe)}
                          className="btn btn-warning w-full gap-2 min-h-[3.5rem] text-base"
                          disabled={chargementAction}
                        >
                          {chargementAction ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sunset className="w-5 h-5" />
                          )}
                          Pointer le départ
                        </button>
                      ) : (
                        // Terminé : bouton désactivé
                        <button
                          className="btn btn-ghost w-full gap-2 min-h-[3.5rem] text-base"
                          disabled
                        >
                          <CheckCircle className="w-5 h-5 text-success" />
                          Journée terminée
                        </button>
                      )}
                    </div>

                    {/* Actions secondaires */}
                    <div className="flex gap-1 mt-2">
                      <Link
                        to={`/presences/ajouter?employe=${employe.id}&date=${aujourdhui}`}
                        className="btn btn-ghost btn-xs flex-1 gap-1"
                        title="Saisie détaillée"
                      >
                        <Save className="w-3 h-3" />
                        Détails
                      </Link>
                      {estPointe && (
                        <Link
                          to={`/presences/${presence.id}`}
                          className="btn btn-ghost btn-xs flex-1 gap-1"
                        >
                          <ChevronRight className="w-3 h-3" />
                          Voir fiche
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* BOUTON STICKY — POINTAGE GROUPÉ              */}
      {/* ============================================ */}
      {stats.nonPointes > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={pointerTousPresents}
            className="btn btn-success btn-lg shadow-2xl gap-3 px-8"
            disabled={chargementAction}
          >
            {chargementAction ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Zap className="w-6 h-6" />
            )}
            <span>Pointer {stats.nonPointes} employé{stats.nonPointes > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* FOOTER — LIENS                                */}
      {/* ============================================ */}
      <div className="w-full p-6 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-base-300">
          <div className="flex items-center gap-2 text-sm text-base-content/50">
            <Fingerprint className="w-4 h-4" />
            <span>Pointage terrain • {employesFiltres.length} employé{employesFiltres.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex gap-2">
            <Link to="/presences/aujourdhui" className="btn btn-ghost btn-sm gap-2">
              <CalendarDays className="w-4 h-4" />
              Vue du jour
            </Link>
            <Link to="/presences" className="btn btn-ghost btn-sm gap-2">
              <Clock className="w-4 h-4" />
              Historique
            </Link>
          </div>
        </div>
      </div>

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

export default Pointage;