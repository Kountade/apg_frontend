// components/comptabilite/CompteResultat.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw,
  Printer, FileDown, BarChart3, ArrowUpRight, ArrowDownRight,
  CheckCircle, XCircle, Info
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CompteResultat = () => {
  const [balance, setBalance] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    chargerBalance();
  }, []);

  const chargerBalance = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/ecritures-comptables/balance/');
      const data = res?.data?.results || res?.data || [];
      setBalance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement balance:', err);
      setErreur(
        err?.response?.status === 404
          ? "L'endpoint /ecritures-comptables/balance/ est introuvable"
          : err?.response?.status === 401 || err?.response?.status === 403
            ? "Session expirée. Veuillez vous reconnecter."
            : "Impossible de charger le compte de résultat"
      );
    } finally {
      setChargement(false);
    }
  };

  const formaterMontant = (m) => {
    const num = Number(m ?? 0);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formaterMontantCourt = (m) => {
    const num = Number(m || 0);
    if (isNaN(num)) return '0';
    const abs = Math.abs(num);
    if (abs >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (abs >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (abs >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
  };

  const analyse = useMemo(() => {
    const safeBalance = Array.isArray(balance) ? balance : [];
    
    const charges = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      return num.startsWith('6');
    });
    
    const produits = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      return num.startsWith('7');
    });

    const totalCharges = charges.reduce((sum, c) => sum + Math.abs(Number(c?.solde ?? 0)), 0);
    const totalProduits = produits.reduce((sum, p) => sum + Math.abs(Number(p?.solde ?? 0)), 0);
    const resultat = totalProduits - totalCharges;

    return {
      charges,
      produits,
      totalCharges,
      totalProduits,
      resultat,
      estBenefice: resultat >= 0,
      margeNette: totalProduits > 0 ? (resultat / totalProduits) * 100 : 0,
    };
  }, [balance]);

  const exporterCSV = () => {
    try {
      const headers = ['Type', 'Numéro', 'Libellé', 'Montant'];
      const lignes = [
        ['CHARGES (Classe 6)', '', '', ''],
        ...analyse.charges.map(c => ['Charge', c?.numero || '', c?.libelle || '', Math.abs(Number(c?.solde ?? 0))]),
        ['', 'TOTAL CHARGES', '', analyse.totalCharges],
        ['', '', '', ''],
        ['PRODUITS (Classe 7)', '', '', ''],
        ...analyse.produits.map(p => ['Produit', p?.numero || '', p?.libelle || '', Math.abs(Number(p?.solde ?? 0))]),
        ['', 'TOTAL PRODUITS', '', analyse.totalProduits],
        ['', '', '', ''],
        ['', 'RÉSULTAT', analyse.estBenefice ? 'Bénéfice' : 'Perte', analyse.resultat],
      ];

      const csv = [
        headers.join(';'),
        ...lignes.map(l => l.map(v => `"${v}"`).join(';')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compte_resultat_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur lors de l\'export CSV');
      console.error(err);
    }
  };

  // ============================================================
  // RENDU : CHARGEMENT
  // ============================================================
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // ============================================================
  // RENDU : ERREUR
  // ============================================================
  if (erreur) {
    return (
      <div className="text-center py-20 w-full px-6">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70 mb-4">{erreur}</p>
        <button onClick={chargerBalance} className="btn btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
        </button>
      </div>
    );
  }

  // ============================================================
  // RENDU : PRINCIPAL
  // ============================================================
  return (
    <div className="w-full p-6">

      {/* ============ EN-TÊTE ============ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <BarChart3 className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Compte de résultat</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Compte de résultat
          </h1>
          <p className="text-base-content/60 mt-1">
            Exercice {new Date().getFullYear()} • Charges et Produits
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerBalance} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={exporterCSV} className="btn btn-outline btn-sm gap-2">
            <FileDown className="w-4 h-4" /> Exporter CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-primary btn-sm gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* ============ BANDEAU RÉSULTAT ============ */}
      <div className={`card mb-6 shadow-sm border-2 ${
        analyse.estBenefice
          ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/30'
          : 'bg-gradient-to-br from-error/10 to-error/5 border-error/30'
      }`}>
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                analyse.estBenefice ? 'bg-success/20' : 'bg-error/20'
              }`}>
                {analyse.estBenefice ? (
                  <TrendingUp className="w-8 h-8 text-success" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-error" />
                )}
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wider">
                  Résultat de l'exercice
                </p>
                <p className={`text-4xl font-bold font-mono mt-1 ${
                  analyse.estBenefice ? 'text-success' : 'text-error'
                }`}>
                  {analyse.estBenefice ? '+' : ''}{formaterMontant(analyse.resultat)} GNF
                </p>
                <span className={`badge badge-lg mt-2 gap-1 ${
                  analyse.estBenefice ? 'badge-success' : 'badge-error'
                }`}>
                  {analyse.estBenefice ? (
                    <><CheckCircle className="w-4 h-4" /> Bénéfice</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Perte</>
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-6 text-sm">
              <div className="text-right">
                <p className="text-xs text-base-content/50 uppercase">Total Produits</p>
                <p className="text-xl font-bold font-mono text-success">
                  {formaterMontantCourt(analyse.totalProduits)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-content/50 uppercase">Total Charges</p>
                <p className="text-xl font-bold font-mono text-error">
                  {formaterMontantCourt(analyse.totalCharges)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-content/50 uppercase">Marge nette</p>
                <p className={`text-xl font-bold font-mono ${
                  analyse.margeNette >= 0 ? 'text-success' : 'text-error'
                }`}>
                  {analyse.margeNette.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 2 COLONNES : CHARGES / PRODUITS ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CHARGES */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-error/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4 text-error" />
                </div>
                <div>
                  <h2 className="font-bold">Charges</h2>
                  <p className="text-xs text-base-content/50">Classe 6</p>
                </div>
              </div>
              <span className="badge badge-error badge-sm font-mono">
                {analyse.charges.length} comptes
              </span>
            </div>
            <div className="p-5">
              {analyse.charges.length === 0 ? (
                <div className="text-center py-8 text-base-content/40">
                  <ArrowDownRight className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune charge enregistrée</p>
                  <p className="text-xs mt-1">Les comptes de classe 6 apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {analyse.charges.map((c, idx) => (
                    <div
                      key={c?.compte_id || idx}
                      className="flex justify-between items-center p-2 rounded hover:bg-base-200/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-error">
                          {c?.numero || '—'}
                        </p>
                        <p className="text-xs text-base-content/60 truncate">
                          {c?.libelle || '—'}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-error ml-2 flex-shrink-0">
                        {formaterMontant(Math.abs(Number(c?.solde ?? 0)))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="divider my-2"></div>
              <div className="flex justify-between items-center bg-error/10 -mx-2 px-2 py-2 rounded">
                <span className="font-bold">TOTAL CHARGES</span>
                <span className="font-mono font-bold text-error text-lg">
                  {formaterMontant(analyse.totalCharges)} GNF
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUITS */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-success/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                </div>
                <div>
                  <h2 className="font-bold">Produits</h2>
                  <p className="text-xs text-base-content/50">Classe 7</p>
                </div>
              </div>
              <span className="badge badge-success badge-sm font-mono">
                {analyse.produits.length} comptes
              </span>
            </div>
            <div className="p-5">
              {analyse.produits.length === 0 ? (
                <div className="text-center py-8 text-base-content/40">
                  <ArrowUpRight className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun produit enregistré</p>
                  <p className="text-xs mt-1">Les comptes de classe 7 apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {analyse.produits.map((p, idx) => (
                    <div
                      key={p?.compte_id || idx}
                      className="flex justify-between items-center p-2 rounded hover:bg-base-200/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-success">
                          {p?.numero || '—'}
                        </p>
                        <p className="text-xs text-base-content/60 truncate">
                          {p?.libelle || '—'}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-success ml-2 flex-shrink-0">
                        {formaterMontant(Math.abs(Number(p?.solde ?? 0)))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="divider my-2"></div>
              <div className="flex justify-between items-center bg-success/10 -mx-2 px-2 py-2 rounded">
                <span className="font-bold">TOTAL PRODUITS</span>
                <span className="font-mono font-bold text-success text-lg">
                  {formaterMontant(analyse.totalProduits)} GNF
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ============ INFO BAS DE PAGE ============ */}
      {balance.length === 0 && (
        <div className="alert alert-info mt-6">
          <Info className="w-5 h-5" />
          <div>
            <p className="font-bold">Aucune donnée comptable</p>
            <p className="text-sm">
              Le compte de résultat se remplit automatiquement dès que vous enregistrez
              et <strong>validez</strong> des écritures comptables.
              Allez dans <a href="/ecritures-comptables" className="underline font-bold">Écritures comptables</a> pour en créer.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompteResultat;