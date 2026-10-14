// components/tresorerie/AlerteTresorerieForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Bell, Eye, Info, AlertTriangle, Info as InfoIcon,
  Wallet, Landmark, FileText, Target, MessageSquare
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const NIVEAUX = [
  { value: 'info', label: 'Information', icon: InfoIcon, color: 'info', description: 'Notification normale' },
  { value: 'avertissement', label: 'Avertissement', icon: AlertTriangle, color: 'warning', description: 'Attention requise' },
  { value: 'critique', label: 'Critique', icon: AlertCircle, color: 'error', description: 'Action urgente' },
];

const AlerteTresorerieForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const alerteId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    titre: '',
    message: '',
    niveau: 'info',
    caisse: '',
    compte_bancaire: '',
    resolue: false,
  });

  const [caisses, setCaisses] = useState([]);
  const [comptes, setComptes] = useState([]);

  useEffect(() => {
    chargerDonneesReference();
    if (estEdition && alerteId) {
      chargerAlerte(alerteId);
    }
  }, [id]);

  const chargerDonneesReference = async () => {
    try {
      const [caissesRes, comptesRes] = await Promise.all([
        AxiosInstance.get('/caisses/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-bancaires/').catch(() => ({ data: [] })),
      ]);
      setCaisses(caissesRes.data.results || caissesRes.data || []);
      setComptes(comptesRes.data.results || comptesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerAlerte = async (aid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/alertes-tresorerie/${aid}/`);
      const data = response.data;
      setFormData({
        titre: data.titre || '',
        message: data.message || '',
        niveau: data.niveau || 'info',
        caisse: data.caisse || '',
        compte_bancaire: data.compte_bancaire || '',
        resolue: data.resolue || false,
      });
    } catch (err) {
      setErreur('Impossible de charger l\'alerte');
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
          if (['caisse', 'compte_bancaire'].includes(key)) dataToSend[key] = null;
          else if (key !== 'resolue') delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/alertes-tresorerie/${alerteId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/alertes-tresorerie'), 1200);
      } else {
        await AxiosInstance.post('/alertes-tresorerie/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/alertes-tresorerie'), 1200);
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

  const niveauSelectionne = NIVEAUX.find(n => n.value === formData.niveau);
  const NiveauIcon = niveauSelectionne?.icon || InfoIcon;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/alertes-tresorerie')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Wallet className="w-3 h-3" />
              Trésorerie / Alertes / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? 'Modifier l\'alerte' : 'Nouvelle alerte'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Alerte {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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

            {/* Niveau */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Niveau de l'alerte</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {NIVEAUX.map((n) => {
                      const Icon = n.icon;
                      const isSelected = formData.niveau === n.value;
                      return (
                        <button
                          type="button"
                          key={n.value}
                          onClick={() => setFormData(prev => ({ ...prev, niveau: n.value }))}
                          className={`btn h-auto flex-col py-4 gap-2 ${
                            isSelected ? `btn-${n.color}` : 'btn-outline'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="font-bold text-sm">{n.label}</span>
                          <span className="text-[10px] opacity-80">{n.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Contenu de l'alerte</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Titre <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="titre"
                      className="input input-bordered w-full"
                      value={formData.titre}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Solde de caisse faible"
                      maxLength="200"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Message <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      name="message"
                      className="textarea textarea-bordered w-full"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="4"
                      placeholder="Description détaillée de l'alerte..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Contexte */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Contexte (optionnel)</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-base-content/40" />
                          Caisse concernée
                        </span>
                      </label>
                      <select
                        name="caisse"
                        className="select select-bordered w-full"
                        value={formData.caisse}
                        onChange={handleChange}
                      >
                        <option value="">— Aucune caisse —</option>
                        {caisses.map(c => (
                          <option key={c.id} value={c.id}>{c.code} — {c.nom}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-base-content/40" />
                          Compte concerné
                        </span>
                      </label>
                      <select
                        name="compte_bancaire"
                        className="select select-bordered w-full"
                        value={formData.compte_bancaire}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun compte —</option>
                        {comptes.map(c => (
                          <option key={c.id} value={c.id}>{c.code} — {c.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Résolue */}
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 py-0">
                      <input
                        type="checkbox"
                        name="resolue"
                        className="checkbox checkbox-success"
                        checked={formData.resolue}
                        onChange={handleChange}
                      />
                      <div>
                        <span className="label-text font-medium">Alerte résolue</span>
                        <p className="text-xs text-base-content/50 mt-0.5">
                          Cochez si cette alerte a été traitée
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
              formData.niveau === 'critique' ? 'bg-error/5 border-error/30' :
              formData.niveau === 'avertissement' ? 'bg-warning/5 border-warning/30' :
              'bg-info/5 border-info/30'
            }`}>
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg bg-${niveauSelectionne?.color}/20 flex items-center justify-center`}>
                      <NiveauIcon className={`w-6 h-6 text-${niveauSelectionne?.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium text-${niveauSelectionne?.color} uppercase`}>
                        {niveauSelectionne?.label}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.titre || 'Titre de l\'alerte'}
                      </p>
                    </div>
                  </div>

                  {formData.message && (
                    <>
                      <div className="divider my-3"></div>
                      <p className="text-xs text-base-content/70 line-clamp-4">
                        {formData.message}
                      </p>
                    </>
                  )}

                  <div className="divider my-3"></div>

                  <span className={`badge badge-sm ${
                    formData.resolue ? 'badge-success' : 'badge-warning'
                  }`}>
                    {formData.resolue ? 'Résolue' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <InfoIcon className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Quand utiliser les alertes ?</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li>• <strong>Info</strong> : notifications normales</li>
                      <li>• <strong>Avertissement</strong> : attention requise (stock bas, etc.)</li>
                      <li>• <strong>Critique</strong> : action urgente (solde négatif, etc.)</li>
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
            <button type="button" onClick={() => navigate('/alertes-tresorerie')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer l\'alerte'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AlerteTresorerieForm;