// components/clients/ClientForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, User, Save, Edit, Loader2, AlertCircle,
  CheckCircle, Plus, Building2, Mail, Phone, MapPin,
  CreditCard, Users, Eye, Globe, Handshake, Landmark,
  Briefcase, UserCog, Hash
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const clientId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    // ✅ Pas de "code" : généré automatiquement par le backend
    type: 'particulier',
    statut: 'actif',
    nom: '',
    prenom: '',
    sigle: '',
    sexe: 'M',
    telephone: '',
    telephone2: '',
    email: '',
    adresse: '',
    ville: '',
    quartier: '',
    zone: '',
    num_contribuable: '',
    num_rccm: '',
    contact_nom: '',
    contact_fonction: '',
    contact_telephone: '',
    notes: '',
  });

  // Code affiché en édition (lecture seule)
  const [codeAffiche, setCodeAffiche] = useState('');

  useEffect(() => {
    if (estEdition && clientId) chargerClient(clientId);
  }, [id]);

  const chargerClient = async (cid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/clients/${cid}/`);
      const data = response.data;

      // Code en lecture seule
      setCodeAffiche(data.code || '');

      setFormData({
        type: data.type || 'particulier',
        statut: data.statut || 'actif',
        nom: data.nom || '',
        prenom: data.prenom || '',
        sigle: data.sigle || '',
        sexe: data.sexe || 'M',
        telephone: data.telephone || '',
        telephone2: data.telephone2 || '',
        email: data.email || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        quartier: data.quartier || '',
        zone: data.zone || '',
        num_contribuable: data.num_contribuable || '',
        num_rccm: data.num_rccm || '',
        contact_nom: data.contact_nom || '',
        contact_fonction: data.contact_fonction || '',
        contact_telephone: data.contact_telephone || '',
        notes: data.notes || '',
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger le client');
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
        if (dataToSend[key] === '') delete dataToSend[key];
      });

      if (estEdition) {
        await AxiosInstance.patch(`/clients/${clientId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/clients/${clientId}`), 1200);
      } else {
        await AxiosInstance.post('/clients/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/clients'), 1200);
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

  const estProfessionnel = ['entreprise', 'administration', 'ong', 'collectivite', 'commerce', 'hotel', 'ecole'].includes(formData.type);

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* ============================================ */}
      {/* EN-TÊTE */}
      {/* ============================================ */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate(estEdition ? `/clients/${clientId}` : '/clients')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-0.5">
              <Building2 className="w-3 h-3" />
              Clients & Contrats
              <span className="text-base-content/30">/</span>
              <span>Clients</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier — {formData.prenom} {formData.nom}</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouveau client
                </>
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MESSAGES */}
      {/* ============================================ */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 shadow-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            {estEdition ? 'Client modifié avec succès !' : 'Client créé avec succès !'}
          </span>
        </div>
      )}

      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 shadow-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{erreur}</span>
        </div>
      )}

      {/* ============================================ */}
      {/* FORMULAIRE */}
      {/* ============================================ */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          <div className="lg:col-span-2 space-y-6">

            {/* ✅ BANDEAU CODE CLIENT */}
            <div className={`card shadow-sm border ${estEdition ? 'bg-info/5 border-info/30' : 'bg-success/5 border-success/30'}`}>
              <div className="card-body p-4 flex-row items-center gap-3">
                {estEdition ? (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-5 h-5 text-info" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-base-content/60 uppercase tracking-wider">Code client</p>
                      <p className="font-mono font-bold text-lg text-info">{codeAffiche}</p>
                    </div>
                    <span className="badge badge-info badge-sm gap-1">
                      🔒 Auto-généré
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-success">Code client automatique</p>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Format : <span className="font-mono font-bold">CLI-{new Date().getFullYear()}-000001</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 1 — Type & Identification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Type de client
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
                        <option value="particulier">Particulier</option>
                        <option value="entreprise">Entreprise</option>
                        <option value="administration">Administration</option>
                        <option value="ong">ONG</option>
                        <option value="collectivite">Collectivité</option>
                        <option value="commerce">Commerce</option>
                        <option value="hotel">Hôtel</option>
                        <option value="ecole">Établissement scolaire</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Statut</span>
                      </label>
                      <select
                        name="statut"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.statut}
                        onChange={handleChange}
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="suspendu">Suspendu</option>
                        <option value="archive">Archivé</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 — Identité */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identité</h2>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          {estProfessionnel ? 'Raison sociale' : 'Nom'}
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
                        placeholder={estProfessionnel ? "APG SARL" : "Diallo"}
                      />
                    </div>

                    {!estProfessionnel && (
                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">Prénom</span>
                        </label>
                        <input
                          type="text"
                          name="prenom"
                          className="input input-bordered w-full focus:input-primary"
                          value={formData.prenom}
                          onChange={handleChange}
                          placeholder="Mamadou"
                        />
                      </div>
                    )}

                    {estProfessionnel && (
                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">Sigle</span>
                        </label>
                        <input
                          type="text"
                          name="sigle"
                          className="input input-bordered w-full focus:input-primary"
                          value={formData.sigle}
                          onChange={handleChange}
                          placeholder="APG"
                        />
                      </div>
                    )}
                  </div>

                  {estProfessionnel ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">N° Contribuable</span>
                        </label>
                        <input
                          type="text"
                          name="num_contribuable"
                          className="input input-bordered w-full font-mono focus:input-primary"
                          value={formData.num_contribuable}
                          onChange={handleChange}
                          placeholder="1234567890"
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">N° RCCM</span>
                        </label>
                        <input
                          type="text"
                          name="num_rccm"
                          className="input input-bordered w-full font-mono focus:input-primary"
                          value={formData.num_rccm}
                          onChange={handleChange}
                          placeholder="GN-CON-2020-A-00001"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">Sexe</span>
                        </label>
                        <select
                          name="sexe"
                          className="select select-bordered w-full focus:select-primary"
                          value={formData.sexe}
                          onChange={handleChange}
                        >
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3 — Coordonnées */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Coordonnées</h2>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-base-content/40" />
                          Téléphone
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="tel"
                        name="telephone"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.telephone}
                        onChange={handleChange}
                        required
                        placeholder="+224 622 00 00 00"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-base-content/40" />
                          Téléphone 2
                        </span>
                      </label>
                      <input
                        type="tel"
                        name="telephone2"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.telephone2}
                        onChange={handleChange}
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-base-content/40" />
                        Email
                      </span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="input input-bordered w-full focus:input-primary"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="client@exemple.gn"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-base-content/40" />
                        Adresse
                      </span>
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      className="input input-bordered w-full focus:input-primary"
                      value={formData.adresse}
                      onChange={handleChange}
                      placeholder="Quartier, Ville"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Ville</span>
                      </label>
                      <input
                        type="text"
                        name="ville"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.ville}
                        onChange={handleChange}
                        placeholder="Conakry"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Quartier</span>
                      </label>
                      <input
                        type="text"
                        name="quartier"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.quartier}
                        onChange={handleChange}
                        placeholder="Kaloum"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-base-content/40" />
                          Zone de collecte
                        </span>
                      </label>
                      <input
                        type="text"
                        name="zone"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.zone}
                        onChange={handleChange}
                        placeholder="Zone A"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 — Contact entreprise (conditionnel) */}
            {estProfessionnel && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-warning" />
                    <h2 className="font-semibold text-sm">Personne de contact</h2>
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
                          className="input input-bordered w-full focus:input-primary"
                          value={formData.contact_nom}
                          onChange={handleChange}
                          placeholder="Nom complet"
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">Fonction</span>
                        </label>
                        <input
                          type="text"
                          name="contact_fonction"
                          className="input input-bordered w-full focus:input-primary"
                          value={formData.contact_fonction}
                          onChange={handleChange}
                          placeholder="Directeur"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Téléphone du contact</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_telephone"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.contact_telephone}
                        onChange={handleChange}
                        placeholder="+224 622 00 00 00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 5 — Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Notes internes</h2>
                </div>

                <div className="p-5">
                  <textarea
                    name="notes"
                    className="textarea textarea-bordered w-full focus:textarea-primary"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Informations complémentaires..."
                  ></textarea>
                </div>
              </div>
            </div>

          </div>

          {/* ============================================ */}
          {/* COLONNE LATÉRALE — APERÇU */}
          {/* ============================================ */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu en direct</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">
                        {formData.nom?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {formData.prenom ? `${formData.prenom} ` : ''}{formData.nom || 'Nom du client'}
                      </p>
                      <p className="text-xs text-base-content/50 font-mono">
                        {estEdition ? codeAffiche : `CLI-${new Date().getFullYear()}-...`}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium ml-auto">{formData.type}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Tél :</span>
                      <span className="font-medium ml-auto truncate">
                        {formData.telephone || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Zone :</span>
                      <span className="font-medium ml-auto truncate">
                        {formData.zone || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-between">
                    <span className={`badge badge-sm ${
                      formData.statut === 'actif' ? 'badge-success' :
                      formData.statut === 'suspendu' ? 'badge-warning' : 'badge-ghost'
                    }`}>
                      {formData.statut}
                    </span>
                    <span className="badge badge-outline badge-sm">{formData.type}</span>
                  </div>
                </div>

                <p className="text-xs text-base-content/40 mt-3 text-center">
                  L'aperçu se met à jour en temps réel
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================ */}
        {/* BARRE STICKY ACTIONS */}
        {/* ============================================ */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-between gap-4 px-6 py-3">

            <div className="hidden md:flex items-center gap-2 text-sm text-base-content/50">
              <AlertCircle className="w-4 h-4" />
              <span>
                Les champs marqués d'un <span className="text-error font-bold">*</span> sont obligatoires
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate(estEdition ? `/clients/${clientId}` : '/clients')}
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
                    {estEdition ? 'Enregistrer' : 'Créer le client'}
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

export default ClientForm;