// components/contrats/TypeContratForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Layers, Eye, Info, Hash, Calculator, FileText,
  Briefcase, Building2, Shield, FileSignature, Calendar,
  Timer, Lock, BookOpen, Upload, X, ExternalLink,
  ClipboardList, FileBadge, TrendingUp, UserCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Config
// ============================================================
const CATEGORIES = [
  { value: 'emploi',      label: 'Contrat de travail',  icon: Briefcase,     color: 'primary',   description: 'CDI, CDD, stage, apprentissage...' },
  { value: 'client',      label: 'Contrat client',      icon: Building2,     color: 'info',      description: 'Prestation de service client' },
  { value: 'fournisseur', label: 'Contrat fournisseur', icon: Building2,     color: 'secondary', description: 'Achat, sous-traitance' },
  { value: 'partenariat', label: 'Partenariat',         icon: Shield,        color: 'accent',    description: 'Convention de partenariat' },
  { value: 'bail',        label: 'Bail / location',     icon: FileSignature, color: 'warning',   description: 'Location de locaux ou matériel' },
  { value: 'maintenance', label: 'Maintenance',         icon: FileText,      color: 'success',   description: 'Contrat de maintenance' },
  { value: 'autre',       label: 'Autre',               icon: FileText,      color: 'ghost',     description: 'Autre type de contrat' },
];

const STATUTS = [
  { value: 'actif',   label: 'Actif',   color: 'success' },
  { value: 'inactif', label: 'Inactif', color: 'warning' },
  { value: 'archive', label: 'Archivé', color: 'ghost' },
];

const TypeContratForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const typeId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    titre: '',
    categorie: 'emploi',
    description: '',
    contenu: '',
    duree_mois: '',
    periode_essai_jours: '',
    preavis_jours: 30,
    reference_legale: '',
    statut: 'actif',
    ordre: 0,
    notes: '',
  });

  const [fichierModele, setFichierModele] = useState(null);
  const [fichierActuel, setFichierActuel] = useState(null);

  // ------------------------------------------------------------
  // Chargement initial
  // ------------------------------------------------------------
  useEffect(() => {
    if (estEdition && typeId) {
      chargerType(typeId);
    } else {
      proposerCode();
    }
  }, [id]);

  const proposerCode = async () => {
    try {
      const res = await AxiosInstance.get('/types-contrats/prochain_code/');
      if (res.data?.code) {
        setFormData(prev => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error('Erreur code:', err);
    }
  };

  const chargerType = async (tid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/types-contrats/${tid}/`);
      const data = response.data;
      setFormData({
        code: data.code || '',
        titre: data.titre || '',
        categorie: data.categorie || 'emploi',
        description: data.description || '',
        contenu: data.contenu || '',
        duree_mois: data.duree_mois || '',
        periode_essai_jours: data.periode_essai_jours || '',
        preavis_jours: data.preavis_jours || 30,
        reference_legale: data.reference_legale || '',
        statut: data.statut || 'actif',
        ordre: data.ordre || 0,
        notes: data.notes || '',
      });
      if (data.fichier_modele) {
        setFichierActuel(data.fichier_modele);
      }
    } catch (err) {
      setErreur('Impossible de charger le type de contrat');
    } finally {
      setChargementInitial(false);
    }
  };

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFichierChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limite 10 Mo
      if (file.size > 10 * 1024 * 1024) {
        setErreur('Le fichier ne doit pas dépasser 10 Mo');
        return;
      }
      setFichierModele(file);
    }
  };

  const retirerFichier = () => {
    setFichierModele(null);
    setFichierActuel(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      if (fichierModele) {
        formDataToSend.append('fichier_modele', fichierModele);
      }

      if (estEdition) {
        await AxiosInstance.patch(`/types-contrats/${typeId}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSucces(true);
        setTimeout(() => navigate(`/types-contrats/${typeId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/types-contrats/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSucces(true);
        setTimeout(() => navigate(`/types-contrats/${res.data.id}`), 1200);
      }
    } catch (err) {
      if (err.response?.data) {
        const errors = Object.entries(err.response.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        setErreur(errors);
      } else {
        setErreur("Erreur lors de l'enregistrement");
      }
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Rendu : chargement initial
  // ------------------------------------------------------------
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const categorieSelectionnee = CATEGORIES.find(c => c.value === formData.categorie);
  const CategorieIcon = categorieSelectionnee?.icon || Layers;
  const statutSelectionne = STATUTS.find(s => s.value === formData.statut);

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/types-contrats')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Contrats / Types /{' '}
              <span className="text-primary">
                {estEdition ? 'Modification' : 'Création'}
              </span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition
                ? <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                : <Plus className="w-5 h-5 text-primary flex-shrink-0" />}
              <span className="truncate">
                {estEdition ? `Modifier — ${formData.titre}` : 'Nouveau type de contrat'}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* ============ ALERTES ============ */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Type de contrat {estEdition ? 'modifié' : 'créé'} avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      {/* ============ FORMULAIRE ============ */}
      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          {/* ---------- COLONNE PRINCIPALE ---------- */}
          <div className="lg:col-span-2 space-y-6">

            {/* --- Identification --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
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
                      <input
                        type="text"
                        name="code"
                        className="input input-bordered w-full font-mono"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="TCT-2026-000001"
                        maxLength="30"
                      />
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          Auto-généré si laissé vide
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Statut <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="statut"
                        className="select select-bordered w-full"
                        value={formData.statut}
                        onChange={handleChange}
                        required
                      >
                        {STATUTS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Titre du contrat <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="titre"
                      className="input input-bordered w-full"
                      value={formData.titre}
                      onChange={handleChange}
                      required
                      placeholder="Ex : Contrat de travail à durée indéterminée"
                      maxLength="200"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Catégorie <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {CATEGORIES.map(c => {
                        const Icon = c.icon;
                        const isSelected = formData.categorie === c.value;
                        return (
                          <button
                            type="button"
                            key={c.value}
                            onClick={() => setFormData(prev => ({ ...prev, categorie: c.value }))}
                            className={`btn btn-sm h-auto flex-col py-3 gap-1 ${
                              isSelected ? `btn-${c.color}` : 'btn-outline'
                            }`}
                            title={c.description}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] font-bold leading-tight text-center">
                              {c.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Description courte <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={formData.description}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Résumé du type de contrat..."
                      required
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Ordre d'affichage</span>
                    </label>
                    <input
                      type="number"
                      name="ordre"
                      className="input input-bordered w-full"
                      value={formData.ordre}
                      onChange={handleChange}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Contenu du contrat --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Corps du contrat</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="alert alert-info py-2">
                    <Info className="w-4 h-4" />
                    <span className="text-xs">
                      Ce texte servira de base lors de la création d'un contrat.
                      Il peut être modifié au cas par cas.
                    </span>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Contenu type du contrat
                      </span>
                    </label>
                    <textarea
                      name="contenu"
                      className="textarea textarea-bordered w-full font-mono text-sm"
                      value={formData.contenu}
                      onChange={handleChange}
                      rows="12"
                      placeholder="Texte complet du contrat (conditions, clauses, obligations...)"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Paramètres --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Paramètres du contrat</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Durée (mois)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="duree_mois"
                        className="input input-bordered w-full font-mono"
                        value={formData.duree_mois}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        placeholder="Indéterminée"
                      />
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          Vide = indéterminée
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Période d'essai (jours)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="periode_essai_jours"
                        className="input input-bordered w-full font-mono"
                        value={formData.periode_essai_jours}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Préavis (jours)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="preavis_jours"
                        className="input input-bordered w-full font-mono"
                        value={formData.preavis_jours}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Référence légale
                      </span>
                    </label>
                    <input
                      type="text"
                      name="reference_legale"
                      className="input input-bordered w-full"
                      value={formData.reference_legale}
                      onChange={handleChange}
                      maxLength="200"
                      placeholder="Ex : Article L.1221-2 du Code du travail"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Fichier modèle --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Fichier modèle (PDF / DOCX)</h2>
                </div>
                <div className="p-5 space-y-4">

                  {(fichierModele || fichierActuel) ? (
                    <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fichierModele
                            ? fichierModele.name
                            : (fichierActuel?.split('/').pop() || 'Fichier actuel')}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {fichierModele ? `${(fichierModele.size / 1024).toFixed(0)} Ko` : 'Fichier existant'}
                        </p>
                      </div>
                      {fichierActuel && !fichierModele && (
                        <a
                          href={fichierActuel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm btn-square"
                          title="Ouvrir"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={retirerFichier}
                        className="btn btn-ghost btn-sm btn-square text-error"
                        title="Retirer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-primary transition-colors bg-base-200/20">
                      <Upload className="w-10 h-10 text-base-content/30" />
                      <p className="text-sm font-medium">Cliquer pour sélectionner un fichier</p>
                      <p className="text-xs text-base-content/50">PDF ou DOCX • Max 10 Mo</p>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFichierChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* --- Notes internes --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Notes internes</h2>
                </div>
                <div className="p-5">
                  <textarea
                    name="notes"
                    className="textarea textarea-bordered w-full"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Notes visibles uniquement par les administrateurs..."
                  ></textarea>
                </div>
              </div>
            </div>

          </div>

          {/* ---------- COLONNE LATÉRALE ---------- */}
          <div className="lg:col-span-1 space-y-6">

            {/* Aperçu */}
            <div className={`card shadow-sm border-2 bg-${categorieSelectionnee?.color}/5 border-${categorieSelectionnee?.color}/30`}>
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg bg-${categorieSelectionnee?.color}/20 flex items-center justify-center flex-shrink-0`}>
                      <CategorieIcon className={`w-6 h-6 text-${categorieSelectionnee?.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.code || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.titre || 'Titre du contrat'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Catégorie :</span>
                      <span className="font-medium">{categorieSelectionnee?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Durée :</span>
                      <span className="font-medium">
                        {formData.duree_mois ? `${formData.duree_mois} mois` : 'Indéterminée'}
                      </span>
                    </div>
                    {formData.periode_essai_jours && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Essai :</span>
                        <span className="font-medium">{formData.periode_essai_jours} jours</span>
                      </div>
                    )}
                    {formData.preavis_jours && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Préavis :</span>
                        <span className="font-medium">{formData.preavis_jours} jours</span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-${statutSelectionne?.color} badge-sm`}>
                    {statutSelectionne?.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Cas d'usage</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li>• <strong>Emploi</strong> → CDI, CDD, stage, apprentissage</li>
                      <li>• <strong>Client</strong> → prestation, abonnement, service</li>
                      <li>• <strong>Fournisseur</strong> → achat, sous-traitance</li>
                      <li>• <strong>Bail</strong> → local, matériel, véhicule</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Rappel workflow */}
            <div className="card bg-warning/5 border border-warning/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">Réutilisation</p>
                    <p className="text-base-content/70">
                      Ce type sera proposé lors de la création d'un contrat
                      employé ou client. Le contenu sera pré-rempli et modifiable
                      au cas par cas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ============ BARRE STICKY ============ */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <button
              type="button"
              onClick={() => navigate('/types-contrats')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[180px]"
              disabled={chargement}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {estEdition ? 'Enregistrer' : 'Créer le type'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TypeContratForm;