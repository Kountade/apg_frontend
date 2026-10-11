// components/comptabilite/DevisDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Edit, Trash2, Loader2, AlertCircle,
  Calculator, Calendar, DollarSign, User, FileCheck,
  CheckCircle, XCircle, Send, Clock, ThumbsUp, ThumbsDown,
  Printer, MoreVertical, Building2, FilePlus
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost', icon: FileText },
  envoye: { label: 'Envoyé', cls: 'badge-info', icon: Send },
  accepte: { label: 'Accepté', cls: 'badge-success', icon: ThumbsUp },
  refuse: { label: 'Refusé', cls: 'badge-error', icon: ThumbsDown },
  expire: { label: 'Expiré', cls: 'badge-warning', icon: Clock },
  transforme: { label: 'Transformé', cls: 'badge-primary', icon: FileCheck },
};

const DevisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devis, setDevis] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [etablissement, setEtablissement] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDevis();
    chargerEtablissement();
  }, [id]);

  const chargerDevis = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/devis/${id}/`);
      setDevis(response.data);
    } catch (err) {
      setErreur('Devis introuvable');
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

  const supprimerDevis = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/devis/${id}/`);
      navigate('/devis');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const changerStatut = async (nouveauStatut) => {
    setChargementAction(true);
    try {
      await AxiosInstance.patch(`/devis/${id}/`, { statut: nouveauStatut });
      await chargerDevis();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const transformerEnFacture = async () => {
    setChargementAction(true);
    try {
      const res = await AxiosInstance.post(`/devis/${id}/transformer_en_facture/`);
      if (res.data?.facture?.id) {
        navigate(`/factures/${res.data.facture.id}`);
      } else {
        await chargerDevis();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la transformation');
    } finally {
      setChargementAction(false);
    }
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

  if (erreur || !devis) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Devis introuvable'}</p>
        <Link to="/devis" className="btn btn-primary mt-4">Retour aux devis</Link>
      </div>
    );
  }

  const cfg = STATUTS_CONFIG[devis.statut] || { label: devis.statut, cls: 'badge-ghost', icon: FileText };
  const IconStatut = cfg.icon;

  const nomEntreprise = etablissement?.nom || 'APG ASSAINISSEMENT';
  const sigleEntreprise = etablissement?.sigle || 'APG';

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/devis')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Comptabilité / <Link to="/devis" className="hover:text-primary">Devis</Link> /
              <span className="text-primary font-mono">{devis.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              {devis.numero}
            </h1>
            <p className="text-base-content/60 mt-1">
              {devis.client_nom} — {devis.objet}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`badge ${cfg.cls} badge-lg gap-1`}>
            <IconStatut className="w-4 h-4" />
            {cfg.label}
          </span>

          {/* Changer statut */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-outline gap-2">
              <MoreVertical className="w-4 h-4" /> Changer statut
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-56 border border-base-300 z-30 mt-2">
              <li><button onClick={() => changerStatut('envoye')} disabled={chargementAction}><Send className="w-4 h-4" /> Marquer envoyé</button></li>
              <li><button onClick={() => changerStatut('accepte')} disabled={chargementAction}><ThumbsUp className="w-4 h-4" /> Marquer accepté</button></li>
              <li><button onClick={() => changerStatut('refuse')} disabled={chargementAction}><ThumbsDown className="w-4 h-4" /> Marquer refusé</button></li>
              <li><button onClick={() => changerStatut('expire')} disabled={chargementAction}><Clock className="w-4 h-4" /> Marquer expiré</button></li>
            </ul>
          </div>

          {devis.statut === 'accepte' && !devis.facture_generee && (
            <button
              onClick={transformerEnFacture}
              className="btn btn-success gap-2"
              disabled={chargementAction}
            >
              {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
              Transformer en facture
            </button>
          )}

          {devis.facture_generee && (
            <Link to={`/factures/${devis.facture_generee}`} className="btn btn-primary gap-2">
              <FileCheck className="w-4 h-4" /> Voir la facture
            </Link>
          )}

          <Link to={`/devis/${id}/modifier`} className="btn btn-primary gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>

          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Aperçu */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">

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
                  <p className="text-xs text-base-content/50 uppercase">Devis</p>
                  <p className="font-mono font-bold text-lg">{devis.numero}</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    Émis le {formaterDate(devis.date_emission)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-base-300">
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Client</p>
                  <p className="font-bold">{devis.client_nom}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Valide jusqu'au</p>
                  <p className="font-bold">{formaterDate(devis.date_validite)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-base-content/50 uppercase mb-1">Objet</p>
                  <p className="font-medium">{devis.objet}</p>
                </div>
              </div>

              {devis.lignes && devis.lignes.length > 0 && (
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
                      {devis.lignes.map((l) => (
                        <tr key={l.id} className="border-b border-base-200 last:border-0">
                          <td className="font-medium">{l.designation}</td>
                          <td className="text-right font-mono text-sm">{l.quantite}</td>
                          <td className="text-right font-mono text-sm">{formaterMontant(l.prix_unitaire)}</td>
                          <td className="text-right font-mono font-medium">{formaterMontant(l.montant_ht)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-4 border-t border-base-300 flex justify-end">
                <div className="w-full md:w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">Total HT :</span>
                    <span className="font-mono">{formaterMontant(devis.montant_ht)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">TVA ({devis.taux_tva}%) :</span>
                    <span className="font-mono">{formaterMontant(Number(devis.montant_ttc) - Number(devis.montant_ht))}</span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total TTC :</span>
                    <span className="font-mono text-primary">{formaterMontant(devis.montant_ttc)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {devis.notes && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <p className="text-xs text-base-content/50 uppercase mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{devis.notes}</p>
              </div>
            </div>
          )}

        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">

          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body">
              <div className="stat py-2 px-3 bg-base-100 rounded-lg">
                <div className="stat-title text-xs">Montant total TTC</div>
                <div className="stat-value text-xl text-primary font-mono">
                  {formaterMontant(devis.montant_ttc)}
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3">Actions rapides</h4>
              <div className="space-y-2">
                <Link to={`/clients/${devis.client}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <User className="w-4 h-4" /> Voir le client
                </Link>
                <button onClick={() => window.print()} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
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
              <h3 className="text-xl font-bold mb-2">Supprimer le devis</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le devis <span className="font-bold font-mono">{devis.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerDevis} disabled={chargementAction}>
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

export default DevisDetail;