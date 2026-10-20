// components/comptabilite/AvoirForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, FileMinus, Eye, Info, Hash, Calculator,
  User, FileText, DollarSign, Percent, RefreshCw, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const AvoirForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const avoirId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    client: '',
    facture_origine: '',
    objet: '',
    motif: '',
    montant_ht: '',
    taux_tva: 0,
    statut: 'brouillon',
    notes: '',
  });

  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargementFactures, setChargementFactures] = useState(false);

  // ------------------------------------------------------------
  // Chargement initial
  // ------------------------------------------------------------
  useEffect(() => {
    chargerClients();
    if (estEdition && avoirId) {
      chargerAvoir(avoirId);
    } else {
      const clientParam = searchParams.get('client');
      if (clientParam) setFormData(prev => ({ ...prev, client: clientParam }));
    }
  }, [id]);

  // Recharger les factures quand le client change
  useEffect(() => {
    if (formData.client) {
      chargerFacturesClient(formData.client);
    } else {
      setFactures([]);
    }
  }, [formData.client]);

  const chargerClients = async () => {
    try {
      const res = await AxiosInstance.get('/clients/');
      setClients(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur clients:', err);
    }
  };

  const chargerFacturesClient = async (clientId) => {
    setChargementFactures(true);
    try {
      const res = await AxiosInstance.get(`/factures/?client=${clientId}`);
      setFactures(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur factures:', err);
      setFactures([]);
    } finally {
      setChargementFactures(false);
    }
  };

  const chargerAvoir = async (aid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/avoirs/${aid}/`);
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        client: data.client || '',
        facture_origine: data.facture_origine || '',
        objet: data.objet || '',
        motif: data.motif || '',
        montant_ht: data.montant_ht || '',
        taux_tva: data.taux_tva || 0,
        statut: data.statut || 'brouillon',
        notes: data.notes || '',
      });
    } catch (err) {
      setErreur("Impossible de charger l'avoir");
    } finally {
      setChargementInitial(false);
    }
  };

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFactureChange = (e) => {
    const factureId = e.target.value;
    setFormData(prev => ({ ...prev, facture_origine: factureId }));

    if (factureId) {
      const facture = factures.find(f => String(f.id) === String(factureId));
      if (facture) {
        setFormData(prev => ({
          ...prev,
          objet: prev.objet || facture.objet || '',
          montant_ht: prev.montant_ht || facture.montant_ht || '',
          taux_tva: prev.taux_tva || facture.taux_tva || 0,
        }));
      }
    }
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
          if (['client', 'facture_origine'].includes(key)) dataToSend[key] = null;
          else if (['montant_ht', 'taux_tva'].includes(key)) dataToSend[key] = 0;
          else delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/avoirs/${avoirId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/avoirs/${avoirId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/avoirs/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/avoirs/${res.data.id}`), 1200);
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

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const clientSelectionne = clients.find(c => String(c.id) === String(formData.client));
  const factureSelectionnee = factures.find(f => String(f.id) === String(formData.facture_origine));

  const montantTVA = Number(formData.montant_ht || 0) * (Number(formData.taux_tva || 0) / 100);
  const montantTTC = Number(formData.montant_ht || 0) + montantTVA;

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

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
            onClick={() => navigate(estEdition ? `/avoirs/${avoirId}` : '/avoirs')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <FileMinus className="w-3 h-3" />
              Comptabilité / Avoirs / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouvel avoir'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Avoir {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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

          {/* COLONNE PRINCIPALE */}
          <div className="lg:col-span-2 space-y-6">

            {/* Client & Facture d'origine */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Client & Facture d'origine</h2>
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
                        Facture d'origine (optionnel)
                      </span>
                    </label>
                    <select
                      name="facture_origine"
                      className="select select-bordered w-full"
                      value={formData.facture_origine}
                      onChange={handleFactureChange}
                      disabled={!formData.client || chargementFactures}
                    >
                      <option value="">
                        {chargementFactures
                          ? 'Chargement des factures...'
                          : formData.client
                            ? '— Aucune facture liée —'
                            : '— Sélectionnez d\'abord un client —'}
                      </option>
                      {factures.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.numero} — {new Intl.NumberFormat('fr-FR').format(Number(f.montant_ttc))} GNF
                          ({f.statut_display || f.statut})
                        </option>
                      ))}
                    </select>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-base-content/50">
                        Lier l'avoir à une facture (facultatif)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Motif & Objet */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Motif & Objet</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Objet <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="objet"
                      className="input input-bordered w-full"
                      value={formData.objet}
                      onChange={handleChange}
                      required
                      placeholder="Ex : Remboursement facture partiellement contestée"
                      maxLength="300"
                    />
                  </div>

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
                      rows="3"
                      required
                      placeholder="Raison de l'émission de l'avoir..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Montants */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Montant de l'avoir</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Montant HT <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="montant_ht"
                          className="input input-bordered w-full pl-14 font-mono"
                          value={formData.montant_ht}
                          onChange={handleChange}
                          required
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">TVA (%)</span>
                      </label>
                      <div className="relative">
                        <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                        <input
                          type="number"
                          name="taux_tva"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.taux_tva}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calcul auto */}
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Montant HT</span>
                        <span className="font-mono font-bold">{formaterMontant(formData.montant_ht)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-base-content/70">TVA ({formData.taux_tva}%)</span>
                        <span className="font-mono font-bold">{formaterMontant(montantTVA)}</span>
                      </div>
                      <div className="divider my-2"></div>
                      <div className="flex justify-between">
                        <span className="font-bold">Montant TTC</span>
                        <span className="font-mono font-bold text-success text-lg">
                          {formaterMontant(montantTTC)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut & Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Statut & Notes</h2>
                </div>
                <div className="p-5 space-y-5">
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
                      <option value="brouillon">Brouillon</option>
                      <option value="emis">Émis</option>
                      <option value="utilise">Utilisé</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Notes internes</span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Notes optionnelles..."
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
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <FileMinus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.numero || 'AVR-...'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.objet || 'Objet de l\'avoir'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Client :</span>
                      <span className="font-medium truncate ml-2">
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
                      <span className="text-base-content/60">Montant TTC :</span>
                      <span className="font-mono font-bold text-success">
                        {formaterMontant(montantTTC)}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-sm ${
                    formData.statut === 'emis' ? 'badge-info' :
                    formData.statut === 'utilise' ? 'badge-success' :
                    formData.statut === 'annule' ? 'badge-error' : 'badge-ghost'
                  }`}>
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
                    <p className="font-medium text-info mb-1">À savoir</p>
                    <p className="text-base-content/70">
                      Un avoir est un document comptable qui <strong>annule partiellement ou totalement</strong> une facture.
                      Il peut être lié à une facture d'origine pour traçabilité.
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
              onClick={() => navigate(estEdition ? `/avoirs/${avoirId}` : '/avoirs')}
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
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : "Créer l'avoir"}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AvoirForm;