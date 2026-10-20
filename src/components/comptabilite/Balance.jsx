// components/comptabilite/Balance.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet, Loader2, AlertCircle, RefreshCw, Search,
  Filter, Download, Printer, CheckCircle, XCircle, Scale,
  TrendingUp, TrendingDown, DollarSign, FileDown, Hash,
  ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Balance = () => {
  const [balance, setBalance] = useState([]);
  const [balanceFiltree, setBalanceFiltree] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreClasse, setFiltreClasse] = useState('all');
  const [vueGroupee, setVueGroupee] = useState(false);

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
      setBalanceFiltree(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger la balance');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = balance;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(b =>
        b.numero?.toLowerCase().includes(terme) ||
        b.libelle?.toLowerCase().includes(terme)
      );
    }
    if (filtreClasse !== 'all') {
      filtre = filtre.filter(b => b.numero?.startsWith(filtreClasse));
    }
    setBalanceFiltree(filtre);
  }, [recherche, filtreClasse, balance]);

  // Grouper par classe (premier chiffre du numéro)
  const balanceGroupee = useMemo(() => {
    const groupes = {};
    balanceFiltree.forEach(b => {
      const classe = b.numero?.charAt(0) || '?';
      if (!groupes[classe]) {
        groupes[classe] = {
          classe,
          comptes: [],
          totalDebit: 0,
          totalCredit: 0,
          totalSolde: 0,
        };
      }
      groupes[classe].comptes.push(b);
      groupes[classe].totalDebit += Number(b.debit || 0);
      groupes[classe].totalCredit += Number(b.credit || 0);
      groupes[classe].totalSolde += Number(b.solde || 0);
    });
    return Object.values(groupes).sort((a, b) => a.classe.localeCompare(b.classe));
  }, [balanceFiltree]);

  // Totaux globaux
  const totaux = useMemo(() => ({
    debit: balanceFiltree.reduce((sum, b) => sum + Number(b.debit || 0), 0),
    credit: balanceFiltree.reduce((sum, b) => sum + Number(b.credit || 0), 0),
    solde: balanceFiltree.reduce((sum, b) => sum + Number(b.solde || 0), 0),
  }), [balanceFiltree]);

  const equilibree = Math.abs(totaux.debit - totaux.credit) < 0.01;

  const formaterMontant = (m) => {
    if (m === null || m === undefined || Number(m) === 0) return '0';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(Number(m));
  };

  const getClasseLabel = (classe) => {
    const labels = {
      '1': 'Classe 1 — Ressources durables',
      '2': 'Classe 2 — Actif immobilisé',
      '3': 'Classe 3 — Stocks',
      '4': 'Classe 4 — Tiers',
      '5': 'Classe 5 — Trésorerie',
      '6': 'Classe 6 — Charges',
      '7': 'Classe 7 — Produits',
      '8': 'Classe 8 — Autres',
    };
    return labels[classe] || `Classe ${classe}`;
  };

  const exporterCSV = () => {
    if (balanceFiltree.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = ['Numéro', 'Libellé', 'Débit', 'Crédit', 'Solde'];
    const lignes = balanceFiltree.map(b => [
      b.numero, b.libelle, b.debit, b.credit, b.solde
    ]);
    lignes.push([]);
    lignes.push(['TOTAUX', '', totaux.debit, totaux.credit, totaux.solde]);

    const csv = [
      headers.join(';'),
      ...lignes.map(l => l.map(v => `"${v}"`).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balance_${new Date().toISOString().slice(0, 10)}.csv`;
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
            <Scale className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Balance générale</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            Balance générale
          </h1>
          <p className="text-base-content/60 mt-1">
            {balanceFiltree.length} compte{balanceFiltree.length > 1 ? 's' : ''} mouvementé{balanceFiltree.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVueGroupee(!vueGroupee)}
            className="btn btn-ghost btn-sm gap-2"
          >
            {vueGroupee ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {vueGroupee ? 'Vue simple' : 'Vue groupée'}
          </button>
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
      <div className={`alert mb-6 ${equilibree ? 'alert-success' : 'alert-error'}`}>
        {equilibree ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        <div className="flex-1">
          <p className="font-bold">
            {equilibree ? 'Balance équilibrée ✓' : 'Balance déséquilibrée ✗'}
          </p>
          <p className="text-sm">
            Total débit : <strong>{formaterMontant(totaux.debit)} GNF</strong> •
            Total crédit : <strong>{formaterMontant(totaux.credit)} GNF</strong>
            {!equilibree && (
              <> • Écart : <strong>{formaterMontant(Math.abs(totaux.debit - totaux.credit))} GNF</strong></>
            )}
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Comptes</p>
              <p className="text-xl font-bold">{balanceFiltree.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total débit</p>
              <p className="text-sm font-bold font-mono truncate">
                {formaterMontant(totaux.debit)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total crédit</p>
              <p className="text-sm font-bold font-mono truncate">
                {formaterMontant(totaux.credit)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Solde net</p>
              <p className="text-sm font-bold font-mono truncate">
                {formaterMontant(totaux.solde)}
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
              <option value="1">Classe 1 — Ressources</option>
              <option value="2">Classe 2 — Actif</option>
              <option value="3">Classe 3 — Stocks</option>
              <option value="4">Classe 4 — Tiers</option>
              <option value="5">Classe 5 — Trésorerie</option>
              <option value="6">Classe 6 — Charges</option>
              <option value="7">Classe 7 — Produits</option>
              <option value="8">Classe 8 — Autres</option>
            </select>

            {(recherche || filtreClasse !== 'all') && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreClasse('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTENU */}
      {balanceFiltree.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Scale className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {recherche || filtreClasse !== 'all'
              ? 'Aucun compte ne correspond aux filtres'
              : 'Aucun mouvement comptable enregistré'}
          </p>
        </div>
      ) : vueGroupee ? (
        // VUE GROUPÉE PAR CLASSE
        <div className="space-y-4">
          {balanceGroupee.map(groupe => (
            <div key={groupe.classe} className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {groupe.classe}
                    </div>
                    <h3 className="font-semibold">{getClasseLabel(groupe.classe)}</h3>
                    <span className="badge badge-ghost badge-sm">
                      {groupe.comptes.length} compte{groupe.comptes.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="text-right">
                      <p className="text-base-content/50">Débit</p>
                      <p className="font-mono font-bold">{formaterMontant(groupe.totalDebit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base-content/50">Crédit</p>
                      <p className="font-mono font-bold">{formaterMontant(groupe.totalCredit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base-content/50">Solde</p>
                      <p className={`font-mono font-bold ${
                        groupe.totalSolde >= 0 ? 'text-success' : 'text-error'
                      }`}>
                        {formaterMontant(groupe.totalSolde)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="border-b border-base-200">
                        <th className="text-xs text-base-content/50">Numéro</th>
                        <th className="text-xs text-base-content/50">Libellé</th>
                        <th className="text-xs text-base-content/50 text-right">Débit</th>
                        <th className="text-xs text-base-content/50 text-right">Crédit</th>
                        <th className="text-xs text-base-content/50 text-right">Solde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupe.comptes.map(b => (
                        <tr key={b.compte_id} className="hover:bg-base-200/30">
                          <td>
                            <span className="font-mono text-sm font-bold text-primary">
                              {b.numero}
                            </span>
                          </td>
                          <td>
                            <p className="text-sm truncate max-w-md">{b.libelle}</p>
                          </td>
                          <td className="text-right">
                            <span className="font-mono text-sm">
                              {formaterMontant(b.debit)}
                            </span>
                          </td>
                          <td className="text-right">
                            <span className="font-mono text-sm">
                              {formaterMontant(b.credit)}
                            </span>
                          </td>
                          <td className="text-right">
                            <span className={`font-mono text-sm font-bold ${
                              b.solde > 0 ? 'text-success' : b.solde < 0 ? 'text-error' : ''
                            }`}>
                              {formaterMontant(b.solde)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // VUE SIMPLE
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Numéro</th>
                <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Libellé</th>
                <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Débit</th>
                <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Crédit</th>
                <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Solde</th>
              </tr>
            </thead>
            <tbody>
              {balanceFiltree.map(b => (
                <tr key={b.compte_id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                  <td>
                    <span className="font-mono text-sm font-bold text-primary">
                      {b.numero}
                    </span>
                  </td>
                  <td>
                    <p className="text-sm truncate max-w-md">{b.libelle}</p>
                  </td>
                  <td className="text-right">
                    <span className="font-mono text-sm">
                      {formaterMontant(b.debit)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="font-mono text-sm">
                      {formaterMontant(b.credit)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`font-mono text-sm font-bold ${
                      b.solde > 0 ? 'text-success' : b.solde < 0 ? 'text-error' : ''
                    }`}>
                      {formaterMontant(b.solde)}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Ligne de totaux */}
              <tr className="bg-base-200/70 border-t-2 border-base-300 font-bold">
                <td colSpan="2" className="text-right">TOTAUX</td>
                <td className="text-right">
                  <span className="font-mono text-sm">
                    {formaterMontant(totaux.debit)}
                  </span>
                </td>
                <td className="text-right">
                  <span className="font-mono text-sm">
                    {formaterMontant(totaux.credit)}
                  </span>
                </td>
                <td className="text-right">
                  <span className={`font-mono text-sm ${
                    totaux.solde > 0 ? 'text-success' : totaux.solde < 0 ? 'text-error' : ''
                  }`}>
                    {formaterMontant(totaux.solde)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default Balance;