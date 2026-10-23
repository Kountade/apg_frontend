// src/components/achats/DemandeAchatForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus,
  FilePlus, User, Briefcase, AlertTriangle, Trash2, Eye, Info, Package
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const URGENCES = [
  { value: 'basse',    label: 'Basse',    color: 'ghost' },
  { value: 'normale',  label: 'Normale',  color: 'info' },
  { value: 'haute',    label: 'Haute',    color: 'warning' },
  { value: 'critique', label: 'Critique', color: 'error' },
];

const DemandeAchatForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [employes, setEmployes] = useState([]);
  const [articles, setArticles] = useState([]);

  const aujourdhui = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    numero: '',
    objet: '',
    service: '',
    demandeur: '',
    urgence: 'normale',
    motif: '',
    date_souhaitee: '',
    notes: '',
  });

  const [lignes, setLignes] = useState([]);

  useEffect(() => {
    chargerDonnees();
    if (estEdition) {
      chargerDemande();
    } else {
      chargerProchainNumero();
      setChargementInitial(false);
    }
  }, [id]);

  const chargerDonnees = async () => {
    try {
      const [empRes, artRes] = await Promise.all([
        AxiosInstance.get('/employes/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/articles/?actif=true&page_size=500').catch(() => ({ data: [] })),
      ]);
      setEmployes(empRes.data.results || empRes.data || []);
      setArticles(artRes.data.results || artRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerProchainNumero = async () => {
    setChargementNumero(true);
    try {
      const res = await AxiosInstance.get('/demandes-achat/prochain_numero/').catch(() => ({ data: {} }));
      if (res.data?.numero) {
        setFormData(prev => ({ ...prev, numero: res.data.numero }));
      }
    } catch (err) {
      console.warn('Numéro auto indisponible, sera généré côté serveur.');
    } finally {
      setChargementNumero(false);
    }
  };

  const chargerDemande = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/demandes-achat/${id}/`);
      const d = res.data;
      setFormData({
        numero: d.numero || '',
        objet: d.objet || '',
        service: d.service || '',
        demandeur: d.demandeur || '',
        urgence: d.urgence || 'normale',
        motif: d.motif || '',
        date_souhaitee: d.date_souhaitee || '',
        notes: d.notes || '',
      });
      const lignesData = (d.lignes || []).map(l => ({
        id: l.id,
        designation: l.designation || '',
        description: l.description || '',
        quantite: l.quantite || 1,
        unite: l.unite || 'unité',
        prix_estime: l.prix_estime || 0,
        article_stock: l.article_stock || '',
        article_stock_code: l.article_stock_code || '',
        article_stock_designation: l.article_stock_designation || '',
      }));
      setLignes(lignesData);
    } catch (err) {
      setErreur('Impossible de charger la demande');
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
      // Si article_stock sélectionné, auto-remplir la désignation
      if (field === 'article_stock' && value) {
        const article = articles.find(a => String(a.id) === String(value));
        if (article) {
          copie[index].designation = article.designation;
          copie[index].prix_estime = article.prix_achat || 0;
          copie[index].article_stock_code = article.code;
          copie[index].article_stock_designation = article.designation;
        }
      }
      return copie;
    });
  };

  const ajouterLigne = () => {
    setLignes(prev => [...prev, {
      designation: '',
      description: '',
      quantite: 1,
      unite: 'unité',
      prix_estime: 0,
      article_stock: '',
      article_stock_code: '',
      article_stock_designation: '',
    }]);
  };

  const supprimerLigne = (index) => {
    setLignes(prev => prev.filter((_, i) => i !== index));
  };

  const montantTotal = lignes.reduce((s, l) => {
    return s + Number(l.quantite || 0) * Number(l.prix_estime || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    if (lignes.length === 0) {
      setErreur('Ajoutez au moins une ligne à la demande.');
      setChargement(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        lignes: undefined, // on n'envoie pas les lignes dans le header
      };
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === null) {
          if (['demandeur', 'date_souhaitee'].includes(k)) {
            payload[k] = null;
          } else {
            delete payload[k];
          }
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/demandes-achat/${id}/`, payload);
        // Mise à jour des lignes existantes (on supprime + recrée pour simplifier)
        for (const ligne of lignes) {
          const linePayload = {
            designation: ligne.designation,
            description: ligne.description || '',
            quantite: ligne.quantite,
            unite: ligne.unite,
            prix_estime: ligne.prix_estime,
            article_stock: ligne.article_stock || null,
          };
          if (ligne.id) {
            await AxiosInstance.patch(`/lignes-demande-achat/${ligne.id}/`, linePayload);
          } else {
            await AxiosInstance.post('/lignes-demande-achat/', {
              ...linePayload,
              demande: id,
            });
          }
        }
        setSucces(true);
        setTimeout(() => navigate(`/demandes-achat/${id}`), 1200);
      } else {
        const res = await AxiosInstance.post('/demandes-achat/', payload);
        const demandeId = res.data.id;

        for (const ligne of lignes) {
          await AxiosInstance.post('/lignes-demande-achat/', {
            demande: demandeId,
            designation: ligne.designation,
            description: ligne.description || '',
            quantite: ligne.quantite,
            unite: ligne.unite,
            prix_estime: ligne.prix_estime,
            article_stock: ligne.article_stock || null,
          });
        }

        setSucces(true);
        setTimeout(() => navigate(`/demandes-achat/${demandeId}`), 1200);
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
            onClick={() => navigate('/demandes-achat')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Achats / Demandes /{' '}
              <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <FilePlus className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier la demande' : "Nouvelle demande d'achat"}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Demande enregistrée !</span>
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
            {/* Informations */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FilePlus className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Numéro</span>
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
                          Urgence <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="urgence"
                        className="select select-bordered w-full"
                        value={formData.urgence}
                        onChange={handleChange}
                      >
                        {URGENCES.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
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
                      placeholder="Ex : Réapprovisionnement gants de protection"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Demandeur
                        </span>
                      </label>
                      <select
                        name="demandeur"
                        className="select select-bordered w-full"
                        value={formData.demandeur || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun —</option>
                        {employes.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.nom_complet || `Employé #${e.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Service</span>
                      </label>
                      <input
                        type="text"
                        name="service"
                        className="input input-bordered w-full"
                        value={formData.service}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Ex : Logistique"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date souhaitée
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_souhaitee"
                        className="input input-bordered w-full"
                        value={formData.date_souhaitee}
                        onChange={handleChange}
                        min={aujourdhui}
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Motif / Justification
                      </span>
                    </label>
                    <textarea
                      name="motif"
                      className="textarea textarea-bordered w-full"
                      value={formData.motif}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Pourquoi cette demande ?"
                    ></textarea>
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

            {/* Lignes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">Lignes de la demande</h2>
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
                              <span className="badge badge-primary badge-sm">
                                Ligne {index + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => supprimerLigne(index)}
                                className="btn btn-ghost btn-xs text-error"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="form-control w-full">
                                <label className="label py-0 pb-1">
                                  <span className="label-text text-xs font-medium">
                                    Article en stock (optionnel)
                                  </span>
                                </label>
                                <select
                                  className="select select-bordered select-sm w-full"
                                  value={ligne.article_stock || ''}
                                  onChange={(e) =>
                                    handleLigneChange(index, 'article_stock', e.target.value)
                                  }
                                >
                                  <option value="">— Aucun —</option>
                                  {articles.map(a => (
                                    <option key={a.id} value={a.id}>
                                      [{a.code}] {a.designation}
                                    </option>
                                  ))}
                                </select>
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
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="form-control w-full">
                                <label className="label py-0 pb-1">
                                  <span className="label-text text-xs font-medium">
                                    Quantité
                                  </span>
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
                              <div className="form-control w-full col-span-2">
                                <label className="label py-0 pb-1">
                                  <span className="label-text text-xs font-medium">
                                    Prix estimé (GNF)
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  className="input input-bordered input-sm w-full font-mono"
                                  value={ligne.prix_estime}
                                  onChange={(e) =>
                                    handleLigneChange(index, 'prix_estime', e.target.value)
                                  }
                                  min="0"
                                  step="100"
                                />
                              </div>
                            </div>

                            <div className="form-control w-full">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">Description</span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                value={ligne.description}
                                onChange={(e) =>
                                  handleLigneChange(index, 'description', e.target.value)
                                }
                                placeholder="Détails optionnels..."
                              />
                            </div>

                            <div className="text-right text-xs font-mono">
                              Sous-total :{' '}
                              <span className="font-bold text-success">
                                {new Intl.NumberFormat('fr-FR').format(
                                  Number(ligne.quantite || 0) * Number(ligne.prix_estime || 0)
                                )}{' '}
                                GNF
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
          </div>

          {/* APERÇU */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Résumé</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <p className="font-mono text-xs text-base-content/50">
                    {formData.numero || 'NUMÉRO'}
                  </p>
                  <p className="font-bold text-sm mt-1 truncate">
                    {formData.objet || 'Objet de la demande'}
                  </p>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Lignes :</span>
                      <span className="font-bold">{lignes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Urgence :</span>
                      <span className={`badge badge-${URGENCES.find(u => u.value === formData.urgence)?.color} badge-xs`}>
                        {URGENCES.find(u => u.value === formData.urgence)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Montant estimé :</span>
                      <span className="font-mono font-bold text-success">
                        {new Intl.NumberFormat('fr-FR').format(montantTotal)} GNF
                      </span>
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
                      La demande sera créée en <strong>brouillon</strong>. Vous pourrez
                      ensuite la <strong>soumettre</strong> puis la faire <strong>valider</strong>
                      depuis la fiche détail.
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
              onClick={() => navigate('/demandes-achat')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la demande'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DemandeAchatForm;