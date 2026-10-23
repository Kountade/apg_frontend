// src/components/achats/DemandeAchatDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FilePlus, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock, Send, User, Briefcase, AlertTriangle,
  Package, Info, FileText, ShieldCheck, FileCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon',  color: 'ghost',   icon: FilePlus },
  soumise:   { label: 'Soumise',    color: 'info',    icon: Send },
  validee:   { label: 'Validée',    color: 'success', icon: CheckCircle },
  refusee:   { label: 'Refusée',    color: 'error',   icon: XCircle },
  convertie: { label: 'Convertie',  color: 'primary', icon: CheckCircle },
  annulee:   { label: 'Annulée',    color: 'ghost',   icon: XCircle },
};

const URGENCES_CONFIG = {
  basse:    { label: 'Basse',    color: 'ghost' },
  normale:  { label: 'Normale',  color: 'info' },
  haute:    { label: 'Haute',    color: 'warning' },
  critique: { label: 'Critique', color: 'error' },
};

const DemandeAchatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);

  const [showModalValider, setShowModalValider] = useState(false);
  const [showModalRefuser, setShowModalRefuser] = useState(false);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    charger();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/demandes-achat/${id}/`);
      setDemande(res.data);
    } catch (err) {
      setErreur('Impossible de charger la demande');
    } finally {
      setChargement(false);
    }
  };

  const soumettre = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/demandes-achat/${id}/soumettre/`);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la soumission');
    } finally {
      setChargementAction(false);
    }
  };

  const valider = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/demandes-achat/${id}/valider/`, {
        commentaire_validation: commentaire,
      });
      setShowModalValider(false);
      setCommentaire('');
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setChargementAction(false);
    }
  };

  const refuser = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/demandes-achat/${id}/refuser/`, {
        commentaire_validation: commentaire,
      });
      setShowModalRefuser(false);
      setCommentaire('');
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
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !demande) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/demandes-achat')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const statutCfg = STATUTS_CONFIG[demande.statut] || STATUTS_CONFIG.brouillon;
  const urgenceCfg = URGENCES_CONFIG[demande.urgence] || URGENCES_CONFIG.normale;
  const IconStatut = statutCfg.icon;

  const lignes = demande.lignes || [];
  const montantTotal = lignes.reduce(
    (s, l) => s + Number(l.quantite || 0) * Number(l.prix_estime || 0), 0
  );

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/demandes-achat')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Demandes /{' '}
              <span className="text-primary font-mono">{demande.numero}</span>
            </div>
            <h1 className="text-xl font-bold truncate">{demande.objet}</h1>
          </div>
          <span className={`badge badge-${statutCfg.color} badge-lg gap-1`}>
            <IconStatut className="w-4 h-4" /> {statutCfg.label}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* CARTE PRINCIPALE */}
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Demandeur</p>
                <p className="font-medium text-sm truncate">
                  {demande.demandeur_nom || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Service</p>
                <p className="text-sm">{demande.service || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Urgence</p>
                <span className={`badge badge-${urgenceCfg.color} badge-sm`}>
                  {urgenceCfg.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date demande</p>
                <p className="font-mono text-sm">{formaterDate(demande.date_demande)}</p>
              </div>
            </div>

            {demande.date_souhaitee && (
              <>
                <div className="divider my-2"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Date souhaitée</p>
                    <p className="font-mono text-sm">{formaterDate(demande.date_souhaitee)}</p>
                  </div>
                </div>
              </>
            )}

            {demande.motif && (
              <>
                <div className="divider my-2"></div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Motif</p>
                  <p className="text-sm whitespace-pre-wrap">{demande.motif}</p>
                </div>
              </>
            )}

            {demande.commentaire_validation && (
              <>
                <div className="divider my-2"></div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">
                    Commentaire de validation
                  </p>
                  <p className="text-sm whitespace-pre-wrap italic">
                    {demande.commentaire_validation}
                  </p>
                  {demande.validee_par_nom && (
                    <p className="text-xs text-base-content/60 mt-1">
                      — {demande.validee_par_nom}, le {formaterDate(demande.date_validation)}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* LIGNES */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Lignes de la demande</h2>
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
                      <th className="text-xs uppercase text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l, i) => (
                      <tr key={l.id} className="border-b border-base-200 last:border-0">
                        <td>
                          <span className="badge badge-ghost badge-sm font-mono">
                            {i + 1}
                          </span>
                        </td>
                        <td>
                          <p className="text-sm font-medium">{l.designation}</p>
                          {l.article_stock_code && (
                            <p className="text-xs text-base-content/50 font-mono">
                              [{l.article_stock_code}] {l.article_stock_designation}
                            </p>
                          )}
                          {l.description && (
                            <p className="text-xs text-base-content/60">{l.description}</p>
                          )}
                        </td>
                        <td className="text-right font-mono text-sm">
                          {l.quantite}
                        </td>
                        <td>
                          <span className="text-xs">{l.unite}</span>
                        </td>
                        <td className="text-right font-mono text-xs">
                          {formaterMontant(l.prix_estime)}
                        </td>
                        <td className="text-right font-mono font-bold text-sm">
                          {formaterMontant(
                            Number(l.quantite || 0) * Number(l.prix_estime || 0)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-base-300">
                      <td colSpan="5" className="text-right font-bold text-sm">
                        Total estimé :
                      </td>
                      <td className="text-right font-mono font-bold text-success text-lg">
                        {formaterMontant(montantTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        {['brouillon', 'soumise'].includes(demande.statut) && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70">
                  {demande.statut === 'brouillon' && (
                    <>La demande est en <strong>brouillon</strong>. Soumettez-la pour la faire valider.</>
                  )}
                  {demande.statut === 'soumise' && (
                    <>La demande est <strong>soumise</strong>. Un validateur doit l'approuver ou la refuser.</>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                {demande.statut === 'brouillon' && (
                  <>
                    <Link to={`/demandes-achat/${id}/modifier`} className="btn btn-ghost">
                      Modifier
                    </Link>
                    <button
                      onClick={soumettre}
                      className="btn btn-info gap-2"
                      disabled={chargementAction}
                    >
                      {chargementAction ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Soumettre pour validation
                    </button>
                  </>
                )}
                {demande.statut === 'soumise' && (
                  <>
                    <button
                      onClick={() => {
                        setCommentaire('');
                        setShowModalRefuser(true);
                      }}
                      className="btn btn-error gap-2"
                      disabled={chargementAction}
                    >
                      <XCircle className="w-4 h-4" /> Refuser
                    </button>
                    <button
                      onClick={() => {
                        setCommentaire('');
                        setShowModalValider(true);
                      }}
                      className="btn btn-success gap-2"
                      disabled={chargementAction}
                    >
                      <ShieldCheck className="w-4 h-4" /> Valider
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions post-validation */}
        {demande.statut === 'validee' && (
          <div className="card bg-success/5 border border-success/20">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-sm font-medium text-success">Demande validée</p>
              </div>
              <p className="text-xs text-base-content/70 mb-3">
                Cette demande peut maintenant être convertie en bon de commande.
              </p>
              <div className="flex justify-end">
                <Link
                  to={`/bons-commande/ajouter?demande=${id}`}
                  className="btn btn-primary gap-2"
                >
                  <FileCheck className="w-4 h-4" /> Créer un bon de commande
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL VALIDER */}
      {showModalValider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalValider(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-1">Valider la demande</h3>
              <p className="text-sm text-base-content/60">
                {demande.numero} — {demande.objet}
              </p>
            </div>
            <div className="form-control w-full mb-4">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">
                  Commentaire (optionnel)
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows="2"
                placeholder="Motif de validation..."
              ></textarea>
            </div>
            <div className="flex gap-3">
              <button
                className="btn flex-1"
                onClick={() => setShowModalValider(false)}
                disabled={chargementAction}
              >
                Annuler
              </button>
              <button
                className="btn btn-success flex-1 gap-2"
                onClick={valider}
                disabled={chargementAction}
              >
                {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REFUSER */}
      {showModalRefuser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalRefuser(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-1">Refuser la demande</h3>
              <p className="text-sm text-base-content/60">
                {demande.numero} — {demande.objet}
              </p>
            </div>
            <div className="form-control w-full mb-4">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">
                  Motif du refus <span className="text-error">*</span>
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows="3"
                placeholder="Expliquez pourquoi la demande est refusée..."
              ></textarea>
            </div>
            <div className="flex gap-3">
              <button
                className="btn flex-1"
                onClick={() => setShowModalRefuser(false)}
                disabled={chargementAction}
              >
                Annuler
              </button>
              <button
                className="btn btn-error flex-1 gap-2"
                onClick={refuser}
                disabled={chargementAction}
              >
                {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandeAchatDetail;