// components/comptabilite/Lettrage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Scale, Hash, Link2, CheckCircle, Info, X, FileText,
  Calendar, DollarSign, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Lettrage = () => {
  const navigate = useNavigate();

  // ============================================================
  // ÉTATS
  // ============================================================
  const [lettrages, setLettrages] = useState([]);
  const [lettragesFiltres, setLettragesFiltres] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreCompte, setFiltreCompte] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);

  // Modales
  const [showModalDetail, setShowModalDetail] = useState(false);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [lettrageSelectionne, setLettrageSelectionne] = useState(null);
  const [chargementAction, setChargementAction] = useState(false);

  // ============================================================
  // CHARGEMENT
  // ============================================================
  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [lettragesRes, comptesRes] = await Promise.all([
        AxiosInstance.get('/lettrages/').catch(() => ({ data: [] })),
        AxiosInstance.get('/comptes-comptables/').catch(() => ({ data: [] })),
      ]);

      const lettragesData = lettragesRes.data?.results || lettragesRes.data || [];
      const comptesData = comptesRes.data?.results || comptesRes.data || [];

      setLettrages(Array.isArray(lettragesData) ? lettragesData : []);
      setLettragesFiltres(Array.isArray(lettragesData) ? lettragesData : []);
      setComptes(Array.isArray(comptesData) ? comptesData : []);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setErreur('Impossible de charger les lettrages');
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // FILTRAGE
  // ============================================================
  useEffect(() => {
    let filtre = Array.isArray(lettrages) ? [...lettrages] : [];

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(l => {
        const code = l?.code_lettrage?.toLowerCase() || '';
        const numero = l?.compte_numero?.toLowerCase() || '';
        const libelle = l?.compte_libelle?.toLowerCase() || '';
        const notes = l?.notes?.toLowerCase() || '';
        return code.includes(terme) || numero.includes(terme) ||
               libelle.includes(terme) || notes.includes(terme);
      });
    }

    if (filtreCompte !== 'all') {
      filtre = filtre.filter(l => String(l?.compte) === String(filtreCompte));
    }

    setLettragesFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreCompte, lettrages]);

  // ============================================================
  // PAGINATION
  // ============================================================
  const totalPages = Math.ceil(lettragesFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return lettragesFiltres.slice(debut, debut + elementsParPage);
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const supprimerLettrage = async () => {
    if (!lettrageSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/lettrages/${lettrageSelectionne.id}/`);
      setLettrages(lettrages.filter(l => l.id !== lettrageSelectionne.id));
      setShowModalSuppression(false);
      setLettrageSelectionne(null);
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formaterMontant = (m) => {
    const num = Number(m ?? 0);
    if (num === 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(num) + ' GNF';
  };

  const formaterDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('fr-FR');
    } catch {
      return '—';
    }
  };

  const formaterDateHeure = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const getTypeLettrage = (lettrage) => {
    // Un lettrage "complet" a un montant > 0
    const montant = Number(lettrage?.montant_lettre || 0);
    if (montant > 0) {
      return { label: 'Complet', cls: 'badge-success', icon: CheckCircle };
    }
    return { label: 'Partiel', cls: 'badge-warning', icon: Clock };
  };

  const stats = useMemo(() => {
    const total = Array.isArray(lettrages) ? lettrages.length : 0;
    const montantTotal = Array.isArray(lettrages)
      ? lettrages.reduce((sum, l) => sum + Number(l?.montant_lettre ?? 0), 0)
      : 0;
    const comptesConcernes = Array.isArray(lettrages)
      ? new Set(lettrages.map(l => l?.compte).filter(Boolean)).size
      : 0;
    const ceMois = Array.isArray(lettrages)
      ? lettrages.filter(l => {
          if (!l?.date_lettrage) return false;
          try {
            const d = new Date(l.date_lettrage);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          } catch {
            return false;
          }
        }).length
      : 0;
    return { total, montantTotal, comptesConcernes, ceMois };
  }, [lettrages]);

  const filtresActifs = recherche || filtreCompte !== 'all';

  // ============================================================
  // RENDU
  // ============================================================
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
        <button onClick={chargerDonnees} className="btn btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <CheckSquare className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Lettrage</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-primary" />
            Lettrage comptable
          </h1>
          <p className="text-base-content/60 mt-1">
            {lettragesFiltres.length} lettrage{lettragesFiltres.length > 1 ? 's' : ''}
            {filtresActifs && lettrages.length !== lettragesFiltres.length && (
              <span className="text-base-content/40"> (sur {lettrages.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/lettrage/ajouter" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" /> Nouveau lettrage
          </Link>
        </div>
      </div>

      {/* ============ INFO ============ */}
      <div className="alert alert-info mb-6">
        <Info className="w-5 h-5" />
        <div>
          <p className="font-bold">Le lettrage pointe les factures avec les paiements</p>
          <p className="text-sm">
            Il permet de rapprocher les écritures comptables. Chaque lettrage porte un code unique
            qui associe une facture à son paiement dans le grand livre.
          </p>
        </div>
      </div>

      {/* ============ STATISTIQUES ============ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <Hash className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Montant total</p>
              <p className="text-sm font-bold text-success truncate font-mono">
                {new Intl.NumberFormat('fr-FR').format(stats.montantTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Comptes</p>
              <p className="text-xl font-bold text-info">{stats.comptesConcernes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Ce mois</p>
              <p className="text-xl font-bold text-warning">{stats.ceMois}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ FILTRES ============ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par code, compte, notes..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm max-w-[280px]"
              value={filtreCompte}
              onChange={(e) => setFiltreCompte(e.target.value)}
            >
              <option value="all">Tous les comptes</option>
              {comptes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.numero} — {c.libelle}
                </option>
              ))}
            </select>

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreCompte('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============ LISTE ============ */}
      {lettragesFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <CheckSquare className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs ? 'Aucun lettrage ne correspond aux filtres' : 'Aucun lettrage enregistré'}
          </p>
          <Link to="/lettrage/ajouter" className="btn btn-primary mt-4">
            <Plus className="w-4 h-4 mr-2" /> Créer un lettrage
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Code</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Compte</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Montant</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Notes</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((l) => {
                  const typeLettrage = getTypeLettrage(l);
                  const TypeIcon = typeLettrage.icon;
                  return (
                    <tr key={l.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="badge badge-primary badge-sm gap-1 font-mono">
                            <Link2 className="w-3 h-3" />
                            {l.code_lettrage}
                          </span>
                          <span className={`badge ${typeLettrage.cls} badge-xs gap-1`}>
                            <TypeIcon className="w-2.5 h-2.5" />
                            {typeLettrage.label}
                          </span>
                        </div>
                      </td>
                      <td>
                        <p className="font-mono text-sm font-bold text-primary">
                          {l.compte_numero || '—'}
                        </p>
                        <p className="text-xs text-base-content/50 truncate max-w-[200px]">
                          {l.compte_libelle || ''}
                        </p>
                      </td>
                      <td>
                        <p className="text-xs font-mono">{formaterDate(l.date_lettrage)}</p>
                      </td>
                      <td className="text-right">
                        <span className="font-mono text-sm font-bold text-success">
                          {formaterMontant(l.montant_lettre)}
                        </span>
                      </td>
                      <td>
                        <p className="text-xs text-base-content/70 truncate max-w-[180px]">
                          {l.notes || '—'}
                        </p>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setLettrageSelectionne(l);
                              setShowModalDetail(true);
                            }}
                            className="btn btn-ghost btn-xs"
                            title="Voir le détail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/lettrage/${l.id}/modifier`}
                            className="btn btn-ghost btn-xs text-primary"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setLettrageSelectionne(l);
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
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <p className="text-sm text-base-content/60">
                {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, lettragesFiltres.length)} sur{' '}
                {lettragesFiltres.length} lettrage{lettragesFiltres.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
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

      {/* ============ MODAL DÉTAIL ============ */}
      {showModalDetail && lettrageSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalDetail(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Détail du lettrage
              </h3>
              <button
                onClick={() => setShowModalDetail(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">

              {/* Code */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-xs text-base-content/50 uppercase mb-1">Code de lettrage</p>
                <p className="font-mono text-2xl font-bold text-primary">
                  {lettrageSelectionne.code_lettrage}
                </p>
              </div>

              {/* Compte */}
              <div>
                <p className="text-xs text-base-content/50 uppercase mb-1">Compte</p>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-base-content/40" />
                  <p className="font-mono font-bold text-primary">
                    {lettrageSelectionne.compte_numero || '—'}
                  </p>
                  <span className="text-base-content/60">—</span>
                  <p className="text-sm truncate">{lettrageSelectionne.compte_libelle || '—'}</p>
                </div>
              </div>

              {/* Montant */}
              <div>
                <p className="text-xs text-base-content/50 uppercase mb-1">Montant lettré</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <p className="font-mono text-2xl font-bold text-success">
                    {formaterMontant(lettrageSelectionne.montant_lettre)}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-base-content/50 uppercase mb-1">Date de lettrage</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-base-content/40" />
                  <p className="font-medium">{formaterDate(lettrageSelectionne.date_lettrage)}</p>
                </div>
              </div>

              {/* Notes */}
              {lettrageSelectionne.notes && (
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Notes</p>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{lettrageSelectionne.notes}</p>
                  </div>
                </div>
              )}

              {/* Métadonnées */}
              <div className="divider my-2"></div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-base-content/50">Créé le</p>
                  <p className="font-medium">{formaterDateHeure(lettrageSelectionne.created_at)}</p>
                </div>
                <div>
                  <p className="text-base-content/50">Modifié le</p>
                  <p className="font-medium">{formaterDateHeure(lettrageSelectionne.updated_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="btn flex-1"
                onClick={() => setShowModalDetail(false)}
              >
                Fermer
              </button>
              <Link
                to={`/lettrage/${lettrageSelectionne.id}/modifier`}
                className="btn btn-primary flex-1 gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL SUPPRESSION ============ */}
      {showModalSuppression && lettrageSelectionne && (
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
              <h3 className="text-xl font-bold mb-2">Supprimer le lettrage</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer le lettrage <strong className="font-mono">{lettrageSelectionne.code_lettrage}</strong> ?
                <br />
                <span className="text-sm">Cette action est irréversible.</span>
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
                  onClick={supprimerLettrage}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Suppression...</>
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

export default Lettrage;