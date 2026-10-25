// src/components/vehicules/CarburantForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Droplet,
  Fuel, DollarSign, Gauge, MapPin, User, Calendar, Info,
  Eye, TrendingUp, Truck, Car
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CARBURANT = [
  { value: 'essence', label: 'Essence' },
  { value: 'gasoil',  label: 'Gasoil' },
  { value: 'huile',   label: 'Huile' },
];

const CarburantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [tricycles, setTricycles] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [employes, setEmployes] = useState([]);

  const aujourdhui = new Date().toISOString().split('T')[0];

  // Pré-sélection depuis URL
  const tricycleInitial = searchParams.get('tricycle') || '';
  const vehiculeInitial = searchParams.get('vehicule') || '';

  const [formData, setFormData] = useState({
    tricycle: tricycleInitial,
    vehicule: vehiculeInitial,
    date: aujourdhui,
    type_carburant: 'essence',
    litres: 0,
    prix_litre: 0,
    km_compteur: 0,
    station: '',
    conducteur: '',
    notes: '',
  });

  // Type d'engin sélectionné
  const [typeEngin, setTypeEngin] = useState(
    tricycleInitial ? 'tricycle' : vehiculeInitial ? 'vehicule' : 'tricycle'
  );

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    chargerDonnees();
    if (estEdition) {
      chargerPlein();
    } else {
      setChargementInitial(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerDonnees = async () => {
    try {
      const [tricyclesRes, vehiculesRes, employesRes] = await Promise.all([
        AxiosInstance.get('/tricycles/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/vehicules/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/?page_size=500').catch(() => ({ data: [] })),
      ]);
      setTricycles(tricyclesRes.data.results || tricyclesRes.data || []);
      setVehicules(vehiculesRes.data.results || vehiculesRes.data || []);
      setEmployes(employesRes.data.results || employesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerPlein = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/pleins-carburant/${id}/`);
      const d = res.data;

      // Déterminer le type d'engin
      if (d.tricycle) {
        setTypeEngin('tricycle');
      } else if (d.vehicule) {
        setTypeEngin('vehicule');
      }

      setFormData({
        tricycle: d.tricycle || '',
        vehicule: d.vehicule || '',
        date: d.date || aujourdhui,
        type_carburant: d.type_carburant || 'essence',
        litres: d.litres || 0,
        prix_litre: d.prix_litre || 0,
        km_compteur: d.km_compteur || 0,
        station: d.station || '',
        conducteur: d.conducteur || '',
        notes: d.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le plein');
    } finally {
      setChargementInitial(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeEnginChange = (newType) => {
    setTypeEngin(newType);
    setFormData(prev => ({
      ...prev,
      tricycle: newType === 'tricycle' ? prev.tricycle : '',
      vehicule: newType === 'vehicule' ? prev.vehicule : '',
    }));
  };

  // Auto-calcul du montant
  const montantCalcule = Number(formData.litres || 0) * Number(formData.prix_litre || 0);

  const formaterMontant = (m) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(m || 0))) + ' GNF';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    // Validation XOR
    if (typeEngin === 'tricycle' && !formData.tricycle) {
      setErreur('Sélectionnez un tricycle.');
      setChargement(false);
      return;
    }
    if (typeEngin === 'vehicule' && !formData.vehicule) {
      setErreur('Sélectionnez un véhicule.');
      setChargement(false);
      return;
    }
    if (Number(formData.litres) <= 0) {
      setErreur('Le nombre de litres doit être supérieur à 0.');
      setChargement(false);
      return;
    }

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(k => {
        if (dataToSend[k] === '' || dataToSend[k] === null) {
          if (['tricycle', 'vehicule', 'conducteur'].includes(k)) {
            dataToSend[k] = null;
          } else if (['litres', 'prix_litre', 'km_compteur'].includes(k)) {
            dataToSend[k] = 0;
          } else if (k !== 'date' && k !== 'type_carburant') {
            delete dataToSend[k];
          }
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/pleins-carburant/${id}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/carburant'), 1200);
      } else {
        await AxiosInstance.post('/pleins-carburant/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/carburant'), 1200);
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
            onClick={() => navigate('/carburant')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Véhicules / Carburant / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Droplet className="w-5 h-5 text-warning" />
              {estEdition ? 'Modifier le plein' : 'Nouveau plein de carburant'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Plein {estEdition ? 'modifié' : 'enregistré'} !</span>
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
            {/* Engin */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Engin concerné</h2>
                </div>
                <div className="p-5 space-y-5">
                  {/* Type d'engin */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeEnginChange('tricycle')}
                      className={`btn h-auto flex-col py-3 gap-1 ${
                        typeEngin === 'tricycle' ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                      <span className="text-xs font-bold">Tricycle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeEnginChange('vehicule')}
                      className={`btn h-auto flex-col py-3 gap-1 ${
                        typeEngin === 'vehicule' ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      <Car className="w-5 h-5" />
                      <span className="text-xs font-bold">Véhicule</span>
                    </button>
                  </div>

                  {/* Sélecteur engin */}
                  {typeEngin === 'tricycle' ? (
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Tricycle <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="tricycle"
                        className="select select-bordered w-full"
                        value={formData.tricycle || ''}
                        onChange={handleChange}
                        required
                        disabled={estEdition}
                      >
                        <option value="">— Sélectionner —</option>
                        {tricycles.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.numero_interne}{t.immatriculation ? ` (${t.immatriculation})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Véhicule <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="vehicule"
                        className="select select-bordered w-full"
                        value={formData.vehicule || ''}
                        onChange={handleChange}
                        required
                        disabled={estEdition}
                      >
                        <option value="">— Sélectionner —</option>
                        {vehicules.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.numero_interne}{v.immatriculation ? ` (${v.immatriculation})` : ''} — {v.type_display || v.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Conducteur */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Conducteur</span>
                    </label>
                    <select
                      name="conducteur"
                      className="select select-bordered w-full"
                      value={formData.conducteur || ''}
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
                </div>
              </div>
            </div>

            {/* Détails du plein */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm">Détails du plein</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        className="input input-bordered w-full"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Type carburant</span>
                      </label>
                      <select
                        name="type_carburant"
                        className="select select-bordered w-full"
                        value={formData.type_carburant}
                        onChange={handleChange}
                      >
                        {TYPES_CARBURANT.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Litres <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <Droplet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="litres"
                          className="input input-bordered w-full pl-10 font-mono text-lg"
                          value={formData.litres}
                          onChange={handleChange}
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Prix au litre (GNF)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="prix_litre"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.prix_litre}
                          onChange={handleChange}
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Montant calculé */}
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-success">Montant total</span>
                      <span className="font-mono font-bold text-xl text-success">
                        {formaterMontant(montantCalcule)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Kilométrage au compteur
                        </span>
                      </label>
                      <div className="relative">
                        <Gauge className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="km_compteur"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.km_compteur}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Station-service</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="text"
                          name="station"
                          className="input input-bordered w-full pl-10"
                          value={formData.station}
                          onChange={handleChange}
                          maxLength="200"
                          placeholder="Ex : Total Kaloum"
                        />
                      </div>
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
            <div className="card bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Engin :</span>
                    <span className="font-medium truncate ml-2 max-w-[140px]">
                      {typeEngin === 'tricycle'
                        ? tricycles.find(t => String(t.id) === String(formData.tricycle))?.numero_interne || '—'
                        : vehicules.find(v => String(v.id) === String(formData.vehicule))?.numero_interne || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Date :</span>
                    <span className="font-mono">
                      {formData.date ? new Date(formData.date).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Type :</span>
                    <span className="font-medium">
                      {TYPES_CARBURANT.find(t => t.value === formData.type_carburant)?.label}
                    </span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Litres :</span>
                    <span className="font-mono font-bold">
                      {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1 }).format(Number(formData.litres || 0))} L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Prix/L :</span>
                    <span className="font-mono">
                      {formaterMontant(formData.prix_litre)}
                    </span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-success uppercase font-bold">Montant</span>
                    <span className="font-mono font-bold text-lg text-success">
                      {formaterMontant(montantCalcule)}
                    </span>
                  </div>
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
                      Le montant total est calculé automatiquement (litres × prix).
                      La consommation (L/100km) est calculée depuis le plein précédent du même engin.
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
              onClick={() => navigate('/carburant')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-warning gap-2 min-w-[160px]"
              disabled={chargement}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Enregistrer le plein'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CarburantForm;