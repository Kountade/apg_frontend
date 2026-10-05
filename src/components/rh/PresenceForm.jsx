// pages/presences/PresenceForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ClipboardCheck, Save, Edit, Loader2, AlertCircle,
  CheckCircle, Plus, Info, Building2, Eye, User, Calendar,
  Clock, Sunrise, Sunset, FileText, TrendingUp, CalendarDays,
  Fingerprint, AlertTriangle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const PresenceForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const presenceId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    employe: '',
    date: new Date().toISOString().split('T')[0],
    heure_arrivee: '',
    heure_depart: '',
    statut: 'present',
    motif: '',
    heures_travaillees: 0,
  });

  const [employes, setEmployes] = useState([]);
  const [fichierJustificatif, setFichierJustificatif] = useState(null);

  useEffect(() => {
    chargerEmployes();
    if (estEdition && presenceId) {
      chargerPresence(presenceId);
    } else {
      const empParam = searchParams.get('employe');
      const dateParam = searchParams.get('date');
      if (empParam) setFormData(prev => ({ ...prev, employe: empParam }));
      if (dateParam) setFormData(prev => ({ ...prev, date: dateParam }));
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

  const chargerPresence = async (pId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/presences/${pId}/`);
      const data = response.data;
      setFormData({
        employe: data.employe || '',
        date: data.date || '',
        heure_arrivee: data.heure_arrivee || '',
        heure_depart: data.heure_depart || '',
        statut: data.statut || 'present',
        motif: data.motif || '',
        heures_travaillees: data.heures_travaillees || 0,
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de la présence');
      if (err.response?.status === 404) {
        setErreur('Présence non trouvée');
      }
    } finally {
      setChargementInitial(false);
    }
  };

  // Calcul automatique des heures travaillées
  useEffect(() => {
    if (formData.heure_arrivee && formData.heure_depart) {
      const [hA, mA] = formData.heure_arrivee.split(':').map(Number);
      const [hD, mD] = formData.heure_depart.split(':').map(Number);
      const minutesTotal = (hD * 60 + mD) - (hA * 60 + mA);
      if (minutesTotal > 0) {
        const heures = minutesTotal / 60;
        setFormData(prev => ({ ...prev, heures_travaillees: heures.toFixed(2) }));
      }
    }
  }, [formData.heure_arrivee, formData.heure_depart]);

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
      // Validation
      if (formData.heure_arrivee && formData.heure_depart) {
        if (formData.heure_depart <= formData.heure_arrivee) {
          setErreur("L'heure de départ doit être postérieure à l'heure d'arrivée.");
          setChargement(false);
          return;
        }
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

      if (estEdition && presenceId) {
        await AxiosInstance.patch(`/presences/${presenceId}/`, payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/presences/${presenceId}`), 1200);
      } else {
        await AxiosInstance.post('/presences/', payload, config);
        setSucces(true);
        setTimeout(() => navigate('/presences'), 1200);
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
            onClick={() => navigate(estEdition ? `/presences/${presenceId}` : '/presences')}
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
              <span>Présences</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Enregistrement'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier la présence</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouvelle présence
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
            {estEdition ? 'Présence modifiée avec succès !' : 'Présence enregistrée avec succès !'}
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

            {/* Section 1 — Employé & Date */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Employé & Date</h2>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Date
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                        <input
                          type="date"
                          name="date"
                          className="input input-bordered w-full pl-10 focus:input-primary"
                          value={formData.date}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Statut
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="statut"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.statut}
                        onChange={handleChange}
                        required
                      >
                        <option value="present">Présent</option>
                        <option value="absent">Absent</option>
                        <option value="retard">Retard</option>
                        <option value="mission">Mission</option>
                        <option value="conge">Congé</option>
                        <option value="repos">Repos</option>
                        <option value="depart_anticipe">Départ anticipé</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 2 — Horaires */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Horaires</h2>
                  <span className="text-xs text-base-content/40 ml-auto">Heures travaillées calculées automatiquement</span>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Sunrise className="w-3.5 h-3.5 text-info" />
                          Heure d'arrivée
                        </span>
                      </label>
                      <input
                        type="time"
                        name="heure_arrivee"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.heure_arrivee}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Sunset className="w-3.5 h-3.5 text-warning" />
                          Heure de départ
                        </span>
                      </label>
                      <input
                        type="time"
                        name="heure_depart"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.heure_depart}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {formData.heures_travaillees > 0 && (
                    <div className="p-3 rounded-lg bg-success/5 border border-success/20 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-success flex-shrink-0" />
                      <div className="text-xs">
                        <span className="text-base-content/60">Heures travaillées :</span>
                        <span className="font-semibold ml-1">
                          {Number(formData.heures_travaillees).toFixed(2)} heures
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
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Motif</span>
                    </label>
                    <textarea
                      name="motif"
                      className="textarea textarea-bordered w-full focus:textarea-primary"
                      rows="3"
                      value={formData.motif}
                      onChange={handleChange}
                      placeholder="Préciser le motif en cas d'absence, retard, mission..."
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Justificatif (PDF, image)</span>
                    </label>
                    <input
                      type="file"
                      className="file-input file-input-bordered w-full focus:file-input-primary"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Certificat médical, autorisation, ordre de mission...
                      </span>
                    </label>
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
                  {employeSelectionne ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">
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
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <User className="w-10 h-10 text-base-content/20 mx-auto mb-2" />
                      <p className="text-xs text-base-content/40">Aucun employé sélectionné</p>
                    </div>
                  )}

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Date :</span>
                      <span className="font-medium ml-auto">
                        {formData.date || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sunrise className="w-3.5 h-3.5 text-info flex-shrink-0" />
                      <span className="text-base-content/60">Arrivée :</span>
                      <span className="font-medium ml-auto">
                        {formData.heure_arrivee || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sunset className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                      <span className="text-base-content/60">Départ :</span>
                      <span className="font-medium ml-auto">
                        {formData.heure_depart || '—'}
                      </span>
                    </div>

                    {formData.heures_travaillees > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-success flex-shrink-0" />
                        <span className="text-base-content/60">Heures :</span>
                        <span className="font-medium ml-auto text-success">
                          {Number(formData.heures_travaillees).toFixed(2)}h
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-center">
                    <span className={`badge badge-sm ${
                      formData.statut === 'present' ? 'badge-success' :
                      formData.statut === 'absent' ? 'badge-error' :
                      formData.statut === 'retard' ? 'badge-warning' :
                      formData.statut === 'mission' ? 'badge-info' :
                      formData.statut === 'conge' ? 'badge-primary' : 'badge-ghost'
                    }`}>
                      {formData.statut === 'present' ? 'Présent' :
                       formData.statut === 'absent' ? 'Absent' :
                       formData.statut === 'retard' ? 'Retard' :
                       formData.statut === 'mission' ? 'Mission' :
                       formData.statut === 'conge' ? 'Congé' :
                       formData.statut === 'depart_anticipe' ? 'Départ anticipé' : 'Repos'}
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
                onClick={() => navigate(estEdition ? `/presences/${presenceId}` : '/presences')}
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
                    {estEdition ? 'Enregistrer' : 'Enregistrer'}
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

export default PresenceForm;