// pages/clients/Clients.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Phone, Mail, MapPin, UserPlus, UserCheck,
  TrendingUp, Handshake, Landmark, Briefcase
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientsFiltres, setClientsFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(10);
  const [clientSelectionne, setClientSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => { chargerDonnees(); }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/clients/');
      const data = res.data.results || res.data || [];
      setClients(data);
      setClientsFiltres(data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les clients');
    } finally {
      setChargement(false);
    }
  };

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
        c.zone?.toLowerCase().includes(terme)
      );
    }
    if (filtreType !== 'all') filtre = filtre.filter(c => c.type === filtreType);
    if (filtreStatut !== 'all') filtre = filtre.filter(c => c.statut === filtreStatut);
    setClientsFiltres(filtre);
    setPageActuelle(1);
  }, [recherche, filtreType, filtreStatut, clients]);

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

  const getBadgeType = (type) => {
    const configs = {
      particulier: { label: 'Particulier', cls: 'badge-ghost' },
      entreprise: { label: 'Entreprise', cls: 'badge-primary' },
      administration: { label: 'Administration', cls: 'badge-info' },
      ong: { label: 'ONG', cls: 'badge-success' },
      collectivite: { label: 'Collectivité', cls: 'badge-warning' },
      commerce: { label: 'Commerce', cls: 'badge-accent' },
      hotel: { label: 'Hôtel', cls: 'badge-secondary' },
      ecole: { label: 'École', cls: 'badge-outline' },
    };
    const cfg = configs[type] || { label: type, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls} badge-sm`}>{cfg.label}</span>;
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

  const formaterMontant = (montant) => {
    if (!montant || montant === '0') return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(montant)) + ' GNF';
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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">Réessayer</button>
      </div>
    );
  }

  const stats = {
    total: clients.length,
    actifs: clients.filter(c => c.statut === 'actif').length,
    entreprises: clients.filter(c => c.type === 'entreprise').length,
    avecSolde: clients.filter(c => Number(c.solde_du) > 0).length,
  };

  return (
    <div className="w-full p-6">

      {/* En-tête */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Users className="w-3 h-3" />
            Clients & Contrats
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Clients</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Clients
          </h1>
          <p className="text-base-content/60 mt-1">
            {clientsFiltres.length} client{clientsFiltres.length > 1 ? 's' : ''} trouvé{clientsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <Link to="/clients/ajouter" className="btn btn-primary gap-2">
            <UserPlus className="w-5 h-5" /> Nouveau client
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Entreprises</p>
              <p className="text-xl font-bold text-info">{stats.entreprises}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase">Avec solde</p>
              <p className="text-xl font-bold text-error">{stats.avecSolde}</p>
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
                  placeholder="Rechercher par code, nom, téléphone, zone..."
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
              <option value="particulier">Particulier</option>
              <option value="entreprise">Entreprise</option>
              <option value="administration">Administration</option>
              <option value="ong">ONG</option>
              <option value="collectivite">Collectivité</option>
              <option value="commerce">Commerce</option>
              <option value="hotel">Hôtel</option>
              <option value="ecole">École</option>
            </select>

            <select
              className="select select-bordered select-sm"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
              <option value="archive">Archivé</option>
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreType('all');
                setFiltreStatut('all');
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
          <Users className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun client trouvé</p>
          <Link to="/clients/ajouter" className="btn btn-primary mt-4">
            Créer un client
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 border-b border-base-300">
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Zone</th>
                  <th>Solde dû</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPage().map((client) => (
                  <tr key={client.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
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
                                {client.nom?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{client.nom_complet || client.nom}</p>
                          <p className="text-xs text-base-content/40 font-mono">{client.code}</p>
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
                      </div>
                    </td>
                    <td>{getBadgeType(client.type)}</td>
                    <td>
                      {client.zone ? (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <MapPin className="w-3 h-3" />
                          {client.zone}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`font-mono text-sm ${Number(client.solde_du) > 0 ? 'text-error font-bold' : ''}`}>
                        {formaterMontant(client.solde_du)}
                      </span>
                    </td>
                    <td>{getBadgeStatut(client.statut)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/clients/${client.id}`} className="btn btn-ghost btn-xs" title="Voir">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link to={`/clients/${client.id}/modifier`} className="btn btn-ghost btn-xs" title="Modifier">
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
                {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, clientsFiltres.length)} sur{' '}
                {clientsFiltres.length}
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPageActuelle(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`btn btn-sm ${pageActuelle === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPageActuelle(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le client</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer{' '}
                <span className="font-bold">{clientSelectionne.nom_complet || clientSelectionne.nom}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button className="btn btn-error flex-1" onClick={supprimerClient} disabled={chargementAction}>
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;