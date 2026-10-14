// components/tresorerie/PrevisionForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, CalendarDays, Eye, Info, DollarSign, Calendar,
  ArrowDownRight, ArrowUpRight, FileText, Wallet
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const PrevisionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const previsionId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    date_prevue: new Date().toISOString().split('T')[0],
    type: 'entree',
    libelle: '',
    montant: '',
    realise: false,
    notes: '',
  });

  useEffect(() => {
    if (estEdition && previsionId) {
      chargerPrevision(previsionId);
    }
  }, [id]);

  const chargerPrevision = async (pid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/previsions/${pid}/`);
      const data = response.data;
      setFormData({
        date_prevue: data.date_prevue || '',
        type: data.type || 'entree',
        libelle: data.libelle || '',
        montant: data.montant || '',
        realise: data.realise || false,
        notes: data.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger la prévision');
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
          if (key === 'montant') dataToSend[key] = 0;
          else if (key !== 'realise') delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/previsions/${previsionId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/previsions'), 1200);
      } else {
        await AxiosInstance.post('/previsions/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/previsions'), 1200);
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

  const TypeIcon = formData.type === 'entree' ? ArrowDownRight : ArrowUpRight;
  const typeColor = formData.type === 'entree' ? 'success' : 'error';

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/previsions')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Wallet className="w-3 h-3" />
              Trésorerie / Prévisions / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? 'Modifier la prévision' : 'Nouvelle prévision'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Prévision {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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

            {/* Type */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Type de prévision</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'entree' }))}
                      className={`btn h-auto flex-col py-4 gap-2 ${
                        formData.type === 'entree' ? 'btn-success' : 'btn-outline'
                      }`}
                    >
                      <ArrowDownRight className="w-6 h-6" />
                      <span className="font-bold">Entrée prévue</span>
                      <span className="text-xs opacity-70">Recette à venir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'sortie' }))}
                      className={`btn h-auto flex-col py-4 gap-2 ${
                        formData.type === 'sortie' ? 'btn-error' : 'btn-outline'
                      }`}
                    >
                      <ArrowUpRight className="w-6 h-6" />
                      <span className="font-bold">Sortie prévue</span>
                      <span className="text-xs opacity-70">Dépense à venir</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Détails de la prévision</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Libellé <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="libelle"
                      className="input input-bordered w-full"
                      value={formData.libelle}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Paiement facture client, Achat carburant..."
                      maxLength="300"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date prévue <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_prevue"
                        className="input input-bordered w-full"
                        value={formData.date_prevue}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Montant <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="montant"
                          className="input input-bordered w-full pl-14 font-mono"
                          value={formData.montant}
                          onChange={handleChange}
                          required
                          min="0"
                          step="100"
                          placeholder="0"
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
                      rows="3"
                      placeholder="Notes ou détails supplémentaires..."
                    ></textarea>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 py-0">
                      <input
                        type="checkbox"
                        name="realise"
                        className="checkbox checkbox-success"
                        checked={formData.realise}
                        onChange={handleChange}
                      />
                      <div>
                        <span className="label-text font-medium">Prévision réalisée</span>
                        <p className="text-xs text-base-content/50 mt-0.5">
                          Cochez si cette prévision s'est concrétisée
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className={`card shadow-sm border-2 ${
              formData.type === 'entree'
                ? 'bg-gradient-to-br from-success/5 to-success/10 border-success/30'
                : 'bg-gradient-to-br from-error/5 to-error/10 border-error/30'
            }`}>
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className={`w-4 h-4 text-${typeColor}`} />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg bg-${typeColor}/20 flex items-center justify-center`}>
                      <TypeIcon className={`w-6 h-6 text-${typeColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-base-content/50">
                        {formData.type === 'entree' ? 'Entrée prévue' : 'Sortie prévue'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.libelle || 'Libellé'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Date :</span>
                      <span className="font-medium">
                        {formData.date_prevue
                          ? new Date(formData.date_prevue).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/60">Montant :</span>
                      <span className={`font-mono font-bold text-lg text-${typeColor}`}>
                        {formData.type === 'entree' ? '+' : '-'}
                        {formData.montant
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.montant)) + ' GNF'
                          : '0 GNF'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-sm ${
                    formData.realise ? 'badge-success' : 'badge-warning'
                  }`}>
                    {formData.realise ? 'Réalisée' : 'À venir'}
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
                      Les prévisions permettent d'anticiper les flux de trésorerie à venir.
                      Utilisez-les pour planifier vos paiements et éviter les découverts.
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
            <button type="button" onClick={() => navigate('/previsions')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la prévision'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PrevisionForm;