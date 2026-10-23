// src/components/stocks/RapportsStocks.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet, Loader2, AlertCircle, RefreshCw,
  Package, TrendingDown, TrendingUp, DollarSign,
  HardHat, Warehouse, Calendar, Filter, Printer,
  AlertTriangle, CheckCircle, BarChart3, PieChart,
  ArrowLeftRight, Wrench, UserCheck, ClipboardCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const RapportsStocks = () => {
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Données brutes
  const [articles, setArticles] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [inventaires, setInventaires] = useState([]);

  // Filtres
  const [filtreMagasin, setFiltreMagasin] = useState('all');
  const [dateDebut, setDateDebut] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]
  );
  const [dateFin, setDateFin] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [artRes, eqRes, mvtRes, magRes, invRes] = await Promise.all([
        AxiosInstance.get('/articles/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/equipements/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/mouvements-stock/?page_size=500').catch(() => ({ data: [] })),
        AxiosInstance.get('/magasins/').catch(() => ({ data: [] })),
        AxiosInstance.get('/inventaires/?page_size=200').catch(() => ({ data: [] })),
      ]);
      setArticles(artRes.data.results || artRes.data || []);
      setEquipements(eqRes.data.results || eqRes.data || []);
      setMouvements(mvtRes.data.results || mvtRes.data || []);
      setMagasins(magRes.data.results || magRes.data || []);
      setInventaires(invRes.data.results || invRes.data || []);
    } catch (err) {
      console.error(err);
      setErreur('Impossible de charger les données');
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // FILTRAGE DES MOUVEMENTS PAR DATE + MAGASIN
  // ============================================================
  const mouvementsFiltres = useMemo(() => {
    return mouvements.filter(m => {
      const d = m.date_mouvement?.slice(0, 10);
      if (dateDebut && d < dateDebut) return false;
      if (dateFin && d > dateFin) return false;
      if (filtreMagasin !== 'all') {
        const idMag = String(filtreMagasin);
        if (
          String(m.magasin_source) !== idMag &&
          String(m.magasin_destination) !== idMag
        ) return false;
      }
      return true;
    });
  }, [mouvements, dateDebut, dateFin, filtreMagasin]);

  // ============================================================
  // STATS ARTICLES
  // ============================================================
  const statsArticles = useMemo(() => {
    const total = articles.length;
    const critiques = articles.filter(a => a.est_critique).length;
    const enAlerte = articles.filter(a => a.est_en_alerte && !a.est_critique).length;
    const valeurStock = articles.reduce((s, a) => {
      const q = Number(a.stock_total || 0);
      const p = Number(a.prix_achat || 0);
      return s + q * p;
    }, 0);
    return { total, critiques, enAlerte, valeurStock };
  }, [articles]);

  // ============================================================
  // STATS ÉQUIPEMENTS
  // ============================================================
  const statsEquipements = useMemo(() => {
    const total = equipements.length;
    const parEtat = {};
    equipements.forEach(e => {
      parEtat[e.etat] = (parEtat[e.etat] || 0) + 1;
    });
    const valeurAcquisition = equipements.reduce(
      (s, e) => s + Number(e.cout_acquisition || 0), 0
    );
    const valeurActuelle = equipements.reduce(
      (s, e) => s + Number(e.valeur_actuelle || 0), 0
    );
    const sousGarantie = equipements.filter(e => e.est_sous_garantie).length;
    return { total, parEtat, valeurAcquisition, valeurActuelle, sousGarantie };
  }, [equipements]);

  // ============================================================
  // STATS MOUVEMENTS
  // ============================================================
  const statsMouvements = useMemo(() => {
    const totaux = { entree: 0, sortie: 0, transfert: 0, ajustement: 0, retour: 0 };
    const valeurs = { entree: 0, sortie: 0 };
    mouvementsFiltres.forEach(m => {
      const q = Number(m.quantite || 0);
      if (totaux[m.type] !== undefined) totaux[m.type] += q;
      if (m.type === 'entree') valeurs.entree += q * Number(m.prix_unitaire || 0);
      if (m.type === 'sortie') valeurs.sortie += q * Number(m.prix_unitaire || 0);
    });
    return { totaux, valeurs };
  }, [mouvementsFiltres]);

  // ============================================================
  // TOP ARTICLES CONSOMMÉS
  // ============================================================
  const topArticlesConsommes = useMemo(() => {
    const map = {};
    mouvementsFiltres
      .filter(m => m.type === 'sortie')
      .forEach(m => {
        const key = m.article;
        if (!map[key]) {
          map[key] = {
            id: m.article,
            code: m.article_code,
            designation: m.article_designation,
            quantite: 0,
          };
        }
        map[key].quantite += Number(m.quantite || 0);
      });
    return Object.values(map)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 10);
  }, [mouvementsFiltres]);

  // ============================================================
  // INVENTAIRES RÉCENTS
  // ============================================================
  const inventairesRecents = useMemo(() => {
    return inventaires
      .filter(i => {
        if (!i.date_inventaire) return false;
        const d = i.date_inventaire.slice(0, 10);
        if (dateDebut && d < dateDebut) return false;
        if (dateFin && d > dateFin) return false;
        return true;
      })
      .slice(0, 5);
  }, [inventaires, dateDebut, dateFin]);

  // ============================================================
  // FORMATTERS
  // ============================================================
  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(m))) + ' GNF';
  };
  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterNombre = (n) => new Intl.NumberFormat('fr-FR').format(Number(n || 0));

  // ============================================================
  // EXPORT PDF (jsPDF)
  // ============================================================
  const exporterPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      // Titre
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageW, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('APG ASSAINISSEMENT', 14, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport Stocks & Équipements', 14, 19);

      y = 32;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text(`Période : ${formaterDate(dateDebut)} → ${formaterDate(dateFin)}`, 14, y);
      y += 5;
      doc.text(
        `Magasin : ${filtreMagasin === 'all' ? 'Tous' : magasins.find(m => String(m.id) === String(filtreMagasin))?.nom || '—'}`,
        14, y
      );
      y += 5;
      doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, y);
      y += 10;

      // Section 1 : Stats articles
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Articles (consommables)', 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total articles : ${statsArticles.total}`, 14, y); y += 4;
      doc.text(`En stock critique : ${statsArticles.critiques}`, 14, y); y += 4;
      doc.text(`En alerte : ${statsArticles.enAlerte}`, 14, y); y += 4;
      doc.text(`Valeur du stock : ${formaterMontant(statsArticles.valeurStock)}`, 14, y); y += 8;

      // Section 2 : Équipements
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Équipements durables', 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total équipements : ${statsEquipements.total}`, 14, y); y += 4;
      doc.text(`Sous garantie : ${statsEquipements.sousGarantie}`, 14, y); y += 4;
      doc.text(`Valeur d'acquisition : ${formaterMontant(statsEquipements.valeurAcquisition)}`, 14, y); y += 4;
      doc.text(`Valeur actuelle (amortie) : ${formaterMontant(statsEquipements.valeurActuelle)}`, 14, y); y += 8;

      // Section 3 : Mouvements
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Mouvements de stock sur la période', 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Entrées : ${formaterNombre(statsMouvements.totaux.entree)} unités`, 14, y); y += 4;
      doc.text(`Sorties : ${formaterNombre(statsMouvements.totaux.sortie)} unités`, 14, y); y += 4;
      doc.text(`Transferts : ${formaterNombre(statsMouvements.totaux.transfert)} unités`, 14, y); y += 4;
      doc.text(`Ajustements : ${formaterNombre(statsMouvements.totaux.ajustement)} unités`, 14, y); y += 8;

      // Section 4 : Top 10 articles
      if (topArticlesConsommes.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('4. Top 10 articles consommés', 14, y);
        y += 6;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        topArticlesConsommes.forEach((a, i) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${i + 1}. [${a.code}] ${a.designation} — ${formaterNombre(a.quantite)}`, 14, y);
          y += 4;
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i}/${pageCount} — APG ASSAINISSEMENT`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }

      doc.save(`rapport-stocks-${dateDebut}-${dateFin}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du PDF. Vérifie que jspdf est installé : npm install jspdf');
    }
  };

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
      <div className="text-center py-20 w-full">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={charger} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* EN-TÊTE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase mb-1">
            <BarChart3 className="w-3 h-3" /> Stocks / Rapports
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            Rapports Stocks & Équipements
          </h1>
          <p className="text-base-content/60 mt-1">
            Vue synthétique sur la période sélectionnée
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={exporterPDF} className="btn btn-primary gap-2">
            <Printer className="w-5 h-5" /> Exporter PDF
          </button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="form-control">
              <label className="label py-0 pb-1">
                <span className="label-text text-xs font-medium">Du</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label py-0 pb-1">
                <span className="label-text text-xs font-medium">Au</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
            <div className="form-control min-w-[200px]">
              <label className="label py-0 pb-1">
                <span className="label-text text-xs font-medium">Magasin</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={filtreMagasin}
                onChange={(e) => setFiltreMagasin(e.target.value)}
              >
                <option value="all">Tous les magasins</option>
                {magasins.map(m => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setDateDebut(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
                setDateFin(new Date().toISOString().split('T')[0]);
                setFiltreMagasin('all');
              }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1 — STATS ARTICLES */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase text-base-content/60 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> 1. Articles (consommables)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Total articles</p>
                <p className="text-xl font-bold">{statsArticles.total}</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Critiques</p>
                <p className="text-xl font-bold text-error">{statsArticles.critiques}</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">En alerte</p>
                <p className="text-xl font-bold text-warning">{statsArticles.enAlerte}</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 uppercase">Valeur du stock</p>
                <p className="text-sm font-bold font-mono truncate">
                  {formaterMontant(statsArticles.valeurStock)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — STATS ÉQUIPEMENTS */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase text-base-content/60 mb-3 flex items-center gap-2">
          <HardHat className="w-4 h-4" /> 2. Équipements durables
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HardHat className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Total équipements</p>
                <p className="text-xl font-bold">{statsEquipements.total}</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase">Sous garantie</p>
                <p className="text-xl font-bold text-success">{statsEquipements.sousGarantie}</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 uppercase">Valeur acquisition</p>
                <p className="text-sm font-bold font-mono truncate">
                  {formaterMontant(statsEquipements.valeurAcquisition)}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 uppercase">Valeur actuelle</p>
                <p className="text-sm font-bold font-mono truncate">
                  {formaterMontant(statsEquipements.valeurActuelle)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Répartition par état */}
        <div className="card bg-base-100 shadow-sm border border-base-300 mt-4">
          <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Répartition des équipements par état</h2>
          </div>
          <div className="p-5">
            {Object.keys(statsEquipements.parEtat).length === 0 ? (
              <p className="text-sm text-base-content/40">Aucun équipement</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(statsEquipements.parEtat).map(([etat, count]) => {
                  const pct = statsEquipements.total
                    ? Math.round((count / statsEquipements.total) * 100)
                    : 0;
                  const colors = {
                    neuf: 'bg-success',
                    bon: 'bg-success/70',
                    usage: 'bg-warning',
                    defectueux: 'bg-error',
                    hors_service: 'bg-error/70',
                    rebut: 'bg-base-content/30',
                  };
                  return (
                    <div key={etat} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-24 capitalize">{etat.replace('_', ' ')}</span>
                      <div className="flex-1 bg-base-200 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full ${colors[etat] || 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono w-16 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3 — MOUVEMENTS DE STOCK */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase text-base-content/60 mb-3 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" /> 3. Mouvements sur la période
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-success/5 border border-success/20">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-success uppercase font-bold">Entrées</p>
                <p className="text-xl font-bold font-mono">
                  {formaterNombre(statsMouvements.totaux.entree)}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-error/5 border border-error/20">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs text-error uppercase font-bold">Sorties</p>
                <p className="text-xl font-bold font-mono">
                  {formaterNombre(statsMouvements.totaux.sortie)}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-info/5 border border-info/20">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-info uppercase font-bold">Transferts</p>
                <p className="text-xl font-bold font-mono">
                  {formaterNombre(statsMouvements.totaux.transfert)}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-warning/5 border border-warning/20">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-warning uppercase font-bold">Ajustements</p>
                <p className="text-xl font-bold font-mono">
                  {formaterNombre(statsMouvements.totaux.ajustement)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 — TOP 10 ARTICLES CONSOMMÉS */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase text-base-content/60 mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4" /> 4. Top 10 articles consommés
        </h2>
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            {topArticlesConsommes.length === 0 ? (
              <div className="text-center py-8 text-base-content/40">
                <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune sortie enregistrée sur la période</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-base-200/50 border-b border-base-300">
                      <th className="text-xs uppercase w-12">#</th>
                      <th className="text-xs uppercase">Code</th>
                      <th className="text-xs uppercase">Article</th>
                      <th className="text-xs uppercase text-right">Quantité sortie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topArticlesConsommes.map((a, i) => (
                      <tr key={a.id} className="border-b border-base-200 last:border-0 hover:bg-base-200/50">
                        <td>
                          <span className={`badge badge-sm ${i < 3 ? 'badge-error' : 'badge-ghost'} font-mono`}>
                            {i + 1}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs font-bold text-primary">
                            {a.code}
                          </span>
                        </td>
                        <td>
                          <Link to={`/articles/${a.id}`} className="text-sm hover:text-primary truncate block max-w-[300px]">
                            {a.designation}
                          </Link>
                        </td>
                        <td className="text-right">
                          <span className="font-mono font-bold">{formaterNombre(a.quantite)}</span>
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

      {/* SECTION 5 — INVENTAIRES RÉCENTS */}
      <div>
        <h2 className="text-sm font-bold uppercase text-base-content/60 mb-3 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" /> 5. Inventaires récents
        </h2>
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            {inventairesRecents.length === 0 ? (
              <div className="text-center py-8 text-base-content/40">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun inventaire sur la période</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-base-200/50 border-b border-base-300">
                      <th className="text-xs uppercase">Référence</th>
                      <th className="text-xs uppercase">Date</th>
                      <th className="text-xs uppercase">Magasin</th>
                      <th className="text-xs uppercase text-center">Lignes</th>
                      <th className="text-xs uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventairesRecents.map(i => {
                      const statutColors = {
                        en_cours: 'badge-info',
                        valide: 'badge-success',
                        annule: 'badge-ghost',
                      };
                      return (
                        <tr key={i.id} className="border-b border-base-200 last:border-0 hover:bg-base-200/50">
                          <td>
                            <Link to={`/inventaires/${i.id}`} className="font-mono text-xs font-bold text-primary">
                              {i.reference}
                            </Link>
                          </td>
                          <td className="font-mono text-xs">{formaterDate(i.date_inventaire)}</td>
                          <td className="text-sm truncate max-w-[200px]">{i.magasin_nom || '—'}</td>
                          <td className="text-center">
                            <span className="badge badge-ghost badge-sm">
                              {i.nombre_lignes || 0}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${statutColors[i.statut] || 'badge-ghost'} badge-sm`}>
                              {i.statut_display || i.statut}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportsStocks;