// components/paie/PeriodePaieForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, CalendarDays, Eye, Info, Calendar, DollarSign,
  Users, Calculator, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MOIS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

const PeriodePaieForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const periodeId = estEdition ? id : null;

  const currentDate = new Date();

  const [formData, setFormData] = useState({
    mois: currentDate.getMonth() + 1,
    annee: currentDate.getFullYear(),
    libelle: '',
    date_debut: '',
    date_fin: '',
    date_paiement_prevue: '',
    statut: 'ouverte',
    notes: '',
  });

  // Calcul automatique des dates selon mois/année
  useEffect(() => {
    if (formData.mois && formData.annee && !estEdition) {
      const moisNum = parseInt(formData.mois);
      const anneeNum = parseInt(formData.annee);

      const premierJour = new Date(anneeNum, moisNum - 1, 1);
      const dernierJour = new Date(anneeNum, moisNum, 0);

      setFormData(prev => ({
        ...prev,
        date_debut: premierJour.toISOString().split('T')[0],
        date_fin: dernierJour.toISOString().split('T')[0],
      }));
    }
  }, [formData.mois, formData.annee, estEdition]);

  useEffect(() => {
    if (estEdition && periodeId) {
      chargerPeriode(periodeId);
    }
  }, [id]);

  const chargerPeriode = async (pid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/periodes-paie/${pid}/`);
      const data = response.data;
      setFormData({
        mois: data.mois || currentDate.getMonth() + 1,
        annee: data.annee || currentDate.getFullYear(),
        libelle: data.libelle || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        date_paiement_prevue: data.date_paiement_prevue || '',
        statut: data.statut || 'ouverte',
        notes: data.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger la période');
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

      if (estEdition) {
        await AxiosInstance.patch(`/periodes-paie/${periodeId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/paie-periodes/${periodeId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/periodes-paie/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/paie-periodes/${res.data.id}`), 1200);
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

  const moisSelectionne = MOIS.find(m => m.value === parseInt(formData.mois));

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/paie-periodes')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Paie / Périodes / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${moisSelectionne?.label} ${formData.annee}` : 'Nouvelle période de paie'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Période {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification de la période</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Mois <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="mois"
                        className="select select-bordered w-full"
                        value={formData.mois}
                        onChange={handleChange}
                        required
                      >
                        {MOIS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Année <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        name="annee"
                        className="input input-bordered w-full"
                        value={formData.annee}
                        onChange={handleChange}
                        required
                        min="2020"
                        max="2100"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Libellé</span>
                    </label>
                    <input
                      type="text"
                      name="libelle"
                      className="input input-bordered w-full"
                      value={formData.libelle}
                      onChange={handleChange}
                      placeholder="Ex: Paie mensuelle Janvier 2026"
                      maxLength="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Dates de la période</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date de début <span className="text-error">*</span>
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
                          Date de fin <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_fin"
                        className="input input-bordered w-full"
                        value={formData.date_fin}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-base-content/40" />
                        Date de paiement prévue
                      </span>
                    </label>
                    <input
                      type="date"
                      name="date_paiement_prevue"
                      className="input input-bordered w-full"
                      value={formData.date_paiement_prevue}
                      onChange={handleChange}
                    />
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-base-content/50">
                        Date à laquelle vous prévoyez de payer les salaires
                      </span>
                    </label>
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
                    placeholder="Notes internes sur cette période..."
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
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.mois ? `${String(formData.mois).padStart(2, '0')}/${formData.annee}` : 'MM/AAAA'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {moisSelectionne?.label} {formData.annee}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Début :</span>
                      <span className="font-medium">
                        {formData.date_debut
                          ? new Date(formData.date_debut).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Fin :</span>
                      <span className="font-medium">
                        {formData.date_fin
                          ? new Date(formData.date_fin).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                    {formData.date_paiement_prevue && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Paiement :</span>
                        <span className="font-medium text-info">
                          {new Date(formData.date_paiement_prevue).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <span className="badge badge-ghost badge-sm">
                    {formData.statut}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Workflow</p>
                    <p className="text-base-content/70">
                      Une période suit ce cycle :
                      <br />1. <strong>Ouverte</strong> → Créée
                      <br />2. <strong>En préparation</strong> → Bulletins en cours
                      <br />3. <strong>Calculée</strong> → Bulletins calculés
                      <br />4. <strong>Contrôlée</strong> → Vérifiée
                      <br />5. <strong>Validée</strong> → Prête à payer
                      <br />6. <strong>Payée</strong> → Salaires versés
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
            <button type="button" onClick={() => navigate('/paie-periodes')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la période'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PeriodePaieForm;