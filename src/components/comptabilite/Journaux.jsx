// components/comptabilite/Journaux.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Plus, Edit, Trash2, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, Hash, FileText, CheckCircle, XCircle, Layers,
  ShoppingCart, DollarSign, Landmark, Banknote, ListChecks, Users
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Configuration des types de journaux
// ============================================================
const TYPES_JOURNAL_CONFIG = {
  AC: { label: 'Achats', icon: ShoppingCart, color: 'error', description: 'Journal des achats' },
  VE: { label: 'Ventes', icon: DollarSign, color: 'success', description: 'Journal des ventes' },
  BQ: { label: 'Banque', icon: Landmark, color: 'info', description: 'Journal de banque' },
  CA: { label: 'Caisse', icon: Banknote, color: 'warning', description: 'Journal de caisse' },
  OD: { label: 'Opérations Diverses', icon: ListChecks, color: 'secondary', description: 'Journal des opérations diverses' },
  PA: { label: 'Paie', icon: Users, color: 'primary', description: 'Journal de paie' },
};

const Journaux = () => {
  const navigate = useNavigate();
  const [journaux, setJournaux] = useState([]);
  const [journauxFiltres, setJournauxFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreActif, setFiltreActif] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [journalSelectionne, setJournalSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerJournaux();
  }, []);

  const chargerJournaux = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/journaux/');
      const data = res.data.results || res.data || [];
      setJournaux(data);
      setJournauxFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les journaux');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = journaux;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(j =>
        j.code?.toLowerCase().includes(terme) ||
        j.libelle?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(j => j.type === filtreType);
    if (filtreActif !== 'all') {
      const actif = filtreActif === 'actif';
      filtre = filtre.filter(j => j.actif === actif);
    }

    setJournauxFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreActif, journaux]);

  const totalPages = Math.ceil(journauxFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return journauxFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerJournal = async () => {
    if (!journalSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/journaux/${journalSelectionne.id}/`);
      setJournaux(journaux.filter(j => j.id !== journalSelectionne.id));
      setShowModalSuppression(false);
      setJournalSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
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
        <button onClick={chargerJournaux} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  // Stats par type
  const stats = Object.keys(TYPES_JOURNAL_CONFIG).map(type => ({
    type,
    ...TYPES_JOURNAL_CONFIG[type],
    total: journaux.filter(j => j.type === type).length,
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
            <span className="text-primary">Journaux</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Journaux comptables
          </h1>
          <p className="text-base-content/60 mt-1">
            {journauxFiltres.length} journal{journauxFiltres.length > 1 ? 'x' : ''} trouvé{journauxFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerJournaux} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/journaux/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau journal
          </Link>
        </div>
      </div>

      {/* STATISTIQUES PAR TYPE */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map(({ type, label, icon: Icon, color, total }) => (
          <div
            key={type}
            className={`card bg-${color}/5 border border-${color}/20 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
              filtreType === type ? `ring-2 ring-${color}` : ''
            }`}
            onClick={() => setFiltreType(filtreType === type ? 'all' : type)}
          >
            <div className="card-body p-3 items-center text-center">
              <Icon className={`w-6 h-6 text-${color}`} />
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
                  placeholder="Rechercher par code ou libellé..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPES_JOURNAL_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
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
      {journauxFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <BookOpen className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun journal trouvé</p>
          <Link to="/journaux/ajouter" className="btn btn-primary mt-4">
            Créer un journal
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 w-24">Code</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Libellé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Type</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">Écritures</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((journal) => {
                  const typeConfig = TYPES_JOURNAL_CONFIG[journal.type];
                  const TypeIcon = typeConfig?.icon || BookOpen;
                  return (
                    <tr key={journal.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <span className="font-mono text-sm font-bold text-primary">
                          {journal.code}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`w-4 h-4 text-${typeConfig?.color || 'primary'}`} />
                          <p className="font-medium">{journal.libelle}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${typeConfig?.color || 'primary'} badge-sm`}>
                          {typeConfig?.label || journal.type}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-ghost badge-sm font-mono">
                          {journal.nombre_ecritures || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${journal.actif ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                          {journal.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/journaux/${journal.id}/modifier`}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setJournalSelectionne(journal);
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, journauxFiltres.length)} sur{' '}
                {journauxFiltres.length} journaux
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
      {showModalSuppression && journalSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le journal</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer le journal{' '}
                <span className="font-bold font-mono">{journalSelectionne.code}</span> — {journalSelectionne.libelle} ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerJournal} disabled={chargementAction}>
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

export default Journaux;