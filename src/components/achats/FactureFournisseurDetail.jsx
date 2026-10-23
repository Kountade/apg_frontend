// src/components/achats/FactureFournisseurDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Receipt, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock, Building2, User, Info, Edit, ShieldCheck,
  DollarSign, CreditCard, AlertTriangle, Plus
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  recue:                 { label: 'Reçue',           color: 'info',    icon: Receipt },
  controlee:             { label: 'Contrôlée',       color: 'primary', icon: CheckCircle },
  validee:               { label: 'Validée',         color: 'success', icon: CheckCircle },
  partiellement_payee:   { label: 'Part. payée',     color: 'warning', icon: Clock },
  payee:                 { label: 'Payée',           color: 'success', icon: CheckCircle },
  litige:                { label: 'En litige',       color: 'error',   icon: AlertTriangle },
  annulee:               { label: 'Annulée',         color: 'ghost',   icon: XCircle },
};

const FactureFournisseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facture, setFacture] = useState(null);
  const [paiements, setPaiements] = useState([]);
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
      const [facRes, paiRes] = await Promise.all([
        AxiosInstance.get(`/factures-fournisseurs/${id}/`),
        AxiosInstance.get(`/paiements-fournisseurs/?facture=${id}&page_size=100`).catch(() => ({ data: [] })),
      ]);
      setFacture(facRes.data);
      setPaiements(paiRes.data.results || paiRes.data || []);
    } catch (err) {
      setErreur('Impossible de charger la facture');
    } finally {
      setChargement(false);
    }
  };

  const valider = async () => {
    if (!window.confirm('Valider cette facture fournisseur ?')) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/factures-fournisseurs/${id}/valider/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la validation');
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

  if (erreur || !facture) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/factures-fournisseurs')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const cfg = STATUTS_CONFIG[facture.statut] || STATUTS_CONFIG.recue;
  const IconStatut = cfg.icon;
  const soldeDu = Number(facture.solde_du || 0);
  const estPayee = soldeDu <= 0;
  const estEnRetard = facture.est_en_retard;

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
              Factures /{' '}
              <span className="text-primary font-mono">{facture.numero_interne}</span>
            </div>
            <h1 className="text-xl font-bold truncate">{facture.objet}</h1>
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
                <p className="text-xs font-mono text-base-content/50">
                  {facture.numero_interne}
                </p>
                <p className="text-xl font-bold truncate">{facture.fournisseur_nom}</p>
                <p className="text-xs text-base-content/60 font-mono">
                  N° fournisseur : {facture.numero_facture_fournisseur}
                </p>
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date facture</p>
                <p className="font-mono text-sm">{formaterDate(facture.date_facture)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Échéance</p>
                <p className={`font-mono text-sm ${estEnRetard ? 'text-error font-bold' : ''}`}>
                  {formaterDate(facture.date_echeance)}
                </p>
                {estEnRetard && (
                  <span className="badge badge-error badge-xs mt-1">En retard</span>
                )}
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Bon de commande</p>
                <p className="font-mono text-xs">{facture.bon_commande_numero || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Réception</p>
                <p className="font-mono text-xs">{facture.reception_numero || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* MONTANTS */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-success" />
            <h2 className="font-semibold text-sm">Montants</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Montant HT</p>
                <p className="font-mono font-bold">{formaterMontant(facture.montant_ht)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">TVA ({facture.taux_tva}%)</p>
                <p className="font-mono">{formaterMontant(facture.montant_tva)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Montant TTC</p>
                <p className="font-mono font-bold text-success">{formaterMontant(facture.montant_ttc)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Déjà payé</p>
                <p className="font-mono">{formaterMontant(facture.montant_paye)}</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              estPayee ? 'bg-success/10' :
              estEnRetard ? 'bg-error/10' :
              'bg-warning/10'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold uppercase text-sm ${
                  estPayee ? 'text-success' :
                  estEnRetard ? 'text-error' :
                  'text-warning'
                }`}>
                  {estPayee ? 'Facture payée' : 'Solde dû'}
                </span>
                <span className={`font-mono font-bold text-2xl ${
                  estPayee ? 'text-success' :
                  estEnRetard ? 'text-error' :
                  'text-warning'
                }`}>
                  {formaterMontant(soldeDu)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PAIEMENTS */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Paiements</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-ghost badge-sm">
                {paiements.length} paiement{paiements.length > 1 ? 's' : ''}
              </span>
              {!estPayee && (
                <Link
                  to={`/paiements-fournisseurs/ajouter?facture=${facture.id}&fournisseur=${facture.fournisseur}`}
                  className="btn btn-success btn-xs gap-1"
                >
                  <Plus className="w-3 h-3" /> Paiement
                </Link>
              )}
            </div>
          </div>
          <div className="p-5">
            {paiements.length === 0 ? (
              <div className="text-center py-8 text-base-content/40">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paiements.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary font-bold">
                          {p.numero}
                        </span>
                        <span className={`badge badge-${p.statut === 'valide' ? 'success' : p.statut === 'en_attente' ? 'info' : 'ghost'} badge-xs`}>
                          {p.statut_display || p.statut}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/60 mt-1">
                        {p.mode_display || p.mode} · {formaterDate(p.date_paiement)}
                        {p.reference && ` · Réf: ${p.reference}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm">
                        {formaterMontant(p.montant)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NOTES */}
        {facture.notes && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Info className="w-4 h-4 text-base-content/60" />
              <h2 className="font-semibold text-sm">Notes</h2>
            </div>
            <div className="p-5">
              <p className="text-sm whitespace-pre-wrap">{facture.notes}</p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        {['recue', 'controlee'].includes(facture.statut) && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70">
                  Validez la facture pour permettre son paiement.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                <Link to={`/factures-fournisseurs/${id}/modifier`} className="btn btn-ghost">
                  <Edit className="w-4 h-4" /> Modifier
                </Link>
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
                  Valider la facture
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactureFournisseurDetail;