// src/components/achats/ReceptionForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus,
  Truck, Building2, Package, Trash2, Eye, Info, Warehouse
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ReceptionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementLignesBC, setChargementLignesBC] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const [bonsCommande, setBonsCommande] = useState([]);
  const [magasins, setMagasins] = useState([]);

  const aujourdhui = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    numero: '',
    bon_commande: searchParams.get('bon_commande') || '',
    fournisseur: '',
    date_reception: aujourdhui,
    numero_bon_livraison: '',
    magasin_destination: '',
    statut: 'brouillon',
    observations: '',
  });

  const [lignesBC, setLignesBC] = useState([]);
  // lignesBC = [{ ligne_bon_commande, designation, quantite, unite, quantite_recue, quantite_acceptee, motif_refus, id (si réception existante) }]

  useEffect(() => {
    chargerDonnees();
    if (estEdition) {
      chargerReception();
    } else {
      setChargementInitial(false);
    }
  }, [id]);

  const chargerDonnees = async () => {
    try {
      const [bcRes, magRes] = await Promise.all([
        AxiosInstance.get('/bons-commande/?statut__in=confirme,partiellement_recu&page_size=500')
          .catch(() => AxiosInstance.get('/bons-commande/?page_size=500'))
          .catch(() => ({ data: [] })),
        AxiosInstance.get('/magasins/?actif=true&page_size=500').catch(() => ({ data: [] })),
      ]);
      setBonsCommande(bcRes.data.results || bcRes.data || []);
      setMagasins(magRes.data.results || magRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerReception = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/receptions/${id}/`);
      const d = res.data;
      setFormData({
        numero: d.numero || '',
        bon_commande: d.bon_commande || '',
        fournisseur: d.fournisseur || '',
        date_reception: d.date_reception || aujourdhui,
        numero_bon_livraison: d.numero_bon_livraison || '',
        magasin_destination: d.magasin_destination || '',
        statut: d.statut || 'brouillon',
        observations: d.observations || '',
      });

      // Charger les lignes du BC puis mapper avec les lignes de réception existantes
      await chargerLignesBonCommande(d.bon_commande, d.lignes);
    } catch (err) {
      setErreur('Impossible de charger la réception');
    } finally {
      setChargementInitial(false);
    }
  };

  const chargerLignesBonCommande = async (bonCommandeId, lignesReceptionExistantes = []) => {
    if (!bonCommandeId) {
      setLignesBC([]);
      return;
    }
    setChargementLignesBC(true);
    try {
      const res = await AxiosInstance.get(`/bons-commande/${bonCommandeId}/`);
      const bon = res.data;

      // Récupérer les lignes du BC
      const lignesBcData = bon.lignes || [];

      // Map des lignes de réception existantes (édition)
      const mapExistantes = {};
      (lignesReceptionExistantes || []).forEach(l => {
        mapExistantes[l.ligne_bon_commande] = l;
      });

      const lignesPreparees = lignesBcData.map(l => {
        const existante = mapExistantes[l.id];
        const restant = Number(l.quantite || 0) - Number(l.quantite_recue || 0);
        return {
          id: existante?.id || null,
          ligne_bon_commande: l.id,
          designation: l.designation,
          article_stock: l.article_stock,
          article_stock_code: l.article_stock_code,
          quantite: l.quantite,
          quantite_recue_precedente: l.quantite_recue || 0,
          quantite_restante: restant,
          unite: l.unite,
          quantite_recue: existante ? Number(existante.quantite_recue) : Math.max(restant, 0),
          quantite_acceptee: existante ? Number(existante.quantite_acceptee) : Math.max(restant, 0),
          motif_refus: existante?.motif_refus || '',
        };
      });
      setLignesBC(lignesPreparees);

      // Auto-set fournisseur
      if (!formData.fournisseur && bon.fournisseur) {
        setFormData(prev => ({ ...prev, fournisseur: bon.fournisseur }));
      }
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les lignes du bon de commande');
    } finally {
      setChargementLignesBC(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'bon_commande' && value && !estEdition) {
      chargerLignesBonCommande(value);
    }
  };

  const handleLigneChange = (index, field, value) => {
    setLignesBC(prev => {
      const copie = [...prev];
      copie[index] = { ...copie[index], [field]: value };
      // Auto-calcul quantite_acceptee si on change quantite_recue
      if (field === 'quantite_recue') {
        const recue = Number(value) || 0;
        const acceptee = Number(copie[index].quantite_acceptee) || 0;
        if (acceptee > recue) {
          copie[index].quantite_acceptee = recue;
        } else if (acceptee === 0 && recue > 0) {
          copie[index].quantite_acceptee = recue;
        }
      }
      return copie;
    });
  };

  const totalRecu = lignesBC.reduce((s, l) => s + Number(l.quantite_recue || 0), 0);
  const totalAccepte = lignesBC.reduce((s, l) => s + Number(l.quantite_acceptee || 0), 0);
  const totalRefuse = totalRecu - totalAccepte;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    if (!formData.bon_commande) {
      setErreur('Sélectionnez un bon de commande.');
      setChargement(false);
      return;
    }
    if (lignesBC.length === 0) {
      setErreur('Aucune ligne à réceptionner.');
      setChargement(false);
      return;
    }

    try {
      const payload = { ...formData };
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === null) {
          if (k === 'magasin_destination') {
            payload[k] = null;
          } else if (k !== 'numero') {
            delete payload[k];
          }
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/receptions/${id}/`, payload);
        for (const ligne of lignesBC) {
          const linePayload = {
            quantite_recue: ligne.quantite_recue,
            quantite_acceptee: ligne.quantite_acceptee,
            motif_refus: ligne.motif_refus || '',
          };
          if (ligne.id) {
            await AxiosInstance.patch(`/lignes-reception/${ligne.id}/`, linePayload);
          } else {
            await AxiosInstance.post('/lignes-reception/', {
              ...linePayload,
              reception: id,
              ligne_bon_commande: ligne.ligne_bon_commande,
            });
          }
        }
        setSucces(true);
        setTimeout(() => navigate(`/receptions/${id}`), 1200);
      } else {
        const res = await AxiosInstance.post('/receptions/', payload);
        const receptionId = res.data.id;

        for (const ligne of lignesBC) {
          if (Number(ligne.quantite_recue) > 0) {
            await AxiosInstance.post('/lignes-reception/', {
              reception: receptionId,
              ligne_bon_commande: ligne.ligne_bon_commande,
              quantite_recue: ligne.quantite_recue,
              quantite_acceptee: ligne.quantite_acceptee,
              motif_refus: ligne.motif_refus || '',
            });
          }
        }

        setSucces(true);
        setTimeout(() => navigate(`/receptions/${receptionId}`), 1200);
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

  const bonSelectionne = bonsCommande.find(
    bc => String(bc.id) === String(formData.bon_commande)
  );

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/receptions')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Achats / Réceptions / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Truck className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier la réception' : 'Nouvelle réception'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Réception enregistrée !</span>
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
                  <Truck className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identification</h2>
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
                          Bon de commande <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="bon_commande"
                        className="select select-bordered w-full"
                        value={formData.bon_commande}
                        onChange={handleChange}
                        required
                        disabled={estEdition}
                      >
                        <option value="">— Sélectionner —</option>
                        {bonsCommande.map(bc => (
                          <option key={bc.id} value={bc.id}>
                            {bc.numero} — {bc.fournisseur_nom} ({bc.statut_display})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {bonSelectionne && (
                    <div className="alert alert-info py-2">
                      <Building2 className="w-4 h-4" />
                      <div className="text-xs">
                        <p><strong>{bonSelectionne.numero}</strong> — {bonSelectionne.objet}</p>
                        <p className="text-base-content/60">
                          Fournisseur : {bonSelectionne.fournisseur_nom} · Montant TTC :{' '}
                          {new Intl.NumberFormat('fr-FR').format(Number(bonSelectionne.montant_ttc || 0))} GNF
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date réception <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_reception"
                        className="input input-bordered w-full"
                        value={formData.date_reception}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">N° bon de livraison</span>
                      </label>
                      <input
                        type="text"
                        name="numero_bon_livraison"
                        className="input input-bordered w-full font-mono"
                        value={formData.numero_bon_livraison}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Réf. BL fournisseur"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Magasin destination</span>
                      </label>
                      <select
                        name="magasin_destination"
                        className="select select-bordered w-full"
                        value={formData.magasin_destination || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Aucun —</option>
                        {magasins.map(m => (
                          <option key={m.id} value={m.id}>{m.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Observations</span>
                    </label>
                    <textarea
                      name="observations"
                      className="textarea textarea-bordered w-full"
                      value={formData.observations}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Notes sur la réception..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Lignes de réception */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">Lignes à réceptionner</h2>
                  </div>
                  {lignesBC.length > 0 && (
                    <span className="badge badge-ghost badge-sm">
                      {lignesBC.length} ligne{lignesBC.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  {!formData.bon_commande ? (
                    <div className="text-center py-8 text-base-content/40">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sélectionnez un bon de commande pour charger les lignes</p>
                    </div>
                  ) : chargementLignesBC ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : lignesBC.length === 0 ? (
                    <div className="text-center py-8 text-base-content/40">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune ligne dans ce bon de commande</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <thead>
                          <tr className="border-b border-base-300">
                            <th className="text-xs uppercase">Article</th>
                            <th className="text-xs uppercase text-right">Commandé</th>
                            <th className="text-xs uppercase text-right">Déjà reçu</th>
                            <th className="text-xs uppercase text-right">Restant</th>
                            <th className="text-xs uppercase text-right">Reçu</th>
                            <th className="text-xs uppercase text-right">Accepté</th>
                            <th className="text-xs uppercase text-right">Refusé</th>
                            <th className="text-xs uppercase">Motif refus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lignesBC.map((ligne, index) => {
                            const refuse = Number(ligne.quantite_recue) - Number(ligne.quantite_acceptee);
                            return (
                              <tr key={index} className="border-b border-base-200">
                                <td>
                                  <p className="text-xs font-medium truncate max-w-[200px]">
                                    {ligne.designation}
                                  </p>
                                  {ligne.article_stock_code && (
                                    <p className="text-xs font-mono text-base-content/50">
                                      [{ligne.article_stock_code}]
                                    </p>
                                  )}
                                </td>
                                <td className="text-right">
                                  <span className="font-mono text-xs">{ligne.quantite}</span>
                                </td>
                                <td className="text-right">
                                  <span className="font-mono text-xs text-base-content/60">
                                    {ligne.quantite_recue_precedente}
                                  </span>
                                </td>
                                <td className="text-right">
                                  <span className="font-mono text-xs font-bold text-info">
                                    {ligne.quantite_restante}
                                  </span>
                                </td>
                                <td className="text-right">
                                  <input
                                    type="number"
                                    className="input input-bordered input-xs w-20 text-right font-mono"
                                    value={ligne.quantite_recue}
                                    onChange={(e) =>
                                      handleLigneChange(index, 'quantite_recue', e.target.value)
                                    }
                                    min="0"
                                    max={ligne.quantite_restante}
                                    step="0.01"
                                  />
                                </td>
                                <td className="text-right">
                                  <input
                                    type="number"
                                    className="input input-bordered input-xs w-20 text-right font-mono"
                                    value={ligne.quantite_acceptee}
                                    onChange={(e) =>
                                      handleLigneChange(index, 'quantite_acceptee', e.target.value)
                                    }
                                    min="0"
                                    max={ligne.quantite_recue}
                                    step="0.01"
                                  />
                                </td>
                                <td className="text-right">
                                  <span
                                    className={`font-mono text-xs font-bold ${
                                      refuse > 0 ? 'text-error' : 'text-base-content/40'
                                    }`}
                                  >
                                    {refuse > 0 ? refuse : '—'}
                                  </span>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="input input-bordered input-xs w-full"
                                    value={ligne.motif_refus || ''}
                                    onChange={(e) =>
                                      handleLigneChange(index, 'motif_refus', e.target.value)
                                    }
                                    placeholder="—"
                                    disabled={refuse <= 0}
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
                <div className="bg-base-100 rounded-xl p-4 border border-base-300 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Numéro :</span>
                    <span className="font-mono">{formData.numero || 'REC-AUTO'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Lignes :</span>
                    <span className="font-bold">{lignesBC.length}</span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Total reçu :</span>
                    <span className="font-mono font-bold">{totalRecu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-success">Accepté :</span>
                    <span className="font-mono font-bold text-success">{totalAccepte}</span>
                  </div>
                  {totalRefuse > 0 && (
                    <div className="flex justify-between">
                      <span className="text-error">Refusé :</span>
                      <span className="font-mono font-bold text-error">{totalRefuse}</span>
                    </div>
                  )}
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
                      Après validation de la réception, les stocks seront mis à jour
                      automatiquement (mouvements d'entrée créés) et le BC passera en
                      « Reçu » ou « Part. reçu ».
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
              onClick={() => navigate('/receptions')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la réception'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReceptionForm;