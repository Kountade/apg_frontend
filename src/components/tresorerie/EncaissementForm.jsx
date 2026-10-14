// components/tresorerie/EncaissementForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, ArrowDownRight, Wallet, Eye, Info, DollarSign,
  User, Hash, Calendar, FileText, RefreshCw, Banknote,
  Landmark, CreditCard, Users
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_ENCAISSEMENT = [
  { value: 'paiement_client', label: 'Paiement client' },
  { value: 'reglement_facture', label: 'Règlement facture' },
  { value: 'recette_diverse', label: 'Recette diverse' },
  { value: 'apport', label: 'Apport' },
  { value: 'financement', label: 'Financement' },
  { value: 'remboursement', label: 'Remboursement reçu' },
  { value: 'autre', label: 'Autre' },
];

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces', icon: Banknote },
  { value: 'virement', label: 'Virement', icon: Landmark },
  { value: 'cheque', label: 'Chèque', icon: CreditCard },
  { value: 'mobile_money', label: 'Mobile Money', icon: Wallet },
  { value: 'prelevement', label: 'Prélèvement', icon: CreditCard },
  { value: 'carte', label: 'Carte bancaire', icon: CreditCard },
];

const EncaissementForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const encaissementId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    type: 'paiement_client',
    date_encaissement: new Date().toISOString().split('T')[0],
    montant: '',
    mode_paiement: 'especes',
    client: '',
    facture_reference: '',
    origine: '',
    caisse: '',
    compte_bancaire: '',
    reference: '',
    motif: '',
    statut: 'en_attente',
  });

  const [numeroModifieManuellement, setNumeroModifieManuellement] = useState(false);
  const [clients, setClients] = useState([]);
  const [caisses, setCaisses] = useState([]);
  const [comptesBancaires, setComptesBancaires] = useState([]);

  useEffect(() => {
    chargerDonneesReference();
    if (estEdition && encaissementId) {
      chargerEncaissement(encaissementId);
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
      const res = await AxiosInstance.get('/encaissements/prochain_numero/');
      if (res.data?.numero) {
        setFormData(prev => ({ ...prev, numero: res.data.numero }));
        setNumeroModifieManuellement(false);
      }
    } catch (err) {
      const year = new Date().getFullYear();
      setFormData(prev => ({ ...prev, numero: `ENC-${year}-000001` }));
    } finally {
      setChargementNumero(false);
    }
  };

  const chargerDonneesReference = async () => {
    try {
      const [clientsRes, caissesRes, comptesRes] = await Promise.all([
        AxiosInstance.get('/clients/').catch(() => ({ data: [] })),
        AxiosInstance.get('/caisses/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-bancaires/').catch(() => ({ data: [] })),
      ]);
      setClients(clientsRes.data.results || clientsRes.data || []);
      setCaisses(caissesRes.data.results || caissesRes.data || []);
      setComptesBancaires(comptesRes.data.results || comptesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerEncaissement = async (eid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/encaissements/${eid}/`);
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        type: data.type || 'paiement_client',
        date_encaissement: data.date_encaissement || '',
        montant: data.montant || '',
        mode_paiement: data.mode_paiement || 'especes',
        client: data.client || '',
        facture_reference: data.facture_reference || '',
        origine: data.origine || '',
        caisse: data.caisse || '',
        compte_bancaire: data.compte_bancaire || '',
        reference: data.reference || '',
        motif: data.motif || '',
        statut: data.statut || 'en_attente',
      });
      setNumeroModifieManuellement(true);
    } catch (err) {
      setErreur('Impossible de charger l\'encaissement');
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
          if (['client', 'caisse', 'compte_bancaire'].includes(key)) dataToSend[key] = null;
          else if (key === 'montant') dataToSend[key] = 0;
          else if (key === 'numero') { /* garder */ }
          else delete dataToSend[key];
        }
      });

      if (!dataToSend.numero) delete dataToSend.numero;

      if (estEdition) {
        await AxiosInstance.patch(`/encaissements/${encaissementId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/encaissements/${encaissementId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/encaissements/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/encaissements/${res.data.id}`), 1200);
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

  const clientSelectionne = clients.find(c => String(c.id) === String(formData.client));
  const modeSelectionne = MODES_PAIEMENT.find(m => m.value === formData.mode_paiement);
  const ModeIcon = modeSelectionne?.icon || Banknote;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/encaissements')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Wallet className="w-3 h-3" />
              Trésorerie / Encaissements / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouvel encaissement'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Encaissement {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
                  <ArrowDownRight className="w-4 h-4 text-success" />
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
                          placeholder="ENC-2026-000001"
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
                        <span className="label-text text-sm font-medium">
                          Date <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_encaissement"
                        className="input input-bordered w-full"
                        value={formData.date_encaissement}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Type d'encaissement <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="type"
                      className="select select-bordered w-full"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      {TYPES_ENCAISSEMENT.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Montant & Mode */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
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
                              isSelected ? 'btn-success' : 'btn-outline'
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

            {/* Client & Destination */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Client & Destination</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Client</span>
                    </label>
                    <select
                      name="client"
                      className="select select-bordered w-full"
                      value={formData.client}
                      onChange={handleChange}
                    >
                      <option value="">— Aucun client —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `[${c.code}] ` : ''}{c.nom_complet || c.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Réf. facture</span>
                      </label>
                      <input
                        type="text"
                        name="facture_reference"
                        className="input input-bordered w-full font-mono"
                        value={formData.facture_reference}
                        onChange={handleChange}
                        placeholder="FACT-2026-000001"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Origine / Source</span>
                      </label>
                      <input
                        type="text"
                        name="origine"
                        className="input input-bordered w-full"
                        value={formData.origine}
                        onChange={handleChange}
                        placeholder="Ex: Vente diverse"
                      />
                    </div>
                  </div>

                  <div className="divider my-1"></div>

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
                          <option key={c.id} value={c.id}>{c.code} — {c.nom}</option>
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
                          <option key={c.id} value={c.id}>{c.code} — {c.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Référence & Motif */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Détails</h2>
                </div>
                <div className="p-5 space-y-5">
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
                      placeholder="N° de reçu, chèque..."
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Motif</span>
                    </label>
                    <textarea
                      name="motif"
                      className="textarea textarea-bordered w-full"
                      value={formData.motif}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Description de l'encaissement..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-success/5 to-success/10 border border-success/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-success" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                      <ModeIcon className="w-6 h-6 text-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">{formData.numero || 'ENC-...'}</p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {modeSelectionne?.label || 'Mode de paiement'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">
                        {TYPES_ENCAISSEMENT.find(t => t.value === formData.type)?.label || formData.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Client :</span>
                      <span className="font-medium truncate max-w-[140px]">
                        {clientSelectionne?.nom_complet || clientSelectionne?.nom || '—'}
                      </span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/60">Montant :</span>
                      <span className="font-mono font-bold text-lg text-success">
                        {formData.montant
                          ? '+' + new Intl.NumberFormat('fr-FR').format(Number(formData.montant)) + ' GNF'
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
                    <p className="font-medium text-info mb-1">Workflow</p>
                    <p className="text-base-content/70">
                      Nouvel encaissement → <strong>En attente</strong>
                      <br />Validation → <strong>Validé</strong> (met à jour le solde de la caisse)
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
            <button type="button" onClick={() => navigate('/encaissements')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-success gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer l\'encaissement'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EncaissementForm;