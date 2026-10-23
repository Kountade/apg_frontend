// src/components/vehicules/VehiculeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Truck, Loader2, AlertCircle, CheckCircle, XCircle,
  Edit, Trash2, User, MapPin, Wrench, DollarSign,
  Shield, Info, AlertTriangle, FileText, Droplet, Package
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  camion:  { label: 'Camion',      color: 'primary' },
  benne:   { label: 'Camion benne', color: 'warning' },
  pickup:  { label: 'Pick-up',     color: 'info' },
  '4x4':   { label: '4x4',         color: 'secondary' },
  voiture: { label: 'Voiture',     color: 'success' },
  autre:   { label: 'Autre',       color: 'ghost' },
};

const ETATS_CONFIG = {
  disponible:     { label: 'Disponible',     color: 'success', icon: CheckCircle },
  en_mission:     { label: 'En mission',     color: 'primary', icon: Truck },
  en_maintenance: { label: 'En maintenance', color: 'warning', icon: Wrench },
  en_panne:       { label: 'En panne',       color: 'error',   icon: AlertTriangle },
  hors_service:   { label: 'Hors service',   color: 'ghost',   icon: XCircle },
};

const VehiculeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicule, setVehicule] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    charger();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      // ✅ URL corrigée
      const res = await AxiosInstance.get(`/vehicules/${id}/`);
      setVehicule(res.data);
    } catch (err) {
      setErreur('Impossible de charger le véhicule');
    } finally {
      setChargement(false);
    }
  };

  const supprimer = async () => {
    setChargementAction(true);
    try {
      // ✅ URL corrigée
      await AxiosInstance.delete(`/vehicules/${id}/`);
      navigate('/vehicules');
    } catch (err) {
      alert('Erreur suppression');
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';
  };

  const formaterKm = (km) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(km || 0)) + ' km';
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !vehicule) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/vehicules')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const typeCfg = TYPES_CONFIG[vehicule.type] || TYPES_CONFIG.autre;
  const etatCfg = ETATS_CONFIG[vehicule.etat] || ETATS_CONFIG.disponible;
  const IconEtat = etatCfg.icon;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/vehicules')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Véhicules /{' '}
              <span className="text-primary font-mono">{vehicule.numero_interne}</span>
            </div>
            <h1 className="text-xl font-bold truncate">
              {vehicule.marque} {vehicule.modele}
            </h1>
          </div>
          <div className="hidden md:flex gap-2">
            <Link
              to={`/vehicules/${id}/modifier`}
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
          <span className={`badge badge-${etatCfg.color} badge-lg gap-1`}>
            <IconEtat className="w-4 h-4" /> {etatCfg.label}
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
                    {vehicule.photo ? (
                      <img src={vehicule.photo} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Truck className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-base-content/50">
                      {vehicule.numero_interne}
                    </p>
                    <p className="text-2xl font-bold truncate">
                      {vehicule.marque} {vehicule.modele}
                    </p>
                    <p className="text-sm text-base-content/60">
                      {typeCfg.label} · {vehicule.immatriculation || 'Pas d\'immatriculation'}
                    </p>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Kilométrage</p>
                    <p className="font-mono font-bold">{formaterKm(vehicule.kilometrage_actuel)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Capacité</p>
                    <p className="font-mono">{formaterKm(vehicule.capacite_charge)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Coût acquisition</p>
                    <p className="font-mono text-xs">{formaterMontant(vehicule.cout_acquisition)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Valeur actuelle</p>
                    <p className="font-mono text-xs font-bold text-success">
                      {formaterMontant(vehicule.valeur_actuelle)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AFFECTATION */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Affectation</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Conducteur</p>
                  <p className="font-medium">{vehicule.conducteur_nom || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Zone d'exploitation</p>
                  <p className="flex items-center gap-1 text-sm">
                    <MapPin className="w-3 h-3" /> {vehicule.zone_exploitation || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* VIDANGE */}
            <div className={`card shadow-sm border ${
              vehicule.vidange_a_faire ? 'bg-warning/5 border-warning/30' : 'bg-base-100 border-base-300'
            }`}>
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm">Suivi vidange</h2>
                </div>
                {vehicule.vidange_a_faire && (
                  <span className="badge badge-warning badge-sm gap-1">
                    <AlertTriangle className="w-3 h-3" /> À faire
                  </span>
                )}
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Dernière vidange</p>
                  <p className="font-mono text-sm">{formaterDate(vehicule.date_derniere_vidange)}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Km depuis vidange</p>
                  <p className="font-mono font-bold">
                    {formaterKm(vehicule.kilometrage_depuis_vidange)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Intervalle</p>
                  <p className="font-mono">{formaterKm(vehicule.intervalle_vidange_km)}</p>
                </div>
              </div>
            </div>

            {/* ASSURANCE */}
            <div className={`card shadow-sm border ${
              vehicule.est_assurance_valide ? 'bg-base-100 border-base-300' : 'bg-error/5 border-error/30'
            }`}>
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Assurance</h2>
                </div>
                {vehicule.est_assurance_valide ? (
                  <span className="badge badge-success badge-sm">Valide</span>
                ) : (
                  <span className="badge badge-error badge-sm gap-1">
                    <AlertTriangle className="w-3 h-3" /> Expirée / absente
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-base-content/50 uppercase">Date d'expiration</p>
                <p className="font-mono text-sm">{formaterDate(vehicule.date_expiration_assurance)}</p>
              </div>
            </div>

            {/* NOTES */}
            {vehicule.notes && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Info className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Notes</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm whitespace-pre-wrap">{vehicule.notes}</p>
                </div>
              </div>
            )}

            {/* LIEN STOCKS */}
            {vehicule.equipement_code && (
              <div className="card bg-info/5 border border-info/20">
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-info mb-1">Lié à un équipement stocks</p>
                      <p className="text-base-content/70">
                        <span className="font-mono">{vehicule.equipement_code}</span> — {vehicule.equipement_designation}
                      </p>
                      <Link
                        to={`/equipements/${vehicule.equipement}`}
                        className="link link-primary text-xs mt-1 inline-block"
                      >
                        Voir l'équipement →
                      </Link>
                    </div>
                  </div>
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
                    to={`/carburant/ajouter?vehicule=${vehicule.id}`}
                    className="btn btn-warning btn-sm w-full gap-2 justify-start"
                  >
                    <Droplet className="w-4 h-4" /> Nouveau plein
                  </Link>
                  <Link
                    to={`/assurances/ajouter?vehicule=${vehicule.id}`}
                    className="btn btn-info btn-sm w-full gap-2 justify-start"
                  >
                    <Shield className="w-4 h-4" /> Nouvelle assurance
                  </Link>
                  <Link
                    to={`/documents-vehicules/ajouter?vehicule=${vehicule.id}`}
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <FileText className="w-4 h-4" /> Nouveau document
                  </Link>
                  <Link
                    to={`/vehicules/${id}/modifier`}
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </Link>
                  <Link
                    to="/vehicules"
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <Truck className="w-4 h-4" /> Tous les véhicules
                  </Link>
                </div>
              </div>
            </div>

            {/* INFO STATUT */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <h3 className="font-semibold text-sm mb-3">Statut</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Type :</span>
                    <span className="font-medium">{typeCfg.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Administratif :</span>
                    <span className="font-medium">{vehicule.statut_display}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Créé le :</span>
                    <span className="font-mono">{formaterDate(vehicule.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
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
              <h3 className="text-xl font-bold mb-2">Supprimer le véhicule</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{vehicule.numero_interne}</strong> ?
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

export default VehiculeDetail;