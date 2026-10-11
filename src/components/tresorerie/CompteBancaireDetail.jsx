// components/tresorerie/CompteBancaireDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Landmark, Edit, Trash2, Loader2, AlertCircle,
  Calculator, CheckCircle, TrendingUp, TrendingDown,
  Plus, Eye, Info, Printer, Smartphone, Building2,
  CreditCard, User, Hash, FileText, Coins,
  ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  banque: { label: 'Compte bancaire', icon: Landmark, cls: 'badge-primary' },
  mobile_money: { label: 'Mobile Money', icon: Smartphone, cls: 'badge-success' },
  caisse_populaire: { label: 'Caisse populaire', icon: Building2, cls: 'badge-warning' },
  autre: { label: 'Autre', icon: CreditCard, cls: 'badge-ghost' },
};

const CompteBancaireDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [compte, setCompte] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [ongletActif, setOngletActif] = useState('infos');

  useEffect(() => {
    chargerCompte();
  }, [id]);

  const chargerCompte = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/comptes-bancaires/${id}/`);
      setCompte(response.data);

      // Charger les mouvements
      const mvtRes = await AxiosInstance.get(`/mouvements-tresorerie/?compte_bancaire=${id}`).catch(() => ({ data: [] }));
      setMouvements(mvtRes.data.results || mvtRes.data || []);
    } catch (err) {
      setErreur('Compte introuvable');
    } finally {
      setChargement(false);
    }
  };

  const supprimerCompte = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/comptes-bancaires/${id}/`);
      navigate('/comptes-bancaires');
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

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || { label: type, cls: 'badge-ghost', icon: CreditCard };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-lg gap-2`}>
        <Icon className="w-4 h-4" />
        {cfg.label}
      </span>
    );
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !compte) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Compte introuvable'}</p>
        <Link to="/comptes-bancaires" className="btn btn-primary mt-4">Retour aux comptes</Link>
      </div>
    );
  }

  const entrees = mouvements.filter(m => m.type === 'entree');
  const sorties = mouvements.filter(m => m.type === 'sortie');
  const totalEntrees = entrees.reduce((sum, m) => sum + Number(m.montant || 0), 0);
  const totalSorties = sorties.reduce((sum, m) => sum + Number(m.montant || 0), 0);

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/comptes-bancaires')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Trésorerie / <Link to="/comptes-bancaires" className="hover:text-primary">Comptes bancaires</Link> /
              <span className="text-primary font-mono">{compte.code}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Landmark className="w-8 h-8 text-primary" />
              {compte.nom}
              {getBadgeType(compte.type)}
            </h1>
            <p className="text-base-content/60 mt-1">
              {compte.banque || 'Sans banque'} — {compte.titulaire || 'Sans titulaire'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`badge badge-lg ${compte.actif ? 'badge-success' : 'badge-ghost'}`}>
            {compte.actif ? 'Actif' : 'Inactif'}
          </span>

          <Link to={`/comptes-bancaires/${id}/modifier`} className="btn btn-primary gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>

          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

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
              className={`tab gap-2 ${ongletActif === 'mouvements' ? 'tab-active' : ''}`}
              onClick={() => setOngletActif('mouvements')}
            >
              <TrendingUp className="w-4 h-4" /> Mouvements
              {mouvements.length > 0 && (
                <span className="badge badge-sm">{mouvements.length}</span>
              )}
            </button>
          </div>

          {/* Onglet Informations */}
          {ongletActif === 'infos' && (
            <>
              {/* Informations bancaires */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations bancaires</h2>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Code</label>
                    <p className="font-medium mt-1 font-mono flex items-center gap-2">
                      <Hash className="w-4 h-4 text-base-content/40" />
                      {compte.code}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Type</label>
                    <p className="mt-1">{getBadgeType(compte.type)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Banque</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-base-content/40" />
                      {compte.banque || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Numéro de compte</label>
                    <p className="font-medium mt-1 font-mono">{compte.numero_compte || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">IBAN</label>
                    <p className="font-medium mt-1 font-mono text-sm">{compte.iban || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">SWIFT / BIC</label>
                    <p className="font-medium mt-1 font-mono">{compte.swift || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Titulaire</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-base-content/40" />
                      {compte.titulaire || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Devise</label>
                    <p className="font-medium mt-1">{compte.devise}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {compte.notes && (
                <div className="card bg-base-100 shadow-sm border border-base-300">
                  <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-base-content/60" />
                    <h2 className="font-semibold text-sm">Notes</h2>
                  </div>
                  <div className="p-5">
                    <p className="text-sm whitespace-pre-wrap">{compte.notes}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Onglet Mouvements */}
          {ongletActif === 'mouvements' && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-info" />
                <h2 className="font-semibold text-sm">Mouvements du compte</h2>
                <span className="badge badge-info badge-sm ml-auto">
                  {mouvements.length} mouvement{mouvements.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-5">
                {mouvements.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead>
                        <tr className="border-b border-base-300">
                          <th className="text-xs uppercase text-base-content/60">Date</th>
                          <th className="text-xs uppercase text-base-content/60">Type</th>
                          <th className="text-xs uppercase text-base-content/60">Référence</th>
                          <th className="text-xs uppercase text-base-content/60">Origine</th>
                          <th className="text-xs uppercase text-base-content/60 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mouvements.map((m) => (
                          <tr key={m.id} className="border-b border-base-200 last:border-0">
                            <td className="text-xs">{formaterDate(m.date_mouvement)}</td>
                            <td>
                              {m.type === 'entree' ? (
                                <span className="badge badge-success badge-xs gap-1">
                                  <ArrowDownRight className="w-3 h-3" />
                                  Entrée
                                </span>
                              ) : (
                                <span className="badge badge-error badge-xs gap-1">
                                  <ArrowUpRight className="w-3 h-3" />
                                  Sortie
                                </span>
                              )}
                            </td>
                            <td className="text-xs font-mono">{m.numero}</td>
                            <td className="text-sm">{m.origine || '—'}</td>
                            <td className={`text-right font-mono font-medium ${
                              m.type === 'entree' ? 'text-success' : 'text-error'
                            }`}>
                              {m.type === 'entree' ? '+' : '-'}{formaterMontant(m.montant)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-base-300">
                          <td colSpan="4" className="text-right font-bold">Total entrées :</td>
                          <td className="text-right font-mono font-bold text-success">
                            +{formaterMontant(totalEntrees)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="4" className="text-right font-bold">Total sorties :</td>
                          <td className="text-right font-mono font-bold text-error">
                            -{formaterMontant(totalSorties)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-base-content/50 text-sm py-4">
                    Aucun mouvement enregistré
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* COLONNE LATÉRALE */}
        <div className="space-y-6">

          {/* Solde */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                Solde du compte
              </h3>

              <div className="space-y-3">
                <div className="stat py-2 px-3 bg-base-100 rounded-lg">
                  <div className="stat-title text-xs">Solde initial</div>
                  <div className="stat-value text-lg font-mono">
                    {formaterMontant(compte.solde_initial)}
                  </div>
                </div>

                <div className="stat py-3 px-3 bg-base-100 rounded-lg border-2 border-primary">
                  <div className="stat-title text-xs">Solde actuel</div>
                  <div className="stat-value text-2xl font-mono text-primary">
                    {formaterMontant(compte.solde_actuel)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <Link
                  to={`/encaissements/ajouter?compte=${id}`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <ArrowDownRight className="w-4 h-4 text-success" /> Nouvel encaissement
                </Link>
                <Link
                  to={`/decaissements/ajouter?compte=${id}`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <ArrowUpRight className="w-4 h-4 text-error" /> Nouveau décaissement
                </Link>
                <Link
                  to={`/comptes-bancaires/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" /> Modifier le compte
                </Link>
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
                  <span className="text-base-content/50">Créé le :</span>
                  <p className="font-medium">{formaterDateHeure(compte.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifié le :</span>
                  <p className="font-medium">{formaterDateHeure(compte.updated_at)}</p>
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
              <h3 className="text-xl font-bold mb-2">Supprimer le compte</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le compte <span className="font-bold font-mono">{compte.code}</span> — {compte.nom} ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerCompte} disabled={chargementAction}>
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

export default CompteBancaireDetail;