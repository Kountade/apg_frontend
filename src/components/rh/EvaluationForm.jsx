// pages/evaluations/EvaluationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Award, Save, Edit, Loader2, AlertCircle,
  CheckCircle, Plus, Info, Building2, Eye, User, Calendar,
  Star, TrendingUp, Target, MessageSquare, ThumbsUp,
  ThumbsDown, FileText, Briefcase, Users
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MAX_TEXT = 1000;

const EvaluationForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const evaluationId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    employe: '',
    evaluateur: '',
    date_evaluation: new Date().toISOString().split('T')[0],
    periode: '',
    note_globale: 12,
    points_forts: '',
    points_ameliorer: '',
    objectifs: '',
  });

  const [employes, setEmployes] = useState([]);

  useEffect(() => {
    chargerEmployes();
    if (estEdition && evaluationId) {
      chargerEvaluation(evaluationId);
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

  const chargerEvaluation = async (eId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/evaluations/${eId}/`);
      const data = response.data;
      setFormData({
        employe: data.employe || '',
        evaluateur: data.evaluateur || '',
        date_evaluation: data.date_evaluation || '',
        periode: data.periode || '',
        note_globale: data.note_globale || 12,
        points_forts: data.points_forts || '',
        points_ameliorer: data.points_ameliorer || '',
        objectifs: data.objectifs || '',
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de l\'évaluation');
      if (err.response?.status === 404) {
        setErreur('Évaluation non trouvée');
      }
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNoteChange = (note) => {
    setFormData(prev => ({ ...prev, note_globale: note }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      // Validation
      const note = Number(formData.note_globale);
      if (note < 0 || note > 20) {
        setErreur('La note doit être comprise entre 0 et 20.');
        setChargement(false);
        return;
      }

      const dataToSend = { ...formData };

      // Nettoyage
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (key === 'employe' || key === 'note_globale') {
            // obligatoires
          } else if (key === 'evaluateur') {
            dataToSend[key] = null;
          } else {
            delete dataToSend[key];
          }
        }
      });

      if (estEdition && evaluationId) {
        await AxiosInstance.patch(`/evaluations/${evaluationId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/evaluations/${evaluationId}`), 1200);
      } else {
        await AxiosInstance.post('/evaluations/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/evaluations'), 1200);
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
  const evaluateurSelectionne = employes.find(
    (e) => String(e.id) === String(formData.evaluateur)
  );

  // Info note
  const getNoteInfo = (note) => {
    const n = Number(note);
    if (n >= 16) return { label: 'Excellent', cls: 'text-success', bg: 'bg-success/10', icon: Star };
    if (n >= 12) return { label: 'Bon', cls: 'text-info', bg: 'bg-info/10', icon: ThumbsUp };
    if (n >= 8) return { label: 'Moyen', cls: 'text-warning', bg: 'bg-warning/10', icon: TrendingUp };
    return { label: 'Faible', cls: 'text-error', bg: 'bg-error/10', icon: AlertCircle };
  };

  const noteInfo = getNoteInfo(formData.note_globale);
  const NoteIcon = noteInfo.icon;

  // Étoiles
  const etoiles = Math.round((Number(formData.note_globale) / 20) * 5);

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
            onClick={() => navigate(estEdition ? `/evaluations/${evaluationId}` : '/evaluations')}
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
              <span>Évaluations</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier l'évaluation</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouvelle évaluation
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
            {estEdition ? 'Évaluation modifiée avec succès !' : 'Évaluation créée avec succès !'}
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
      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          <div className="lg:col-span-2 space-y-6">

            {/* Section 1 — Identification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Employé évalué
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
                          <Briefcase className="w-3.5 h-3.5 text-base-content/40" />
                          Évaluateur (optionnel)
                        </span>
                      </label>
                      <select
                        name="evaluateur"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.evaluateur}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun —</option>
                        {employes
                          .filter(e => String(e.id) !== String(formData.employe))
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
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
                          <Calendar className="w-3.5 h-3.5 text-base-content/40" />
                          Date d'évaluation
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_evaluation"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.date_evaluation}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-base-content/40" />
                          Période évaluée
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="periode"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.periode}
                        onChange={handleChange}
                        required
                        placeholder="Ex: T1 2026, Année 2025, Trimestre 1..."
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 2 — Note globale */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Award className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm">Note globale</h2>
                  <span className="text-xs text-base-content/40 ml-auto">Sur 20 points</span>
                </div>

                <div className="p-5">

                  {/* Affichage de la note */}
                  <div className={`p-6 rounded-2xl ${noteInfo.bg} border border-base-300 mb-5 text-center`}>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <NoteIcon className={`w-8 h-8 ${noteInfo.cls}`} />
                      <span className={`text-5xl font-bold ${noteInfo.cls}`}>
                        {Number(formData.note_globale).toFixed(1)}
                      </span>
                      <span className="text-2xl text-base-content/40 font-medium">/20</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < etoiles ? 'fill-warning text-warning' : 'text-base-content/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-sm font-semibold ${noteInfo.cls}`}>
                      {noteInfo.label}
                    </p>
                  </div>

                  {/* Slider */}
                  <div className="form-control w-full">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      className="range range-primary"
                      value={formData.note_globale}
                      onChange={(e) => handleNoteChange(e.target.value)}
                    />
                    <div className="w-full flex justify-between text-xs px-2 mt-1 text-base-content/40">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                    </div>
                  </div>

                  {/* Saisie directe */}
                  <div className="form-control w-full mt-5">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Saisie directe</span>
                    </label>
                    <input
                      type="number"
                      name="note_globale"
                      className="input input-bordered w-full focus:input-primary text-center text-xl font-bold"
                      value={formData.note_globale}
                      onChange={handleChange}
                      min="0"
                      max="20"
                      step="0.5"
                    />
                  </div>

                  {/* Échelle */}
                  <div className="grid grid-cols-4 gap-2 mt-5">
                    <div className="text-center p-2 rounded-lg bg-success/5 border border-success/20">
                      <p className="text-[10px] text-base-content/50 mb-0.5">Excellent</p>
                      <p className="text-sm font-bold text-success">16-20</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-info/5 border border-info/20">
                      <p className="text-[10px] text-base-content/50 mb-0.5">Bon</p>
                      <p className="text-sm font-bold text-info">12-15</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-warning/5 border border-warning/20">
                      <p className="text-[10px] text-base-content/50 mb-0.5">Moyen</p>
                      <p className="text-sm font-bold text-warning">8-11</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-error/5 border border-error/20">
                      <p className="text-[10px] text-base-content/50 mb-0.5">Faible</p>
                      <p className="text-sm font-bold text-error">0-7</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 3 — Analyse détaillée */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Analyse détaillée</h2>
                </div>

                <div className="p-5 space-y-5">

                  {/* Points forts */}
                  <div className="form-control w-full">
                    <div className="flex items-center justify-between pb-1.5">
                      <label className="label py-0">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5 text-success">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Points forts
                        </span>
                      </label>
                      <span className="text-xs text-base-content/40">
                        {formData.points_forts.length} / {MAX_TEXT}
                      </span>
                    </div>
                    <textarea
                      name="points_forts"
                      className="textarea textarea-bordered w-full focus:textarea-primary min-h-[100px]"
                      rows="4"
                      maxLength={MAX_TEXT}
                      value={formData.points_forts}
                      onChange={handleChange}
                      placeholder="Compétences, qualités, réussites de l'employé..."
                    ></textarea>
                  </div>

                  {/* Points à améliorer */}
                  <div className="form-control w-full">
                    <div className="flex items-center justify-between pb-1.5">
                      <label className="label py-0">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5 text-warning">
                          <Target className="w-3.5 h-3.5" />
                          Points à améliorer
                        </span>
                      </label>
                      <span className="text-xs text-base-content/40">
                        {formData.points_ameliorer.length} / {MAX_TEXT}
                      </span>
                    </div>
                    <textarea
                      name="points_ameliorer"
                      className="textarea textarea-bordered w-full focus:textarea-primary min-h-[100px]"
                      rows="4"
                      maxLength={MAX_TEXT}
                      value={formData.points_ameliorer}
                      onChange={handleChange}
                      placeholder="Axes d'amélioration, formations nécessaires..."
                    ></textarea>
                  </div>

                  {/* Objectifs */}
                  <div className="form-control w-full">
                    <div className="flex items-center justify-between pb-1.5">
                      <label className="label py-0">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5 text-primary">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Objectifs pour la prochaine période
                        </span>
                      </label>
                      <span className="text-xs text-base-content/40">
                        {formData.objectifs.length} / {MAX_TEXT}
                      </span>
                    </div>
                    <textarea
                      name="objectifs"
                      className="textarea textarea-bordered w-full focus:textarea-primary min-h-[100px]"
                      rows="4"
                      maxLength={MAX_TEXT}
                      value={formData.objectifs}
                      onChange={handleChange}
                      placeholder="Objectifs SMART, indicateurs de performance..."
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
                  {employeSelectionne ? (
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
                  ) : (
                    <div className="text-center py-4">
                      <User className="w-10 h-10 text-base-content/20 mx-auto mb-2" />
                      <p className="text-xs text-base-content/40">Aucun employé sélectionné</p>
                    </div>
                  )}

                  <div className="divider my-3"></div>

                  <div className={`p-3 rounded-lg ${noteInfo.bg} border border-base-300 text-center`}>
                    <p className="text-3xl font-bold ${noteInfo.cls}">
                      <span className={noteInfo.cls}>{Number(formData.note_globale).toFixed(1)}</span>
                      <span className="text-base text-base-content/40 font-normal">/20</span>
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < etoiles ? 'fill-warning text-warning' : 'text-base-content/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${noteInfo.cls} mt-1`}>
                      {noteInfo.label}
                    </p>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Période :</span>
                      <span className="font-medium ml-auto truncate">
                        {formData.periode || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Date :</span>
                      <span className="font-medium ml-auto">
                        {formData.date_evaluation || '—'}
                      </span>
                    </div>

                    {evaluateurSelectionne && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <span className="text-base-content/60">Évaluateur :</span>
                        <span className="font-medium ml-auto truncate">
                          {evaluateurSelectionne.prenom} {evaluateurSelectionne.nom}
                        </span>
                      </div>
                    )}
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
                onClick={() => navigate(estEdition ? `/evaluations/${evaluationId}` : '/evaluations')}
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
                    {estEdition ? 'Enregistrer' : "Créer l'évaluation"}
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

export default EvaluationForm;