// src/components/achats/PaiementFournisseurDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CreditCard, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock, Building2, Receipt, Info, Edit, DollarSign,
  Banknote, Landmark, Smartphone, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MODES_CONFIG = {
  especes:      { label: 'Espèces',       icon: Banknote },
  virement:     { label: 'Virement',      icon: Landmark },
  cheque:       { label: 'Chèque',        icon: FileText },
  mobile_money: { label: 'Mobile Money',  icon: Smartphone },
  prelevement:  { label: 'Prélèvement',   icon: CreditCard },
};

const STATUTS_CONFIG = {
  en_attente: { label: 'En attente',  color: 'info',    icon: Clock },
  valide:     { label: 'Validé',      color: 'success', icon: CheckCircle },
  rejete:     { label: 'Rejeté',      color: 'error',   icon: XCircle },
  annule:     { label: 'Annulé',      color: 'ghost',   icon: XCircle },
};

const PaiementFournisseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paiement, setPaiement] = useState(null);
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
      const res = await AxiosInstance.get(`/paiements-fournisseurs/${id}/`);
      setPaiement(res.data);
    } catch (err) {
      setErreur('Impossible de charger le paiement');
    } finally {
      setChargement(false);
    }
  };

  const changerStatut = async (nouveauStatut) => {
    if (!window.confirm(`Passer le paiement en "${STATUTS_CONFIG[nouveauStatut]?.label}" ?`)) return;
    setChargementAction(true);
    try {
      await AxiosInstance.patch(`/paiements-fournisseurs/${id}/`, {
        statut: nouveauStatut,
      });
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
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

  if (erreur || !paiement) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/paiements-fournisseurs')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const modeCfg = MODES_CONFIG[paiement.mode] || MODES_CONFIG.virement;
  const statutCfg = STATUTS_CONFIG[paiement.statut] || STATUTS_CONFIG.valide;
  const ModeIcon = modeCfg.icon;
  const StatutIcon = statutCfg.icon;

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
              Paiements /{' '}
              <span className="text-primary font-mono">{paiement.numero}</span>
            </div>
            <h1 className="text-xl font-bold truncate">
              {formaterMontant(paiement.montant)} — {paiement.fournisseur_nom}
            </h1>
          </div>
          <span className={`badge badge-${statutCfg.color} badge-lg gap-1`}>
            <StatutIcon className="w-4 h-4" /> {statutCfg.label}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* CARTE PRINCIPALE */}
        <div className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-8 h-8 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-base-content/50">{paiement.numero}</p>
                <p className="text-2xl font-bold text-success">
                  {formaterMontant(paiement.montant)}
                </p>
                <p className="text-xs text-base-content/60">
                  {modeCfg.label} · {formaterDate(paiement.date_paiement)}
                </p>
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Fournisseur</p>
                <p className="font-medium truncate">{paiement.fournisseur_nom}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Facture liée</p>
                <p className="font-mono">
                  {paiement.facture_numero ? (
                    <Link to={`/factures-fournisseurs/${paiement.facture}`} className="link link-primary">
                      {paiement.facture_numero}
                    </Link>
                  ) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Mode</p>
                <span className="badge badge-ghost badge-sm gap-1">
                  <ModeIcon className="w-3 h-3" /> {modeCfg.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Référence</p>
                <p className="font-mono text-sm">{paiement.reference || '—'}</p>
              </div>
            </div>

            {paiement.notes && (
              <>
                <div className="divider my-2"></div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{paiement.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        {['en_attente', 'valide'].includes(paiement.statut) && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70">
                  Le changement de statut met à jour le solde de la facture :
                  <br />• <strong>Validé</strong> : applique le paiement à la facture
                  <br />• <strong>Rejeté / Annulé</strong> : retire le paiement du solde
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                <Link to={`/paiements-fournisseurs/${id}/modifier`} className="btn btn-ghost">
                  <Edit className="w-4 h-4" /> Modifier
                </Link>

                {paiement.statut === 'en_attente' && (
                  <>
                    <button
                      onClick={() => changerStatut('rejete')}
                      className="btn btn-error gap-2"
                      disabled={chargementAction}
                    >
                      <XCircle className="w-4 h-4" /> Rejeter
                    </button>
                    <button
                      onClick={() => changerStatut('valide')}
                      className="btn btn-success gap-2"
                      disabled={chargementAction}
                    >
                      {chargementAction ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Valider
                    </button>
                  </>
                )}

                {paiement.statut === 'valide' && (
                  <button
                    onClick={() => changerStatut('annule')}
                    className="btn btn-ghost gap-2"
                    disabled={chargementAction}
                  >
                    <XCircle className="w-4 h-4" /> Annuler le paiement
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Après validation */}
        {paiement.statut === 'valide' && paiement.facture && (
          <div className="card bg-success/5 border border-success/20">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-sm font-medium text-success">Paiement appliqué</p>
              </div>
              <p className="text-xs text-base-content/70 mb-3">
                Ce paiement est enregistré sur la facture. Consultez la facture pour voir le solde à jour.
              </p>
              <div className="flex justify-end">
                <Link
                  to={`/factures-fournisseurs/${paiement.facture}`}
                  className="btn btn-info gap-2"
                >
                  <Receipt className="w-4 h-4" /> Voir la facture
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaiementFournisseurDetail;