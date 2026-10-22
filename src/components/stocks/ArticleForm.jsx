// src/components/stocks/ArticleForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Package2, DollarSign, Upload, X, RefreshCw, Eye
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const UNITES = [
  { value: 'unite', label: 'Unité' },
  { value: 'paire', label: 'Paire' },
  { value: 'carton', label: 'Carton' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'litre', label: 'Litre' },
  { value: 'metre', label: 'Mètre' },
  { value: 'rouleau', label: 'Rouleau' },
  { value: 'lot', label: 'Lot' },
];

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementCode, setChargementCode] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [categories, setCategories] = useState([]);

  const estEdition = id && id !== 'ajouter';
  const articleId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    designation: '',
    categorie: '',
    description: '',
    unite: 'unite',
    stock_minimum: 0,
    seuil_alerte: 0,
    prix_achat: 0,
    fournisseur_nom: '',
    actif: true,
  });

  const [photo, setPhoto] = useState(null);
  const [photoActuelle, setPhotoActuelle] = useState(null);

  useEffect(() => {
    chargerCategories();
    if (estEdition) {
      chargerArticle();
    } else {
      chargerProchainCode();
    }
  }, [id]);

  const chargerCategories = async () => {
    try {
      const res = await AxiosInstance.get('/categories-materiel/?actif=true');
      setCategories(res.data.results || res.data || []);
    } catch (err) { console.error(err); }
  };

  const chargerProchainCode = async () => {
    setChargementCode(true);
    try {
      const res = await AxiosInstance.get('/articles/prochain_code/');
      if (res.data?.code) {
        setFormData(prev => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error('Erreur chargement code:', err);
    } finally {
      setChargementCode(false);
    }
  };

  const chargerArticle = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/articles/${articleId}/`);
      const data = res.data;
      setFormData({
        code: data.code || '',
        designation: data.designation || '',
        categorie: data.categorie || '',
        description: data.description || '',
        unite: data.unite || 'unite',
        stock_minimum: data.stock_minimum || 0,
        seuil_alerte: data.seuil_alerte || 0,
        prix_achat: data.prix_achat || 0,
        fournisseur_nom: data.fournisseur_nom || '',
        actif: data.actif !== undefined ? data.actif : true,
      });
      if (data.photo) setPhotoActuelle(data.photo);
    } catch (err) {
      setErreur("Impossible de charger l'article");
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
          if (['stock_minimum', 'seuil_alerte', 'prix_achat'].includes(k)) {
            dataToSend[k] = 0;
          } else if (k !== 'code') {
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
        await AxiosInstance.patch(`/articles/${articleId}/`, payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/articles/${articleId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/articles/', payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/articles/${res.data.id}`), 1200);
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

  const categorieSelectionnee = categories.find(
    c => String(c.id) === String(formData.categorie)
  );

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/articles')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Stocks / Articles / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              <span className="truncate">
                {estEdition ? "Modifier l'article" : 'Nouvel article'}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Article {estEdition ? 'modifié' : 'créé'} !</span>
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
                  <Package2 className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Code</span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="code"
                          className="input input-bordered join-item w-full font-mono"
                          value={formData.code}
                          onChange={handleChange}
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
                      placeholder="Ex : Gants de protection"
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
                      placeholder="Description de l'article..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock & Prix */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Stock & Prix</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Unité</span>
                      </label>
                      <select
                        name="unite"
                        className="select select-bordered w-full"
                        value={formData.unite}
                        onChange={handleChange}
                      >
                        {UNITES.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Prix d'achat (GNF)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="prix_achat"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.prix_achat}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Stock minimum</span>
                      </label>
                      <input
                        type="number"
                        name="stock_minimum"
                        className="input input-bordered w-full font-mono"
                        value={formData.stock_minimum}
                        onChange={handleChange}
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Seuil d'alerte</span>
                      </label>
                      <input
                        type="number"
                        name="seuil_alerte"
                        className="input input-bordered w-full font-mono"
                        value={formData.seuil_alerte}
                        onChange={handleChange}
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Fournisseur habituel</span>
                    </label>
                    <input
                      type="text"
                      name="fournisseur_nom"
                      className="input input-bordered w-full"
                      value={formData.fournisseur_nom}
                      onChange={handleChange}
                      placeholder="Nom du fournisseur"
                      maxLength="200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo & Statut */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30">
                  <h2 className="font-semibold text-sm">Photo & Statut</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Photo</span>
                    </label>
                    {photo || photoActuelle ? (
                      <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                        <Package2 className="w-5 h-5 text-primary" />
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
                      <span className="label-text font-medium">Article actif</span>
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
                        <Package2 className="w-6 h-6 text-primary" />
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
                      <span className="text-base-content/60">Prix :</span>
                      <span className="font-mono font-bold">
                        {formData.prix_achat
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.prix_achat)) + ' GNF'
                          : '0 GNF'}
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
              onClick={() => navigate('/articles')}
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : "Créer l'article"}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;