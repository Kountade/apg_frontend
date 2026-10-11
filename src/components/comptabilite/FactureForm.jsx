// components/comptabilite/FactureForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Receipt, Calendar, DollarSign, User, Hash,
  RefreshCw, Lock, FileText, Trash2, Calculator,
  Percent, Eye, Info, ListPlus, Building2
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const FactureForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const factureId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    type: 'definitive',
    client: '',
    contrat: '',
    date_echeance: '',
    periode_debut: '',
    periode_fin: '',
    montant_ht: '',
    taux_tva: 0,
    remise: 0,
    objet: '',
    notes: '',
    conditions_paiement: '',
    statut: 'brouillon',
  });

  const [numeroModifieManuellement, setNumeroModifieManuellement] = useState(false);
  const [clients, setClients] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [etablissement, setEtablissement] = useState(null);

  useEffect(() => {
    chargerEtablissement();
    chargerClients();
    if (estEdition && factureId) {
      chargerFacture(factureId);
    } else {
      chargerProchainNumero();
      const clientParam = searchParams.get('client');
      if (clientParam) setFormData(prev => ({ ...prev, client: clientParam }));
      const dateEcheance = new Date();
      dateEcheance.setDate(dateEcheance.getDate() + 30);
      setFormData(prev => ({ ...prev, date_echeance: dateEcheance.toISOString().split('T')[0] }));
    }
  }, [id]);

  useEffect(() => {
    if (formData.client) {
      chargerContratsClient(formData.client);
    }
  }, [formData.client]);

  const chargerEtablissement = async () => {
    try {
      const res = await AxiosInstance.get('/etablissements/unique/');
      if (res.data) {
        setEtablissement(res.data);
      }
    } catch (err) {
      console.warn('Établissement non chargé, utilisation de la valeur par défaut APG');
      setEtablissement({ nom: 'APG ASSAINISSEMENT', sigle: 'APG' });
    }
  };

  const chargerProchainNumero = async () => {
    setChargementNumero(true);
    try {
      const res = await AxiosInstance.get('/factures/prochain_numero/');
      if (res.data?.numero) {
        setFormData(prev => ({ ...prev, numero: res.data.numero }));
        setNumeroModifieManuellement(false);
      }
    } catch (err) {
      console.warn('Endpoint prochain_numero indisponible');
      const year = new Date().getFullYear();
      setFormData(prev => ({ ...prev, numero: `FACT-${year}-000001` }));
    } finally {
      setChargementNumero(false);
    }
  };

  const chargerClients = async () => {
    try {
      const res = await AxiosInstance.get('/clients/');
      setClients(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerContratsClient = async (clientId) => {
    try {
      const res = await AxiosInstance.get(`/clients/${clientId}/contrats/`);
      setContrats(res.data.results || res.data || []);
    } catch (err) {
      setContrats([]);
    }
  };

  const chargerFacture = async (fid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/factures/${fid}/`);
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        type: data.type || 'definitive',
        client: data.client || '',
        contrat: data.contrat || '',
        date_echeance: data.date_echeance || '',
        periode_debut: data.periode_debut || '',
        periode_fin: data.periode_fin || '',
        montant_ht: data.montant_ht || '',
        taux_tva: data.taux_tva || 0,
        remise: data.remise || 0,
        objet: data.objet || '',
        notes: data.notes || '',
        conditions_paiement: data.conditions_paiement || '',
        statut: data.statut || 'brouillon',
      });
      setLignes(data.lignes || []);
      setNumeroModifieManuellement(true);
    } catch (err) {
      setErreur('Impossible de charger la facture');
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

  // ============================================================
  // Gestion des lignes
  // ============================================================
  const ajouterLigne = () => {
    setLignes([...lignes, {
      designation: '',
      description: '',
      quantite: 1,
      unite: '',
      prix_unitaire: 0,
      remise_ligne: 0,
      montant_ht: 0,
    }]);
  };

  const supprimerLigne = (index) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const modifierLigne = (index, field, value) => {
    const nouvellesLignes = [...lignes];
    nouvellesLignes[index] = { ...nouvellesLignes[index], [field]: value };
    const ligne = nouvellesLignes[index];
    const qte = parseFloat(ligne.quantite) || 0;
    const prix = parseFloat(ligne.prix_unitaire) || 0;
    const remise = parseFloat(ligne.remise_ligne) || 0;
    ligne.montant_ht = (qte * prix) - remise;
    setLignes(nouvellesLignes);
  };

  const totalHTLignes = lignes.reduce((sum, l) => sum + (parseFloat(l.montant_ht) || 0), 0);
  const montantHT = lignes.length > 0 ? totalHTLignes : (parseFloat(formData.montant_ht) || 0);
  const montantTVA = montantHT * (parseFloat(formData.taux_tva) || 0) / 100;
  const montantTTC = montantHT + montantTVA - (parseFloat(formData.remise) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      dataToSend.montant_ht = montantHT;

      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (['client', 'contrat'].includes(key)) dataToSend[key] = null;
          else if (['taux_tva', 'remise'].includes(key)) dataToSend[key] = 0;
          else if (key === 'numero') { /* garder */ }
          else delete dataToSend[key];
        }
      });

      if (!dataToSend.numero) {
        delete dataToSend.numero;
      }

      let factureCreee;
      if (estEdition) {
        const res = await AxiosInstance.patch(`/factures/${factureId}/`, dataToSend);
        factureCreee = res.data;
      } else {
        const res = await AxiosInstance.post('/factures/', dataToSend);
        factureCreee = res.data;
      }

      setSucces(true);
      setTimeout(() => navigate(`/factures/${factureCreee.id || factureId}`), 1200);
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

  const clientSelectionne = clients.find(c => String(c.id) === String(formData.client));

  // ✅ Nom de l'entreprise (APG par défaut)
  const nomEntreprise = etablissement?.nom || 'APG ASSAINISSEMENT';
  const sigleEntreprise = etablissement?.sigle || 'APG';

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/factures')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Comptabilité / Factures / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouvelle facture'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Facture {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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

            {/* NUMÉRO */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Numéro de facture</h2>
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
                          placeholder="FACT-2026-000001"
                        />
                        <button
                          type="button"
                          onClick={regenererNumero}
                          className="btn btn-outline join-item gap-2"
                          disabled={chargementNumero}
                        >
                          {chargementNumero ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Auto
                        </button>
                      </div>
                      {numeroModifieManuellement && !estEdition && (
                        <label className="label py-0 pt-1">
                          <span className="label-text-alt text-warning flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            Numéro modifié manuellement
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Type <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="definitive">Définitive</option>
                        <option value="proforma">Pro-forma</option>
                        <option value="avoir">Avoir</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CLIENT */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Client & Contrat</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        <span className="label-text text-sm font-medium">Contrat lié</span>
                      </label>
                      <select
                        name="contrat"
                        className="select select-bordered w-full"
                        value={formData.contrat}
                        onChange={handleChange}
                        disabled={!formData.client}
                      >
                        <option value="">— Aucun contrat —</option>
                        {contrats.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.numero} — {c.prestation}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-base-content/40" />
                        Objet
                      </span>
                    </label>
                    <input
                      type="text"
                      name="objet"
                      className="input input-bordered w-full"
                      value={formData.objet}
                      onChange={handleChange}
                      placeholder="Collecte des déchets - Janvier 2026"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* LIGNES DE FACTURE */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Lignes de facture</h2>
                  <button
                    type="button"
                    onClick={ajouterLigne}
                    className="btn btn-xs btn-primary ml-auto gap-1"
                  >
                    <Plus className="w-3 h-3" /> Ajouter une ligne
                  </button>
                </div>

                <div className="p-5">
                  {lignes.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-base-300 rounded-lg">
                      <ListPlus className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
                      <p className="text-base-content/60 mb-3">Aucune ligne de facture</p>
                      <p className="text-xs text-base-content/40 mb-4">
                        Vous pouvez soit ajouter des lignes ci-dessous, soit saisir un montant HT total
                      </p>
                      <button
                        type="button"
                        onClick={ajouterLigne}
                        className="btn btn-sm btn-primary gap-2"
                      >
                        <Plus className="w-4 h-4" /> Ajouter une première ligne
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lignes.map((ligne, index) => (
                        <div key={index} className="p-4 rounded-lg border border-base-300 bg-base-200/30">
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-12 md:col-span-4">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Désignation</span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                value={ligne.designation}
                                onChange={(e) => modifierLigne(index, 'designation', e.target.value)}
                                placeholder="Collecte des déchets"
                              />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Quantité</span>
                              </label>
                              <input
                                type="number"
                                className="input input-bordered input-sm w-full"
                                value={ligne.quantite}
                                onChange={(e) => modifierLigne(index, 'quantite', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Prix unit. (GNF)</span>
                              </label>
                              <input
                                type="number"
                                className="input input-bordered input-sm w-full"
                                value={ligne.prix_unitaire}
                                onChange={(e) => modifierLigne(index, 'prix_unitaire', e.target.value)}
                                min="0"
                                step="100"
                              />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Montant HT</span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered input-sm w-full bg-base-200 font-mono"
                                value={new Intl.NumberFormat('fr-FR').format(ligne.montant_ht || 0)}
                                readOnly
                              />
                            </div>
                            <div className="col-span-12 md:col-span-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => supprimerLigne(index)}
                                className="btn btn-ghost btn-sm text-error"
                                title="Supprimer la ligne"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TARIFICATION */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Tarification</h2>
                </div>
                <div className="p-5 space-y-5">
                  {lignes.length === 0 && (
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
                          className="input input-bordered w-full pl-14"
                          value={formData.montant_ht}
                          onChange={handleChange}
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">TVA (%)</span>
                      </label>
                      <div className="relative">
                        <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                        <input
                          type="number"
                          name="taux_tva"
                          className="input input-bordered w-full pl-10"
                          value={formData.taux_tva}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Remise (GNF)</span>
                      </label>
                      <input
                        type="number"
                        name="remise"
                        className="input input-bordered w-full"
                        value={formData.remise}
                        onChange={handleChange}
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>

                  {/* Récapitulatif */}
                  <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Total HT :</span>
                      <span className="font-mono">{new Intl.NumberFormat('fr-FR').format(montantHT)} GNF</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">TVA ({formData.taux_tva}%) :</span>
                      <span className="font-mono">{new Intl.NumberFormat('fr-FR').format(montantTVA)} GNF</span>
                    </div>
                    {parseFloat(formData.remise) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Remise :</span>
                        <span className="font-mono text-error">-{new Intl.NumberFormat('fr-FR').format(formData.remise)} GNF</span>
                      </div>
                    )}
                    <div className="divider my-1"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total TTC :</span>
                      <span className="font-mono text-success">{new Intl.NumberFormat('fr-FR').format(montantTTC)} GNF</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DATES & CONDITIONS */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Dates & Conditions</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date d'échéance <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_echeance"
                        className="input input-bordered w-full"
                        value={formData.date_echeance}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Période du</span>
                      </label>
                      <input
                        type="date"
                        name="periode_debut"
                        className="input input-bordered w-full"
                        value={formData.periode_debut}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Période au</span>
                      </label>
                      <input
                        type="date"
                        name="periode_fin"
                        className="input input-bordered w-full"
                        value={formData.periode_fin}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Conditions de paiement</span>
                    </label>
                    <textarea
                      name="conditions_paiement"
                      className="textarea textarea-bordered w-full"
                      value={formData.conditions_paiement}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Paiement sous 30 jours..."
                    ></textarea>
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
                      placeholder="Notes non visibles par le client..."
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

                  {/* ✅ APG ASSAINISSEMENT */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-base-200">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-primary truncate">
                        {nomEntreprise}
                      </p>
                      <p className="text-[10px] text-base-content/50">
                        {sigleEntreprise}
                      </p>
                    </div>
                  </div>

                  <p className="font-mono text-xs text-base-content/50">
                    {formData.numero || 'FACT-2026-...'}
                  </p>
                  <p className="font-bold text-sm mt-1 truncate">
                    {clientSelectionne?.nom_complet || clientSelectionne?.nom || 'Client non sélectionné'}
                  </p>
                  <p className="text-xs text-base-content/50 truncate mt-0.5">
                    {formData.objet || 'Sans objet'}
                  </p>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Total HT :</span>
                      <span className="font-mono">{new Intl.NumberFormat('fr-FR').format(montantHT)} GNF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">TVA :</span>
                      <span className="font-mono">{new Intl.NumberFormat('fr-FR').format(montantTVA)} GNF</span>
                    </div>
                    <div className="divider my-1"></div>
                    <div className="flex justify-between font-bold">
                      <span>Total TTC :</span>
                      <span className="font-mono text-success">{new Intl.NumberFormat('fr-FR').format(montantTTC)} GNF</span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-sm ${
                    formData.statut === 'payee' ? 'badge-success' :
                    formData.statut === 'brouillon' ? 'badge-ghost' : 'badge-info'
                  }`}>
                    {formData.statut}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
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
                  <option value="emise">Émise</option>
                  <option value="envoyee">Envoyée</option>
                  <option value="partiellement_payee">Partiellement payée</option>
                  <option value="payee">Payée</option>
                  <option value="en_retard">En retard</option>
                  <option value="litige">Litige</option>
                  <option value="annulee">Annulée</option>
                </select>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Le numéro est généré automatiquement.
                      Vous pouvez soit <strong>ajouter des lignes</strong> détaillées,
                      soit saisir un <strong>montant HT</strong> global.
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
              onClick={() => navigate('/factures')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la facture'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FactureForm;