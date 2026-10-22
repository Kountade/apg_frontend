// src/components/stocks/EquipementDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, HardHat, Edit, Trash2, Loader2, AlertCircle,
  CheckCircle, Wrench, Shield, DollarSign, Info, Package, Tag
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ETATS_CONFIG = {
  neuf:         { label: 'Neuf',          color: 'success' },
  bon:          { label: 'Bon état',      color: 'success' },
  usage:        { label: 'Usagé',         color: 'warning' },
  defectueux:   { label: 'Défectueux',    color: 'error' },
  hors_service: { label: 'Hors service',  color: 'error' },
  rebut:        { label: 'Mis au rebut',  color: 'ghost' },
};

const EquipementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipement, setEquipement] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    charger();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    try {
      const res = await AxiosInstance.get(`/equipements/${id}/`);
      setEquipement(res.data);
    } catch (err) {
      setErreur("Impossible de charger l'équipement");
    } finally {
      setChargement(false);
    }
  };

  const supprimer = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/equipements/${id}/`);
      navigate('/equipements');
    } catch (err) {
      alert('Erreur suppression');
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur}</p>
        <button onClick={() => navigate('/equipements')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  if (!equipement) return null;

  const etatCfg = ETATS_CONFIG[equipement.etat] || ETATS_CONFIG.bon;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/equipements')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Équipements /{' '}
              <span className="text-primary font-mono">{equipement.code}</span>
            </div>
            <h1 className="text-xl font-bold truncate">{equipement.designation}</h1>
          </div>
          <div className="hidden md:flex gap-2">
            <Link
              to={`/equipements/${id}/modifier`}
              className="btn btn-ghost btn-sm gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </Link>
            <button
              onClick={() => setShowModalSuppression(true)}
              className="btn btn-ghost btn-sm text-error gap-2"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
          <span className={`badge badge-${etatCfg.color} badge-lg`}>
            {etatCfg.label}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* CARTE PRINCIPALE */}
            <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {equipement.photo ? (
                      <img src={equipement.photo} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <HardHat className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-base-content/50">
                      {equipement.code}
                    </p>
                    <p className="text-2xl font-bold truncate">{equipement.designation}</p>
                    <p className="text-sm text-base-content/60">{equipement.categorie_nom}</p>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">N° série</p>
                    <p className="font-mono font-bold text-xs">
                      {equipement.numero_serie || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Marque</p>
                    <p className="font-medium text-xs">{equipement.marque || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Modèle</p>
                    <p className="font-medium text-xs">{equipement.modele || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Âge</p>
                    <p className="font-mono font-bold">{equipement.age_mois || 0} mois</p>
                  </div>
                </div>
              </div>
            </div>

            {/* VALEUR & AMORTISSEMENT */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                <h2 className="font-semibold text-sm">Valeur & Amortissement</h2>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Coût acquisition</p>
                  <p className="font-mono font-bold">
                    {formaterMontant(equipement.cout_acquisition)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Valeur actuelle</p>
                  <p className="font-mono font-bold text-success">
                    {formaterMontant(equipement.valeur_actuelle)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Valeur résiduelle</p>
                  <p className="font-mono font-bold">
                    {formaterMontant(equipement.valeur_residuelle)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Date acquisition</p>
                  <p className="font-medium">{formaterDate(equipement.date_acquisition)}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Amortissement</p>
                  <p className="font-medium">
                    {equipement.duree_amortissement_mois || 0} mois
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Garantie</p>
                  {equipement.est_sous_garantie ? (
                    <span className="badge badge-success badge-sm">Sous garantie</span>
                  ) : (
                    <span className="badge badge-ghost badge-sm">Expirée</span>
                  )}
                </div>
              </div>
            </div>

            {/* AFFECTATION */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Affectation</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Magasin</p>
                  <p className="font-medium">{equipement.magasin_nom || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Responsable</p>
                  <p className="font-medium">{equipement.responsable_nom || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Localisation</p>
                  <p className="font-medium">{equipement.localisation || '—'}</p>
                </div>
              </div>
            </div>

            {equipement.description && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Info className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Description</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm whitespace-pre-wrap">{equipement.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <h3 className="font-semibold text-sm mb-3">Actions rapides</h3>
                <div className="space-y-2">
                  <Link
                    to={`/affectations/ajouter?equipement=${equipement.id}`}
                    className="btn btn-info btn-sm w-full gap-2 justify-start"
                  >
                    <Package className="w-4 h-4" /> Affecter à un employé
                  </Link>
                  <Link
                    to={`/maintenance/ajouter?equipement=${equipement.id}`}
                    className="btn btn-warning btn-sm w-full gap-2 justify-start"
                  >
                    <Wrench className="w-4 h-4" /> Nouvelle maintenance
                  </Link>
                  <Link
                    to={`/equipements/${equipement.id}/modifier`}
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </Link>
                  <Link
                    to="/equipements"
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <HardHat className="w-4 h-4" /> Tous les équipements
                  </Link>
                </div>
              </div>
            </div>

            {equipement.fournisseur_nom && (
              <div className="card bg-info/5 border border-info/20">
                <div className="card-body p-4">
                  <p className="text-xs font-medium text-info mb-1">Fournisseur</p>
                  <p className="text-sm">{equipement.fournisseur_nom}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalSuppression(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'équipement</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{equipement.designation}</strong> ?
              </p>
              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalSuppression(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-error flex-1"
                  onClick={supprimer}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipementDetail;