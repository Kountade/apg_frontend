// components/comptabilite/ComptesComptables.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calculator, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Grid3x3, Hash, FileText, CheckCircle, XCircle, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des classes comptables
// ============================================================
const CLASSES_CONFIG = {
  '1': { label: 'Ressources durables', color: 'primary' },
  '2': { label: 'Actif immobilisé', color: 'info' },
  '3': { label: 'Stocks', color: 'warning' },
  '4': { label: 'Tiers', color: 'success' },
  '5': { label: 'Trésorerie', color: 'accent' },
  '6': { label: 'Charges', color: 'error' },
  '7': { label: 'Produits', color: 'secondary' },
  '8': { label: 'Autres', color: 'neutral' },
};

const TYPES_COMPTE_CONFIG = {
  actif: { label: 'Actif', cls: 'badge-info' },
  passif: { label: 'Passif', cls: 'badge-warning' },
  charge: { label: 'Charge', cls: 'badge-error' },
  produit: { label: 'Produit', cls: 'badge-success' },
  tresorerie: { label: 'Trésorerie', cls: 'badge-accent' },
};

const ComptesComptables = () => {
  const navigate = useNavigate();
  const [comptes, setComptes] = useState([]);
  const [comptesFiltres, setComptesFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreClasse, setFiltreClasse] = useState('all');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreActif, setFiltreActif] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [compteSelectionne, setCompteSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerComptes();
  }, []);

  const chargerComptes = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/comptes-comptables/');
      const data = res.data.results || res.data || [];
      setComptes(data);
      setComptesFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger le plan comptable');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = comptes;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.numero?.toLowerCase().includes(terme) ||
        c.libelle?.toLowerCase().includes(terme)
      );
    }
    if (filtreClasse !== 'all') filtre = filtre.filter(c => c.classe === filtreClasse);
    if (filtreType !== 'all') filtre = filtre.filter(c => c.type_compte === filtreType);
    if (filtreActif !== 'all') {
      const actif = filtreActif === 'actif';
      filtre = filtre.filter(c => c.actif === actif);
    }

    setComptesFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreClasse, filtreType, filtreActif, comptes]);

  const totalPages = Math.ceil(comptesFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return comptesFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerCompte = async () => {
    if (!compteSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/comptes-comptables/${compteSelectionne.id}/`);
      setComptes(comptes.filter(c => c.id !== compteSelectionne.id));
      setShowModalSuppression(false);
      setCompteSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const getBadgeClasse = (classe) => {
    const config = CLASSES_CONFIG[classe] || { label: classe, color: 'neutral' };
    return <span className={`badge badge-${config.color} badge-sm`}>Classe {classe}</span>;
  };

  const getBadgeType = (type) => {
    const config = TYPES_COMPTE_CONFIG[type] || { label: type, cls: 'badge-ghost' };
    return <span className={`badge ${config.cls} badge-sm`}>{config.label}</span>;
  };

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
        <button onClick={chargerComptes} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  // Grouper par classe pour les stats
  const stats = Object.keys(CLASSES_CONFIG).map(classe => ({
    classe,
    label: CLASSES_CONFIG[classe].label,
    color: CLASSES_CONFIG[classe].color,
    total: comptes.filter(c => c.classe === classe).length,
  }));

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Plan comptable</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Grid3x3 className="w-8 h-8 text-primary" />
            Plan comptable
          </h1>
          <p className="text-base-content/60 mt-1">
            {comptesFiltres.length} compte{comptesFiltres.length > 1 ? 's' : ''} trouvé{comptesFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerComptes} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/plan-comptable/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau compte
          </Link>
        </div>
      </div>

      {/* STATISTIQUES PAR CLASSE */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {stats.map(({ classe, label, color, total }) => (
          <div
            key={classe}
            className={`card bg-${color}/5 border border-${color}/20 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
              filtreClasse === classe ? `ring-2 ring-${color}` : ''
            }`}
            onClick={() => setFiltreClasse(filtreClasse === classe ? 'all' : classe)}
          >
            <div className="card-body p-3 items-center text-center">
              <span className={`badge badge-${color} badge-sm`}>Cl. {classe}</span>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-[10px] text-base-content/60 uppercase tracking-wider leading-tight">{label}</p>
            </div>
          </div>
        ))}
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
                  placeholder="Rechercher par numéro ou libellé..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreClasse}
              onChange={(e) => setFiltreClasse(e.target.value)}
            >
              <option value="all">Toutes les classes</option>
              {Object.entries(CLASSES_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>Classe {key} — {cfg.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="actif">Actif</option>
              <option value="passif">Passif</option>
              <option value="charge">Charge</option>
              <option value="produit">Produit</option>
              <option value="tresorerie">Trésorerie</option>
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreActif}
              onChange={(e) => setFiltreActif(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="actif">Actifs uniquement</option>
              <option value="inactif">Inactifs uniquement</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreClasse('all');
                setFiltreType('all');
                setFiltreActif('all');
              }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {comptesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Grid3x3 className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun compte trouvé</p>
          <Link to="/plan-comptable/ajouter" className="btn btn-primary mt-4">
            Créer un compte
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 w-24">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Libellé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Classe</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Parent</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((compte) => (
                  <tr key={compte.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      <span className="font-mono text-sm font-bold text-primary">
                        {compte.numero}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[400px]">{compte.libelle}</p>
                    </td>
                    <td>{getBadgeClasse(compte.classe)}</td>
                    <td>{getBadgeType(compte.type_compte)}</td>
                    <td>
                      {compte.parent_numero ? (
                        <span className="font-mono text-xs text-base-content/60">
                          {compte.parent_numero}
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${compte.actif ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                        {compte.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/plan-comptable/${compte.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setCompteSelectionne(compte);
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
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, comptesFiltres.length)} sur{' '}
                {comptesFiltres.length} comptes
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let numPage = i + 1;
                  if (totalPages > 5 && pageActuelle > 3) {
                    numPage = pageActuelle - 2 + i;
                    if (numPage > totalPages) return null;
                  }
                  return (
                    <button
                      key={numPage}
                      className={`btn btn-sm ${pageActuelle === numPage ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setPageActuelle(numPage)}
                    >
                      {numPage}
                    </button>
                  );
                })}
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle + 1)}
                  disabled={pageActuelle === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && compteSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le compte</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer le compte{' '}
                <span className="font-bold font-mono">{compteSelectionne.numero}</span> — {compteSelectionne.libelle} ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerCompte} disabled={chargementAction}>
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

export default ComptesComptables;