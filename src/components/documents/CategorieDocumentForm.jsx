// src/components/documents/CategorieDocumentForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, FolderOpen,
  Info, Eye, RefreshCw, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES = [
  { value: 'rh',            label: 'Ressources Humaines' },
  { value: 'comptable',     label: 'Comptabilité' },
  { value: 'client',        label: 'Client' },
  { value: 'fournisseur',   label: 'Fournisseur' },
  { value: 'vehicule',      label: 'Véhicule' },
  { value: 'exploitation',  label: 'Exploitation' },
  { value: 'contrat',       label: 'Contrat' },
  { value: 'facture',       label: 'Facture' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'autre',         label: 'Autre' },
];

const CategorieDocumentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const estEdition = id && id !== 'ajouter';
  const categorieId = estEdition ? id : null;

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementCode, setChargementCode] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type: 'autre',
    description: '',
    parent: '',
    ordre: 0,
    actif: true,
  });

  useEffect(() => {
    chargerCategories();
    if (estEdition) {
      chargerCategorie();
    } else {
      chargerProchainCode();
      setChargementInitial(false);
    }
  }, [id]);

  const chargerCategories = async () => {
    try {
      const res = await AxiosInstance.get('/categories-documents/?page_size=500');
      let cats = res.data.results || res.data || [];
      if (estEdition) {
        cats = cats.filter(c => c.id !== parseInt(id));
      }
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerProchainCode = async () => {
    setChargementCode(true);
    try {
      const res = await AxiosInstance.get('/categories-documents/prochain_code/');
      if (res.data?.code) {
        setFormData(prev => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChargementCode(false);
    }
  };

  const chargerCategorie = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/categories-documents/${categorieId}/`);
      const d = res.data;
      setFormData({
        code: d.code || '',
        nom: d.nom || '',
        type: d.type || 'autre',
        description: d.description || '',
        parent: d.parent || '',
        ordre: d.ordre || 0,
        actif: d.actif !== undefined ? d.actif : true,
      });
    } catch (err) {
      setErreur('Impossible de charger la catégorie');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(k => {
        if (dataToSend[k] === '' || dataToSend[k] === null) {
          if (k === 'parent') dataToSend[k] = null;
          else if (k === 'ordre') dataToSend[k] = 0;
          else delete dataToSend[k];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/categories-documents/${categorieId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/categories-documents'), 1200);
      } else {
        await AxiosInstance.post('/categories-documents/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/categories-documents'), 1200);
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
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/categories-documents')} className="btn btn-ghost btn-sm btn-circle" type="button">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Documents / Catégories / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <FolderOpen className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Catégorie {estEdition ? 'modifiée' : 'créée'} !</span>
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
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Code</span>
                      </label>
                      <div className="join w-full">
                        <input type="text" name="code" className="input input-bordered join-item w-full font-mono" value={formData.code} onChange={handleChange} maxLength="30" readOnly={estEdition} />
                        {!estEdition && (
                          <button type="button" onClick={chargerProchainCode} disabled={chargementCode} className="btn btn-outline join-item">
                            {chargementCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Type</span>
                      </label>
                      <select name="type" className="select select-bordered w-full" value={formData.type} onChange={handleChange}>
                        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Nom <span className="text-error">*</span></span>
                    </label>
                    <input type="text" name="nom" className="input input-bordered w-full" value={formData.nom} onChange={handleChange} required maxLength="100" placeholder="Ex : Contrats de travail" />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Description</span>
                    </label>
                    <textarea name="description" className="textarea textarea-bordered w-full" value={formData.description} onChange={handleChange} rows="2"></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Catégorie parente</span>
                      </label>
                      <select name="parent" className="select select-bordered w-full" value={formData.parent || ''} onChange={handleChange}>
                        <option value="">— Aucune (racine) —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Ordre d'affichage</span>
                      </label>
                      <input type="number" name="ordre" className="input input-bordered w-full font-mono" value={formData.ordre} onChange={handleChange} min="0" />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 py-0">
                      <input type="checkbox" name="actif" className="checkbox checkbox-success" checked={formData.actif} onChange={handleChange} />
                      <span className="label-text font-medium">Catégorie active</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">{formData.code || 'DOCAT-AUTO'}</p>
                      <p className="font-bold text-sm mt-0.5 truncate">{formData.nom || 'Nom de la catégorie'}</p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">{TYPES.find(t => t.value === formData.type)?.label}</span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                    {formData.actif ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">À savoir</p>
                    <p className="text-base-content/70">
                      Le code est auto-généré. Vous pouvez créer une hiérarchie
                      via la catégorie parente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <button type="button" onClick={() => navigate('/categories-documents')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la catégorie'}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CategorieDocumentForm;