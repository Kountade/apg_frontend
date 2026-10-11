// components/clients/PrestationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Briefcase, DollarSign, Hash, Tag, FileText,
  Eye, Info, RefreshCw, Lock
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const PrestationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementCode, setChargementCode] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const prestationId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    description: '',
    tarif_base: '',
    unite: 'forfait',
    actif: true,
  });

  const [codeModifieManuellement, setCodeModifieManuellement] = useState(false);

  useEffect(() => {
    if (estEdition && prestationId) {
      chargerPrestation(prestationId);
    } else {
      chargerProchainCode();
    }
  }, [id]);

  // ============================================================
  // Charger le prochain code proposé par le backend
  // ============================================================
  const chargerProchainCode = async () => {
    setChargementCode(true);
    try {
      const res = await AxiosInstance.get('/prestations/prochain_code/');
      if (res.data?.code) {
        setFormData(prev => ({ ...prev, code: res.data.code }));
        setCodeModifieManuellement(false);
      }
    } catch (err) {
      console.warn('Endpoint prochain_code indisponible, génération locale');
      const year = new Date().getFullYear();
      setFormData(prev => ({ ...prev, code: `PRE-${year}-000001` }));
    } finally {
      setChargementCode(false);
    }
  };

  const chargerPrestation = async (pid) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/prestations/${pid}/`);
      const data = response.data;
      setFormData({
        code: data.code || '',
        nom: data.nom || '',
        description: data.description || '',
        tarif_base: data.tarif_base || '',
        unite: data.unite || 'forfait',
        actif: data.actif !== undefined ? data.actif : true,
      });
      setCodeModifieManuellement(true);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger la prestation');
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

    if (name === 'code') {
      setCodeModifieManuellement(true);
    }
  };

  const regenererCode = async () => {
    setCodeModifieManuellement(false);
    await chargerProchainCode();
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
          if (key === 'tarif_base') {
            dataToSend[key] = 0;
          } else if (key !== 'actif' && key !== 'code') {
            delete dataToSend[key];
          }
        }
      });

      if (!dataToSend.code) {
        delete dataToSend.code;
      }

      if (estEdition) {
        await AxiosInstance.patch(`/prestations/${prestationId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/prestations'), 1200);
      } else {
        await AxiosInstance.post('/prestations/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/prestations'), 1200);
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
            onClick={() => navigate('/prestations')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-0.5">
              <Briefcase className="w-3 h-3" />
              Clients & Contrats
              <span className="text-base-content/30">/</span>
              <span>Prestations</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier — {formData.nom}</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouvelle prestation
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
            {estEdition ? 'Prestation modifiée avec succès !' : 'Prestation créée avec succès !'}
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

            {/* Identification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>

                <div className="p-5 space-y-5">

                  {/* ✅ CODE avec génération auto + modifiable */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-base-content/40" />
                        Code prestation
                        <span className="text-error">*</span>
                      </span>
                    </label>

                    <div className="join w-full">
                      <input
                        type="text"
                        name="code"
                        className="input input-bordered join-item w-full font-mono focus:input-primary"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        placeholder="PRE-2026-000001"
                        maxLength="30"
                      />
                      <button
                        type="button"
                        onClick={regenererCode}
                        className="btn btn-outline join-item gap-2"
                        disabled={chargementCode}
                        title="Régénérer un code automatique"
                      >
                        {chargementCode ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Auto
                      </button>
                    </div>

                    {chargementCode ? (
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-info flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Génération du code en cours...
                        </span>
                      </label>
                    ) : estEdition ? (
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-info flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Code existant — modifiable
                        </span>
                      </label>
                    ) : codeModifieManuellement ? (
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-warning flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          Code modifié manuellement — cliquez sur <strong>Auto</strong> pour régénérer
                        </span>
                      </label>
                    ) : (
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Code généré automatiquement — modifiable si nécessaire
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-base-content/40" />
                          Unité
                        </span>
                      </label>
                      <select
                        name="unite"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.unite}
                        onChange={handleChange}
                      >
                        <option value="forfait">Forfait</option>
                        <option value="m³">Mètre cube (m³)</option>
                        <option value="kg">Kilogramme (kg)</option>
                        <option value="tonne">Tonne</option>
                        <option value="heure">Heure</option>
                        <option value="jour">Jour</option>
                        <option value="mois">Mois</option>
                        <option value="prestation">Prestation</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Statut</span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-3 py-0 h-12 border border-base-300 rounded-lg px-3 bg-base-100">
                        <input
                          type="checkbox"
                          name="actif"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={formData.actif}
                          onChange={handleChange}
                        />
                        <span className="label-text text-sm">
                          {formData.actif ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Nom de la prestation
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      className="input input-bordered w-full focus:input-primary"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      placeholder="Collecte des déchets ménagers"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-base-content/40" />
                        Description
                      </span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full focus:textarea-primary"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Description détaillée de la prestation..."
                    ></textarea>
                  </div>

                </div>
              </div>
            </div>

            {/* Tarification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Tarification</h2>
                </div>

                <div className="p-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Tarif de base
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                        GNF
                      </span>
                      <input
                        type="number"
                        name="tarif_base"
                        className="input input-bordered w-full pl-14 focus:input-primary"
                        value={formData.tarif_base}
                        onChange={handleChange}
                        min="0"
                        step="100"
                        placeholder="0"
                      />
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-base-content/50">
                        Montant en francs guinéens
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
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.code || 'PRE-2026-...'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.nom || 'Nom de la prestation'}
                      </p>
                      <p className="text-xs text-base-content/50 mt-0.5">
                        {formData.unite || 'forfait'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      <span className="text-base-content/60">Tarif :</span>
                      <span className="font-medium ml-auto font-mono">
                        {formData.tarif_base
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.tarif_base)) + ' GNF'
                          : '—'}
                      </span>
                    </div>

                    {formData.description && (
                      <div className="pt-2 border-t border-base-200">
                        <p className="text-base-content/60 line-clamp-3">
                          {formData.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-between">
                    <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                      {formData.actif ? 'Active' : 'Inactive'}
                    </span>
                    <span className="badge badge-outline badge-sm">{formData.unite}</span>
                  </div>
                </div>

                <p className="text-xs text-base-content/40 mt-3 text-center">
                  L'aperçu se met à jour en temps réel
                </p>
              </div>
            </div>

            {/* Aide */}
            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Le code est généré automatiquement au format
                      <span className="font-mono font-bold text-info"> PRE-2026-000001</span>.
                      Vous pouvez le modifier manuellement si vous préférez un code personnalisé.
                      Cliquez sur <strong>Auto</strong> pour régénérer un code standard.
                    </p>
                  </div>
                </div>
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
                onClick={() => navigate('/prestations')}
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
                    {estEdition ? 'Enregistrer' : 'Créer la prestation'}
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

export default PrestationForm;