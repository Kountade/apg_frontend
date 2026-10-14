// components/tresorerie/DecaissementForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, ArrowUpRight, Wallet, Eye, Info, DollarSign,
  User, Hash, Calendar, FileText, RefreshCw, Banknote,
  Landmark, CreditCard, Building2, Users, Truck, Fuel
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_DECAISSEMENT = [
  { value: 'paiement_salaire', label: 'Paiement salaire', icon: Users },
  { value: 'paiement_fournisseur', label: 'Paiement fournisseur', icon: Building2 },
  { value: 'carburant', label: 'Carburant', icon: Fuel },
  { value: 'entretien', label: 'Entretien', icon: Truck },
  { value: 'achat', label: 'Achat', icon: Building2 },
  { value: 'transport', label: 'Transport', icon: Truck },
  { value: 'charge', label: 'Charge', icon: DollarSign },
  { value: 'avance', label: 'Avance', icon: User },
  { value: 'depense_diverse', label: 'Dépense diverse', icon: DollarSign },
  { value: 'autre', label: 'Autre', icon: FileText },
];

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces', icon: Banknote },
  { value: 'virement', label: 'Virement', icon: Landmark },
  { value: 'cheque', label: 'Chèque', icon: CreditCard },
  { value: 'mobile_money', label: 'Mobile Money', icon: Wallet },
  { value: 'prelevement', label: 'Prélèvement', icon: CreditCard },
  { value: 'carte', label: 'Carte bancaire', icon: CreditCard },
];

const formatMontant = (m) => {
  if (!m && m !== 0) return '0 GNF';
  return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
};

const DecaissementForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const decaissementId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    type: 'paiement_fournisseur',
    date_paiement: '',
    montant: '',
    mode_paiement: 'especes',
    beneficiaire: '',
    fournisseur_reference: '',
    caisse: '',
    compte_bancaire: '',
    motif: '',
    reference: '',
    statut: 'en_attente',
  });

  const [numeroModifieManuellement, setNumeroModifieManuellement] = useState(false);
  const [caisses, setCaisses] = useState([]);
  const [comptesBancaires, setComptesBancaires] = useState([]);

  useEffect(() => {
    chargerDonneesReference();
    if (estEdition && decaissementId) {
      chargerDecaissement(decaissementId);
    } else {
      chargerProchainNumero();
      const caisseParam = searchParams.get('caisse');
      const compteParam = searchParams.get('compte');
      if (caisseParam) setFormData(prev => ({ ...prev, caisse: caisseParam }));
      if (compteParam) setFormData(prev => ({ ...prev, compte_bancaire: compteParam }));
    }
  }, [id]);

  const chargerProchainNumero = async () => {
    setChargementNumero(true);
    try {
      const res = await AxiosInstance.get('/decaissements/prochain_numero/');
      if (res.data?.numero) {
        setFormData(prev => ({ ...prev, numero: res.data.numero }));
        setNumeroModifieManuellement(false);
      }
    } catch (err) {
      const year = new Date().getFullYear();
      setFormData(prev => ({ ...prev, numero: `DEC-${year}-000001` }));
    } finally {
      setChargementNumero(false);
    }
  };

  const chargerDonneesReference = async () => {
    try {
      const [caissesRes, comptesRes] = await Promise.all([
        AxiosInstance.get('/caisses/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-bancaires/').catch(() => ({ data: [] })),
      ]);
      setCaisses(caissesRes.data.results || caissesRes.data || []);
      setComptesBancaires(comptesRes.data.results || comptesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerDecaissement = async (did) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/decaissements/${did}/`);
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        type: data.type || 'paiement_fournisseur',
        date_paiement: data.date_paiement || '',
        montant: data.montant || '',
        mode_paiement: data.mode_paiement || 'especes',
        beneficiaire: data.beneficiaire || '',
        fournisseur_reference: data.fournisseur_reference || '',
        caisse: data.caisse || '',
        compte_bancaire: data.compte_bancaire || '',
        motif: data.motif || '',
        reference: data.reference || '',
        statut: data.statut || 'en_attente',
      });
      setNumeroModifieManuellement(true);
    } catch (err) {
      setErreur('Impossible de charger le décaissement');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'numero') setNumeroModifieManuellement(true);
  };

  const regenererNumero = async () => {
    setNumeroModifieManuellement(false);
    await chargerProchainNumero();
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
          if (['caisse', 'compte_bancaire'].includes(key)) dataToSend[key] = null;
          else if (key === 'montant') dataToSend[key] = 0;
          else if (key === 'numero') { /* garder */ }
          else delete dataToSend[key];
        }
      });

      if (!dataToSend.numero) delete dataToSend.numero;

      if (estEdition) {
        await AxiosInstance.patch(`/decaissements/${decaissementId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/decaissements/${decaissementId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/decaissements/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/decaissements/${res.data.id}`), 1200);
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

  const typeSelectionne = TYPES_DECAISSEMENT.find(t => t.value === formData.type);
  const TypeIcon = typeSelectionne?.icon || ArrowUpRight;
  const modeSelectionne = MODES_PAIEMENT.find(m => m.value === formData.mode_paiement);
  const ModeIcon = modeSelectionne?.icon || Banknote;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/decaissements')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Wallet className="w-3 h-3" />
              Trésorerie / Décaissements / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouveau décaissement'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Décaissement {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
                  <ArrowUpRight className="w-4 h-4 text-error" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Numéro <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="numero"
                          className="input input-bordered join-item w-full font-mono"
                          value={formData.numero}
                          onChange={handleChange}
                          required
                          placeholder="DEC-2026-000001"
                        />
                        <button
                          type="button"
                          onClick={regenererNumero}
                          className="btn btn-outline join-item gap-2"
                          disabled={chargementNumero}
                        >
                          {chargementNumero ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Auto
                        </button>
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date de paiement</span>
                      </label>
                      <input
                        type="date"
                        name="date_paiement"
                        className="input input-bordered w-full"
                        value={formData.date_paiement}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Type de décaissement <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {TYPES_DECAISSEMENT.map((t) => {
                        const IconType = t.icon;
                        const isSelected = formData.type === t.value;
                        return (
                          <button
                            type="button"
                            key={t.value}
                            onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                            className={`btn btn-xs h-auto flex-col py-2.5 gap-1 ${
                              isSelected ? 'btn-error' : 'btn-outline'
                            }`}
                          >
                            <IconType className="w-4 h-4" />
                            <span className="text-[10px] leading-tight text-center">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Montant & Mode */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-error" />
                  <h2 className="font-semibold text-sm">Montant & Mode de paiement</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Montant <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                        GNF
                      </span>
                      <input
                        type="number"
                        name="montant"
                        className="input input-bordered w-full pl-14 font-mono text-lg"
                        value={formData.montant}
                        onChange={handleChange}
                        required
                        min="0"
                        step="100"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Mode de paiement <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {MODES_PAIEMENT.map((m) => {
                        const IconMode = m.icon;
                        const isSelected = formData.mode_paiement === m.value;
                        return (
                          <button
                            type="button"
                            key={m.value}
                            onClick={() => setFormData(prev => ({ ...prev, mode_paiement: m.value }))}
                            className={`btn btn-sm h-auto flex-col py-2.5 gap-1 ${
                              isSelected ? 'btn-error' : 'btn-outline'
                            }`}
                          >
                            <IconMode className="w-4 h-4" />
                            <span className="text-xs">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bénéficiaire */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Bénéficiaire</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Bénéficiaire <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="beneficiaire"
                      className="input input-bordered w-full"
                      value={formData.beneficiaire}
                      onChange={handleChange}
                      required
                      placeholder="Nom du bénéficiaire"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Référence fournisseur</span>
                    </label>
                    <input
                      type="text"
                      name="fournisseur_reference"
                      className="input input-bordered w-full font-mono"
                      value={formData.fournisseur_reference}
                      onChange={handleChange}
                      placeholder="Réf. fournisseur"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Source des fonds */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Source des fonds</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-base-content/40" />
                          Caisse
                        </span>
                      </label>
                      <select
                        name="caisse"
                        className="select select-bordered w-full"
                        value={formData.caisse}
                        onChange={handleChange}
                      >
                        <option value="">— Aucune caisse —</option>
                        {caisses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.code} — {c.nom} ({formatMontant(c.solde_theorique)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-base-content/40" />
                          Compte bancaire
                        </span>
                      </label>
                      <select
                        name="compte_bancaire"
                        className="select select-bordered w-full"
                        value={formData.compte_bancaire}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun compte —</option>
                        {comptesBancaires.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.code} — {c.nom} ({formatMontant(c.solde_actuel)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motif */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Motif & Référence</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Motif <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      name="motif"
                      className="textarea textarea-bordered w-full"
                      value={formData.motif}
                      onChange={handleChange}
                      required
                      rows="3"
                      placeholder="Motif du décaissement..."
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Référence</span>
                    </label>
                    <input
                      type="text"
                      name="reference"
                      className="input input-bordered w-full font-mono"
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="N° bon, facture, reçu..."
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-error/5 to-error/10 border border-error/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-error" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-error/20 flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-error" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">{formData.numero || 'DEC-...'}</p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {typeSelectionne?.label || 'Type'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Bénéficiaire :</span>
                      <span className="font-medium truncate max-w-[140px]">{formData.beneficiaire || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Mode :</span>
                      <span className="font-medium">{modeSelectionne?.label}</span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/60">Montant :</span>
                      <span className="font-mono font-bold text-lg text-error">
                        -{formData.montant
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.montant)) + ' GNF'
                          : '0 GNF'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className="badge badge-warning badge-sm">
                    {formData.statut}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Workflow de validation</p>
                    <p className="text-base-content/70">
                      <strong>En attente</strong> → Validation responsable
                      <br /><strong>Validé</strong> → En attente de paiement
                      <br /><strong>Payé</strong> → Solde de la caisse mis à jour
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
            <button type="button" onClick={() => navigate('/decaissements')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-error gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le décaissement'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DecaissementForm;