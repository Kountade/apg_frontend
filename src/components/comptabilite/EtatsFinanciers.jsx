// components/comptabilite/EtatsFinanciers.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet, Loader2, AlertCircle, RefreshCw, Printer,
  FileDown, ArrowUpRight, ArrowDownRight, CheckCircle,
  TrendingUp, TrendingDown, Scale, Building2, Landmark,
  DollarSign, Info
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const EtatsFinanciers = () => {
  const [balance, setBalance] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [ongletActif, setOngletActif] = useState('bilan');

  useEffect(() => {
    chargerBalance();
  }, []);

  const chargerBalance = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/ecritures-comptables/balance/');
      const data = res.data.results || res.data || [];
      setBalance(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les états financiers');
    } finally {
      setChargement(false);
    }
  };

  const formaterMontant = (m) => {
    if (m === null || m === undefined) return '0';
    return new Intl.NumberFormat('fr-FR').format(Number(m));
  };

  // Analyse des données
  const analyse = useMemo(() => {
    // ACTIF : Classes 2 (immobilisé), 3 (stocks), 5 (trésorerie - actif)
    const actif = balance.filter(b => {
      const classe = b.numero?.charAt(0);
      if (classe === '2' || classe === '3') return true;
      if (classe === '5' && Number(b.solde) > 0) return true;
      return false;
    });

    // PASSIF : Classe 1 (capitaux propres), 4 (dettes), 5 (trésorerie - passif si négatif)
    const passif = balance.filter(b => {
      const classe = b.numero?.charAt(0);
      if (classe === '1') return true;
      if (classe === '4' && Number(b.solde) < 0) return true;
      if (classe === '5' && Number(b.solde) < 0) return true;
      return false;
    });

    // CHARGES : Classe 6
    const charges = balance.filter(b => b.numero?.startsWith('6'));

    // PRODUITS : Classe 7
    const produits = balance.filter(b => b.numero?.startsWith('7'));

    const totalActif = actif.reduce((sum, a) => sum + Math.abs(Number(a.solde || 0)), 0);
    const totalPassif = passif.reduce((sum, p) => sum + Math.abs(Number(p.solde || 0)), 0);
    const totalCharges = charges.reduce((sum, c) => sum + Math.abs(Number(c.solde || 0)), 0);
    const totalProduits = produits.reduce((sum, p) => sum + Math.abs(Number(p.solde || 0)), 0);
    const resultat = totalProduits - totalCharges;

    return {
      actif,
      passif,
      charges,
      produits,
      totalActif,
      totalPassif,
      totalCharges,
      totalProduits,
      resultat,
      estBenefice: resultat >= 0,
      // Résultat + capitaux propres = passif total
      totalPassifAvecResultat: totalPassif + resultat,
    };
  }, [balance]);

  const exporterCSV = () => {
    const lignes = [
      ['ÉTATS FINANCIERS', new Date().toLocaleDateString('fr-FR')],
      [],
      ['BILAN ACTIF', ''],
      ['Numéro', 'Libellé', 'Montant'],
      ...analyse.actif.map(a => [a.numero, a.libelle, Math.abs(a.solde)]),
      ['', 'TOTAL ACTIF', analyse.totalActif],
      [],
      ['BILAN PASSIF', ''],
      ['Numéro', 'Libellé', 'Montant'],
      ...analyse.passif.map(p => [p.numero, p.libelle, Math.abs(p.solde)]),
      ['', 'RÉSULTAT', analyse.resultat],
      ['', 'TOTAL PASSIF', analyse.totalPassifAvecResultat],
      [],
      ['COMPTE DE RÉSULTAT', ''],
      ['CHARGES', ''],
      ...analyse.charges.map(c => [c.numero, c.libelle, Math.abs(c.solde)]),
      ['', 'TOTAL CHARGES', analyse.totalCharges],
      ['PRODUITS', ''],
      ...analyse.produits.map(p => [p.numero, p.libelle, Math.abs(p.solde)]),
      ['', 'TOTAL PRODUITS', analyse.totalProduits],
      ['', 'RÉSULTAT NET', analyse.resultat],
    ];

    const csv = lignes.map(l => l.map(v => `"${v}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etats_financiers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <button onClick={chargerBalance} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <FileSpreadsheet className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">États financiers</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            États financiers
          </h1>
          <p className="text-base-content/60 mt-1">
            Bilan + Compte de résultat • Exercice {new Date().getFullYear()}
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

      {/* ONGLETS */}
      <div className="tabs tabs-boxed mb-6 inline-flex">
        <button
          className={`tab ${ongletActif === 'bilan' ? 'tab-active' : ''}`}
          onClick={() => setOngletActif('bilan')}
        >
          <Scale className="w-4 h-4 mr-2" />
          Bilan
        </button>
        <button
          className={`tab ${ongletActif === 'resultat' ? 'tab-active' : ''}`}
          onClick={() => setOngletActif('resultat')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Compte de résultat
        </button>
      </div>

      {/* CONTENU */}
      {ongletActif === 'bilan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ACTIF */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-info/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-info" />
                  <div>
                    <h2 className="font-bold">ACTIF</h2>
                    <p className="text-xs text-base-content/50">Immobilisations + Stocks + Trésorerie</p>
                  </div>
                </div>
                <span className="badge badge-info badge-sm">
                  {analyse.actif.length} comptes
                </span>
              </div>
              <div className="p-5">
                {analyse.actif.length === 0 ? (
                  <div className="text-center py-8 text-base-content/40">
                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun compte d'actif mouvementé</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {analyse.actif.map(a => (
                      <div key={a.compte_id} className="flex justify-between items-center p-2 rounded hover:bg-base-200/30">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-bold text-info">{a.numero}</p>
                          <p className="text-xs text-base-content/60 truncate">{a.libelle}</p>
                        </div>
                        <span className="font-mono text-sm font-bold ml-2 flex-shrink-0">
                          {formaterMontant(Math.abs(a.solde))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="divider my-2"></div>
                <div className="flex justify-between items-center bg-info/10 -mx-2 px-2 py-2 rounded">
                  <span className="font-bold">TOTAL ACTIF</span>
                  <span className="font-mono font-bold text-info text-lg">
                    {formaterMontant(analyse.totalActif)} GNF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PASSIF */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-warning/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-warning" />
                  <div>
                    <h2 className="font-bold">PASSIF</h2>
                    <p className="text-xs text-base-content/50">Capitaux propres + Dettes</p>
                  </div>
                </div>
                <span className="badge badge-warning badge-sm">
                  {analyse.passif.length} comptes
                </span>
              </div>
              <div className="p-5">
                {analyse.passif.length === 0 ? (
                  <div className="text-center py-8 text-base-content/40">
                    <Landmark className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun compte de passif mouvementé</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {analyse.passif.map(p => (
                      <div key={p.compte_id} className="flex justify-between items-center p-2 rounded hover:bg-base-200/30">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-bold text-warning">{p.numero}</p>
                          <p className="text-xs text-base-content/60 truncate">{p.libelle}</p>
                        </div>
                        <span className="font-mono text-sm font-bold ml-2 flex-shrink-0">
                          {formaterMontant(Math.abs(p.solde))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Résultat de l'exercice */}
                <div className="divider my-2"></div>
                <div className={`flex justify-between items-center p-2 rounded ${
                  analyse.estBenefice ? 'bg-success/10' : 'bg-error/10'
                }`}>
                  <span className="font-bold">
                    {analyse.estBenefice ? 'Bénéfice' : 'Perte'} de l'exercice
                  </span>
                  <span className={`font-mono font-bold ${
                    analyse.estBenefice ? 'text-success' : 'text-error'
                  }`}>
                    {analyse.estBenefice ? '+' : ''}{formaterMontant(analyse.resultat)}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-warning/10 -mx-2 px-2 py-2 rounded mt-2">
                  <span className="font-bold">TOTAL PASSIF</span>
                  <span className="font-mono font-bold text-warning text-lg">
                    {formaterMontant(analyse.totalPassifAvecResultat)} GNF
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {ongletActif === 'resultat' && (
        <div className="space-y-6">

          {/* BANDEAU RÉSULTAT */}
          <div className={`card shadow-sm border-2 ${
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
                    <p className="text-xs text-base-content/50 uppercase">Résultat net</p>
                    <p className={`text-4xl font-bold font-mono mt-1 ${
                      analyse.estBenefice ? 'text-success' : 'text-error'
                    }`}>
                      {analyse.estBenefice ? '+' : ''}{formaterMontant(analyse.resultat)} GNF
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-base-content/50 uppercase">Produits</p>
                    <p className="text-xl font-bold font-mono text-success">
                      {formaterMontant(analyse.totalProduits)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-base-content/50 uppercase">Charges</p>
                    <p className="text-xl font-bold font-mono text-error">
                      {formaterMontant(analyse.totalCharges)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2 COLONNES CHARGES / PRODUITS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-error/5 flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-error" />
                <h3 className="font-bold">Charges (Classe 6)</h3>
              </div>
              <div className="p-5">
                {analyse.charges.length === 0 ? (
                  <p className="text-center py-6 text-base-content/40 text-sm">Aucune charge</p>
                ) : (
                  <div className="space-y-2">
                    {analyse.charges.map(c => (
                      <div key={c.compte_id} className="flex justify-between items-center p-2 rounded hover:bg-base-200/30">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-bold text-error">{c.numero}</p>
                          <p className="text-xs text-base-content/60 truncate">{c.libelle}</p>
                        </div>
                        <span className="font-mono text-sm font-bold text-error ml-2">
                          {formaterMontant(Math.abs(c.solde))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-success/5 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-success" />
                <h3 className="font-bold">Produits (Classe 7)</h3>
              </div>
              <div className="p-5">
                {analyse.produits.length === 0 ? (
                  <p className="text-center py-6 text-base-content/40 text-sm">Aucun produit</p>
                ) : (
                  <div className="space-y-2">
                    {analyse.produits.map(p => (
                      <div key={p.compte_id} className="flex justify-between items-center p-2 rounded hover:bg-base-200/30">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-bold text-success">{p.numero}</p>
                          <p className="text-xs text-base-content/60 truncate">{p.libelle}</p>
                        </div>
                        <span className="font-mono text-sm font-bold text-success ml-2">
                          {formaterMontant(Math.abs(p.solde))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EtatsFinanciers;