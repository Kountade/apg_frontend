// components/comptabilite/JournalForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, BookOpen, Hash, FileText, Eye, Info, Calculator,
  ShoppingCart, DollarSign, Landmark, Banknote, ListChecks, Users
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des types de journaux
// ============================================================
const TYPES_JOURNAL = [
  { value: 'AC', label: 'Achats', icon: ShoppingCart, color: 'error' },
  { value: 'VE', label: 'Ventes', icon: DollarSign, color: 'success' },
  { value: 'BQ', label: 'Banque', icon: Landmark, color: 'info' },
  { value: 'CA', label: 'Caisse', icon: Banknote, color: 'warning' },
  { value: 'OD', label: 'Opérations Diverses', icon: ListChecks, color: 'secondary' },
  { value: 'PA', label: 'Paie', icon: Users, color: 'primary' },
];

const JournalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const journalId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    type: 'AC',
    actif: true,
  });

  useEffect(() => {
    if (estEdition && journalId) {
      chargerJournal(journalId);
    }
  }, [id]);

  const chargerJournal = async (jid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/journaux/${jid}/`);
      const data = response.data;
      setFormData({
        code: data.code || '',
        libelle: data.libelle || '',
        type: data.type || 'AC',
        actif: data.actif !== undefined ? data.actif : true,
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger le journal');
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
          if (key !== 'actif') delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/journaux/${journalId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/journaux'), 1200);
      } else {
        await AxiosInstance.post('/journaux/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/journaux'), 1200);
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

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const typeSelectionne = TYPES_JOURNAL.find(t => t.value === formData.type);
  const TypeIcon = typeSelectionne?.icon || BookOpen;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/journaux')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Comptabilité / Journaux / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.code}` : 'Nouveau journal'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Journal {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
                  <Hash className="w-4 h-4 text-primary" />
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
                        placeholder="AC"
                        maxLength="10"
                      />
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          Code court (2-10 caractères)
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Libellé <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="libelle"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.libelle}
                        onChange={handleChange}
                        required
                        placeholder="Journal des achats"
                        maxLength="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Type de journal */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Type de journal</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {TYPES_JOURNAL.map((t) => {
                      const IconType = t.icon;
                      const isSelected = formData.type === t.value;
                      return (
                        <button
                          type="button"
                          key={t.value}
                          onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                          className={`btn h-auto flex-col py-4 gap-2 ${
                            isSelected
                              ? `btn-${t.color}`
                              : 'btn-outline'
                          }`}
                        >
                          <IconType className="w-6 h-6" />
                          <span className="text-sm font-bold">{t.value}</span>
                          <span className="text-xs opacity-80">{t.label}</span>
                        </button>
                      );
                    })}
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
                    <span className="label-text font-medium">Journal actif</span>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      Les journaux inactifs ne peuvent plus recevoir d'écritures
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
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-${typeSelectionne?.color || 'primary'}/20 flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className={`w-6 h-6 text-${typeSelectionne?.color || 'primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.code || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.libelle || 'Libellé du journal'}
                      </p>
                      <p className="text-xs text-base-content/50 mt-0.5">
                        {typeSelectionne?.label || 'Type'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-between">
                    <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                      {formData.actif ? 'Actif' : 'Inactif'}
                    </span>
                    <span className={`badge badge-${typeSelectionne?.color || 'primary'} badge-sm`}>
                      {formData.type}
                    </span>
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
                      Les journaux standards sont :
                      <br />• <strong>AC</strong> : Achats
                      <br />• <strong>VE</strong> : Ventes
                      <br />• <strong>BQ</strong> : Banque
                      <br />• <strong>CA</strong> : Caisse
                      <br />• <strong>OD</strong> : Opérations Diverses
                      <br />• <strong>PA</strong> : Paie
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
              onClick={() => navigate('/journaux')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le journal'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JournalForm;