// components/comptabilite/EcrituresComptables.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calculator, CheckCircle, XCircle, Scale,
  CheckSquare, AlertTriangle, FileText
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUTS_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'badge-ghost', icon: FileText },
  validee: { label: 'Validée', cls: 'badge-success', icon: CheckCircle },
  lettree: { label: 'Lettrée', cls: 'badge-info', icon: CheckSquare },
  annulee: { label: 'Annulée', cls: 'badge-neutral', icon: XCircle },
};

const EcrituresComptables = () => {
  const navigate = useNavigate();
  const [ecritures, setEcritures] = useState([]);
  const [ecrituresFiltrees, setEcrituresFiltrees] = useState([]);
  const [journaux, setJournaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreJournal, setFiltreJournal] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [ecritureSelectionnee, setEcritureSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [ecrRes, jrRes] = await Promise.all([
        AxiosInstance.get('/ecritures-comptables/').catch(() => ({ data: [] })),
        AxiosInstance.get('/journaux/').catch(() => ({ data: [] })),
      ]);
      const ecrData = ecrRes.data.results || ecrRes.data || [];
      setEcritures(ecrData);
      setEcrituresFiltrees(ecrData);
      setJournaux(jrRes.data.results || jrRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les écritures');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = ecritures;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(e =>
        e.numero?.toLowerCase().includes(terme) ||
        e.libelle?.toLowerCase().includes(terme) ||
        e.reference?.toLowerCase().includes(terme)
      );
    }
    if (filtreStatut !== 'all') filtre = filtre.filter(e => e.statut === filtreStatut);
    if (filtreJournal !== 'all') filtre = filtre.filter(e => String(e.journal) === String(filtreJournal));
    setEcrituresFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreJournal, ecritures]);

  const totalPages = Math.ceil(ecrituresFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return ecrituresFiltrees.slice(debut, debut + elementsParPage);
  };

  const supprimerEcriture = async () => {
    if (!ecritureSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/ecritures-comptables/${ecritureSelectionnee.id}/`);
      setEcritures(ecritures.filter(e => e.id !== ecritureSelectionnee.id));
      setShowModalSuppression(false);
      setEcritureSelectionnee(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const validerEcriture = async (ecriture) => {
    setChargementAction(true);
    try {
      await AxiosInstance.post(`/ecritures-comptables/${ecriture.id}/valider/`);
      await chargerDonnees();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const getBadgeStatut = (statut) => {
    const cfg = STATUTS_CONFIG[statut] || { label: statut, cls: 'badge-ghost', icon: FileText };
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: ecritures.length,
    brouillons: ecritures.filter(e => e.statut === 'brouillon').length,
    validees: ecritures.filter(e => e.statut === 'validee').length,
    totalDebit: ecritures.reduce((sum, e) => sum + Number(e.total_debit || 0), 0),
    totalCredit: ecritures.reduce((sum, e) => sum + Number(e.total_credit || 0), 0),
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Écritures comptables</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Écritures comptables
          </h1>
          <p className="text-base-content/60 mt-1">
            {ecrituresFiltrees.length} écriture{ecrituresFiltrees.length > 1 ? 's' : ''} trouvée{ecrituresFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/ecritures-comptables/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouvelle écriture
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ghost/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-base-content/50" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Brouillons</p>
              <p className="text-xl font-bold">{stats.brouillons}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Validées</p>
              <p className="text-xl font-bold text-success">{stats.validees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Équilibrées</p>
              <p className="text-xl font-bold text-info">
                {ecritures.filter(e => Number(e.total_debit) === Number(e.total_credit)).length}
              </p>
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
                  placeholder="Rechercher par numéro, libellé, référence..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUTS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreJournal}
              onChange={(e) => setFiltreJournal(e.target.value)}
            >
              <option value="all">Tous les journaux</option>
              {journaux.map(j => (
                <option key={j.id} value={j.id}>{j.code} — {j.libelle}</option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setRecherche(''); setFiltreStatut('all'); setFiltreJournal('all'); }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* LISTE */}
      {ecrituresFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <BookOpen className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune écriture trouvée</p>
          <Link to="/ecritures-comptables/ajouter" className="btn btn-primary mt-4">Créer une écriture</Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Journal</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Libellé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Débit</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Crédit</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((ecriture) => {
                  const equilibree = Number(ecriture.total_debit) === Number(ecriture.total_credit);
                  return (
                    <tr key={ecriture.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <Link to={`/ecritures-comptables/${ecriture.id}`} className="font-mono text-sm font-medium text-primary hover:underline">
                          {ecriture.numero}
                        </Link>
                      </td>
                      <td>
                        <p className="text-xs">{formaterDate(ecriture.date_ecriture)}</p>
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm font-mono">
                          {ecriture.journal_code || '—'}
                        </span>
                      </td>
                      <td>
                        <p className="text-sm truncate max-w-[250px]">{ecriture.libelle}</p>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm">{formaterMontant(ecriture.total_debit)}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm">{formaterMontant(ecriture.total_credit)}</span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          {getBadgeStatut(ecriture.statut)}
                          {!equilibree && (
                            <span className="badge badge-error badge-xs gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Non équilibrée
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link to={`/ecritures-comptables/${ecriture.id}`} className="btn btn-ghost btn-xs" title="Voir">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {ecriture.statut === 'brouillon' && (
                            <button
                              onClick={() => validerEcriture(ecriture)}
                              className="btn btn-ghost btn-xs text-success"
                              title="Valider"
                              disabled={chargementAction || !equilibree}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Link to={`/ecritures-comptables/${ecriture.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => { setEcritureSelectionnee(ecriture); setShowModalSuppression(true); }}
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
                {Math.min(pageActuelle * elementsParPage, ecrituresFiltrees.length)} sur{' '}
                {ecrituresFiltrees.length} écritures
              </p>
              <div className="flex gap-1">
                <button className="btn btn-sm btn-ghost" onClick={() => setPageActuelle(pageActuelle - 1)} disabled={pageActuelle === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`btn btn-sm ${pageActuelle === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPageActuelle(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="btn btn-sm btn-ghost" onClick={() => setPageActuelle(pageActuelle + 1)} disabled={pageActuelle === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && ecritureSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'écriture</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer l'écriture <span className="font-bold font-mono">{ecritureSelectionnee.numero}</span> ?
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

export default EcrituresComptables;