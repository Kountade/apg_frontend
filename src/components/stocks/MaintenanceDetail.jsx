// src/components/stocks/MaintenanceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wrench, Loader2, AlertCircle, CheckCircle,
  Clock, PlayCircle, XCircle, DollarSign, User, HardHat,
  Shield, Info, Calendar, CheckSquare
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  planifiee: { label: 'Planifiée',  color: 'info',    icon: Clock },
  en_cours:  { label: 'En cours',   color: 'warning', icon: PlayCircle },
  terminee:  { label: 'Terminée',   color: 'success', icon: CheckCircle },
  annulee:   { label: 'Annulée',    color: 'ghost',   icon: XCircle },
};

const TYPES_CONFIG = {
  preventive: { label: 'Préventive', color: 'info' },
  corrective: { label: 'Corrective', color: 'warning' },
  urgence:    { label: 'Urgence',    color: 'error' },
  revision:   { label: 'Révision',   color: 'primary' },
};

const MaintenanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [maintenance, setMaintenance] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);

  const [showModalTerminer, setShowModalTerminer] = useState(false);
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    charger();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/maintenances/${id}/`);
      setMaintenance(res.data);
    } catch (err) {
      setErreur('Impossible de charger la maintenance');
    } finally {
      setChargement(false);
    }
  };

  const terminer = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/maintenances/${id}/terminer/`, {
        date_fin: dateFin,
      });
      setShowModalTerminer(false);
      await charger();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la clôture');
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

  if (erreur || !maintenance) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/maintenances')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const statutCfg = STATUTS_CONFIG[maintenance.statut] || STATUTS_CONFIG.planifiee;
  const typeCfg = TYPES_CONFIG[maintenance.type] || TYPES_CONFIG.corrective;
  const IconStatut = statutCfg.icon;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/maintenances')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Maintenance / <span className="text-primary font-mono">{maintenance.numero}</span>
            </div>
            <h1 className="text-xl font-bold truncate">
              {maintenance.equipement_code} — {maintenance.equipement_designation}
            </h1>
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
                <p className="text-xs text-base-content/50 uppercase">Type</p>
                <span className={`badge badge-${typeCfg.color} badge-sm`}>
                  {typeCfg.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date début</p>
                <p className="font-mono text-sm">{formaterDate(maintenance.date_debut)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date fin</p>
                <p className="font-mono text-sm">{formaterDate(maintenance.date_fin)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Technicien</p>
                <p className="text-sm truncate">{maintenance.technicien || '—'}</p>
              </div>
            </div>

            {maintenance.description && (
              <>
                <div className="divider my-2"></div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">
                    Description des travaux
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{maintenance.description}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* COÛTS */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-success" />
            <h2 className="font-semibold text-sm">Coûts</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-base-content/50 uppercase">Main d'œuvre</p>
              <p className="font-mono font-bold">
                {formaterMontant(maintenance.cout_main_oeuvre)}
              </p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Pièces</p>
              <p className="font-mono font-bold">
                {formaterMontant(maintenance.cout_pieces)}
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <p className="text-xs text-success uppercase font-bold">Total</p>
              <p className="font-mono font-bold text-success text-xl">
                {formaterMontant(maintenance.cout_total)}
              </p>
            </div>
          </div>
        </div>

        {/* OBSERVATIONS */}
        {maintenance.observations && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Info className="w-4 h-4 text-base-content/60" />
              <h2 className="font-semibold text-sm">Observations</h2>
            </div>
            <div className="p-5">
              <p className="text-sm whitespace-pre-wrap">{maintenance.observations}</p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        {maintenance.statut !== 'terminee' && maintenance.statut !== 'annulee' && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70">
                  Lorsque les travaux sont terminés, cliquez sur « Terminer » pour
                  clôturer l'intervention. La date de fin sera enregistrée.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowModalTerminer(true)}
                  className="btn btn-success gap-2"
                >
                  <CheckSquare className="w-4 h-4" /> Terminer la maintenance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TERMINER */}
      {showModalTerminer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalTerminer(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-1">Terminer la maintenance</h3>
              <p className="text-sm text-base-content/60">
                {maintenance.numero} — {maintenance.equipement_code}
              </p>
            </div>

            <div className="form-control w-full mb-4">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">
                  Date de fin <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                className="btn flex-1"
                onClick={() => setShowModalTerminer(false)}
                disabled={chargementAction}
              >
                Annuler
              </button>
              <button
                className="btn btn-success flex-1 gap-2"
                onClick={terminer}
                disabled={chargementAction}
              >
                {chargementAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckSquare className="w-4 h-4" />
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

export default MaintenanceDetail;