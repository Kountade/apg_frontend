// pages/absences/AbsenceForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, AlertCircle, Save, Edit, Loader2,
  CheckCircle, Plus, Info, Building2, Eye, User, Calendar,
  FileText, Stethoscope, Shield, AlertTriangle, Clock,
  Upload, X, UserCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MAX_MOTIF = 500;

const AbsenceForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const absenceId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    employe: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date().toISOString().split('T')[0],
    type: 'injustifiee',
    motif: '',
    statut: 'en_attente',
  });

  const [employes, setEmployes] = useState([]);
  const [fichierJustificatif, setFichierJustificatif] = useState(null);

  useEffect(() => {
    chargerEmployes();
    if (estEdition && absenceId) {
      chargerAbsence(absenceId);
    } else {
      const empParam = searchParams.get('employe');
      if (empParam) setFormData(prev => ({ ...prev, employe: empParam }));
    }
  }, [id]);

  const chargerEmployes = async () => {
    try {
      const response = await AxiosInstance.get('/employes/');
      const data = response.data.results || response.data || [];
      setEmployes(data.filter(e => e.statut === 'actif'));
    } catch (err) {
      console.error('Erreur chargement employés:', err);
    }
  };

  const chargerAbsence = async (aId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/absences/${aId}/`);
      const data = response.data;
      setFormData({
        employe: data.employe || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        type: data.type || 'injustifiee',
        motif: data.motif || '',
        statut: data.statut || 'en_attente',
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de l\'absence');
      if (err.response?.status === 404) {
        setErreur('Absence non trouvée');
      }
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFichierJustificatif(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      // Validation dates
      if (formData.date_fin < formData.date_debut) {
        setErreur('La date de fin doit être postérieure ou égale à la date de début.');
        setChargement(false);
        return;
      }

      const dataToSend = { ...formData };

      // Nettoyage
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (key === 'employe') {
            // employé obligatoire
          } else {
            delete dataToSend[key];
          }
        }
      });

      let payload = dataToSend;
      if (fichierJustificatif) {
        payload = new FormData();
        Object.entries(dataToSend).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            payload.append(key, value);
          }
        });
        payload.append('justificatif', fichierJustificatif);
      }

      const config = fichierJustificatif
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      if (estEdition && absenceId) {
        await AxiosInstance.patch(`/absences/${absenceId}/`, payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/absences/${absenceId}`), 1200);
      } else {
        await AxiosInstance.post('/absences/', payload, config);
        setSucces(true);
        setTimeout(() => navigate('/absences'), 1200);
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

  const employeSelectionne = employes.find(
    (e) => String(e.id) === String(formData.employe)
  );

  const calculerDuree = () => {
    if (!formData.date_debut || !formData.date_fin) return 0;
    const diff = Math.ceil((new Date(formData.date_fin) - new Date(formData.date_debut)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
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
            onClick={() => navigate(estEdition ? `/absences/${absenceId}` : '/absences')}
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
              <span>Absences</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier l'absence</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouvelle absence
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
            {estEdition ? 'Absence modifiée avec succès !' : 'Absence enregistrée avec succès !'}
          </span>
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

            {/* Section 1 — Employé & Type */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Employé & Type</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        Employé concerné
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                      <select
                        name="employe"
                        className="select select-bordered w-full pl-10 focus:select-primary"
                        value={formData.employe}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner un employé —</option>
                        {employes.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.matricule ? `[${emp.matricule}] ` : ''}
                            {emp.prenom} {emp.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        Type d'absence
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.type === 'maladie'
                          ? 'border-error bg-error/5'
                          : 'border-base-300 hover:border-error/50'
                      }`}>
                        <input
                          type="radio"
                          name="type"
                          value="maladie"
                          checked={formData.type === 'maladie'}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <Stethoscope className={`w-6 h-6 ${formData.type === 'maladie' ? 'text-error' : 'text-base-content/40'}`} />
                        <span className="text-sm font-medium">Maladie</span>
                      </label>

                      <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.type === 'injustifiee'
                          ? 'border-warning bg-warning/5'
                          : 'border-base-300 hover:border-warning/50'
                      }`}>
                        <input
                          type="radio"
                          name="type"
                          value="injustifiee"
                          checked={formData.type === 'injustifiee'}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <AlertTriangle className={`w-6 h-6 ${formData.type === 'injustifiee' ? 'text-warning' : 'text-base-content/40'}`} />
                        <span className="text-sm font-medium">Injustifiée</span>
                      </label>

                      <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.type === 'autorisee'
                          ? 'border-info bg-info/5'
                          : 'border-base-300 hover:border-info/50'
                      }`}>
                        <input
                          type="radio"
                          name="type"
                          value="autorisee"
                          checked={formData.type === 'autorisee'}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <Shield className={`w-6 h-6 ${formData.type === 'autorisee' ? 'text-info' : 'text-base-content/40'}`} />
                        <span className="text-sm font-medium">Autorisée</span>
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 2 — Période */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Période d'absence</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Date de début
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_debut"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.date_debut}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Date de fin
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_fin"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.date_fin}
                        onChange={handleChange}
                        required
                        min={formData.date_debut}
                      />
                    </div>
                  </div>

                  {calculerDuree() > 0 && (
                    <div className="p-3 rounded-lg bg-info/5 border border-info/20 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-info flex-shrink-0" />
                      <div className="text-xs">
                        <span className="text-base-content/60">Durée de l'absence :</span>
                        <span className="font-semibold ml-1">
                          {calculerDuree()} jour{calculerDuree() > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Section 3 — Motif & Justificatif */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm">Motif & Justificatif</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="form-control w-full">
                    <div className="flex items-center justify-between pb-1.5">
                      <label className="label py-0">
                        <span className="label-text text-sm font-medium">
                          Motif de l'absence
                        </span>
                      </label>
                      <span className={`text-xs ${
                        formData.motif.length > MAX_MOTIF
                          ? 'text-error font-medium'
                          : 'text-base-content/40'
                      }`}>
                        {formData.motif.length} / {MAX_MOTIF}
                      </span>
                    </div>
                    <textarea
                      name="motif"
                      className="textarea textarea-bordered w-full focus:textarea-primary min-h-[100px]"
                      rows="4"
                      maxLength={MAX_MOTIF}
                      value={formData.motif}
                      onChange={handleChange}
                      placeholder="Précisez le motif de l'absence..."
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Justificatif (certificat médical, autorisation...)
                      </span>
                    </label>
                    <input
                      type="file"
                      className="file-input file-input-bordered w-full focus:file-input-primary"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Optionnel — PDF, JPG ou PNG (max 5 MB)
                      </span>
                    </label>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 4 — Statut */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Statut de la demande</h2>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.statut === 'en_attente'
                        ? 'border-warning bg-warning/5'
                        : 'border-base-300 hover:border-warning/50'
                    }`}>
                      <input
                        type="radio"
                        name="statut"
                        value="en_attente"
                        checked={formData.statut === 'en_attente'}
                        onChange={handleChange}
                        className="radio radio-warning radio-sm"
                      />
                      <div>
                        <span className="text-sm font-medium">En attente</span>
                        <p className="text-xs text-base-content/50">À valider</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.statut === 'valide'
                        ? 'border-success bg-success/5'
                        : 'border-base-300 hover:border-success/50'
                    }`}>
                      <input
                        type="radio"
                        name="statut"
                        value="valide"
                        checked={formData.statut === 'valide'}
                        onChange={handleChange}
                        className="radio radio-success radio-sm"
                      />
                      <div>
                        <span className="text-sm font-medium">Validée</span>
                        <p className="text-xs text-base-content/50">Acceptée</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.statut === 'refuse'
                        ? 'border-error bg-error/5'
                        : 'border-base-300 hover:border-error/50'
                    }`}>
                      <input
                        type="radio"
                        name="statut"
                        value="refuse"
                        checked={formData.statut === 'refuse'}
                        onChange={handleChange}
                        className="radio radio-error radio-sm"
                      />
                      <div>
                        <span className="text-sm font-medium">Refusée</span>
                        <p className="text-xs text-base-content/50">Rejetée</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold text-sm">Aperçu en direct</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  {employeSelectionne ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-warning">
                          {employeSelectionne.prenom?.charAt(0)?.toUpperCase()}
                          {employeSelectionne.nom?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                          {employeSelectionne.prenom} {employeSelectionne.nom}
                        </p>
                        <p className="text-xs text-base-content/50 font-mono">
                          {employeSelectionne.matricule}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <User className="w-10 h-10 text-base-content/20 mx-auto mb-2" />
                      <p className="text-xs text-base-content/40">Aucun employé sélectionné</p>
                    </div>
                  )}

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium ml-auto">
                        {formData.type === 'maladie' ? 'Maladie' :
                         formData.type === 'injustifiee' ? 'Injustifiée' : 'Autorisée'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Début :</span>
                      <span className="font-medium ml-auto">
                        {formData.date_debut || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Fin :</span>
                      <span className="font-medium ml-auto">
                        {formData.date_fin || '—'}
                      </span>
                    </div>

                    {calculerDuree() > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <span className="text-base-content/60">Durée :</span>
                        <span className="font-medium ml-auto">
                          {calculerDuree()} jour{calculerDuree() > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-center">
                    <span className={`badge badge-sm ${
                      formData.statut === 'valide' ? 'badge-success' :
                      formData.statut === 'refuse' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {formData.statut === 'valide' ? 'Validée' :
                       formData.statut === 'refuse' ? 'Refusée' : 'En attente'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-base-content/40 mt-3 text-center">
                  L'aperçu se met à jour en temps réel
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
                onClick={() => navigate(estEdition ? `/absences/${absenceId}` : '/absences')}
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
                    {estEdition ? 'Enregistrer' : "Enregistrer l'absence"}
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

export default AbsenceForm;