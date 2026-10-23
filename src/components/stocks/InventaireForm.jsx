// src/components/stocks/InventaireForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle,
  ClipboardList, Warehouse, RefreshCw, Info, Eye
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const InventaireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementReference, setChargementReference] = useState(false);
  const [chargementArticles, setChargementArticles] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [magasins, setMagasins] = useState([]);
  const [formData, setFormData] = useState({
    reference: '',
    magasin: '',
    notes: '',
  });
  const [lignes, setLignes] = useState([]);

  useEffect(() => {
    chargerMagasins();
    if (estEdition) {
      chargerInventaire();
    } else {
      chargerProchaineReference();
      setChargementInitial(false);
    }
  }, [id]);

  const chargerMagasins = async () => {
    try {
      const res = await AxiosInstance.get('/magasins/?actif=true');
      setMagasins(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerProchaineReference = async () => {
    setChargementReference(true);
    try {
      const res = await AxiosInstance.get('/inventaires/prochaine_reference/');
      if (res.data?.reference) {
        setFormData(prev => ({ ...prev, reference: res.data.reference }));
      }
    } catch (err) {
      console.error('Erreur chargement référence:', err);
    } finally {
      setChargementReference(false);
    }
  };

  const chargerInventaire = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/inventaires/${id}/`);
      const data = res.data;
      setFormData({
        reference: data.reference || '',
        magasin: data.magasin || '',
        notes: data.notes || '',
      });
      const lignesData = (data.lignes || []).map(l => ({
        id: l.id,
        article: l.article,
        article_code: l.article_code,
        article_designation: l.article_designation,
        quantite_theorique: Number(l.quantite_theorique) || 0,
        quantite_comptee: Number(l.quantite_comptee) || 0,
        observation: l.observation || '',
      }));
      setLignes(lignesData);
    } catch (err) {
      setErreur("Impossible de charger l'inventaire");
    } finally {
      setChargementInitial(false);
    }
  };

  // ============================================================
  // CHARGER LES ARTICLES — OPTIMISÉ (2 requêtes)
  // ============================================================
  const chargerArticlesDuMagasin = async (magasinId) => {
    if (!magasinId) {
      setLignes([]);
      return;
    }
    setChargementArticles(true);
    try {
      const [artRes, stocksRes] = await Promise.all([
        AxiosInstance.get('/articles/?actif=true&page_size=500'),
        AxiosInstance.get(`/stocks-magasins/?magasin=${magasinId}&page_size=500`),
      ]);
      const articles = artRes.data.results || artRes.data || [];
      const stocks = stocksRes.data.results || stocksRes.data || [];

      const stockParArticle = {};
      stocks.forEach(s => {
        stockParArticle[s.article] = Number(s.quantite);
      });

      const lignesPreparees = articles.map(a => ({
        article: a.id,
        article_code: a.code,
        article_designation: a.designation,
        quantite_theorique: stockParArticle[a.id] || 0,
        quantite_comptee: stockParArticle[a.id] || 0,
        observation: '',
      }));

      setLignes(lignesPreparees);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les articles du magasin');
    } finally {
      setChargementArticles(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'magasin') {
      chargerArticlesDuMagasin(value);
    }
  };

  const handleLigneChange = (index, field, value) => {
    setLignes(prev => {
      const copie = [...prev];
      copie[index] = { ...copie[index], [field]: value };
      return copie;
    });
  };

  const ecartLigne = (ligne) =>
    Number(ligne.quantite_comptee || 0) - Number(ligne.quantite_theorique || 0);

  const totalEcarts = lignes.filter(l => ecartLigne(l) !== 0).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    if (!formData.magasin) {
      setErreur('Veuillez sélectionner un magasin.');
      setChargement(false);
      return;
    }
    if (lignes.length === 0) {
      setErreur('Aucune ligne à enregistrer.');
      setChargement(false);
      return;
    }

    try {
      if (estEdition) {
        await AxiosInstance.patch(`/inventaires/${id}/`, {
          notes: formData.notes,
        });
        for (const ligne of lignes) {
          if (ligne.id) {
            await AxiosInstance.patch(`/lignes-inventaire/${ligne.id}/`, {
              quantite_comptee: ligne.quantite_comptee,
              observation: ligne.observation,
            });
          }
        }
        setSucces(true);
        setTimeout(() => navigate(`/inventaire/${id}`), 1200);
      } else {
        const invRes = await AxiosInstance.post('/inventaires/', {
          reference: formData.reference,
          magasin: formData.magasin,
          notes: formData.notes,
        });
        const inventaireId = invRes.data.id;

        for (const ligne of lignes) {
          await AxiosInstance.post('/lignes-inventaire/', {
            inventaire: inventaireId,
            article: ligne.article,
            quantite_theorique: ligne.quantite_theorique,
            quantite_comptee: ligne.quantite_comptee,
            observation: ligne.observation || '',
          });
        }

        setSucces(true);
        setTimeout(() => navigate(`/inventaire/${inventaireId}`), 1200);
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
            onClick={() => navigate('/inventaire')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Stocks / Inventaires /{' '}
              <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <ClipboardList className="w-5 h-5 text-primary" />
              {estEdition ? "Modifier l'inventaire" : 'Nouvel inventaire'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Inventaire enregistré !</span>
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
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Référence <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="reference"
                          className="input input-bordered join-item w-full font-mono"
                          value={formData.reference}
                          onChange={handleChange}
                          required
                          readOnly={estEdition}
                        />
                        {!estEdition && (
                          <button
                            type="button"
                            onClick={chargerProchaineReference}
                            disabled={chargementReference}
                            className="btn btn-outline join-item"
                          >
                            {chargementReference ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Magasin <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="magasin"
                        className="select select-bordered w-full"
                        value={formData.magasin}
                        onChange={handleChange}
                        required
                        disabled={estEdition}
                      >
                        <option value="">— Sélectionner un magasin —</option>
                        {magasins.map(m => (
                          <option key={m.id} value={m.id}>{m.nom}</option>
                        ))}
                      </select>
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
                      placeholder="Observations générales..."
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
                    <Warehouse className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">Articles à compter</h2>
                  </div>
                  {lignes.length > 0 && (
                    <span className="badge badge-ghost badge-sm">
                      {lignes.length} article{lignes.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  {!formData.magasin ? (
                    <div className="text-center py-8 text-base-content/40">
                      <Warehouse className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sélectionnez un magasin pour charger les articles</p>
                    </div>
                  ) : chargementArticles ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : lignes.length === 0 ? (
                    <div className="text-center py-8 text-base-content/40">
                      <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucun article dans ce magasin</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <thead>
                          <tr className="border-b border-base-300">
                            <th className="text-xs uppercase">Code</th>
                            <th className="text-xs uppercase">Article</th>
                            <th className="text-xs uppercase text-right">Théorique</th>
                            <th className="text-xs uppercase text-right">Compté</th>
                            <th className="text-xs uppercase text-right">Écart</th>
                            <th className="text-xs uppercase">Observation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lignes.map((ligne, index) => {
                            const ecart = ecartLigne(ligne);
                            return (
                              <tr key={ligne.article} className="border-b border-base-200">
                                <td>
                                  <span className="font-mono text-xs font-bold">
                                    {ligne.article_code}
                                  </span>
                                </td>
                                <td>
                                  <p className="text-xs truncate max-w-[200px]">
                                    {ligne.article_designation}
                                  </p>
                                </td>
                                <td className="text-right">
                                  <span className="font-mono text-xs">
                                    {ligne.quantite_theorique}
                                  </span>
                                </td>
                                <td className="text-right">
                                  <input
                                    type="number"
                                    className="input input-bordered input-xs w-24 text-right font-mono"
                                    value={ligne.quantite_comptee}
                                    onChange={(e) =>
                                      handleLigneChange(index, 'quantite_comptee', e.target.value)
                                    }
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td className="text-right">
                                  <span
                                    className={`font-mono text-xs font-bold ${
                                      ecart > 0
                                        ? 'text-success'
                                        : ecart < 0
                                        ? 'text-error'
                                        : 'text-base-content/40'
                                    }`}
                                  >
                                    {ecart > 0 ? `+${ecart}` : ecart}
                                  </span>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="input input-bordered input-xs w-full"
                                    value={ligne.observation}
                                    onChange={(e) =>
                                      handleLigneChange(index, 'observation', e.target.value)
                                    }
                                    placeholder="—"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                    {formData.reference || 'RÉFÉRENCE'}
                  </p>
                  <p className="font-bold text-sm mt-1">
                    {magasins.find(m => String(m.id) === String(formData.magasin))?.nom || '—'}
                  </p>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Articles :</span>
                      <span className="font-bold">{lignes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Avec écart :</span>
                      <span className={`font-bold ${totalEcarts > 0 ? 'text-warning' : 'text-success'}`}>
                        {totalEcarts}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-warning/5 border border-warning/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">Important</p>
                    <p className="text-base-content/70">
                      Après validation (sur la page détail), les écarts génèrent automatiquement
                      des mouvements d'ajustement.
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
              onClick={() => navigate('/inventaire')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : "Créer l'inventaire"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InventaireForm;