// components/clients/ClientsFiltres.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Phone, Mail, MapPin, UserPlus, UserCheck,
  TrendingUp, Handshake, Landmark, Globe, Briefcase, Store, Hotel, School, HelpCircle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// ✅ CONFIGURATION PAR TYPE DE CLIENT (correspondance avec TYPE_CHOICES)
// ============================================================
const TYPE_CONFIG = {
  // Routes existantes dans le Navbar
  particuliers: {
    label: 'Particuliers',
    singular: 'Particulier',
    icon: Users,
    description: 'Clients résidentiels particuliers',
    emptyMessage: 'Aucun particulier enregistré',
    newLink: '/clients/ajouter?type=particulier',
    typeDB: 'particulier',
  },
  entreprises: {
    label: 'Entreprises',
    singular: 'Entreprise',
    icon: Building2,
    description: 'Sociétés et entreprises clientes',
    emptyMessage: 'Aucune entreprise enregistrée',
    newLink: '/clients/ajouter?type=entreprise',
    typeDB: 'entreprise',
  },
  administrations: {
    label: 'Administrations',
    singular: 'Administration',
    icon: Landmark,
    description: 'Administrations publiques et organismes d\'État',
    emptyMessage: 'Aucune administration enregistrée',
    newLink: '/clients/ajouter?type=administration',
    typeDB: 'administration',
  },
  ong: {
    label: 'ONG',
    singular: 'ONG',
    icon: Handshake,
    description: 'Organisations non gouvernementales',
    emptyMessage: 'Aucune ONG enregistrée',
    newLink: '/clients/ajouter?type=ong',
    typeDB: 'ong',
  },
  collectivites: {
    label: 'Collectivités',
    singular: 'Collectivité',
    icon: Globe,
    description: 'Collectivités locales et territoriales',
    emptyMessage: 'Aucune collectivité enregistrée',
    newLink: '/clients/ajouter?type=collectivite',
    typeDB: 'collectivite',
  },

  // ✅ Types supplémentaires (si vous décidez d'ajouter les routes)
  commerces: {
    label: 'Commerces',
    singular: 'Commerce',
    icon: Store,
    description: 'Commerces et boutiques',
    emptyMessage: 'Aucun commerce enregistré',
    newLink: '/clients/ajouter?type=commerce',
    typeDB: 'commerce',
  },
  hotels: {
    label: 'Hôtels',
    singular: 'Hôtel',
    icon: Hotel,
    description: 'Hôtels et établissements hôteliers',
    emptyMessage: 'Aucun hôtel enregistré',
    newLink: '/clients/ajouter?type=hotel',
    typeDB: 'hotel',
  },
  ecoles: {
    label: 'Établissements scolaires',
    singular: 'Établissement scolaire',
    icon: School,
    description: 'Écoles, lycées et universités',
    emptyMessage: 'Aucun établissement scolaire enregistré',
    newLink: '/clients/ajouter?type=ecole',
    typeDB: 'ecole',
  },
  autres: {
    label: 'Autres clients',
    singular: 'Client',
    icon: HelpCircle,
    description: 'Autres types de clients',
    emptyMessage: 'Aucun client enregistré',
    newLink: '/clients/ajouter?type=autre',
    typeDB: 'autre',
  },
};

// ============================================================
// COMPOSANT GÉNÉRIQUE
// ============================================================
const ClientsFiltres = ({ type }) => {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.particuliers;
  const IconComponent = config.icon;

  const [clients, setClients] = useState([]);
  const [clientsFiltres, setClientsFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreZone, setFiltreZone] = useState('all');
  const [zonesDisponibles, setZonesDisponibles] = useState([]);
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [clientSelectionne, setClientSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerClients();
  }, [type]);

  // ============================================================
  // ✅ CHARGEMENT + FILTRAGE CÔTÉ FRONTEND
  // ============================================================
  const chargerClients = async () => {
    setChargement(true);
    setErreur(null);
    try {
      // 1. Récupérer TOUS les clients
      const res = await AxiosInstance.get('/clients/');
      const allClients = res.data.results || res.data || [];

      // 2. ✅ FILTRER CÔTÉ FRONTEND par type (correspondance exacte)
      const clientsFiltresParType = allClients.filter(
        (c) => c.type === config.typeDB
      );

      setClients(clientsFiltresParType);

      // 3. Extraire les zones uniques
      const zones = [...new Set(
        clientsFiltresParType.map(c => c.zone).filter(Boolean)
      )].sort();
      setZonesDisponibles(zones);

    } catch (err) {
      console.error('Erreur:', err);
      setErreur(`Impossible de charger les ${config.label.toLowerCase()}`);
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // FILTRES SECONDAIRES
  // ============================================================
  useEffect(() => {
    let filtre = clients;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(c =>
        c.nom?.toLowerCase().includes(terme) ||
        c.prenom?.toLowerCase().includes(terme) ||
        c.code?.toLowerCase().includes(terme) ||
        c.telephone?.toLowerCase().includes(terme) ||
        c.email?.toLowerCase().includes(terme) ||
        c.zone?.toLowerCase().includes(terme) ||
        c.sigle?.toLowerCase().includes(terme)
      );
    }

    if (filtreStatut !== 'all') {
      filtre = filtre.filter(c => c.statut === filtreStatut);
    }

    if (filtreZone !== 'all') {
      filtre = filtre.filter(c => c.zone === filtreZone);
    }

    setClientsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreStatut, filtreZone, clients]);

  const totalPages = Math.ceil(clientsFiltres.length / elementsParPage);
  const getElementsPage = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return clientsFiltres.slice(debut, debut + elementsParPage);
  };

  const supprimerClient = async () => {
    if (!clientSelectionne) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/clients/${clientSelectionne.id}/`);
      setClients(clients.filter(c => c.id !== clientSelectionne.id));
      setShowModalSuppression(false);
      setClientSelectionne(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) === 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  const getBadgeStatut = (statut) => {
    const configs = {
      actif: { label: 'Actif', cls: 'badge-success' },
      inactif: { label: 'Inactif', cls: 'badge-ghost' },
      suspendu: { label: 'Suspendu', cls: 'badge-warning' },
      archive: { label: 'Archivé', cls: 'badge-neutral' },
    };
    const cfg = configs[statut] || { label: statut, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls} badge-sm`}>{cfg.label}</span>;
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
        <button onClick={chargerClients} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  const stats = {
    total: clients.length,
    actifs: clients.filter(c => c.statut === 'actif').length,
    avecSolde: clients.filter(c => Number(c.solde_du) > 0).length,
    totalSolde: clients.reduce((sum, c) => sum + Number(c.solde_du || 0), 0),
  };

  return (
    <div className="w-full p-6">

      {/* En-tête */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Clients & Contrats
            <span className="text-base-content/30">/</span>
            <Link to="/clients" className="hover:text-primary">Clients</Link>
            <span className="text-base-content/30">/</span>
            <span className="text-primary">{config.label}</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <IconComponent className="w-8 h-8 text-primary" />
            {config.label}
          </h1>
          <p className="text-base-content/60 mt-1">
            {config.description} — {clientsFiltres.length} client{clientsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerClients} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to={config.newLink} className="btn btn-primary gap-2">
            <UserPlus className="w-5 h-5" /> Nouveau {config.singular.toLowerCase()}
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Avec solde</p>
              <p className="text-xl font-bold text-error">{stats.avecSolde}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <span className="text-warning font-bold text-lg">₣</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Solde total</p>
              <p className="text-base font-bold text-warning truncate">
                {formaterMontant(stats.totalSolde)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder={`Rechercher un ${config.singular.toLowerCase()}...`}
                  className="input input-bordered w-full pl-10 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
              <option value="suspendu">Suspendus</option>
              <option value="archive">Archivés</option>
            </select>

            {zonesDisponibles.length > 0 && (
              <select
                className="select select-bordered select-sm focus:select-primary"
                value={filtreZone}
                onChange={(e) => setFiltreZone(e.target.value)}
              >
                <option value="all">Toutes les zones</option>
                {zonesDisponibles.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            )}

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreStatut('all');
                setFiltreZone('all');
              }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {clientsFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <IconComponent className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">
            {recherche || filtreStatut !== 'all' || filtreZone !== 'all'
              ? 'Aucun résultat trouvé'
              : config.emptyMessage}
          </p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreStatut !== 'all' || filtreZone !== 'all'
              ? 'Essayez de modifier vos filtres'
              : `Commencez par créer un nouveau ${config.singular.toLowerCase()}`}
          </p>
          <Link to={config.newLink} className="btn btn-primary mt-4">
            Créer un {config.singular.toLowerCase()}
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                    {config.singular}
                  </th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Contact</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Zone</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Solde dû</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60">Statut</th>
                  <th className="text-xs uppercase tracking-wider font-semibold text-base-content/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((client) => (
                  <tr key={client.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0">
                    <td>
                      <div className="flex items-center gap-3">
                        {client.photo ? (
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              <img src={client.photo} alt={client.nom} />
                            </div>
                          </div>
                        ) : (
                          <div className="avatar placeholder">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {client.nom?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {client.prenom ? `${client.prenom} ` : ''}{client.nom_complet || client.nom}
                          </p>
                          <p className="text-xs text-base-content/40 font-mono">
                            {client.code || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs space-y-0.5">
                        {client.telephone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-base-content/40" />
                            {client.telephone}
                          </p>
                        )}
                        {client.email && (
                          <p className="flex items-center gap-1.5 text-base-content/60 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-base-content/40 flex-shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </p>
                        )}
                        {!client.telephone && !client.email && (
                          <span className="text-base-content/30">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {client.zone ? (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <MapPin className="w-3 h-3" />
                          {client.zone}
                        </span>
                      ) : (
                        <span className="text-base-content/30 text-sm">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`font-mono text-sm ${Number(client.solde_du) > 0 ? 'text-error font-bold' : 'text-base-content/50'}`}>
                        {formaterMontant(client.solde_du)}
                      </span>
                    </td>
                    <td>{getBadgeStatut(client.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/clients/${client.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Voir les détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/clients/${client.id}/modifier`}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setClientSelectionne(client);
                            setShowModalSuppression(true);
                          }}
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, clientsFiltres.length)} sur{' '}
                {clientsFiltres.length} {config.label.toLowerCase()}
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let numPage = i + 1;
                  if (totalPages > 5 && pageActuelle > 3) {
                    numPage = pageActuelle - 2 + i;
                    if (numPage > totalPages) return null;
                  }
                  return (
                    <button
                      key={numPage}
                      className={`btn btn-sm ${pageActuelle === numPage ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setPageActuelle(numPage)}
                    >
                      {numPage}
                    </button>
                  );
                })}
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

      {/* Modal suppression */}
      {showModalSuppression && clientSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalSuppression(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le {config.singular.toLowerCase()}</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer{' '}
                <span className="font-bold">
                  {clientSelectionne.prenom ? `${clientSelectionne.prenom} ` : ''}{clientSelectionne.nom_complet || clientSelectionne.nom}
                </span> ?
                <br />
                <span className="text-error text-sm">Cette action est irréversible !</span>
              </p>
              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalSuppression(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-error flex-1"
                  onClick={supprimerClient}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsFiltres;