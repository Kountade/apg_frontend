// components/comptabilite/DeclarationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, FileText, Calculator, DollarSign, Calendar,
  Eye, Info, CheckCircle as CheckCircleIcon, Send
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const DeclarationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const declarationId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    type: 'tva',
    periode: '',
    montant: '',
    date_echeance: '',
    date_depot: '',
    date_paiement: '',
    statut: 'a_preparer',
    notes: '',
  });

  useEffect(() => {
    if (estEdition && declarationId) {
      chargerDeclaration(declarationId);
    }
  }, [id]);

  const chargerDeclaration = async (did) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/declarations-fiscales/${did}/`);
      const data = response.data;
      setFormData({
        type: data.type || 'tva',
        periode: data.periode || '',
        montant: data.montant || '',
        date_echeance: data.date_echeance || '',
        date_depot: data.date_depot || '',
        date_paiement: data.date_paiement || '',
        statut: data.statut || 'a_preparer',
        notes: data.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger la déclaration');
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
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (key === 'montant') dataToSend[key] = 0;
          else if (['date_depot', 'date_paiement'].includes(key)) dataToSend[key] = null;
          else delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/declarations-fiscales/${declarationId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/declarations-fiscales'), 1200);
      } else {
        await AxiosInstance.post('/declarations-fiscales/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/declarations-fiscales'), 1200);
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
          <button onClick={() => navigate('/declarations-fiscales')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Comptabilité / Déclarations / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.periode}` : 'Nouvelle déclaration fiscale'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Déclaration {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Type de déclaration <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="tva">TVA</option>
                        <option value="is">Impôt sur les sociétés</option>
                        <option value="ir">Impôt sur le revenu</option>
                        <option value="cnss">CNSS</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Période <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="periode"
                        className="input input-bordered w-full"
                        value={formData.periode}
                        onChange={handleChange}
                        required
                        placeholder="Janvier 2026"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Montant & Dates */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Montant & Dates</h2>
                </div>
                <div className="p-5 space-y-5">
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
                        className="input input-bordered w-full pl-14"
                        value={formData.montant}
                        onChange={handleChange}
                        required
                        min="0"
                        step="100"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date d'échéance <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_echeance"
                        className="input input-bordered w-full"
                        value={formData.date_echeance}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date de dépôt</span>
                      </label>
                      <input
                        type="date"
                        name="date_depot"
                        className="input input-bordered w-full"
                        value={formData.date_depot}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date de paiement</span>
                      </label>
                      <input
                        type="date"
                        name="date_paiement"
                        className="input input-bordered w-full"
                        value={formData.date_paiement}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut & Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Send className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Statut & Notes</h2>
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
                      <option value="a_preparer">À préparer</option>
                      <option value="preparee">Préparée</option>
                      <option value="deposee">Déposée</option>
                      <option value="payee">Payée</option>
                    </select>
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
                      placeholder="Notes internes..."
                    ></textarea>
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
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase">{formData.type}</p>
                      <p className="text-xs text-base-content/50">{formData.periode || 'Période'}</p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Montant :</span>
                      <span className="font-mono font-medium">
                        {formData.montant
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.montant)) + ' GNF'
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Échéance :</span>
                      <span className="font-medium">
                        {formData.date_echeance
                          ? new Date(formData.date_echeance).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>
                  <span className="badge badge-ghost badge-sm">{formData.statut}</span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Types de déclaration</p>
                    <ul className="text-base-content/70 space-y-0.5">
                      <li>• <strong>TVA</strong> : Taxe sur la valeur ajoutée</li>
                      <li>• <strong>IS</strong> : Impôt sur les sociétés</li>
                      <li>• <strong>IR</strong> : Impôt sur le revenu</li>
                      <li>• <strong>CNSS</strong> : Sécurité sociale</li>
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
            <button type="button" onClick={() => navigate('/declarations-fiscales')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la déclaration'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DeclarationForm;