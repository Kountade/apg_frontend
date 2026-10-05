// pages/contrats/ContratDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileCheck, Edit, Trash2, Loader2, AlertCircle,
  Calendar, Clock, Building2, Briefcase, User, DollarSign,
  FileText, TrendingUp, RefreshCw, AlertTriangle, CheckCircle,
  Download, Printer, Hash, CalendarClock, Eye
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ContratDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrat, setContrat] = useState(null);
  const [employe, setEmploye] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerContrat();
  }, [id]);

  const chargerContrat = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/contrats/${id}/`);
      setContrat(response.data);

      // Charger l'employé
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
      setErreur(err.response?.data?.error || 'Impossible de charger le contrat');
      if (err.response?.status === 404) {
        setErreur('Contrat non trouvé');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerContrat = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/contrats/${id}/`);
      navigate('/contrats');
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
    if (!contrat?.date_debut || !contrat?.date_fin) return null;
    const debut = new Date(contrat.date_debut);
    const fin = new Date(contrat.date_fin);
    const mois = Math.round((fin - debut) / (1000 * 60 * 60 * 24 * 30));
    if (mois < 12) return `${mois} mois`;
    const annees = Math.floor(mois / 12);
    const resteMois = mois % 12;
    return resteMois > 0
      ? `${annees} an${annees > 1 ? 's' : ''} ${resteMois} mois`
      : `${annees} an${annees > 1 ? 's' : ''}`;
  };

  const joursRestants = () => {
    if (!contrat?.date_fin) return null;
    const diff = Math.ceil((new Date(contrat.date_fin) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const estExpirant = () => {
    const jours = joursRestants();
    return jours !== null && jours >= 0 && jours <= 30 && contrat?.statut === 'actif';
  };

  const estExpire = () => {
    const jours = joursRestants();
    return jours !== null && jours < 0 && contrat?.statut === 'actif';
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
        <button onClick={chargerContrat} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!contrat) return null;

  const getBadgeStatut = () => {
    const configs = {
      actif: { label: 'Actif', cls: 'badge-success' },
      expire: { label: 'Expiré', cls: 'badge-error' },
      rompu: { label: 'Rompu', cls: 'badge-ghost' },
    };
    const cfg = configs[contrat.statut] || { label: contrat.statut, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
  };

  const getBadgeType = () => {
    const configs = {
      CDI: 'badge-primary',
      CDD: 'badge-info',
      STAGE: 'badge-warning',
      TEMPORAIRE: 'badge-ghost',
    };
    return <span className={`badge ${configs[contrat.type] || 'badge-ghost'} badge-outline`}>{contrat.type}</span>;
  };

  const duree = calculerDuree();
  const jours = joursRestants();

  return (
    <div className="w-full p-6">

      {/* Bandeau alerte expiration */}
      {estExpirant() && (
        <div className="w-full alert alert-warning rounded-xl border border-warning/30 mb-6">
          <AlertTriangle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-medium text-sm">
              Ce contrat expire dans <strong>{jours} jour{jours > 1 ? 's' : ''}</strong>
            </p>
            <p className="text-xs opacity-80">
              Pensez à le renouveler ou à le clôturer
            </p>
          </div>
          <Link to={`/contrats/${id}/modifier`} className="btn btn-warning btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Renouveler
          </Link>
        </div>
      )}

      {estExpire() && (
        <div className="w-full alert alert-error rounded-xl border border-error/30 mb-6">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-medium text-sm">Ce contrat est expiré</p>
            <p className="text-xs opacity-80">
              Il a expiré il y a {Math.abs(jours)} jour{Math.abs(jours) > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/contrats')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <Link to="/contrats" className="hover:text-primary">Contrats</Link>
              <span className="text-base-content/30">/</span>
              <span className="text-primary font-mono">{contrat.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileCheck className="w-8 h-8 text-primary" />
              <span className="font-mono">{contrat.numero}</span>
            </h1>
            <p className="text-base-content/60 mt-1 flex items-center gap-3">
              <span>Type : {contrat.type}</span>
              {employe && (
                <>
                  <span>•</span>
                  <span>{employe.prenom} {employe.nom}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {contrat.document && (
            <a
              href={contrat.document}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost gap-2"
              title="Télécharger le document"
            >
              <Download className="w-4 h-4" />
              Document
            </a>
          )}
          <Link
            to={`/contrats/${id}/modifier`}
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

          {/* Informations du contrat */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Informations du contrat</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Numéro</label>
                    <p className="font-medium mt-1 font-mono flex items-center gap-2">
                      <Hash className="w-4 h-4 text-base-content/40" />
                      {contrat.numero}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Type</label>
                    <p className="mt-1">{getBadgeType()}</p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de début</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(contrat.date_debut)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de fin</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {contrat.date_fin ? formaterDate(contrat.date_fin) : (
                        <span className="text-base-content/50">Indéterminée (CDI)</span>
                      )}
                    </p>
                  </div>

                  {duree && (
                    <div>
                      <label className="text-xs text-base-content/40 uppercase tracking-wider">Durée</label>
                      <p className="font-medium mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-base-content/40" />
                        {duree}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Salaire</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      {formaterMontant(contrat.salaire)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Statut</label>
                    <p className="mt-1">{getBadgeStatut()}</p>
                  </div>

                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Renouvelable</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      {contrat.renouvellement ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-success">Oui</span>
                        </>
                      ) : (
                        <>
                          <span className="w-4"></span>
                          <span className="text-base-content/50">Non</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {contrat.document && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Document scanné
                    </label>
                    <a
                      href={contrat.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le document
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
                            <Briefcase className="w-3 h-3" />
                            {employe.poste_nom}
                          </span>
                        )}
                        {employe.departement_nom && (
                          <span className="badge badge-ghost badge-sm gap-1">
                            <Building2 className="w-3 h-3" />
                            {employe.departement_nom}
                          </span>
                        )}
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-base-content/40" />
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
                      {formaterDateHeure(contrat.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Modifié le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(contrat.updated_at)}
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
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <FileCheck className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h3 className="text-base font-bold mt-2 font-mono">{contrat.numero}</h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {getBadgeType()}
                {getBadgeStatut()}
              </div>

              <div className="stats stats-vertical shadow-sm mt-4">
                <div className="stat py-2">
                  <div className="stat-title text-xs">Salaire</div>
                  <div className="stat-value text-lg text-primary">
                    {formaterMontant(contrat.salaire)}
                  </div>
                </div>
                {duree && (
                  <div className="stat py-2">
                    <div className="stat-title text-xs">Durée</div>
                    <div className="stat-value text-lg text-info">{duree}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                {contrat.document && (
                  <a
                    href={contrat.document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm justify-start w-full gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le contrat
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
                  to={`/contrats/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier le contrat
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
              <h3 className="text-xl font-bold mb-2">Supprimer le contrat</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement le contrat{' '}
                <span className="font-bold font-mono">{contrat.numero}</span> ?
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
                  onClick={supprimerContrat}
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

export default ContratDetail;