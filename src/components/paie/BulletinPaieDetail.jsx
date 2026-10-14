// components/paie/BulletinPaieDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileSpreadsheet, Edit, Trash2, Loader2, AlertCircle,
  Calculator, Calendar, DollarSign, User, Hash, FileText,
  CheckCircle, XCircle, Clock, Wallet, Landmark, Printer,
  MoreVertical, CheckSquare, Ban, Info, Building2,
  Briefcase, TrendingUp, TrendingDown, Receipt, Users, Percent
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration
// ============================================================
const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost', icon: Clock, description: 'En cours de préparation' },
  calcule: { label: 'Calculé', cls: 'badge-info', icon: Calculator, description: 'Montants calculés' },
  controle: { label: 'Contrôlé', cls: 'badge-warning', icon: CheckSquare, description: 'Contrôlé, en attente de validation' },
  valide: { label: 'Validé', cls: 'badge-primary', icon: CheckCircle, description: 'Validé, prêt à payer' },
  en_attente_paiement: { label: 'En attente paiement', cls: 'badge-warning', icon: Clock, description: 'En attente de paiement' },
  paye: { label: 'Payé', cls: 'badge-success', icon: CheckCircle, description: 'Payé' },
  annule: { label: 'Annulé', cls: 'badge-error', icon: XCircle, description: 'Annulé' },
};

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// ============================================================
// Actions de statut
// ============================================================
const ACTIONS_STATUT = [
  {
    action: 'calculer',
    label: 'Recalculer',
    icon: Calculator,
    color: 'info',
    from: ['brouillon', 'calcule'],
    confirmation: 'Recalculer tous les montants du bulletin ?',
  },
  {
    action: 'valider',
    label: 'Valider le bulletin',
    icon: CheckCircle,
    color: 'primary',
    from: ['brouillon', 'calcule', 'controle'],
    confirmation: 'Valider ce bulletin ? Il sera prêt à être payé.',
  },
  {
    action: 'marquer_paye',
    label: 'Marquer comme payé',
    icon: DollarSign,
    color: 'success',
    from: ['valide', 'en_attente_paiement'],
    confirmation: 'Marquer ce bulletin comme payé ?',
  },
];

const BulletinPaieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bulletin, setBulletin] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalAction, setShowModalAction] = useState(false);
  const [actionEnAttente, setActionEnAttente] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [menuStatutOuvert, setMenuStatutOuvert] = useState(false);

  useEffect(() => {
    chargerBulletin();
  }, [id]);

  const chargerBulletin = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/bulletins-paie/${id}/`);
      setBulletin(response.data);
    } catch (err) {
      setErreur('Bulletin introuvable');
    } finally {
      setChargement(false);
    }
  };

  const supprimerBulletin = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/bulletins-paie/${id}/`);
      navigate('/paie-bulletins');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const executerAction = async () => {
    if (!actionEnAttente) return;
    setChargementAction(true);
    setShowModalAction(false);

    try {
      if (actionEnAttente.action === 'calculer') {
        await AxiosInstance.post(`/bulletins-paie/${id}/calculer/`);
      } else {
        await AxiosInstance.post(`/bulletins-paie/${id}/${actionEnAttente.action}/`);
      }
      await chargerBulletin();
      setActionEnAttente(null);
      setMenuStatutOuvert(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setChargementAction(false);
    }
  };

  const handleClickAction = (actionObj) => {
    setMenuStatutOuvert(false);
    setActionEnAttente(actionObj);
    setShowModalAction(true);
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '—';

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

  if (erreur || !bulletin) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Bulletin introuvable'}</p>
        <Link to="/paie-bulletins" className="btn btn-primary mt-4">Retour aux bulletins</Link>
      </div>
    );
  }

  const statutCfg = STATUTS_CONFIG[bulletin.statut] || { label: bulletin.statut, cls: 'badge-ghost', icon: Clock };
  const IconStatut = statutCfg.icon;
  const actionsDisponibles = ACTIONS_STATUT.filter(a => a.from.includes(bulletin.statut));

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/paie-bulletins')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Paie / <Link to="/paie-bulletins" className="hover:text-primary">Bulletins</Link> /
              <span className="text-primary font-mono">{bulletin.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
              {bulletin.numero}
            </h1>
            <p className="text-base-content/60 mt-1">
              {bulletin.employe_nom} — {formaterDate(bulletin.periode_libelle || '')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className={`badge ${statutCfg.cls} badge-lg gap-2`}>
            <IconStatut className="w-4 h-4" />
            {statutCfg.label}
          </span>

          {/* Dropdown actions */}
          {actionsDisponibles.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setMenuStatutOuvert(!menuStatutOuvert)}
                className="btn btn-outline gap-2"
                disabled={chargementAction}
              >
                <MoreVertical className="w-4 h-4" />
                Actions
              </button>

              {menuStatutOuvert && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuStatutOuvert(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-base-100 rounded-lg shadow-xl border border-base-300 z-30 py-2">
                    <div className="px-4 py-2 text-xs text-base-content/40 uppercase tracking-wider border-b border-base-200 mb-1">
                      Actions disponibles
                    </div>
                    {actionsDisponibles.map((a) => {
                      const IconAction = a.icon;
                      return (
                        <button
                          key={a.action}
                          onClick={() => handleClickAction(a)}
                          disabled={chargementAction}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                        >
                          <IconAction className={`w-4 h-4 text-${a.color}`} />
                          <span className="font-medium">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

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

          {/* En-tête employé */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">

              {/* En-tête bulletin */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-primary">APG ASSAINISSEMENT</p>
                    <p className="text-xs text-base-content/50">Bulletin de paie</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-base-content/50 uppercase">N° Bulletin</p>
                  <p className="font-mono font-bold">{bulletin.numero}</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {formaterDate(bulletin.created_at)}
                  </p>
                </div>
              </div>

              {/* Infos employé */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-base-300">
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Employé</p>
                  <p className="font-bold">{bulletin.employe_nom}</p>
                  {bulletin.matricule_snapshot && (
                    <p className="text-xs text-base-content/60 font-mono">{bulletin.matricule_snapshot}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Poste</p>
                  <p className="font-medium">{bulletin.poste_snapshot || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Département</p>
                  <p className="font-medium">{bulletin.departement_snapshot || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Période</p>
                  <p className="font-medium font-mono">{bulletin.periode_libelle || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Jours travaillés</p>
                  <p className="font-medium">{bulletin.jours_travailles} / {bulletin.jours_theoriques} jours</p>
                </div>
              </div>

              {/* Éléments de rémunération */}
              <div className="py-4 space-y-3">

                <h3 className="font-bold text-sm uppercase text-base-content/60 mb-3">
                  Éléments de rémunération
                </h3>

                {/* Salaire de base */}
                <div className="flex justify-between items-center py-2 border-b border-base-200">
                  <span className="text-sm">Salaire de base</span>
                  <span className="font-mono font-medium">{formaterMontant(bulletin.salaire_base)}</span>
                </div>

                {/* Primes */}
                {Number(bulletin.total_primes) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-success">+ Primes</span>
                    <span className="font-mono font-medium text-success">
                      {formaterMontant(bulletin.total_primes)}
                    </span>
                  </div>
                )}

                {/* Indemnités */}
                {Number(bulletin.total_indemnites) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-success">+ Indemnités</span>
                    <span className="font-mono font-medium text-success">
                      {formaterMontant(bulletin.total_indemnites)}
                    </span>
                  </div>
                )}

                {/* Heures sup */}
                {Number(bulletin.montant_heures_sup) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-success">
                      + Heures supplémentaires ({bulletin.heures_supplementaires}h)
                    </span>
                    <span className="font-mono font-medium text-success">
                      {formaterMontant(bulletin.montant_heures_sup)}
                    </span>
                  </div>
                )}

                {/* Salaire brut */}
                <div className="flex justify-between items-center py-3 bg-base-200/50 px-3 rounded-lg">
                  <span className="font-bold">Salaire brut</span>
                  <span className="font-mono font-bold text-primary">
                    {formaterMontant(bulletin.salaire_brut)}
                  </span>
                </div>

                {/* Retenues */}
                <h3 className="font-bold text-sm uppercase text-base-content/60 mt-4 mb-2">
                  Retenues
                </h3>

                {Number(bulletin.cnss_salarial) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-error">− CNSS salarial</span>
                    <span className="font-mono font-medium text-error">
                      {formaterMontant(bulletin.cnss_salarial)}
                    </span>
                  </div>
                )}

                {Number(bulletin.impot_revenu) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-error">− Impôt sur le revenu</span>
                    <span className="font-mono font-medium text-error">
                      {formaterMontant(bulletin.impot_revenu)}
                    </span>
                  </div>
                )}

                {Number(bulletin.avances_deduites) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-error">− Avances déduites</span>
                    <span className="font-mono font-medium text-error">
                      {formaterMontant(bulletin.avances_deduites)}
                    </span>
                  </div>
                )}

                {Number(bulletin.autres_retenues) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-error">− Autres retenues</span>
                    <span className="font-mono font-medium text-error">
                      {formaterMontant(bulletin.autres_retenues)}
                    </span>
                  </div>
                )}

                {/* Total retenues */}
                <div className="flex justify-between items-center py-3 bg-error/5 px-3 rounded-lg">
                  <span className="font-bold">Total retenues</span>
                  <span className="font-mono font-bold text-error">
                    − {formaterMontant(bulletin.total_retenues)}
                  </span>
                </div>

                {/* Salaire net */}
                <div className="flex justify-between items-center py-4 bg-primary/10 px-4 rounded-xl border-2 border-primary/30 mt-4">
                  <span className="font-bold text-lg">SALAIRE NET À PAYER</span>
                  <span className="font-mono font-bold text-2xl text-primary">
                    {formaterMontant(bulletin.salaire_net)}
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="space-y-6">

          {/* Résumé statut */}
          <div className={`card shadow-sm border-2 ${
            bulletin.statut === 'paye' ? 'bg-success/5 border-success/30' :
            bulletin.statut === 'valide' ? 'bg-primary/5 border-primary/30' :
            bulletin.statut === 'controle' ? 'bg-warning/5 border-warning/30' :
            'bg-info/5 border-info/30'
          }`}>
            <div className="card-body">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                Statut du bulletin
              </h3>

              <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Net à payer</div>
                  <div className="stat-value text-2xl text-primary font-mono">
                    {formaterMontant(bulletin.salaire_net)}
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${
                    bulletin.statut === 'paye' ? 'bg-success/20' :
                    bulletin.statut === 'valide' ? 'bg-primary/20' :
                    bulletin.statut === 'controle' ? 'bg-warning/20' :
                    'bg-info/20'
                  } flex items-center justify-center`}>
                    <IconStatut className={`w-5 h-5 ${
                      bulletin.statut === 'paye' ? 'text-success' :
                      bulletin.statut === 'valide' ? 'text-primary' :
                      bulletin.statut === 'controle' ? 'text-warning' :
                      'text-info'
                    }`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{statutCfg.label}</p>
                    <p className="text-xs text-base-content/60">{statutCfg.description}</p>
                  </div>
                </div>

                {bulletin.date_paiement && (
                  <>
                    <div className="divider my-2"></div>
                    <div className="text-xs">
                      <span className="text-base-content/50">Payé le :</span>
                      <p className="font-medium">{formaterDate(bulletin.date_paiement)}</p>
                    </div>
                  </>
                )}

                {bulletin.mode_paiement && (
                  <div className="text-xs mt-2">
                    <span className="text-base-content/50">Mode :</span>
                    <p className="font-medium">{bulletin.mode_paiement}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charges patronales */}
          {Number(bulletin.cnss_patronal) > 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-info" />
                  Charges patronales
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/60">CNSS patronal</span>
                  <span className="font-mono font-bold text-info">
                    {formaterMontant(bulletin.cnss_patronal)}
                  </span>
                </div>
                <p className="text-[10px] text-base-content/40 mt-2">
                  Charge supportée par l'employeur
                </p>
              </div>
            </div>
          )}

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <MoreVertical className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <Link to={`/employes/${bulletin.employe}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <User className="w-4 h-4" /> Voir l'employé
                </Link>
                <Link to={`/paie-periodes/${bulletin.periode}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Calendar className="w-4 h-4" /> Voir la période
                </Link>
                <button onClick={() => window.print()} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Printer className="w-4 h-4" /> Imprimer le bulletin
                </button>
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
                    Les bulletins sont générés automatiquement lors du calcul d'une période.
                    Le numéro est unique et définitif.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL ACTION */}
      {showModalAction && actionEnAttente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalAction(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full bg-${actionEnAttente.color}/20 flex items-center justify-center mx-auto mb-4`}>
                <actionEnAttente.icon className={`w-8 h-8 text-${actionEnAttente.color}`} />
              </div>

              <h3 className="text-xl font-bold mb-2">{actionEnAttente.label}</h3>
              <p className="text-base-content/60 mb-4">{actionEnAttente.confirmation}</p>

              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalAction(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button
                  className={`btn btn-${actionEnAttente.color} flex-1`}
                  onClick={executerAction}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Traitement...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Confirmer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le bulletin</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le bulletin <strong className="font-mono">{bulletin.numero}</strong> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerBulletin} disabled={chargementAction}>
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

export default BulletinPaieDetail;