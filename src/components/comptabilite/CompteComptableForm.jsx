// components/comptabilite/CompteComptableForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, Calculator, Hash, FileText, Layers, Grid3x3, Eye, Info
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CompteComptableForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const compteId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    libelle: '',
    classe: '1',
    compte_parent: '',
    type_compte: 'actif',
    actif: true,
    description: '',
  });

  const [comptesParents, setComptesParents] = useState([]);

  useEffect(() => {
    chargerComptesParents();
    if (estEdition && compteId) {
      chargerCompte(compteId);
    }
  }, [id]);

  const chargerComptesParents = async () => {
    try {
      const res = await AxiosInstance.get('/comptes-comptables/');
      const data = res.data.results || res.data || [];
      setComptesParents(data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerCompte = async (cid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/comptes-comptables/${cid}/`);
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        libelle: data.libelle || '',
        classe: data.classe || '1',
        compte_parent: data.compte_parent || '',
        type_compte: data.type_compte || 'actif',
        actif: data.actif !== undefined ? data.actif : true,
        description: data.description || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le compte');
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
          if (key === 'compte_parent') dataToSend[key] = null;
          else if (key !== 'actif') delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/comptes-comptables/${compteId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/plan-comptable'), 1200);
      } else {
        await AxiosInstance.post('/comptes-comptables/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/plan-comptable'), 1200);
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

  const CLASSES = [
    { value: '1', label: 'Classe 1 — Ressources durables' },
    { value: '2', label: 'Classe 2 — Actif immobilisé' },
    { value: '3', label: 'Classe 3 — Stocks' },
    { value: '4', label: 'Classe 4 — Tiers' },
    { value: '5', label: 'Classe 5 — Trésorerie' },
    { value: '6', label: 'Classe 6 — Charges' },
    { value: '7', label: 'Classe 7 — Produits' },
    { value: '8', label: 'Classe 8 — Autres charges/produits' },
  ];

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/plan-comptable')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Comptabilité / Plan comptable / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouveau compte comptable'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Compte {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
                          Numéro <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="numero"
                        className="input input-bordered w-full font-mono focus:input-primary"
                        value={formData.numero}
                        onChange={handleChange}
                        required
                        placeholder="401000"
                        maxLength="20"
                      />
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-base-content/50">
                          Format SYSCOHADA (6 chiffres)
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Classe <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="classe"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.classe}
                        onChange={handleChange}
                        required
                      >
                        {CLASSES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
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
                      className="input input-bordered w-full focus:input-primary"
                      value={formData.libelle}
                      onChange={handleChange}
                      required
                      placeholder="Fournisseurs"
                      maxLength="200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Type de compte</span>
                      </label>
                      <select
                        name="type_compte"
                        className="select select-bordered w-full"
                        value={formData.type_compte}
                        onChange={handleChange}
                        required
                      >
                        <option value="actif">Actif</option>
                        <option value="passif">Passif</option>
                        <option value="charge">Charge</option>
                        <option value="produit">Produit</option>
                        <option value="tresorerie">Trésorerie</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Compte parent</span>
                      </label>
                      <select
                        name="compte_parent"
                        className="select select-bordered w-full"
                        value={formData.compte_parent}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun (compte racine) —</option>
                        {comptesParents
                          .filter(c => !estEdition || String(c.id) !== String(compteId))
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.numero} — {c.libelle}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-base-content/40" />
                        Description
                      </span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full focus:textarea-primary"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Description du compte..."
                    ></textarea>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 py-0">
                      <input
                        type="checkbox"
                        name="actif"
                        className="checkbox checkbox-primary"
                        checked={formData.actif}
                        onChange={handleChange}
                      />
                      <div>
                        <span className="label-text font-medium">Compte actif</span>
                        <p className="text-xs text-base-content/50 mt-0.5">
                          Les comptes inactifs ne peuvent pas être utilisés dans les écritures
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
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary font-mono">
                        {formData.numero || '...'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {formData.libelle || 'Libellé du compte'}
                      </p>
                      <p className="text-xs text-base-content/50 mt-0.5">
                        Classe {formData.classe}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-between">
                    <span className={`badge badge-sm ${formData.actif ? 'badge-success' : 'badge-ghost'}`}>
                      {formData.actif ? 'Actif' : 'Inactif'}
                    </span>
                    <span className="badge badge-outline badge-sm capitalize">
                      {formData.type_compte}
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
                    <p className="font-medium text-info mb-1">SYSCOHADA</p>
                    <p className="text-base-content/70">
                      Le numéro de compte doit respecter la nomenclature SYSCOHADA :
                      <br />• <strong>Classe 1</strong> : 10xxxx à 19xxxx
                      <br />• <strong>Classe 4</strong> : 40xxxx à 49xxxx
                      <br />• <strong>Classe 5</strong> : 50xxxx à 59xxxx
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
              onClick={() => navigate('/plan-comptable')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le compte'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompteComptableForm;