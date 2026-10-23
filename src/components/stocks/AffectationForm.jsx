// src/components/stocks/AffectationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus,
  UserCheck, User, Users, Info, Eye, HardHat
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ETATS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'bon', label: 'Bon état' },
  { value: 'usage', label: 'Usagé' },
  { value: 'defectueux', label: 'Défectueux' },
  { value: 'hors_service', label: 'Hors service' },
];

const AffectationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [equipements, setEquipements] = useState([]);
  const [employes, setEmployes] = useState([]);

  const equipementInitial = searchParams.get('equipement') || '';

  const [formData, setFormData] = useState({
    equipement: equipementInitial,
    employe: '',
    equipe_nom: '',
    etat_avant: 'bon',
    observation: '',
  });

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      const [eqRes, empRes] = await Promise.all([
        AxiosInstance.get('/equipements/?actif=true&page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/?page_size=500').catch(() => ({ data: [] })),
      ]);
      setEquipements(eqRes.data.results || eqRes.data || []);
      setEmployes(empRes.data.results || empRes.data || []);
    } catch (err) {
      console.error(err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    // Au moins un bénéficiaire (employé OU équipe)
    if (!formData.employe && !formData.equipe_nom.trim()) {
      setErreur('Veuillez sélectionner un employé ou saisir un nom d\'équipe.');
      setChargement(false);
      return;
    }

    try {
      const dataToSend = {
        equipement: formData.equipement,
        etat_avant: formData.etat_avant,
        observation: formData.observation,
      };
      if (formData.employe) dataToSend.employe = formData.employe;
      if (formData.equipe_nom.trim()) dataToSend.equipe_nom = formData.equipe_nom.trim();

      const res = await AxiosInstance.post('/affectations-equipements/', dataToSend);
      setSucces(true);
      setTimeout(() => navigate(`/affectations/${res.data.id}`), 1200);
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

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/affectations')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Logistique / Affectations / <span className="text-primary">Création</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Nouvelle affectation
            </h1>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Affectation enregistrée !</span>
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
            {/* Équipement */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Équipement à affecter</h2>
                </div>
                <div className="p-5 space-y-5">
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
                          [{eq.code}] {eq.designation} — {eq.etat_display || eq.etat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        État avant affectation <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="etat_avant"
                      className="select select-bordered w-full"
                      value={formData.etat_avant}
                      onChange={handleChange}
                      required
                    >
                      {ETATS.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Bénéficiaire */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Bénéficiaire</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Employé</span>
                    </label>
                    <select
                      name="employe"
                      className="select select-bordered w-full"
                      value={formData.employe}
                      onChange={handleChange}
                    >
                      <option value="">— Aucun —</option>
                      {employes.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nom_complet || `${e.prenom || ''} ${e.nom || ''}`.trim() || `Employé #${e.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="divider my-1 text-xs text-base-content/40">OU</div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Équipe (nom libre)
                      </span>
                    </label>
                    <input
                      type="text"
                      name="equipe_nom"
                      className="input input-bordered w-full"
                      value={formData.equipe_nom}
                      onChange={handleChange}
                      placeholder="Ex : Équipe Collecte Zone A"
                      maxLength="100"
                    />
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Remplissez uniquement si affecté à toute une équipe
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Observation */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30">
                  <h2 className="font-semibold text-sm">Observation</h2>
                </div>
                <div className="p-5">
                  <textarea
                    name="observation"
                    className="textarea textarea-bordered w-full"
                    value={formData.observation}
                    onChange={handleChange}
                    rows="3"
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
                    {equipements.find(e => String(e.id) === String(formData.equipement))?.code || 'CODE'}
                  </p>
                  <p className="font-bold text-sm mt-1 truncate">
                    {equipements.find(e => String(e.id) === String(formData.equipement))?.designation || 'Équipement'}
                  </p>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Bénéficiaire :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {formData.employe
                          ? employes.find(e => String(e.id) === String(formData.employe))?.nom_complet || '—'
                          : formData.equipe_nom || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">État avant :</span>
                      <span className="font-medium">
                        {ETATS.find(e => e.value === formData.etat_avant)?.label}
                      </span>
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
                      L'équipement reste affecté jusqu'à enregistrement du retour
                      (depuis la fiche détail).
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
              onClick={() => navigate('/affectations')}
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
                  <Save className="w-4 h-4" /> Créer l'affectation
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AffectationForm;