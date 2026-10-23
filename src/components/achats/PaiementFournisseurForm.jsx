// src/components/achats/PaiementFournisseurForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle,
  CreditCard, Building2, DollarSign, Info, Eye, Receipt,
  Banknote, Landmark, Smartphone, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MODES = [
  { value: 'especes',      label: 'Espèces',       icon: Banknote },
  { value: 'virement',     label: 'Virement',      icon: Landmark },
  { value: 'cheque',       label: 'Chèque',        icon: FileText },
  { value: 'mobile_money', label: 'Mobile Money',  icon: Smartphone },
  { value: 'prelevement',  label: 'Prélèvement',   icon: CreditCard },
];

const STATUTS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'valide',     label: 'Validé' },
  { value: 'rejete',     label: 'Rejeté' },
  { value: 'annule',     label: 'Annulé' },
];

const PaiementFournisseurForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [factures, setFactures] = useState([]);

  const aujourdhui = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    numero: '',
    facture: searchParams.get('facture') || '',
    fournisseur: searchParams.get('fournisseur') || '',
    montant: 0,
    date_paiement: aujourdhui,
    mode: 'virement',
    reference: '',
    notes: '',
    statut: 'valide',
  });

  useEffect(() => {
    chargerDonnees();
    if (estEdition) {
      chargerPaiement();
    } else {
      setChargementInitial(false);
    }
  }, [id]);

  const chargerDonnees = async () => {
    try {
      // Charge les factures non payées (impayées)
      const res = await AxiosInstance.get('/factures-fournisseurs/?page_size=500');
      const toutes = res.data.results || res.data || [];
      // Filtrer les factures avec solde > 0
      const impayees = toutes.filter(f =>
        Number(f.solde_du || 0) > 0 &&
        !['payee', 'annulee'].includes(f.statut)
      );
      setFactures(impayees);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerPaiement = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/paiements-fournisseurs/${id}/`);
      const d = res.data;
      setFormData({
        numero: d.numero || '',
        facture: d.facture || '',
        fournisseur: d.fournisseur || '',
        montant: d.montant || 0,
        date_paiement: d.date_paiement || aujourdhui,
        mode: d.mode || 'virement',
        reference: d.reference || '',
        notes: d.notes || '',
        statut: d.statut || 'valide',
      });
    } catch (err) {
      setErreur('Impossible de charger le paiement');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const maj = { ...prev, [name]: value };

      // Auto-fill fournisseur + montant quand on choisit une facture
      if (name === 'facture' && value) {
        const fac = factures.find(f => String(f.id) === String(value));
        if (fac) {
          maj.fournisseur = fac.fournisseur;
          if (!Number(maj.montant)) {
            maj.montant = Number(fac.solde_du || 0);
          }
        }
      }

      return maj;
    });
  };

  const factureSelectionnee = factures.find(
    f => String(f.id) === String(formData.facture)
  );

  const montantPaiement = Number(formData.montant || 0);
  const soldeDuFacture = factureSelectionnee ? Number(factureSelectionnee.solde_du || 0) : 0;
  const soldeApres = soldeDuFacture - montantPaiement;

  const formaterMontant = (m) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    if (montantPaiement <= 0) {
      setErreur('Le montant doit être supérieur à 0.');
      setChargement(false);
      return;
    }

    if (factureSelectionnee && montantPaiement > soldeDuFacture) {
      setErreur(`Le montant dépasse le solde dû (${formaterMontant(soldeDuFacture)}).`);
      setChargement(false);
      return;
    }

    try {
      const payload = { ...formData };
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === null) {
          if (k !== 'numero') delete payload[k];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/paiements-fournisseurs/${id}/`, payload);
        setSucces(true);
        setTimeout(() => navigate(`/paiements-fournisseurs/${id}`), 1200);
      } else {
        const res = await AxiosInstance.post('/paiements-fournisseurs/', payload);
        setSucces(true);
        setTimeout(() => navigate(`/paiements-fournisseurs/${res.data.id}`), 1200);
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
            onClick={() => navigate('/paiements-fournisseurs')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Achats / Paiements / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <CreditCard className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier le paiement' : 'Nouveau paiement fournisseur'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Paiement enregistré !</span>
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
            {/* Facture */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Facture concernée</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Numéro paiement</span>
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
                          Facture <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="facture"
                        className="select select-bordered w-full"
                        value={formData.facture}
                        onChange={handleChange}
                        required
                        disabled={estEdition}
                      >
                        <option value="">— Sélectionner une facture impayée —</option>
                        {factures.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.numero_interne} — {f.fournisseur_nom} — Solde: {formaterMontant(f.solde_du)}
                          </option>
                        ))}
                      </select>
                      {factures.length === 0 && (
                        <label className="label py-0 pt-1">
                          <span className="label-text-alt text-xs text-warning">
                            Aucune facture impayée disponible. Créez d'abord une facture.
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  {factureSelectionnee && (
                    <div className="alert alert-info py-2">
                      <Building2 className="w-4 h-4" />
                      <div className="text-xs flex-1">
                        <p><strong>{factureSelectionnee.numero_interne}</strong> — {factureSelectionnee.objet}</p>
                        <p className="text-base-content/60">
                          Fournisseur : {factureSelectionnee.fournisseur_nom} ·
                          TTC : {formaterMontant(factureSelectionnee.montant_ttc)} ·
                          Déjà payé : {formaterMontant(factureSelectionnee.montant_paye)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-base-content/60">Solde dû</p>
                        <p className="font-mono font-bold text-error text-sm">
                          {formaterMontant(soldeDuFacture)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Détails du paiement */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Détails du paiement</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Montant (GNF) <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="montant"
                          className="input input-bordered w-full pl-10 font-mono text-lg"
                          value={formData.montant}
                          onChange={handleChange}
                          min="0.01"
                          step="0.01"
                          max={soldeDuFacture || undefined}
                          required
                        />
                      </div>
                      {factureSelectionnee && (
                        <label className="label py-0 pt-1">
                          <span className="label-text-alt text-xs text-base-content/50">
                            Max : {formaterMontant(soldeDuFacture)}
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, montant: soldeDuFacture }))}
                              className="link link-primary ml-2"
                            >
                              Payer le solde total
                            </button>
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date paiement <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_paiement"
                        className="input input-bordered w-full"
                        value={formData.date_paiement}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Mode</span>
                      </label>
                      <select
                        name="mode"
                        className="select select-bordered w-full"
                        value={formData.mode}
                        onChange={handleChange}
                      >
                        {MODES.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
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
                        maxLength="100"
                        placeholder="N° chèque, N° virement, etc."
                      />
                    </div>
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
                    {formData.statut === 'valide' && (
                      <label className="label py-0 pt-1">
                        <span className="label-text-alt text-xs text-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Sera appliqué à la facture (solde mis à jour)
                        </span>
                      </label>
                    )}
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
                      placeholder="Notes sur le paiement..."
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
                  <h3 className="font-semibold text-sm">Impact</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Solde avant :</span>
                    <span className="font-mono font-bold text-error">
                      {formaterMontant(soldeDuFacture)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Paiement :</span>
                    <span className="font-mono font-bold text-success">
                      - {formaterMontant(montantPaiement)}
                    </span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs uppercase font-bold ${soldeApres > 0 ? 'text-warning' : 'text-success'}`}>
                      Solde après
                    </span>
                    <span className={`font-mono font-bold text-lg ${soldeApres > 0 ? 'text-warning' : 'text-success'}`}>
                      {formaterMontant(Math.max(soldeApres, 0))}
                    </span>
                  </div>
                  {soldeApres <= 0 && montantPaiement > 0 && (
                    <div className="alert alert-success py-1 mt-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">La facture sera marquée comme payée</span>
                    </div>
                  )}
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
                      Un paiement validé met automatiquement à jour le montant payé
                      de la facture. Si le solde atteint 0, la facture passe en « Payée ».
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
              onClick={() => navigate('/paiements-fournisseurs')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[160px]"
              disabled={chargement || factures.length === 0}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le paiement'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaiementFournisseurForm;