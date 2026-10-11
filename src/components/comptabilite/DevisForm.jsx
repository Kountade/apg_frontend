// components/comptabilite/DevisForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, FileText, Calendar, DollarSign, User, Hash,
  RefreshCw, Trash2, Calculator, Percent, Eye, Info,
  ListPlus, Building2
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const DevisForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const devisId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    client: '',
    objet: '',
    date_validite: '',
    montant_ht: '',
    taux_tva: 0,
    statut: 'brouillon',
    notes: '',
  });

  const [numeroModifieManuellement, setNumeroModifieManuellement] = useState(false);
  const [clients, setClients] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [etablissement, setEtablissement] = useState(null);

  useEffect(() => {
    chargerEtablissement();
    chargerClients();
    if (estEdition && devisId) {
      chargerDevis(devisId);
    } else {
      chargerProchainNumero();
      const clientParam = searchParams.get('client');
      if (clientParam) setFormData(prev => ({ ...prev, client: clientParam }));
      const dateValidite = new Date();
      dateValidite.setDate(dateValidite.getDate() + 30);
      setFormData(prev => ({ ...prev, date_validite: dateValidite.toISOString().split('T')[0] }));
    }
  }, [id]);

  const chargerEtablissement = async () => {
    try {
      const res = await AxiosInstance.get('/etablissements/unique/');
      if (res.data) setEtablissement(res.data);
    } catch (err) {
      setEtablissement({ nom: 'APG ASSAINISSEMENT', sigle: 'APG' });
    }
  };

  const chargerProchainNumero = async () => {
    setChargementNumero(true);
    try {
      const res = await AxiosInstance.get('/devis/prochain_numero/');
      if (res.data?.numero) {
        setFormData(prev => ({ ...prev, numero: res.data.numero }));
        setNumeroModifieManuellement(false);
      }
    } catch (err) {
      const year = new Date().getFullYear();
      setFormData(prev => ({ ...prev, numero: `DEV-${year}-000001` }));
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

  const chargerDevis = async (did) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/devis/${did}/`);
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        client: data.client || '',
        objet: data.objet || '',
        date_validite: data.date_validite || '',
        montant_ht: data.montant_ht || '',
        taux_tva: data.taux_tva || 0,
        statut: data.statut || 'brouillon',
        notes: data.notes || '',
      });
      setLignes(data.lignes || []);
      setNumeroModifieManuellement(true);
    } catch (err) {
      setErreur('Impossible de charger le devis');
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

  const ajouterLigne = () => {
    setLignes([...lignes, {
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
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
    ligne.montant_ht = qte * prix;
    setLignes(nouvellesLignes);
  };

  const totalHTLignes = lignes.reduce((sum, l) => sum + (parseFloat(l.montant_ht) || 0), 0);
  const montantHT = lignes.length > 0 ? totalHTLignes : (parseFloat(formData.montant_ht) || 0);
  const montantTVA = montantHT * (parseFloat(formData.taux_tva) || 0) / 100;
  const montantTTC = montantHT + montantTVA;

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
          if (key === 'client') dataToSend[key] = null;
          else if (key === 'taux_tva') dataToSend[key] = 0;
          else if (key === 'numero') { /* garder */ }
          else delete dataToSend[key];
        }
      });

      if (!dataToSend.numero) delete dataToSend.numero;

      let devisCree;
      if (estEdition) {
        const res = await AxiosInstance.patch(`/devis/${devisId}/`, dataToSend);
        devisCree = res.data;
      } else {
        const res = await AxiosInstance.post('/devis/', dataToSend);
        devisCree = res.data;
      }

      setSucces(true);
      setTimeout(() => navigate(`/devis/${devisCree.id || devisId}`), 1200);
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
  const nomEntreprise = etablissement?.nom || 'APG ASSAINISSEMENT';
  const sigleEntreprise = etablissement?.sigle || 'APG';

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/devis')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Comptabilité / Devis / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouveau devis'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Devis {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
                  <h2 className="font-semibold text-sm">Numéro de devis</h2>
                </div>
                <div className="p-5">
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
                        placeholder="DEV-2026-000001"
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
                </div>
              </div>
            </div>

            {/* CLIENT */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Client & Objet</h2>
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
                      placeholder="Prestation de collecte - Offre commerciale"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* LIGNES */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Lignes du devis</h2>
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
                      <p className="text-base-content/60 mb-3">Aucune ligne</p>
                      <button
                        type="button"
                        onClick={ajouterLigne}
                        className="btn btn-sm btn-primary gap-2"
                      >
                        <Plus className="w-4 h-4" /> Ajouter une ligne
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lignes.map((ligne, index) => (
                        <div key={index} className="p-4 rounded-lg border border-base-300 bg-base-200/30">
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-12 md:col-span-6">
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
                                <span className="label-text text-xs font-medium">Prix unit.</span>
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
                            <div className="col-span-4 md:col-span-2 flex justify-end gap-1">
                              <div className="text-xs text-right flex-1">
                                <span className="label-text text-xs font-medium">Montant</span>
                                <p className="font-mono font-medium mt-1">
                                  {new Intl.NumberFormat('fr-FR').format(ligne.montant_ht || 0)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => supprimerLigne(index)}
                                className="btn btn-ghost btn-xs text-error"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                        <span className="label-text text-sm font-medium">Montant HT</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm">GNF</span>
                        <input
                          type="number"
                          name="montant_ht"
                          className="input input-bordered w-full pl-14"
                          value={formData.montant_ht}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">TVA (%)</span>
                    </label>
                    <div className="relative">
                      <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
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

                  <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Total HT :</span>
                      <span className="font-mono">{new Intl.NumberFormat('fr-FR').format(montantHT)} GNF</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">TVA :</span>
                      <span className="font-mono">{new Intl.NumberFormat('fr-FR').format(montantTVA)} GNF</span>
                    </div>
                    <div className="divider my-1"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total TTC :</span>
                      <span className="font-mono text-success">{new Intl.NumberFormat('fr-FR').format(montantTTC)} GNF</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DATES */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Dates & Notes</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Date de validité <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="date"
                      name="date_validite"
                      className="input input-bordered w-full"
                      value={formData.date_validite}
                      onChange={handleChange}
                      required
                    />
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

                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-base-200">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-primary truncate">{nomEntreprise}</p>
                      <p className="text-[10px] text-base-content/50">{sigleEntreprise}</p>
                    </div>
                  </div>

                  <p className="font-mono text-xs text-base-content/50">{formData.numero || 'DEV-2026-...'}</p>
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

                  <span className="badge badge-ghost badge-sm">{formData.statut}</span>
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
                  <option value="envoye">Envoyé</option>
                  <option value="accepte">Accepté</option>
                  <option value="refuse">Refusé</option>
                  <option value="expire">Expiré</option>
                  <option value="transforme">Transformé</option>
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
                      Un devis peut être <strong>transformé en facture</strong> une fois accepté.
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
            <button type="button" onClick={() => navigate('/devis')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le devis'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DevisForm;