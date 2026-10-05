// pages/absences/AbsenceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, AlertCircle, Edit, Trash2, Loader2,
  Calendar, Clock, Building2, User, FileText, TrendingUp,
  CheckCircle, XCircle, AlertTriangle, Download, Printer,
  Stethoscope, Shield, UserCheck, Hash, CalendarDays
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const AbsenceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [absence, setAbsence] = useState(null);
  const [employe, setEmploye] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerAbsence();
  }, [id]);

  const chargerAbsence = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/absences/${id}/`);
      setAbsence(response.data);

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
      setErreur(err.response?.data?.error || 'Impossible de charger l\'absence');
      if (err.response?.status === 404) {
        setErreur('Absence non trouvée');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerAbsence = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/absences/${id}/`);
      navigate('/absences');
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

  const calculerDuree = () => {
    if (!absence?.date_debut || !absence?.date_fin) return 0;
    const diff = Math.ceil((new Date(absence.date_fin) - new Date(absence.date_debut)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
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
        <button onClick={chargerAbsence} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!absence) return null;

  const getBadgeType = () => {
    const configs = {
      maladie: { label: 'Maladie', cls: 'badge-error', icon: Stethoscope },
      injustifiee: { label: 'Injustifiée', cls: 'badge-warning', icon: AlertTriangle },
      autorisee: { label: 'Autorisée', cls: 'badge-info', icon: Shield },
    };
    const cfg = configs[absence.type] || { label: absence.type, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} gap-1`}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeStatut = () => {
    const configs = {
      en_attente: { label: 'En attente', cls: 'badge-warning', icon: Clock },
      valide: { label: 'Validée', cls: 'badge-success', icon: CheckCircle },
      refuse: { label: 'Refusée', cls: 'badge-error', icon: XCircle },
    };
    const cfg = configs[absence.statut] || { label: absence.statut, cls: 'badge-ghost', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} gap-1`}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    );
  };

  const duree = calculerDuree();

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/absences')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <Link to="/absences" className="hover:text-primary">Absences</Link>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">Détail</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-warning" />
              Absence
            </h1>
            <p className="text-base-content/60 mt-1">
              {employe ? `${employe.prenom} ${employe.nom}` : 'Employé'} • {duree} jour{duree > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {absence.justificatif && (
            <a
              href={absence.justificatif}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost gap-2"
              title="Télécharger le justificatif"
            >
              <Download className="w-4 h-4" />
              Justificatif
            </a>
          )}
          <Link
            to={`/absences/${id}/modifier`}
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

          {/* Informations de l'absence */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <h2 className="font-semibold text-sm">Informations de l'absence</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Type</label>
                    <p className="mt-1">{getBadgeType()}</p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Statut</label>
                    <p className="mt-1">{getBadgeStatut()}</p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de début</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(absence.date_debut)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de fin</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(absence.date_fin)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-base-200">
                  <div className="stat bg-warning/5 rounded-lg p-4 border border-warning/20">
                    <div className="stat-title text-xs text-warning flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Durée de l'absence
                    </div>
                    <div className="stat-value text-2xl text-warning">
                      {duree} jour{duree > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {absence.motif && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Motif
                    </label>
                    <p className="mt-2 text-base-content/80 whitespace-pre-line text-sm">
                      {absence.motif}
                    </p>
                  </div>
                )}

                {absence.justificatif && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Justificatif
                    </label>
                    <a
                      href={absence.justificatif}
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
                      {formaterDateHeure(absence.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Modifié le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(absence.updated_at)}
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
          <div className="card bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20 shadow-sm">
            <div className="card-body text-center">
              <div className="avatar placeholder mx-auto">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  absence.type === 'maladie' ? 'bg-error/20' :
                  absence.type === 'injustifiee' ? 'bg-warning/20' : 'bg-info/20'
                }`}>
                  {absence.type === 'maladie' ? (
                    <Stethoscope className="w-10 h-10 text-error" />
                  ) : absence.type === 'injustifiee' ? (
                    <AlertTriangle className="w-10 h-10 text-warning" />
                  ) : (
                    <Shield className="w-10 h-10 text-info" />
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold mt-2">
                {absence.type === 'maladie' ? 'Absence maladie' :
                 absence.type === 'injustifiee' ? 'Absence injustifiée' : 'Absence autorisée'}
              </h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {getBadgeType()}
                {getBadgeStatut()}
              </div>

              <div className="stats stats-vertical shadow-sm mt-4">
                <div className="stat py-2">
                  <div className="stat-title text-xs">Durée</div>
                  <div className="stat-value text-xl text-warning">
                    {duree} j
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                {absence.justificatif && (
                  <a
                    href={absence.justificatif}
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
                  to={`/absences/${id}/modifier`}
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
              <h3 className="text-xl font-bold mb-2">Supprimer l'absence</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer l'absence de{' '}
                <span className="font-bold">{employe?.prenom} {employe?.nom}</span> ?
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
                  onClick={supprimerAbsence}
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

export default AbsenceDetail;