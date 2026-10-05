// pages/formations/FormationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Edit, Trash2, Loader2, AlertCircle,
  Calendar, Clock, Building2, User, FileText, TrendingUp,
  Award, Target, CheckCircle, DollarSign, Download, Printer,
  GraduationCap, Users, MapPin, Briefcase, UserCheck,
  Sparkles, BarChart3, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const FormationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerFormation();
  }, [id]);

  const chargerFormation = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/formations/${id}/`);
      setFormation(response.data);

      // Récupérer les infos des participants
      if (Array.isArray(response.data.participants) && response.data.participants.length > 0) {
        // Si les participants sont des objets → les utiliser
        if (typeof response.data.participants[0] === 'object') {
          setParticipants(response.data.participants);
        } else {
          // Sinon, charger les employés par ID
          const promises = response.data.participants.map(pId =>
            AxiosInstance.get(`/employes/${pId}/`)
              .then(res => res.data)
              .catch(() => null)
          );
          const results = await Promise.all(promises);
          setParticipants(results.filter(p => p !== null));
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger la formation');
      if (err.response?.status === 404) {
        setErreur('Formation non trouvée');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerFormation = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/formations/${id}/`);
      navigate('/formations');
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setShowModalSuppression(false);
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formaterDateHeure = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formaterMontant = (montant) => {
    if (!montant || montant === '0') return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(montant)) + ' GNF';
  };

  const calculerDuree = () => {
    if (!formation?.date_debut || !formation?.date_fin) return 0;
    const diff = Math.ceil((new Date(formation.date_fin) - new Date(formation.date_debut)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const getStatutPeriode = () => {
    if (!formation) return 'a_venir';
    const aujourd = new Date();
    const debut = new Date(formation.date_debut);
    const fin = new Date(formation.date_fin);
    if (fin < aujourd) return 'terminee';
    if (debut <= aujourd && aujourd <= fin) return 'en_cours';
    return 'a_venir';
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
        <button onClick={chargerFormation} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!formation) return null;

  const statut = getStatutPeriode();
  const duree = calculerDuree();
  const nbParticipants = participants.length;
  const coutParParticipant = nbParticipants > 0 && Number(formation.cout) > 0
    ? Math.round(Number(formation.cout) / nbParticipants)
    : 0;

  const getBadgeStatut = () => {
    const configs = {
      a_venir: { label: 'À venir', cls: 'badge-info', icon: Clock },
      en_cours: { label: 'En cours', cls: 'badge-warning', icon: Sparkles },
      terminee: { label: 'Terminée', cls: 'badge-success', icon: CheckCircle },
    };
    const cfg = configs[statut];
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-lg gap-1`}>
        <Icon className="w-4 h-4" />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/formations')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <Link to="/formations" className="hover:text-primary">Formations</Link>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">Détail</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              {formation.titre}
            </h1>
            <p className="text-base-content/60 mt-1">
              {nbParticipants} participant{nbParticipants > 1 ? 's' : ''} • {duree} jour{duree > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <Link
            to={`/formations/${id}/modifier`}
            className="btn btn-primary gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowModalSuppression(true)}
            className="btn btn-error gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Carte prominente */}
          <div className={`card border-2 shadow-sm ${
            statut === 'en_cours' ? 'bg-warning/5 border-warning/40' :
            statut === 'a_venir' ? 'bg-info/5 border-info/30' :
            'bg-success/5 border-success/30'
          }`}>
            <div className="card-body">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    statut === 'en_cours' ? 'bg-warning/20 text-warning' :
                    statut === 'a_venir' ? 'bg-info/20 text-info' :
                    'bg-success/20 text-success'
                  }`}>
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider mb-1">Formation</p>
                    <p className="text-2xl font-bold line-clamp-2">{formation.titre}</p>
                    <div className="mt-2">{getBadgeStatut()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Informations générales</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Formateur</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-base-content/40" />
                      {formation.formateur || 'Non défini'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Lieu</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-base-content/40" />
                      {formation.lieu || 'Non défini'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de début</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(formation.date_debut)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de fin</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(formation.date_fin)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Durée</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {duree} jour{duree > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Coût total</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-warning" />
                      <span className="text-warning">{formaterMontant(formation.cout)}</span>
                    </p>
                  </div>
                </div>

                {formation.description && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Description
                    </label>
                    <p className="mt-2 text-base-content/80 whitespace-pre-line text-sm leading-relaxed">
                      {formation.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <Users className="w-4 h-4 text-success" />
                <h2 className="font-semibold text-sm">Participants</h2>
                <span className="badge badge-success badge-sm ml-auto">
                  {nbParticipants}
                </span>
              </div>

              <div className="p-5">
                {participants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {participants.map((emp) => (
                      <Link
                        key={emp.id}
                        to={`/employes/${emp.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {emp.prenom?.charAt(0)?.toUpperCase()}
                            {emp.nom?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {emp.prenom} {emp.nom}
                          </p>
                          <p className="text-[10px] text-base-content/50 font-mono">
                            {emp.matricule}
                          </p>
                        </div>
                        {emp.poste_nom && (
                          <span className="badge badge-ghost badge-xs">
                            {emp.poste_nom}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                    <p className="text-sm text-base-content/50">
                      Aucun participant enregistré
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <Clock className="w-4 h-4 text-base-content/50" />
                <h2 className="font-semibold text-sm">Informations système</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Créé le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(formation.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Modifié le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(formation.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="lg:col-span-1 space-y-6">

          {/* Carte statistiques */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body">
              <div className="stats stats-vertical shadow-sm">
                <div className="stat py-3">
                  <div className="stat-figure text-success">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="stat-title text-xs">Participants</div>
                  <div className="stat-value text-2xl text-success">{nbParticipants}</div>
                </div>

                <div className="stat py-3">
                  <div className="stat-figure text-info">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="stat-title text-xs">Durée</div>
                  <div className="stat-value text-2xl text-info">{duree}j</div>
                </div>

                {Number(formation.cout) > 0 && (
                  <div className="stat py-3">
                    <div className="stat-figure text-warning">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div className="stat-title text-xs">Coût total</div>
                    <div className="stat-value text-xl text-warning">
                      {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(Number(formation.cout))}
                    </div>
                  </div>
                )}
              </div>

              {coutParParticipant > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-info/5 border border-info/20 text-center">
                  <p className="text-[10px] text-base-content/50">Coût par participant</p>
                  <p className="text-sm font-bold text-info">
                    {formaterMontant(coutParParticipant)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <button
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  Imprimer la fiche
                </button>
                <Link
                  to={`/formations/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier la formation
                </Link>
                <Link
                  to={`/formations/ajouter`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle formation
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal suppression */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la formation</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement la formation{' '}
                <span className="font-bold">{formation.titre}</span> ?
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
                  onClick={supprimerFormation}
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
        @media print {
          button, .btn, .badge, header, nav, aside {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FormationDetail;