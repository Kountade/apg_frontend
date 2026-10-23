// src/components/achats/DevisFournisseurForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus,
  FileText, Building2, DollarSign, Trash2, Eye, Info, Package,
  Calendar
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS = [
  { value: 'recu',     label: 'Reçu' },
  { value: 'en_etude', label: 'En étude' },
  { value: 'accepte',  label: 'Accepté' },
  { value: 'refuse',   label: 'Refusé' },
  { value: 'expire',   label: 'Expiré' },
];

const DevisFournisseurForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [fournisseurs, setFournisseurs] = useState([]);
  const [demandesAchat, setDemandesAchat] = useState([]);

  const aujourdhui = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    numero: '',
    numero_devis_fournisseur: '',
    fournisseur: searchParams.get('fournisseur') || '',
    demande_achat: searchParams.get('demande_achat') || '',
    date_devis: aujourdhui,
    date_validite: '',
    objet: '',
    notes: '',
    taux_tva: 18,
    delai_livraison_jours: 7,
    statut: 'recu',
  });

  const [lignes, setLignes] = useState([]);

  useEffect(() => {
    chargerDonnees();
    if (estEdition) {
      chargerDevis();
    } else {
      setChargementInitial(false);
    }
  }, [id]);

  const chargerDonnees = async () => {
    try {
      const [fourRes, daRes] = await Promise.all([
        AxiosInstance.get('/fournisseurs/?statut=actif&page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/demandes-achat/?statut=validee&page_size=200').catch(() => ({ data: [] })),
      ]);
      setFournisseurs(fourRes.data.results || fourRes.data || []);
      setDemandesAchat(daRes.data.results || daRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerDevis = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/devis-fournisseurs/${id}/`);
      const d = res.data;
      setFormData({
        numero: d.numero || '',
        numero_devis_fournisseur: d.numero_devis_fournisseur || '',
        fournisseur: d.fournisseur || '',
        demande_achat: d.demande_achat || '',
        date_devis: d.date_devis || aujourdhui,
        date_validite: d.date_validite || '',
        objet: d.objet || '',
        notes: d.notes || '',
        taux_tva: d.taux_tva || 18,
        delai_livraison_jours: d.delai_livraison_jours || 7,
        statut: d.statut || 'recu',
      });
      const lignesData = (d.lignes || []).map(l => ({
        id: l.id,
        designation: l.designation || '',
        quantite: l.quantite || 1,
        unite: l.unite || 'unité',
        prix_unitaire: l.prix_unitaire || 0,
      }));
      setLignes(lignesData);
    } catch (err) {
      setErreur('Impossible de charger le devis');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLigneChange = (index, field, value) => {
    setLignes(prev => {
      const copie = [...prev];
      copie[index] = { ...copie[index], [field]: value };
      return copie;
    });
  };

  const ajouterLigne = () => {
    setLignes(prev => [...prev, {
      designation: '',
      quantite: 1,
      unite: 'unité',
      prix_unitaire: 0,
    }]);
  };

  const supprimerLigne = (index) => {
    setLignes(prev => prev.filter((_, i) => i !== index));
  };

  // Calculs
  const montantHT = lignes.reduce((s, l) => {
    return s + Number(l.quantite || 0) * Number(l.prix_unitaire || 0);
  }, 0);
  const montantTVA = montantHT * (Number(formData.taux_tva || 0) / 100);
  const montantTTC = montantHT + montantTVA;

  const formaterMontant = (m) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    if (lignes.length === 0) {
      setErreur('Ajoutez au moins une ligne au devis.');
      setChargement(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        montant_ht: montantHT,
        lignes: undefined,
      };
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === null) {
          if (['demande_achat', 'date_validite'].includes(k)) {
            payload[k] = null;
          } else if (k !== 'numero') {
            delete payload[k];
          }
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/devis-fournisseurs/${id}/`, payload);
        for (const ligne of lignes) {
          const linePayload = {
            designation: ligne.designation,
            quantite: ligne.quantite,
            unite: ligne.unite,
            prix_unitaire: ligne.prix_unitaire,
          };
          if (ligne.id) {
            await AxiosInstance.patch(`/lignes-devis-fournisseur/${ligne.id}/`, linePayload);
          } else {
            await AxiosInstance.post('/lignes-devis-fournisseur/', {
              ...linePayload,
              devis: id,
            });
          }
        }
        setSucces(true);
        setTimeout(() => navigate(`/devis-fournisseurs/${id}`), 1200);
      } else {
        const res = await AxiosInstance.post('/devis-fournisseurs/', payload);
        const devisId = res.data.id;

        for (const ligne of lignes) {
          await AxiosInstance.post('/lignes-devis-fournisseur/', {
            devis: devisId,
            designation: ligne.designation,
            quantite: ligne.quantite,
            unite: ligne.unite,
            prix_unitaire: ligne.prix_unitaire,
          });
        }

        setSucces(true);
        setTimeout(() => navigate(`/devis-fournisseurs/${devisId}`), 1200);
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
          <button
            onClick={() => navigate('/devis-fournisseurs')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Achats / Devis / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <FileText className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier le devis' : 'Nouveau devis fournisseur'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Devis enregistré !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
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
                        <span className="label-text text-sm font-medium">Numéro interne</span>
                      </label>
                      <input
                        type="text"
                        name="numero"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero}
                        onChange={handleChange}
                        placeholder="Auto-généré"
                        readOnly
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          N° devis fournisseur
                        </span>
                      </label>
                      <input
                        type="text"
                        name="numero_devis_fournisseur"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_devis_fournisseur}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Référence du fournisseur"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Fournisseur <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="fournisseur"
                        className="select select-bordered w-full"
                        value={formData.fournisseur}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner —</option>
                        {fournisseurs.map(f => (
                          <option key={f.id} value={f.id}>
                            [{f.code}] {f.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Demande d'achat liée
                        </span>
                      </label>
                      <select
                        name="demande_achat"
                        className="select select-bordered w-full"
                        value={formData.demande_achat || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Aucune —</option>
                        {demandesAchat.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.numero} — {d.objet}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Objet <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="objet"
                      className="input input-bordered w-full"
                      value={formData.objet}
                      onChange={handleChange}
                      required
                      maxLength="300"
                      placeholder="Ex : Achat de gants de protection"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date devis <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_devis"
                        className="input input-bordered w-full"
                        value={formData.date_devis}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date validité</span>
                      </label>
                      <input
                        type="date"
                        name="date_validite"
                        className="input input-bordered w-full"
                        value={formData.date_validite}
                        onChange={handleChange}
                      />
                    </div>
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
                        {STATUTS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lignes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">Lignes du devis</h2>
                  </div>
                  <span className="badge badge-ghost badge-sm">
                    {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="p-5">
                  {lignes.length === 0 ? (
                    <div className="text-center py-8 text-base-content/40">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune ligne. Cliquez sur « Ajouter une ligne ».</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lignes.map((ligne, index) => (
                        <div key={index} className="card bg-base-200/50 border border-base-300">
                          <div className="card-body p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="badge badge-primary badge-sm">Ligne {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => supprimerLigne(index)}
                                className="btn btn-ghost btn-xs text-error"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="form-control w-full">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">
                                  Désignation <span className="text-error">*</span>
                                </span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                value={ligne.designation}
                                onChange={(e) =>
                                  handleLigneChange(index, 'designation', e.target.value)
                                }
                                required
                                maxLength="300"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="form-control w-full">
                                <label className="label py-0 pb-1">
                                  <span className="label-text text-xs font-medium">Quantité</span>
                                </label>
                                <input
                                  type="number"
                                  className="input input-bordered input-sm w-full font-mono"
                                  value={ligne.quantite}
                                  onChange={(e) =>
                                    handleLigneChange(index, 'quantite', e.target.value)
                                  }
                                  min="0.01"
                                  step="0.01"
                                />
                              </div>
                              <div className="form-control w-full">
                                <label className="label py-0 pb-1">
                                  <span className="label-text text-xs font-medium">Unité</span>
                                </label>
                                <input
                                  type="text"
                                  className="input input-bordered input-sm w-full"
                                  value={ligne.unite}
                                  onChange={(e) =>
                                    handleLigneChange(index, 'unite', e.target.value)
                                  }
                                  maxLength="30"
                                />
                              </div>
                              <div className="form-control w-full">
                                <label className="label py-0 pb-1">
                                  <span className="label-text text-xs font-medium">
                                    Prix unitaire (GNF)
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  className="input input-bordered input-sm w-full font-mono"
                                  value={ligne.prix_unitaire}
                                  onChange={(e) =>
                                    handleLigneChange(index, 'prix_unitaire', e.target.value)
                                  }
                                  min="0"
                                  step="100"
                                />
                              </div>
                            </div>

                            <div className="text-right text-xs font-mono">
                              Sous-total :{' '}
                              <span className="font-bold text-success">
                                {formaterMontant(
                                  Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={ajouterLigne}
                    className="btn btn-outline btn-sm w-full mt-4 gap-2"
                  >
                    <Plus className="w-4 h-4" /> Ajouter une ligne
                  </button>
                </div>
              </div>
            </div>

            {/* Paramètres financiers */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Paramètres financiers</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Taux TVA (%)</span>
                      </label>
                      <input
                        type="number"
                        name="taux_tva"
                        className="input input-bordered w-full font-mono"
                        value={formData.taux_tva}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Délai livraison (jours)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="delai_livraison_jours"
                        className="input input-bordered w-full"
                        value={formData.delai_livraison_jours}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
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
                      rows="2"
                      placeholder="Notes internes..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* APERÇU */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-gradient-to-br from-success/5 to-success/10 border border-success/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-success" />
                  <h3 className="font-semibold text-sm">Totaux</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Montant HT :</span>
                    <span className="font-mono font-bold">{formaterMontant(montantHT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">
                      TVA ({formData.taux_tva}%) :
                    </span>
                    <span className="font-mono">{formaterMontant(montantTVA)}</span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-success uppercase font-bold text-xs">Montant TTC</span>
                    <span className="font-mono font-bold text-lg text-success">
                      {formaterMontant(montantTTC)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <p className="font-mono text-xs text-base-content/50">
                    {formData.numero || 'DEV-FOU-AUTO'}
                  </p>
                  <p className="font-bold text-sm mt-1 truncate">
                    {formData.objet || 'Objet du devis'}
                  </p>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Fournisseur :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {fournisseurs.find(f => String(f.id) === String(formData.fournisseur))?.nom || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Lignes :</span>
                      <span className="font-bold">{lignes.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">À savoir</p>
                    <p className="text-base-content/70">
                      Les montants HT, TVA et TTC sont calculés automatiquement côté serveur.
                      Le devis pourra être accepté depuis la fiche détail.
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
              onClick={() => navigate('/devis-fournisseurs')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[160px]"
              disabled={chargement}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le devis'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DevisFournisseurForm;