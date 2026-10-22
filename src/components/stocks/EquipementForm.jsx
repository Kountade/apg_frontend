// src/components/stocks/EquipementForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, HardHat, Tag, DollarSign, Shield, Eye, RefreshCw, Upload, X
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ETATS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'bon', label: 'Bon état' },
  { value: 'usage', label: 'Usagé' },
  { value: 'defectueux', label: 'Défectueux' },
  { value: 'hors_service', label: 'Hors service' },
  { value: 'rebut', label: 'Mis au rebut' },
];

const EquipementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementCode, setChargementCode] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [categories, setCategories] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [employes, setEmployes] = useState([]);

  const estEdition = id && id !== 'ajouter';
  const equipementId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    designation: '',
    categorie: '',
    description: '',
    numero_serie: '',
    marque: '',
    modele: '',
    annee_fabrication: '',
    date_acquisition: '',
    cout_acquisition: 0,
    fournisseur_nom: '',
    duree_garantie_mois: '',
    date_fin_garantie: '',
    duree_amortissement_mois: '',
    valeur_residuelle: 0,
    etat: 'neuf',
    localisation: '',
    magasin: '',
    responsable: '',
    actif: true,
    notes: '',
  });

  const [photo, setPhoto] = useState(null);
  const [photoActuelle, setPhotoActuelle] = useState(null);

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    chargerDonnees();
    if (estEdition) {
      chargerEquipement();
    } else {
      chargerProchainCode();
    }
  }, [id]);

  // ============================================================
  // CHARGER LE CODE AUTO
  // ============================================================
  const chargerProchainCode = async () => {
    setChargementCode(true);
    try {
      const res = await AxiosInstance.get('/equipements/prochain_code/');
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
  // CHARGER LES DONNÉES DE RÉFÉRENCE
  // ============================================================
  const chargerDonnees = async () => {
    try {
      const [catsRes, magsRes, empsRes] = await Promise.all([
        AxiosInstance.get('/categories-materiel/?type=equipement').catch(() => ({ data: [] })),
        AxiosInstance.get('/magasins/').catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);
      setCategories(catsRes.data.results || catsRes.data || []);
      setMagasins(magsRes.data.results || magsRes.data || []);
      setEmployes(empsRes.data.results || empsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ============================================================
  // CHARGER UN ÉQUIPEMENT EXISTANT
  // ============================================================
  const chargerEquipement = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/equipements/${equipementId}/`);
      const data = res.data;
      setFormData({
        code: data.code || '',
        designation: data.designation || '',
        categorie: data.categorie || '',
        description: data.description || '',
        numero_serie: data.numero_serie || '',
        marque: data.marque || '',
        modele: data.modele || '',
        annee_fabrication: data.annee_fabrication || '',
        date_acquisition: data.date_acquisition || '',
        cout_acquisition: data.cout_acquisition || 0,
        fournisseur_nom: data.fournisseur_nom || '',
        duree_garantie_mois: data.duree_garantie_mois || '',
        date_fin_garantie: data.date_fin_garantie || '',
        duree_amortissement_mois: data.duree_amortissement_mois || '',
        valeur_residuelle: data.valeur_residuelle || 0,
        etat: data.etat || 'neuf',
        localisation: data.localisation || '',
        magasin: data.magasin || '',
        responsable: data.responsable || '',
        actif: data.actif !== undefined ? data.actif : true,
        notes: data.notes || '',
      });
      if (data.photo) setPhotoActuelle(data.photo);
    } catch (err) {
      setErreur("Impossible de charger l'équipement");
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErreur('Photo trop volumineuse (max 5 Mo)');
        return;
      }
      setPhoto(file);
    }
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
          if (['magasin', 'responsable', 'date_acquisition', 'date_fin_garantie',
               'annee_fabrication', 'duree_garantie_mois', 'duree_amortissement_mois'].includes(k)) {
            dataToSend[k] = null;
          } else if (['cout_acquisition', 'valeur_residuelle'].includes(k)) {
            dataToSend[k] = 0;
          } else {
            delete dataToSend[k];
          }
        }
      });

      let payload = dataToSend;
      if (photo) {
        payload = new FormData();
        Object.entries(dataToSend).forEach(([k, v]) => {
          if (v !== null && v !== undefined) payload.append(k, v);
        });
        payload.append('photo', photo);
      }

      const config = photo
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      if (estEdition) {
        await AxiosInstance.patch(`/equipements/${equipementId}/`, payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/equipements/${equipementId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/equipements/', payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/equipements/${res.data.id}`), 1200);
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
  // RENDU : CHARGEMENT
  // ============================================================
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const categorieSelectionnee = categories.find(
    c => String(c.id) === String(formData.categorie)
  );

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/equipements')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Stocks / Équipements /{' '}
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
                {estEdition ? "Modifier l'équipement" : 'Nouvel équipement'}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Équipement {estEdition ? 'modifié' : 'créé'} !</span>
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
                  <HardHat className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Code auto */}
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
                          maxLength="50"
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
                          Catégorie <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="categorie"
                        className="select select-bordered w-full"
                        value={formData.categorie || ''}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner —</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Désignation <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="designation"
                      className="input input-bordered w-full"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      placeholder="Ex : Tricycle APG 2024"
                      maxLength="200"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Description</span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={formData.description}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Description de l'équipement..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Caractéristiques</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° série</span>
                      </label>
                      <input
                        type="text"
                        name="numero_serie"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_serie}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Marque</span>
                      </label>
                      <input
                        type="text"
                        name="marque"
                        className="input input-bordered w-full"
                        value={formData.marque}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Modèle</span>
                      </label>
                      <input
                        type="text"
                        name="modele"
                        className="input input-bordered w-full"
                        value={formData.modele}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Année fabrication
                        </span>
                      </label>
                      <input
                        type="number"
                        name="annee_fabrication"
                        className="input input-bordered w-full"
                        value={formData.annee_fabrication || ''}
                        onChange={handleChange}
                        min="1900"
                        max="2100"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">État</span>
                      </label>
                      <select
                        name="etat"
                        className="select select-bordered w-full"
                        value={formData.etat}
                        onChange={handleChange}
                      >
                        {ETATS.map(e => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acquisition & Amortissement */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">
                    Acquisition & Amortissement
                  </h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date acquisition
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_acquisition"
                        className="input input-bordered w-full"
                        value={formData.date_acquisition || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Coût acquisition (GNF)
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="cout_acquisition"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.cout_acquisition}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Fournisseur</span>
                    </label>
                    <input
                      type="text"
                      name="fournisseur_nom"
                      className="input input-bordered w-full"
                      value={formData.fournisseur_nom}
                      onChange={handleChange}
                      maxLength="200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Garantie (mois)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="duree_garantie_mois"
                        className="input input-bordered w-full"
                        value={formData.duree_garantie_mois || ''}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Fin garantie</span>
                      </label>
                      <input
                        type="date"
                        name="date_fin_garantie"
                        className="input input-bordered w-full"
                        value={formData.date_fin_garantie || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Amortissement (mois)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="duree_amortissement_mois"
                        className="input input-bordered w-full"
                        value={formData.duree_amortissement_mois || ''}
                        onChange={handleChange}
                        min="0"
                        placeholder="60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Affectation & Photo */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Affectation & Photo</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Magasin</span>
                      </label>
                      <select
                        name="magasin"
                        className="select select-bordered w-full"
                        value={formData.magasin || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun —</option>
                        {magasins.map(m => (
                          <option key={m.id} value={m.id}>{m.nom}</option>
                        ))}
                      </select>
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
                          <option key={e.id} value={e.id}>{e.nom_complet}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Localisation</span>
                    </label>
                    <input
                      type="text"
                      name="localisation"
                      className="input input-bordered w-full"
                      value={formData.localisation}
                      onChange={handleChange}
                      placeholder="Ex : Dépôt principal - Zone A"
                      maxLength="200"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Photo</span>
                    </label>
                    {photo || photoActuelle ? (
                      <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                        <HardHat className="w-5 h-5 text-primary" />
                        <p className="text-sm flex-1 truncate">
                          {photo?.name || photoActuelle?.split('/').pop()}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto(null);
                            setPhotoActuelle(null);
                          }}
                          className="btn btn-ghost btn-sm btn-square text-error"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-primary">
                        <Upload className="w-8 h-8 text-base-content/30" />
                        <p className="text-sm">Cliquer pour joindre une photo</p>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                      </label>
                    )}
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
                      <span className="label-text font-medium">Équipement actif</span>
                    </label>
                  </div>
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
                      {photo ? (
                        <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : photoActuelle ? (
                        <img src={photoActuelle} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <HardHat className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.code || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.designation || 'Désignation'}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Catégorie :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {categorieSelectionnee?.nom || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Coût :</span>
                      <span className="font-mono font-bold">
                        {formData.cout_acquisition
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.cout_acquisition)) + ' GNF'
                          : '0 GNF'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">État :</span>
                      <span className="font-medium">
                        {ETATS.find(e => e.value === formData.etat)?.label}
                      </span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                    {formData.actif ? 'Actif' : 'Inactif'}
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
              onClick={() => navigate('/equipements')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : "Créer l'équipement"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EquipementForm;