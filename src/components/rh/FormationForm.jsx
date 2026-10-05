// pages/formations/FormationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Save, Edit, Loader2, AlertCircle,
  CheckCircle, Plus, Info, Building2, Eye, User, Calendar,
  MapPin, DollarSign, GraduationCap, Users, CheckSquare,
  Search, X, UserCheck, Clock, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MAX_DESCRIPTION = 1000;

const FormationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const formationId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    formateur: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date().toISOString().split('T')[0],
    lieu: '',
    cout: 0,
    participants: [], // IDs
  });

  const [employes, setEmployes] = useState([]);
  const [rechercheParticipant, setRechercheParticipant] = useState('');
  const [showSelecteurParticipants, setShowSelecteurParticipants] = useState(false);

  useEffect(() => {
    chargerEmployes();
    if (estEdition && formationId) {
      chargerFormation(formationId);
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

  const chargerFormation = async (fId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/formations/${fId}/`);
      const data = response.data;

      // Récupérer les participants (peut être array d'IDs ou d'objets)
      let participantIds = [];
      if (Array.isArray(data.participants)) {
        participantIds = data.participants.map(p =>
          typeof p === 'object' ? p.id : p
        );
      }

      setFormData({
        titre: data.titre || '',
        description: data.description || '',
        formateur: data.formateur || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        lieu: data.lieu || '',
        cout: data.cout || 0,
        participants: participantIds,
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de la formation');
      if (err.response?.status === 404) {
        setErreur('Formation non trouvée');
      }
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleParticipant = (employeId) => {
    setFormData(prev => {
      const deja = prev.participants.includes(employeId);
      return {
        ...prev,
        participants: deja
          ? prev.participants.filter(id => id !== employeId)
          : [...prev.participants, employeId],
      };
    });
  };

  const retirerParticipant = (employeId) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(id => id !== employeId),
    }));
  };

  const selectionnerTous = () => {
    setFormData(prev => ({
      ...prev,
      participants: employesFiltres.map(e => e.id),
    }));
  };

  const deselectionnerTous = () => {
    setFormData(prev => ({ ...prev, participants: [] }));
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

      const dataToSend = {
        ...formData,
        cout: Number(formData.cout) || 0,
      };

      if (estEdition && formationId) {
        await AxiosInstance.patch(`/formations/${formationId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/formations/${formationId}`), 1200);
      } else {
        await AxiosInstance.post('/formations/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/formations'), 1200);
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

  // Participants filtrés
  const employesFiltres = employes.filter(emp => {
    if (!rechercheParticipant) return true;
    const terme = rechercheParticipant.toLowerCase();
    return (
      emp.nom?.toLowerCase().includes(terme) ||
      emp.prenom?.toLowerCase().includes(terme) ||
      emp.matricule?.toLowerCase().includes(terme)
    );
  });

  const participantsSelectionnes = employes.filter(e =>
    formData.participants.includes(e.id)
  );

  // Durée
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
            onClick={() => navigate(estEdition ? `/formations/${formationId}` : '/formations')}
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
              <span>Formations</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier — {formData.titre}</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouvelle formation
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
            {estEdition ? 'Formation modifiée avec succès !' : 'Formation créée avec succès !'}
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

            {/* Section 1 — Informations générales */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations générales</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-primary" />
                        Titre de la formation
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="titre"
                      className="input input-bordered w-full focus:input-primary"
                      value={formData.titre}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Formation Sécurité au travail, Excel avancé..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-base-content/40" />
                          Formateur
                        </span>
                      </label>
                      <input
                        type="text"
                        name="formateur"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.formateur}
                        onChange={handleChange}
                        placeholder="Nom du formateur ou organisme"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-base-content/40" />
                          Lieu
                        </span>
                      </label>
                      <input
                        type="text"
                        name="lieu"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.lieu}
                        onChange={handleChange}
                        placeholder="Salle, adresse..."
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <div className="flex items-center justify-between pb-1.5">
                      <label className="label py-0">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-base-content/40" />
                          Description
                        </span>
                      </label>
                      <span className="text-xs text-base-content/40">
                        {formData.description.length} / {MAX_DESCRIPTION}
                      </span>
                    </div>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full focus:textarea-primary min-h-[100px]"
                      rows="4"
                      maxLength={MAX_DESCRIPTION}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Objectifs, contenu, prérequis de la formation..."
                    ></textarea>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 2 — Période & Coût */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Période & Coût</h2>
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
                        <span className="text-base-content/60">Durée :</span>
                        <span className="font-semibold ml-1">
                          {calculerDuree()} jour{calculerDuree() > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-warning" />
                        Coût total de la formation
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                        GNF
                      </span>
                      <input
                        type="number"
                        name="cout"
                        className="input input-bordered w-full pl-14 focus:input-primary"
                        value={formData.cout}
                        onChange={handleChange}
                        min="0"
                        step="1000"
                        placeholder="0"
                      />
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Inclut les frais de formation, déplacement, matériel, etc.
                      </span>
                    </label>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 3 — Participants */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Users className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Participants</h2>
                  <span className="badge badge-primary badge-sm ml-auto">
                    {formData.participants.length} sélectionné{formData.participants.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-5 space-y-4">

                  {/* Barre de recherche + bouton */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                      <input
                        type="text"
                        placeholder="Rechercher un employé..."
                        className="input input-bordered input-sm w-full pl-9 focus:input-primary"
                        value={rechercheParticipant}
                        onChange={(e) => setRechercheParticipant(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSelecteurParticipants(!showSelecteurParticipants)}
                      className="btn btn-sm btn-outline gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {showSelecteurParticipants ? 'Fermer' : 'Ajouter'}
                    </button>
                  </div>

                  {/* Liste des participants sélectionnés */}
                  {participantsSelectionnes.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                      {participantsSelectionnes.map((emp) => (
                        <div
                          key={emp.id}
                          className="badge badge-primary badge-lg gap-1 pr-1"
                        >
                          <span className="text-xs">
                            {emp.prenom} {emp.nom}
                          </span>
                          <button
                            type="button"
                            onClick={() => retirerParticipant(emp.id)}
                            className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-4 w-4"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sélecteur de participants */}
                  {showSelecteurParticipants && (
                    <div className="border border-base-300 rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-base-200/50 flex items-center justify-between">
                        <span className="text-xs font-semibold">
                          {employesFiltres.length} employé{employesFiltres.length > 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={selectionnerTous}
                            className="btn btn-ghost btn-xs gap-1"
                          >
                            <CheckSquare className="w-3 h-3" />
                            Tous
                          </button>
                          <button
                            type="button"
                            onClick={deselectionnerTous}
                            className="btn btn-ghost btn-xs"
                          >
                            Aucun
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto p-2">
                        {employesFiltres.length === 0 ? (
                          <p className="text-center py-4 text-xs text-base-content/50">
                            Aucun employé trouvé
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {employesFiltres.map((emp) => {
                              const selectionne = formData.participants.includes(emp.id);
                              return (
                                <label
                                  key={emp.id}
                                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                    selectionne
                                      ? 'bg-primary/10 border border-primary/30'
                                      : 'hover:bg-base-200/50 border border-transparent'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={selectionne}
                                    onChange={() => toggleParticipant(emp.id)}
                                  />
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-primary">
                                      {emp.prenom?.charAt(0)?.toUpperCase()}
                                      {emp.nom?.charAt(0)?.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {emp.prenom} {emp.nom}
                                    </p>
                                    <p className="text-[10px] text-base-content/50 font-mono">
                                      {emp.matricule}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.participants.length === 0 && !showSelecteurParticipants && (
                    <div className="text-center py-6 bg-base-200/30 rounded-lg border border-dashed border-base-300">
                      <Users className="w-10 h-10 text-base-content/20 mx-auto mb-2" />
                      <p className="text-sm text-base-content/50">
                        Aucun participant sélectionné
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSelecteurParticipants(true)}
                        className="btn btn-primary btn-sm gap-2 mt-3"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Ajouter des participants
                      </button>
                    </div>
                  )}

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
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {formData.titre || 'Titre de la formation'}
                      </p>
                      <p className="text-xs text-base-content/50 truncate">
                        {formData.formateur || 'Formateur non défini'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
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

                    {formData.lieu && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <span className="text-base-content/60">Lieu :</span>
                        <span className="font-medium ml-auto truncate">
                          {formData.lieu}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Participants :</span>
                      <span className="font-medium ml-auto">
                        {formData.participants.length}
                      </span>
                    </div>

                    {Number(formData.cout) > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                        <span className="text-base-content/60">Coût :</span>
                        <span className="font-medium ml-auto text-warning">
                          {new Intl.NumberFormat('fr-FR').format(Number(formData.cout))} GNF
                        </span>
                      </div>
                    )}
                  </div>

                  {Number(formData.cout) > 0 && formData.participants.length > 0 && (
                    <>
                      <div className="divider my-3"></div>
                      <div className="p-2 rounded-lg bg-info/5 border border-info/20 text-center">
                        <p className="text-[10px] text-base-content/50">Coût par participant</p>
                        <p className="text-sm font-bold text-info">
                          {new Intl.NumberFormat('fr-FR').format(
                            Math.round(Number(formData.cout) / formData.participants.length)
                          )} GNF
                        </p>
                      </div>
                    </>
                  )}
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
                onClick={() => navigate(estEdition ? `/formations/${formationId}` : '/formations')}
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
                    {estEdition ? 'Enregistrer' : 'Créer la formation'}
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

export default FormationForm;