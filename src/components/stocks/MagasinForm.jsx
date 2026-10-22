// src/components/stocks/MagasinForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Warehouse, Building2, Truck, MapPin, Eye, RefreshCw
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES = [
  { value: 'principal',  label: 'Dépôt principal',  icon: Warehouse, color: 'primary' },
  { value: 'secondaire', label: 'Dépôt secondaire', icon: Building2, color: 'info' },
  { value: 'vehicule',   label: 'Stock véhicule',   icon: Truck,     color: 'warning' },
  { value: 'chantier',   label: 'Stock chantier',   icon: MapPin,    color: 'success' },
];

const MagasinForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementCode, setChargementCode] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter';
  const magasinId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type: 'principal',
    adresse: '',
    zone: '',
    responsable: '',
    telephone: '',
    actif: true,
    notes: '',
  });

  const [employes, setEmployes] = useState([]);

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    chargerEmployes();
    if (estEdition) {
      chargerMagasin();
    } else {
      // Mode création → pré-remplir le code auto
      chargerProchainCode();
    }
  }, [id]);

  // ============================================================
  // CHARGER LE CODE AUTO
  // ============================================================
  const chargerProchainCode = async () => {
    setChargementCode(true);
    try {
      const res = await AxiosInstance.get('/magasins/prochain_code/');
      if (res.data?.code) {
        setFormData(prev => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error('Erreur chargement code:', err);
    } finally {
      setChargementCode(false);
    }
  };

  // ============================================================
  // CHARGER LES EMPLOYÉS
  // ============================================================
  const chargerEmployes = async () => {
    try {
      const res = await AxiosInstance.get('/employes/');
      setEmployes(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ============================================================
  // CHARGER UN MAGASIN EXISTANT
  // ============================================================
  const chargerMagasin = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/magasins/${magasinId}/`);
      const data = res.data;
      setFormData({
        code: data.code || '',
        nom: data.nom || '',
        type: data.type || 'principal',
        adresse: data.adresse || '',
        zone: data.zone || '',
        responsable: data.responsable || '',
        telephone: data.telephone || '',
        actif: data.actif !== undefined ? data.actif : true,
        notes: data.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le magasin');
    } finally {
      setChargementInitial(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
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
          if (k === 'responsable') dataToSend[k] = null;
          else delete dataToSend[k];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/magasins/${magasinId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/magasins'), 1200);
      } else {
        await AxiosInstance.post('/magasins/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/magasins'), 1200);
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

  // ============================================================
  // RENDU : CHARGEMENT INITIAL
  // ============================================================
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const typeSelectionne = TYPES.find(t => t.value === formData.type);
  const TypeIcon = typeSelectionne?.icon || Warehouse;

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/magasins')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-0.5">
              <Warehouse className="w-3 h-3" />
              Stocks / Magasins /{' '}
              <span className="text-primary">
                {estEdition ? 'Modification' : 'Création'}
              </span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <Edit className="w-5 h-5 text-primary" />
              ) : (
                <Plus className="w-5 h-5 text-primary" />
              )}
              <span className="truncate">
                {estEdition ? 'Modifier le magasin' : 'Nouveau magasin'}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Magasin {estEdition ? 'modifié' : 'créé'} !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          <div className="lg:col-span-2 space-y-6">
            {/* Informations */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations du magasin</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* ✅ CODE AUTO-GÉNÉRÉ + BOUTON AUTO */}
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Code <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="code"
                          className="input input-bordered join-item w-full font-mono"
                          value={formData.code}
                          onChange={handleChange}
                          required
                          placeholder="Auto-généré"
                          maxLength="30"
                        />
                        <button
                          type="button"
                          onClick={chargerProchainCode}
                          disabled={chargementCode}
                          className="btn btn-outline join-item gap-1"
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
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-xs text-base-content/50 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-success" />
                          Code généré automatiquement — modifiable
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Nom <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        className="input input-bordered w-full"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        placeholder="Dépôt principal"
                        maxLength="100"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Type <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {TYPES.map(t => {
                        const Icon = t.icon;
                        const isSelected = formData.type === t.value;
                        return (
                          <button
                            type="button"
                            key={t.value}
                            onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                            className={`btn btn-sm h-auto flex-col py-3 gap-1 ${
                              isSelected ? `btn-${t.color}` : 'btn-outline'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] font-bold leading-tight text-center">
                              {t.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Adresse</span>
                    </label>
                    <textarea
                      name="adresse"
                      className="textarea textarea-bordered w-full"
                      value={formData.adresse}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Adresse complète..."
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Zone</span>
                      </label>
                      <input
                        type="text"
                        name="zone"
                        className="input input-bordered w-full"
                        value={formData.zone}
                        onChange={handleChange}
                        placeholder="Zone A"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Téléphone</span>
                      </label>
                      <input
                        type="text"
                        name="telephone"
                        className="input input-bordered w-full"
                        value={formData.telephone}
                        onChange={handleChange}
                        placeholder="+224 6XX XX XX XX"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Responsable</span>
                    </label>
                    <select
                      name="responsable"
                      className="select select-bordered w-full"
                      value={formData.responsable || ''}
                      onChange={handleChange}
                    >
                      <option value="">— Aucun —</option>
                      {employes.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.matricule ? `[${e.matricule}] ` : ''}
                          {e.nom_complet || `${e.prenom || ''} ${e.nom}`.trim()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 py-0">
                      <input
                        type="checkbox"
                        name="actif"
                        className="checkbox checkbox-success"
                        checked={formData.actif}
                        onChange={handleChange}
                      />
                      <span className="label-text font-medium">Magasin actif</span>
                    </label>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Notes</span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Notes internes..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* APERÇU */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`card shadow-sm border-2 bg-${typeSelectionne?.color}/5 border-${typeSelectionne?.color}/30`}>
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg bg-${typeSelectionne?.color}/20 flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className={`w-6 h-6 text-${typeSelectionne?.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.code || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.nom || 'Nom du magasin'}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <span className={`badge badge-${typeSelectionne?.color} badge-sm`}>
                    {typeSelectionne?.label}
                  </span>
                  <div className="mt-2">
                    <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                      {formData.actif ? 'Actif' : 'Inactif'}
                    </span>
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
              onClick={() => navigate('/magasins')}
              className="btn btn-ghost"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le magasin'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MagasinForm;