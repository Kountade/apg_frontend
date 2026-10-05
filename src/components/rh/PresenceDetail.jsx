// pages/presences/PresenceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ClipboardCheck, Edit, Trash2, Loader2, AlertCircle,
  Calendar, Clock, Building2, User, FileText, TrendingUp,
  Sunrise, Sunset, CheckCircle, XCircle, AlertTriangle,
  CalendarDays, Download, Printer, UserCheck, Hash
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const PresenceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [presence, setPresence] = useState(null);
  const [employe, setEmploye] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerPresence();
  }, [id]);

  const chargerPresence = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/presences/${id}/`);
      setPresence(response.data);

      if (response.data.employe) {
        try {
          const empRes = await AxiosInstance.get(`/employes/${response.data.employe}/`);
          setEmploye(empRes.data);
        } catch (e) {
          // Silencieux
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger la présence');
      if (err.response?.status === 404) {
        setErreur('Présence non trouvée');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerPresence = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/presences/${id}/`);
      navigate('/presences');
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

  const formaterHeure = (heureStr) => {
    if (!heureStr) return '—';
    return heureStr.slice(0, 5);
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
        <button onClick={chargerPresence} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!presence) return null;

  const getBadgeStatut = () => {
    const configs = {
      present: { label: 'Présent', cls: 'badge-success', icon: CheckCircle },
      absent: { label: 'Absent', cls: 'badge-error', icon: XCircle },
      retard: { label: 'Retard', cls: 'badge-warning', icon: Clock },
      mission: { label: 'Mission', cls: 'badge-info', icon: TrendingUp },
      conge: { label: 'Congé', cls: 'badge-primary', icon: CalendarDays },
      repos: { label: 'Repos', cls: 'badge-ghost', icon: Clock },
      depart_anticipe: { label: 'Départ anticipé', cls: 'badge-warning', icon: Sunset },
    };
    const cfg = configs[presence.statut] || { label: presence.statut, cls: 'badge-ghost', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} gap-1`}>
        <Icon className="w-3.5 h-3.5" />
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
            onClick={() => navigate('/presences')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <Link to="/presences" className="hover:text-primary">Présences</Link>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">Détail</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-primary" />
              Présence
            </h1>
            <p className="text-base-content/60 mt-1">
              {employe ? `${employe.prenom} ${employe.nom}` : 'Employé'} • {formaterDate(presence.date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/presences/${id}/modifier`}
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

          {/* Informations de présence */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Informations de présence</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(presence.date)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Statut</label>
                    <p className="mt-1">{getBadgeStatut()}</p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-1.5">
                      <Sunrise className="w-3 h-3 text-info" />
                      Heure d'arrivée
                    </label>
                    <p className="font-medium mt-1 text-lg font-mono">
                      {formaterHeure(presence.heure_arrivee)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-1.5">
                      <Sunset className="w-3 h-3 text-warning" />
                      Heure de départ
                    </label>
                    <p className="font-medium mt-1 text-lg font-mono">
                      {formaterHeure(presence.heure_depart)}
                    </p>
                  </div>
                </div>

                {presence.heures_travaillees > 0 && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <div className="stat bg-success/5 rounded-lg p-4 border border-success/20">
                      <div className="stat-title text-xs text-success flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Heures travaillées
                      </div>
                      <div className="stat-value text-2xl text-success">
                        {Number(presence.heures_travaillees).toFixed(2)}h
                      </div>
                    </div>
                  </div>
                )}

                {presence.motif && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Motif
                    </label>
                    <p className="mt-2 text-base-content/80 whitespace-pre-line text-sm">
                      {presence.motif}
                    </p>
                  </div>
                )}

                {presence.justificatif && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Justificatif
                    </label>
                    <a
                      href={presence.justificatif}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le justificatif
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employé concerné */}
          {employe && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Employé concerné</h2>
                </div>

                <div className="p-5">
                  <Link
                    to={`/employes/${employe.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-base-200/50 transition-colors"
                  >
                    {employe.photo ? (
                      <div className="avatar">
                        <div className="w-14 h-14 rounded-full">
                          <img src={employe.photo} alt={employe.nom} />
                        </div>
                      </div>
                    ) : (
                      <div className="avatar placeholder">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {employe.prenom?.charAt(0)?.toUpperCase()}
                            {employe.nom?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base">
                        {employe.prenom} {employe.nom}
                      </p>
                      <p className="text-xs text-base-content/50 font-mono">
                        {employe.matricule}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {employe.poste_nom && (
                          <span className="badge badge-ghost badge-sm gap-1">
                            <Building2 className="w-3 h-3" />
                            {employe.poste_nom}
                          </span>
                        )}
                        {employe.departement_nom && (
                          <span className="badge badge-ghost badge-sm">
                            {employe.departement_nom}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

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
                      {formaterDateHeure(presence.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Modifié le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(presence.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="lg:col-span-1 space-y-6">

          {/* Carte résumé */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body text-center">
              <div className="avatar placeholder mx-auto">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  presence.statut === 'present' ? 'bg-success/20' :
                  presence.statut === 'absent' ? 'bg-error/20' :
                  presence.statut === 'retard' ? 'bg-warning/20' :
                  presence.statut === 'mission' ? 'bg-info/20' : 'bg-base-300'
                }`}>
                  {presence.statut === 'present' ? (
                    <CheckCircle className="w-10 h-10 text-success" />
                  ) : presence.statut === 'absent' ? (
                    <XCircle className="w-10 h-10 text-error" />
                  ) : presence.statut === 'retard' ? (
                    <Clock className="w-10 h-10 text-warning" />
                  ) : presence.statut === 'mission' ? (
                    <TrendingUp className="w-10 h-10 text-info" />
                  ) : (
                    <CalendarDays className="w-10 h-10 text-primary" />
                  )}
                </div>
              </div>
              <h3 className="text-base font-bold mt-2">{formaterDate(presence.date)}</h3>

              <div className="stats stats-vertical shadow-sm mt-4">
                <div className="stat py-2">
                  <div className="stat-title text-xs">Arrivée</div>
                  <div className="stat-value text-lg text-info font-mono">
                    {formaterHeure(presence.heure_arrivee)}
                  </div>
                </div>
                <div className="stat py-2">
                  <div className="stat-title text-xs">Départ</div>
                  <div className="stat-value text-lg text-warning font-mono">
                    {formaterHeure(presence.heure_depart)}
                  </div>
                </div>
                {presence.heures_travaillees > 0 && (
                  <div className="stat py-2">
                    <div className="stat-title text-xs">Total</div>
                    <div className="stat-value text-lg text-success">
                      {Number(presence.heures_travaillees).toFixed(1)}h
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                {presence.justificatif && (
                  <a
                    href={presence.justificatif}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le justificatif
                  </a>
                )}
                <button
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <Link
                  to={`/presences/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Link>
                {employe && (
                  <Link
                    to={`/employes/${employe.id}`}
                    className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  >
                    <User className="w-4 h-4" />
                    Voir la fiche employé
                  </Link>
                )}
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
              <h3 className="text-xl font-bold mb-2">Supprimer la présence</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer la présence de{' '}
                <span className="font-bold">{employe?.prenom} {employe?.nom}</span>{' '}
                du {formaterDate(presence.date)} ?
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
                  onClick={supprimerPresence}
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
    </div>
  );
};

export default PresenceDetail;