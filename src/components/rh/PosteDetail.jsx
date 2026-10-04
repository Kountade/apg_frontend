// pages/postes/PosteDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, Edit, Trash2, Loader2, AlertCircle,
  Calendar, Clock, Building2, DollarSign, Users, FileText,
  TrendingUp, UserCheck, Plus
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const PosteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poste, setPoste] = useState(null);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerPoste();
  }, [id]);

  const chargerPoste = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/postes/${id}/`);
      setPoste(response.data);

      // Charger les employés de ce poste
      try {
        const empRes = await AxiosInstance.get(`/employes/?poste=${id}`);
        const data = empRes.data.results || empRes.data || [];
        setEmployes(data);
      } catch (e) {
        setEmployes([]);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger le poste');
      if (err.response?.status === 404) {
        setErreur('Poste non trouvé');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerPoste = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/postes/${id}/`);
      navigate('/postes');
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

  const formaterMontant = (montant) => {
    if (!montant || montant === '0') return 'Non défini';
    return new Intl.NumberFormat('fr-FR').format(Number(montant)) + ' GNF';
  };

  const calculerMoyenne = (min, max) => {
    const minNum = Number(min) || 0;
    const maxNum = Number(max) || 0;
    if (!minNum && !maxNum) return null;
    if (!minNum) return maxNum;
    if (!maxNum) return minNum;
    return (minNum + maxNum) / 2;
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
        <button onClick={chargerPoste} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!poste) return null;

  const moyenne = calculerMoyenne(poste.salaire_min, poste.salaire_max);

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/postes')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <Link to="/postes" className="hover:text-primary">Postes</Link>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{poste.nom}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary" />
              {poste.nom}
            </h1>
            <p className="text-base-content/60 mt-1">
              ID: {poste.id}
              {poste.departement_nom && ` • ${poste.departement_nom}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/postes/${id}/modifier`}
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

          {/* Informations du poste */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Informations du poste</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Intitulé</label>
                    <p className="font-medium mt-1">{poste.nom}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Département</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-base-content/40" />
                      {poste.departement_nom || (
                        <span className="text-base-content/30">Non défini</span>
                      )}
                    </p>
                  </div>
                </div>

                {poste.description && (
                  <div className="mt-5 pt-5 border-t border-base-200">
                    <label className="text-xs text-base-content/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Description
                    </label>
                    <p className="mt-2 text-base-content/80 whitespace-pre-line text-sm">
                      {poste.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fourchette salariale */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                <h2 className="font-semibold text-sm">Fourchette salariale</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  <div className="stat bg-base-200/30 rounded-lg p-4">
                    <div className="stat-title text-xs text-base-content/50">Minimum</div>
                    <div className="stat-value text-lg text-base-content">
                      {formaterMontant(poste.salaire_min)}
                    </div>
                  </div>

                  <div className="stat bg-success/5 rounded-lg p-4 border border-success/20">
                    <div className="stat-title text-xs text-success flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Moyenne
                    </div>
                    <div className="stat-value text-lg text-success">
                      {moyenne ? formaterMontant(moyenne) : '—'}
                    </div>
                  </div>

                  <div className="stat bg-base-200/30 rounded-lg p-4">
                    <div className="stat-title text-xs text-base-content/50">Maximum</div>
                    <div className="stat-value text-lg text-base-content">
                      {formaterMontant(poste.salaire_max)}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Employés occupant ce poste */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                <Users className="w-4 h-4 text-info" />
                <h2 className="font-semibold text-sm">Employés occupant ce poste</h2>
                <span className="badge badge-info badge-sm ml-auto">{employes.length}</span>
              </div>

              <div className="p-5">
                {employes.length > 0 ? (
                  <div className="space-y-2">
                    {employes.map((emp) => (
                      <Link
                        key={emp.id}
                        to={`/employes/${emp.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {emp.prenom} {emp.nom}
                          </p>
                          <p className="text-xs text-base-content/50">
                            {emp.matricule} • {emp.telephone || emp.email || 'Pas de contact'}
                          </p>
                        </div>
                        <span className={`badge badge-sm ${
                          emp.statut === 'actif' ? 'badge-success' :
                          emp.statut === 'suspendu' ? 'badge-warning' : 'badge-ghost'
                        }`}>
                          {emp.statut || 'actif'}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                    <p className="text-sm text-base-content/50">
                      Aucun employé n'occupe encore ce poste
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
                      {formaterDateHeure(poste.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase tracking-wider">Modifié le</label>
                    <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(poste.updated_at)}
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
                  <Briefcase className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-bold mt-2">{poste.nom}</h3>
              {poste.departement_nom && (
                <span className="badge badge-ghost badge-sm gap-1 mx-auto">
                  <Building2 className="w-3 h-3" />
                  {poste.departement_nom}
                </span>
              )}

              <div className="stats stats-vertical shadow mt-4">
                <div className="stat">
                  <div className="stat-title text-xs">Employés</div>
                  <div className="stat-value text-2xl text-primary">
                    {employes.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3">Actions rapides</h4>
              <div className="space-y-2">
                <Link
                  to={`/employes/ajouter?poste=${id}`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un employé
                </Link>
                <Link
                  to={`/postes/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier ce poste
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
              <h3 className="text-xl font-bold mb-2">Supprimer le poste</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement le poste{' '}
                <span className="font-bold">{poste.nom}</span> ?
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
                  onClick={supprimerPoste}
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

export default PosteDetail;