// components/comptabilite/FactureDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Receipt, Edit, Trash2, Loader2, AlertCircle,
  Calculator, Calendar, DollarSign, User, Hash, FileText,
  CheckCircle, XCircle, Send, AlertTriangle, Clock,
  CreditCard, Ban, Building2, Phone, Mail, MapPin,
  Printer, Download, Copy, MoreVertical, Percent
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Config statuts et types
// ============================================================
const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost', icon: FileText },
  emise: { label: 'Émise', cls: 'badge-info', icon: Send },
  envoyee: { label: 'Envoyée', cls: 'badge-primary', icon: Send },
  partiellement_payee: { label: 'Partiellement payée', cls: 'badge-warning', icon: DollarSign },
  payee: { label: 'Payée', cls: 'badge-success', icon: CheckCircle },
  en_retard: { label: 'En retard', cls: 'badge-error', icon: AlertTriangle },
  litige: { label: 'Litige', cls: 'badge-error', icon: AlertCircle },
  annulee: { label: 'Annulée', cls: 'badge-neutral', icon: XCircle },
};

const TYPES_CONFIG = {
  proforma: { label: 'Pro-forma', cls: 'badge-outline' },
  definitive: { label: 'Définitive', cls: 'badge-primary' },
  avoir: { label: 'Avoir', cls: 'badge-warning' },
};

const FactureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facture, setFacture] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [etablissement, setEtablissement] = useState(null);

  // Modals
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalPaiement, setShowModalPaiement] = useState(false);
  const [showModalStatut, setShowModalStatut] = useState(false);
  const [actionStatut, setActionStatut] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerFacture();
    chargerEtablissement();
  }, [id]);

  const chargerFacture = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/factures/${id}/`);
      setFacture(response.data);
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 404) {
        setErreur('Facture non trouvée');
      } else {
        setErreur('Impossible de charger la facture');
      }
    } finally {
      setChargement(false);
    }
  };

  const chargerEtablissement = async () => {
    try {
      const res = await AxiosInstance.get('/etablissements/unique/');
      if (res.data) setEtablissement(res.data);
    } catch (err) {
      setEtablissement({ nom: 'APG ASSAINISSEMENT', sigle: 'APG' });
    }
  };

  // ============================================================
  // Actions
  // ============================================================
  const supprimerFacture = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/factures/${id}/`);
      navigate('/factures');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const changerStatut = async (action) => {
    setChargementAction(true);
    try {
      if (action === 'enregistrer_paiement') {
        setMontantPaiement(facture.solde_restant);
        setShowModalPaiement(true);
        setShowModalStatut(false);
        setChargementAction(false);
        return;
      }

      if (action === 'marquer_payee') {
        await AxiosInstance.patch(`/factures/${id}/`, {
          montant_paye: facture.montant_ttc,
          statut: 'payee',
        });
      } else if (action === 'marquer_retard') {
        await AxiosInstance.patch(`/factures/${id}/`, {
          statut: 'en_retard',
        });
      } else if (action === 'marquer_litige') {
        await AxiosInstance.patch(`/factures/${id}/`, {
          statut: 'litige',
        });
      } else {
        await AxiosInstance.post(`/factures/${id}/${action}/`);
      }

      await chargerFacture();
      setShowModalStatut(false);
      setActionStatut(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
    }
  };

  const enregistrerPaiement = async () => {
    if (!montantPaiement) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/factures/${id}/enregistrer_paiement/`, {
        montant: parseFloat(montantPaiement),
      });
      await chargerFacture();
      setShowModalPaiement(false);
      setMontantPaiement('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du paiement');
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

  const getBadgeStatut = (statut) => {
    const cfg = STATUTS_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-lg gap-1`}>
        <Icon className="w-4 h-4" />
        {cfg.label}
      </span>
    );
  };

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || { label: type, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls} badge-sm`}>{cfg.label}</span>;
  };

  // ============================================================
  // Actions disponibles selon le statut
  // ============================================================
  const getActionsDisponibles = () => {
    if (!facture) return [];

    const actions = [];
    const statut = facture.statut;

    if (statut === 'brouillon') {
      actions.push({ action: 'emettre', label: 'Émettre', icon: Send, cls: 'btn-info' });
    }
    if (statut === 'emise') {
      actions.push({ action: 'valider', label: 'Marquer envoyée', icon: Send, cls: 'btn-primary' });
    }
    if (['emise', 'envoyee', 'partiellement_payee', 'en_retard'].includes(statut)) {
      actions.push({ action: 'enregistrer_paiement', label: 'Enregistrer paiement', icon: CreditCard, cls: 'btn-success' });
      actions.push({ action: 'marquer_payee', label: 'Marquer payée', icon: CheckCircle, cls: 'btn-success' });
    }
    if (['emise', 'envoyee', 'partiellement_payee'].includes(statut)) {
      actions.push({ action: 'marquer_retard', label: 'Marquer en retard', icon: Clock, cls: 'btn-warning' });
    }
    if (['emise', 'envoyee', 'partiellement_payee', 'en_retard'].includes(statut)) {
      actions.push({ action: 'marquer_litige', label: 'Marquer en litige', icon: AlertTriangle, cls: 'btn-error' });
    }
    if (!['payee', 'annulee'].includes(statut)) {
      actions.push({ action: 'annuler', label: 'Annuler la facture', icon: Ban, cls: 'btn-error' });
    }

    return actions;
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !facture) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Facture introuvable'}</p>
        <Link to="/factures" className="btn btn-primary mt-4">
          Retour aux factures
        </Link>
      </div>
    );
  }

  const actions = getActionsDisponibles();
  const nomEntreprise = etablissement?.nom || 'APG ASSAINISSEMENT';
  const sigleEntreprise = etablissement?.sigle || 'APG';
  const enRetard = facture.est_en_retard && facture.statut !== 'payee';

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/factures')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Comptabilité / <Link to="/factures" className="hover:text-primary">Factures</Link> /
              <span className="text-primary font-mono">{facture.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Receipt className="w-8 h-8 text-primary" />
              {facture.numero}
              {getBadgeType(facture.type)}
            </h1>
            <p className="text-base-content/60 mt-1">
              {facture.client_nom} — {facture.objet || 'Sans objet'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {getBadgeStatut(facture.statut)}

          {/* Menu changer statut */}
          {actions.length > 0 && (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-outline gap-2">
                <MoreVertical className="w-4 h-4" />
                Changer statut
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-64 border border-base-300 z-30 mt-2">
                <li className="menu-title text-xs uppercase text-base-content/40">
                  Actions disponibles
                </li>
                {actions.map((a) => {
                  const IconAction = a.icon;
                  return (
                    <li key={a.action}>
                      <button
                        onClick={() => changerStatut(a.action)}
                        disabled={chargementAction}
                        className="gap-2"
                      >
                        <IconAction className="w-4 h-4" />
                        {a.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <Link to={`/factures/${id}/modifier`} className="btn btn-primary gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>

          <button
            onClick={() => setShowModalSuppression(true)}
            className="btn btn-error gap-2"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* ALERTE RETARD */}
      {enRetard && (
        <div className="alert alert-error mb-6">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-bold">Facture en retard</p>
            <p className="text-sm">
              Cette facture est en retard de <strong>{facture.jours_retard} jours</strong> (échéance : {formaterDate(facture.date_echeance)})
            </p>
          </div>
        </div>
      )}

      {/* CONTENU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Aperçu facture */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">

              {/* En-tête facture */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-primary">{nomEntreprise}</p>
                    <p className="text-xs text-base-content/50">{sigleEntreprise}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-base-content/50 uppercase">Facture</p>
                  <p className="font-mono font-bold text-lg">{facture.numero}</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    Émise le {formaterDate(facture.date_emission)}
                  </p>
                </div>
              </div>

              {/* Client */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-base-300">
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Client</p>
                  <p className="font-bold">{facture.client_nom}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Échéance</p>
                  <p className={`font-bold ${enRetard ? 'text-error' : ''}`}>
                    {formaterDate(facture.date_echeance)}
                  </p>
                </div>
                {facture.periode_debut && facture.periode_fin && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Période</p>
                    <p className="font-medium">
                      Du {formaterDate(facture.periode_debut)} au {formaterDate(facture.periode_fin)}
                    </p>
                  </div>
                )}
                {facture.objet && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Objet</p>
                    <p className="font-medium">{facture.objet}</p>
                  </div>
                )}
              </div>

              {/* Lignes */}
              {facture.lignes && facture.lignes.length > 0 ? (
                <div className="py-4">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="border-b border-base-300">
                        <th className="text-xs uppercase text-base-content/60">Désignation</th>
                        <th className="text-xs uppercase text-base-content/60 text-right">Qté</th>
                        <th className="text-xs uppercase text-base-content/60 text-right">Prix unit.</th>
                        <th className="text-xs uppercase text-base-content/60 text-right">Montant HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facture.lignes.map((ligne) => (
                        <tr key={ligne.id} className="border-b border-base-200 last:border-0">
                          <td>
                            <p className="font-medium">{ligne.designation}</p>
                            {ligne.description && (
                              <p className="text-xs text-base-content/50">{ligne.description}</p>
                            )}
                          </td>
                          <td className="text-right font-mono text-sm">
                            {ligne.quantite} {ligne.unite || ''}
                          </td>
                          <td className="text-right font-mono text-sm">
                            {formaterMontant(ligne.prix_unitaire)}
                          </td>
                          <td className="text-right font-mono font-medium">
                            {formaterMontant(ligne.montant_ht)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-4 text-center text-base-content/50 text-sm">
                  Aucune ligne détaillée
                </div>
              )}

              {/* Totaux */}
              <div className="pt-4 border-t border-base-300 flex justify-end">
                <div className="w-full md:w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">Total HT :</span>
                    <span className="font-mono">{formaterMontant(facture.montant_ht)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">TVA ({facture.taux_tva}%) :</span>
                    <span className="font-mono">{formaterMontant(facture.montant_tva)}</span>
                  </div>
                  {Number(facture.remise) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Remise :</span>
                      <span className="font-mono text-error">-{formaterMontant(facture.remise)}</span>
                    </div>
                  )}
                  <div className="divider my-1"></div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total TTC :</span>
                    <span className="font-mono text-primary">{formaterMontant(facture.montant_ttc)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-base-300">
                    <span className="text-base-content/60">Déjà payé :</span>
                    <span className="font-mono text-success">{formaterMontant(facture.montant_paye)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-error">
                    <span>Reste à payer :</span>
                    <span className="font-mono">{formaterMontant(facture.solde_restant)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Conditions */}
          {(facture.conditions_paiement || facture.notes) && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                {facture.conditions_paiement && (
                  <div className="mb-3">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Conditions de paiement</p>
                    <p className="text-sm whitespace-pre-wrap">{facture.conditions_paiement}</p>
                  </div>
                )}
                {facture.notes && (
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Notes internes</p>
                    <p className="text-sm whitespace-pre-wrap">{facture.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">

          {/* Résumé paiement */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Résumé paiement
              </h3>
              <div className="space-y-3">
                <div className="stat py-2 px-3 bg-base-100 rounded-lg">
                  <div className="stat-title text-xs">Total TTC</div>
                  <div className="stat-value text-xl text-primary font-mono">
                    {formaterMontant(facture.montant_ttc)}
                  </div>
                </div>
                <div className="stat py-2 px-3 bg-base-100 rounded-lg">
                  <div className="stat-title text-xs">Encaissé</div>
                  <div className="stat-value text-xl text-success font-mono">
                    {formaterMontant(facture.montant_paye)}
                  </div>
                </div>
                <div className="stat py-2 px-3 bg-base-100 rounded-lg">
                  <div className="stat-title text-xs">Reste dû</div>
                  <div className={`stat-value text-xl font-mono ${
                    Number(facture.solde_restant) > 0 ? 'text-error' : 'text-success'
                  }`}>
                    {formaterMontant(facture.solde_restant)}
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-base-content/50 mb-1">
                    <span>Progression</span>
                    <span>
                      {facture.montant_ttc && Number(facture.montant_ttc) > 0
                        ? Math.round((Number(facture.montant_paye) / Number(facture.montant_ttc)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <progress
                    className="progress progress-success w-full"
                    value={facture.montant_ttc && Number(facture.montant_ttc) > 0
                      ? (Number(facture.montant_paye) / Number(facture.montant_ttc)) * 100
                      : 0}
                    max="100"
                  ></progress>
                </div>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-base-content/50" />
                Informations
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-base-content/50">Type :</span>
                  <p className="mt-0.5">{getBadgeType(facture.type)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Créée le :</span>
                  <p className="font-medium">{formaterDateHeure(facture.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifiée le :</span>
                  <p className="font-medium">{formaterDateHeure(facture.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <MoreVertical className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <Link to={`/clients/${facture.client}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <User className="w-4 h-4" /> Voir le client
                </Link>
                {facture.contrat && (
                  <Link to={`/contrats-clients/${facture.contrat}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                    <FileText className="w-4 h-4" /> Voir le contrat
                  </Link>
                )}
                <button
                  onClick={() => window.print()}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <Link to={`/factures/${id}/modifier`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Edit className="w-4 h-4" /> Modifier la facture
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
              <h3 className="text-xl font-bold mb-2">Supprimer la facture</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer la facture{' '}
                <span className="font-bold font-mono">{facture.numero}</span> ?
                <br />
                <span className="text-error text-sm">Cette action est irréversible !</span>
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerFacture} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT */}
      {showModalPaiement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalPaiement(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enregistrer un paiement</h3>
              <p className="text-base-content/60 text-sm">
                Facture <span className="font-bold font-mono">{facture.numero}</span>
              </p>
            </div>

            <div className="bg-base-200/50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/60">Montant TTC :</span>
                <span className="font-mono font-medium">{formaterMontant(facture.montant_ttc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Déjà payé :</span>
                <span className="font-mono font-medium text-success">{formaterMontant(facture.montant_paye)}</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between font-bold">
                <span>Reste à payer :</span>
                <span className="font-mono text-error">{formaterMontant(facture.solde_restant)}</span>
              </div>
            </div>

            <div className="form-control w-full mb-4">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">
                  Montant à encaisser (GNF)
                </span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full font-mono"
                value={montantPaiement}
                onChange={(e) => setMontantPaiement(e.target.value)}
                min="0"
                step="100"
                max={facture.solde_restant}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button className="btn flex-1" onClick={() => setShowModalPaiement(false)} disabled={chargementAction}>
                Annuler
              </button>
              <button
                className="btn btn-success flex-1"
                onClick={enregistrerPaiement}
                disabled={chargementAction || !montantPaiement}
              >
                {chargementAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactureDetail;