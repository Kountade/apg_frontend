// pages/postes/PosteForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, Save, Edit, Loader2, AlertCircle,
  CheckCircle, Plus, Info, Building2, DollarSign, Eye, Users,
  TrendingUp  // ✅ AJOUTÉ — c'était la cause de la page blanche
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MAX_DESCRIPTION = 500;

const PosteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const posteId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    nom: '',
    departement: '',
    salaire_min: '',
    salaire_max: '',
    description: '',
  });

  const [departements, setDepartements] = useState([]);

  useEffect(() => {
    chargerDepartements();
    if (estEdition && posteId) {
      chargerPoste(posteId);
    }
  }, [id]);

  const chargerDepartements = async () => {
    try {
      const response = await AxiosInstance.get('/departements/');
      const data = response.data.results || response.data || [];
      setDepartements(data);
    } catch (err) {
      console.error('Erreur chargement départements:', err);
    }
  };

  const chargerPoste = async (pId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/postes/${pId}/`);
      const data = response.data;
      setFormData({
        nom: data.nom || '',
        departement: data.departement || '',
        salaire_min: data.salaire_min || '',
        salaire_max: data.salaire_max || '',
        description: data.description || '',
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données du poste');
      if (err.response?.status === 404) {
        setErreur('Poste non trouvé');
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
          if (key === 'departement') {
            dataToSend[key] = null;
          } else if (key === 'salaire_min' || key === 'salaire_max') {
            dataToSend[key] = 0;
          } else {
            delete dataToSend[key];
          }
        }
      });

      const min = Number(dataToSend.salaire_min) || 0;
      const max = Number(dataToSend.salaire_max) || 0;
      if (max && min && max < min) {
        setErreur('Le salaire maximum doit être supérieur ou égal au salaire minimum.');
        setChargement(false);
        return;
      }

      if (estEdition && posteId) {
        await AxiosInstance.patch(`/postes/${posteId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/postes/${posteId}`), 1200);
      } else {
        await AxiosInstance.post('/postes/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/postes'), 1200);
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

  const departementSelectionne = departements.find(
    (d) => String(d.id) === String(formData.departement)
  );

  const formatMontant = (val) => {
    if (!val) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(val)) + ' GNF';
  };

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate(estEdition ? `/postes/${posteId}` : '/postes')}
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
              <span>Postes</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier — {formData.nom || 'Poste'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouveau poste
                </>
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 shadow-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            {estEdition ? 'Poste modifié avec succès !' : 'Poste créé avec succès !'}
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

      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          <div className="lg:col-span-2 space-y-6">

            {/* Section 1 — Informations du poste */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations du poste</h2>
                  <span className="text-xs text-base-content/40 ml-auto">Intitulé et affectation</span>
                </div>

                <div className="p-5 space-y-5">

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        Intitulé du poste
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                      <input
                        type="text"
                        name="nom"
                        className="input input-bordered w-full pl-10 focus:input-primary"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Chauffeur, Comptable, Superviseur..."
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        Département
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                      <select
                        name="departement"
                        className="select select-bordered w-full pl-10 focus:select-primary"
                        value={formData.departement}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner un département —</option>
                        {departements.map((dep) => (
                          <option key={dep.id} value={dep.id}>
                            {dep.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Département auquel ce poste est rattaché
                      </span>
                    </label>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 2 — Fourchette salariale */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Fourchette salariale</h2>
                  <span className="text-xs text-base-content/40 ml-auto">Montants en GNF</span>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Salaire minimum</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="salaire_min"
                          className="input input-bordered w-full pl-14 focus:input-primary"
                          value={formData.salaire_min}
                          onChange={handleChange}
                          min="0"
                          step="1000"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Salaire maximum</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="salaire_max"
                          className="input input-bordered w-full pl-14 focus:input-primary"
                          value={formData.salaire_max}
                          onChange={handleChange}
                          min="0"
                          step="1000"
                          placeholder="0"
                        />
                      </div>
                    </div>

                  </div>

                  {formData.salaire_min && formData.salaire_max && (
                    <div className="mt-4 p-3 rounded-lg bg-success/5 border border-success/20 flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
                      <div className="text-xs">
                        <span className="text-base-content/60">Salaire moyen :</span>
                        <span className="font-semibold ml-1">
                          {formatMontant((Number(formData.salaire_min) + Number(formData.salaire_max)) / 2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3 — Description */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Info className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Description</h2>
                </div>

                <div className="p-5">
                  <div className="form-control w-full">
                    <div className="flex items-center justify-between pb-1.5">
                      <label className="label py-0">
                        <span className="label-text text-sm font-medium">
                          Description du poste
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
                      placeholder="Missions, responsabilités, compétences requises..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu en direct</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {formData.nom || 'Intitulé du poste'}
                      </p>
                      {departementSelectionne ? (
                        <span className="badge badge-ghost badge-sm mt-0.5">
                          {departementSelectionne.nom}
                        </span>
                      ) : (
                        <p className="text-xs text-base-content/40 mt-0.5">
                          Aucun département
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Salaire min :</span>
                      <span className="font-medium ml-auto">
                        {formatMontant(formData.salaire_min)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Salaire max :</span>
                      <span className="font-medium ml-auto">
                        {formatMontant(formData.salaire_max)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Employés :</span>
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

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-between gap-4 px-6 py-3">

            <div className="hidden md:flex items-center gap-2 text-sm text-base-content/50">
              <AlertCircle className="w-4 h-4" />
              <span>Les champs marqués d'un <span className="text-error font-bold">*</span> sont obligatoires</span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate(estEdition ? `/postes/${posteId}` : '/postes')}
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
                    {estEdition ? 'Enregistrer' : 'Créer le poste'}
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

export default PosteForm;