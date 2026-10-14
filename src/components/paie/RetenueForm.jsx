// components/paie/RetenueForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, FileMinus, Eye, Info, Shield, Landmark, Banknote,
  HandCoins, Percent, FileText, Hash, TrendingDown, Calculator
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_RETENUE = [
  { value: 'cnss', label: 'CNSS', icon: Shield, color: 'primary', description: 'Cotisation sécurité sociale' },
  { value: 'impot', label: 'Impôt', icon: Landmark, color: 'warning', description: 'Impôt sur le revenu' },
  { value: 'pret', label: 'Prêt', icon: Banknote, color: 'info', description: 'Remboursement de prêt' },
  { value: 'avance', label: 'Avance', icon: HandCoins, color: 'secondary', description: 'Retenue sur avance' },
  { value: 'autre', label: 'Autre', icon: FileMinus, color: 'ghost', description: 'Autre type' },
];

const RetenueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const retenueId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type: 'cnss',
    pourcentage: 0,
    montant_fixe: '',
    actif: true,
    description: '',
  });

  useEffect(() => {
    if (estEdition && retenueId) {
      chargerRetenue(retenueId);
    }
  }, [id]);

  const chargerRetenue = async (rid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/retenues/${rid}/`);
      const data = response.data;
      setFormData({
        code: data.code || '',
        nom: data.nom || '',
        type: data.type || 'cnss',
        pourcentage: data.pourcentage || 0,
        montant_fixe: data.montant_fixe || '',
        actif: data.actif !== undefined ? data.actif : true,
        description: data.description || '',
      });
    } catch (err) {
      setErreur('Impossible de charger la retenue');
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
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (['pourcentage', 'montant_fixe'].includes(key)) dataToSend[key] = 0;
          else if (key !== 'actif') delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/retenues/${retenueId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/retenues'), 1200);
      } else {
        await AxiosInstance.post('/retenues/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/retenues'), 1200);
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

  const typeSelectionne = TYPES_RETENUE.find(t => t.value === formData.type);
  const TypeIcon = typeSelectionne?.icon || FileMinus;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/retenues')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Paie / Retenues / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.nom}` : 'Nouvelle retenue'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Retenue {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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

            {/* Identification */}
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
                        required
                        placeholder="RET-CNSS"
                        maxLength="30"
                      />
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
                        placeholder="Retenue CNSS salariale"
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {TYPES_RETENUE.map((t) => {
                        const IconType = t.icon;
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
                            <IconType className="w-4 h-4" />
                            <span className="text-[10px] font-bold leading-tight">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
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
                      placeholder="Description de la retenue..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Montant */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-error" />
                  <h2 className="font-semibold text-sm">Montant de la retenue</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Pourcentage</span>
                      </label>
                      <div className="relative">
                        <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                        <input
                          type="number"
                          name="pourcentage"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.pourcentage}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          % calculé sur le salaire brut
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Montant fixe</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="montant_fixe"
                          className="input input-bordered w-full pl-14 font-mono"
                          value={formData.montant_fixe}
                          onChange={handleChange}
                          min="0"
                          step="1000"
                          placeholder="0"
                        />
                      </div>
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          Montant fixe déduit
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="alert alert-info py-2">
                    <Info className="w-4 h-4" />
                    <span className="text-xs">
                      Utilisez <strong>un seul</strong> des deux modes ou les deux combinés
                      (pourcentage + fixe).
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-5">
                <label className="label cursor-pointer justify-start gap-3 py-0">
                  <input
                    type="checkbox"
                    name="actif"
                    className="checkbox checkbox-success"
                    checked={formData.actif}
                    onChange={handleChange}
                  />
                  <div>
                    <span className="label-text font-medium">Retenue active</span>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      Disponible pour utilisation dans les bulletins
                    </p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className={`card shadow-sm border-2 bg-${typeSelectionne?.color}/5 border-${typeSelectionne?.color}/30`}>
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg bg-${typeSelectionne?.color}/20 flex items-center justify-center`}>
                      <TypeIcon className={`w-6 h-6 text-${typeSelectionne?.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">{formData.code || 'CODE'}</p>
                      <p className="font-bold text-sm mt-0.5 truncate">{formData.nom || 'Nom de la retenue'}</p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">{typeSelectionne?.label}</span>
                    </div>
                    {Number(formData.pourcentage) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Pourcentage :</span>
                        <span className="font-bold text-error">{formData.pourcentage}%</span>
                      </div>
                    )}
                    {Number(formData.montant_fixe) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Montant fixe :</span>
                        <span className="font-mono font-bold text-error">
                          {new Intl.NumberFormat('fr-FR').format(Number(formData.montant_fixe))} GNF
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                    {formData.actif ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Retenues courantes</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li>• <strong>CNSS</strong> : 5% généralement</li>
                      <li>• <strong>Impôt</strong> : selon barème</li>
                      <li>• <strong>Prêt</strong> : montant fixe mensuel</li>
                      <li>• <strong>Avance</strong> : remboursement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <button type="button" onClick={() => navigate('/retenues')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la retenue'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RetenueForm;