// src/components/stocks/MouvementStockForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus,
  TrendingUp, TrendingDown, ArrowLeftRight, Package, RefreshCw, Info,
  Eye, RotateCcw
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES = [
  { value: 'entree', label: 'Entrée', icon: TrendingUp, color: 'success' },
  { value: 'sortie', label: 'Sortie', icon: TrendingDown, color: 'error' },
  { value: 'transfert', label: 'Transfert', icon: ArrowLeftRight, color: 'info' },
  { value: 'ajustement', label: 'Ajustement', icon: RotateCcw, color: 'warning' },
];

const MOTIFS = [
  { value: 'achat', label: 'Achat', for: ['entree'] },
  { value: 'don', label: 'Don', for: ['entree'] },
  { value: 'retour_magasin', label: 'Retour au magasin', for: ['entree'] },
  { value: 'correction', label: 'Correction', for: ['entree', 'sortie', 'ajustement'] },
  { value: 'consommation', label: 'Consommation', for: ['sortie'] },
  { value: 'affectation', label: 'Affectation', for: ['sortie'] },
  { value: 'perte', label: 'Perte', for: ['sortie'] },
  { value: 'deterioration', label: 'Détérioration', for: ['sortie'] },
  { value: 'retour_fournisseur', label: 'Retour fournisseur', for: ['sortie'] },
  { value: 'transfert_magasin', label: 'Transfert magasin', for: ['transfert'] },
];

const MouvementStockForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementNumero, setChargementNumero] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [articles, setArticles] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [employes, setEmployes] = useState([]);

  const typeInitial = searchParams.get('type') || 'entree';
  const articleInitial = searchParams.get('article') || '';

  const [formData, setFormData] = useState({
    numero: '',
    type: typeInitial,
    motif: MOTIFS.find(m => m.for.includes(typeInitial))?.value || 'achat',
    article: articleInitial,
    quantite: '',
    prix_unitaire: 0,
    magasin_source: '',
    magasin_destination: '',
    beneficiaire: '',
    employe_beneficiaire: '',
    fournisseur_nom: '',
    reference: '',
    observation: '',
  });

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chargerDonnees = async () => {
    try {
      const [artRes, magRes, empRes] = await Promise.all([
        AxiosInstance.get('/articles/?actif=true').catch(() => ({ data: [] })),
        AxiosInstance.get('/magasins/?actif=true').catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);
      setArticles(artRes.data.results || artRes.data || []);
      setMagasins(magRes.data.results || magRes.data || []);
      setEmployes(empRes.data.results || empRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setChargementInitial(false);
    }
    chargerProchainNumero();
  };

  // ============================================================
  // CHARGER LE NUMÉRO AUTO
  // ============================================================
  const chargerProchainNumero = async () => {
    setChargementNumero(true);
    try {
      const res = await AxiosInstance.get('/mouvements-stock/prochain_numero/');
      if (res.data?.numero) {
        setFormData(prev => ({ ...prev, numero: res.data.numero }));
      }
    } catch (err) {
      console.error('Erreur chargement numéro:', err);
    } finally {
      setChargementNumero(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (newType) => {
    const premierMotif = MOTIFS.find(m => m.for.includes(newType))?.value || '';
    setFormData(prev => ({
      ...prev,
      type: newType,
      motif: premierMotif,
      magasin_source: newType === 'entree' ? '' : prev.magasin_source,
      magasin_destination: newType === 'sortie' ? '' : prev.magasin_destination,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(k => {
        if (dataToSend[k] === '' || dataToSend[k] === null) {
          if (['magasin_source', 'magasin_destination', 'employe_beneficiaire'].includes(k)) {
            dataToSend[k] = null;
          } else if (k === 'prix_unitaire') {
            dataToSend[k] = 0;
          } else {
            delete dataToSend[k];
          }
        }
      });

      await AxiosInstance.post('/mouvements-stock/', dataToSend);
      setSucces(true);
      setTimeout(() => navigate('/mouvements-stock'), 1200);
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

  // ============================================================
  // RENDU : CHARGEMENT
  // ============================================================
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const motifsDisponibles = MOTIFS.filter(m => m.for.includes(formData.type));

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/mouvements-stock')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Stocks / Mouvements / <span className="text-primary">Création</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Nouveau mouvement
            </h1>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Mouvement créé !</span>
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
            {/* Type & Numéro */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Type & Numéro</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {TYPES.map(t => {
                      const Icon = t.icon;
                      const isSelected = formData.type === t.value;
                      return (
                        <button
                          type="button"
                          key={t.value}
                          onClick={() => handleTypeChange(t.value)}
                          className={`btn btn-sm h-auto flex-col py-3 gap-1 ${
                            isSelected ? `btn-${t.color}` : 'btn-outline'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold leading-tight text-center">
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

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
                          placeholder="Auto-généré"
                          maxLength="50"
                        />
                        <button
                          type="button"
                          onClick={chargerProchainNumero}
                          disabled={chargementNumero}
                          className="btn btn-outline join-item gap-1"
                          title="Régénérer un numéro automatique"
                        >
                          {chargementNumero ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Auto
                        </button>
                      </div>
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-xs text-base-content/50 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-success" />
                          Numéro généré automatiquement
                        </span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Motif <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="motif"
                        className="select select-bordered w-full"
                        value={formData.motif}
                        onChange={handleChange}
                        required
                      >
                        {motifsDisponibles.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Article & Quantité */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30">
                  <h2 className="font-semibold text-sm">Article & Quantité</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Article <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="article"
                      className="select select-bordered w-full"
                      value={formData.article}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Sélectionner un article —</option>
                      {articles.map(a => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.designation} (stock: {a.stock_total || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Quantité <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        name="quantite"
                        className="input input-bordered w-full font-mono text-lg"
                        value={formData.quantite}
                        onChange={handleChange}
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Prix unitaire (GNF)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="prix_unitaire"
                        className="input input-bordered w-full font-mono"
                        value={formData.prix_unitaire}
                        onChange={handleChange}
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30">
                  <h2 className="font-semibold text-sm">Localisation</h2>
                </div>
                <div className="p-5 space-y-5">
                  {(formData.type === 'sortie' || formData.type === 'transfert') && (
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Magasin source <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="magasin_source"
                        className="select select-bordered w-full"
                        value={formData.magasin_source}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner —</option>
                        {magasins.map(m => (
                          <option key={m.id} value={m.id}>{m.nom}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(formData.type === 'entree' || formData.type === 'transfert') && (
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Magasin destination <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="magasin_destination"
                        className="select select-bordered w-full"
                        value={formData.magasin_destination}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner —</option>
                        {magasins.map(m => (
                          <option key={m.id} value={m.id}>{m.nom}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.type === 'entree' && (
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Fournisseur</span>
                      </label>
                      <input
                        type="text"
                        name="fournisseur_nom"
                        className="input input-bordered w-full"
                        value={formData.fournisseur_nom}
                        onChange={handleChange}
                        placeholder="Nom du fournisseur"
                        maxLength="200"
                      />
                    </div>
                  )}

                  {formData.type === 'sortie' && (
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Employé bénéficiaire
                        </span>
                      </label>
                      <select
                        name="employe_beneficiaire"
                        className="select select-bordered w-full"
                        value={formData.employe_beneficiaire}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun —</option>
                        {employes.map(e => (
                          <option key={e.id} value={e.id}>{e.nom_complet}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Observation</span>
                    </label>
                    <textarea
                      name="observation"
                      className="textarea textarea-bordered w-full"
                      value={formData.observation}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Notes ou détails..."
                    ></textarea>
                  </div>
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
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <p className="font-mono text-xs text-base-content/50">
                    {formData.numero || 'NUMÉRO'}
                  </p>
                  <p className="font-bold text-sm mt-1">
                    {TYPES.find(t => t.value === formData.type)?.label}
                  </p>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Quantité :</span>
                      <span className="font-mono font-bold text-lg">
                        {formData.quantite || '0'}
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
                      Les stocks sont ajustés automatiquement lors de la création du mouvement.
                      Vérifiez bien le type et les magasins avant d'enregistrer.
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
              onClick={() => navigate('/mouvements-stock')}
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
                  <Save className="w-4 h-4" /> Créer le mouvement
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MouvementStockForm;