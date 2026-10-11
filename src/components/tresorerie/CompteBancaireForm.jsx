// components/tresorerie/CompteBancaireForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Landmark, Eye, Info, Smartphone, Building2,
  CreditCard, Hash, User, DollarSign, FileText, Wallet
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_COMPTE = [
  { value: 'banque', label: 'Compte bancaire', icon: Landmark, color: 'primary' },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, color: 'success' },
  { value: 'caisse_populaire', label: 'Caisse populaire', icon: Building2, color: 'warning' },
  { value: 'autre', label: 'Autre', icon: CreditCard, color: 'ghost' },
];

const CompteBancaireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const compteId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type: 'banque',
    banque: '',
    numero_compte: '',
    iban: '',
    swift: '',
    titulaire: '',
    devise: 'GNF',
    solde_initial: '',
    solde_actuel: '',
    actif: true,
    notes: '',
  });

  useEffect(() => {
    if (estEdition && compteId) {
      chargerCompte(compteId);
    }
  }, [id]);

  const chargerCompte = async (cid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/comptes-bancaires/${cid}/`);
      const data = response.data;
      setFormData({
        code: data.code || '',
        nom: data.nom || '',
        type: data.type || 'banque',
        banque: data.banque || '',
        numero_compte: data.numero_compte || '',
        iban: data.iban || '',
        swift: data.swift || '',
        titulaire: data.titulaire || '',
        devise: data.devise || 'GNF',
        solde_initial: data.solde_initial || '',
        solde_actuel: data.solde_actuel || '',
        actif: data.actif !== undefined ? data.actif : true,
        notes: data.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le compte');
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
          if (['solde_initial', 'solde_actuel'].includes(key)) dataToSend[key] = 0;
          else if (key !== 'actif') delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/comptes-bancaires/${compteId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/comptes-bancaires'), 1200);
      } else {
        await AxiosInstance.post('/comptes-bancaires/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/comptes-bancaires'), 1200);
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

  const typeSelectionne = TYPES_COMPTE.find(t => t.value === formData.type);
  const TypeIcon = typeSelectionne?.icon || Landmark;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/comptes-bancaires')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Wallet className="w-3 h-3" />
              Trésorerie / Comptes bancaires / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.code}` : 'Nouveau compte bancaire'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Compte {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
                        placeholder="BNQ-001"
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
                        placeholder="Compte courant principal"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Type de compte <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {TYPES_COMPTE.map((t) => {
                        const IconType = t.icon;
                        const isSelected = formData.type === t.value;
                        return (
                          <button
                            type="button"
                            key={t.value}
                            onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                            className={`btn h-auto flex-col py-3 gap-2 ${
                              isSelected ? `btn-${t.color}` : 'btn-outline'
                            }`}
                          >
                            <IconType className="w-5 h-5" />
                            <span className="text-xs">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails bancaires */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Détails bancaires</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Banque / Opérateur</span>
                      </label>
                      <input
                        type="text"
                        name="banque"
                        className="input input-bordered w-full"
                        value={formData.banque}
                        onChange={handleChange}
                        placeholder="BICIGUI, Orange Money..."
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Numéro de compte</span>
                      </label>
                      <input
                        type="text"
                        name="numero_compte"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_compte}
                        onChange={handleChange}
                        placeholder="001234567890"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        placeholder="GN12 3456 7890..."
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">SWIFT / BIC</span>
                      </label>
                      <input
                        type="text"
                        name="swift"
                        className="input input-bordered w-full font-mono"
                        value={formData.swift}
                        onChange={handleChange}
                        placeholder="BICIGNCN"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-base-content/40" />
                        Titulaire du compte
                      </span>
                    </label>
                    <input
                      type="text"
                      name="titulaire"
                      className="input input-bordered w-full"
                      value={formData.titulaire}
                      onChange={handleChange}
                      placeholder="APG ASSAINISSEMENT"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Soldes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Soldes</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Devise</span>
                      </label>
                      <select
                        name="devise"
                        className="select select-bordered w-full"
                        value={formData.devise}
                        onChange={handleChange}
                      >
                        <option value="GNF">GNF</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Solde initial</span>
                      </label>
                      <input
                        type="number"
                        name="solde_initial"
                        className="input input-bordered w-full font-mono"
                        value={formData.solde_initial}
                        onChange={handleChange}
                        min="0"
                        step="100"
                        placeholder="0"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Solde actuel</span>
                      </label>
                      <input
                        type="number"
                        name="solde_actuel"
                        className="input input-bordered w-full font-mono"
                        value={formData.solde_actuel}
                        onChange={handleChange}
                        min="0"
                        step="100"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut & Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Statut & Notes</h2>
                </div>
                <div className="p-5 space-y-5">
                  <label className="label cursor-pointer justify-start gap-3 py-0">
                    <input
                      type="checkbox"
                      name="actif"
                      className="checkbox checkbox-primary"
                      checked={formData.actif}
                      onChange={handleChange}
                    />
                    <div>
                      <span className="label-text font-medium">Compte actif</span>
                      <p className="text-xs text-base-content/50 mt-0.5">
                        Les comptes inactifs ne peuvent pas recevoir de mouvements
                      </p>
                    </div>
                  </label>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Notes</span>
                    </label>
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

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
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
                      <p className="font-bold text-sm mt-0.5 truncate">{formData.nom || 'Nom du compte'}</p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">{typeSelectionne?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Banque :</span>
                      <span className="font-medium truncate max-w-[140px]">{formData.banque || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">N° compte :</span>
                      <span className="font-mono text-xs truncate max-w-[140px]">{formData.numero_compte || '—'}</span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Solde :</span>
                      <span className="font-mono font-bold">
                        {formData.solde_actuel
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.solde_actuel)) + ' GNF'
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

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Pour les comptes Mobile Money, indiquez l'opérateur (Orange Money, MTN...) dans le champ <strong>Banque</strong>.
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
            <button type="button" onClick={() => navigate('/comptes-bancaires')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le compte'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompteBancaireForm;