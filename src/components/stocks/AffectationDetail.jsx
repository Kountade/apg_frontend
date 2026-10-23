// src/components/stocks/AffectationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, UserCheck, Loader2, AlertCircle, CheckCircle,
  Clock, User, HardHat, RotateCcw, Info, Calendar
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ETATS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'bon', label: 'Bon état' },
  { value: 'usage', label: 'Usagé' },
  { value: 'defectueux', label: 'Défectueux' },
  { value: 'hors_service', label: 'Hors service' },
];

const AffectationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [affectation, setAffectation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);

  const [showModalRetour, setShowModalRetour] = useState(false);
  const [etatApres, setEtatApres] = useState('bon');
  const [observationRetour, setObservationRetour] = useState('');

  useEffect(() => {
    charger();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/affectations-equipements/${id}/`);
      setAffectation(res.data);
      setEtatApres(res.data.etat_avant || 'bon');
    } catch (err) {
      setErreur("Impossible de charger l'affectation");
    } finally {
      setChargement(false);
    }
  };

  const enregistrerRetour = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/affectations-equipements/${id}/retour/`, {
        etat_apres: etatApres,
        observation: observationRetour || affectation.observation,
      });
      setShowModalRetour(false);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du retour');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !affectation) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/affectations')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const estEnCours = !affectation.date_retour;
  const beneficiaire = affectation.employe_nom || affectation.equipe_nom || '—';

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/affectations')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Affectations /{' '}
              <span className="text-primary font-mono">
                {affectation.equipement_code}
              </span>
            </div>
            <h1 className="text-xl font-bold truncate">
              {affectation.equipement_designation}
            </h1>
          </div>
          {estEnCours ? (
            <span className="badge badge-info badge-lg gap-1">
              <Clock className="w-4 h-4" /> En cours
            </span>
          ) : (
            <span className="badge badge-success badge-lg gap-1">
              <CheckCircle className="w-4 h-4" /> Retournée
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* CARTE INFO */}
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <HardHat className="w-8 h-8 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono text-base-content/50">
                  {affectation.equipement_code}
                </p>
                <p className="text-xl font-bold truncate">
                  {affectation.equipement_designation}
                </p>
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Bénéficiaire</p>
                <p className="font-medium">{beneficiaire}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date affectation</p>
                <p className="font-mono">{formaterDate(affectation.date_affectation)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date retour</p>
                <p className="font-mono">{formaterDate(affectation.date_retour)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">État avant</p>
                <p className="font-medium">
                  {ETATS.find(e => e.value === affectation.etat_avant)?.label || affectation.etat_avant || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">État après</p>
                <p className="font-medium">
                  {ETATS.find(e => e.value === affectation.etat_apres)?.label || affectation.etat_apres || '—'}
                </p>
              </div>
            </div>

            {affectation.observation && (
              <>
                <div className="divider my-2"></div>
                <p className="text-xs text-base-content/70 whitespace-pre-wrap">
                  {affectation.observation}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        {estEnCours && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70">
                  Enregistrez le retour lorsque l'équipement est rendu. L'état après
                  peut être différent de l'état avant (usure, dégradation).
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Link to="/affectations" className="btn btn-ghost">
                  Retour à la liste
                </Link>
                <button
                  onClick={() => setShowModalRetour(true)}
                  className="btn btn-warning gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Enregistrer le retour
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL RETOUR */}
      {showModalRetour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalRetour(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-1">Enregistrer le retour</h3>
            <p className="text-sm text-base-content/60 mb-4">
              {affectation.equipement_code} — {affectation.equipement_designation}
            </p>

            <div className="space-y-4">
              <div className="form-control w-full">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">
                    État après retour <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={etatApres}
                  onChange={(e) => setEtatApres(e.target.value)}
                >
                  {ETATS.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Observation</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={observationRetour}
                  onChange={(e) => setObservationRetour(e.target.value)}
                  rows="2"
                  placeholder="Notes sur l'état..."
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="btn flex-1"
                onClick={() => setShowModalRetour(false)}
                disabled={chargementAction}
              >
                Annuler
              </button>
              <button
                className="btn btn-warning flex-1 gap-2"
                onClick={enregistrerRetour}
                disabled={chargementAction}
              >
                {chargementAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffectationDetail;