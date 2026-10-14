// components/paie/PeriodePaieDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Edit, Trash2, Loader2, AlertCircle,
  Calculator, CheckCircle, XCircle, Clock, DollarSign,
  CheckSquare, Lock, TrendingUp, Users, Activity,
  MoreVertical, Send, Ban, Eye, FileText, Info,
  ChevronRight, FileSpreadsheet, Printer
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des statuts et actions
// ============================================================
const STATUTS_CONFIG = {
  ouverte: { label: 'Ouverte', cls: 'badge-ghost', icon: Clock, color: 'ghost', description: 'Nouvelle période créée' },
  en_preparation: { label: 'En préparation', cls: 'badge-info', icon: Activity, color: 'info', description: 'Préparation en cours' },
  calculee: { label: 'Calculée', cls: 'badge-primary', icon: Calculator, color: 'primary', description: 'Bulletins calculés' },
  controlee: { label: 'Contrôlée', cls: 'badge-warning', icon: CheckSquare, color: 'warning', description: 'En attente de validation' },
  validee: { label: 'Validée', cls: 'badge-success', icon: CheckCircle, color: 'success', description: 'Prête à payer' },
  en_attente_paiement: { label: 'En attente paiement', cls: 'badge-warning', icon: Clock, color: 'warning', description: 'En attente de paiement' },
  payee: { label: 'Payée', cls: 'badge-success', icon: CheckCircle, color: 'success', description: 'Salaires versés' },
  cloturee: { label: 'Clôturée', cls: 'badge-neutral', icon: Lock, color: 'neutral', description: 'Clôturée' },
  annulee: { label: 'Annulée', cls: 'badge-error', icon: XCircle, color: 'error', description: 'Annulée' },
};

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// ============================================================
// Actions disponibles selon statut
// ============================================================
const ACTIONS_STATUT = [
  {
    action: 'preparer',
    label: 'Passer en préparation',
    icon: Activity,
    color: 'info',
    from: ['ouverte'],
    confirmation: 'Passer cette période en préparation ?',
  },
  {
    action: 'calculer',
    label: 'Calculer les bulletins',
    icon: Calculator,
    color: 'primary',
    from: ['ouverte', 'en_preparation'],
    confirmation: 'Calculer tous les bulletins de cette période ?',
  },
  {
    action: 'controler',
    label: 'Contrôler',
    icon: CheckSquare,
    color: 'warning',
    from: ['calculee'],
    confirmation: 'Marquer cette période comme contrôlée ?',
  },
  {
    action: 'valider',
    label: 'Valider',
    icon: CheckCircle,
    color: 'success',
    from: ['controlee'],
    confirmation: 'Valider cette période ? Les bulletins seront prêts à être payés.',
  },
  {
    action: 'marquer_payee',
    label: 'Marquer payée',
    icon: DollarSign,
    color: 'success',
    from: ['validee', 'en_attente_paiement'],
    confirmation: 'Marquer cette période comme payée ? Tous les bulletins seront marqués payés.',
  },
  {
    action: 'cloturer',
    label: 'Clôturer',
    icon: Lock,
    color: 'neutral',
    from: ['payee'],
    confirmation: 'Clôturer définitivement cette période ?',
  },
  {
    action: 'annuler',
    label: 'Annuler la période',
    icon: Ban,
    color: 'error',
    danger: true,
    from: ['ouverte', 'en_preparation', 'calculee', 'controlee'],
    confirmation: 'Annuler définitivement cette période ? Cette action est irréversible.',
  },
];

const PeriodePaieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [periode, setPeriode] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalAction, setShowModalAction] = useState(false);
  const [actionEnAttente, setActionEnAttente] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [menuStatutOuvert, setMenuStatutOuvert] = useState(false);
  const [ongletActif, setOngletActif] = useState('infos');

  useEffect(() => {
    chargerPeriode();
  }, [id]);

  const chargerPeriode = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/periodes-paie/${id}/`);
      setPeriode(response.data);

      // Charger les bulletins
      const bultRes = await AxiosInstance.get(`/bulletins-paie/?periode=${id}`).catch(() => ({ data: [] }));
      setBulletins(bultRes.data.results || bultRes.data || []);
    } catch (err) {
      setErreur('Période introuvable');
    } finally {
      setChargement(false);
    }
  };

  const supprimerPeriode = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/periodes-paie/${id}/`);
      navigate('/paie-periodes');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const executerAction = async () => {
    if (!actionEnAttente) return;
    setChargementAction(true);
    setShowModalAction(false);

    try {
      await AxiosInstance.post(`/periodes-paie/${id}/${actionEnAttente.action}/`);
      await chargerPeriode();
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

  const formaterDateHeure = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const formaterMoisAnnee = (mois, annee) => `${MOIS_NOMS[mois - 1] || 'Mois'} ${annee}`;

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !periode) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Période introuvable'}</p>
        <Link to="/paie-periodes" className="btn btn-primary mt-4">Retour aux périodes</Link>
      </div>
    );
  }

  const statutCfg = STATUTS_CONFIG[periode.statut] || { label: periode.statut, cls: 'badge-ghost', icon: Clock };
  const IconStatut = statutCfg.icon;
  const actionsDisponibles = ACTIONS_STATUT.filter(a => a.from.includes(periode.statut));

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/paie-periodes')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Paie / <Link to="/paie-periodes" className="hover:text-primary">Périodes</Link> /
              <span className="text-primary font-mono">{String(periode.mois).padStart(2, '0')}/{periode.annee}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-primary" />
              {formaterMoisAnnee(periode.mois, periode.annee)}
            </h1>
            <p className="text-base-content/60 mt-1">
              {periode.libelle || `Paie ${formaterMoisAnnee(periode.mois, periode.annee)}`}
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
                  <div className="absolute right-0 top-full mt-2 w-72 bg-base-100 rounded-lg shadow-xl border border-base-300 z-30 py-2">
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
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left ${
                            a.danger ? 'text-error hover:bg-error/10' : ''
                          }`}
                        >
                          <IconAction className={`w-4 h-4 ${a.danger ? 'text-error' : `text-${a.color}`}`} />
                          <span className="font-medium">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {!['payee', 'cloturee', 'annulee'].includes(periode.statut) && (
            <Link to={`/paie-periodes/${id}/modifier`} className="btn btn-primary gap-2">
              <Edit className="w-4 h-4" /> Modifier
            </Link>
          )}

          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* ALERTE STATUT */}
      {periode.statut === 'controlee' && (
        <div className="alert alert-warning mb-6">
          <CheckSquare className="w-5 h-5" />
          <div>
            <p className="font-bold">En attente de validation</p>
            <p className="text-sm">Cette période est contrôlée et attend la validation du PDG.</p>
          </div>
        </div>
      )}

      {periode.statut === 'validee' && (
        <div className="alert alert-success mb-6">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-bold">Validée — Prête à payer</p>
            <p className="text-sm">Vous pouvez maintenant effectuer le paiement des salaires.</p>
          </div>
        </div>
      )}

      {/* CONTENU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Onglets */}
          <div className="tabs tabs-boxed bg-base-100 shadow-sm p-1 border border-base-300">
            <button
              className={`tab gap-2 ${ongletActif === 'infos' ? 'tab-active' : ''}`}
              onClick={() => setOngletActif('infos')}
            >
              <Info className="w-4 h-4" /> Informations
            </button>
            <button
              className={`tab gap-2 ${ongletActif === 'bulletins' ? 'tab-active' : ''}`}
              onClick={() => setOngletActif('bulletins')}
            >
              <FileSpreadsheet className="w-4 h-4" /> Bulletins
              {bulletins.length > 0 && (
                <span className="badge badge-sm">{bulletins.length}</span>
              )}
            </button>
          </div>

          {/* Onglet Informations */}
          {ongletActif === 'infos' && (
            <>
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations</h2>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Mois</label>
                    <p className="font-medium mt-1">{MOIS_NOMS[periode.mois - 1]}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Année</label>
                    <p className="font-medium mt-1">{periode.annee}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Date de début</label>
                    <p className="font-medium mt-1">{formaterDate(periode.date_debut)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Date de fin</label>
                    <p className="font-medium mt-1">{formaterDate(periode.date_fin)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Date de paiement prévue</label>
                    <p className="font-medium mt-1 text-info">{formaterDate(periode.date_paiement_prevue)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Statut</label>
                    <p className="mt-1">
                      <span className={`badge ${statutCfg.cls} badge-sm gap-1`}>
                        <IconStatut className="w-3 h-3" />
                        {statutCfg.label}
                      </span>
                    </p>
                  </div>
                  {periode.notes && (
                    <div className="md:col-span-2">
                      <label className="text-xs text-base-content/40 uppercase">Notes</label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{periode.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Totaux */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Totaux de la période</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-base-200/30 rounded-lg">
                      <p className="text-xs text-base-content/50 uppercase">Employés</p>
                      <p className="text-2xl font-bold text-primary">{periode.nombre_employes}</p>
                    </div>
                    <div className="p-3 bg-base-200/30 rounded-lg">
                      <p className="text-xs text-base-content/50 uppercase">Total brut</p>
                      <p className="text-lg font-bold font-mono">{formaterMontant(periode.total_brut)}</p>
                    </div>
                    <div className="p-3 bg-base-200/30 rounded-lg">
                      <p className="text-xs text-base-content/50 uppercase">Total retenues</p>
                      <p className="text-lg font-bold font-mono text-error">{formaterMontant(periode.total_retenues)}</p>
                    </div>
                    <div className="p-3 bg-base-200/30 rounded-lg">
                      <p className="text-xs text-base-content/50 uppercase">CNSS</p>
                      <p className="text-lg font-bold font-mono text-warning">{formaterMontant(periode.total_cnss)}</p>
                    </div>
                    <div className="p-3 bg-primary/5 border-2 border-primary/30 rounded-lg col-span-2">
                      <p className="text-xs text-base-content/50 uppercase">Total net à payer</p>
                      <p className="text-2xl font-bold text-primary font-mono">{formaterMontant(periode.total_net)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Workflow de la période</h2>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  {periode.preparee_par_nom && (
                    <div className="flex items-center gap-3 p-3 bg-info/5 rounded-lg">
                      <Activity className="w-4 h-4 text-info" />
                      <div>
                        <p className="text-xs text-base-content/50">Préparée par</p>
                        <p className="font-medium">{periode.preparee_par_nom}</p>
                      </div>
                    </div>
                  )}
                  {periode.controlee_par_nom && (
                    <div className="flex items-center gap-3 p-3 bg-warning/5 rounded-lg">
                      <CheckSquare className="w-4 h-4 text-warning" />
                      <div>
                        <p className="text-xs text-base-content/50">Contrôlée par</p>
                        <p className="font-medium">{periode.controlee_par_nom}</p>
                        <p className="text-xs text-base-content/40">{formaterDateHeure(periode.date_controle)}</p>
                      </div>
                    </div>
                  )}
                  {periode.validee_par_nom && (
                    <div className="flex items-center gap-3 p-3 bg-success/5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <div>
                        <p className="text-xs text-base-content/50">Validée par</p>
                        <p className="font-medium">{periode.validee_par_nom}</p>
                        <p className="text-xs text-base-content/40">{formaterDateHeure(periode.date_validation)}</p>
                      </div>
                    </div>
                  )}
                  {periode.payee_par_nom && (
                    <div className="flex items-center gap-3 p-3 bg-success/5 rounded-lg">
                      <DollarSign className="w-4 h-4 text-success" />
                      <div>
                        <p className="text-xs text-base-content/50">Payée par</p>
                        <p className="font-medium">{periode.payee_par_nom}</p>
                        <p className="text-xs text-base-content/40">{formaterDateHeure(periode.date_paiement)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Onglet Bulletins */}
          {ongletActif === 'bulletins' && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Bulletins de paie</h2>
                </div>
                <span className="badge badge-info badge-sm">
                  {bulletins.length} bulletin{bulletins.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-5">
                {bulletins.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead>
                        <tr className="border-b border-base-300">
                          <th className="text-xs uppercase text-base-content/60">Numéro</th>
                          <th className="text-xs uppercase text-base-content/60">Employé</th>
                          <th className="text-xs uppercase text-base-content/60 text-right">Brut</th>
                          <th className="text-xs uppercase text-base-content/60 text-right">Net</th>
                          <th className="text-xs uppercase text-base-content/60">Statut</th>
                          <th className="text-xs uppercase text-base-content/60 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulletins.map(b => (
                          <tr key={b.id} className="border-b border-base-200 last:border-0">
                            <td>
                              <span className="font-mono text-xs">{b.numero}</span>
                            </td>
                            <td>
                              <p className="font-medium text-sm">{b.employe_nom}</p>
                            </td>
                            <td className="text-right font-mono text-sm">
                              {formaterMontant(b.salaire_brut)}
                            </td>
                            <td className="text-right font-mono text-sm font-bold text-primary">
                              {formaterMontant(b.salaire_net)}
                            </td>
                            <td>
                              <span className={`badge badge-sm ${
                                b.statut === 'paye' ? 'badge-success' :
                                b.statut === 'valide' ? 'badge-primary' : 'badge-ghost'
                              }`}>
                                {b.statut}
                              </span>
                            </td>
                            <td>
                              <div className="flex justify-end gap-1">
                                <Link to={`/paie-bulletins/${b.id}`} className="btn btn-ghost btn-xs">
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-base-content/50 text-sm py-8">
                    Aucun bulletin pour cette période
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="space-y-6">

          <div className={`card shadow-sm border-2 ${
            periode.statut === 'payee' || periode.statut === 'validee' ? 'bg-success/5 border-success/30' :
            periode.statut === 'controlee' ? 'bg-warning/5 border-warning/30' :
            'bg-primary/5 border-primary/30'
          }`}>
            <div className="card-body text-center">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
                periode.statut === 'payee' || periode.statut === 'validee' ? 'bg-success/20' :
                periode.statut === 'controlee' ? 'bg-warning/20' :
                'bg-primary/20'
              }`}>
                <IconStatut className={`w-10 h-10 ${
                  periode.statut === 'payee' || periode.statut === 'validee' ? 'text-success' :
                  periode.statut === 'controlee' ? 'text-warning' :
                  'text-primary'
                }`} />
              </div>
              <p className="font-bold text-lg mt-2">{statutCfg.label}</p>
              <p className="text-xs text-base-content/60">{statutCfg.description}</p>
              <div className="divider my-2"></div>
              <p className="text-2xl font-bold text-primary font-mono">
                {formaterMontant(periode.total_net)}
              </p>
              <p className="text-xs text-base-content/50">Total net à payer</p>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                {actionsDisponibles.slice(0, 5).map(a => {
                  const IconAction = a.icon;
                  return (
                    <button
                      key={a.action}
                      onClick={() => handleClickAction(a)}
                      disabled={chargementAction}
                      className={`btn btn-sm justify-start w-full gap-2 ${
                        a.danger ? 'btn-error btn-outline' : `btn-${a.color} btn-outline`
                      }`}
                    >
                      <IconAction className="w-4 h-4" /> {a.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => window.print()}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3">Informations système</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-base-content/50">Créée le :</span>
                  <p className="font-medium">{formaterDateHeure(periode.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifiée le :</span>
                  <p className="font-medium">{formaterDateHeure(periode.updated_at)}</p>
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
              <div className={`w-16 h-16 rounded-full ${
                actionEnAttente.danger ? 'bg-error/20' : `bg-${actionEnAttente.color}/20`
              } flex items-center justify-center mx-auto mb-4`}>
                <actionEnAttente.icon className={`w-8 h-8 ${
                  actionEnAttente.danger ? 'text-error' : `text-${actionEnAttente.color}`
                }`} />
              </div>

              <h3 className="text-xl font-bold mb-2">{actionEnAttente.label}</h3>
              <p className="text-base-content/60 mb-4">{actionEnAttente.confirmation}</p>

              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalAction(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button
                  className={`btn flex-1 ${actionEnAttente.danger ? 'btn-error' : `btn-${actionEnAttente.color}`}`}
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
              <h3 className="text-xl font-bold mb-2">Supprimer la période</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la période <strong>{formaterMoisAnnee(periode.mois, periode.annee)}</strong> ?
                <br />
                <span className="text-error text-sm">Tous les bulletins seront supprimés.</span>
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerPeriode} disabled={chargementAction}>
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

export default PeriodePaieDetail;