// components/tresorerie/MouvementTresorerieDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Coins, Trash2, Loader2, AlertCircle,
  Calculator, Calendar, DollarSign, Hash, FileText,
  Wallet, Landmark, Banknote, CreditCard, Info, Printer,
  ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  entree: { label: 'Entrée', cls: 'badge-success', icon: ArrowDownRight, description: 'Encaissement' },
  sortie: { label: 'Sortie', cls: 'badge-error', icon: ArrowUpRight, description: 'Décaissement' },
};

const MODES_PAIEMENT = {
  especes: { label: 'Espèces', icon: Banknote },
  virement: { label: 'Virement', icon: Landmark },
  cheque: { label: 'Chèque', icon: FileText },
  mobile_money: { label: 'Mobile Money', icon: Wallet },
  prelevement: { label: 'Prélèvement', icon: CreditCard },
  carte: { label: 'Carte bancaire', icon: CreditCard },
};

const MouvementTresorerieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mouvement, setMouvement] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerMouvement();
  }, [id]);

  const chargerMouvement = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/mouvements-tresorerie/${id}/`);
      setMouvement(response.data);
    } catch (err) {
      setErreur('Mouvement introuvable');
    } finally {
      setChargement(false);
    }
  };

  const supprimerMouvement = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/mouvements-tresorerie/${id}/`);
      navigate('/mouvements-tresorerie');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '—';

  const formaterDateHeure = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !mouvement) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Mouvement introuvable'}</p>
        <Link to="/mouvements-tresorerie" className="btn btn-primary mt-4">Retour aux mouvements</Link>
      </div>
    );
  }

  const typeCfg = TYPES_CONFIG[mouvement.type] || TYPES_CONFIG.entree;
  const IconType = typeCfg.icon;
  const modeCfg = MODES_PAIEMENT[mouvement.mode_paiement] || MODES_PAIEMENT.especes;
  const ModeIcon = modeCfg.icon;

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/mouvements-tresorerie')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Trésorerie /
              <Link to="/mouvements-tresorerie" className="hover:text-primary">Mouvements</Link> /
              <span className="text-primary font-mono">{mouvement.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Coins className="w-8 h-8 text-primary" />
              {mouvement.numero}
            </h1>
            <p className="text-base-content/60 mt-1">
              {mouvement.origine || 'Mouvement de trésorerie'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`badge ${typeCfg.cls} badge-lg gap-2`}>
            <IconType className="w-4 h-4" />
            {typeCfg.label}
          </span>

          <button onClick={() => window.print()} className="btn btn-outline gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>

          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Informations principales */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Informations du mouvement</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Numéro</label>
                <p className="font-medium mt-1 font-mono flex items-center gap-2">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  {mouvement.numero}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Date</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-base-content/40" />
                  {formaterDate(mouvement.date_mouvement)}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Type</label>
                <p className="mt-1">
                  <span className={`badge ${typeCfg.cls} gap-1`}>
                    <IconType className="w-3 h-3" />
                    {typeCfg.label}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Mode de paiement</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <ModeIcon className="w-4 h-4 text-base-content/40" />
                  {modeCfg.label}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-base-content/40 uppercase">Montant</label>
                <p className={`font-bold text-3xl mt-1 font-mono ${
                  mouvement.type === 'entree' ? 'text-success' : 'text-error'
                }`}>
                  {mouvement.type === 'entree' ? '+' : '-'}{formaterMontant(mouvement.montant)}
                </p>
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-info" />
              <h2 className="font-semibold text-sm">Source / Destination</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Caisse</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-base-content/40" />
                  {mouvement.caisse_nom || <span className="text-base-content/40">Aucune</span>}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Compte bancaire</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-base-content/40" />
                  {mouvement.compte_nom || <span className="text-base-content/40">Aucun</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Info className="w-4 h-4 text-base-content/60" />
              <h2 className="font-semibold text-sm">Détails</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Origine / Bénéficiaire</label>
                <p className="font-medium mt-1">{mouvement.origine || '—'}</p>
              </div>
              {mouvement.reference && (
                <div>
                  <label className="text-xs text-base-content/40 uppercase">Référence</label>
                  <p className="font-medium mt-1 font-mono">{mouvement.reference}</p>
                </div>
              )}
              {mouvement.motif && (
                <div>
                  <label className="text-xs text-base-content/40 uppercase">Motif</label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{mouvement.motif}</p>
                </div>
              )}
              {mouvement.module_source && (
                <div>
                  <label className="text-xs text-base-content/40 uppercase">Module source</label>
                  <p className="text-sm mt-1">
                    <span className="badge badge-ghost badge-sm">{mouvement.module_source}</span>
                    {mouvement.object_id && (
                      <span className="font-mono text-xs ml-2 text-base-content/60">
                        #{mouvement.object_id}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Justificatif */}
          {mouvement.justificatif && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <FileText className="w-4 h-4 text-info" />
                <h2 className="font-semibold text-sm">Justificatif</h2>
              </div>
              <div className="p-5">
                <a
                  href={mouvement.justificatif}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Télécharger le justificatif
                </a>
              </div>
            </div>
          )}

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="space-y-6">

          {/* Résumé visuel */}
          <div className={`card shadow-sm border-2 ${
            mouvement.type === 'entree'
              ? 'bg-gradient-to-br from-success/5 to-success/10 border-success/30'
              : 'bg-gradient-to-br from-error/5 to-error/10 border-error/30'
          }`}>
            <div className="card-body text-center">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
                mouvement.type === 'entree' ? 'bg-success/20' : 'bg-error/20'
              }`}>
                {mouvement.type === 'entree' ? (
                  <ArrowDownRight className="w-10 h-10 text-success" />
                ) : (
                  <ArrowUpRight className="w-10 h-10 text-error" />
                )}
              </div>
              <p className="text-xs text-base-content/50 uppercase mt-2">
                {typeCfg.description}
              </p>
              <p className={`text-3xl font-bold font-mono ${
                mouvement.type === 'entree' ? 'text-success' : 'text-error'
              }`}>
                {mouvement.type === 'entree' ? '+' : '-'}{formaterMontant(mouvement.montant)}
              </p>
              <p className="font-mono text-xs text-base-content/50 mt-1">
                {mouvement.numero}
              </p>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                {mouvement.caisse && (
                  <Link to={`/caisses/${mouvement.caisse}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                    <Wallet className="w-4 h-4" /> Voir la caisse
                  </Link>
                )}
                {mouvement.compte_bancaire && (
                  <Link to={`/comptes-bancaires/${mouvement.compte_bancaire}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                    <Landmark className="w-4 h-4" /> Voir le compte
                  </Link>
                )}
                <Link to="/mouvements-tresorerie" className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Coins className="w-4 h-4" /> Tous les mouvements
                </Link>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3">Informations système</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-base-content/50">Créé le :</span>
                  <p className="font-medium">{formaterDateHeure(mouvement.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifié le :</span>
                  <p className="font-medium">{formaterDateHeure(mouvement.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="card bg-info/5 border border-info/20 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-info mb-1">À savoir</p>
                  <p className="text-base-content/70">
                    Les mouvements sont créés automatiquement lors de la validation
                    d'un encaissement ou du paiement d'un décaissement.
                  </p>
                </div>
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
              <h3 className="text-xl font-bold mb-2">Supprimer le mouvement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le mouvement <span className="font-bold font-mono">{mouvement.numero}</span> ?
                <br />
                <span className="text-error text-sm">Le solde de la caisse sera recalculé.</span>
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerMouvement} disabled={chargementAction}>
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

export default MouvementTresorerieDetail;