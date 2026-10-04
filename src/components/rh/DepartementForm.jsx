// pages/departements/DepartementForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, Hash, FileText, Save, Edit,
  Loader2, AlertCircle, CheckCircle, UserCog, Plus,
  Info, Users, Briefcase, Eye
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MAX_DESCRIPTION = 500;

const DepartementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const departementId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    description: '',
    responsable: '',
  });

  const [employes, setEmployes] = useState([]);

  useEffect(() => {
    chargerEmployes();
    if (estEdition && departementId) {
      chargerDepartement(departementId);
    }
  }, [id]);

  const chargerEmployes = async () => {
    try {
      const response = await AxiosInstance.get('/employes/');
      const data = response.data.results || response.data || [];
      setEmployes(data);
    } catch (err) {
      console.error('Erreur chargement employés:', err);
    }
  };

  const chargerDepartement = async (depId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/departements/${depId}/`);
      const data = response.data;
      setFormData({
        nom: data.nom || '',
        code: data.code || '',
        description: data.description || '',
        responsable: data.responsable || '',
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données du département');
      if (err.response?.status === 404) {
        setErreur('Département non trouvé');
      }
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };

      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (key === 'responsable') {
            dataToSend[key] = null;
          } else {
            delete dataToSend[key];
          }
        }
      });

      if (estEdition && departementId) {
        await AxiosInstance.patch(`/departements/${departementId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/departements/${departementId}`), 1200);
      } else {
        await AxiosInstance.post('/departements/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/departements'), 1200);
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setErreur(errors.join(', '));
      } else {
        setErreur("Erreur lors de l'enregistrement");
      }
    } finally {
      setChargement(false);
    }
  };

  const responsableSelectionne = employes.find(
    (e) => String(e.id) === String(formData.responsable)
  );

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* ============================================ */}
      {/* EN-TÊTE PROFESSIONNEL                         */}
      {/* ============================================ */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">

          <button
            onClick={() => navigate(estEdition ? `/departements/${departementId}` : '/departements')}
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
              <span>Départements</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier — {formData.nom || 'Département'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouveau département
                </>
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MESSAGES                                      */}
      {/* ============================================ */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 shadow-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            {estEdition ? 'Département modifié avec succès !' : 'Département créé avec succès !'}
          </span>
          <span className="text-xs opacity-70 ml-auto">Redirection en cours...</span>
        </div>
      )}

      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 shadow-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{erreur}</span>
        </div>
      )}

      {/* ============================================ */}
      {/* FORMULAIRE PRINCIPAL                          */}
      {/* ============================================ */}
      <form onSubmit={handleSubmit} className="w-full">

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          {/* ===== COLONNE PRINCIPALE (2/3) ===== */}
          <div className="lg:col-span-2 space-y-6">

            {/* SECTION 1 — Identification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">

                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                  <span className="text-xs text-base-content/40 ml-auto">Informations principales</span>
                </div>

                <div className="p-5 space-y-5">

                  {/* Nom */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        Nom du département
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                      <input
                        type="text"
                        name="nom"
                        className="input input-bordered w-full pl-10 focus:input-primary"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Ressources Humaines"
                      />
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Nom complet du département tel qu'il apparaîtra dans l'organigramme
                      </span>
                    </label>
                  </div>

                  {/* Code */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        Code
                        <div className="tooltip tooltip-right" data-tip="Code court utilisé pour la référence interne (3-6 caractères)">
                          <Info className="w-3.5 h-3.5 text-base-content/40" />
                        </div>
                      </span>
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                      <input
                        type="text"
                        name="code"
                        className="input input-bordered w-full pl-10 font-mono uppercase focus:input-primary"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="RH, COMPTA, LOG..."
                        maxLength={10}
                      />
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Optionnel — utilisé pour la numérotation et les rapports
                      </span>
                    </label>
                  </div>

                  {/* Responsable */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        Responsable du département
                      </span>
                    </label>
                    <div className="relative">
                      <UserCog className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                      <select
                        name="responsable"
                        className="select select-bordered w-full pl-10 focus:select-primary"
                        value={formData.responsable}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun responsable désigné —</option>
                        {employes.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.matricule ? `[${emp.matricule}] ` : ''}
                            {emp.prenom} {emp.nom}
                            {emp.poste_nom ? ` — ${emp.poste_nom}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Employé qui supervisera ce département
                      </span>
                    </label>
                  </div>

                  {/* Description */}
                  <div className="form-control w-full">
                    <div className="flex items-center justify-between pb-1.5">
                      <label className="label py-0">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-base-content/60" />
                          Description
                        </span>
                      </label>
                      <span className={`text-xs ${
                        formData.description.length > MAX_DESCRIPTION
                          ? 'text-error font-medium'
                          : 'text-base-content/40'
                      }`}>
                        {formData.description.length} / {MAX_DESCRIPTION}
                      </span>
                    </div>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full focus:textarea-primary min-h-[120px]"
                      rows="5"
                      maxLength={MAX_DESCRIPTION}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Décrivez les missions et responsabilités de ce département..."
                    ></textarea>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Optionnel — aidez les utilisateurs à comprendre le rôle de ce département
                      </span>
                    </label>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* ===== COLONNE LATÉRALE (1/3) ===== */}
          <div className="lg:col-span-1 space-y-6">

            {/* Aperçu live */}
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu en direct</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {formData.nom || 'Nom du département'}
                      </p>
                      {formData.code ? (
                        <span className="badge badge-ghost badge-sm font-mono mt-0.5">
                          {formData.code}
                        </span>
                      ) : (
                        <p className="text-xs text-base-content/40 mt-0.5">
                          Code non défini
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Responsable :</span>
                      <span className="font-medium truncate ml-auto">
                        {responsableSelectionne
                          ? `${responsableSelectionne.prenom} ${responsableSelectionne.nom}`
                          : 'Aucun'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Employés :</span>
                      <span className="font-medium ml-auto">0</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Postes :</span>
                      <span className="font-medium ml-auto">0</span>
                    </div>
                  </div>

                  {formData.description && (
                    <>
                      <div className="divider my-3"></div>
                      <p className="text-xs text-base-content/60 line-clamp-3">
                        {formData.description}
                      </p>
                    </>
                  )}
                </div>

                <p className="text-xs text-base-content/40 mt-3 text-center">
                  L'aperçu se met à jour au fur et à mesure de votre saisie
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================ */}
        {/* BARRE D'ACTIONS STICKY                        */}
        {/* ============================================ */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-between gap-4 px-6 py-3">

            <div className="hidden md:flex items-center gap-2 text-sm text-base-content/50">
              <AlertCircle className="w-4 h-4" />
              <span>Les champs marqués d'un <span className="text-error font-bold">*</span> sont obligatoires</span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate(estEdition ? `/departements/${departementId}` : '/departements')}
                className="btn btn-ghost gap-2"
                disabled={chargement}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 min-w-[160px]"
                disabled={chargement}
              >
                {chargement ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {estEdition ? 'Enregistrement...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {estEdition ? 'Enregistrer' : 'Créer le département'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default DepartementForm;