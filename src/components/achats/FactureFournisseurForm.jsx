// src/components/achats/FactureFournisseurForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus,
  Receipt, Building2, DollarSign, Eye, Info, FileText, Calendar
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS = [
  { value: 'recue',               label: 'Reçue' },
  { value: 'controlee',           label: 'Contrôlée' },
  { value: 'validee',             label: 'Validée' },
  { value: 'partiellement_payee', label: 'Partiellement payée' },
  { value: 'payee',               label: 'Payée' },
  { value: 'litige',              label: 'En litige' },
  { value: 'annulee',             label: 'Annulée' },
];

const FactureFournisseurForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [fournisseurs, setFournisseurs] = useState([]);
  const [bonsCommande, setBonsCommande] = useState([]);
  const [receptions, setReceptions] = useState([]);

  const aujourdhui = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    numero_interne: '',
    numero_facture_fournisseur: '',
    fournisseur: searchParams.get('fournisseur') || '',
    bon_commande: searchParams.get('bon_commande') || '',
    reception: searchParams.get('reception') || '',
    date_facture: aujourdhui,
    date_echeance: '',
    objet: '',
    montant_ht: 0,
    taux_tva: 18,
    montant_paye: 0,
    statut: 'recue',
    notes: '',
  });

  useEffect(() => {
    chargerDonnees();
    if (estEdition) {
      chargerFacture();
    } else {
      setChargementInitial(false);
    }
  }, [id]);

  const chargerDonnees = async () => {
    try {
      const [fourRes, bcRes, recRes] = await Promise.all([
        AxiosInstance.get('/fournisseurs/?statut=actif&page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/bons-commande/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/receptions/?statut=validee&page_size=500').catch(() => ({ data: [] })),
      ]);
      setFournisseurs(fourRes.data.results || fourRes.data || []);
      setBonsCommande(bcRes.data.results || bcRes.data || []);
      setReceptions(recRes.data.results || recRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerFacture = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/factures-fournisseurs/${id}/`);
      const d = res.data;
      setFormData({
        numero_interne: d.numero_interne || '',
        numero_facture_fournisseur: d.numero_facture_fournisseur || '',
        fournisseur: d.fournisseur || '',
        bon_commande: d.bon_commande || '',
        reception: d.reception || '',
        date_facture: d.date_facture || aujourdhui,
        date_echeance: d.date_echeance || '',
        objet: d.objet || '',
        montant_ht: d.montant_ht || 0,
        taux_tva: d.taux_tva || 18,
        montant_paye: d.montant_paye || 0,
        statut: d.statut || 'recue',
        notes: d.notes || '',
      });
    } catch (err) {
      setErreur('Impossible de charger la facture');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const maj = { ...prev, [name]: value };

      // Auto-fill fournisseur + montant HT quand on choisit un BC
      if (name === 'bon_commande' && value) {
        const bc = bonsCommande.find(b => String(b.id) === String(value));
        if (bc) {
          maj.fournisseur = bc.fournisseur;
          maj.montant_ht = bc.montant_ht || 0;
          maj.taux_tva = bc.taux_tva || 18;
          if (!maj.objet) maj.objet = bc.objet || '';
        }
      }

      // Auto-fill fournisseur + montant HT quand on choisit une réception
      if (name === 'reception' && value) {
        const rec = receptions.find(r => String(r.id) === String(value));
        if (rec) {
          maj.fournisseur = rec.fournisseur;
          if (!maj.bon_commande) maj.bon_commande = rec.bon_commande || '';
        }
      }

      return maj;
    });
  };

  // Calculs locaux (le backend recalcule mais on affiche en direct)
  const montantHT = Number(formData.montant_ht || 0);
  const montantTVA = montantHT * (Number(formData.taux_tva || 0) / 100);
  const montantTTC = montantHT + montantTVA;
  const soldeDu = montantTTC - Number(formData.montant_paye || 0);

  const formaterMontant = (m) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const payload = { ...formData };
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === null) {
          if (['bon_commande', 'reception', 'date_echeance'].includes(k)) {
            payload[k] = null;
          } else if (['montant_ht', 'montant_paye'].includes(k)) {
            payload[k] = 0;
          } else if (k !== 'numero_interne') {
            delete payload[k];
          }
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/factures-fournisseurs/${id}/`, payload);
        setSucces(true);
        setTimeout(() => navigate(`/factures-fournisseurs/${id}`), 1200);
      } else {
        const res = await AxiosInstance.post('/factures-fournisseurs/', payload);
        setSucces(true);
        setTimeout(() => navigate(`/factures-fournisseurs/${res.data.id}`), 1200);
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
            onClick={() => navigate('/factures-fournisseurs')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Achats / Factures / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Receipt className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier la facture' : 'Nouvelle facture fournisseur'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Facture enregistrée !</span>
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
                  <Receipt className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° interne</span>
                      </label>
                      <input
                        type="text"
                        name="numero_interne"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_interne}
                        onChange={handleChange}
                        placeholder="Auto-généré"
                        readOnly
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          N° facture fournisseur <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="numero_facture_fournisseur"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_facture_fournisseur}
                        onChange={handleChange}
                        required
                        maxLength="100"
                        placeholder="Référence du fournisseur"
                      />
                    </div>
                  </div>

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Bon de commande lié
                        </span>
                      </label>
                      <select
                        name="bon_commande"
                        className="select select-bordered w-full"
                        value={formData.bon_commande || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun —</option>
                        {bonsCommande.map(bc => (
                          <option key={bc.id} value={bc.id}>
                            {bc.numero} — {bc.fournisseur_nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Réception liée
                        </span>
                      </label>
                      <select
                        name="reception"
                        className="select select-bordered w-full"
                        value={formData.reception || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Aucune —</option>
                        {receptions.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.numero} — {r.fournisseur_nom}
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
                      placeholder="Ex : Achat gants et sacs poubelle"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Dates & Statut</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date facture <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_facture"
                        className="input input-bordered w-full"
                        value={formData.date_facture}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date échéance
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_echeance"
                        className="input input-bordered w-full"
                        value={formData.date_echeance}
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

            {/* Montants */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Montants</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Montant HT (GNF) <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="montant_ht"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.montant_ht}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
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
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Montant déjà payé (GNF)
                      </span>
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                      <input
                        type="number"
                        name="montant_paye"
                        className="input input-bordered w-full pl-10 font-mono"
                        value={formData.montant_paye}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-xs text-base-content/50">
                        À 0 si non payée. Utilisez les paiements pour mettre à jour.
                      </span>
                    </label>
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
                    <span className="text-base-content/60">TVA ({formData.taux_tva}%) :</span>
                    <span className="font-mono">{formaterMontant(montantTVA)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">TTC :</span>
                    <span className="font-mono font-bold text-success">
                      {formaterMontant(montantTTC)}
                    </span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Déjà payé :</span>
                    <span className="font-mono">{formaterMontant(formData.montant_paye)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-xs uppercase ${soldeDu > 0 ? 'text-error' : 'text-success'}`}>
                      Solde dû
                    </span>
                    <span className={`font-mono font-bold text-lg ${soldeDu > 0 ? 'text-error' : 'text-success'}`}>
                      {formaterMontant(soldeDu)}
                    </span>
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
                      Les montants TVA et TTC sont calculés côté serveur. Le solde dû
                      se met à jour automatiquement à chaque paiement enregistré.
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
              onClick={() => navigate('/factures-fournisseurs')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la facture'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FactureFournisseurForm;