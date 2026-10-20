// components/comptabilite/RelanceForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Send, Eye, Info, User, Mail, Phone, MessageSquare,
  MapPin, FileText, DollarSign, Calendar, Clock
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES = [
  { value: 'email',    label: 'Email',      icon: Mail,          color: 'info' },
  { value: 'sms',      label: 'SMS',        icon: MessageSquare, color: 'primary' },
  { value: 'appel',    label: 'Appel',      icon: Phone,         color: 'success' },
  { value: 'courrier', label: 'Courrier',   icon: FileText,      color: 'warning' },
  { value: 'visite',   label: 'Visite',     icon: MapPin,        color: 'secondary' },
];

const RelanceForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const relanceId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    client: '',
    facture_reference: '',
    type: 'email',
    date_relance: new Date().toISOString().split('T')[0],
    message: '',
    montant_reclame: '',
    reponse_client: '',
    prochaine_relance: '',
  });

  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargementFactures, setChargementFactures] = useState(false);

  useEffect(() => {
    chargerClients();
    if (estEdition && relanceId) {
      chargerRelance(relanceId);
    } else {
      const clientParam = searchParams.get('client');
      const factureParam = searchParams.get('facture');
      if (clientParam) setFormData(prev => ({ ...prev, client: clientParam }));
      if (factureParam) {
        // Charger la facture pour pré-remplir
        chargerFactureUnique(factureParam);
      }
    }
  }, [id]);

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
    } catch (err) { console.error(err); }
  };

  const chargerFacturesClient = async (clientId) => {
    setChargementFactures(true);
    try {
      const res = await AxiosInstance.get(`/factures/?client=${clientId}`);
      const data = res.data.results || res.data || [];
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

  const chargerFactureUnique = async (factureId) => {
    try {
      const res = await AxiosInstance.get(`/factures/${factureId}/`);
      const facture = res.data;
      setFormData(prev => ({
        ...prev,
        client: facture.client,
        facture_reference: facture.numero,
        montant_reclame: facture.solde_restant || facture.montant_ttc,
        message: `Relance concernant la facture ${facture.numero} d'un montant de ${new Intl.NumberFormat('fr-FR').format(facture.solde_restant || facture.montant_ttc)} GNF.`,
      }));
    } catch (err) { console.error(err); }
  };

  const chargerRelance = async (rid) => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/relances/${rid}/`);
      const data = res.data;
      setFormData({
        client: data.client || '',
        facture_reference: data.facture_reference || '',
        type: data.type || 'email',
        date_relance: data.date_relance || '',
        message: data.message || '',
        montant_reclame: data.montant_reclame || '',
        reponse_client: data.reponse_client || '',
        prochaine_relance: data.prochaine_relance || '',
      });
    } catch (err) {
      setErreur('Impossible de charger la relance');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFactureChange = (e) => {
    const factureNumero = e.target.value;
    setFormData(prev => ({ ...prev, facture_reference: factureNumero }));

    if (factureNumero) {
      const facture = factures.find(f => f.numero === factureNumero);
      if (facture && !formData.montant_reclame) {
        setFormData(prev => ({
          ...prev,
          montant_reclame: facture.solde_restant || facture.montant_ttc,
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
          if (key === 'montant_reclame') dataToSend[key] = 0;
          else if (['prochaine_relance', 'reponse_client'].includes(key)) delete dataToSend[key];
          else delete dataToSend[key];
        }
      });
      // Supprimer date_relance si création (auto_now_add)
      if (!estEdition) delete dataToSend.date_relance;

      if (estEdition) {
        await AxiosInstance.patch(`/relances/${relanceId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/relances'), 1200);
      } else {
        await AxiosInstance.post('/relances/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/relances'), 1200);
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

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const clientSelectionne = clients.find(c => String(c.id) === String(formData.client));
  const typeSelectionne = TYPES.find(t => t.value === formData.type);
  const TypeIcon = typeSelectionne?.icon || Send;

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
            onClick={() => navigate('/relances')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Send className="w-3 h-3" />
              Recouvrement / Relances / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? 'Modifier la relance' : 'Nouvelle relance'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Relance {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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
                      <span className="label-text text-sm font-medium">Facture concernée</span>
                    </label>
                    <select
                      name="facture_reference"
                      className="select select-bordered w-full"
                      value={formData.facture_reference}
                      onChange={handleFactureChange}
                      disabled={!formData.client || chargementFactures}
                    >
                      <option value="">
                        {chargementFactures
                          ? 'Chargement...'
                          : !formData.client
                            ? '— Sélectionnez d\'abord un client —'
                            : factures.length === 0
                              ? '— Aucune facture impayée —'
                              : '— Aucune facture spécifique —'}
                      </option>
                      {factures.map(f => (
                        <option key={f.id} value={f.numero}>
                          {f.numero} — Reste : {new Intl.NumberFormat('fr-FR').format(Number(f.solde_restant))} GNF
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Type de relance */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <TypeIcon className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Type de relance</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {TYPES.map(t => {
                      const Icon = t.icon;
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
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold leading-tight text-center">
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Message & Montant */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Message & Montant</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Montant réclamé <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                        GNF
                      </span>
                      <input
                        type="number"
                        name="montant_reclame"
                        className="input input-bordered w-full pl-14 font-mono"
                        value={formData.montant_reclame}
                        onChange={handleChange}
                        min="0"
                        step="100"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Message <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      name="message"
                      className="textarea textarea-bordered w-full"
                      value={formData.message}
                      onChange={handleChange}
                      rows="5"
                      required
                      placeholder="Contenu du message de relance..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Suivi */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Suivi</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Réponse client</span>
                    </label>
                    <textarea
                      name="reponse_client"
                      className="textarea textarea-bordered w-full"
                      value={formData.reponse_client}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Réponse éventuelle du client..."
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Prochaine relance prévue</span>
                    </label>
                    <input
                      type="date"
                      name="prochaine_relance"
                      className="input input-bordered w-full"
                      value={formData.prochaine_relance}
                      onChange={handleChange}
                    />
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
                    <div className={`w-12 h-12 rounded-lg bg-${typeSelectionne?.color}/20 flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className={`w-6 h-6 text-${typeSelectionne?.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-base-content/50">
                        {typeSelectionne?.label || 'Type'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {clientSelectionne?.nom_complet || clientSelectionne?.nom || 'Client non sélectionné'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    {formData.facture_reference && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Facture :</span>
                        <span className="font-mono font-medium">{formData.facture_reference}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Montant :</span>
                      <span className="font-mono font-bold text-warning">
                        {formaterMontant(formData.montant_reclame)}
                      </span>
                    </div>
                    {formData.prochaine_relance && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Prochaine :</span>
                        <span className="font-medium font-mono">
                          {new Date(formData.prochaine_relance).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Bonnes pratiques</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li>• <strong>1ère relance</strong> : 7 jours après échéance</li>
                      <li>• <strong>2ème relance</strong> : 15 jours après</li>
                      <li>• <strong>3ème relance</strong> : 30 jours après</li>
                      <li>• <strong>Mise en demeure</strong> : 60 jours</li>
                      <li>• <strong>Contentieux</strong> : 90 jours</li>
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
              onClick={() => navigate('/relances')}
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
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la relance'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RelanceForm;