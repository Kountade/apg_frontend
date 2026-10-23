// src/components/achats/DevisFournisseurDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock, Building2, User, Package, Info, Edit,
  ShieldCheck, FileCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  recu:     { label: 'Reçu',      color: 'info',    icon: Clock },
  en_etude: { label: 'En étude',  color: 'warning', icon: Clock },
  accepte:  { label: 'Accepté',   color: 'success', icon: CheckCircle },
  refuse:   { label: 'Refusé',    color: 'error',   icon: XCircle },
  expire:   { label: 'Expiré',    color: 'ghost',   icon: XCircle },
};

const DevisFournisseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devis, setDevis] = useState(null);
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
      const res = await AxiosInstance.get(`/devis-fournisseurs/${id}/`);
      setDevis(res.data);
    } catch (err) {
      setErreur('Impossible de charger le devis');
    } finally {
      setChargement(false);
    }
  };

  const accepter = async () => {
    if (!window.confirm('Accepter ce devis ?')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/devis-fournisseurs/${id}/accepter/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'acceptation");
    } finally {
      setChargementAction(false);
    }
  };

  const refuser = async () => {
    if (!window.confirm('Refuser ce devis ?')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/devis-fournisseurs/${id}/refuser/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du refus');
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

  if (erreur || !devis) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/devis-fournisseurs')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const cfg = STATUTS_CONFIG[devis.statut] || STATUTS_CONFIG.recu;
  const IconStatut = cfg.icon;
  const lignes = devis.lignes || [];

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
              Devis /{' '}
              <span className="text-primary font-mono">{devis.numero}</span>
            </div>
            <h1 className="text-xl font-bold truncate">{devis.objet}</h1>
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
                <p className="text-xs font-mono text-base-content/50">{devis.numero}</p>
                <p className="text-xl font-bold truncate">{devis.fournisseur_nom}</p>
                {devis.numero_devis_fournisseur && (
                  <p className="text-xs text-base-content/60 font-mono">
                    Réf. fournisseur : {devis.numero_devis_fournisseur}
                  </p>
                )}
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date devis</p>
                <p className="font-mono text-sm">{formaterDate(devis.date_devis)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Validité</p>
                <p className="font-mono text-sm">{formaterDate(devis.date_validite)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Délai livraison</p>
                <p className="font-mono font-bold">{devis.delai_livraison_jours} j</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Demande liée</p>
                <p className="font-mono text-xs">
                  {devis.demande_achat_numero || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LIGNES */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Lignes du devis</h2>
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
                      <th className="text-xs uppercase text-right">Quantité</th>
                      <th className="text-xs uppercase">Unité</th>
                      <th className="text-xs uppercase text-right">Prix unitaire</th>
                      <th className="text-xs uppercase text-right">Montant HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l, i) => (
                      <tr key={l.id} className="border-b border-base-200 last:border-0">
                        <td>
                          <span className="badge badge-ghost badge-sm font-mono">{i + 1}</span>
                        </td>
                        <td>
                          <p className="text-sm font-medium">{l.designation}</p>
                        </td>
                        <td className="text-right font-mono text-sm">{l.quantite}</td>
                        <td className="text-xs">{l.unite}</td>
                        <td className="text-right font-mono text-xs">
                          {formaterMontant(l.prix_unitaire)}
                        </td>
                        <td className="text-right font-mono font-bold text-sm">
                          {formaterMontant(l.montant_ht)}
                        </td>
                      </tr>
                    ))}
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
                <span className="font-mono font-bold">{formaterMontant(devis.montant_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">TVA ({devis.taux_tva}%) :</span>
                <span className="font-mono">{formaterMontant(devis.montant_tva)}</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-success uppercase text-sm">Montant TTC</span>
                <span className="font-mono font-bold text-xl text-success">
                  {formaterMontant(devis.montant_ttc)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NOTES */}
        {devis.notes && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Info className="w-4 h-4 text-base-content/60" />
              <h2 className="font-semibold text-sm">Notes</h2>
            </div>
            <div className="p-5">
              <p className="text-sm whitespace-pre-wrap">{devis.notes}</p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        {['recu', 'en_etude'].includes(devis.statut) && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70">
                  Vous pouvez accepter ce devis pour créer un bon de commande, ou le refuser.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                <Link to={`/devis-fournisseurs/${id}/modifier`} className="btn btn-ghost">
                  Modifier
                </Link>
                <button
                  onClick={refuser}
                  className="btn btn-error gap-2"
                  disabled={chargementAction}
                >
                  <XCircle className="w-4 h-4" /> Refuser
                </button>
                <button
                  onClick={accepter}
                  className="btn btn-success gap-2"
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Accepter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions post-acceptation */}
        {devis.statut === 'accepte' && (
          <div className="card bg-success/5 border border-success/20">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-sm font-medium text-success">Devis accepté</p>
              </div>
              <p className="text-xs text-base-content/70 mb-3">
                Ce devis peut maintenant être converti en bon de commande.
              </p>
              <div className="flex justify-end">
                <Link
                  to={`/bons-commande/ajouter?devis_fournisseur=${id}`}
                  className="btn btn-primary gap-2"
                >
                  <FileCheck className="w-4 h-4" /> Créer un bon de commande
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevisFournisseurDetail;