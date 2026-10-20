// components/comptabilite/GrandLivre.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Loader2, AlertCircle, RefreshCw, Search,
  Filter, Download, Printer, CheckCircle, XCircle, Scale,
  TrendingUp, TrendingDown, DollarSign, FileDown, Hash,
  ChevronLeft, ChevronRight, Calendar, User, Eye,
  Layers, FileText, Activity
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const GrandLivre = () => {
  const [comptes, setComptes] = useState([]);
  const [comptesFiltres, setComptesFiltres] = useState([]);
  const [compteSelectionne, setCompteSelectionne] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [chargementLignes, setChargementLignes] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    chargerComptes();
  }, []);

  const chargerComptes = async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Charger les comptes avec solde (via balance)
      const res = await AxiosInstance.get('/ecritures-comptables/balance/');
      const data = res.data.results || res.data || [];
      setComptes(data);
      setComptesFiltres(data);

      // Auto-sélectionner le premier compte
      if (data.length > 0) {
        setCompteSelectionne(data[0]);
        await chargerLignesCompte(data[0].compte_id);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger le grand livre');
    } finally {
      setChargement(false);
    }
  };

  const chargerLignesCompte = async (compteId) => {
    setChargementLignes(true);
    try {
      const res = await AxiosInstance.get(`/ecritures-comptables/grand_livre/?compte=${compteId}`);
      const data = res.data.results || res.data || [];
      setLignes(data);
    } catch (err) {
      console.error('Erreur chargement lignes:', err);
      setLignes([]);
    } finally {
      setChargementLignes(false);
    }
  };

  const selectionnerCompte = async (compte) => {
    setCompteSelectionne(compte);
    await chargerLignesCompte(compte.compte_id);
  };

  useEffect(() => {
    if (recherche) {
      const terme = recherche.toLowerCase();
      const filtre = comptes.filter(c =>
        c.numero?.toLowerCase().includes(terme) ||
        c.libelle?.toLowerCase().includes(terme)
      );
      setComptesFiltres(filtre);
    } else {
      setComptesFiltres(comptes);
    }
  }, [recherche, comptes]);

  const formaterMontant = (m) => {
    if (m === null || m === undefined || Number(m) === 0) return '0';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(Number(m));
  };

  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  // Cumul progressif
  const lignesAvecCumul = useMemo(() => {
    let cumul = 0;
    return lignes.map(l => {
      cumul += Number(l.debit || 0) - Number(l.credit || 0);
      return { ...l, cumul };
    });
  }, [lignes]);

  // Totaux
  const totaux = useMemo(() => ({
    debit: lignes.reduce((sum, l) => sum + Number(l.debit || 0), 0),
    credit: lignes.reduce((sum, l) => sum + Number(l.credit || 0), 0),
    solde: lignes.reduce((sum, l) => sum + Number(l.debit || 0) - Number(l.credit || 0), 0),
  }), [lignes]);

  const exporterCSV = () => {
    if (!compteSelectionne || lignes.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = ['Date', 'Journal', 'N° écriture', 'Libellé', 'Débit', 'Crédit', 'Cumul'];
    const lignesCSV = lignesAvecCumul.map(l => [
      l.ecriture?.date_ecriture || '',
      l.journal_code || '',
      l.ecriture?.numero || '',
      l.libelle || l.ecriture?.libelle || '',
      l.debit,
      l.credit,
      l.cumul,
    ]);

    const csv = [
      [`Grand Livre — ${compteSelectionne.numero} ${compteSelectionne.libelle}`],
      [],
      headers.join(';'),
      ...lignesCSV.map(l => l.map(v => `"${v}"`).join(';')),
      [],
      ['TOTAUX', '', '', '', totaux.debit, totaux.credit, totaux.solde],
    ].map(row => Array.isArray(row) ? row.join(';') : row).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grand_livre_${compteSelectionne.numero}_${new Date().toISOString().slice(0, 10)}.csv`;
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
        <button onClick={chargerComptes} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <BookOpen className="w-3 h-3" />
            Comptabilité
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Grand livre</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Grand livre
          </h1>
          <p className="text-base-content/60 mt-1">
            {comptes.length} compte{comptes.length > 1 ? 's' : ''} mouvementé{comptes.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerComptes} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button
            onClick={exporterCSV}
            className="btn btn-outline btn-sm gap-2"
            disabled={!compteSelectionne || lignes.length === 0}
          >
            <FileDown className="w-4 h-4" /> Exporter CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-primary btn-sm gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* SIDEBAR : LISTE DES COMPTES */}
        <div className="lg:col-span-1 card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Comptes</h2>
            </div>

            <div className="p-3 border-b bg-base-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="input input-bordered input-sm w-full pl-9"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {comptesFiltres.length === 0 ? (
                <div className="p-5 text-center text-base-content/40 text-xs">
                  <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Aucun compte trouvé</p>
                </div>
              ) : (
                comptesFiltres.map(c => {
                  const isSelected = compteSelectionne?.compte_id === c.compte_id;
                  return (
                    <button
                      key={c.compte_id}
                      onClick={() => selectionnerCompte(c)}
                      className={`w-full text-left px-3 py-2.5 border-l-4 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent hover:bg-base-200/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-mono text-sm font-bold ${
                          isSelected ? 'text-primary' : 'text-base-content'
                        }`}>
                          {c.numero}
                        </span>
                        <span className={`text-xs font-mono font-bold ${
                          c.solde > 0 ? 'text-success' : c.solde < 0 ? 'text-error' : 'text-base-content/50'
                        }`}>
                          {formaterMontant(c.solde)}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/60 truncate">
                        {c.libelle}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* CONTENU : GRAND LIVRE DU COMPTE SÉLECTIONNÉ */}
        <div className="lg:col-span-3 space-y-6">

          {!compteSelectionne ? (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body text-center py-12">
                <Scale className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                <p className="text-lg text-base-content/60">
                  Sélectionnez un compte pour voir son grand livre
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* En-tête compte sélectionné */}
              <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-base-content/50">
                          Compte {compteSelectionne.numero}
                        </p>
                        <h2 className="text-xl font-bold">{compteSelectionne.libelle}</h2>
                      </div>
                    </div>

                    <div className="flex gap-4 text-right">
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Débit</p>
                        <p className="font-mono font-bold text-info">
                          {formaterMontant(totaux.debit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Crédit</p>
                        <p className="font-mono font-bold text-warning">
                          {formaterMontant(totaux.credit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Solde</p>
                        <p className={`font-mono font-bold text-lg ${
                          totaux.solde > 0 ? 'text-success' : totaux.solde < 0 ? 'text-error' : ''
                        }`}>
                          {formaterMontant(totaux.solde)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tableau des lignes */}
              {chargementLignes ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : lignes.length === 0 ? (
                <div className="card bg-base-100 shadow-sm border border-base-300">
                  <div className="card-body text-center py-12">
                    <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                    <p className="text-lg text-base-content/60">
                      Aucun mouvement sur ce compte
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-base-200/50 border-b border-base-300">
                        <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Date</th>
                        <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Journal</th>
                        <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">N° écriture</th>
                        <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Libellé</th>
                        <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Débit</th>
                        <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Crédit</th>
                        <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Cumul</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignesAvecCumul.map((l, idx) => (
                        <tr key={l.id || idx} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                          <td>
                            <p className="text-xs font-mono">
                              {formaterDate(l.ecriture?.date_ecriture)}
                            </p>
                          </td>
                          <td>
                            <span className="badge badge-ghost badge-sm font-mono">
                              {l.journal_code || '—'}
                            </span>
                          </td>
                          <td>
                            <p className="text-xs font-mono text-primary">
                              {l.ecriture?.numero || '—'}
                            </p>
                          </td>
                          <td>
                            <p className="text-sm truncate max-w-md">
                              {l.libelle || l.ecriture?.libelle || '—'}
                            </p>
                          </td>
                          <td className="text-right">
                            {Number(l.debit) > 0 ? (
                              <span className="font-mono text-sm font-bold text-info">
                                {formaterMontant(l.debit)}
                              </span>
                            ) : (
                              <span className="text-base-content/30 text-xs">—</span>
                            )}
                          </td>
                          <td className="text-right">
                            {Number(l.credit) > 0 ? (
                              <span className="font-mono text-sm font-bold text-warning">
                                {formaterMontant(l.credit)}
                              </span>
                            ) : (
                              <span className="text-base-content/30 text-xs">—</span>
                            )}
                          </td>
                          <td className="text-right">
                            <span className={`font-mono text-sm font-bold ${
                              l.cumul > 0 ? 'text-success' : l.cumul < 0 ? 'text-error' : 'text-base-content/50'
                            }`}>
                              {formaterMontant(l.cumul)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Ligne totaux */}
                      <tr className="bg-base-200/70 border-t-2 border-base-300 font-bold">
                        <td colSpan="4" className="text-right">TOTAUX</td>
                        <td className="text-right">
                          <span className="font-mono text-sm text-info">
                            {formaterMontant(totaux.debit)}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="font-mono text-sm text-warning">
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
            </>
          )}

        </div>
      </div>

    </div>
  );
};

export default GrandLivre;