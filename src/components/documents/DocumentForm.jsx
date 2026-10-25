// src/components/documents/DocumentForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, FileText,
  Upload, X, Info, Eye, RefreshCw, Tag, Calendar, Shield,
  FolderOpen, Trash2, AlertTriangle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'valide',    label: 'Validé' },
  { value: 'archive',   label: 'Archivé' },
  { value: 'obsolete',  label: 'Obsolète' },
];

const CONFIDENTIALITES = [
  { value: 'public',       label: 'Public',       color: 'success' },
  { value: 'interne',      label: 'Interne',      color: 'info' },
  { value: 'confidentiel', label: 'Confidentiel', color: 'warning' },
  { value: 'secret',       label: 'Secret',       color: 'error' },
];

const DocumentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const estEdition = id && id !== 'ajouter';
  const documentId = estEdition ? id : null;

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    numero: '',
    categorie: '',
    titre: '',
    description: '',
    statut: 'brouillon',
    confidentialite: 'interne',
    date_document: new Date().toISOString().split('T')[0],
    date_expiration: '',
    mots_cles: '',
    version: '1.0',
    objet_lie_type: '',
    objet_lie_id: '',
    notes: '',
  });

  const [fichier, setFichier] = useState(null);
  const [fichierActuel, setFichierActuel] = useState(null);
  const [fichierNomActuel, setFichierNomActuel] = useState(null);

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    chargerCategories();
    if (estEdition) {
      chargerDocument();
    } else {
      setChargementInitial(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerCategories = async () => {
    try {
      const res = await AxiosInstance.get('/categories-documents/?actif=true&page_size=500');
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerDocument = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/documents/${documentId}/`);
      const d = res.data;
      setFormData({
        numero: d.numero || '',
        categorie: d.categorie || '',
        titre: d.titre || '',
        description: d.description || '',
        statut: d.statut || 'brouillon',
        confidentialite: d.confidentialite || 'interne',
        date_document: d.date_document || '',
        date_expiration: d.date_expiration || '',
        mots_cles: d.mots_cles || '',
        version: d.version || '1.0',
        objet_lie_type: d.objet_lie_type || '',
        objet_lie_id: d.objet_lie_id || '',
        notes: d.notes || '',
      });
      if (d.fichier) {
        setFichierActuel(d.fichier);
        setFichierNomActuel(d.nom_fichier_original || d.fichier.split('/').pop());
      }
    } catch (err) {
      setErreur('Impossible de charger le document');
    } finally {
      setChargementInitial(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFichierChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation taille (20 Mo)
    if (file.size > 20 * 1024 * 1024) {
      setErreur('Le fichier dépasse la taille maximale de 20 Mo.');
      return;
    }

    setFichier(file);
    setErreur(null);
  };

  const supprimerFichier = () => {
    setFichier(null);
    setFichierActuel(null);
    setFichierNomActuel(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    // Validation : un fichier est obligatoire en création
    if (!estEdition && !fichier) {
      setErreur('Sélectionnez un fichier à uploader.');
      setChargement(false);
      return;
    }

    try {
      const formPayload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formPayload.append(key, value);
        }
      });

      if (fichier) {
        formPayload.append('fichier', fichier);
      }

      if (estEdition) {
        await AxiosInstance.patch(`/documents/${documentId}/`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSucces(true);
        setTimeout(() => navigate(`/documents/${documentId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/documents/', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSucces(true);
        setTimeout(() => navigate(`/documents/${res.data.id}`), 1200);
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
          <p className="text-sm text-base-content/60">Chargement du formulaire...</p>
        </div>
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
            onClick={() => navigate('/documents')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Documents / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <FileText className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier le document' : 'Nouveau document'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Document {estEdition ? 'modifié' : 'créé'} !</span>
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
            {/* Fichier */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Fichier</h2>
                </div>
                <div className="p-5 space-y-5">
                  {(fichier || fichierActuel) ? (
                    <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-lg">
                      <FileText className="w-10 h-10 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {fichier?.name || fichierNomActuel || 'Fichier actuel'}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {fichier
                            ? `${(fichier.size / 1024).toFixed(1)} Ko (nouveau)`
                            : 'Fichier actuel'
                          }
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={supprimerFichier}
                        className="btn btn-ghost btn-sm btn-square text-error"
                        title="Retirer le fichier"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-12 h-12 text-base-content/30" />
                      <p className="text-sm font-medium">
                        Cliquez pour sélectionner un fichier
                      </p>
                      <p className="text-xs text-base-content/50">
                        PDF, Word, Excel, PowerPoint, images (max 20 Mo)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFichierChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt,.csv"
                      />
                    </label>
                  )}

                  {(fichier || fichierActuel) && (
                    <label className="btn btn-outline btn-sm gap-2">
                      <Upload className="w-4 h-4" />
                      Remplacer par un autre fichier
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFichierChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt,.csv"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Identification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Numéro</span>
                      </label>
                      <input
                        type="text"
                        name="numero"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero}
                        placeholder="Auto-généré"
                        readOnly
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Version</span>
                      </label>
                      <input
                        type="text"
                        name="version"
                        className="input input-bordered w-full font-mono"
                        value={formData.version}
                        onChange={handleChange}
                        maxLength="20"
                        placeholder="1.0"
                      />
                    </div>
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

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Titre <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="titre"
                      className="input input-bordered w-full"
                      value={formData.titre}
                      onChange={handleChange}
                      required
                      maxLength="200"
                      placeholder="Titre du document"
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
                      placeholder="Description du document..."
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Mots-clés <span className="text-base-content/40">(séparés par virgules)</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                      <input
                        type="text"
                        name="mots_cles"
                        className="input input-bordered w-full pl-10"
                        value={formData.mots_cles}
                        onChange={handleChange}
                        maxLength="500"
                        placeholder="contrat, travail, CDI"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Dates</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date du document</span>
                      </label>
                      <input
                        type="date"
                        name="date_document"
                        className="input input-bordered w-full"
                        value={formData.date_document}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date d'expiration</span>
                      </label>
                      <input
                        type="date"
                        name="date_expiration"
                        className="input input-bordered w-full"
                        value={formData.date_expiration}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Classification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Confidentialité</span>
                      </label>
                      <select
                        name="confidentialite"
                        className="select select-bordered w-full"
                        value={formData.confidentialite}
                        onChange={handleChange}
                      >
                        {CONFIDENTIALITES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Objet lié (type)</span>
                      </label>
                      <input
                        type="text"
                        name="objet_lie_type"
                        className="input input-bordered w-full font-mono text-xs"
                        value={formData.objet_lie_type}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Ex : vehicules.Tricycle"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Objet lié (ID)</span>
                      </label>
                      <input
                        type="text"
                        name="objet_lie_id"
                        className="input input-bordered w-full font-mono"
                        value={formData.objet_lie_id}
                        onChange={handleChange}
                        maxLength="50"
                        placeholder="Ex : 42"
                      />
                    </div>
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
                    ></textarea>
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
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.numero || 'DOC-AUTO'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.titre || 'Titre du document'}
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
                      <span className="text-base-content/60">Version :</span>
                      <span className="font-mono">v{formData.version || '1.0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Confidentialité :</span>
                      <span className={`badge badge-sm ${
                        formData.confidentialite === 'public' ? 'badge-success' :
                        formData.confidentialite === 'interne' ? 'badge-info' :
                        formData.confidentialite === 'confidentiel' ? 'badge-warning' :
                        'badge-error'
                      }`}>
                        {CONFIDENTIALITES.find(c => c.value === formData.confidentialite)?.label}
                      </span>
                    </div>
                  </div>
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
                      Le fichier est obligatoire à la création. Le numéro est auto-généré.
                      La confidentialité filtre automatiquement l'accès selon le rôle.
                    </p>
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
              onClick={() => navigate('/documents')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le document'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;