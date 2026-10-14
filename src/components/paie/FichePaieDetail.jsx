// components/paie/FichePaieDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle, FileText,
  Download, Eye, User, Calendar, Hash, Wallet, TrendingUp,
  Printer, Info, FileDown, Calculator, ArrowUpRight
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const FichePaieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fiche, setFiche] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [telechargementEnCours, setTelechargementEnCours] = useState(false);

  // ------------------------------------------------------------
  // Chargement
  // ------------------------------------------------------------
  useEffect(() => {
    chargerFiche();
  }, [id]);

  const chargerFiche = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/fiches-paie/${id}/`);
      setFiche(res.data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(
        err.response?.status === 404
          ? "Cette fiche n'existe pas ou a été supprimée."
          : 'Impossible de charger la fiche.'
      );
    } finally {
      setChargement(false);
    }
  };

  // ------------------------------------------------------------
  // Téléchargement PDF
  // ------------------------------------------------------------
  const getPDFUrl = () => {
    if (!fiche?.fichier_pdf) return null;
    return fiche.fichier_pdf.startsWith('http')
      ? fiche.fichier_pdf
      : `${AxiosInstance.defaults.baseURL}${fiche.fichier_pdf}`;
  };

  const telechargerPDF = () => {
    const url = getPDFUrl();
    if (!url) {
      alert('Aucun PDF disponible pour cette fiche');
      return;
    }
    setTelechargementEnCours(true);
    try {
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
      setTimeout(() => setTelechargementEnCours(false), 800);
    }
  };

  // ------------------------------------------------------------
  // Formatage
  // ------------------------------------------------------------
  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
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
          <button onClick={() => navigate('/fiches-paie')} className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
          <button onClick={chargerFiche} className="btn btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!fiche) return null;

  const pdfUrl = getPDFUrl();
  const netAPayer = Number(fiche.salaire_net || 0);
  const brut = Number(fiche.salaire_brut || 0);
  const totalRetenues = brut - netAPayer;

  // ------------------------------------------------------------
  // Rendu principal
  // ------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/fiches-paie')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Calculator className="w-3 h-3" />
              Paie / Fiches /{' '}
              <span className="text-primary font-mono">#{fiche.id}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate">
                Fiche de paie — {MOIS_NOMS[(fiche.mois || 1) - 1]} {fiche.annee}
              </span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {pdfUrl && (
              <>
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  <Eye className="w-4 h-4" /> Voir PDF
                </button>
                <button
                  onClick={telechargerPDF}
                  className="btn btn-primary btn-sm gap-2"
                  disabled={telechargementEnCours}
                >
                  {telechargementEnCours ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Télécharger
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============ CONTENU ============ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

        {/* ---------- COLONNE PRINCIPALE ---------- */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- Carte NET À PAYER --- */}
          <div className="card bg-gradient-to-br from-success/10 via-success/5 to-base-100 shadow-sm border border-success/20">
            <div className="card-body">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wider">
                      Net à payer
                    </p>
                    <p className="text-3xl font-bold text-success font-mono mt-1">
                      {formaterMontant(netAPayer)}
                    </p>
                  </div>
                </div>
                <span className="badge badge-success badge-lg gap-1.5 flex-shrink-0">
                  <CheckCircle className="w-4 h-4" />
                  Validée
                </span>
              </div>

              <div className="divider my-2"></div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Salaire brut</p>
                  <p className="font-mono font-bold">{formaterMontant(brut)}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Total retenues</p>
                  <p className="font-mono font-bold text-error">
                    -{formaterMontant(totalRetenues)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase mb-1">Période</p>
                  <p className="font-medium">
                    {MOIS_NOMS[(fiche.mois || 1) - 1]} {fiche.annee}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- Détail du calcul --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Détail du calcul</h2>
              </div>
              <div className="p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Salaire brut</span>
                    <span className="font-mono font-bold">{formaterMontant(brut)}</span>
                  </div>

                  <div className="divider my-1"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Total retenues</span>
                    <span className="font-mono font-bold text-error">
                      -{formaterMontant(totalRetenues)}
                    </span>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="flex justify-between items-center bg-success/10 -mx-2 px-2 py-2 rounded">
                    <span className="font-bold">NET À PAYER</span>
                    <span className="font-mono font-bold text-success text-lg">
                      {formaterMontant(netAPayer)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Informations --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Info className="w-4 h-4 text-base-content/60" />
                <h2 className="font-semibold text-sm">Informations</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Employé</p>
                    <p className="font-medium">{fiche.employe_nom || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Bulletin lié</p>
                    {fiche.bulletin ? (
                      <Link
                        to={`/bulletins-paie/${fiche.bulletin}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="font-mono">{fiche.bulletin_numero || `#${fiche.bulletin}`}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-base-content/40">—</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Période</p>
                    <p className="font-medium">
                      {MOIS_NOMS[(fiche.mois || 1) - 1]} {fiche.annee}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase mb-1">Créée le</p>
                    <p className="font-medium">{formaterDate(fiche.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ---------- COLONNE LATÉRALE ---------- */}
        <div className="lg:col-span-1 space-y-6">

          {/* --- Aperçu PDF --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Document PDF</h3>
              </div>

              {pdfUrl ? (
                <div className="space-y-3">
                  <div className="aspect-[3/4] bg-base-200 rounded-lg border border-base-300 flex flex-col items-center justify-center text-base-content/40 gap-2">
                    <FileText className="w-16 h-16" />
                    <p className="text-xs">Aperçu PDF</p>
                    <p className="text-[10px] text-base-content/30">
                      Cliquez pour ouvrir
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(pdfUrl, '_blank')}
                      className="btn btn-outline btn-sm flex-1 gap-2"
                    >
                      <Eye className="w-4 h-4" /> Ouvrir
                    </button>
                    <button
                      onClick={telechargerPDF}
                      className="btn btn-primary btn-sm flex-1 gap-2"
                      disabled={telechargementEnCours}
                    >
                      {telechargementEnCours ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Télécharger
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-base-content/40">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Aucun PDF généré</p>
                </div>
              )}
            </div>
          </div>

          {/* --- Actions rapides --- */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Actions rapides</h3>
              </div>
              <div className="space-y-2">
                <Link
                  to="/fiches-paie"
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <FileText className="w-4 h-4" />
                  Toutes les fiches
                </Link>
                <Link
                  to="/periodes-paie"
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Calendar className="w-4 h-4" />
                  Périodes de paie
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
                  <p className="font-medium text-info mb-1">À savoir</p>
                  <ul className="text-base-content/70 space-y-1">
                    <li>• La fiche est générée automatiquement à la validation du bulletin.</li>
                    <li>• Le PDF est archivé et ne peut plus être modifié.</li>
                    <li>• Pour toute rectification, contactez le service RH.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FichePaieDetail;