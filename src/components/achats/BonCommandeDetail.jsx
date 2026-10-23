// src/components/achats/BonCommandeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock, Send, Building2, User, Package, Info, Edit,
  Truck, FileText, FileCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon:          { label: 'Brouillon',       color: 'ghost',   icon: ClipboardList },
  envoye:             { label: 'Envoyé',          color: 'info',    icon: Send },
  confirme:           { label: 'Confirmé',        color: 'primary', icon: CheckCircle },
  partiellement_recu: { label: 'Part. reçu',      color: 'warning', icon: Truck },
  recu:               { label: 'Reçu',            color: 'success', icon: CheckCircle },
  annule:             { label: 'Annulé',          color: 'error',   icon: XCircle },
};

const BonCommandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bon, setBon] = useState(null);
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
      const res = await AxiosInstance.get(`/bons-commande/${id}/`);
      setBon(res.data);
    } catch (err) {
      setErreur('Impossible de charger le bon de commande');
    } finally {
      setChargement(false);
    }
  };

  const envoyer = async () => {
    if (!window.confirm('Envoyer ce bon de commande au fournisseur ?')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/bons-commande/${id}/envoyer/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setChargementAction(false);
    }
  };

  const confirmer = async () => {
    if (!window.confirm('Marquer ce bon de commande comme confirmé par le fournisseur ?')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/bons-commande/${id}/confirmer/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la confirmation');
    } finally {
      setChargementAction(false);
    }
  };

  const annuler = async () => {
    if (!window.confirm('Annuler ce bon de commande ?')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/bons-commande/${id}/annuler/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'annulation");
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !bon) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/bons-commande')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const cfg = STATUTS_CONFIG[bon.statut] || STATUTS_CONFIG.brouillon;
  const IconStatut = cfg.icon;
  const lignes = bon.lignes || [];

  const peutEnvoyer = bon.statut === 'brouillon';
  const peutConfirmer = bon.statut === 'envoye';
  const peutAnnuler = ['brouillon', 'envoye', 'confirme'].includes(bon.statut);
  const peutRecevoir = ['confirme', 'partiellement_recu'].includes(bon.statut);

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/bons-commande')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Bons de commande /{' '}
              <span className="text-primary font-mono">{bon.numero}</span>
            </div>
            <h1 className="text-xl font-bold truncate">{bon.objet}</h1>
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
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono text-base-content/50">{bon.numero}</p>
                <p className="text-xl font-bold truncate">{bon.fournisseur_nom}</p>
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date commande</p>
                <p className="font-mono text-sm">{formaterDate(bon.date_commande)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Livraison prévue</p>
                <p className="font-mono text-sm">{formaterDate(bon.date_livraison_prevue)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Livraison réelle</p>
                <p className="font-mono text-sm">{formaterDate(bon.date_livraison_reelle)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Validé par</p>
                <p className="text-sm">{bon.valide_par_nom || '—'}</p>
              </div>
            </div>

            {bon.demande_achat_numero && (
              <>
                <div className="divider my-2"></div>
                <div className="text-xs">
                  <span className="text-base-content/60">Demande d'achat liée : </span>
                  <Link to={`/demandes-achat/${bon.demande_achat}`} className="font-mono text-primary hover:underline">
                    {bon.demande_achat_numero}
                  </Link>
                  {bon.devis_fournisseur_numero && (
                    <>
                      <span className="text-base-content/60 ml-3">Devis lié : </span>
                      <Link to={`/devis-fournisseurs/${bon.devis_fournisseur}`} className="font-mono text-primary hover:underline">
                        {bon.devis_fournisseur_numero}
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}

            {bon.conditions_particulieres && (
              <>
                <div className="divider my-2"></div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Conditions particulières</p>
                  <p className="text-sm whitespace-pre-wrap">{bon.conditions_particulieres}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* LIGNES */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Lignes de commande</h2>
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
                      <th className="text-xs uppercase">#</th>
                      <th className="text-xs uppercase">Désignation</th>
                      <th className="text-xs uppercase text-right">Commandé</th>
                      <th className="text-xs uppercase text-right">Reçu</th>
                      <th className="text-xs uppercase">Unité</th>
                      <th className="text-xs uppercase text-right">P.U. HT</th>
                      <th className="text-xs uppercase text-right">Montant HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l, i) => {
                      const complete = Number(l.quantite_recue || 0) >= Number(l.quantite || 0);
                      return (
                        <tr key={l.id} className="border-b border-base-200 last:border-0">
                          <td>
                            <span className="badge badge-ghost badge-sm font-mono">{i + 1}</span>
                          </td>
                          <td>
                            <p className="text-sm font-medium">{l.designation}</p>
                            {l.article_stock_code && (
                              <p className="text-xs text-base-content/50 font-mono">
                                [{l.article_stock_code}]
                              </p>
                            )}
                          </td>
                          <td className="text-right font-mono text-sm">{l.quantite}</td>
                          <td className="text-right">
                            <span className={`font-mono text-sm font-bold ${complete ? 'text-success' : 'text-warning'}`}>
                              {l.quantite_recue || 0}
                            </span>
                          </td>
                          <td className="text-xs">{l.unite}</td>
                          <td className="text-right font-mono text-xs">
                            {formaterMontant(l.prix_unitaire)}
                          </td>
                          <td className="text-right font-mono font-bold text-sm">
                            {formaterMontant(l.montant_ht)}
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

        {/* TOTAUX */}
        <div className="card bg-success/5 border border-success/20">
          <div className="card-body">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Montant HT :</span>
                <span className="font-mono font-bold">{formaterMontant(bon.montant_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">TVA ({bon.taux_tva}%) :</span>
                <span className="font-mono">{formaterMontant(bon.montant_tva)}</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-success uppercase text-sm">Montant TTC</span>
                <span className="font-mono font-bold text-xl text-success">
                  {formaterMontant(bon.montant_ttc)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NOTES */}
        {bon.notes && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Info className="w-4 h-4 text-base-content/60" />
              <h2 className="font-semibold text-sm">Notes</h2>
            </div>
            <div className="p-5">
              <p className="text-sm whitespace-pre-wrap">{bon.notes}</p>
            </div>
          </div>
        )}

        {/* ACTIONS WORKFLOW */}
        {(peutEnvoyer || peutConfirmer || peutAnnuler) && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70">
                  Workflow : <strong>Brouillon</strong> → <strong>Envoyé</strong> → <strong>Confirmé</strong> → <strong>Reçu</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                <Link to={`/bons-commande/${id}/modifier`} className="btn btn-ghost">
                  <Edit className="w-4 h-4" /> Modifier
                </Link>
                {peutAnnuler && (
                  <button
                    onClick={annuler}
                    className="btn btn-error gap-2"
                    disabled={chargementAction}
                  >
                    <XCircle className="w-4 h-4" /> Annuler
                  </button>
                )}
                {peutEnvoyer && (
                  <button
                    onClick={envoyer}
                    className="btn btn-info gap-2"
                    disabled={chargementAction}
                  >
                    {chargementAction ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Envoyer au fournisseur
                  </button>
                )}
                {peutConfirmer && (
                  <button
                    onClick={confirmer}
                    className="btn btn-primary gap-2"
                    disabled={chargementAction}
                  >
                    {chargementAction ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Confirmer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions réception */}
        {peutRecevoir && (
          <div className="card bg-info/5 border border-info/20">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-info" />
                <p className="text-sm font-medium text-info">Prêt pour réception</p>
              </div>
              <p className="text-xs text-base-content/70 mb-3">
                Ce bon de commande est confirmé et peut recevoir des réceptions.
              </p>
              <div className="flex justify-end">
                <Link
                  to={`/receptions/ajouter?bon_commande=${id}`}
                  className="btn btn-info gap-2"
                >
                  <Truck className="w-4 h-4" /> Nouvelle réception
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BonCommandeDetail;