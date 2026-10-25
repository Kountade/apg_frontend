// src/components/alertes/ConfigAlertes.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Loader2, AlertCircle, RefreshCw, Search, Filter,
  Plus, Edit, Trash2, Save, X, Info, AlertTriangle,
  AlertOctagon, CheckCircle, Bell, ArrowLeft, Calendar
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const GRAVITES_CONFIG = {
  info:     { label: 'Information',   color: 'info',    icon: Info },
  warning:  { label: 'Avertissement', color: 'warning', icon: AlertTriangle },
  error:    { label: 'Erreur',        color: 'error',   icon: AlertTriangle },
  critical: { label: 'Critique',      color: 'error',   icon: AlertOctagon },
};

const TYPES_LABELS = {
  stock_critique: 'Stock critique',
  stock_alerte: 'Stock en alerte',
  contrat_expirant: 'Contrat expirant',
  document_expirant: 'Document expirant',
  assurance_expirant: 'Assurance expirant',
  facture_impayee: 'Facture impayée',
  conge_en_attente: 'Congé en attente',
  paie_en_attente: 'Paie en attente',
  mission_en_cours: 'Mission en cours',
  incident_ouvert: 'Incident ouvert',
  permis_expire: 'Permis expiré',
  consommation_alerte: 'Consommation carburant élevée',
};

const ConfigAlertes = () => {
  const [configs, setConfigs] = useState([]);
  const [configsFiltrees, setConfigsFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreGravite, setFiltreGravite] = useState('all');

  // Modal édition
  const [showModal, setShowModal] = useState(false);
  const [configEditee, setConfigEditee] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    libelle: '',
    description: '',
    gravite: 'warning',
    seuil_jours: 30,
    seuil_valeur: 0,
    active: true,
  });
  const [chargementAction, setChargementAction] = useState(false);
  const [erreurModal, setErreurModal] = useState(null);

  // Modal suppression
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [configSupprimee, setConfigSupprimee] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/alertes-config/?page_size=500');
      const data = res.data.results || res.data || [];
      setConfigs(data);
      setConfigsFiltrees(data);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les configurations');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = configs;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.libelle?.toLowerCase().includes(terme) ||
        c.description?.toLowerCase().includes(terme) ||
        c.type?.toLowerCase().includes(terme)
      );
    }
    if (filtreGravite !== 'all') {
      filtre = filtre.filter(c => c.gravite === filtreGravite);
    }
    setConfigsFiltrees(filtre);
  }, [recherche, filtreGravite, configs]);

  // Ouvrir modal création
  const ouvrirCreation = () => {
    setConfigEditee(null);
    setFormData({
      type: '',
      libelle: '',
      description: '',
      gravite: 'warning',
      seuil_jours: 30,
      seuil_valeur: 0,
      active: true,
    });
    setErreurModal(null);
    setShowModal(true);
  };

  // Ouvrir modal édition
  const ouvrirEdition = (config) => {
    setConfigEditee(config);
    setFormData({
      type: config.type,
      libelle: config.libelle,
      description: config.description || '',
      gravite: config.gravite,
      seuil_jours: config.seuil_jours,
      seuil_valeur: config.seuil_valeur || 0,
      active: config.active,
    });
    setErreurModal(null);
    setShowModal(true);
  };

  // Sauvegarder
  const sauvegarder = async (e) => {
    e.preventDefault();
    setChargementAction(true);
    setErreurModal(null);

    try {
      if (configEditee) {
        // Édition
        const res = await AxiosInstance.patch(
          `/alertes-config/${configEditee.id}/`,
          formData
        );
        setConfigs(configs.map(c => c.id === configEditee.id ? res.data : c));
      } else {
        // Création
        const res = await AxiosInstance.post('/alertes-config/', formData);
        setConfigs([res.data, ...configs]);
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

  // Supprimer
  const supprimer = async () => {
    if (!configSupprimee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/alertes-config/${configSupprimee.id}/`);
      setConfigs(configs.filter(c => c.id !== configSupprimee.id));
      setShowModalSuppression(false);
      setConfigSupprimee(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // Toggle actif
  const toggleActif = async (config) => {
    try {
      const res = await AxiosInstance.patch(
        `/alertes-config/${config.id}/`,
        { active: !config.active }
      );
      setConfigs(configs.map(c => c.id === config.id ? res.data : c));
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

  const filtresActifs = recherche || filtreGravite !== 'all';

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
        <Link to="/alertes" className="btn btn-ghost mt-4 ml-2 gap-2">
          <ArrowLeft className="w-4 h-4" /> Alertes
        </Link>
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
            <span>Configuration</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Configuration des alertes
          </h1>
          <p className="text-base-content/60 mt-1">
            {configsFiltrees.length} configuration{configsFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && configs.length !== configsFiltrees.length && (
              <span className="text-base-content/40"> (sur {configs.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={ouvrirCreation} className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle configuration
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="alert alert-info mb-6">
        <Info className="w-5 h-5" />
        <div className="text-xs">
          <p className="font-bold">Comment ça marche ?</p>
          <p>
            Les configurations définissent les seuils et gravités des alertes calculées à la volée.
            Modifiez ces valeurs pour ajuster le comportement du système (ex : alerter 30 jours avant expiration).
          </p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreGravite}
              onChange={(e) => setFiltreGravite(e.target.value)}
            >
              <option value="all">Toutes gravités</option>
              {Object.entries(GRAVITES_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => { setRecherche(''); setFiltreGravite('all'); }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {configsFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Settings className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucune configuration ne correspond' : 'Aucune configuration'}
          </p>
          <button onClick={ouvrirCreation} className="btn btn-primary mt-4">
            Créer une configuration
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Type</th>
                <th className="text-xs uppercase">Libellé</th>
                <th className="text-xs uppercase">Gravité</th>
                <th className="text-xs uppercase text-right">Seuil jours</th>
                <th className="text-xs uppercase text-right">Seuil valeur</th>
                <th className="text-xs uppercase text-center">Active</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configsFiltrees.map(c => {
                const gravCfg = GRAVITES_CONFIG[c.gravite] || GRAVITES_CONFIG.warning;
                const GravIcon = gravCfg.icon;
                return (
                  <tr key={c.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <span className="font-mono text-xs text-base-content/60">
                        {c.type}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm">{c.libelle}</p>
                      {c.description && (
                        <p className="text-xs text-base-content/50 truncate max-w-[300px]">
                          {c.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${gravCfg.color} badge-sm gap-1`}>
                        <GravIcon className="w-3 h-3" /> {gravCfg.label}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs">{c.seuil_jours} j</span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs">
                        {Number(c.seuil_valeur) > 0
                          ? new Intl.NumberFormat('fr-FR').format(Number(c.seuil_valeur))
                          : '—'}
                      </span>
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="toggle toggle-success toggle-sm"
                        checked={c.active}
                        onChange={() => toggleActif(c)}
                      />
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => ouvrirEdition(c)}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setConfigSupprimee(c); setShowModalSuppression(true); }}
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL ÉDITION / CRÉATION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {configEditee ? 'Modifier la configuration' : 'Nouvelle configuration'}
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
                      Type <span className="text-error">*</span>
                    </span>
                  </label>
                  <select
                    name="type"
                    className="select select-bordered w-full"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                    disabled={Boolean(configEditee)}
                  >
                    <option value="">— Sélectionner —</option>
                    {Object.entries(TYPES_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">
                      Gravité <span className="text-error">*</span>
                    </span>
                  </label>
                  <select
                    name="gravite"
                    className="select select-bordered w-full"
                    value={formData.gravite}
                    onChange={handleFormChange}
                    required
                  >
                    {Object.entries(GRAVITES_CONFIG).map(([k, c]) => (
                      <option key={k} value={k}>{c.label}</option>
                    ))}
                  </select>
                </div>
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
                  className="input input-bordered w-full"
                  value={formData.libelle}
                  onChange={handleFormChange}
                  required
                  maxLength="200"
                  placeholder="Ex : Alerter 30 jours avant expiration d'un contrat"
                />
              </div>

              <div className="form-control w-full">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Description</span>
                </label>
                <textarea
                  name="description"
                  className="textarea textarea-bordered w-full"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="2"
                  placeholder="Description optionnelle..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">Seuil jours</span>
                  </label>
                  <input
                    type="number"
                    name="seuil_jours"
                    className="input input-bordered w-full font-mono"
                    value={formData.seuil_jours}
                    onChange={handleFormChange}
                    min="0"
                  />
                  <label className="label py-0 pt-1">
                    <span className="label-text-alt text-xs text-base-content/50">
                      Nombre de jours avant l'échéance
                    </span>
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">Seuil valeur</span>
                  </label>
                  <input
                    type="number"
                    name="seuil_valeur"
                    className="input input-bordered w-full font-mono"
                    value={formData.seuil_valeur}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                  />
                  <label className="label py-0 pt-1">
                    <span className="label-text-alt text-xs text-base-content/50">
                      0 = non utilisé
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3 py-0">
                  <input
                    type="checkbox"
                    name="active"
                    className="checkbox checkbox-success"
                    checked={formData.active}
                    onChange={handleFormChange}
                  />
                  <span className="label-text font-medium">Configuration active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" className="btn flex-1" onClick={() => setShowModal(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary flex-1 gap-2" disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {configEditee ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && configSupprimee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la configuration</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{configSupprimee.libelle}</strong> ?
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

export default ConfigAlertes;