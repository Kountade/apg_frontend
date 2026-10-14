// components/paie/AvanceSalaireForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, HandCoins, Eye, Info, DollarSign, User, Hash,
  Calendar, FileText, Calculator, TrendingUp, Users,
  Wallet, Clock, CheckSquare, XCircle, Percent, BadgeCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration
// ============================================================
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

const STATUTS_CONFIG = {
  demandee:   { label: 'Demandée',   cls: 'badge-warning', icon: Clock,        description: 'En attente de validation' },
  validee:    { label: 'Validée',    cls: 'badge-info',    icon: CheckSquare,  description: 'Validée, à payer' },
  refusee:    { label: 'Refusée',    cls: 'badge-error',   icon: XCircle,      description: 'Refusée' },
  payee:      { label: 'Payée',      cls: 'badge-primary', icon: CheckCircle,  description: 'Payée' },
  remboursee: { label: 'Remboursée', cls: 'badge-success', icon: BadgeCheck,   description: 'Remboursée' },
};

const AvanceSalaireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const avanceId = estEdition ? id : null;

  const currentDate = new Date();

  const [formData, setFormData] = useState({
    employe: '',
    montant: '',
    motif: '',
    mois_deduction: currentDate.getMonth() + 1,
    annee_deduction: currentDate.getFullYear(),
  });

  const [employes, setEmployes] = useState([]);
  const [chargementEmployes, setChargementEmployes] = useState(false);
  const [statutActuel, setStatutActuel] = useState('demandee');

  // ------------------------------------------------------------
  // Chargements
  // ------------------------------------------------------------
  useEffect(() => {
    chargerEmployes();
    if (estEdition && avanceId) {
      chargerAvance(avanceId);
    }
  }, [id]);

  const chargerEmployes = async () => {
    setChargementEmployes(true);
    try {
      const res = await AxiosInstance.get('/employes/');
      setEmployes(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur chargement employés:', err);
    } finally {
      setChargementEmployes(false);
    }
  };

  const chargerAvance = async (aid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/avances-salaire/${aid}/`);
      const data = response.data;
      setFormData({
        employe: data.employe || '',
        montant: data.montant || '',
        motif: data.motif || '',
        mois_deduction: data.mois_deduction || currentDate.getMonth() + 1,
        annee_deduction: data.annee_deduction || currentDate.getFullYear(),
      });
      setStatutActuel(data.statut || 'demandee');
    } catch (err) {
      setErreur("Impossible de charger l'avance");
    } finally {
      setChargementInitial(false);
    }
  };

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
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
          if (key === 'employe') dataToSend[key] = null;
          else if (key === 'montant') dataToSend[key] = 0;
          else delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/avances-salaire/${avanceId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/avances-salaire/${avanceId}`), 1200);
      } else {
        const res = await AxiosInstance.post('/avances-salaire/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/avances-salaire/${res.data.id}`), 1200);
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

  // ------------------------------------------------------------
  // Helpers d'affichage
  // ------------------------------------------------------------
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const employeSelectionne = employes.find(
    e => String(e.id) === String(formData.employe)
  );

  const nomEmploye = employeSelectionne
    ? (employeSelectionne.nom_complet ||
       `${employeSelectionne.prenom || ''} ${employeSelectionne.nom || ''}`.trim())
    : '';

  const statutCfg = STATUTS_CONFIG[statutActuel] || STATUTS_CONFIG.demandee;
  const StatutIcon = statutCfg.icon;

  // ------------------------------------------------------------
  // Rendu : chargement initial
  // ------------------------------------------------------------
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/avances-salaire')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Paie / Avances /{' '}
              <span className="text-primary">
                {estEdition ? 'Modification' : 'Création'}
              </span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition
                ? <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                : <Plus className="w-5 h-5 text-primary flex-shrink-0" />}
              <span className="truncate">
                {estEdition ? "Modifier l'avance" : 'Nouvelle avance sur salaire'}
              </span>
            </h1>
          </div>

          {estEdition && (
            <span className={`badge ${statutCfg.cls} badge-lg gap-1.5`}>
              <StatutIcon className="w-4 h-4" />
              {statutCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* ============ ALERTES ============ */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Avance {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      {/* ============ FORMULAIRE ============ */}
      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          {/* ---------- COLONNE PRINCIPALE ---------- */}
          <div className="lg:col-span-2 space-y-6">

            {/* --- Employé --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Employé</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Sélectionner l'employé <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="employe"
                      className="select select-bordered w-full"
                      value={formData.employe}
                      onChange={handleChange}
                      required
                      disabled={chargementEmployes}
                    >
                      <option value="">
                        {chargementEmployes
                          ? 'Chargement des employés...'
                          : '— Sélectionner un employé —'}
                      </option>
                      {employes.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.matricule ? `[${e.matricule}] ` : ''}
                          {e.nom_complet ||
                            `${e.prenom || ''} ${e.nom || ''}`.trim()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {employeSelectionne && (
                    <div className="bg-base-200/50 rounded-lg p-3 flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-primary/20 text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold">
                          <span>
                            {(employeSelectionne.prenom?.[0] || '') +
                             (employeSelectionne.nom?.[0] || '')}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{nomEmploye}</p>
                        <p className="text-xs text-base-content/50">
                          {employeSelectionne.matricule && (
                            <span className="font-mono mr-2">
                              {employeSelectionne.matricule}
                            </span>
                          )}
                          {employeSelectionne.poste || employeSelectionne.departement || ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- Montant --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Montant de l'avance</h2>
                </div>
                <div className="p-5 space-y-4">
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
                        className="input input-bordered w-full pl-14 font-mono text-lg"
                        value={formData.montant}
                        onChange={handleChange}
                        required
                        min="0"
                        step="1000"
                        placeholder="0"
                      />
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-base-content/50">
                        Montant demandé par l'employé
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Déduction --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Déduction sur salaire</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Mois de déduction <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="mois_deduction"
                        className="select select-bordered w-full"
                        value={formData.mois_deduction}
                        onChange={handleChange}
                        required
                      >
                        {MOIS.map(m => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
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
                        name="annee_deduction"
                        className="input input-bordered w-full font-mono"
                        value={formData.annee_deduction}
                        onChange={handleChange}
                        required
                        min="2020"
                        max="2100"
                      />
                    </div>
                  </div>

                  <div className="alert alert-info py-2">
                    <Info className="w-4 h-4" />
                    <span className="text-xs">
                      L'avance sera déduite du bulletin de paie de{' '}
                      <strong>
                        {MOIS.find(m => m.value === parseInt(formData.mois_deduction))?.label}{' '}
                        {formData.annee_deduction}
                      </strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Motif --- */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Motif</h2>
                </div>
                <div className="p-5">
                  <textarea
                    name="motif"
                    className="textarea textarea-bordered w-full"
                    value={formData.motif}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Motif de la demande d'avance (santé, scolarité, etc.)..."
                  ></textarea>
                </div>
              </div>
            </div>

          </div>

          {/* ---------- COLONNE LATÉRALE ---------- */}
          <div className="lg:col-span-1 space-y-6">

            {/* Aperçu */}
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <HandCoins className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-base-content/50">Avance sur salaire</p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {nomEmploye || 'Employé non sélectionné'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/60">Montant :</span>
                      <span className="font-mono font-bold text-primary text-base">
                        {formaterMontant(formData.montant)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/60">Déduction :</span>
                      <span className="font-medium">
                        {MOIS.find(m => m.value === parseInt(formData.mois_deduction))?.label}{' '}
                        {formData.annee_deduction}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge ${statutCfg.cls} badge-sm gap-1`}>
                    <StatutIcon className="w-3 h-3" />
                    {estEdition ? statutCfg.label : 'Demandée'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info workflow */}
            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Workflow de validation</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-warning" />
                        <span><strong>Demandée</strong> — Création</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-info" />
                        <span><strong>Validée</strong> — Approuvée</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <XCircle className="w-3 h-3 text-error" />
                        <span><strong>Refusée</strong> — Rejetée</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-primary" />
                        <span><strong>Payée</strong> — Versée</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <BadgeCheck className="w-3 h-3 text-success" />
                        <span><strong>Remboursée</strong> — Déduite du bulletin</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Rappel règles */}
            <div className="card bg-warning/5 border border-warning/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">Rappels</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li>• Une avance est déduite <strong>une seule fois</strong> sur le bulletin du mois choisi.</li>
                      <li>• Le montant ne peut pas dépasser le salaire net mensuel.</li>
                      <li>• Les avances <strong>payées</strong> ne sont plus modifiables.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ============ BARRE STICKY ============ */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-between gap-3 px-6 py-3">
            <div className="hidden md:block text-xs text-base-content/50">
              {estEdition ? (
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3" />
                  Modification d'une avance existante
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3 h-3" />
                  Création d'une nouvelle avance
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate('/avances-salaire')}
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
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {estEdition ? 'Enregistrer' : "Créer l'avance"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AvanceSalaireForm;