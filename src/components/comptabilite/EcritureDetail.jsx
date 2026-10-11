// components/comptabilite/EcritureDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Edit, Trash2, Loader2, AlertCircle,
  Calculator, Calendar, Hash, CheckCircle, XCircle,
  Scale, FileText, CheckSquare, AlertTriangle, Building2
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const EcritureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ecriture, setEcriture] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerEcriture();
  }, [id]);

  const chargerEcriture = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/ecritures-comptables/${id}/`);
      setEcriture(response.data);
    } catch (err) {
      setErreur('Écriture introuvable');
    } finally {
      setChargement(false);
    }
  };

  const supprimerEcriture = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/ecritures-comptables/${id}/`);
      navigate('/ecritures-comptables');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const validerEcriture = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/ecritures-comptables/${id}/valider/`);
      await chargerEcriture();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setChargementAction(false);
    }
  };

  const annulerEcriture = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/ecritures-comptables/${id}/annuler/`);
      await chargerEcriture();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
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

  if (erreur || !ecriture) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur || 'Écriture introuvable'}</p>
        <Link to="/ecritures-comptables" className="btn btn-primary mt-4">Retour aux écritures</Link>
      </div>
    );
  }

  const equilibree = Number(ecriture.total_debit) === Number(ecriture.total_credit);

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/ecritures-comptables')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Calculator className="w-3 h-3" />
              Comptabilité / <Link to="/ecritures-comptables" className="hover:text-primary">Écritures</Link> /
              <span className="text-primary font-mono">{ecriture.numero}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              {ecriture.numero}
            </h1>
            <p className="text-base-content/60 mt-1">{ecriture.libelle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`badge badge-lg gap-1 ${
            ecriture.statut === 'validee' ? 'badge-success' :
            ecriture.statut === 'brouillon' ? 'badge-ghost' : 'badge-info'
          }`}>
            {ecriture.statut}
          </span>

          {ecriture.statut === 'brouillon' && equilibree && (
            <button onClick={validerEcriture} className="btn btn-success gap-2" disabled={chargementAction}>
              <CheckCircle className="w-4 h-4" /> Valider
            </button>
          )}

          {ecriture.statut === 'validee' && (
            <button onClick={annulerEcriture} className="btn btn-warning gap-2" disabled={chargementAction}>
              <XCircle className="w-4 h-4" /> Annuler
            </button>
          )}

          <Link to={`/ecritures-comptables/${id}/modifier`} className="btn btn-primary gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>

          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* ALERTE */}
      {!equilibree && (
        <div className="alert alert-error mb-6">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-bold">Écriture non équilibrée</p>
            <p className="text-sm">Écart : {formaterMontant(Math.abs(Number(ecriture.total_debit) - Number(ecriture.total_credit)))}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Informations */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Informations</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-base-content/40 uppercase">Numéro</label>
                <p className="font-medium mt-1 font-mono flex items-center gap-2">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  {ecriture.numero}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Date</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-base-content/40" />
                  {formaterDate(ecriture.date_ecriture)}
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Journal</label>
                <p className="font-medium mt-1">
                  <span className="badge badge-ghost badge-sm font-mono">
                    {ecriture.journal_code || '—'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-base-content/40 uppercase">Référence</label>
                <p className="font-medium mt-1 font-mono">{ecriture.reference || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-base-content/40 uppercase">Libellé</label>
                <p className="font-medium mt-1">{ecriture.libelle}</p>
              </div>
            </div>
          </div>

          {/* Lignes */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Scale className="w-4 h-4 text-info" />
              <h2 className="font-semibold text-sm">Lignes d'écriture</h2>
              <span className="badge badge-info badge-sm ml-auto">
                {ecriture.lignes?.length || 0} ligne{(ecriture.lignes?.length || 0) > 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-5">
              {ecriture.lignes && ecriture.lignes.length > 0 ? (
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="border-b border-base-300">
                      <th className="text-xs uppercase text-base-content/60">Compte</th>
                      <th className="text-xs uppercase text-base-content/60">Libellé</th>
                      <th className="text-xs uppercase text-base-content/60 text-right">Débit</th>
                      <th className="text-xs uppercase text-base-content/60 text-right">Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecriture.lignes.map((l) => (
                      <tr key={l.id} className="border-b border-base-200 last:border-0">
                        <td>
                          <span className="font-mono text-sm font-medium">{l.compte_numero}</span>
                          <p className="text-xs text-base-content/50">{l.compte_libelle}</p>
                        </td>
                        <td className="text-sm">{l.libelle || '—'}</td>
                        <td className="text-right font-mono text-sm">
                          {Number(l.debit) > 0 ? formaterMontant(l.debit) : '—'}
                        </td>
                        <td className="text-right font-mono text-sm">
                          {Number(l.credit) > 0 ? formaterMontant(l.credit) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-base-300 font-bold">
                      <td colSpan="2" className="text-right">TOTAUX</td>
                      <td className="text-right font-mono text-primary">{formaterMontant(ecriture.total_debit)}</td>
                      <td className="text-right font-mono text-primary">{formaterMontant(ecriture.total_credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="text-center text-base-content/50 text-sm py-4">Aucune ligne</p>
              )}
            </div>
          </div>

        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">

          <div className={`card shadow-sm border ${equilibree ? 'bg-gradient-to-br from-success/5 to-success/10 border-success/20' : 'bg-gradient-to-br from-error/5 to-error/10 border-error/20'}`}>
            <div className="card-body text-center">
              {equilibree ? (
                <>
                  <CheckCircle className="w-16 h-16 text-success mx-auto" />
                  <p className="font-bold text-lg text-success">Équilibrée</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 text-error mx-auto" />
                  <p className="font-bold text-lg text-error">Non équilibrée</p>
                </>
              )}
              <div className="divider my-2"></div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/60">Total Débit :</span>
                  <span className="font-mono font-medium">{formaterMontant(ecriture.total_debit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/60">Total Crédit :</span>
                  <span className="font-mono font-medium">{formaterMontant(ecriture.total_credit)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3">Informations système</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-base-content/50">Créée le :</span>
                  <p className="font-medium">{formaterDate(ecriture.created_at)}</p>
                </div>
                <div>
                  <span className="text-base-content/50">Modifiée le :</span>
                  <p className="font-medium">{formaterDate(ecriture.updated_at)}</p>
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
              <h3 className="text-xl font-bold mb-2">Supprimer l'écriture</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'écriture <span className="font-bold font-mono">{ecriture.numero}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerEcriture} disabled={chargementAction}>
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

export default EcritureDetail;