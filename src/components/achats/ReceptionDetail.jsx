// src/components/achats/ReceptionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Truck, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock, Building2, Package, Info, Edit, ShieldCheck,
  Warehouse
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon:  { label: 'Brouillon',      color: 'ghost',   icon: Clock },
  en_attente: { label: 'En attente',     color: 'info',    icon: Clock },
  controlee:  { label: 'Contrôlée',      color: 'primary', icon: CheckCircle },
  validee:    { label: 'Validée',        color: 'success', icon: CheckCircle },
  refusee:    { label: 'Refusée',        color: 'error',   icon: XCircle },
};

const ReceptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reception, setReception] = useState(null);
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
      const res = await AxiosInstance.get(`/receptions/${id}/`);
      setReception(res.data);
    } catch (err) {
      setErreur('Impossible de charger la réception');
    } finally {
      setChargement(false);
    }
  };

  const controler = async () => {
    if (!window.confirm('Marquer cette réception comme contrôlée ?')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/receptions/${id}/controler/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du contrôle');
    } finally {
      setChargementAction(false);
    }
  };

  const valider = async () => {
    if (!window.confirm(
      'Valider la réception ?\n\n' +
      '⚡ Cela va :\n' +
      '- Mettre à jour les stocks (mouvements d\'entrée)\n' +
      '- Mettre à jour les quantités reçues du bon de commande\n' +
      '- Passer le BC en "Reçu" ou "Part. reçu"\n\n' +
      'Cette action est irréversible.'
    )) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/receptions/${id}/valider/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setChargementAction(false);
    }
  };

  const refuser = async () => {
    const motif = window.prompt('Motif du refus :');
    if (motif === null) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/receptions/${id}/refuser/`, {
        observations: motif || '',
      });
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du refus');
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

  if (erreur || !reception) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/receptions')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const cfg = STATUTS_CONFIG[reception.statut] || STATUTS_CONFIG.brouillon;
  const IconStatut = cfg.icon;
  const lignes = reception.lignes || [];

  const peutControler = ['brouillon', 'en_attente'].includes(reception.statut);
  const peutValider = ['brouillon', 'en_attente', 'controlee'].includes(reception.statut);
  const peutRefuser = !['validee', 'refusee'].includes(reception.statut);

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
              Réceptions /{' '}
              <span className="text-primary font-mono">{reception.numero}</span>
            </div>
            <h1 className="text-xl font-bold truncate">
              Réception du {formaterDate(reception.date_reception)}
            </h1>
          </div>
          <span className={`badge badge-${cfg.color} badge-lg gap-1`}>
            <IconStatut className="w-4 h-4" /> {cfg.label}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* CARTE PRINCIPALE */}
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono text-base-content/50">{reception.numero}</p>
                <p className="text-xl font-bold truncate">{reception.fournisseur_nom}</p>
                {reception.bon_commande_numero && (
                  <p className="text-xs text-base-content/60 font-mono">
                    BC : {reception.bon_commande_numero}
                  </p>
                )}
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date réception</p>
                <p className="font-mono text-sm">{formaterDate(reception.date_reception)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">N° BL</p>
                <p className="font-mono text-sm">{reception.numero_bon_livraison || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Magasin destination</p>
                <p className="text-sm">{reception.magasin_destination_nom || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Contrôlé par</p>
                <p className="text-sm">{reception.controle_par_nom || '—'}</p>
              </div>
            </div>

            {reception.observations && (
              <>
                <div className="divider my-2"></div>
                <p className="text-xs text-base-content/70 whitespace-pre-wrap">
                  {reception.observations}
                </p>
              </>
            )}
          </div>
        </div>

        {/* LIGNES */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Lignes reçues</h2>
            </div>
            <span className="badge badge-ghost badge-sm">{lignes.length}</span>
          </div>
          <div className="p-5">
            {lignes.length === 0 ? (
              <div className="text-center py-8 text-base-content/40">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune ligne</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="border-b border-base-300">
                      <th className="text-xs uppercase">Article</th>
                      <th className="text-xs uppercase text-right">Reçu</th>
                      <th className="text-xs uppercase text-right">Accepté</th>
                      <th className="text-xs uppercase text-right">Refusé</th>
                      <th className="text-xs uppercase">Motif refus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map(l => {
                      const refuse = Number(l.quantite_recue) - Number(l.quantite_acceptee);
                      return (
                        <tr key={l.id} className="border-b border-base-200 last:border-0">
                          <td>
                            <p className="text-sm font-medium">
                              {l.ligne_bon_commande_designation}
                            </p>
                          </td>
                          <td className="text-right font-mono text-sm">
                            {l.quantite_recue}
                          </td>
                          <td className="text-right font-mono text-sm font-bold text-success">
                            {l.quantite_acceptee}
                          </td>
                          <td className="text-right font-mono text-sm font-bold text-error">
                            {refuse > 0 ? refuse : '—'}
                          </td>
                          <td>
                            <p className="text-xs text-base-content/60 truncate max-w-[200px]">
                              {l.motif_refus || '—'}
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
        {(peutControler || peutValider || peutRefuser) && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <div className="text-xs text-base-content/70">
                  <p className="mb-1">
                    <strong>1. Contrôler</strong> : vérifier les quantités et l'état.
                  </p>
                  <p className="mb-1">
                    <strong>2. Valider</strong> : crée les mouvements de stock et met à jour le BC.
                  </p>
                  <p>
                    <strong>Refuser</strong> : bloque la réception (pas de mise à jour stock).
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                <Link to={`/receptions/${id}/modifier`} className="btn btn-ghost">
                  <Edit className="w-4 h-4" /> Modifier
                </Link>
                {peutRefuser && (
                  <button
                    onClick={refuser}
                    className="btn btn-error gap-2"
                    disabled={chargementAction}
                  >
                    <XCircle className="w-4 h-4" /> Refuser
                  </button>
                )}
                {peutControler && (
                  <button
                    onClick={controler}
                    className="btn btn-primary gap-2"
                    disabled={chargementAction}
                  >
                    {chargementAction ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Marquer contrôlée
                  </button>
                )}
                {peutValider && (
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
                    Valider et mettre à jour les stocks
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Après validation */}
        {reception.statut === 'validee' && (
          <div className="card bg-success/5 border border-success/20">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-sm font-medium text-success">Réception validée</p>
              </div>
              <p className="text-xs text-base-content/70 mb-3">
                Les stocks ont été mis à jour. Vous pouvez maintenant créer la facture fournisseur.
              </p>
              <div className="flex justify-end">
                <Link
                  to={`/factures-fournisseurs/ajouter?reception=${id}&fournisseur=${reception.fournisseur}`}
                  className="btn btn-primary gap-2"
                >
                  Créer une facture fournisseur
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionDetail;