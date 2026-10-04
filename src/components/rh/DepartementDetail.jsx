// pages/departements/DepartementDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, Hash, User, Users, Edit, Trash2,
  Loader2, AlertCircle, Calendar, Clock, Briefcase, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const DepartementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departement, setDepartement] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDepartement();
  }, [id]);

  const chargerDepartement = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/departements/${id}/`);
      setDepartement(response.data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger le département');
      if (err.response?.status === 404) {
        setErreur('Département non trouvé');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerDepartement = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/departements/${id}/`);
      navigate('/departements');
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setShowModalSuppression(false);
    } finally {
      setChargementAction(false);
    }
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
        <button onClick={chargerDepartement} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!departement) return null;

  // ✅ PLUS de max-w-5xl mx-auto — pleine largeur
  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/departements')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              {departement.nom}
            </h1>
            <p className="text-base-content/60">
              ID: {departement.id}
              {departement.code && ` • Code: ${departement.code}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/departements/${id}/modifier`}
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

      {/* CONTENU — PLEINE LARGEUR */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Informations du département
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm text-base-content/40">Nom</label>
                  <p className="font-medium">{departement.nom}</p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Code</label>
                  <p className="font-mono">
                    {departement.code || (
                      <span className="text-base-content/30">Non défini</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Responsable</label>
                  <p className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-base-content/40" />
                    {departement.responsable_nom || (
                      <span className="text-base-content/30">Non défini</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Nombre d'employés</label>
                  <p className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-base-content/40" />
                    {departement.nombre_employes || 0}
                  </p>
                </div>
              </div>

              {departement.description && (
                <div className="mt-4 pt-4 border-t border-base-200">
                  <label className="text-sm text-base-content/40 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </label>
                  <p className="mt-2 text-base-content/80 whitespace-pre-line">
                    {departement.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informations système */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-info" />
                Informations système
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm text-base-content/40">Créé le</label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-base-content/40" />
                    {formaterDateHeure(departement.created_at)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Modifié le</label>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-base-content/40" />
                    {formaterDateHeure(departement.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <div className="avatar placeholder">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Building2 className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mt-2">{departement.nom}</h3>
              {departement.code && (
                <span className="badge badge-ghost font-mono mt-1">
                  {departement.code}
                </span>
              )}
              <div className="stats stats-vertical shadow mt-4">
                <div className="stat">
                  <div className="stat-title text-xs">Employés</div>
                  <div className="stat-value text-2xl">
                    {departement.nombre_employes || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h4 className="font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Postes associés
              </h4>
              <div className="mt-2">
                {departement.postes && departement.postes.length > 0 ? (
                  <ul className="space-y-1">
                    {departement.postes.map((poste, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {poste.nom}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-base-content/40">
                    Aucun poste associé
                  </p>
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
              <h3 className="text-xl font-bold mb-2">Supprimer le département</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement le département{' '}
                <span className="font-bold">{departement.nom}</span> ?
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
                  onClick={supprimerDepartement}
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

export default DepartementDetail;