// components/contrats/TypeContratDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle, Layers, Edit,
  Trash2, Eye, Info, Hash, Calculator, FileText, Briefcase,
  Building2, Shield, FileSignature, Calendar, Timer, Lock,
  BookOpen, ExternalLink, Download, ClipboardList, FileBadge,
  TrendingUp, UserCheck, Clock, XCircle, Copy, Check
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Config
// ============================================================
const CATEGORIES_CONFIG = {
  emploi:       { label: 'Contrat de travail',      icon: Briefcase,     color: 'primary' },
  client:       { label: 'Contrat client',          icon: Building2,     color: 'info' },
  fournisseur:  { label: 'Contrat fournisseur',     icon: Building2,     color: 'secondary' },
  partenariat:  { label: 'Partenariat',             icon: Shield,        color: 'accent' },
  bail:         { label: 'Bail / location',         icon: FileSignature, color: 'warning' },
  maintenance:  { label: 'Maintenance',             icon: FileText,      color: 'success' },
  autre:        { label: 'Autre',                   icon: FileText,      color: 'ghost' },
};

const STATUTS_CONFIG = {
  actif:   { label: 'Actif',   cls: 'badge-success', icon: CheckCircle },
  inactif: { label: 'Inactif', cls: 'badge-warning', icon: Clock },
  archive: { label: 'Archivé', cls: 'badge-ghost',   icon: Lock },
};

const TypeContratDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [type, setType] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [codeCopie, setCodeCopie] = useState(false);

  // ------------------------------------------------------------
  // Chargement
  // ------------------------------------------------------------
  useEffect(() => {
    chargerType();
  }, [id]);

  const chargerType = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/types-contrats/${id}/`);
      setType(res.data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(
        err.response?.status === 404
          ? "Ce type de contrat n'existe pas ou a été supprimé."
          : 'Impossible de charger le type de contrat.'
      );
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------
  const supprimerType = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/types-contrats/${id}/`);
      navigate('/types-contrats');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setChargementAction(false);
    }
  };

  const copierCode = () => {
    if (!type?.code) return;
    navigator.clipboard.writeText(type.code);
    setCodeCopie(true);
    setTimeout(() => setCodeCopie(false), 1500);
  };

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getFichierUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${AxiosInstance.defaults.baseURL}${path}`;
  };

  // ------------------------------------------------------------
  // Rendu : chargement / erreur
  // ------------------------------------------------------------
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20 w-full px-6">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70 mb-4">{erreur}</p>
        <div className="flex justify-center gap-2">
          <button onClick={() => navigate('/types-contrats')} className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button onClick={chargerType} className="btn btn-primary">Réessayer</button>
        </div>
      </div>
    );
  }

  if (!type) return null;

  const catCfg = CATEGORIES_CONFIG[type.categorie] || CATEGORIES_CONFIG.autre;
  const statutCfg = STATUTS_CONFIG[type.statut] || STATUTS_CONFIG.actif;
  const CatIcon = catCfg.icon;
  const StatutIcon = statutCfg.icon;
  const fichierUrl = getFichierUrl(type.fichier_modele);

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/types-contrats')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Contrats / Types /{' '}
              <span className="text-primary font-mono">{type.code}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Layers className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate">{type.titre}</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              to={`/types-contrats/${type.id}/modifier`}
              className="btn btn-ghost btn-sm gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </Link>
            <button
              onClick={() => setShowModalSuppression(true)}
              className="btn btn-ghost btn-sm text-error gap-2"
              disabled={chargementAction}
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>

          <span className={`badge ${statutCfg.cls} badge-lg gap-1.5`}>
            <StatutIcon className="w-4 h-4" />
            {statutCfg.label}
          </span>
        </div>
      </div>

      {/* ============ CONTENU ============ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

        {/* ---------- COLONNE PRINCIPALE ---------- */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- Carte principale --- */}
          <div className={`card shadow-sm border-2 bg-${catCfg.color}/5 border-${catCfg.color}/30`}>
            <div className="card-body">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl bg-${catCfg.color}/20 flex items-center justify-center flex-shrink-0`}>
                    <CatIcon className={`w-7 h-7 text-${catCfg.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">
                      {catCfg.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{type.titre}</p>
                    <button
                      onClick={copierCode}
                      className="flex items-center gap-1.5 mt-1 text-xs text-base-content/50 hover:text-primary transition-colors"
                    >
                      <Hash className="w-3 h-3" />
                      <span className="font-mono">{type.code}</span>
                      {codeCopie ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="divider my-2"></div>

              <p className="text-sm text-base-content/80">
                {type.description}
              </p>
            </div>
          </div>

          {/* --- Paramètres --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Paramètres</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Durée</p>
                    <p className="font-bold">
                      {type.duree_mois ? `${type.duree_mois} mois` : 'Indéterminée'}
                    </p>
                  </div>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Période d'essai</p>
                    <p className="font-bold">
                      {type.periode_essai_jours ? `${type.periode_essai_jours} j` : '—'}
                    </p>
                  </div>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Préavis</p>
                    <p className="font-bold">
                      {type.preavis_jours ? `${type.preavis_jours} j` : '—'}
                    </p>
                  </div>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <p className="text-xs text-base-content/50 uppercase mb-1">Ordre</p>
                    <p className="font-bold font-mono">{type.ordre || 0}</p>
                  </div>
                </div>

                {type.reference_legale && (
                  <div className="mt-4 p-3 bg-info/5 border border-info/20 rounded-lg">
                    <p className="text-xs text-info uppercase mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Référence légale
                    </p>
                    <p className="text-sm font-medium">{type.reference_legale}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- Corps du contrat --- */}
          {type.contenu && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Corps du contrat</h2>
                </div>
                <div className="p-5">
                  <pre className="text-sm text-base-content/80 whitespace-pre-wrap font-sans bg-base-200/30 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    {type.contenu}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* --- Notes --- */}
          {type.notes && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Notes internes</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap">
                    {type.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ---------- COLONNE LATÉRALE ---------- */}
        <div className="lg:col-span-1 space-y-6">

          {/* --- Fichier modèle --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <FileBadge className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Fichier modèle</h3>
              </div>

              {fichierUrl ? (
                <div className="space-y-2">
                  <div className="aspect-[3/4] bg-base-200 rounded-lg border border-base-300 flex flex-col items-center justify-center text-base-content/40 gap-2">
                    <FileText className="w-16 h-16" />
                    <p className="text-xs px-2 text-center truncate max-w-full">
                      {type.fichier_modele?.split('/').pop()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={fichierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm flex-1 gap-2"
                    >
                      <Eye className="w-4 h-4" /> Ouvrir
                    </a>
                    <a
                      href={fichierUrl}
                      download
                      className="btn btn-primary btn-sm flex-1 gap-2"
                    >
                      <Download className="w-4 h-4" /> Télécharger
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-base-content/40">
                  <FileBadge className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Aucun fichier attaché</p>
                </div>
              )}
            </div>
          </div>

          {/* --- Informations --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Informations</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Catégorie</span>
                  <span className={`badge badge-${catCfg.color} badge-sm gap-1`}>
                    <CatIcon className="w-3 h-3" />
                    {catCfg.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Statut</span>
                  <span className={`badge ${statutCfg.cls} badge-sm gap-1`}>
                    <StatutIcon className="w-3 h-3" />
                    {statutCfg.label}
                  </span>
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Créé le</span>
                  <span className="font-medium text-xs">{formaterDate(type.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Modifié le</span>
                  <span className="font-medium text-xs">{formaterDate(type.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- Actions rapides --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Actions rapides</h3>
              </div>
              <div className="space-y-2">
                <Link
                  to={`/types-contrats/${type.id}/modifier`}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Edit className="w-4 h-4" />
                  Modifier ce type
                </Link>
                <Link
                  to="/types-contrats"
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Layers className="w-4 h-4" />
                  Tous les types
                </Link>
              </div>
            </div>
          </div>

          {/* --- Info --- */}
          <div className="card bg-info/5 border border-info/20 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-info mb-1">Réutilisation</p>
                  <p className="text-base-content/70">
                    Ce type sera proposé lors de la création d'un contrat.
                    Le contenu et les paramètres seront <strong>pré-remplis</strong> et modifiables.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============ MODAL SUPPRESSION ============ */}
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
              <h3 className="text-xl font-bold mb-2">Supprimer le type de contrat</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{type.titre}</strong> ?
                <br />
                <span className="text-sm">
                  Les contrats existants qui l'utilisent ne seront pas supprimés.
                </span>
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
                  onClick={supprimerType}
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

export default TypeContratDetail;