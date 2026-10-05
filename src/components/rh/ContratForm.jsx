// pages/contrats/ContratForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, FileCheck, Save, Edit, Loader2, AlertCircle,
  CheckCircle, Plus, Info, Building2, DollarSign, Eye,
  User, Calendar, FileText, Hash, Briefcase, RefreshCw
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ContratForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const contratId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    employe: '',
    type: 'CDI',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    salaire: '',
    statut: 'actif',
    renouvellement: false,
    document: null,
  });

  const [employes, setEmployes] = useState([]);
  const [fichierDocument, setFichierDocument] = useState(null);

  useEffect(() => {
    chargerEmployes();
    if (estEdition && contratId) {
      chargerContrat(contratId);
    } else {
      // Pré-remplir l'employé si passé en query
      const empParam = searchParams.get('employe');
      if (empParam) {
        setFormData(prev => ({ ...prev, employe: empParam }));
      }
      // Générer un numéro automatiquement
      genererNumero();
    }
  }, [id]);

  const genererNumero = () => {
    const annee = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    setFormData(prev => ({
      ...prev,
      numero: `CTR-${annee}-${timestamp}`,
    }));
  };

  const chargerEmployes = async () => {
    try {
      const response = await AxiosInstance.get('/employes/');
      const data = response.data.results || response.data || [];
      setEmployes(data.filter(e => e.statut === 'actif'));
    } catch (err) {
      console.error('Erreur chargement employés:', err);
    }
  };

  const chargerContrat = async (cId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/contrats/${cId}/`);
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        employe: data.employe || '',
        type: data.type || 'CDI',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        salaire: data.salaire || '',
        statut: data.statut || 'actif',
        renouvellement: data.renouvellement || false,
        document: null,
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données du contrat');
      if (err.response?.status === 404) {
        setErreur('Contrat non trouvé');
      }
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

  const handleFileChange = (e) => {
    setFichierDocument(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      // Validation dates
      if (formData.date_fin && formData.date_debut && formData.date_fin < formData.date_debut) {
        setErreur('La date de fin doit être postérieure à la date de début.');
        setChargement(false);
        return;
      }

      // Préparer les données
      const dataToSend = { ...formData };

      // Nettoyage
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (key === 'employe') {
            // employé obligatoire, ne pas supprimer
          } else if (key === 'salaire') {
            dataToSend[key] = 0;
          } else if (key === 'document') {
            delete dataToSend[key];
          } else {
            delete dataToSend[key];
          }
        }
      });

      // Créer FormData si fichier
      let payload = dataToSend;
      if (fichierDocument) {
        payload = new FormData();
        Object.entries(dataToSend).forEach(([key, value]) => {
          if (value !== null && value !== undefined && key !== 'document') {
            payload.append(key, value);
          }
        });
        payload.append('document', fichierDocument);
      }

      const config = fichierDocument
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      if (estEdition && contratId) {
        await AxiosInstance.patch(`/contrats/${contratId}/`, payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/contrats/${contratId}`), 1200);
      } else {
        await AxiosInstance.post('/contrats/', payload, config);
        setSucces(true);
        setTimeout(() => navigate('/contrats'), 1200);
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

  const formatMontant = (val) => {
    if (!val) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(val)) + ' GNF';
  };

  const calculerDuree = () => {
    if (!formData.date_debut || !formData.date_fin) return null;
    const debut = new Date(formData.date_debut);
    const fin = new Date(formData.date_fin);
    const mois = Math.round((fin - debut) / (1000 * 60 * 60 * 24 * 30));
    if (mois < 12) return `${mois} mois`;
    const annees = Math.floor(mois / 12);
    const resteMois = mois % 12;
    return resteMois > 0 ? `${annees} an${annees > 1 ? 's' : ''} ${resteMois} mois` : `${annees} an${annees > 1 ? 's' : ''}`;
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
            onClick={() => navigate(estEdition ? `/contrats/${contratId}` : '/contrats')}
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
              <span>Contrats</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier — {formData.numero}</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouveau contrat
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
            {estEdition ? 'Contrat modifié avec succès !' : 'Contrat créé avec succès !'}
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

            {/* Section 1 — Identification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification du contrat</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Numéro du contrat
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                        <input
                          type="text"
                          name="numero"
                          className="input input-bordered w-full pl-10 font-mono focus:input-primary"
                          value={formData.numero}
                          onChange={handleChange}
                          required
                          placeholder="CTR-2026-000001"
                        />
                      </div>
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-xs text-base-content/50 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Modifiable si besoin
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Type de contrat
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="CDI">CDI — Contrat à Durée Indéterminée</option>
                        <option value="CDD">CDD — Contrat à Durée Déterminée</option>
                        <option value="STAGE">Stage</option>
                        <option value="TEMPORAIRE">Temporaire</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-base-content/40" />
                        Employé concerné
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="employe"
                      className="select select-bordered w-full focus:select-primary"
                      value={formData.employe}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Sélectionner un employé —</option>
                      {employes.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.matricule ? `[${emp.matricule}] ` : ''}
                          {emp.prenom} {emp.nom}
                          {emp.poste_nom ? ` — ${emp.poste_nom}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 2 — Période */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Période du contrat</h2>
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
                          {formData.type === 'CDI' ? (
                            <span className="text-xs text-base-content/40">(optionnel)</span>
                          ) : (
                            <span className="text-error">*</span>
                          )}
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_fin"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.date_fin}
                        onChange={handleChange}
                        required={formData.type !== 'CDI'}
                        min={formData.date_debut}
                      />
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-xs text-base-content/50">
                          {formData.type === 'CDI'
                            ? 'Laisser vide pour un CDI'
                            : 'Date de fin obligatoire pour ce type de contrat'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {calculerDuree() && (
                    <div className="p-3 rounded-lg bg-info/5 border border-info/20 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-info flex-shrink-0" />
                      <div className="text-xs">
                        <span className="text-base-content/60">Durée :</span>
                        <span className="font-semibold ml-1">{calculerDuree()}</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Section 3 — Salaire & Statut */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Rémunération & Statut</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Salaire contractuel
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="salaire"
                          className="input input-bordered w-full pl-14 focus:input-primary"
                          value={formData.salaire}
                          onChange={handleChange}
                          min="0"
                          step="1000"
                          required
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Statut du contrat
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
                        <option value="actif">Actif</option>
                        <option value="expire">Expiré</option>
                        <option value="rompu">Rompu</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-base-300 hover:bg-base-200/50 transition-colors">
                      <input
                        type="checkbox"
                        name="renouvellement"
                        className="toggle toggle-primary"
                        checked={formData.renouvellement}
                        onChange={handleChange}
                      />
                      <div>
                        <span className="text-sm font-medium">Renouvelable</span>
                        <p className="text-xs text-base-content/50">
                          Cocher si le contrat peut être renouvelé
                        </p>
                      </div>
                    </label>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 4 — Document */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm">Document scanné</h2>
                </div>

                <div className="p-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Fichier du contrat (PDF, image)
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
                        {formData.document
                          ? 'Remplacer le document existant'
                          : 'Joindre le contrat signé scanné (optionnel)'}
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
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm font-mono truncate">
                        {formData.numero || 'Numéro du contrat'}
                      </p>
                      <span className="badge badge-outline badge-sm mt-0.5">
                        {formData.type}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Employé :</span>
                      <span className="font-medium truncate ml-auto">
                        {employeSelectionne
                          ? `${employeSelectionne.prenom} ${employeSelectionne.nom}`
                          : '—'}
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
                        {formData.date_fin || (formData.type === 'CDI' ? 'Indéterminée' : '—')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Salaire :</span>
                      <span className="font-medium ml-auto">
                        {formatMontant(formData.salaire)}
                      </span>
                    </div>

                    {calculerDuree() && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <span className="text-base-content/60">Durée :</span>
                        <span className="font-medium ml-auto">
                          {calculerDuree()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-between">
                    <span className={`badge badge-sm ${
                      formData.statut === 'actif' ? 'badge-success' :
                      formData.statut === 'expire' ? 'badge-error' : 'badge-ghost'
                    }`}>
                      {formData.statut === 'actif' ? 'Actif' :
                       formData.statut === 'expire' ? 'Expiré' : 'Rompu'}
                    </span>
                    {formData.renouvellement && (
                      <span className="badge badge-outline badge-sm gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Renouvelable
                      </span>
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
                onClick={() => navigate(estEdition ? `/contrats/${contratId}` : '/contrats')}
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
                    {estEdition ? 'Enregistrer' : 'Créer le contrat'}
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

export default ContratForm;