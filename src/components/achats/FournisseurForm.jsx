// src/components/achats/FournisseurForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus,
  Building2, Phone, Mail, MapPin, Star, RefreshCw, Eye, User,
  DollarSign, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES = [
  { value: 'materiel', label: 'Matériel / Équipement' },
  { value: 'piece', label: 'Pièces détachées' },
  { value: 'epi', label: 'EPI / Consommables' },
  { value: 'carburant', label: 'Carburant' },
  { value: 'service', label: 'Prestation de service' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'autre', label: 'Autre' },
];

const STATUTS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'archive', label: 'Archivé' },
];

const FournisseurForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const estEdition = id && id !== 'ajouter';
  const fournisseurId = estEdition ? id : null;

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementCode, setChargementCode] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    sigle: '',
    type: 'materiel',
    statut: 'actif',
    num_contribuable: '',
    num_rccm: '',
    telephone: '',
    telephone2: '',
    email: '',
    adresse: '',
    ville: '',
    pays: 'Guinée',
    contact_nom: '',
    contact_fonction: '',
    contact_telephone: '',
    contact_email: '',
    delai_livraison_jours: 7,
    conditions_paiement: '',
    remise_habituelle: 0,
    banque: '',
    numero_compte: '',
    iban: '',
    notes: '',
  });

  useEffect(() => {
    if (estEdition) chargerFournisseur();
    else chargerProchainCode();
  }, [id]);

  const chargerProchainCode = async () => {
    setChargementCode(true);
    try {
      const res = await AxiosInstance.get('/fournisseurs/prochain_code/');
      if (res.data?.code) {
        setFormData(prev => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error('Erreur chargement code:', err);
    } finally {
      setChargementCode(false);
    }
  };

  const chargerFournisseur = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/fournisseurs/${fournisseurId}/`);
      const d = res.data;
      setFormData({
        code: d.code || '',
        nom: d.nom || '',
        sigle: d.sigle || '',
        type: d.type || 'materiel',
        statut: d.statut || 'actif',
        num_contribuable: d.num_contribuable || '',
        num_rccm: d.num_rccm || '',
        telephone: d.telephone || '',
        telephone2: d.telephone2 || '',
        email: d.email || '',
        adresse: d.adresse || '',
        ville: d.ville || '',
        pays: d.pays || 'Guinée',
        contact_nom: d.contact_nom || '',
        contact_fonction: d.contact_fonction || '',
        contact_telephone: d.contact_telephone || '',
        contact_email: d.contact_email || '',
        delai_livraison_jours: d.delai_livraison_jours || 7,
        conditions_paiement: d.conditions_paiement || '',
        remise_habituelle: d.remise_habituelle || 0,
        banque: d.banque || '',
        numero_compte: d.numero_compte || '',
        iban: d.iban || '',
        notes: d.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le fournisseur');
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
      Object.keys(dataToSend).forEach(k => {
        if (dataToSend[k] === '' || dataToSend[k] === null) {
          if (['delai_livraison_jours', 'remise_habituelle'].includes(k)) {
            dataToSend[k] = k === 'delai_livraison_jours' ? 7 : 0;
          } else if (k !== 'code' && k !== 'nom' && k !== 'telephone' && k !== 'pays') {
            delete dataToSend[k];
          }
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/fournisseurs/${fournisseurId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/fournisseurs/${fournisseurId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/fournisseurs/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/fournisseurs/${res.data.id}`), 1200);
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
            onClick={() => navigate('/fournisseurs')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Achats / Fournisseurs /{' '}
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? <Building2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              <span className="truncate">
                {estEdition ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Fournisseur {estEdition ? 'modifié' : 'créé'} !</span>
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
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                          maxLength="30"
                        />
                        {!estEdition && (
                          <button
                            type="button"
                            onClick={chargerProchainCode}
                            disabled={chargementCode}
                            className="btn btn-outline join-item"
                          >
                            {chargementCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Sigle</span>
                      </label>
                      <input
                        type="text"
                        name="sigle"
                        className="input input-bordered w-full"
                        value={formData.sigle}
                        onChange={handleChange}
                        maxLength="50"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Nom / Raison sociale <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      className="input input-bordered w-full"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      maxLength="200"
                      placeholder="Ex : Guinée EPI SARL"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Type</span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={formData.type}
                        onChange={handleChange}
                      >
                        {TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Statut</span>
                      </label>
                      <select
                        name="statut"
                        className="select select-bordered w-full"
                        value={formData.statut}
                        onChange={handleChange}
                      >
                        {STATUTS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° Contribuable</span>
                      </label>
                      <input
                        type="text"
                        name="num_contribuable"
                        className="input input-bordered w-full font-mono"
                        value={formData.num_contribuable}
                        onChange={handleChange}
                        maxLength="50"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° RCCM</span>
                      </label>
                      <input
                        type="text"
                        name="num_rccm"
                        className="input input-bordered w-full font-mono"
                        value={formData.num_rccm}
                        onChange={handleChange}
                        maxLength="50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Coordonnées</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Téléphone <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="telephone"
                        className="input input-bordered w-full"
                        value={formData.telephone}
                        onChange={handleChange}
                        required
                        maxLength="30"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Téléphone 2</span>
                      </label>
                      <input
                        type="text"
                        name="telephone2"
                        className="input input-bordered w-full"
                        value={formData.telephone2}
                        onChange={handleChange}
                        maxLength="30"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Email</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="input input-bordered w-full"
                      value={formData.email}
                      onChange={handleChange}
                    />
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
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Ville</span>
                      </label>
                      <input
                        type="text"
                        name="ville"
                        className="input input-bordered w-full"
                        value={formData.ville}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Pays</span>
                      </label>
                      <input
                        type="text"
                        name="pays"
                        className="input input-bordered w-full"
                        value={formData.pays}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact commercial */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Contact commercial</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Nom du contact</span>
                      </label>
                      <input
                        type="text"
                        name="contact_nom"
                        className="input input-bordered w-full"
                        value={formData.contact_nom}
                        onChange={handleChange}
                        maxLength="150"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Fonction</span>
                      </label>
                      <input
                        type="text"
                        name="contact_fonction"
                        className="input input-bordered w-full"
                        value={formData.contact_fonction}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Téléphone contact</span>
                      </label>
                      <input
                        type="text"
                        name="contact_telephone"
                        className="input input-bordered w-full"
                        value={formData.contact_telephone}
                        onChange={handleChange}
                        maxLength="30"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Email contact</span>
                      </label>
                      <input
                        type="email"
                        name="contact_email"
                        className="input input-bordered w-full"
                        value={formData.contact_email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions & bancaire */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Conditions & Coordonnées bancaires</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Délai livraison (jours)</span>
                      </label>
                      <input
                        type="number"
                        name="delai_livraison_jours"
                        className="input input-bordered w-full"
                        value={formData.delai_livraison_jours}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                    <div className="form-control w-full md:col-span-2">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Conditions de paiement</span>
                      </label>
                      <input
                        type="text"
                        name="conditions_paiement"
                        className="input input-bordered w-full"
                        value={formData.conditions_paiement}
                        onChange={handleChange}
                        placeholder="Ex : Comptant, 30 jours, 60 jours"
                        maxLength="100"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Remise habituelle (%)</span>
                    </label>
                    <input
                      type="number"
                      name="remise_habituelle"
                      className="input input-bordered w-full"
                      value={formData.remise_habituelle}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Banque</span>
                      </label>
                      <input
                        type="text"
                        name="banque"
                        className="input input-bordered w-full"
                        value={formData.banque}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° de compte</span>
                      </label>
                      <input
                        type="text"
                        name="numero_compte"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_compte}
                        onChange={handleChange}
                        maxLength="50"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">IBAN</span>
                      </label>
                      <input
                        type="text"
                        name="iban"
                        className="input input-bordered w-full font-mono"
                        value={formData.iban}
                        onChange={handleChange}
                        maxLength="50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Notes internes</h2>
                </div>
                <div className="p-5">
                  <textarea
                    name="notes"
                    className="textarea textarea-bordered w-full"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Notes internes..."
                  ></textarea>
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
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.code || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.nom || 'Nom fournisseur'}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">
                        {TYPES.find(t => t.value === formData.type)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Ville :</span>
                      <span className="font-medium">{formData.ville || '—'}</span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <span className={`badge badge-sm ${
                    formData.statut === 'actif' ? 'badge-success' : 'badge-ghost'
                  }`}>
                    {STATUTS.find(s => s.value === formData.statut)?.label}
                  </span>
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
              onClick={() => navigate('/fournisseurs')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le fournisseur'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FournisseurForm;