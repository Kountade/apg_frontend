// components/tresorerie/CaisseForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Banknote, Wallet, Eye, Info, DollarSign,
  User, Users, TrendingUp
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CaisseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const caisseId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    responsable: '',
    devise: 'GNF',
    solde_initial: '',
    solde_physique: '',
    actif: true,
    description: '',
  });

  const [employes, setEmployes] = useState([]);

  useEffect(() => {
    chargerEmployes();
    if (estEdition && caisseId) {
      chargerCaisse(caisseId);
    }
  }, [id]);

  const chargerEmployes = async () => {
    try {
      const res = await AxiosInstance.get('/employes/');
      setEmployes(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerCaisse = async (cid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/caisses/${cid}/`);
      const data = response.data;
      setFormData({
        code: data.code || '',
        nom: data.nom || '',
        responsable: data.responsable || '',
        devise: data.devise || 'GNF',
        solde_initial: data.solde_initial || '',
        solde_physique: data.solde_physique || '',
        actif: data.actif !== undefined ? data.actif : true,
        description: data.description || '',
      });
    } catch (err) {
      setErreur('Impossible de charger la caisse');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
          if (key === 'responsable') dataToSend[key] = null;
          else if (['solde_initial', 'solde_physique'].includes(key)) dataToSend[key] = 0;
          else if (key !== 'actif') delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/caisses/${caisseId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/caisses'), 1200);
      } else {
        await AxiosInstance.post('/caisses/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/caisses'), 1200);
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
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/caisses')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Wallet className="w-3 h-3" />
              Trésorerie / Caisses / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.code}` : 'Nouvelle caisse'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Caisse {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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

            {/* Identification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Code <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        className="input input-bordered w-full font-mono focus:input-primary"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        placeholder="CAI-001"
                        maxLength="30"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Nom <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        placeholder="Caisse principale"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-base-content/40" />
                          Responsable
                        </span>
                      </label>
                      <select
                        name="responsable"
                        className="select select-bordered w-full"
                        value={formData.responsable}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun —</option>
                        {employes.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.matricule ? `[${e.matricule}] ` : ''}{e.nom_complet || `${e.prenom || ''} ${e.nom}`.trim()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Devise</span>
                      </label>
                      <select
                        name="devise"
                        className="select select-bordered w-full"
                        value={formData.devise}
                        onChange={handleChange}
                      >
                        <option value="GNF">GNF — Franc guinéen</option>
                        <option value="USD">USD — Dollar US</option>
                        <option value="EUR">EUR — Euro</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Description</span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Description de la caisse..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Soldes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Soldes</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Solde initial</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="solde_initial"
                          className="input input-bordered w-full pl-14"
                          value={formData.solde_initial}
                          onChange={handleChange}
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Solde physique</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="solde_physique"
                          className="input input-bordered w-full pl-14"
                          value={formData.solde_physique}
                          onChange={handleChange}
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          Solde réel constaté physiquement
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <label className="label cursor-pointer justify-start gap-3 py-0">
                  <input
                    type="checkbox"
                    name="actif"
                    className="checkbox checkbox-primary"
                    checked={formData.actif}
                    onChange={handleChange}
                  />
                  <div>
                    <span className="label-text font-medium">Caisse active</span>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      Les caisses inactives ne peuvent pas recevoir de mouvements
                    </p>
                  </div>
                </label>
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
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">{formData.code || 'CODE'}</p>
                      <p className="font-bold text-sm mt-0.5 truncate">{formData.nom || 'Nom de la caisse'}</p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Devise :</span>
                      <span className="font-bold">{formData.devise}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Solde initial :</span>
                      <span className="font-mono">
                        {formData.solde_initial
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.solde_initial)) + ' GNF'
                          : '0 GNF'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Solde physique :</span>
                      <span className="font-mono">
                        {formData.solde_physique
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.solde_physique)) + ' GNF'
                          : '0 GNF'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                    {formData.actif ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Utilisez un code court et explicite (ex: <span className="font-mono">CAI-001</span>, <span className="font-mono">CAI-PRINC</span>).
                      Le solde théorique sera calculé automatiquement à partir des mouvements.
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
            <button type="button" onClick={() => navigate('/caisses')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la caisse'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CaisseForm;