// src/components/stocks/InventaireDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock, Warehouse, Info, ShieldCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  en_cours: { label: 'En cours', color: 'info', icon: Clock },
  valide:   { label: 'Validé',   color: 'success', icon: CheckCircle },
  annule:   { label: 'Annulé',   color: 'ghost', icon: XCircle },
};

const InventaireDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inventaire, setInventaire] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    charger();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/inventaires/${id}/`);
      setInventaire(res.data);
    } catch (err) {
      setErreur("Impossible de charger l'inventaire");
    } finally {
      setChargement(false);
    }
  };

  const valider = async () => {
    if (!window.confirm('Valider cet inventaire ? Les écarts généreront des ajustements de stock.')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/inventaires/${id}/valider/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setChargementAction(false);
    }
  };

  const annuler = async () => {
    if (!window.confirm('Annuler cet inventaire ?')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/inventaires/${id}/annuler/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'annulation");
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !inventaire) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/inventaire')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const cfg = STATUTS_CONFIG[inventaire.statut] || STATUTS_CONFIG.en_cours;
  const IconStatut = cfg.icon;

  const lignes = inventaire.lignes || [];
  const lignesAvecEcart = lignes.filter(l => Number(l.ecart) !== 0);

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
              <span className="text-primary font-mono">{inventaire.reference}</span>
            </div>
            <h1 className="text-xl font-bold truncate">
              Inventaire du {formaterDate(inventaire.date_inventaire)}
            </h1>
          </div>
          <span className={`badge badge-${cfg.color} badge-lg gap-1`}>
            <IconStatut className="w-4 h-4" /> {cfg.label}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* CARTE INFO */}
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Magasin</p>
                <p className="font-bold text-sm">{inventaire.magasin_nom || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Responsable</p>
                <p className="font-medium text-sm">{inventaire.responsable_nom || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date</p>
                <p className="font-mono text-sm">{formaterDate(inventaire.date_inventaire)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Articles</p>
                <p className="font-mono font-bold text-lg">{lignes.length}</p>
              </div>
            </div>
            {inventaire.notes && (
              <>
                <div className="divider my-2"></div>
                <p className="text-xs text-base-content/70 whitespace-pre-wrap">
                  {inventaire.notes}
                </p>
              </>
            )}
          </div>
        </div>

        {/* LIGNES */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Articles comptés</h2>
            </div>
            {lignesAvecEcart.length > 0 && (
              <span className="badge badge-warning badge-sm">
                {lignesAvecEcart.length} écart{lignesAvecEcart.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="p-5">
            {lignes.length === 0 ? (
              <div className="text-center py-8 text-base-content/40">
                <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune ligne d'inventaire</p>
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
                    {lignes.map(l => {
                      const ecart = Number(l.ecart);
                      return (
                        <tr key={l.id} className="border-b border-base-200">
                          <td>
                            <span className="font-mono text-xs font-bold">
                              {l.article_code}
                            </span>
                          </td>
                          <td>
                            <p className="text-xs truncate max-w-[250px]">
                              {l.article_designation}
                            </p>
                          </td>
                          <td className="text-right font-mono text-xs">
                            {l.quantite_theorique}
                          </td>
                          <td className="text-right font-mono text-xs font-bold">
                            {l.quantite_comptee}
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
                            <p className="text-xs text-base-content/60 truncate max-w-[200px]">
                              {l.observation || '—'}
                            </p>
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

        {/* ACTIONS */}
        {inventaire.statut === 'en_cours' && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70">
                  <strong>Valider</strong> génère automatiquement des mouvements d'ajustement
                  pour les écarts. <strong>Annuler</strong> bloque la session sans toucher aux stocks.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={annuler}
                  className="btn btn-ghost gap-2"
                  disabled={chargementAction}
                >
                  <XCircle className="w-4 h-4" /> Annuler l'inventaire
                </button>
                <button
                  onClick={valider}
                  className="btn btn-success gap-2"
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Valider et ajuster les stocks
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventaireDetail;