// components/paie/FichesPaie.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Search, Eye, Loader2, AlertCircle, RefreshCw,
  Filter, ChevronLeft, ChevronRight, Calculator, Download,
  Calendar, Users, TrendingUp, Wallet, FileDown, Printer,
  CalendarDays, Hash, User, Info
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// Mois
// ============================================================
const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const FichesPaie = () => {
  const [fiches, setFiches] = useState([]);
  const [fichesFiltrees, setFichesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState('all');
  const [filtreMois, setFiltreMois] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(15);
  const [telechargementEnCours, setTelechargementEnCours] = useState(null);

  // ------------------------------------------------------------
  // Chargement
  // ------------------------------------------------------------
  useEffect(() => {
    chargerFiches();
  }, []);

  const chargerFiches = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/fiches-paie/');
      const data = res.data.results || res.data || [];
      setFiches(data);
      setFichesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les fiches de paie');
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Filtrage
  // ------------------------------------------------------------
  useEffect(() => {
    let filtre = fiches;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(f =>
        f.employe_nom?.toLowerCase().includes(terme) ||
        f.bulletin_numero?.toLowerCase().includes(terme)
      );
    }
    if (filtreAnnee !== 'all') filtre = filtre.filter(f => String(f.annee) === String(filtreAnnee));
    if (filtreMois !== 'all') filtre = filtre.filter(f => String(f.mois) === String(filtreMois));
    setFichesFiltrees(filtre);
    setPageActuelle(1);
  }, [recherche, filtreAnnee, filtreMois, fiches]);

  const totalPages = Math.ceil(fichesFiltrees.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return fichesFiltrees.slice(debut, debut + elementsParPage);
  };

  const anneesDisponibles = useMemo(() => {
    const set = new Set(fiches.map(f => f.annee).filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [fiches]);

  // ------------------------------------------------------------
  // Téléchargement PDF
  // ------------------------------------------------------------
  const telechargerPDF = async (fiche) => {
    if (!fiche.fichier_pdf) {
      alert('Aucun PDF disponible pour cette fiche');
      return;
    }
    setTelechargementEnCours(fiche.id);
    try {
      const res = await AxiosInstance.get(
        `/fiches-paie/${fiche.id}/`,
        { responseType: 'blob' }
      );
      // Utilise directement l'URL du fichier (plus simple)
      const url = fiche.fichier_pdf.startsWith('http')
        ? fiche.fichier_pdf
        : `${AxiosInstance.defaults.baseURL}${fiche.fichier_pdf}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = `fiche_paie_${fiche.employe_nom}_${fiche.mois}_${fiche.annee}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Erreur lors du téléchargement');
    } finally {
      setTelechargementEnCours(null);
    }
  };

  // ------------------------------------------------------------
  // Formatage
  // ------------------------------------------------------------
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const formaterMontantCourt = (m) => {
    const num = Number(m || 0);
    if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
  };

  // ------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------
  const stats = useMemo(() => ({
    total: fiches.length,
    avecPDF: fiches.filter(f => f.fichier_pdf).length,
    masseBrute: fiches.reduce((sum, f) => sum + Number(f.salaire_brut || 0), 0),
    masseNette: fiches.reduce((sum, f) => sum + Number(f.salaire_net || 0), 0),
  }), [fiches]);

  const filtresActifs = recherche || filtreAnnee !== 'all' || filtreMois !== 'all';

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
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={chargerFiches} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full p-6">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Calculator className="w-3 h-3" />
            Paie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Fiches de paie</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Fiches de paie
          </h1>
          <p className="text-base-content/60 mt-1">
            {fichesFiltrees.length} fiche{fichesFiltrees.length > 1 ? 's' : ''} trouvée{fichesFiltrees.length > 1 ? 's' : ''}
            {filtresActifs && fiches.length !== fichesFiltrees.length && (
              <span className="text-base-content/40"> (sur {fiches.length})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerFiches} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
        </div>
      </div>

      {/* ============ STATISTIQUES ============ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total fiches</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <FileDown className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Avec PDF</p>
              <p className="text-xl font-bold text-info">{stats.avecPDF}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Masse brute</p>
              <p className="text-sm font-bold truncate font-mono">
                {formaterMontantCourt(stats.masseBrute)} GNF
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Masse nette</p>
              <p className="text-sm font-bold text-success truncate font-mono">
                {formaterMontantCourt(stats.masseNette)} GNF
              </p>
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
                  placeholder="Rechercher par employé, numéro bulletin..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreMois}
              onChange={(e) => setFiltreMois(e.target.value)}
            >
              <option value="all">Tous les mois</option>
              {MOIS_NOMS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>

            {anneesDisponibles.length > 0 && (
              <select
                className="select select-bordered select-sm"
                value={filtreAnnee}
                onChange={(e) => setFiltreAnnee(e.target.value)}
              >
                <option value="all">Toutes les années</option>
                {anneesDisponibles.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {filtresActifs && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreAnnee('all');
                  setFiltreMois('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============ LISTE ============ */}
      {fichesFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {filtresActifs
              ? 'Aucune fiche ne correspond aux filtres'
              : 'Aucune fiche de paie disponible'}
          </p>
          {filtresActifs ? (
            <button
              className="btn btn-ghost mt-4"
              onClick={() => {
                setRecherche('');
                setFiltreAnnee('all');
                setFiltreMois('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          ) : (
            <div className="alert alert-info max-w-lg mx-auto mt-4">
              <Info className="w-5 h-5" />
              <span className="text-sm text-left">
                Les fiches de paie sont <strong>générées automatiquement</strong> à
                partir des bulletins validés d'une période de paie.
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Bulletin</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Employé</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Période</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Brut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Net</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-center">PDF</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((f) => (
                  <tr key={f.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                    <td>
                      {f.bulletin ? (
                        <Link
                          to={`/bulletins-paie/${f.bulletin}`}
                          className="font-mono text-sm font-bold text-primary hover:underline"
                        >
                          {f.bulletin_numero || `#${f.bulletin}`}
                        </Link>
                      ) : (
                        <span className="text-base-content/30 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                          <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                            <span>{(f.employe_nom?.[0] || '?').toUpperCase()}</span>
                          </div>
                        </div>
                        <p className="font-medium text-sm truncate max-w-[180px]">
                          {f.employe_nom || '—'}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm font-mono">
                        {MOIS_NOMS[(f.mois || 1) - 1]} {f.annee}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-xs">
                        {formaterMontantCourt(f.salaire_brut)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm font-bold text-success">
                        {formaterMontantCourt(f.salaire_net)}
                      </span>
                    </td>
                    <td className="text-center">
                      {f.fichier_pdf ? (
                        <span className="badge badge-success badge-sm gap-1">
                          <FileDown className="w-3 h-3" />
                          Oui
                        </span>
                      ) : (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <FileText className="w-3 h-3" />
                          Non
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {f.fichier_pdf && (
                          <>
                            <button
                              onClick={() => window.open(
                                f.fichier_pdf.startsWith('http')
                                  ? f.fichier_pdf
                                  : `${AxiosInstance.defaults.baseURL}${f.fichier_pdf}`,
                                '_blank'
                              )}
                              className="btn btn-ghost btn-xs"
                              title="Voir le PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => telechargerPDF(f)}
                              className="btn btn-ghost btn-xs text-primary"
                              title="Télécharger"
                              disabled={telechargementEnCours === f.id}
                            >
                              {telechargementEnCours === f.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                        {f.bulletin && (
                          <Link
                            to={`/bulletins-paie/${f.bulletin}`}
                            className="btn btn-ghost btn-xs"
                            title="Voir le bulletin"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, fichesFiltrees.length)} sur{' '}
                {fichesFiltrees.length} fiche{fichesFiltrees.length > 1 ? 's' : ''}
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
    </div>
  );
};

export default FichesPaie;