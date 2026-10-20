// components/comptabilite/HistoriqueRelances.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History, Search, Loader2, AlertCircle, RefreshCw, Filter,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, User,
  Mail, Phone, MessageSquare, MapPin, FileText, Calendar,
  DollarSign, Send, CheckCircle, Clock
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TYPES_CONFIG = {
  email:    { label: 'Email',      icon: Mail,          color: 'info' },
  sms:      { label: 'SMS',        icon: MessageSquare, color: 'primary' },
  appel:    { label: 'Appel',      icon: Phone,         color: 'success' },
  courrier: { label: 'Courrier',   icon: FileText,      color: 'warning' },
  visite:   { label: 'Visite',     icon: MapPin,        color: 'secondary' },
};

const HistoriqueRelances = () => {
  const [relances, setRelances] = useState([]);
  const [relancesFiltrees, setRelancesFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [clientsOuverts, setClientsOuverts] = useState({});

  useEffect(() => {
    chargerRelances();
  }, []);

  const chargerRelances = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/relances/');
      const data = res.data.results || res.data || [];
      setRelances(data);
      setRelancesFiltrees(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger l\'historique');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let filtre = relances;
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(r =>
        r.client_nom?.toLowerCase().includes(terme) ||
        r.facture_reference?.toLowerCase().includes(terme) ||
        r.message?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(r => r.type === filtreType);
    setRelancesFiltrees(filtre);
  }, [recherche, filtreType, relances]);

  // Grouper par client
  const groupesParClient = useMemo(() => {
    const groupes = {};
    relancesFiltrees.forEach(r => {
      const key = r.client;
      if (!groupes[key]) {
        groupes[key] = {
          client: r.client,
          client_nom: r.client_nom,
          relances: [],
          totalMontant: 0,
        };
      }
      groupes[key].relances.push(r);
      groupes[key].totalMontant += Number(r.montant_reclame || 0);
    });
    return Object.values(groupes).sort((a, b) =>
      (a.client_nom || '').localeCompare(b.client_nom || '')
    );
  }, [relancesFiltrees]);

  const toggleClient = (clientId) => {
    setClientsOuverts(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const getBadgeType = (type) => {
    const cfg = TYPES_CONFIG[type] || { label: type, icon: Mail, color: 'ghost' };
    const Icon = cfg.icon;
    return (
      <span className={`badge badge-${cfg.color} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const stats = useMemo(() => ({
    total: relances.length,
    nbClients: new Set(relances.map(r => r.client)).size,
    avecReponse: relances.filter(r => r.reponse_client).length,
    montantTotal: relances.reduce((sum, r) => sum + Number(r.montant_reclame || 0), 0),
  }), [relances]);

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
        <button onClick={chargerRelances} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <History className="w-3 h-3" />
            Facturation & Recouvrement
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Historique relances</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Historique des relances
          </h1>
          <p className="text-base-content/60 mt-1">
            {relancesFiltrees.length} relance{relancesFiltrees.length > 1 ? 's' : ''} • {stats.nbClients} client{stats.nbClients > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/relances" className="btn btn-ghost btn-sm gap-2">
            <Send className="w-4 h-4" /> Toutes les relances
          </Link>
          <button onClick={chargerRelances} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Clients</p>
              <p className="text-xl font-bold text-info">{stats.nbClients}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Avec réponse</p>
              <p className="text-xl font-bold text-success">{stats.avecReponse}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase">Montant total</p>
              <p className="text-sm font-bold font-mono truncate">
                {new Intl.NumberFormat('fr-FR').format(stats.montantTotal)}
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
                  placeholder="Rechercher par client, facture, message..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPES_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {(recherche || filtreType !== 'all') && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => {
                  setRecherche('');
                  setFiltreType('all');
                }}
              >
                <Filter className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTE GROUPÉE PAR CLIENT */}
      {groupesParClient.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <History className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {recherche || filtreType !== 'all'
              ? 'Aucune relance ne correspond aux filtres'
              : 'Aucune relance dans l\'historique'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupesParClient.map((groupe) => {
            const isOpen = clientsOuverts[groupe.client] !== false;
            const relancesTriees = [...groupe.relances].sort((a, b) =>
              new Date(b.date_relance) - new Date(a.date_relance)
            );

            return (
              <div key={groupe.client} className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  {/* En-tête client */}
                  <button
                    onClick={() => toggleClient(groupe.client)}
                    className="px-5 py-4 bg-base-200/30 border-b border-base-300 flex items-center justify-between hover:bg-base-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-primary/20 text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold">
                          <span>{(groupe.client_nom?.[0] || '?').toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{groupe.client_nom}</p>
                        <p className="text-xs text-base-content/50">
                          {groupe.relances.length} relance{groupe.relances.length > 1 ? 's' : ''} •{' '}
                          <span className="font-mono">{formaterMontant(groupe.totalMontant)}</span>
                        </p>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {/* Liste des relances */}
                  {isOpen && (
                    <div className="p-3">
                      {relancesTriees.map(r => (
                        <div
                          key={r.id}
                          className="p-3 border-l-4 border-primary/30 mb-2 hover:bg-base-200/30 rounded-r"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex-shrink-0">{getBadgeType(r.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-mono text-base-content/60">
                                  {formaterDate(r.date_relance)}
                                </span>
                                {r.facture_reference && (
                                  <span className="text-xs font-mono text-info">
                                    • Facture {r.facture_reference}
                                  </span>
                                )}
                                {r.montant_reclame > 0 && (
                                  <span className="text-xs font-mono font-bold text-warning">
                                    • {formaterMontant(r.montant_reclame)}
                                  </span>
                                )}
                              </div>
                              {r.message && (
                                <p className="text-sm text-base-content/80 whitespace-pre-wrap">
                                  {r.message}
                                </p>
                              )}
                              {r.reponse_client && (
                                <div className="mt-2 p-2 bg-success/5 border border-success/20 rounded">
                                  <p className="text-xs text-success font-medium mb-1">
                                    Réponse du client :
                                  </p>
                                  <p className="text-xs text-base-content/80">{r.reponse_client}</p>
                                </div>
                              )}
                              {r.prochaine_relance && (
                                <p className="text-xs text-warning mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Prochaine relance : {formaterDate(r.prochaine_relance)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoriqueRelances;