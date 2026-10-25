// src/components/documents/DocumentDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Loader2, AlertCircle, CheckCircle, Edit, Trash2,
  Download, Shield, Lock, Users, FileCheck, FileClock, FileWarning,
  Calendar, Tag, FolderOpen, AlertTriangle, Info, Plus, X,
  Share2, Clock, History, Eye, Copy, KeyRound, UserPlus
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', color: 'ghost',   icon: FileText },
  valide:    { label: 'Validé',    color: 'success', icon: FileCheck },
  archive:   { label: 'Archivé',   color: 'info',    icon: FolderOpen },
  obsolete:  { label: 'Obsolète',  color: 'warning', icon: FileWarning },
};

const CONFIDENTIALITE_CONFIG = {
  public:       { label: 'Public',        color: 'success', icon: Users },
  interne:      { label: 'Interne',       color: 'info',    icon: FileText },
  confidentiel: { label: 'Confidentiel',  color: 'warning', icon: Shield },
  secret:       { label: 'Secret',        color: 'error',   icon: Lock },
};

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [acces, setAcces] = useState([]);
  const [partages, setPartages] = useState([]);
  const [telechargements, setTelechargements] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);
  const [ongletActif, setOngletActif] = useState('infos'); // infos | versions | partages | acces | telechargements

  // Modals
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalVersion, setShowModalVersion] = useState(false);
  const [showModalPartage, setShowModalPartage] = useState(false);
  const [showModalAcces, setShowModalAcces] = useState(false);

  // Formulaire version
  const [versionForm, setVersionForm] = useState({
    version: '',
    commentaire: '',
    fichier: null,
  });

  // Formulaire partage
  const [partageForm, setPartageForm] = useState({
    date_expiration: '',
    mot_de_passe: '',
    nombre_max_telechargements: 0,
  });

  // Formulaire accès
  const [accesForm, setAccesForm] = useState({
    utilisateur: '',
    niveau: 'lecture',
    date_expiration: '',
  });

  const [utilisateurs, setUtilisateurs] = useState([]);

  // ============================================================
  // CHARGEMENT
  // ============================================================
  useEffect(() => {
    charger();
    chargerUtilisateurs();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [docRes, versionsRes, accesRes, partagesRes, telechRes] = await Promise.all([
        AxiosInstance.get(`/documents/${id}/`),
        AxiosInstance.get(`/documents/${id}/versions/`).catch(() => ({ data: [] })),
        AxiosInstance.get(`/documents/${id}/acces/`).catch(() => ({ data: [] })),
        AxiosInstance.get(`/documents-partages/?document=${id}&page_size=100`).catch(() => ({ data: [] })),
        AxiosInstance.get(`/documents/${id}/telechargements/`).catch(() => ({ data: [] })),
      ]);
      setDocument(docRes.data);
      setVersions(versionsRes.data.results || versionsRes.data || []);
      setAcces(accesRes.data.results || accesRes.data || []);
      setPartages(partagesRes.data.results || partagesRes.data || []);
      setTelechargements(telechRes.data.results || telechRes.data || []);

      // Préremplir la prochaine version
      const versionActuelle = parseFloat(docRes.data.version || '1.0');
      const prochaineVersion = isNaN(versionActuelle) ? '1.1' : (versionActuelle + 0.1).toFixed(1);
      setVersionForm(prev => ({ ...prev, version: prochaineVersion }));
    } catch (err) {
      setErreur('Impossible de charger le document');
    } finally {
      setChargement(false);
    }
  };

  const chargerUtilisateurs = async () => {
    try {
      const res = await AxiosInstance.get('/utilisateurs/?page_size=500').catch(() => ({ data: [] }));
      setUtilisateurs(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const telecharger = async () => {
    setChargementAction(true);
    try {
      const res = await AxiosInstance.get(`/documents/${id}/telecharger/`);
      if (res.data?.fichier_url) {
        window.open(res.data.fichier_url, '_blank');
        // Recharger pour actualiser la liste des téléchargements
        const telechRes = await AxiosInstance.get(`/documents/${id}/telechargements/`).catch(() => ({ data: [] }));
        setTelechargements(telechRes.data.results || telechRes.data || []);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du téléchargement');
    } finally {
      setChargementAction(false);
    }
  };

  const supprimer = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/documents/${id}/`);
      navigate('/documents');
    } catch (err) {
      alert('Erreur suppression');
      setChargementAction(false);
    }
  };

  const uploaderVersion = async (e) => {
    e.preventDefault();
    if (!versionForm.fichier) {
      alert('Sélectionnez un fichier.');
      return;
    }
    setChargementAction(true);
    try {
      const formData = new FormData();
      formData.append('document', id);
      formData.append('version', versionForm.version);
      formData.append('commentaire', versionForm.commentaire || '');
      formData.append('fichier', versionForm.fichier);

      await AxiosInstance.post('/documents-versions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowModalVersion(false);
      setVersionForm({ version: '', commentaire: '', fichier: null });
      await charger();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la création de la version');
    } finally {
      setChargementAction(false);
    }
  };

  const creerPartage = async (e) => {
    e.preventDefault();
    if (!partageForm.date_expiration) {
      alert('Renseignez une date d\'expiration.');
      return;
    }
    setChargementAction(true);
    try {
      const payload = {
        document: id,
        date_expiration: partageForm.date_expiration,
        nombre_max_telechargements: parseInt(partageForm.nombre_max_telechargements) || 0,
      };
      if (partageForm.mot_de_passe) {
        payload.mot_de_passe = partageForm.mot_de_passe;
      }

      await AxiosInstance.post('/documents-partages/', payload);
      setShowModalPartage(false);
      setPartageForm({ date_expiration: '', mot_de_passe: '', nombre_max_telechargements: 0 });
      await charger();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la création du partage');
    } finally {
      setChargementAction(false);
    }
  };

  const ajouterAcces = async (e) => {
    e.preventDefault();
    if (!accesForm.utilisateur) {
      alert('Sélectionnez un utilisateur.');
      return;
    }
    setChargementAction(true);
    try {
      const payload = {
        document: id,
        utilisateur: accesForm.utilisateur,
        niveau: accesForm.niveau,
      };
      if (accesForm.date_expiration) {
        payload.date_expiration = accesForm.date_expiration;
      }

      await AxiosInstance.post('/documents-acces/', payload);
      setShowModalAcces(false);
      setAccesForm({ utilisateur: '', niveau: 'lecture', date_expiration: '' });
      await charger();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de l\'ajout d\'accès');
    } finally {
      setChargementAction(false);
    }
  };

  const supprimerAcces = async (accesId) => {
    if (!window.confirm('Retirer cet accès ?')) return;
    try {
      await AxiosInstance.delete(`/documents-acces/${accesId}/`);
      setAcces(acces.filter(a => a.id !== accesId));
    } catch (err) {
      alert('Erreur suppression accès');
    }
  };

  const desactiverPartage = async (partageId) => {
    if (!window.confirm('Désactiver ce partage ?')) return;
    try {
      await AxiosInstance.patch(`/documents-partages/${partageId}/`, { actif: false });
      await charger();
    } catch (err) {
      alert('Erreur désactivation');
    }
  };

  const copierLien = (token) => {
    const url = `${window.location.origin}/documents/partage/${token}`;
    navigator.clipboard.writeText(url);
    alert('Lien copié dans le presse-papiers !');
  };

  // ============================================================
  // FORMATERS
  // ============================================================
  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  // ============================================================
  // RENDER
  // ============================================================
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !document) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/documents')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  const statutCfg = STATUTS_CONFIG[document.statut] || STATUTS_CONFIG.brouillon;
  const confCfg = CONFIDENTIALITE_CONFIG[document.confidentialite] || CONFIDENTIALITE_CONFIG.interne;
  const IconStatut = statutCfg.icon;
  const IconConf = confCfg.icon;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/documents')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Documents / <span className="text-primary font-mono">{document.numero}</span>
            </div>
            <h1 className="text-xl font-bold truncate">{document.titre}</h1>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={telecharger}
              className="btn btn-primary btn-sm gap-2"
              disabled={chargementAction}
            >
              <Download className="w-4 h-4" /> Télécharger
            </button>
            <Link to={`/documents/${id}/modifier`} className="btn btn-ghost btn-sm gap-2">
              <Edit className="w-4 h-4" /> Modifier
            </Link>
            <button
              onClick={() => setShowModalSuppression(true)}
              className="btn btn-ghost btn-sm text-error gap-2"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
          <span className={`badge badge-${statutCfg.color} badge-lg gap-1`}>
            <IconStatut className="w-4 h-4" /> {statutCfg.label}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* CARTE PRINCIPALE */}
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-base-content/50">{document.numero}</p>
                <p className="text-xl font-bold truncate">{document.titre}</p>
                <p className="text-sm text-base-content/60">
                  v{document.version} · {document.taille_formatee} · {document.categorie_nom || '—'}
                </p>
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-base-content/50 uppercase">Confidentialité</p>
                <span className={`badge badge-${confCfg.color} badge-sm gap-1`}>
                  <IconConf className="w-3 h-3" /> {confCfg.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Date document</p>
                <p className="font-mono text-sm">{formaterDate(document.date_document)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Expiration</p>
                <p className={`font-mono text-sm ${document.est_expire ? 'text-error font-bold' : ''}`}>
                  {formaterDate(document.date_expiration)}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Uploadé par</p>
                <p className="text-sm truncate">{document.uploade_par_nom || '—'}</p>
              </div>
            </div>

            {document.description && (
              <>
                <div className="divider my-2"></div>
                <p className="text-sm whitespace-pre-wrap">{document.description}</p>
              </>
            )}

            {document.mots_cles && (
              <>
                <div className="divider my-2"></div>
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-base-content/40" />
                  {document.mots_cles.split(',').map((mot, i) => (
                    <span key={i} className="badge badge-ghost badge-sm">
                      {mot.trim()}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ONGLETS */}
        <div className="tabs tabs-boxed bg-base-100 border border-base-300">
          <button
            className={`tab gap-2 ${ongletActif === 'infos' ? 'tab-active' : ''}`}
            onClick={() => setOngletActif('infos')}
          >
            <Info className="w-4 h-4" /> Informations
          </button>
          <button
            className={`tab gap-2 ${ongletActif === 'versions' ? 'tab-active' : ''}`}
            onClick={() => setOngletActif('versions')}
          >
            <History className="w-4 h-4" /> Versions ({versions.length})
          </button>
          <button
            className={`tab gap-2 ${ongletActif === 'partages' ? 'tab-active' : ''}`}
            onClick={() => setOngletActif('partages')}
          >
            <Share2 className="w-4 h-4" /> Partages ({partages.length})
          </button>
          <button
            className={`tab gap-2 ${ongletActif === 'acces' ? 'tab-active' : ''}`}
            onClick={() => setOngletActif('acces')}
          >
            <Users className="w-4 h-4" /> Accès ({acces.length})
          </button>
          <button
            className={`tab gap-2 ${ongletActif === 'telechargements' ? 'tab-active' : ''}`}
            onClick={() => setOngletActif('telechargements')}
          >
            <Download className="w-4 h-4" /> Téléch. ({telechargements.length})
          </button>
        </div>

        {/* ONGLET : INFORMATIONS */}
        {ongletActif === 'infos' && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h3 className="font-semibold text-sm mb-4">Détails du fichier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Nom original</p>
                  <p className="font-mono text-xs truncate">{document.nom_fichier_original || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Taille</p>
                  <p className="font-mono text-sm">{document.taille_formatee}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Type MIME</p>
                  <p className="font-mono text-xs">{document.type_mime || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Hash SHA-256</p>
                  <p className="font-mono text-xs truncate">{document.hash_sha256 || '—'}</p>
                </div>
                {document.objet_lie_type && (
                  <>
                    <div>
                      <p className="text-xs text-base-content/50 uppercase">Objet lié (type)</p>
                      <p className="font-mono text-xs">{document.objet_lie_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50 uppercase">Objet lié (ID)</p>
                      <p className="font-mono text-xs">{document.objet_lie_id || '—'}</p>
                    </div>
                  </>
                )}
              </div>
              {document.notes && (
                <>
                  <div className="divider my-2"></div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{document.notes}</p>
                  </div>
                </>
              )}
              <div className="divider my-2"></div>
              <button
                onClick={telecharger}
                className="btn btn-primary btn-block gap-2"
                disabled={chargementAction}
              >
                <Download className="w-4 h-4" /> Télécharger le fichier
              </button>
            </div>
          </div>
        )}

        {/* ONGLET : VERSIONS */}
        {ongletActif === 'versions' && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Historique des versions</h3>
                <button
                  onClick={() => setShowModalVersion(true)}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" /> Nouvelle version
                </button>
              </div>
              <div className="p-5">
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-base-content/40">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune version antérieure</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary badge-sm font-mono">
                              v{v.version}
                            </span>
                            <span className="text-xs text-base-content/60">
                              {formaterDateTime(v.created_at)}
                            </span>
                          </div>
                          {v.commentaire && (
                            <p className="text-xs text-base-content/60 mt-1 truncate">
                              {v.commentaire}
                            </p>
                          )}
                          <p className="text-xs text-base-content/40 mt-0.5">
                            Par {v.uploade_par_nom || '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET : PARTAGES */}
        {ongletActif === 'partages' && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Liens de partage</h3>
                <button
                  onClick={() => setShowModalPartage(true)}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" /> Créer un partage
                </button>
              </div>
              <div className="p-5">
                {partages.length === 0 ? (
                  <div className="text-center py-8 text-base-content/40">
                    <Share2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun partage créé</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partages.map(p => (
                      <div key={p.id} className={`p-3 rounded-lg ${p.actif && p.est_valide ? 'bg-success/5 border border-success/20' : 'bg-base-200/50'}`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-primary">
                                {p.token?.slice(0, 12)}...
                              </span>
                              {p.a_mot_de_passe && (
                                <span className="badge badge-warning badge-xs gap-1">
                                  <KeyRound className="w-2.5 h-2.5" /> Protégé
                                </span>
                              )}
                              {p.actif && p.est_valide ? (
                                <span className="badge badge-success badge-xs">Actif</span>
                              ) : (
                                <span className="badge badge-ghost badge-xs">Inactif</span>
                              )}
                            </div>
                            <p className="text-xs text-base-content/60 mt-1">
                              Expire le {formaterDateTime(p.date_expiration)} ·
                              {p.nombre_telechargements}/{p.nombre_max_telechargements || '∞'} téléchargements
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => copierLien(p.token)}
                              className="btn btn-ghost btn-xs gap-1"
                              title="Copier le lien"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copier
                            </button>
                            {p.actif && (
                              <button
                                onClick={() => desactiverPartage(p.id)}
                                className="btn btn-ghost btn-xs text-error gap-1"
                                title="Désactiver"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET : ACCÈS */}
        {ongletActif === 'acces' && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Utilisateurs ayant accès</h3>
                <button
                  onClick={() => setShowModalAcces(true)}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Ajouter un accès
                </button>
              </div>
              <div className="p-5">
                {acces.length === 0 ? (
                  <div className="text-center py-8 text-base-content/40">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun accès explicite</p>
                    <p className="text-xs mt-1">Les documents publics/internes sont accessibles à tous</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {acces.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{a.utilisateur_nom}</p>
                          <p className="text-xs text-base-content/60">
                            {a.niveau_display}
                            {a.date_expiration && ` · expire le ${formaterDate(a.date_expiration)}`}
                          </p>
                        </div>
                        <button
                          onClick={() => supprimerAcces(a.id)}
                          className="btn btn-ghost btn-xs text-error"
                          title="Retirer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET : TÉLÉCHARGEMENTS */}
        {ongletActif === 'telechargements' && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30">
                <h3 className="font-semibold text-sm">Historique des téléchargements</h3>
              </div>
              <div className="p-5">
                {telechargements.length === 0 ? (
                  <div className="text-center py-8 text-base-content/40">
                    <Download className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun téléchargement</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead>
                        <tr className="border-b border-base-300">
                          <th className="text-xs uppercase">Date</th>
                          <th className="text-xs uppercase">Utilisateur</th>
                          <th className="text-xs uppercase">IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {telechargements.map(t => (
                          <tr key={t.id} className="border-b border-base-200 last:border-0">
                            <td>
                              <span className="text-xs font-mono">
                                {formaterDateTime(t.date_telechargement)}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs truncate max-w-[150px]">
                                {t.utilisateur_nom || 'Anonyme'}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs font-mono text-base-content/60">
                                {t.adresse_ip || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
              <h3 className="text-xl font-bold mb-2">Supprimer le document</h3>
              <p className="text-base-content/60 mb-4">Supprimer <strong>{document.titre}</strong> ?</p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimer} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE VERSION */}
      {showModalVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalVersion(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4">Nouvelle version</h3>
            <form onSubmit={uploaderVersion} className="space-y-4">
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Numéro de version</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full font-mono"
                  value={versionForm.version}
                  onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
                  required
                  placeholder="1.1"
                />
              </div>
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Commentaire</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={versionForm.commentaire}
                  onChange={(e) => setVersionForm({ ...versionForm, commentaire: e.target.value })}
                  rows="2"
                  placeholder="Motif de la révision..."
                ></textarea>
              </div>
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Fichier</span>
                </label>
                <input
                  type="file"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setVersionForm({ ...versionForm, fichier: e.target.files[0] })}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt,.csv"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn flex-1" onClick={() => setShowModalVersion(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary flex-1 gap-2" disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Uploader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRÉER PARTAGE */}
      {showModalPartage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalPartage(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4">Créer un lien de partage</h3>
            <form onSubmit={creerPartage} className="space-y-4">
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">
                    Date d'expiration <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={partageForm.date_expiration}
                  onChange={(e) => setPartageForm({ ...partageForm, date_expiration: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Mot de passe (optionnel)</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={partageForm.mot_de_passe}
                  onChange={(e) => setPartageForm({ ...partageForm, mot_de_passe: e.target.value })}
                  placeholder="Laisser vide = pas de protection"
                />
              </div>
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Nb max téléchargements</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full font-mono"
                  value={partageForm.nombre_max_telechargements}
                  onChange={(e) => setPartageForm({ ...partageForm, nombre_max_telechargements: e.target.value })}
                  min="0"
                />
                <label className="label py-0 pt-1">
                  <span className="label-text-alt text-xs text-base-content/50">0 = illimité</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn flex-1" onClick={() => setShowModalPartage(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary flex-1 gap-2" disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER ACCÈS */}
      {showModalAcces && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalAcces(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4">Ajouter un accès</h3>
            <form onSubmit={ajouterAcces} className="space-y-4">
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">
                    Utilisateur <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={accesForm.utilisateur}
                  onChange={(e) => setAccesForm({ ...accesForm, utilisateur: e.target.value })}
                  required
                >
                  <option value="">— Sélectionner —</option>
                  {utilisateurs.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.last_name
                        ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                        : u.email || `Utilisateur #${u.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Niveau d'accès</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={accesForm.niveau}
                  onChange={(e) => setAccesForm({ ...accesForm, niveau: e.target.value })}
                >
                  <option value="lecture">Lecture seule</option>
                  <option value="ecriture">Lecture + Écriture</option>
                  <option value="admin">Administration</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Date d'expiration (optionnel)</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={accesForm.date_expiration}
                  onChange={(e) => setAccesForm({ ...accesForm, date_expiration: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn flex-1" onClick={() => setShowModalAcces(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary flex-1 gap-2" disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;