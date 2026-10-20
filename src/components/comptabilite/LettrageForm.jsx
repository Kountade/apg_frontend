// components/comptabilite/LettrageForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Link2, Eye, Info, Hash, Scale, FileText, Calendar
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const LettrageForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const lettrageId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    compte: '',
    code_lettrage: '',
    montant_lettre: '',
    notes: '',
  });

  const [comptes, setComptes] = useState([]);

  useEffect(() => {
    chargerComptes();
    if (estEdition && lettrageId) {
      chargerLettrage(lettrageId);
    }
  }, [id]);

  const chargerComptes = async () => {
    try {
      const res = await AxiosInstance.get('/comptes-comptables/');
      setComptes(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur comptes:', err);
    }
  };

  const chargerLettrage = async (lid) => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/lettrages/${lid}/`);
      const data = res.data;
      setFormData({
        compte: data.compte || '',
        code_lettrage: data.code_lettrage || '',
        montant_lettre: data.montant_lettre || '',
        notes: data.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le lettrage');
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
      const dataToSend = {
        compte: formData.compte,
        code_lettrage: formData.code_lettrage,
        montant_lettre: parseFloat(formData.montant_lettre) || 0,
        notes: formData.notes || '',
      };

      if (estEdition) {
        await AxiosInstance.patch(`/lettrages/${lettrageId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/lettrage'), 1200);
      } else {
        await AxiosInstance.post('/lettrages/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/lettrage'), 1200);
      }
    } catch (err) {
      console.error('Erreur:', err);
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

  const compteSelectionne = comptes.find(c => String(c.id) === String(formData.compte));

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
            onClick={() => navigate('/lettrage')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Link2 className="w-3 h-3" />
              Comptabilité / Lettrage / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? 'Modifier le lettrage' : 'Nouveau lettrage'}
            </h1>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Lettrage {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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

            {/* Compte & Code */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Compte & Code</h2>
                </div>
                <div className="p-5 space-y-5">

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Compte comptable <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="compte"
                      className="select select-bordered w-full"
                      value={formData.compte}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Sélectionner un compte —</option>
                      {comptes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.numero} — {c.libelle}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Code de lettrage <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                      <input
                        type="text"
                        name="code_lettrage"
                        className="input input-bordered w-full pl-10 font-mono"
                        value={formData.code_lettrage}
                        onChange={handleChange}
                        required
                        placeholder="Ex : LET-2026-001"
                        maxLength="20"
                      />
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-base-content/50">
                        Code unique qui associe factures et paiements
                      </span>
                    </label>
                  </div>

                </div>
              </div>
            </div>

            {/* Montant */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Montant</h2>
                </div>
                <div className="p-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Montant lettré <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                        GNF
                      </span>
                      <input
                        type="number"
                        name="montant_lettre"
                        className="input input-bordered w-full pl-14 font-mono text-lg"
                        value={formData.montant_lettre}
                        onChange={handleChange}
                        required
                        min="0"
                        step="100"
                        placeholder="0"
                      />
                    </div>
                  </div>
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
                    placeholder="Notes optionnelles sur ce lettrage..."
                  ></textarea>
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
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.code_lettrage || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {compteSelectionne?.libelle || 'Compte non sélectionné'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    {compteSelectionne && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Compte :</span>
                        <span className="font-mono font-medium">
                          {compteSelectionne.numero}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Montant :</span>
                      <span className="font-mono font-bold text-success">
                        {formData.montant_lettre
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.montant_lettre)) + ' GNF'
                          : '0 GNF'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">À savoir</p>
                    <p className="text-base-content/70">
                      Le lettrage permet de <strong>pointer</strong> les factures avec leurs paiements
                      correspondants. Le code doit être <strong>unique</strong> pour un rapprochement efficace.
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
              onClick={() => navigate('/lettrage')}
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
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le lettrage'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LettrageForm;