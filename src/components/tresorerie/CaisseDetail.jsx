// components/tresorerie/CaisseDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Banknote, Edit, Trash2, Loader2, AlertCircle,
  Calculator, Users, TrendingUp, TrendingDown, Coins,
  CheckCircle, XCircle, RefreshCcw, Plus, Eye,
  ArrowDownRight, ArrowUpRight, Info, Printer
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CaisseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caisse, setCaisse] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalAjustement, setShowModalAjustement] = useState(false);
  const [nouveauSolde, setNouveauSolde] = useState('');
  const [chargementAction, setChargementAction] = useState(false);
  const [ongletActif, setOngletActif] = useState('infos');

  useEffect(() => {
    chargerCaisse();
  }, [id]);

  const chargerCaisse = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/caisses/${id}/`);
      setCaisse(response.data);

      // Charger les mouvements
      const mvtRes = await AxiosInstance.get(`/mouvements-caisse/?caisse=${id}`).catch(() => ({ data: [] }));
      setMouvements(mvtRes.data.results || mvtRes.data || []);
    } catch (err) {
      setErreur('Caisse introuvable');
    } finally {
      setChargement(false);
    }
  };

  const supprimerCaisse = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/caisses/${id}/`);
      navigate('/caisses');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const recalculerSolde = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/caisses/${id}/recalculer_solde/`);
      await chargerCaisse();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const ajusterSolde = async () => {
    if (!nouveauSolde) return;
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/caisses/${id}/ajuster_solde/`, {
        solde_physique: parseFloat(nouveauSolde),
      });
      await chargerCaisse();
      setShowModalAjustement(false);
      setNouveauSolde('');
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

  if (erreur || !caisse) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Caisse introuvable'}</p>
        <Link to="/caisses" className="btn btn-primary mt-4">Retour aux caisses</Link>
      </div>
    );
  }

  const ecart = Number(caisse.difference || 0);
  const mouvementsEntrees = mouvements.filter(m => m.type === 'entree');
  const mouvementsSorties = mouvements.filter(m => m.type === 'sortie');
  const totalEntrees = mouvementsEntrees.reduce((sum, m) => sum + Number(m.montant || 0), 0);
  const totalSorties = mouvementsSorties.reduce((sum, m) => sum + Number(m.montant || 0), 0);

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/caisses')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Trésorerie / <Link to="/caisses" className="hover:text-primary">Caisses</Link> /
              <span className="text-primary font-mono">{caisse.code}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Banknote className="w-8 h-8 text-primary" />
              {caisse.nom}
            </h1>
            <p className="text-base-content/60 mt-1">
              {caisse.responsable_nom ? `Responsable : ${caisse.responsable_nom}` : 'Sans responsable'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`badge badge-lg ${caisse.actif ? 'badge-success' : 'badge-ghost'}`}>
            {caisse.actif ? 'Active' : 'Inactive'}
          </span>

          <button
            onClick={recalculerSolde}
            className="btn btn-outline gap-2"
            disabled={chargementAction}
          >
            {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Recalculer
          </button>

          <button
            onClick={() => { setNouveauSolde(caisse.solde_physique); setShowModalAjustement(true); }}
            className="btn btn-info gap-2"
          >
            <Coins className="w-4 h-4" /> Ajuster solde
          </button>

          <Link to={`/caisses/${id}/modifier`} className="btn btn-primary gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>

          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* ALERTE ÉCART */}
      {ecart !== 0 && (
        <div className={`alert ${ecart > 0 ? 'alert-success' : 'alert-error'} mb-6`}>
          {ecart > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          <div>
            <p className="font-bold">
              {ecart > 0 ? 'Excédent de caisse' : 'Déficit de caisse'}
            </p>
            <p className="text-sm">
              Écart détecté : <strong>{formaterMontant(Math.abs(ecart))}</strong>
              {ecart > 0 ? ' en plus' : ' en moins'} par rapport au solde théorique
            </p>
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
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Informations de la caisse</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-base-content/40 uppercase">Code</label>
                  <p className="font-medium mt-1 font-mono">{caisse.code}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/40 uppercase">Nom</label>
                  <p className="font-medium mt-1">{caisse.nom}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/40 uppercase">Responsable</label>
                  <p className="font-medium mt-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-base-content/40" />
                    {caisse.responsable_nom || 'Aucun'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-base-content/40 uppercase">Devise</label>
                  <p className="font-medium mt-1">{caisse.devise}</p>
                </div>
                {caisse.description && (
                  <div className="md:col-span-2">
                    <label className="text-xs text-base-content/40 uppercase">Description</label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{caisse.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Mouvements */}
          {ongletActif === 'mouvements' && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-info" />
                <h2 className="font-semibold text-sm">Mouvements de caisse</h2>
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
                          <th className="text-xs uppercase text-base-content/60">Libellé</th>
                          <th className="text-xs uppercase text-base-content/60 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mouvements.map((m) => (
                          <tr key={m.id} className="border-b border-base-200 last:border-0">
                            <td className="text-xs">{formaterDate(m.date_mouvement)}</td>
                            <td>
                              {m.type === 'entree' ? (
                                <span className="badge badge-success badge-sm gap-1">
                                  <ArrowDownRight className="w-3 h-3" />
                                  Entrée
                                </span>
                              ) : (
                                <span className="badge badge-error badge-sm gap-1">
                                  <ArrowUpRight className="w-3 h-3" />
                                  Sortie
                                </span>
                              )}
                            </td>
                            <td className="text-sm">{m.libelle}</td>
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
                          <td colSpan="3" className="text-right font-bold">Total entrées :</td>
                          <td className="text-right font-mono font-bold text-success">
                            +{formaterMontant(totalEntrees)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-right font-bold">Total sorties :</td>
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

          {/* Soldes */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                Soldes
              </h3>

              <div className="space-y-3">
                <div className="stat py-2 px-3 bg-base-100 rounded-lg">
                  <div className="stat-title text-xs">Solde initial</div>
                  <div className="stat-value text-lg font-mono">
                    {formaterMontant(caisse.solde_initial)}
                  </div>
                </div>

                <div className="stat py-2 px-3 bg-base-100 rounded-lg">
                  <div className="stat-title text-xs">Solde théorique</div>
                  <div className="stat-value text-lg font-mono text-info">
                    {formaterMontant(caisse.solde_theorique)}
                  </div>
                </div>

                <div className="stat py-2 px-3 bg-base-100 rounded-lg">
                  <div className="stat-title text-xs">Solde physique</div>
                  <div className="stat-value text-lg font-mono text-warning">
                    {formaterMontant(caisse.solde_physique)}
                  </div>
                </div>

                <div className={`stat py-2 px-3 bg-base-100 rounded-lg ${
                  ecart === 0 ? 'border-2 border-success' :
                  ecart > 0 ? 'border-2 border-info' : 'border-2 border-error'
                }`}>
                  <div className="stat-title text-xs">Écart</div>
                  <div className={`stat-value text-lg font-mono ${
                    ecart === 0 ? 'text-success' :
                    ecart > 0 ? 'text-info' : 'text-error'
                  }`}>
                    {ecart === 0 ? '✓ Équilibré' : formaterMontant(ecart)}
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
                  to={`/encaissements/ajouter?caisse=${id}`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <ArrowDownRight className="w-4 h-4 text-success" /> Nouvel encaissement
                </Link>
                <Link
                  to={`/decaissements/ajouter?caisse=${id}`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <ArrowUpRight className="w-4 h-4 text-error" /> Nouveau décaissement
                </Link>
                <Link
                  to={`/caisses/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" /> Modifier la caisse
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
                  <span className="text-base-content/50">Créée le :</span>
                  <p className="font-medium">{formaterDateHeure(caisse.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifiée le :</span>
                  <p className="font-medium">{formaterDateHeure(caisse.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL AJUSTEMENT */}
      {showModalAjustement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalAjustement(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-info/20 flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-info" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ajuster le solde physique</h3>
              <p className="text-base-content/60 text-sm">
                Saisissez le solde réel compté en caisse
              </p>
            </div>

            <div className="bg-base-200/50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/60">Solde théorique :</span>
                <span className="font-mono font-medium">{formaterMontant(caisse.solde_theorique)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Solde physique actuel :</span>
                <span className="font-mono font-medium">{formaterMontant(caisse.solde_physique)}</span>
              </div>
            </div>

            <div className="form-control w-full mb-4">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">Nouveau solde physique (GNF)</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full font-mono"
                value={nouveauSolde}
                onChange={(e) => setNouveauSolde(e.target.value)}
                min="0"
                step="100"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button className="btn flex-1" onClick={() => setShowModalAjustement(false)} disabled={chargementAction}>
                Annuler
              </button>
              <button
                className="btn btn-info flex-1"
                onClick={ajusterSolde}
                disabled={chargementAction || !nouveauSolde}
              >
                {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajuster'}
              </button>
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
              <h3 className="text-xl font-bold mb-2">Supprimer la caisse</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer la caisse <span className="font-bold font-mono">{caisse.code}</span> — {caisse.nom} ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerCaisse} disabled={chargementAction}>
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

export default CaisseDetail;