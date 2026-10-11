// components/tresorerie/EtatCaisse.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList, Loader2, AlertCircle, RefreshCw,
  Calculator, Calendar, Printer, Download, TrendingUp,
  TrendingDown, Coins, Banknote, ArrowDownRight,
  ArrowUpRight, FileText, Filter, CheckCircle,
  AlertTriangle, Info, Wallet
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const EtatCaisse = () => {
  const navigate = useNavigate();
  const [caisses, setCaisses] = useState([]);
  const [caisseSelectionnee, setCaisseSelectionnee] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [chargementMouvements, setChargementMouvements] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Filtres période
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    chargerCaisses();
  }, []);

  useEffect(() => {
    if (caisseSelectionnee) {
      chargerMouvements();
    }
  }, [caisseSelectionnee, dateDebut, dateFin]);

  const chargerCaisses = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/caisses/');
      const data = res.data.results || res.data || [];
      setCaisses(data);

      // Sélectionner la première caisse par défaut
      if (data.length > 0) {
        setCaisseSelectionnee(data[0]);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les caisses');
    } finally {
      setChargement(false);
    }
  };

  const chargerMouvements = async () => {
    if (!caisseSelectionnee) return;
    setChargementMouvements(true);
    try {
      let url = `/mouvements-caisse/?caisse=${caisseSelectionnee.id}`;
      if (dateDebut) url += `&date_mouvement__gte=${dateDebut}`;
      if (dateFin) url += `&date_mouvement__lte=${dateFin}`;

      const res = await AxiosInstance.get(url).catch(() => ({ data: [] }));
      setMouvements(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setMouvements([]);
    } finally {
      setChargementMouvements(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterDateComplete = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) : '—';

  const formaterMontant = (m) => m && Number(m) > 0
    ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF'
    : '0 GNF';

  // ============================================================
  // Calculs
  // ============================================================
  const calculerTotaux = () => {
    if (!caisseSelectionnee) return {
      soldeInitial: 0, totalEntrees: 0, totalSorties: 0,
      soldeTheorique: 0, soldePhysique: 0, difference: 0,
    };

    const entrees = mouvements.filter(m => m.type === 'entree');
    const sorties = mouvements.filter(m => m.type === 'sortie');
    const totalEntrees = entrees.reduce((sum, m) => sum + Number(m.montant || 0), 0);
    const totalSorties = sorties.reduce((sum, m) => sum + Number(m.montant || 0), 0);
    const soldeInitial = Number(caisseSelectionnee.solde_initial || 0);
    const soldeTheorique = soldeInitial + totalEntrees - totalSorties;
    const soldePhysique = Number(caisseSelectionnee.solde_physique || 0);
    const difference = soldePhysique - soldeTheorique;

    return {
      soldeInitial,
      totalEntrees,
      totalSorties,
      soldeTheorique,
      soldePhysique,
      difference,
    };
  };

  const totaux = calculerTotaux();

  // ============================================================
  // Rendu
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
        <button onClick={chargerCaisses} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Wallet className="w-3 h-3" />
            Trésorerie
            <span className="text-base-content/30">/</span>
            <span className="text-primary">État de caisse</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            État de caisse
          </h1>
          <p className="text-base-content/60 mt-1">
            Situation détaillée d'une caisse sur une période
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { chargerCaisses(); chargerMouvements(); }} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sélection caisse */}
            <div className="form-control w-full">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">Caisse</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={caisseSelectionnee?.id || ''}
                onChange={(e) => {
                  const c = caisses.find(x => String(x.id) === String(e.target.value));
                  setCaisseSelectionnee(c);
                }}
              >
                <option value="">— Sélectionner une caisse —</option>
                {caisses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Date début */}
            <div className="form-control w-full">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">Date de début</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            {/* Date fin */}
            <div className="form-control w-full">
              <label className="label py-0 pb-1.5">
                <span className="label-text text-sm font-medium">Date de fin</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>

          {/* Raccourcis périodes */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              className="btn btn-xs btn-outline"
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateDebut(firstDay.toISOString().split('T')[0]);
                setDateFin(today.toISOString().split('T')[0]);
              }}
            >
              Ce mois
            </button>
            <button
              className="btn btn-xs btn-outline"
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                setDateDebut(firstDay.toISOString().split('T')[0]);
                setDateFin(lastDay.toISOString().split('T')[0]);
              }}
            >
              Mois dernier
            </button>
            <button
              className="btn btn-xs btn-outline"
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), 0, 1);
                setDateDebut(firstDay.toISOString().split('T')[0]);
                setDateFin(today.toISOString().split('T')[0]);
              }}
            >
              Cette année
            </button>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => {
                setDateDebut('');
                setDateFin('');
              }}
            >
              Tout
            </button>
          </div>
        </div>
      </div>

      {/* AUCUNE CAISSE */}
      {!caisseSelectionnee ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <Wallet className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune caisse sélectionnée</p>
          <Link to="/caisses/ajouter" className="btn btn-primary mt-4">
            Créer une caisse
          </Link>
        </div>
      ) : (
        <>
          {/* EN-TÊTE CAISSE */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm mb-6">
            <div className="card-body">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Banknote className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono text-xs text-base-content/50">{caisseSelectionnee.code}</p>
                    <h2 className="font-bold text-xl text-primary">{caisseSelectionnee.nom}</h2>
                    <p className="text-xs text-base-content/60">
                      Responsable : {caisseSelectionnee.responsable_nom || 'Aucun'}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-base-content/50">Période analysée</p>
                  <p className="font-medium">
                    {dateDebut ? formaterDate(dateDebut) : 'Depuis le début'}
                    {dateFin ? ` → ${formaterDate(dateFin)}` : ' → Aujourd\'hui'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SOLDES ACTUELS */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-info" />
                  <p className="text-xs text-base-content/50 uppercase tracking-wider">Solde théorique</p>
                </div>
                <p className="text-2xl font-bold text-info font-mono">
                  {formaterMontant(totaux.soldeTheorique)}
                </p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="w-4 h-4 text-warning" />
                  <p className="text-xs text-base-content/50 uppercase tracking-wider">Solde physique</p>
                </div>
                <p className="text-2xl font-bold text-warning font-mono">
                  {formaterMontant(totaux.soldePhysique)}
                </p>
              </div>
            </div>

            <div className={`card shadow-sm border-2 ${
              totaux.difference === 0 ? 'bg-success/5 border-success/30' :
              totaux.difference > 0 ? 'bg-info/5 border-info/30' :
              'bg-error/5 border-error/30'
            }`}>
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  {totaux.difference === 0 ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : totaux.difference > 0 ? (
                    <TrendingUp className="w-4 h-4 text-info" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-error" />
                  )}
                  <p className="text-xs text-base-content/50 uppercase tracking-wider">Écart</p>
                </div>
                <p className={`text-2xl font-bold font-mono ${
                  totaux.difference === 0 ? 'text-success' :
                  totaux.difference > 0 ? 'text-info' : 'text-error'
                }`}>
                  {totaux.difference === 0 ? '✓ 0' : formaterMontant(totaux.difference)}
                </p>
              </div>
            </div>
          </div>

          {/* RÉCAPITULATIF */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Mouvements de la période */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Mouvements de la période</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                    <div className="flex items-center gap-3">
                      <ArrowDownRight className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm font-medium">Total Entrées</p>
                        <p className="text-xs text-base-content/50">
                          {mouvements.filter(m => m.type === 'entree').length} mouvement(s)
                        </p>
                      </div>
                    </div>
                    <p className="font-mono font-bold text-success">
                      +{formaterMontant(totaux.totalEntrees)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-error/5 rounded-lg border border-error/20">
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="w-5 h-5 text-error" />
                      <div>
                        <p className="text-sm font-medium">Total Sorties</p>
                        <p className="text-xs text-base-content/50">
                          {mouvements.filter(m => m.type === 'sortie').length} mouvement(s)
                        </p>
                      </div>
                    </div>
                    <p className="font-mono font-bold text-error">
                      -{formaterMontant(totaux.totalSorties)}
                    </p>
                  </div>

                  <div className="divider my-1"></div>

                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-5 h-5 text-primary" />
                      <p className="text-sm font-bold">Solde de la période</p>
                    </div>
                    <p className={`font-mono font-bold text-lg ${
                      totaux.totalEntrees - totaux.totalSorties >= 0 ? 'text-success' : 'text-error'
                    }`}>
                      {totaux.totalEntrees - totaux.totalSorties >= 0 ? '+' : ''}
                      {formaterMontant(totaux.totalEntrees - totaux.totalSorties)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Calcul du solde */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-info" />
                <h3 className="font-semibold text-sm">Calcul du solde</h3>
              </div>
              <div className="card-body">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-base-content/60">Solde initial</span>
                    <span className="font-mono font-medium">
                      {formaterMontant(totaux.soldeInitial)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-base-content/60">+ Total entrées</span>
                    <span className="font-mono font-medium text-success">
                      +{formaterMontant(totaux.totalEntrees)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-base-content/60">− Total sorties</span>
                    <span className="font-mono font-medium text-error">
                      -{formaterMontant(totaux.totalSorties)}
                    </span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex items-center justify-between font-bold py-2">
                    <span>= Solde théorique</span>
                    <span className="font-mono text-info text-lg">
                      {formaterMontant(totaux.soldeTheorique)}
                    </span>
                  </div>

                  <div className="divider my-1"></div>

                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-base-content/60">Solde physique constaté</span>
                    <span className="font-mono font-medium">
                      {formaterMontant(totaux.soldePhysique)}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between font-bold py-2 ${
                    totaux.difference === 0 ? 'text-success' :
                    totaux.difference > 0 ? 'text-info' : 'text-error'
                  }`}>
                    <span>= Écart</span>
                    <span className="font-mono text-lg">
                      {totaux.difference === 0 ? '✓ 0' : formaterMontant(totaux.difference)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* DÉTAIL DES MOUVEMENTS */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Détail des mouvements</h3>
              </div>
              <span className="badge badge-primary badge-sm">
                {mouvements.length} mouvement{mouvements.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-5">
              {chargementMouvements ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : mouvements.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                  <p className="text-base-content/60">Aucun mouvement sur cette période</p>
                  <p className="text-xs text-base-content/40 mt-2">
                    Essayez de modifier les dates ou sélectionnez une autre caisse
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="border-b border-base-300">
                        <th className="text-xs uppercase text-base-content/60">Date</th>
                        <th className="text-xs uppercase text-base-content/60">Type</th>
                        <th className="text-xs uppercase text-base-content/60">Libellé</th>
                        <th className="text-xs uppercase text-base-content/60">Référence</th>
                        <th className="text-xs uppercase text-base-content/60 text-right">Débit</th>
                        <th className="text-xs uppercase text-base-content/60 text-right">Crédit</th>
                        <th className="text-xs uppercase text-base-content/60 text-right">Solde cumulé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Calculer le solde cumulé
                        let soldeCumule = totaux.soldeInitial;
                        const sortedMouvements = [...mouvements].sort(
                          (a, b) => new Date(a.date_mouvement) - new Date(b.date_mouvement)
                        );

                        return sortedMouvements.map((m) => {
                          if (m.type === 'entree') {
                            soldeCumule += Number(m.montant || 0);
                          } else {
                            soldeCumule -= Number(m.montant || 0);
                          }

                          return (
                            <tr key={m.id} className="border-b border-base-200 last:border-0">
                              <td className="text-xs whitespace-nowrap">
                                {formaterDate(m.date_mouvement)}
                              </td>
                              <td>
                                {m.type === 'entree' ? (
                                  <span className="badge badge-success badge-xs gap-1">
                                    <ArrowDownRight className="w-3 h-3" />
                                    Entrée
                                  </span>
                                ) : (
                                  <span className="badge badge-error badge-xs gap-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    Sortie
                                  </span>
                                )}
                              </td>
                              <td className="text-sm">{m.libelle}</td>
                              <td className="text-xs text-base-content/60 font-mono">
                                {m.reference || '—'}
                              </td>
                              <td className="text-right font-mono text-sm text-success">
                                {m.type === 'entree' ? formaterMontant(m.montant) : '—'}
                              </td>
                              <td className="text-right font-mono text-sm text-error">
                                {m.type === 'sortie' ? formaterMontant(m.montant) : '—'}
                              </td>
                              <td className="text-right font-mono text-sm font-bold">
                                {formaterMontant(soldeCumule)}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-base-300">
                        <td colSpan="4" className="text-right font-bold text-sm">
                          TOTAUX DE LA PÉRIODE
                        </td>
                        <td className="text-right font-mono font-bold text-success">
                          {formaterMontant(totaux.totalEntrees)}
                        </td>
                        <td className="text-right font-mono font-bold text-error">
                          {formaterMontant(totaux.totalSorties)}
                        </td>
                        <td className="text-right font-mono font-bold">
                          {formaterMontant(totaux.soldeTheorique)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pied de page - signature */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <p className="text-xs text-base-content/50 uppercase mb-3">Établi par</p>
                <div className="border-b-2 border-dashed border-base-300 pb-3 mb-2 h-12"></div>
                <p className="text-xs text-base-content/50">Nom et signature</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <p className="text-xs text-base-content/50 uppercase mb-3">Vérifié par</p>
                <div className="border-b-2 border-dashed border-base-300 pb-3 mb-2 h-12"></div>
                <p className="text-xs text-base-content/50">Nom et signature</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <p className="text-xs text-base-content/50 uppercase mb-3">Approuvé par</p>
                <div className="border-b-2 border-dashed border-base-300 pb-3 mb-2 h-12"></div>
                <p className="text-xs text-base-content/50">Nom et signature</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EtatCaisse;