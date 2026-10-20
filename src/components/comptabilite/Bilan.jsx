// components/comptabilite/Bilan.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale, Loader2, AlertCircle, RefreshCw, Printer, FileDown,
  Building2, Landmark, TrendingUp, TrendingDown, CheckCircle,
  XCircle, Info, DollarSign
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Bilan = () => {
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
      const data = res.data?.results || res.data || [];
      setBalance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger le bilan');
    } finally {
      setChargement(false);
    }
  };

  const formaterMontant = (m) => {
    const num = Number(m ?? 0);
    if (num === 0) return '0';
    return new Intl.NumberFormat('fr-FR').format(Math.abs(num));
  };

  const formaterMontantCourt = (m) => {
    const num = Math.abs(Number(m || 0));
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' Md';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + ' M';
    if (num >= 1000) return (num / 1000).toFixed(0) + ' k';
    return num.toString();
  };

  // Analyse du bilan
  const analyse = useMemo(() => {
    const safeBalance = Array.isArray(balance) ? balance : [];

    // ===== ACTIF =====
    // Classe 2 = Actif immobilisé
    const actifImmobilise = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      return num.startsWith('2');
    });

    // Classe 3 = Stocks
    const stocks = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      return num.startsWith('3');
    });

    // Classe 4 (créances clients = débit) + Classe 5 (trésorerie = débit)
    const creances = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      const solde = Number(b?.solde || 0);
      return num.startsWith('41') && solde > 0;
    });

    const tresorerieActif = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      const solde = Number(b?.solde || 0);
      return num.startsWith('5') && solde > 0;
    });

    const totalActifImmobilise = actifImmobilise.reduce((sum, a) => sum + Math.abs(Number(a?.solde || 0)), 0);
    const totalStocks = stocks.reduce((sum, a) => sum + Math.abs(Number(a?.solde || 0)), 0);
    const totalCreances = creances.reduce((sum, a) => sum + Math.abs(Number(a?.solde || 0)), 0);
    const totalTresorerieActif = tresorerieActif.reduce((sum, a) => sum + Math.abs(Number(a?.solde || 0)), 0);

    const totalActif = totalActifImmobilise + totalStocks + totalCreances + totalTresorerieActif;

    // ===== PASSIF =====
    // Classe 1 = Capitaux propres
    const capitauxPropres = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      return num.startsWith('1');
    });

    // Classe 4 (dettes fournisseurs = crédit) + Classe 4 (dettes fiscales)
    const dettes = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      const solde = Number(b?.solde || 0);
      return num.startsWith('4') && solde < 0 && !num.startsWith('41');
    });

    // Classe 5 (trésorerie négative = découvert)
    const tresoreriePassif = safeBalance.filter(b => {
      const num = String(b?.numero || '');
      const solde = Number(b?.solde || 0);
      return num.startsWith('5') && solde < 0;
    });

    // Produits (Classe 7) et Charges (Classe 6)
    const produits = safeBalance.filter(b => String(b?.numero || '').startsWith('7'));
    const charges = safeBalance.filter(b => String(b?.numero || '').startsWith('6'));

    const totalProduits = produits.reduce((sum, p) => sum + Math.abs(Number(p?.solde || 0)), 0);
    const totalCharges = charges.reduce((sum, c) => sum + Math.abs(Number(c?.solde || 0)), 0);
    const resultat = totalProduits - totalCharges;

    const totalCapitauxPropres = capitauxPropres.reduce((sum, a) => sum + Math.abs(Number(a?.solde || 0)), 0);
    const totalDettes = dettes.reduce((sum, a) => sum + Math.abs(Number(a?.solde || 0)), 0);
    const totalTresoreriePassif = tresoreriePassif.reduce((sum, a) => sum + Math.abs(Number(a?.solde || 0)), 0);

    const totalPassif = totalCapitauxPropres + resultat + totalDettes + totalTresoreriePassif;

    return {
      actifImmobilise,
      stocks,
      creances,
      tresorerieActif,
      totalActifImmobilise,
      totalStocks,
      totalCreances,
      totalTresorerieActif,
      totalActif,

      capitauxPropres,
      dettes,
      tresoreriePassif,
      totalCapitauxPropres,
      totalDettes,
      totalTresoreriePassif,
      resultat,
      totalPassif,

      equilibre: Math.abs(totalActif - totalPassif) < 1,
    };
  }, [balance]);

  const exporterCSV = () => {
    const lignes = [
      ['BILAN COMPTABLE', new Date().toLocaleDateString('fr-FR')],
      [],
      ['ACTIF', 'Montant'],
      ['Immobilisations', analyse.totalActifImmobilise],
      ['Stocks', analyse.totalStocks],
      ['Créances clients', analyse.totalCreances],
      ['Trésorerie', analyse.totalTresorerieActif],
      ['TOTAL ACTIF', analyse.totalActif],
      [],
      ['PASSIF', 'Montant'],
      ['Capitaux propres', analyse.totalCapitauxPropres],
      ['Résultat de l\'exercice', analyse.resultat],
      ['Dettes', analyse.totalDettes],
      ['Trésorerie passif', analyse.totalTresoreriePassif],
      ['TOTAL PASSIF', analyse.totalPassif],
    ];

    const csv = lignes.map(l => l.map(v => `"${v}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bilan_${new Date().toISOString().slice(0, 10)}.csv`;
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
      <div className="text-center py-20 w-full px-6">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70 mb-4">{erreur}</p>
        <button onClick={chargerBalance} className="btn btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Scale className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Bilan</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            Bilan comptable
          </h1>
          <p className="text-base-content/60 mt-1">
            Exercice {new Date().getFullYear()} • Actif et Passif
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

      {/* ALERTE ÉQUILIBRE */}
      <div className={`alert mb-6 ${analyse.equilibre ? 'alert-success' : 'alert-warning'}`}>
        {analyse.equilibre ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <div className="flex-1">
          <p className="font-bold">
            {analyse.equilibre ? 'Bilan équilibré ✓' : 'Bilan déséquilibré'}
          </p>
          <p className="text-sm">
            Total Actif : <strong>{formaterMontant(analyse.totalActif)} GNF</strong> •
            Total Passif : <strong>{formaterMontant(analyse.totalPassif)} GNF</strong>
            {!analyse.equilibre && (
              <> • Écart : <strong className="text-error">{formaterMontant(analyse.totalActif - analyse.totalPassif)} GNF</strong></>
            )}
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase mb-1">Actif immobilisé</p>
            <p className="text-lg font-bold font-mono text-info truncate">
              {formaterMontantCourt(analyse.totalActifImmobilise)}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase mb-1">Capitaux propres</p>
            <p className="text-lg font-bold font-mono text-primary truncate">
              {formaterMontantCourt(analyse.totalCapitauxPropres)}
            </p>
          </div>
        </div>

        <div className={`card shadow-sm border ${
          analyse.resultat >= 0
            ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/20'
            : 'bg-gradient-to-br from-error/10 to-error/5 border-error/20'
        }`}>
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase mb-1">Résultat</p>
            <p className={`text-lg font-bold font-mono truncate ${
              analyse.resultat >= 0 ? 'text-success' : 'text-error'
            }`}>
              {analyse.resultat >= 0 ? '+' : '-'}{formaterMontantCourt(analyse.resultat)}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 uppercase mb-1">Dettes</p>
            <p className="text-lg font-bold font-mono text-warning truncate">
              {formaterMontantCourt(analyse.totalDettes)}
            </p>
          </div>
        </div>
      </div>

      {/* 2 COLONNES ACTIF / PASSIF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ACTIF */}
        <div className="card bg-base-100 shadow-sm border-2 border-info/30">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-info/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-info" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">ACTIF</h2>
                  <p className="text-xs text-base-content/50">Ce que possède l'entreprise</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">

              {/* Immobilisations */}
              <div>
                <div className="flex justify-between items-center p-2 bg-info/5 rounded-lg mb-1">
                  <span className="font-semibold text-sm">Immobilisations (Classe 2)</span>
                  <span className="font-mono font-bold">{formaterMontant(analyse.totalActifImmobilise)}</span>
                </div>
                {analyse.actifImmobilise.map(a => (
                  <div key={a.compte_id} className="flex justify-between text-xs pl-4 py-1">
                    <span className="truncate max-w-[200px] text-base-content/60">
                      {a.numero} — {a.libelle}
                    </span>
                    <span className="font-mono">{formaterMontant(a.solde)}</span>
                  </div>
                ))}
              </div>

              <div className="divider my-1"></div>

              {/* Stocks */}
              <div>
                <div className="flex justify-between items-center p-2 bg-info/5 rounded-lg mb-1">
                  <span className="font-semibold text-sm">Stocks (Classe 3)</span>
                  <span className="font-mono font-bold">{formaterMontant(analyse.totalStocks)}</span>
                </div>
                {analyse.stocks.map(a => (
                  <div key={a.compte_id} className="flex justify-between text-xs pl-4 py-1">
                    <span className="truncate max-w-[200px] text-base-content/60">
                      {a.numero} — {a.libelle}
                    </span>
                    <span className="font-mono">{formaterMontant(a.solde)}</span>
                  </div>
                ))}
              </div>

              <div className="divider my-1"></div>

              {/* Créances clients */}
              <div>
                <div className="flex justify-between items-center p-2 bg-info/5 rounded-lg mb-1">
                  <span className="font-semibold text-sm">Créances clients (Classe 41)</span>
                  <span className="font-mono font-bold">{formaterMontant(analyse.totalCreances)}</span>
                </div>
                {analyse.creances.map(a => (
                  <div key={a.compte_id} className="flex justify-between text-xs pl-4 py-1">
                    <span className="truncate max-w-[200px] text-base-content/60">
                      {a.numero} — {a.libelle}
                    </span>
                    <span className="font-mono">{formaterMontant(a.solde)}</span>
                  </div>
                ))}
              </div>

              <div className="divider my-1"></div>

              {/* Trésorerie */}
              <div>
                <div className="flex justify-between items-center p-2 bg-info/5 rounded-lg mb-1">
                  <span className="font-semibold text-sm">Trésorerie (Classe 5)</span>
                  <span className="font-mono font-bold">{formaterMontant(analyse.totalTresorerieActif)}</span>
                </div>
                {analyse.tresorerieActif.map(a => (
                  <div key={a.compte_id} className="flex justify-between text-xs pl-4 py-1">
                    <span className="truncate max-w-[200px] text-base-content/60">
                      {a.numero} — {a.libelle}
                    </span>
                    <span className="font-mono">{formaterMontant(a.solde)}</span>
                  </div>
                ))}
              </div>

              {/* TOTAL ACTIF */}
              <div className="divider my-2"></div>
              <div className="flex justify-between items-center bg-info/20 -mx-2 px-4 py-3 rounded-lg">
                <span className="font-bold text-lg">TOTAL ACTIF</span>
                <span className="font-mono font-bold text-info text-xl">
                  {formaterMontant(analyse.totalActif)} GNF
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PASSIF */}
        <div className="card bg-base-100 shadow-sm border-2 border-warning/30">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-warning/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">PASSIF</h2>
                  <p className="text-xs text-base-content/50">Ce que doit l'entreprise</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">

              {/* Capitaux propres */}
              <div>
                <div className="flex justify-between items-center p-2 bg-warning/5 rounded-lg mb-1">
                  <span className="font-semibold text-sm">Capitaux propres (Classe 1)</span>
                  <span className="font-mono font-bold">{formaterMontant(analyse.totalCapitauxPropres)}</span>
                </div>
                {analyse.capitauxPropres.map(a => (
                  <div key={a.compte_id} className="flex justify-between text-xs pl-4 py-1">
                    <span className="truncate max-w-[200px] text-base-content/60">
                      {a.numero} — {a.libelle}
                    </span>
                    <span className="font-mono">{formaterMontant(a.solde)}</span>
                  </div>
                ))}
              </div>

              <div className="divider my-1"></div>

              {/* Résultat */}
              <div>
                <div className={`flex justify-between items-center p-2 rounded-lg mb-1 ${
                  analyse.resultat >= 0 ? 'bg-success/10' : 'bg-error/10'
                }`}>
                  <span className="font-semibold text-sm flex items-center gap-1">
                    {analyse.resultat >= 0 ? (
                      <><TrendingUp className="w-3 h-3 text-success" /> Résultat (bénéfice)</>
                    ) : (
                      <><TrendingDown className="w-3 h-3 text-error" /> Résultat (perte)</>
                    )}
                  </span>
                  <span className={`font-mono font-bold ${
                    analyse.resultat >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    {analyse.resultat >= 0 ? '+' : ''}{formaterMontant(analyse.resultat)}
                  </span>
                </div>
              </div>

              <div className="divider my-1"></div>

              {/* Dettes */}
              <div>
                <div className="flex justify-between items-center p-2 bg-warning/5 rounded-lg mb-1">
                  <span className="font-semibold text-sm">Dettes (Classe 4)</span>
                  <span className="font-mono font-bold">{formaterMontant(analyse.totalDettes)}</span>
                </div>
                {analyse.dettes.map(a => (
                  <div key={a.compte_id} className="flex justify-between text-xs pl-4 py-1">
                    <span className="truncate max-w-[200px] text-base-content/60">
                      {a.numero} — {a.libelle}
                    </span>
                    <span className="font-mono">{formaterMontant(a.solde)}</span>
                  </div>
                ))}
              </div>

              <div className="divider my-1"></div>

              {/* Trésorerie passif */}
              <div>
                <div className="flex justify-between items-center p-2 bg-warning/5 rounded-lg mb-1">
                  <span className="font-semibold text-sm">Découverts (Classe 5)</span>
                  <span className="font-mono font-bold">{formaterMontant(analyse.totalTresoreriePassif)}</span>
                </div>
                {analyse.tresoreriePassif.map(a => (
                  <div key={a.compte_id} className="flex justify-between text-xs pl-4 py-1">
                    <span className="truncate max-w-[200px] text-base-content/60">
                      {a.numero} — {a.libelle}
                    </span>
                    <span className="font-mono">{formaterMontant(a.solde)}</span>
                  </div>
                ))}
              </div>

              {/* TOTAL PASSIF */}
              <div className="divider my-2"></div>
              <div className="flex justify-between items-center bg-warning/20 -mx-2 px-4 py-3 rounded-lg">
                <span className="font-bold text-lg">TOTAL PASSIF</span>
                <span className="font-mono font-bold text-warning text-xl">
                  {formaterMontant(analyse.totalPassif)} GNF
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* INFO */}
      <div className="alert alert-info mt-6">
        <Info className="w-5 h-5" />
        <div>
          <p className="font-bold">Équilibre du bilan</p>
          <p className="text-sm">
            Le bilan est <strong>équilibré</strong> quand Total Actif = Total Passif.
            Le résultat (bénéfice ou perte) apparaît dans le passif comme composante des capitaux propres.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Bilan;