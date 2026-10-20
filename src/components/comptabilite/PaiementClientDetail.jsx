// components/comptabilite/PaiementClientDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CreditCard, Edit, Trash2, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, User, Calendar, DollarSign,
  FileText, Hash, Info, Printer, Banknote, Wallet, Smartphone,
  Receipt, ArrowUpRight, Download, ExternalLink, Copy
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MODES_CONFIG = {
  especes:      { label: 'Espèces',      icon: Banknote,     color: 'success' },
  virement:     { label: 'Virement',     icon: Wallet,       color: 'info' },
  cheque:       { label: 'Chèque',       icon: FileText,     color: 'warning' },
  mobile_money: { label: 'Mobile Money', icon: Smartphone,   color: 'primary' },
  prelevement:  { label: 'Prélèvement',  icon: CreditCard,   color: 'secondary' },
};

const STATUTS_CONFIG = {
  en_attente: { label: 'En attente', cls: 'badge-warning', icon: Clock },
  valide:     { label: 'Validé',     cls: 'badge-success', icon: CheckCircle },
  rejete:     { label: 'Rejeté',     cls: 'badge-error',   icon: XCircle },
  annule:     { label: 'Annulé',     cls: 'badge-ghost',   icon: XCircle },
};

const PaiementClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paiement, setPaiement] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [codeCopie, setCodeCopie] = useState(false);

  useEffect(() => {
    chargerPaiement();
  }, [id]);

  const chargerPaiement = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/paiements-clients/${id}/`);
      setPaiement(res.data);
    } catch (err) {
      setErreur(
        err.response?.status === 404
          ? "Ce paiement n'existe pas."
          : 'Impossible de charger le paiement.'
      );
    } finally {
      setChargement(false);
    }
  };

  const supprimerPaiement = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/paiements-clients/${id}/`);
      navigate('/paiements-clients');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setChargementAction(false);
    }
  };

  const copierNumero = () => {
    if (!paiement?.numero) return;
    navigator.clipboard.writeText(paiement.numero);
    setCodeCopie(true);
    setTimeout(() => setCodeCopie(false), 1500);
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formaterDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20 w-full px-6">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70 mb-4">{erreur}</p>
        <button onClick={() => navigate('/paiements-clients')} className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      </div>
    );
  }

  if (!paiement) return null;

  const statutCfg = STATUTS_CONFIG[paiement.statut] || STATUTS_CONFIG.valide;
  const modeCfg = MODES_CONFIG[paiement.mode] || MODES_CONFIG.especes;
  const StatutIcon = statutCfg.icon;
  const ModeIcon = modeCfg.icon;
  const estModifiable = paiement.statut === 'en_attente';

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/paiements-clients')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <CreditCard className="w-3 h-3" />
              Comptabilité / Paiements /{' '}
              <span className="text-primary font-mono">{paiement.numero}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <CreditCard className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate">Paiement client</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {estModifiable && (
              <Link
                to={`/paiements-clients/${paiement.id}/modifier`}
                className="btn btn-ghost btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            )}
            <button
              onClick={() => setShowModalSuppression(true)}
              className="btn btn-ghost btn-sm text-error gap-2"
              disabled={chargementAction}
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>

          <span className={`badge ${statutCfg.cls} badge-lg gap-1.5`}>
            <StatutIcon className="w-4 h-4" />
            {statutCfg.label}
          </span>
        </div>
      </div>

      {/* CONTENU */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

        {/* COLONNE PRINCIPALE */}
        <div className="lg:col-span-2 space-y-6">

          {/* Carte montant */}
          <div className="card bg-gradient-to-br from-success/10 via-success/5 to-base-100 shadow-sm border border-success/20">
            <div className="card-body">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                    <ModeIcon className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">
                      Montant payé
                    </p>
                    <p className="text-3xl font-bold text-success font-mono mt-1">
                      {formaterMontant(paiement.montant)}
                    </p>
                  </div>
                </div>
                <span className={`badge ${statutCfg.cls} badge-lg gap-1.5 flex-shrink-0`}>
                  <StatutIcon className="w-4 h-4" />
                  {statutCfg.label}
                </span>
              </div>

              <div className="divider my-2"></div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Mode</p>
                  <span className={`badge badge-${modeCfg.color} badge-sm gap-1`}>
                    <ModeIcon className="w-3 h-3" />
                    {modeCfg.label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Date</p>
                  <p className="font-mono font-bold text-xs">{formaterDate(paiement.date_paiement)}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Numéro</p>
                  <button
                    onClick={copierNumero}
                    className="flex items-center gap-1.5 font-mono font-bold text-primary hover:underline text-xs"
                  >
                    {paiement.numero}
                    {codeCopie ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Facture */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Client & Facture réglée</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    <span>{(paiement.client_nom?.[0] || '?').toUpperCase()}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{paiement.client_nom || '—'}</p>
                  <Link
                    to={`/clients/${paiement.client}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Voir le client <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {paiement.facture_numero && (
                <>
                  <div className="divider my-2"></div>
                  <div className="flex items-center justify-between p-3 bg-info/5 border border-info/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-info" />
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Facture réglée</p>
                        <p className="font-mono font-bold text-sm">{paiement.facture_numero}</p>
                      </div>
                    </div>
                    <Link
                      to={`/factures/${paiement.facture}`}
                      className="btn btn-ghost btn-sm gap-1"
                    >
                      Voir <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Détails paiement */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-base-content/60" />
              <h2 className="font-semibold text-sm">Détails du paiement</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Mode de paiement</p>
                  <p className="font-medium flex items-center gap-2">
                    <ModeIcon className="w-4 h-4" />
                    {modeCfg.label}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Date du paiement</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-base-content/40" />
                    {formaterDate(paiement.date_paiement)}
                  </p>
                </div>
                {paiement.reference && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Référence</p>
                    <p className="font-medium font-mono text-sm">{paiement.reference}</p>
                  </div>
                )}
                {paiement.notes && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Notes</p>
                    <p className="text-sm text-base-content/80 whitespace-pre-wrap">{paiement.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Justificatif */}
          {paiement.justificatif && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <FileText className="w-4 h-4 text-base-content/60" />
                <h2 className="font-semibold text-sm">Justificatif</h2>
              </div>
              <div className="p-5">
                <a
                  href={paiement.justificatif}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Download className="w-4 h-4" /> Télécharger le justificatif
                </a>
              </div>
            </div>
          )}

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="lg:col-span-1 space-y-6">

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Informations</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Statut</span>
                  <span className={`badge ${statutCfg.cls} badge-sm gap-1`}>
                    <StatutIcon className="w-3 h-3" />
                    {statutCfg.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Mode</span>
                  <span className={`badge badge-${modeCfg.color} badge-sm gap-1`}>
                    <ModeIcon className="w-3 h-3" />
                    {modeCfg.label}
                  </span>
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Créé le</span>
                  <span className="font-medium text-xs">{formaterDateTime(paiement.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Modifié le</span>
                  <span className="font-medium text-xs">{formaterDateTime(paiement.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h3 className="font-semibold text-sm mb-3">Actions</h3>
              <div className="space-y-2">
                {estModifiable && (
                  <Link
                    to={`/paiements-clients/${paiement.id}/modifier`}
                    className="btn btn-outline btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </Link>
                )}
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Printer className="w-4 h-4" /> Imprimer reçu
                </button>
                <Link
                  to="/paiements-clients"
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <CreditCard className="w-4 h-4" /> Tous les paiements
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le paiement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le paiement <strong className="font-mono">{paiement.numero}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerPaiement} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaiementClientDetail;