// src/components/documents/Documents.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Search, Plus, Eye, Edit, Trash2, Loader2, AlertCircle,
  RefreshCw, Filter, Download, Shield, Lock, Users, FileCheck,
  FileClock, FileWarning, Calendar, Tag, FolderOpen, AlertTriangle
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

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [documentsFiltres, setDocumentsFiltres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreConfidentialite, setFiltreConfidentialite] = useState('all');
  const [filtreExpiration, setFiltreExpiration] = useState('all'); // all | expire | expire_bientot
  const [selectionne, setSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [telechargementEnCours, setTelechargementEnCours] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [docsRes, catsRes] = await Promise.all([
        AxiosInstance.get('/documents/?page_size=500'),
        AxiosInstance.get('/categories-documents/?actif=true&page_size=500').catch(() => ({ data: [] })),
      ]);
      const dataDocs = docsRes.data.results || docsRes.data || [];
      setDocuments(dataDocs);
      setDocumentsFiltres(dataDocs);
      setCategories(catsRes.data.results || catsRes.data || []);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les documents');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = documents;

    // Recherche
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(d =>
        d.numero?.toLowerCase().includes(terme) ||
        d.titre?.toLowerCase().includes(terme) ||
        d.description?.toLowerCase().includes(terme) ||
        d.mots_cles?.toLowerCase().includes(terme) ||
        d.nom_fichier_original?.toLowerCase().includes(terme)
      );
    }

    if (filtreCategorie !== 'all') {
      filtre = filtre.filter(d => String(d.categorie) === String(filtreCategorie));
    }
    if (filtreStatut !== 'all') {
      filtre = filtre.filter(d => d.statut === filtreStatut);
    }
    if (filtreConfidentialite !== 'all') {
      filtre = filtre.filter(d => d.confidentialite === filtreConfidentialite);
    }
    if (filtreExpiration === 'expire') {
      filtre = filtre.filter(d => d.est_expire);
    } else if (filtreExpiration === 'expire_bientot') {
      filtre = filtre.filter(d =>
        !d.est_expire &&
        d.jours_avant_expiration !== null &&
        d.jours_avant_expiration !== undefined &&
        d.jours_avant_expiration <= 30
      );
    }

    setDocumentsFiltres(filtre);
  }, [recherche, filtreCategorie, filtreStatut, filtreConfidentialite, filtreExpiration, documents]);

  const supprimer = async () => {
    if (!selectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/documents/${selectionne.id}/`);
      setDocuments(documents.filter(d => d.id !== selectionne.id));
      setShowModalSuppression(false);
      setSelectionne(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const telecharger = async (document) => {
    setTelechargementEnCours(document.id);
    try {
      const res = await AxiosInstance.get(`/documents/${document.id}/telecharger/`);
      // Ouvrir l'URL dans un nouvel onglet
      if (res.data?.fichier_url) {
        window.open(res.data.fichier_url, '_blank');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du téléchargement');
    } finally {
      setTelechargementEnCours(null);
    }
  };

  const stats = useMemo(() => {
    return {
      total: documents.length,
      valides: documents.filter(d => d.statut === 'valide').length,
      expires: documents.filter(d => d.est_expire).length,
      expirentBientot: documents.filter(d =>
        !d.est_expire &&
        d.jours_avant_expiration !== null &&
        d.jours_avant_expiration !== undefined &&
        d.jours_avant_expiration <= 30
      ).length,
    };
  }, [documents]);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const filtresActifs = recherche || filtreCategorie !== 'all' || filtreStatut !== 'all' ||
    filtreConfidentialite !== 'all' || filtreExpiration !== 'all';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={charger} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <FileText className="w-3 h-3" /> Documents / Tous
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Gestion documentaire
          </h1>
          <p className="text-base-content/60 mt-1">
            {documentsFiltres.length} document{documentsFiltres.length > 1 ? 's' : ''}
            {filtresActifs && documents.length !== documentsFiltres.length && (
              <span className="text-base-content/40"> (sur {documents.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/documents/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau document
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Validés</p>
              <p className="text-xl font-bold text-success">{stats.valides}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <FileClock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Expirent bientôt</p>
              <p className="text-xl font-bold text-warning">{stats.expirentBientot}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Expirés</p>
              <p className="text-xl font-bold text-error">{stats.expires}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, numéro, mots-clés..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm max-w-[220px]"
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
            >
              <option value="all">Toutes catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              {Object.entries(STATUTS_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreConfidentialite}
              onChange={(e) => setFiltreConfidentialite(e.target.value)}
            >
              <option value="all">Toutes confid.</option>
              {Object.entries(CONFIDENTIALITE_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreExpiration}
              onChange={(e) => setFiltreExpiration(e.target.value)}
            >
              <option value="all">Toutes dates</option>
              <option value="expire_bientot">Expirent bientôt</option>
              <option value="expire">Expirés</option>
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreCategorie('all');
                  setFiltreStatut('all');
                  setFiltreConfidentialite('all');
                  setFiltreExpiration('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE */}
      {documentsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun document ne correspond' : 'Aucun document'}
          </p>
          <Link to="/documents/ajouter" className="btn btn-primary mt-4">
            Créer un document
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase">Numéro</th>
                <th className="text-xs uppercase">Titre</th>
                <th className="text-xs uppercase">Catégorie</th>
                <th className="text-xs uppercase">Confidentialité</th>
                <th className="text-xs uppercase text-right">Taille</th>
                <th className="text-xs uppercase">Date / Expiration</th>
                <th className="text-xs uppercase">Statut</th>
                <th className="text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documentsFiltres.map(d => {
                const statutCfg = STATUTS_CONFIG[d.statut] || STATUTS_CONFIG.brouillon;
                const confCfg = CONFIDENTIALITE_CONFIG[d.confidentialite] || CONFIDENTIALITE_CONFIG.interne;
                const IconStatut = statutCfg.icon;
                const IconConf = confCfg.icon;
                const enCours = telechargementEnCours === d.id;

                return (
                  <tr
                    key={d.id}
                    className="hover:bg-base-200/50 border-b border-base-200 last:border-0"
                  >
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {d.numero}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm truncate max-w-[220px]">
                        {d.titre}
                      </p>
                      {d.mots_cles && (
                        <p className="text-xs text-base-content/50 truncate max-w-[220px]">
                          <Tag className="w-3 h-3 inline mr-1" />
                          {d.mots_cles}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {d.categorie_nom || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${confCfg.color} badge-sm gap-1`}>
                        <IconConf className="w-3 h-3" /> {confCfg.label}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs">
                        {d.taille_formatee || '—'}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs font-mono">{formaterDate(d.date_document)}</p>
                      {d.date_expiration && (
                        <p className={`text-xs font-mono ${d.est_expire ? 'text-error font-bold' : ''}`}>
                          → {formaterDate(d.date_expiration)}
                          {d.est_expire && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${statutCfg.color} badge-sm gap-1`}>
                        <IconStatut className="w-3 h-3" /> {statutCfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => telecharger(d)}
                          className="btn btn-ghost btn-xs"
                          title="Télécharger"
                          disabled={enCours || !d.fichier}
                        >
                          {enCours ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <Link
                          to={`/documents/${d.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/documents/${d.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectionne(d);
                            setShowModalSuppression(true);
                          }}
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && selectionne && (
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
              <h3 className="text-xl font-bold mb-2">Supprimer le document</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{selectionne.titre}</strong> ?
              </p>
              <p className="text-xs text-base-content/50 mb-4">
                ⚠️ Le fichier sera conservé sur le serveur (soft delete).
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

export default Documents;