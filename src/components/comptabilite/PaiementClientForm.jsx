// components/comptabilite/PaiementClientForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, CreditCard, Eye, Info, User, FileText, DollarSign,
  Calendar, Banknote, Wallet, Smartphone, Upload, X,
  AlertTriangle, Percent
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MODES = [
  { value: 'especes',      label: 'Espèces',      icon: Banknote,     color: 'success' },
  { value: 'virement',     label: 'Virement',     icon: Wallet,       color: 'info' },
  { value: 'cheque',       label: 'Chèque',       icon: FileText,     color: 'warning' },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone,   color: 'primary' },
  { value: 'prelevement',  label: 'Prélèvement',  icon: CreditCard,   color: 'secondary' },
];

const PaiementClientForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const paiementId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    client: '',
    facture: '',
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    mode: 'especes',
    reference: '',
    notes: '',
    statut: 'valide',
  });

  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargementFactures, setChargementFactures] = useState(false);
  const [justificatif, setJustificatif] = useState(null);

  // Chargement
  useEffect(() => {
    chargerClients();
    if (estEdition && paiementId) {
      chargerPaiement(paiementId);
    } else {
      const clientParam = searchParams.get('client');
      if (clientParam) setFormData(prev => ({ ...prev, client: clientParam }));
    }
  }, [id]);

  useEffect(() => {
    if (formData.client) {
      chargerFacturesImpayees(formData.client);
    } else {
      setFactures([]);
    }
  }, [formData.client]);

  const chargerClients = async () => {
    try {
      const res = await AxiosInstance.get('/clients/');
      setClients(res.data.results || res.data || []);
    } catch (err) { console.error(err); }
  };

  const chargerFacturesImpayees = async (clientId) => {
    setChargementFactures(true);
    try {
      // Factures avec solde restant > 0
      const res = await AxiosInstance.get(`/factures/?client=${clientId}`);
      const data = res.data.results || res.data || [];
      // Filtrer celles avec solde > 0
      const impayees = data.filter(f =>
        ['emise', 'envoyee', 'partiellement_payee', 'en_retard'].includes(f.statut) &&
        Number(f.solde_restant || 0) > 0
      );
      setFactures(impayees);
    } catch (err) {
      setFactures([]);
    } finally {
      setChargementFactures(false);
    }
  };

  const chargerPaiement = async (pid) => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/paiements-clients/${pid}/`);
      const data = res.data;
      setFormData({
        numero: data.numero || '',
        client: data.client || '',
        facture: data.facture || '',
        montant: data.montant || '',
        date_paiement: data.date_paiement || '',
        mode: data.mode || 'especes',
        reference: data.reference || '',
        notes: data.notes || '',
        statut: data.statut || 'valide',
      });
    } catch (err) {
      setErreur('Impossible de charger le paiement');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFactureChange = (e) => {
    const factureId = e.target.value;
    setFormData(prev => ({ ...prev, facture: factureId }));

    if (factureId) {
      const facture = factures.find(f => String(f.id) === String(factureId));
      if (facture && !formData.montant) {
        setFormData(prev => ({
          ...prev,
          montant: facture.solde_restant || facture.montant_ttc,
        }));
      }
    }
  };

  const handleFichierChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErreur('Fichier trop volumineux (max 10 Mo)');
        return;
      }
      setJustificatif(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    // Validation métier
    if (!formData.facture) {
      setErreur('Sélectionnez une facture');
      setChargement(false);
      return;
    }

    const facture = factures.find(f => String(f.id) === String(formData.facture));
    if (facture && Number(formData.montant) > Number(facture.solde_restant) + 0.01) {
      setErreur(`Le montant dépasse le solde restant (${formaterMontant(facture.solde_restant)})`);
      setChargement(false);
      return;
    }

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (key === 'reference') delete dataToSend[key];
          else if (key === 'notes') delete dataToSend[key];
        }
      });

      let payload = dataToSend;
      if (justificatif) {
        payload = new FormData();
        Object.entries(dataToSend).forEach(([key, value]) => {
          if (value !== null && value !== undefined) payload.append(key, value);
        });
        payload.append('justificatif', justificatif);
      }

      const config = justificatif
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      if (estEdition) {
        await AxiosInstance.patch(`/paiements-clients/${paiementId}/`, payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/paiements-clients/${paiementId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/paiements-clients/', payload, config);
        setSucces(true);
        setTimeout(() => navigate(`/paiements-clients/${res.data.id}`), 1200);
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

  // Helpers
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const clientSelectionne = clients.find(c => String(c.id) === String(formData.client));
  const factureSelectionnee = factures.find(f => String(f.id) === String(formData.facture));
  const modeSelectionne = MODES.find(m => m.value === formData.mode);
  const ModeIcon = modeSelectionne?.icon || CreditCard;

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate(estEdition ? `/paiements-clients/${paiementId}` : '/paiements-clients')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <CreditCard className="w-3 h-3" />
              Comptabilité / Paiements / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouveau paiement'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Paiement {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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

            {/* Client & Facture */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Client & Facture</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Client <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="client"
                      className="select select-bordered w-full"
                      value={formData.client}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Sélectionner un client —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `[${c.code}] ` : ''}{c.nom_complet || c.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Facture à régler <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="facture"
                      className="select select-bordered w-full"
                      value={formData.facture}
                      onChange={handleFactureChange}
                      required
                      disabled={!formData.client || chargementFactures}
                    >
                      <option value="">
                        {chargementFactures
                          ? 'Chargement...'
                          : !formData.client
                            ? '— Sélectionnez d\'abord un client —'
                            : factures.length === 0
                              ? '— Aucune facture impayée —'
                              : '— Sélectionner une facture —'}
                      </option>
                      {factures.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.numero} — Reste : {new Intl.NumberFormat('fr-FR').format(Number(f.solde_restant))} GNF
                        </option>
                      ))}
                    </select>
                    {factures.length === 0 && formData.client && !chargementFactures && (
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-warning flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Ce client n'a aucune facture impayée
                        </span>
                      </label>
                    )}
                  </div>

                  {factureSelectionnee && (
                    <div className="bg-info/5 border border-info/20 rounded-lg p-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-base-content/60">Montant TTC facture :</span>
                        <span className="font-mono font-bold">
                          {formaterMontant(factureSelectionnee.montant_ttc)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-base-content/60">Déjà payé :</span>
                        <span className="font-mono font-bold text-success">
                          {formaterMontant(factureSelectionnee.montant_paye)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold border-t border-info/20 pt-1 mt-1">
                        <span>Solde restant :</span>
                        <span className="font-mono text-error">
                          {formaterMontant(factureSelectionnee.solde_restant)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Montant & Date */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Montant & Date</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Montant payé <span className="text-error">*</span>
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
                          max={factureSelectionnee?.solde_restant || undefined}
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date du paiement <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_paiement"
                        className="input input-bordered w-full"
                        value={formData.date_paiement}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <ModeIcon className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Mode de paiement</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {MODES.map(m => {
                      const Icon = m.icon;
                      const isSelected = formData.mode === m.value;
                      return (
                        <button
                          type="button"
                          key={m.value}
                          onClick={() => setFormData(prev => ({ ...prev, mode: m.value }))}
                          className={`btn btn-sm h-auto flex-col py-3 gap-1 ${
                            isSelected ? `btn-${m.color}` : 'btn-outline'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold leading-tight text-center">
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Référence</span>
                    </label>
                    <input
                      type="text"
                      name="reference"
                      className="input input-bordered w-full"
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="N° chèque, N° virement, N° transaction..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Justificatif & Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Justificatif & Notes</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Justificatif (PDF, image)</span>
                    </label>
                    {justificatif ? (
                      <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{justificatif.name}</p>
                          <p className="text-xs text-base-content/50">
                            {(justificatif.size / 1024).toFixed(0)} Ko
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setJustificatif(null)}
                          className="btn btn-ghost btn-sm btn-square text-error"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-primary">
                        <Upload className="w-8 h-8 text-base-content/30" />
                        <p className="text-sm">Cliquer pour joindre un justificatif</p>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFichierChange}
                        />
                      </label>
                    )}
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
                      placeholder="Notes sur ce paiement..."
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
                    <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                      <ModeIcon className="w-6 h-6 text-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.numero || 'PAI-...'}
                      </p>
                      <p className="text-xs font-medium text-base-content/70 mt-0.5">
                        {modeSelectionne?.label}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="text-center mb-3">
                    <p className="text-xs text-base-content/50 uppercase">Montant</p>
                    <p className="text-2xl font-bold font-mono text-success">
                      {formaterMontant(formData.montant)}
                    </p>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Client :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {clientSelectionne?.nom_complet || clientSelectionne?.nom || '—'}
                      </span>
                    </div>
                    {factureSelectionnee && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Facture :</span>
                        <span className="font-mono font-medium">
                          {factureSelectionnee.numero}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Date :</span>
                      <span className="font-medium font-mono">
                        {formData.date_paiement ? new Date(formData.date_paiement).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Règles métier</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li>• Le montant ne peut pas dépasser le <strong>solde restant</strong></li>
                      <li>• Si le montant = solde → facture <strong>payée</strong></li>
                      <li>• Si montant partiel → facture <strong>partiellement payée</strong></li>
                      <li>• Seules les factures <strong>impayées</strong> apparaissent</li>
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
            <button
              type="button"
              onClick={() => navigate(estEdition ? `/paiements-clients/${paiementId}` : '/paiements-clients')}
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Enregistrer le paiement'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaiementClientForm;