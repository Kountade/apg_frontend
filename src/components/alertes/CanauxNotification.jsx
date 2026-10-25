// src/components/alertes/CanauxNotification.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Loader2, AlertCircle, RefreshCw, Plus, Edit, Trash2,
  X, Save, Info, Mail, MessageSquare, Smartphone, Bell,
  ArrowLeft, CheckCircle, XCircle, Settings2
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  email:    { label: 'Email',              color: 'primary', icon: Mail },
  sms:      { label: 'SMS',                color: 'warning', icon: MessageSquare },
  push:     { label: 'Notification push',  color: 'info',    icon: Bell },
  in_app:   { label: 'Notification in-app', color: 'success', icon: Bell },
  whatsapp: { label: 'WhatsApp',           color: 'secondary', icon: Smartphone },
};

const CanauxNotification = () => {
  const [canaux, setCanaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [canalEdite, setCanalEdite] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'email',
    configuration: '{}',
    actif: true,
    ordre: 0,
  });
  const [chargementAction, setChargementAction] = useState(false);
  const [erreurModal, setErreurModal] = useState(null);

  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [canalSupprime, setCanalSupprime] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/alertes-canaux/?page_size=500');
      const data = res.data.results || res.data || [];
      setCanaux(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les canaux de notification');
    } finally {
      setChargement(false);
    }
  };

  const ouvrirCreation = () => {
    setCanalEdite(null);
    setFormData({
      nom: '',
      type: 'email',
      configuration: '{}',
      actif: true,
      ordre: canaux.length,
    });
    setErreurModal(null);
    setShowModal(true);
  };

  const ouvrirEdition = (canal) => {
    setCanalEdite(canal);
    setFormData({
      nom: canal.nom,
      type: canal.type,
      configuration: JSON.stringify(canal.configuration || {}, null, 2),
      actif: canal.actif,
      ordre: canal.ordre,
    });
    setErreurModal(null);
    setShowModal(true);
  };

  const sauvegarder = async (e) => {
    e.preventDefault();
    setChargementAction(true);
    setErreurModal(null);

    // Valider le JSON
    let configJSON;
    try {
      configJSON = JSON.parse(formData.configuration || '{}');
    } catch {
      setErreurModal('La configuration doit être un JSON valide.');
      setChargementAction(false);
      return;
    }

    const payload = {
      nom: formData.nom,
      type: formData.type,
      configuration: configJSON,
      actif: formData.actif,
      ordre: formData.ordre,
    };

    try {
      if (canalEdite) {
        const res = await AxiosInstance.patch(`/alertes-canaux/${canalEdite.id}/`, payload);
        setCanaux(canaux.map(c => c.id === canalEdite.id ? res.data : c));
      } else {
        const res = await AxiosInstance.post('/alertes-canaux/', payload);
        setCanaux([...canaux, res.data]);
      }
      setShowModal(false);
    } catch (err) {
      if (err.response?.data) {
        const errors = Object.entries(err.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        setErreurModal(errors);
      } else {
        setErreurModal("Erreur lors de l'enregistrement");
      }
    } finally {
      setChargementAction(false);
    }
  };

  const supprimer = async () => {
    if (!canalSupprime) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/alertes-canaux/${canalSupprime.id}/`);
      setCanaux(canaux.filter(c => c.id !== canalSupprime.id));
      setShowModalSuppression(false);
      setCanalSupprime(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const toggleActif = async (canal) => {
    try {
      const res = await AxiosInstance.patch(
        `/alertes-canaux/${canal.id}/`,
        { actif: !canal.actif }
      );
      setCanaux(canaux.map(c => c.id === canal.id ? res.data : c));
    } catch (err) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={charger} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <Link to="/alertes" className="hover:text-primary flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Alertes
            </Link>
            <span>/</span>
            <span>Canaux de notification</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Send className="w-8 h-8 text-primary" />
            Canaux de notification
          </h1>
          <p className="text-base-content/60 mt-1">
            {canaux.length} canal{canaux.length > 1 ? 'ux' : ''} configuré{canaux.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={ouvrirCreation} className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau canal
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="alert alert-info mb-6">
        <Info className="w-5 h-5" />
        <div className="text-xs">
          <p className="font-bold">Comment ça marche ?</p>
          <p>
            Les canaux définissent comment les alertes sont envoyées (email, SMS, WhatsApp, etc.).
            Pour chaque canal, renseignez la configuration nécessaire (SMTP, API key, etc.) au format JSON.
          </p>
        </div>
      </div>

      {/* LISTE */}
      {canaux.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Send className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun canal configuré</p>
          <button onClick={ouvrirCreation} className="btn btn-primary mt-4">
            Créer un canal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canaux.map(canal => {
            const typeCfg = TYPES_CONFIG[canal.type] || TYPES_CONFIG.in_app;
            const Icon = typeCfg.icon;
            return (
              <div
                key={canal.id}
                className={`card shadow-sm border ${
                  canal.actif ? 'bg-base-100 border-base-300' : 'bg-base-200/50 border-base-content/10 opacity-75'
                }`}
              >
                <div className="card-body p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-lg bg-${typeCfg.color}/10 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 text-${typeCfg.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{canal.nom}</p>
                        <p className="text-xs text-base-content/60">
                          {typeCfg.label} · Priorité {canal.ordre}
                        </p>
                      </div>
                    </div>
                    <span className={`badge badge-sm ${canal.actif ? 'badge-success' : 'badge-ghost'}`}>
                      {canal.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {canal.configuration && Object.keys(canal.configuration).length > 0 && (
                    <div className="mt-2 p-2 bg-base-200/50 rounded text-xs font-mono max-h-20 overflow-y-auto">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(canal.configuration, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-200">
                    <label className="label cursor-pointer gap-2 p-0">
                      <span className="label-text text-xs">Actif</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-success toggle-sm"
                        checked={canal.actif}
                        onChange={() => toggleActif(canal)}
                      />
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => ouvrirEdition(canal)}
                        className="btn btn-ghost btn-xs gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Modifier
                      </button>
                      <button
                        onClick={() => { setCanalSupprime(canal); setShowModalSuppression(true); }}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL ÉDITION / CRÉATION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {canalEdite ? 'Modifier le canal' : 'Nouveau canal'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle">
                <X className="w-4 h-4" />
              </button>
            </div>

            {erreurModal && (
              <div className="alert alert-error mb-4 py-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">{erreurModal}</span>
              </div>
            )}

            <form onSubmit={sauvegarder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">
                      Nom <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    className="input input-bordered w-full"
                    value={formData.nom}
                    onChange={handleFormChange}
                    required
                    maxLength="100"
                    placeholder="Ex : SMTP Principal"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">
                      Type <span className="text-error">*</span>
                    </span>
                  </label>
                  <select
                    name="type"
                    className="select select-bordered w-full"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                  >
                    {Object.entries(TYPES_CONFIG).map(([k, c]) => (
                      <option key={k} value={k}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">
                    Configuration (JSON)
                  </span>
                </label>
                <textarea
                  name="configuration"
                  className="textarea textarea-bordered w-full font-mono text-xs"
                  value={formData.configuration}
                  onChange={handleFormChange}
                  rows="6"
                  placeholder='{"host": "smtp.gmail.com", "port": 587}'
                ></textarea>
                <label className="label py-0 pt-1">
                  <span className="label-text-alt text-xs text-base-content/50">
                    Format JSON valide (objet). Exemples selon le type.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">Ordre de priorité</span>
                  </label>
                  <input
                    type="number"
                    name="ordre"
                    className="input input-bordered w-full font-mono"
                    value={formData.ordre}
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3 py-0 h-full items-center">
                    <input
                      type="checkbox"
                      name="actif"
                      className="checkbox checkbox-success"
                      checked={formData.actif}
                      onChange={handleFormChange}
                    />
                    <span className="label-text font-medium">Canal actif</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" className="btn flex-1" onClick={() => setShowModal(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary flex-1 gap-2" disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {canalEdite ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && canalSupprime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le canal</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{canalSupprime.nom}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimer} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanauxNotification;