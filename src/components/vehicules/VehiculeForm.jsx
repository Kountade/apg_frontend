// src/components/vehicules/VehiculeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle,
  Truck, User, Wrench, Info, Eye, RefreshCw, DollarSign, MapPin
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES = [
  { value: 'camion',  label: 'Camion' },
  { value: 'benne',   label: 'Camion benne' },
  { value: 'pickup',  label: 'Pick-up' },
  { value: '4x4',     label: '4x4' },
  { value: 'voiture', label: 'Voiture' },
  { value: 'autre',   label: 'Autre' },
];

const ETATS = [
  { value: 'disponible',     label: 'Disponible' },
  { value: 'en_mission',     label: 'En mission' },
  { value: 'en_maintenance', label: 'En maintenance' },
  { value: 'en_panne',       label: 'En panne' },
  { value: 'hors_service',   label: 'Hors service' },
];

const STATUTS = [
  { value: 'actif',   label: 'Actif' },
  { value: 'vendu',   label: 'Vendu' },
  { value: 'reforme', label: 'Réformé' },
  { value: 'archive', label: 'Archivé' },
];

const VehiculeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const estEdition = id && id !== 'ajouter';
  const vehiculeId = estEdition ? id : null;

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [employes, setEmployes] = useState([]);

  const [formData, setFormData] = useState({
    numero_interne: '',
    immatriculation: '',
    type: 'camion',
    marque: '',
    modele: '',
    annee: '',
    numero_chassis: '',
    numero_moteur: '',
    date_acquisition: '',
    cout_acquisition: 0,
    capacite_charge: 0,
    kilometrage_actuel: 0,
    date_derniere_vidange: '',
    km_derniere_vidange: 0,
    intervalle_vidange_km: 5000,
    etat: 'disponible',
    statut: 'actif',
    conducteur_affecte: '',
    zone_exploitation: '',
    notes: '',
  });

  useEffect(() => {
    chargerEmployes();
    if (estEdition) {
      chargerVehicule();
    } else {
      chargerProchainNumero();
      setChargementInitial(false);  // ✅ libère le loader en création
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerEmployes = async () => {
    try {
      const res = await AxiosInstance.get('/employes/?page_size=500');
      setEmployes(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerProchainNumero = async () => {
    setChargementNumero(true);
    try {
      // ✅ URL corrigée
      const res = await AxiosInstance.get('/vehicules/prochain_numero/');
      if (res.data?.numero_interne) {
        setFormData(prev => ({ ...prev, numero_interne: res.data.numero_interne }));
      }
    } catch (err) {
      console.error('Erreur chargement numéro:', err);
    } finally {
      setChargementNumero(false);
    }
  };

  const chargerVehicule = async () => {
    setChargementInitial(true);
    try {
      // ✅ URL corrigée
      const res = await AxiosInstance.get(`/vehicules/${vehiculeId}/`);
      const d = res.data;
      setFormData({
        numero_interne: d.numero_interne || '',
        immatriculation: d.immatriculation || '',
        type: d.type || 'camion',
        marque: d.marque || '',
        modele: d.modele || '',
        annee: d.annee || '',
        numero_chassis: d.numero_chassis || '',
        numero_moteur: d.numero_moteur || '',
        date_acquisition: d.date_acquisition || '',
        cout_acquisition: d.cout_acquisition || 0,
        capacite_charge: d.capacite_charge || 0,
        kilometrage_actuel: d.kilometrage_actuel || 0,
        date_derniere_vidange: d.date_derniere_vidange || '',
        km_derniere_vidange: d.km_derniere_vidange || 0,
        intervalle_vidange_km: d.intervalle_vidange_km || 5000,
        etat: d.etat || 'disponible',
        statut: d.statut || 'actif',
        conducteur_affecte: d.conducteur_affecte || '',
        zone_exploitation: d.zone_exploitation || '',
        notes: d.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le véhicule');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(k => {
        if (dataToSend[k] === '' || dataToSend[k] === null) {
          if (['conducteur_affecte', 'date_acquisition', 'date_derniere_vidange', 'annee'].includes(k)) {
            dataToSend[k] = null;
          } else if (['cout_acquisition', 'capacite_charge', 'kilometrage_actuel', 'km_derniere_vidange'].includes(k)) {
            dataToSend[k] = 0;
          }
        }
      });

      if (estEdition) {
        // ✅ URL corrigée
        await AxiosInstance.patch(`/vehicules/${vehiculeId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/vehicules/${vehiculeId}`), 1200);
      } else {
        // ✅ URL corrigée
        const res = await AxiosInstance.post('/vehicules/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/vehicules/${res.data.id}`), 1200);
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
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/vehicules')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Véhicules / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Truck className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Véhicule {estEdition ? 'modifié' : 'créé'} !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
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
                  <Truck className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Numéro interne <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="numero_interne"
                          className="input input-bordered join-item w-full font-mono"
                          value={formData.numero_interne}
                          onChange={handleChange}
                          required
                          maxLength="50"
                        />
                        {!estEdition && (
                          <button
                            type="button"
                            onClick={chargerProchainNumero}
                            disabled={chargementNumero}
                            className="btn btn-outline join-item"
                            title="Régénérer"
                          >
                            {chargementNumero ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
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
                        {TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Immatriculation</span>
                      </label>
                      <input
                        type="text"
                        name="immatriculation"
                        className="input input-bordered w-full font-mono"
                        value={formData.immatriculation}
                        onChange={handleChange}
                        maxLength="50"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Marque</span>
                      </label>
                      <input
                        type="text"
                        name="marque"
                        className="input input-bordered w-full"
                        value={formData.marque}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Modèle</span>
                      </label>
                      <input
                        type="text"
                        name="modele"
                        className="input input-bordered w-full"
                        value={formData.modele}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Année</span>
                      </label>
                      <input
                        type="number"
                        name="annee"
                        className="input input-bordered w-full"
                        value={formData.annee}
                        onChange={handleChange}
                        min="1900"
                        max="2100"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° châssis</span>
                      </label>
                      <input
                        type="text"
                        name="numero_chassis"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_chassis}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° moteur</span>
                      </label>
                      <input                        type="text"
                        name="numero_moteur"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_moteur}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acquisition */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Acquisition</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date acquisition</span>
                      </label>
                      <input
                        type="date"
                        name="date_acquisition"
                        className="input input-bordered w-full"
                        value={formData.date_acquisition}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Coût acquisition (GNF)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="cout_acquisition"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.cout_acquisition}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Capacité (kg)</span>
                      </label>
                      <input
                        type="number"
                        name="capacite_charge"
                        className="input input-bordered w-full font-mono"
                        value={formData.capacite_charge}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Kilométrage actuel</span>
                      </label>
                      <input
                        type="number"
                        name="kilometrage_actuel"
                        className="input input-bordered w-full font-mono"
                        value={formData.kilometrage_actuel}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vidange */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm">Suivi vidange</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date dernière vidange</span>
                      </label>
                      <input
                        type="date"
                        name="date_derniere_vidange"
                        className="input input-bordered w-full"
                        value={formData.date_derniere_vidange}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Km dernière vidange</span>
                      </label>
                      <input
                        type="number"
                        name="km_derniere_vidange"
                        className="input input-bordered w-full font-mono"
                        value={formData.km_derniere_vidange}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Intervalle (km)</span>
                      </label>
                      <input
                        type="number"
                        name="intervalle_vidange_km"
                        className="input input-bordered w-full font-mono"
                        value={formData.intervalle_vidange_km}
                        onChange={handleChange}
                        min="100"
                        step="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Affectation */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Affectation & État</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Conducteur affecté</span>
                      </label>
                      <select
                        name="conducteur_affecte"
                        className="select select-bordered w-full"
                        value={formData.conducteur_affecte || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun —</option>
                        {employes.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nom_complet || `Employé #${emp.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Zone d'exploitation</span>
                      </label>
                      <input
                        type="text"
                        name="zone_exploitation"
                        className="input input-bordered w-full"
                        value={formData.zone_exploitation}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Ex : Kaloum"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">État</span>
                      </label>
                      <select
                        name="etat"
                        className="select select-bordered w-full"
                        value={formData.etat}
                        onChange={handleChange}
                      >
                        {ETATS.map(e => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Statut administratif</span>
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
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* APERÇU */}
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
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.numero_interne || 'VEH-AUTO'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.marque} {formData.modele}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">
                        {TYPES.find(t => t.value === formData.type)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Immat. :</span>
                      <span className="font-mono">{formData.immatriculation || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Km :</span>
                      <span className="font-mono">
                        {new Intl.NumberFormat('fr-FR').format(Number(formData.kilometrage_actuel || 0))} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Coût :</span>
                      <span className="font-mono font-bold text-success">
                        {new Intl.NumberFormat('fr-FR').format(Number(formData.cout_acquisition || 0))} GNF
                      </span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <span className={`badge badge-sm ${
                    formData.etat === 'disponible' ? 'badge-success' :
                    formData.etat === 'en_mission' ? 'badge-primary' :
                    formData.etat === 'en_maintenance' ? 'badge-warning' :
                    formData.etat === 'en_panne' ? 'badge-error' :
                    'badge-ghost'
                  }`}>
                    {ETATS.find(e => e.value === formData.etat)?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">À savoir</p>
                    <p className="text-base-content/70">
                      Le numéro interne est auto-généré (<code>VEH-YYYY-NNNNNN</code>).
                      La valeur actuelle est calculée depuis l'amortissement si lié à un équipement stocks.
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
              onClick={() => navigate('/vehicules')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[160px]"
              disabled={chargement}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le véhicule'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehiculeForm;