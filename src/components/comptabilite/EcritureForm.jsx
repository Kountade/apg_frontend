// components/comptabilite/EcritureForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, BookOpen, Calendar, Hash, RefreshCw, Trash2,
  Calculator, Eye, Info, FileText, Scale, AlertTriangle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const EcritureForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const ecritureId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    numero: '',
    journal: '',
    date_ecriture: new Date().toISOString().split('T')[0],
    libelle: '',
    reference: '',
    statut: 'brouillon',
  });

  const [numeroModifieManuellement, setNumeroModifieManuellement] = useState(false);
  const [journaux, setJournaux] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [lignes, setLignes] = useState([]);

  useEffect(() => {
    chargerDonneesReference();
    if (estEdition && ecritureId) {
      chargerEcriture(ecritureId);
    } else {
      chargerProchainNumero();
    }
  }, [id]);

  const chargerDonneesReference = async () => {
    try {
      const [jrRes, cpRes] = await Promise.all([
        AxiosInstance.get('/journaux/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-comptables/').catch(() => ({ data: [] })),
      ]);
      setJournaux(jrRes.data.results || jrRes.data || []);
      setComptes(cpRes.data.results || cpRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerProchainNumero = async () => {
    setChargementNumero(true);
    try {
      const res = await AxiosInstance.get('/ecritures-comptables/prochain_numero/').catch(() => ({ data: {} }));
      if (res.data?.numero) {
        setFormData(prev => ({ ...prev, numero: res.data.numero }));
        setNumeroModifieManuellement(false);
      }
    } catch (err) {
      const year = new Date().getFullYear();
      setFormData(prev => ({ ...prev, numero: `ECR-${year}-000001` }));
    } finally {
      setChargementNumero(false);
    }
  };

  const chargerEcriture = async (eid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/ecritures-comptables/${eid}/`);
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        journal: data.journal || '',
        date_ecriture: data.date_ecriture || '',
        libelle: data.libelle || '',
        reference: data.reference || '',
        statut: data.statut || 'brouillon',
      });
      setLignes(data.lignes || []);
      setNumeroModifieManuellement(true);
    } catch (err) {
      setErreur('Impossible de charger l\'écriture');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'numero') setNumeroModifieManuellement(true);
  };

  const regenererNumero = async () => {
    setNumeroModifieManuellement(false);
    await chargerProchainNumero();
  };

  // ============================================================
  // Lignes débit/crédit
  // ============================================================
  const ajouterLigne = () => {
    setLignes([...lignes, {
      compte: '',
      libelle: '',
      debit: 0,
      credit: 0,
    }]);
  };

  const supprimerLigne = (index) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const modifierLigne = (index, field, value) => {
    const nouvellesLignes = [...lignes];
    nouvellesLignes[index] = { ...nouvellesLignes[index], [field]: value };
    setLignes(nouvellesLignes);
  };

  const totalDebit = lignes.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lignes.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const equilibree = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (key === 'journal') dataToSend[key] = null;
          else if (key === 'numero') { /* garder */ }
          else delete dataToSend[key];
        }
      });

      if (!dataToSend.numero) delete dataToSend.numero;

      let ecritureCreee;
      if (estEdition) {
        const res = await AxiosInstance.patch(`/ecritures-comptables/${ecritureId}/`, dataToSend);
        ecritureCreee = res.data;
      } else {
        const res = await AxiosInstance.post('/ecritures-comptables/', dataToSend);
        ecritureCreee = res.data;
      }

      setSucces(true);
      setTimeout(() => navigate(`/ecritures-comptables/${ecritureCreee.id || ecritureId}`), 1200);
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

  const journalSelectionne = journaux.find(j => String(j.id) === String(formData.journal));

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/ecritures-comptables')} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Comptabilité / Écritures / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${formData.numero}` : 'Nouvelle écriture'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Écriture {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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
                      <div className="join w-full">
                        <input
                          type="text"
                          name="numero"
                          className="input input-bordered join-item w-full font-mono"
                          value={formData.numero}
                          onChange={handleChange}
                          required
                          placeholder="ECR-2026-000001"
                        />
                        <button
                          type="button"
                          onClick={regenererNumero}
                          className="btn btn-outline join-item gap-2"
                          disabled={chargementNumero}
                        >
                          {chargementNumero ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Auto
                        </button>
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Journal <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="journal"
                        className="select select-bordered w-full"
                        value={formData.journal}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner un journal —</option>
                        {journaux.map(j => (
                          <option key={j.id} value={j.id}>{j.code} — {j.libelle}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_ecriture"
                        className="input input-bordered w-full"
                        value={formData.date_ecriture}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Référence</span>
                      </label>
                      <input
                        type="text"
                        name="reference"
                        className="input input-bordered w-full font-mono"
                        value={formData.reference}
                        onChange={handleChange}
                        placeholder="FACT-2026-000001"
                      />
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
                      onChange={handleChange}
                      required
                      placeholder="Facturation client XYZ"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lignes débit/crédit */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Lignes débit / crédit</h2>
                  <button
                    type="button"
                    onClick={ajouterLigne}
                    className="btn btn-xs btn-primary ml-auto gap-1"
                  >
                    <Plus className="w-3 h-3" /> Ajouter une ligne
                  </button>
                </div>

                <div className="p-5">
                  {lignes.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-base-300 rounded-lg">
                      <Scale className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
                      <p className="text-base-content/60 mb-3">Aucune ligne d'écriture</p>
                      <button
                        type="button"
                        onClick={ajouterLigne}
                        className="btn btn-sm btn-primary gap-2"
                      >
                        <Plus className="w-4 h-4" /> Ajouter une première ligne
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lignes.map((ligne, index) => (
                        <div key={index} className="p-4 rounded-lg border border-base-300 bg-base-200/30">
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-12 md:col-span-4">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Compte</span>
                              </label>
                              <select
                                className="select select-bordered select-sm w-full font-mono"
                                value={ligne.compte}
                                onChange={(e) => modifierLigne(index, 'compte', e.target.value)}
                              >
                                <option value="">— Compte —</option>
                                {comptes.map(c => (
                                  <option key={c.id} value={c.id}>{c.numero} — {c.libelle}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-12 md:col-span-3">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Libellé</span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                value={ligne.libelle}
                                onChange={(e) => modifierLigne(index, 'libelle', e.target.value)}
                              />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Débit</span>
                              </label>
                              <input
                                type="number"
                                className="input input-bordered input-sm w-full font-mono"
                                value={ligne.debit}
                                onChange={(e) => modifierLigne(index, 'debit', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Crédit</span>
                              </label>
                              <input
                                type="number"
                                className="input input-bordered input-sm w-full font-mono"
                                value={ligne.credit}
                                onChange={(e) => modifierLigne(index, 'credit', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="col-span-12 md:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => supprimerLigne(index)}
                                className="btn btn-ghost btn-sm text-error"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Récapitulatif équilibre */}
                  {lignes.length > 0 && (
                    <div className={`mt-4 p-4 rounded-lg ${equilibree ? 'bg-success/10 border border-success/30' : 'bg-error/10 border border-error/30'}`}>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-base-content/60 text-xs uppercase">Total Débit</span>
                          <p className="font-mono font-bold">{new Intl.NumberFormat('fr-FR').format(totalDebit)} GNF</p>
                        </div>
                        <div>
                          <span className="text-base-content/60 text-xs uppercase">Total Crédit</span>
                          <p className="font-mono font-bold">{new Intl.NumberFormat('fr-FR').format(totalCredit)} GNF</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {equilibree ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-success" />
                              <span className="font-bold text-success">Équilibrée</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-5 h-5 text-error" />
                              <span className="font-bold text-error">
                                Écart : {new Intl.NumberFormat('fr-FR').format(Math.abs(totalDebit - totalCredit))} GNF
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                  <p className="font-mono text-xs text-base-content/50">{formData.numero || 'ECR-2026-...'}</p>
                  <p className="font-bold text-sm mt-1 truncate">{formData.libelle || 'Libellé'}</p>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Journal :</span>
                      <span className="font-mono">{journalSelectionne?.code || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Date :</span>
                      <span>{formData.date_ecriture ? new Date(formData.date_ecriture).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Lignes :</span>
                      <span>{lignes.length}</span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <span className={`badge badge-sm ${formData.statut === 'validee' ? 'badge-success' : 'badge-ghost'}`}>
                    {formData.statut}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Statut</span>
                </label>
                <select
                  name="statut"
                  className="select select-bordered w-full"
                  value={formData.statut}
                  onChange={handleChange}
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="validee">Validée</option>
                  <option value="lettree">Lettrée</option>
                  <option value="annulee">Annulée</option>
                </select>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Partie double</p>
                    <p className="text-base-content/70">
                      Le <strong>total débit</strong> doit être égal au <strong>total crédit</strong>.
                      Une écriture non équilibrée ne peut pas être validée.
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
            <button type="button" onClick={() => navigate('/ecritures-comptables')} className="btn btn-ghost" disabled={chargement}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer l\'écriture'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EcritureForm;