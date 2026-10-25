// src/components/vehicules/ConducteurForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, UserCheck,
  User, Phone, Award, Shield, Calendar, Info, Eye, AlertTriangle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CATEGORIES_PERMIS = [
  { value: 'A', label: 'A (Moto)' },
  { value: 'B', label: 'B (Voiture)' },
  { value: 'C', label: 'C (Camion)' },
  { value: 'D', label: 'D (Bus)' },
  { value: 'E', label: 'E (Remorque)' },
];

const ConducteurForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const estEdition = id && id !== 'ajouter';
  const conducteurId = estEdition ? id : null;

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [employes, setEmployes] = useState([]);
  const [employesDisponibles, setEmployesDisponibles] = useState([]);

  const [formData, setFormData] = useState({
    employe: '',
    numero_permis: '',
    categorie_permis: '',
    date_expiration_permis: '',
    annees_experience: 0,
    actif: true,
  });

  useEffect(() => {
    chargerEmployes();
    if (estEdition) {
      chargerConducteur();
    } else {
      setChargementInitial(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerEmployes = async () => {
    try {
      const [empRes, conducteursRes] = await Promise.all([
        AxiosInstance.get('/employes/?page_size=500'),
        AxiosInstance.get('/conducteurs/?page_size=500').catch(() => ({ data: [] })),
      ]);
      const tousEmployes = empRes.data.results || empRes.data || [];
      const conducteursExistants = conducteursRes.data.results || conducteursRes.data || [];

      setEmployes(tousEmployes);

      // Filtrer les employés qui n'ont pas déjà un profil conducteur
      // (sauf l'employé du conducteur en cours d'édition)
      const employeIdsDejaConducteurs = conducteursExistants
        .map(c => c.employe)
        .filter(empId => {
          // En édition, exclure l'employé actuel du filtre
          if (estEdition && String(empId) === String(formData.employe)) return false;
          return true;
        });

      const dispo = tousEmployes.filter(
        emp => !employeIdsDejaConducteurs.includes(emp.id)
      );
      setEmployesDisponibles(dispo);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerConducteur = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/conducteurs/${conducteurId}/`);
      const d = res.data;
      setFormData({
        employe: d.employe || '',
        numero_permis: d.numero_permis || '',
        categorie_permis: d.categorie_permis || '',
        date_expiration_permis: d.date_expiration_permis || '',
        annees_experience: d.annees_experience || 0,
        actif: d.actif !== undefined ? d.actif : true,
      });
    } catch (err) {
      setErreur('Impossible de charger le conducteur');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(k => {
        if (dataToSend[k] === '' || dataToSend[k] === null) {
          if (['numero_permis', 'categorie_permis', 'date_expiration_permis'].includes(k)) {
            dataToSend[k] = '';
          } else if (k === 'annees_experience') {
            dataToSend[k] = 0;
          }
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/conducteurs/${conducteurId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/conducteurs'), 1200);
      } else {
        await AxiosInstance.post('/conducteurs/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/conducteurs'), 1200);
      }
    } catch (err) {
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

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  const employeSelectionne = employes.find(
    e => String(e.id) === String(formData.employe)
  );

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/conducteurs')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Véhicules / Conducteurs / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <UserCheck className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier le conducteur' : 'Nouveau conducteur'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Conducteur {estEdition ? 'modifié' : 'créé'} !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Identification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Employé</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Employé <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="employe"
                      className="select select-bordered w-full"
                      value={formData.employe || ''}
                      onChange={handleChange}
                      required
                      disabled={estEdition}
                    >
                      <option value="">— Sélectionner un employé —</option>
                      {estEdition && employeSelectionne && (
                        <option value={employeSelectionne.id}>
                          {employeSelectionne.nom_complet || `Employé #${employeSelectionne.id}`}
                        </option>
                      )}
                      {!estEdition && employesDisponibles.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nom_complet || `Employé #${emp.id}`}
                        </option>
                      ))}
                    </select>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        {estEdition
                          ? "L'employé ne peut pas être changé après création."
                          : "Seuls les employés sans profil conducteur sont listés."}
                      </span>
                    </label>
                  </div>

                  {employeSelectionne && (
                    <div className="alert alert-info py-2">
                      <User className="w-4 h-4" />
                      <div className="text-xs">
                        <p><strong>{employeSelectionne.nom_complet}</strong></p>
                        {employeSelectionne.telephone && (
                          <p className="text-base-content/60 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {employeSelectionne.telephone}
                          </p>
                        )}
                        {employeSelectionne.email && (
                          <p className="text-base-content/60">{employeSelectionne.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Permis */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Permis de conduire</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° de permis</span>
                      </label>
                      <input
                        type="text"
                        name="numero_permis"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_permis}
                        onChange={handleChange}
                        maxLength="50"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Catégorie</span>
                      </label>
                      <select
                        name="categorie_permis"
                        className="select select-bordered w-full"
                        value={formData.categorie_permis || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Aucune —</option>
                        {CATEGORIES_PERMIS.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date d'expiration du permis
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_expiration_permis"
                        className="input input-bordered w-full"
                        value={formData.date_expiration_permis}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Années d'expérience
                        </span>
                      </label>
                      <input
                        type="number"
                        name="annees_experience"
                        className="input input-bordered w-full font-mono"
                        value={formData.annees_experience}
                        onChange={handleChange}
                        min="0"
                        max="70"
                      />
                    </div>
                  </div>

                  {formData.date_expiration_permis && (
                    <div className={`alert py-2 ${
                      new Date(formData.date_expiration_permis) >= new Date()
                        ? 'alert-success'
                        : 'alert-error'
                    }`}>
                      {new Date(formData.date_expiration_permis) >= new Date() ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Permis valide</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs">Permis expiré</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-5">
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3 py-0">
                    <input
                      type="checkbox"
                      name="actif"
                      className="checkbox checkbox-success"
                      checked={formData.actif}
                      onChange={handleChange}
                    />
                    <span className="label-text font-medium">Conducteur actif</span>
                  </label>
                  <label className="label py-0 pt-1 pl-0">
                    <span className="label-text-alt text-xs text-base-content/50">
                      Un conducteur inactif ne peut pas être affecté à un véhicule.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* APERÇU */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.numero_permis || 'Sans permis'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {employeSelectionne?.nom_complet || 'Employé'}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Catégorie :</span>
                      <span className="font-medium">{formData.categorie_permis || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Expiration :</span>
                      <span className="font-mono text-xs">
                        {formData.date_expiration_permis
                          ? new Date(formData.date_expiration_permis).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Expérience :</span>
                      <span className="font-mono">{formData.annees_experience || 0} ans</span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                    {formData.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">À savoir</p>
                    <p className="text-base-content/70">
                      Un conducteur est un <strong>profil lié à un employé</strong>.
                      Un même employé ne peut avoir qu'un seul profil conducteur.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <button
              type="button"
              onClick={() => navigate('/conducteurs')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[160px]"
              disabled={chargement || employesDisponibles.length === 0}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le conducteur'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConducteurForm;