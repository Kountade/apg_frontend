// components/comptabilite/LitigeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Gavel, Eye, Info, User, FileText, DollarSign,
  AlertTriangle, Calendar, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS = [
  { value: 'ouvert',   label: 'Ouvert',   color: 'warning' },
  { value: 'en_cours', label: 'En cours', color: 'info' },
  { value: 'resolu',   label: 'Résolu',   color: 'success' },
  { value: 'clos',     label: 'Clos',     color: 'ghost' },
];

const LitigeForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const litigeId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    client: '',
    facture: '',
    date_ouverture: new Date().toISOString().split('T')[0],
    motif: '',
    description: '',
    montant_conteste: '',
    statut: 'ouvert',
    resolution: '',
    date_resolution: '',
  });

  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargementFactures, setChargementFactures] = useState(false);

  useEffect(() => {
    chargerClients();
    if (estEdition && litigeId) {
      chargerLitige(litigeId);
    } else {
      const clientParam = searchParams.get('client');
      if (clientParam) setFormData(prev => ({ ...prev, client: clientParam }));
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
      setFactures(res.data.results || res.data || []);
    } catch (err) {
      setFactures([]);
    } finally {
      setChargementFactures(false);
    }
  };

  const chargerLitige = async (lid) => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/litiges/${lid}/`);
      const data = res.data;
      setFormData({
        numero: data.numero || '',
        client: data.client || '',
        facture: data.facture || '',
        date_ouverture: data.date_ouverture || '',
        motif: data.motif || '',
        description: data.description || '',
        montant_conteste: data.montant_conteste || '',
        statut: data.statut || 'ouvert',
        resolution: data.resolution || '',
        date_resolution: data.date_resolution || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le litige');
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
      if (facture && !formData.montant_conteste) {
        setFormData(prev => ({
          ...prev,
          montant_conteste: facture.solde_restant || facture.montant_ttc,
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
          if (['client', 'facture'].includes(key)) dataToSend[key] = null;
          else if (key === 'montant_conteste') dataToSend[key] = 0;
          else if (key === 'date_ouverture') delete dataToSend[key];
          else if (['resolution', 'date_resolution'].includes(key)) delete dataToSend[key];
          else delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/litiges/${litigeId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/litiges/${litigeId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/litiges/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/litiges/${res.data.id}`), 1200);
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
  const statutSelectionne = STATUTS.find(s => s.value === formData.statut);

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
            onClick={() => navigate(estEdition ? `/litiges/${litigeId}` : '/litiges')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Gavel className="w-3 h-3" />
              Comptabilité / Litiges / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouveau litige'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Litige {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
                        Facture concernée <span className="text-error">*</span>
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
                              ? '— Aucune facture disponible —'
                              : '— Sélectionner une facture —'}
                      </option>
                      {factures.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.numero} — {new Intl.NumberFormat('fr-FR').format(Number(f.montant_ttc))} GNF
                        </option>
                      ))}
                    </select>
                  </div>

                  {factureSelectionnee && (
                    <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-base-content/60">Montant facture :</span>
                        <span className="font-mono font-bold">
                          {formaterMontant(factureSelectionnee.montant_ttc)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-base-content/60">Solde restant :</span>
                        <span className="font-mono font-bold text-warning">
                          {formaterMontant(factureSelectionnee.solde_restant)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Motif & Description */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm">Motif & Description</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Motif du litige <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="motif"
                      className="input input-bordered w-full"
                      value={formData.motif}
                      onChange={handleChange}
                      required
                      placeholder="Ex : Contestation de la qualité de la prestation"
                      maxLength="300"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Description détaillée</span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Détails du litige, échanges avec le client, etc."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Montant & Date */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-error" />
                  <h2 className="font-semibold text-sm">Montant & Date</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Montant contesté <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="montant_conteste"
                          className="input input-bordered w-full pl-14 font-mono"
                          value={formData.montant_conteste}
                          onChange={handleChange}
                          required
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date d'ouverture <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_ouverture"
                        className="input input-bordered w-full"
                        value={formData.date_ouverture}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut & Résolution */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Statut & Résolution</h2>
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
                      {STATUTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {['resolu', 'clos'].includes(formData.statut) && (
                    <>
                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">Date de résolution</span>
                        </label>
                        <input
                          type="date"
                          name="date_resolution"
                          className="input input-bordered w-full"
                          value={formData.date_resolution}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">Résolution</span>
                        </label>
                        <textarea
                          name="resolution"
                          className="textarea textarea-bordered w-full"
                          value={formData.resolution}
                          onChange={handleChange}
                          rows="3"
                          placeholder="Comment le litige a-t-il été résolu ?"
                        ></textarea>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                      <Gavel className="w-6 h-6 text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.numero || 'LIT-...'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.motif || 'Motif du litige'}
                      </p>
                    </div>
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
                      <span className="text-base-content/60">Montant :</span>
                      <span className="font-mono font-bold text-error">
                        {formaterMontant(formData.montant_conteste)}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-${statutSelectionne?.color} badge-sm`}>
                    {statutSelectionne?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Cycle d'un litige</p>
                    <ol className="text-base-content/70 space-y-1 list-decimal list-inside">
                      <li><strong>Ouvert</strong> — Litige déclaré</li>
                      <li><strong>En cours</strong> — Négociation</li>
                      <li><strong>Résolu</strong> — Entente trouvée</li>
                      <li><strong>Clos</strong> — Dossier fermé</li>
                    </ol>
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
              onClick={() => navigate(estEdition ? `/litiges/${litigeId}` : '/litiges')}
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
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le litige'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LitigeForm;