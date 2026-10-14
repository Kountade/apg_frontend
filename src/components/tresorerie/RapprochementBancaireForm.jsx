// components/tresorerie/RapprochementBancaireForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Eye, Info, Wallet,
  Landmark, Calendar, DollarSign, FileText, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, Upload
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MOIS_NOMS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

const RapprochementBancaireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const rapprochementId = estEdition ? id : null;

  const currentDate = new Date();

  const [formData, setFormData] = useState({
    compte_bancaire: '',
    mois: currentDate.getMonth() + 1,
    annee: currentDate.getFullYear(),
    solde_releve: '',
    solde_comptable: '',
    statut: 'en_cours',
    notes: '',
  });

  const [comptes, setComptes] = useState([]);
  const [releve, setReleve] = useState(null);

  useEffect(() => {
    chargerComptes();
    if (estEdition && rapprochementId) {
      chargerRapprochement(rapprochementId);
    }
  }, [id]);

  const chargerComptes = async () => {
    try {
      const res = await AxiosInstance.get('/comptes-bancaires/');
      setComptes(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerRapprochement = async (rid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/rapprochement-bancaire/${rid}/`);
      const data = response.data;
      setFormData({
        compte_bancaire: data.compte_bancaire || '',
        mois: data.mois || currentDate.getMonth() + 1,
        annee: data.annee || currentDate.getFullYear(),
        solde_releve: data.solde_releve || '',
        solde_comptable: data.solde_comptable || '',
        statut: data.statut || 'en_cours',
        notes: data.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le rapprochement');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setReleve(e.target.files[0]);
  };

  // Calcul écart automatique
  const ecart = (parseFloat(formData.solde_releve) || 0) - (parseFloat(formData.solde_comptable) || 0);
  const estEquilibre = Math.abs(ecart) < 0.01;

  // Pré-remplir solde comptable quand compte change
  useEffect(() => {
    if (!estEdition && formData.compte_bancaire) {
      const compte = comptes.find(c => String(c.id) === String(formData.compte_bancaire));
      if (compte && !formData.solde_comptable) {
        setFormData(prev => ({ ...prev, solde_comptable: compte.solde_actuel || 0 }));
      }
    }
  }, [formData.compte_bancaire, comptes, estEdition]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = {
        ...formData,
        solde_releve: parseFloat(formData.solde_releve) || 0,
        solde_comptable: parseFloat(formData.solde_comptable) || 0,
      };

      // Détermine statut automatiquement si pas en cours
      if (dataToSend.statut === 'en_cours') {
        dataToSend.statut = estEquilibre ? 'equilibre' : 'ecart';
      }

      if (estEdition) {
        await AxiosInstance.patch(`/rapprochement-bancaire/${rapprochementId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/rapprochement-bancaire'), 1200);
      } else {
        await AxiosInstance.post('/rapprochement-bancaire/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/rapprochement-bancaire'), 1200);
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

  const compteSelectionne = comptes.find(c => String(c.id) === String(formData.compte_bancaire));

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/rapprochement-bancaire')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Wallet className="w-3 h-3" />
              Trésorerie / Rapprochement bancaire / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? 'Modifier le rapprochement' : 'Nouveau rapprochement bancaire'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Rapprochement {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
                  <Landmark className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Compte bancaire <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="compte_bancaire"
                      className="select select-bordered w-full"
                      value={formData.compte_bancaire}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Sélectionner un compte —</option>
                      {comptes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.nom} ({c.banque || 'Sans banque'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Mois <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="mois"
                        className="select select-bordered w-full"
                        value={formData.mois}
                        onChange={handleChange}
                        required
                      >
                        {MOIS_NOMS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Année <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        name="annee"
                        className="input input-bordered w-full"
                        value={formData.annee}
                        onChange={handleChange}
                        required
                        min="2020"
                        max="2100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Soldes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Soldes à comparer</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Solde du relevé bancaire <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="solde_releve"
                          className="input input-bordered w-full pl-14 font-mono"
                          value={formData.solde_releve}
                          onChange={handleChange}
                          required
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          Solde figurant sur le relevé de la banque
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Solde comptable <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="solde_comptable"
                          className="input input-bordered w-full pl-14 font-mono"
                          value={formData.solde_comptable}
                          onChange={handleChange}
                          required
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          Solde selon votre comptabilité
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Calcul écart */}
                  <div className={`p-4 rounded-lg border-2 ${
                    estEquilibre ? 'border-success bg-success/5' : 'border-error bg-error/5'
                  }`}>
                    <div className="flex items-center gap-3">
                      {estEquilibre ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-success" />
                          <div>
                            <p className="font-bold text-success">Équilibré ✓</p>
                            <p className="text-xs text-base-content/60">
                              Aucun écart détecté entre les deux soldes
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-8 h-8 text-error" />
                          <div>
                            <p className="font-bold text-error">
                              Écart détecté
                            </p>
                            <p className="text-xs text-base-content/60">
                              Différence : <strong className={
                                ecart > 0 ? 'text-info' : 'text-error'
                              }>{formaterMontant(ecart)}</strong>
                              {ecart > 0
                                ? ' (relevé supérieur au comptable)'
                                : ' (comptable supérieur au relevé)'}
                            </p>
                          </div>
                        </>
                      )}
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
                  <h2 className="font-semibold text-sm">Notes & Justificatif</h2>
                </div>
                <div className="p-5 space-y-5">
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
                      placeholder="Justification de l'écart, remarques..."
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-base-content/40" />
                        Relevé bancaire (PDF)
                      </span>
                    </label>
                    <input
                      type="file"
                      className="file-input file-input-bordered w-full"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-base-content/50">
                        Formulaires acceptés : PDF, JPG, PNG
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className={`card shadow-sm border-2 ${
              estEquilibre
                ? 'bg-gradient-to-br from-success/5 to-success/10 border-success/30'
                : 'bg-gradient-to-br from-warning/5 to-warning/10 border-warning/30'
            }`}>
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Landmark className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-base-content/50">
                        {MOIS_NOMS[formData.mois - 1]?.label} {formData.annee}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {compteSelectionne?.nom || 'Compte non sélectionné'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Solde relevé :</span>
                      <span className="font-mono font-medium">
                        {formData.solde_releve
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.solde_releve)) + ' GNF'
                          : '0 GNF'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Solde comptable :</span>
                      <span className="font-mono font-medium">
                        {formData.solde_comptable
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.solde_comptable)) + ' GNF'
                          : '0 GNF'}
                      </span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/60">Écart :</span>
                      <span className={`font-mono font-bold text-lg ${
                        estEquilibre ? 'text-success' : ecart > 0 ? 'text-info' : 'text-error'
                      }`}>
                        {estEquilibre
                          ? '✓ 0'
                          : new Intl.NumberFormat('fr-FR').format(ecart) + ' GNF'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-sm ${
                    estEquilibre ? 'badge-success' : 'badge-error'
                  }`}>
                    {estEquilibre ? 'Équilibré' : 'Écart détecté'}
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
                      Le rapprochement bancaire permet de vérifier la concordance
                      entre le solde de votre comptabilité et celui du relevé bancaire.
                      <br />Un écart peut révéler des erreurs ou des opérations non enregistrées.
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
            <button type="button" onClick={() => navigate('/rapprochement-bancaire')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le rapprochement'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Helper local
const formaterMontant = (m) => {
  if (m === null || m === undefined) return '0 GNF';
  const num = Number(m);
  return (num >= 0 ? '' : '-') + new Intl.NumberFormat('fr-FR').format(Math.abs(num)) + ' GNF';
};

export default RapprochementBancaireForm;