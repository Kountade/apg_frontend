// src/components/stocks/MaintenanceForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus,
  Wrench, HardHat, DollarSign, RefreshCw, Info, Eye, User
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES = [
  { value: 'preventive', label: 'Préventive',  color: 'info' },
  { value: 'corrective', label: 'Corrective',  color: 'warning' },
  { value: 'urgence',    label: 'Urgence',     color: 'error' },
  { value: 'revision',   label: 'Révision',    color: 'primary' },
];

const STATUTS = [
  { value: 'planifiee', label: 'Planifiée' },
  { value: 'en_cours',  label: 'En cours' },
  { value: 'terminee',  label: 'Terminée' },
  { value: 'annulee',   label: 'Annulée' },
];

const MaintenanceForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [equipements, setEquipements] = useState([]);

  const equipementInitial = searchParams.get('equipement') || '';

  const aujourdhui = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    numero: '',
    equipement: equipementInitial,
    type: 'corrective',
    statut: 'planifiee',
    date_debut: aujourdhui,
    date_fin: '',
    description: '',
    technicien: '',
    cout_main_oeuvre: 0,
    cout_pieces: 0,
    observations: '',
  });

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      const res = await AxiosInstance.get('/equipements/?actif=true&page_size=500');
      setEquipements(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setChargementInitial(false);
    }
    chargerProchainNumero();
  };

  const chargerProchainNumero = async () => {
    setChargementNumero(true);
    try {
      const res = await AxiosInstance.get('/maintenances/prochain_numero/');
      if (res.data?.numero) {
        setFormData(prev => ({ ...prev, numero: res.data.numero }));
      }
    } catch (err) {
      // Silencieux : le backend génère auto au save()
      console.warn('Numéro auto indisponible, sera généré côté serveur.');
    } finally {
      setChargementNumero(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const coutTotal = Number(formData.cout_main_oeuvre || 0) + Number(formData.cout_pieces || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      // Nettoyer les champs vides
      Object.keys(dataToSend).forEach(k => {
        if (dataToSend[k] === '' || dataToSend[k] === null) {
          if (k === 'numero') {
            // Si vide, le backend génèrera
            delete dataToSend[k];
          } else if (['cout_main_oeuvre', 'cout_pieces'].includes(k)) {
            dataToSend[k] = 0;
          } else if (['date_fin'].includes(k)) {
            delete dataToSend[k];
          }
        }
      });

      const res = await AxiosInstance.post('/maintenances/', dataToSend);
      setSucces(true);
      setTimeout(() => navigate(`/maintenances/${res.data.id}`), 1200);
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

  // ============================================================
  // RENDU
  // ============================================================
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const equipementSelectionne = equipements.find(
    e => String(e.id) === String(formData.equipement)
  );
  const typeSelectionne = TYPES.find(t => t.value === formData.type);

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/maintenances')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Logistique / Maintenance / <span className="text-primary">Création</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Nouvelle maintenance
            </h1>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Maintenance enregistrée !</span>
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
                  <Wrench className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Numéro</span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="numero"
                          className="input input-bordered join-item w-full font-mono"
                          value={formData.numero}
                          onChange={handleChange}
                          placeholder="Auto-généré"
                          maxLength="50"
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={chargerProchainNumero}
                          disabled={chargementNumero}
                          className="btn btn-outline join-item"
                          title="Régénérer"
                        >
                          {chargementNumero ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-xs text-base-content/50 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-success" />
                          Généré automatiquement — sera finalisé à l'enregistrement
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Équipement <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="equipement"
                        className="select select-bordered w-full"
                        value={formData.equipement}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner —</option>
                        {equipements.map(eq => (
                          <option key={eq.id} value={eq.id}>
                            [{eq.code}] {eq.designation}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Type</span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={formData.type}
                        onChange={handleChange}
                      >
                        {TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

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
                  </div>
                </div>
              </div>
            </div>

            {/* Dates & Description */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30">
                  <h2 className="font-semibold text-sm">Dates & Travaux</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        <span className="label-text text-sm font-medium">Date fin</span>
                      </label>
                      <input
                        type="date"
                        name="date_fin"
                        className="input input-bordered w-full"
                        value={formData.date_fin}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Description des travaux <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Décrire l'intervention..."
                      required
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Technicien / Prestataire
                      </span>
                    </label>
                    <input
                      type="text"
                      name="technicien"
                      className="input input-bordered w-full"
                      value={formData.technicien}
                      onChange={handleChange}
                      placeholder="Nom du technicien"
                      maxLength="200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coûts */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Coûts</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Main d'œuvre (GNF)
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="cout_main_oeuvre"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.cout_main_oeuvre}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Pièces (GNF)
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="cout_pieces"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.cout_pieces}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="text-sm font-medium">Coût total</span>
                    <span className="font-mono font-bold text-lg text-success">
                      {new Intl.NumberFormat('fr-FR').format(coutTotal)} GNF
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observations */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30">
                  <h2 className="font-semibold text-sm">Observations</h2>
                </div>
                <div className="p-5">
                  <textarea
                    name="observations"
                    className="textarea textarea-bordered w-full"
                    value={formData.observations}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Notes complémentaires..."
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
                  <p className="font-mono text-xs text-base-content/50">
                    {formData.numero || 'MNT-AUTO'}
                  </p>
                  <p className="font-bold text-sm mt-1 truncate">
                    {equipementSelectionne?.designation || 'Équipement'}
                  </p>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">{typeSelectionne?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Début :</span>
                      <span className="font-mono">
                        {formData.date_debut
                          ? new Date(formData.date_debut).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Coût :</span>
                      <span className="font-mono font-bold text-success">
                        {new Intl.NumberFormat('fr-FR').format(coutTotal)} GNF
                      </span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <span className={`badge badge-sm ${
                    formData.statut === 'terminee' ? 'badge-success' :
                    formData.statut === 'en_cours' ? 'badge-warning' :
                    formData.statut === 'annulee' ? 'badge-ghost' :
                    'badge-info'
                  }`}>
                    {STATUTS.find(s => s.value === formData.statut)?.label}
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
                      Le coût total est calculé automatiquement. Le statut peut être
                      « Terminée » via le bouton dédié sur la fiche détail.
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
              onClick={() => navigate('/maintenances')}
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
                  <Save className="w-4 h-4" /> Créer la maintenance
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;