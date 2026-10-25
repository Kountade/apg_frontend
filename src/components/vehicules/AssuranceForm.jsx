// src/components/vehicules/AssuranceForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Shield,
  Building2, DollarSign, Calendar, FileText, Info, Eye,
  Truck, Car, AlertTriangle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const AssuranceForm = () => {
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

  const aujourdhui = new Date().toISOString().split('T')[0];
  const dansUnAn = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString().split('T')[0];

  const tricycleInitial = searchParams.get('tricycle') || '';
  const vehiculeInitial = searchParams.get('vehicule') || '';

  const [formData, setFormData] = useState({
    tricycle: tricycleInitial,
    vehicule: vehiculeInitial,
    compagnie: '',
    numero_police: '',
    type_couverture: 'Tous risques',
    prime_annuelle: 0,
    date_debut: aujourdhui,
    date_fin: dansUnAn,
    notes: '',
  });

  const [typeEngin, setTypeEngin] = useState(
    tricycleInitial ? 'tricycle' : vehiculeInitial ? 'vehicule' : 'tricycle'
  );

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    chargerEngins();
    if (estEdition) {
      chargerAssurance();
    } else {
      setChargementInitial(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerEngins = async () => {
    try {
      const [tricyclesRes, vehiculesRes] = await Promise.all([
        AxiosInstance.get('/tricycles/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/vehicules/?page_size=500').catch(() => ({ data: [] })),
      ]);
      setTricycles(tricyclesRes.data.results || tricyclesRes.data || []);
      setVehicules(vehiculesRes.data.results || vehiculesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerAssurance = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/assurances/${id}/`);
      const d = res.data;

      if (d.tricycle) setTypeEngin('tricycle');
      else if (d.vehicule) setTypeEngin('vehicule');

      setFormData({
        tricycle: d.tricycle || '',
        vehicule: d.vehicule || '',
        compagnie: d.compagnie || '',
        numero_police: d.numero_police || '',
        type_couverture: d.type_couverture || 'Tous risques',
        prime_annuelle: d.prime_annuelle || 0,
        date_debut: d.date_debut || aujourdhui,
        date_fin: d.date_fin || dansUnAn,
        notes: d.notes || '',
      });
    } catch (err) {
      setErreur("Impossible de charger l'assurance");
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

  // Validation dates
  const dateFinAvantDebut = formData.date_debut && formData.date_fin
    && new Date(formData.date_fin) < new Date(formData.date_debut);

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
    if (dateFinAvantDebut) {
      setErreur("La date de fin doit être après la date de début.");
      setChargement(false);
      return;
    }

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(k => {
        if (dataToSend[k] === '' || dataToSend[k] === null) {
          if (['tricycle', 'vehicule'].includes(k)) {
            dataToSend[k] = null;
          } else if (k === 'prime_annuelle') {
            dataToSend[k] = 0;
          }
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/assurances/${id}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/assurances'), 1200);
      } else {
        await AxiosInstance.post('/assurances/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/assurances'), 1200);
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

  const enginSelectionne = typeEngin === 'tricycle'
    ? tricycles.find(t => String(t.id) === String(formData.tricycle))
    : vehicules.find(v => String(v.id) === String(formData.vehicule));

  const formaterMontant = (m) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(m || 0))) + ' GNF';

  // Calcul durée de l'assurance
  let dureeJours = 0;
  if (formData.date_debut && formData.date_fin) {
    dureeJours = Math.round(
      (new Date(formData.date_fin) - new Date(formData.date_debut)) / (1000 * 60 * 60 * 24)
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/assurances')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Véhicules / Assurances / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Shield className="w-5 h-5 text-primary" />
              {estEdition ? "Modifier l'assurance" : 'Nouvelle assurance'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Assurance {estEdition ? 'modifiée' : 'créée'} !</span>
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
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Engin concerné</h2>
                </div>
                <div className="p-5 space-y-5">
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
                </div>
              </div>
            </div>

            {/* Compagnie & Police */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Compagnie & Police</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Compagnie <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="compagnie"
                        className="input input-bordered w-full"
                        value={formData.compagnie}
                        onChange={handleChange}
                        required
                        maxLength="200"
                        placeholder="Ex : NSIA Assurances"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          N° de police <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="numero_police"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_police}
                        onChange={handleChange}
                        required
                        maxLength="100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Type de couverture</span>
                      </label>
                      <input
                        type="text"
                        name="type_couverture"
                        className="input input-bordered w-full"
                        value={formData.type_couverture}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Ex : Tous risques, Au tiers"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Prime annuelle (GNF)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="prime_annuelle"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.prime_annuelle}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Période */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Période de couverture</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date début <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_debut"
                        className="input input-bordered w-full"
                        value={formData.date_debut}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date fin <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_fin"
                        className={`input input-bordered w-full ${dateFinAvantDebut ? 'input-error' : ''}`}
                        value={formData.date_fin}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Durée</span>
                      </label>
                      <input
                        type="text"
                        className={`input input-bordered w-full font-mono font-bold ${
                          dateFinAvantDebut ? 'text-error' : 'text-success'
                        }`}
                        value={dateFinAvantDebut ? 'Invalide' : dureeJours > 0 ? `${dureeJours} jours` : '—'}
                        readOnly
                      />
                    </div>
                  </div>

                  {dateFinAvantDebut && (
                    <div className="alert alert-error py-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs">La date de fin doit être après la date de début.</span>
                    </div>
                  )}

                  {formData.date_fin && !dateFinAvantDebut && (
                    <div className={`alert py-2 ${
                      new Date(formData.date_fin) >= new Date()
                        ? 'alert-success'
                        : 'alert-error'
                    }`}>
                      {new Date(formData.date_fin) >= new Date() ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Assurance valide jusqu'au {new Date(formData.date_fin).toLocaleDateString('fr-FR')}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs">Assurance expirée depuis le {new Date(formData.date_fin).toLocaleDateString('fr-FR')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Notes</h2>
                </div>
                <div className="p-5">
                  <textarea
                    name="notes"
                    className="textarea textarea-bordered w-full"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Notes sur l'assurance..."
                  ></textarea>
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
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.numero_police || 'N° POLICE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.compagnie || 'Compagnie'}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Engin :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {enginSelectionne?.numero_interne || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Couverture :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {formData.type_couverture || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Prime :</span>
                      <span className="font-mono font-bold text-success">
                        {formaterMontant(formData.prime_annuelle)}
                      </span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Du :</span>
                      <span className="font-mono">{formData.date_debut ? new Date(formData.date_debut).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Au :</span>
                      <span className="font-mono font-bold">{formData.date_fin ? new Date(formData.date_fin).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
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
                      Une assurance est liée à <strong>un seul engin</strong> (tricycle ou véhicule).
                      Les alertes d'expiration apparaissent automatiquement dans la liste.
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
              onClick={() => navigate('/assurances')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[160px]"
              disabled={chargement || dateFinAvantDebut}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : "Créer l'assurance"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AssuranceForm;