// pages/clients/ClientDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Edit, Trash2, Loader2, AlertCircle,
  Building2, Phone, Mail, MapPin, Briefcase, FileText,
  Receipt, DollarSign, TrendingUp, Users, Calendar,
  CreditCard, Hash
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [contrats, setContrats] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [ongletActif, setOngletActif] = useState('infos');

  useEffect(() => { chargerClient(); }, [id]);

  const chargerClient = async () => {
    setChargement(true);
    try {
      const response = await AxiosInstance.get(`/clients/${id}/`);
      setClient(response.data);
      try {
        const [contratsRes, facturesRes] = await Promise.all([
          AxiosInstance.get(`/clients/${id}/contrats/`).catch(() => ({ data: [] })),
          AxiosInstance.get(`/clients/${id}/factures/`).catch(() => ({ data: [] })),
        ]);
        setContrats(contratsRes.data.results || contratsRes.data || []);
        setFactures(facturesRes.data.results || facturesRes.data || []);
      } catch (e) { /* silencieux */ }
    } catch (err) {
      setErreur('Impossible de charger le client');
    } finally {
      setChargement(false);
    }
  };

  const supprimerClient = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/clients/${id}/`);
      navigate('/clients');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
      setShowModalSuppression(false);
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formaterMontant = (m) => m && Number(m) > 0 ? new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF' : '—';

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) return (
    <div className="text-center py-20">
      <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
      <p>{erreur}</p>
    </div>
  );

  if (!client) return null;

  return (
    <div className="w-full p-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-1">
              <Building2 className="w-3 h-3" />
              Clients / <span className="text-primary">{client.code}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              {client.nom_complet || client.nom}
            </h1>
            <p className="text-base-content/60 mt-1">
              {client.type} • {client.zone || 'Sans zone'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/clients/${id}/modifier`} className="btn btn-primary gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>
          <button onClick={() => setShowModalSuppression(true)} className="btn btn-error gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Onglets */}
          <div className="tabs tabs-boxed bg-base-100 shadow-sm p-1">
            <button className={`tab gap-2 ${ongletActif === 'infos' ? 'tab-active' : ''}`} onClick={() => setOngletActif('infos')}>
              <User className="w-4 h-4" /> Informations
            </button>
            <button className={`tab gap-2 ${ongletActif === 'contrats' ? 'tab-active' : ''}`} onClick={() => setOngletActif('contrats')}>
              <FileText className="w-4 h-4" /> Contrats {contrats.length > 0 && <span className="badge badge-sm">{contrats.length}</span>}
            </button>
            <button className={`tab gap-2 ${ongletActif === 'factures' ? 'tab-active' : ''}`} onClick={() => setOngletActif('factures')}>
              <Receipt className="w-4 h-4" /> Factures {factures.length > 0 && <span className="badge badge-sm">{factures.length}</span>}
            </button>
          </div>

          {/* Onglet Infos */}
          {ongletActif === 'infos' && (
            <>
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations</h2>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Code</label>
                    <p className="font-medium mt-1 font-mono flex items-center gap-2">
                      <Hash className="w-4 h-4 text-base-content/40" />{client.code}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Type</label>
                    <p className="font-medium mt-1">{client.type_display || client.type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Téléphone</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-base-content/40" />{client.telephone || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Email</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-base-content/40" />{client.email || '—'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-base-content/40 uppercase">Adresse</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-base-content/40" />
                      {client.adresse || '—'}{client.ville ? `, ${client.ville}` : ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Zone</label>
                    <p className="font-medium mt-1">{client.zone || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/40 uppercase">Statut</label>
                    <p className="mt-1">
                      <span className={`badge ${client.statut === 'actif' ? 'badge-success' : 'badge-ghost'}`}>
                        {client.statut}
                      </span>
                    </p>
                  </div>
                  {client.num_contribuable && (
                    <div>
                      <label className="text-xs text-base-content/40 uppercase">N° Contribuable</label>
                      <p className="font-medium mt-1 font-mono">{client.num_contribuable}</p>
                    </div>
                  )}
                  {client.num_rccm && (
                    <div>
                      <label className="text-xs text-base-content/40 uppercase">N° RCCM</label>
                      <p className="font-medium mt-1 font-mono">{client.num_rccm}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Onglet Contrats */}
          {ongletActif === 'contrats' && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <FileText className="w-4 h-4 text-info" />
                <h2 className="font-semibold text-sm">Contrats clients</h2>
              </div>
              <div className="p-5">
                {contrats.length > 0 ? (
                  <div className="space-y-3">
                    {contrats.map(c => (
                      <div key={c.id} className="p-4 rounded-lg border border-base-300">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium font-mono">{c.numero}</p>
                            <p className="text-xs text-base-content/50 mt-1">
                              {c.prestation} — {formaterDate(c.date_debut)} → {c.date_fin ? formaterDate(c.date_fin) : 'En cours'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`badge ${c.statut === 'actif' ? 'badge-success' : 'badge-ghost'} badge-sm`}>{c.statut}</span>
                            <p className="text-xs mt-1">{formaterMontant(c.tarif)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                    <p className="text-sm text-base-content/50">Aucun contrat</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Factures */}
          {ongletActif === 'factures' && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-warning" />
                <h2 className="font-semibold text-sm">Factures</h2>
              </div>
              <div className="p-5">
                {factures.length > 0 ? (
                  <div className="space-y-3">
                    {factures.map(f => (
                      <div key={f.id} className="p-4 rounded-lg border border-base-300">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium font-mono">{f.numero}</p>
                            <p className="text-xs text-base-content/50 mt-1">{formaterDate(f.date_emission)}</p>
                          </div>
                          <div className="text-right">
                            <span className={`badge badge-sm ${f.statut === 'payee' ? 'badge-success' : f.statut === 'en_retard' ? 'badge-error' : 'badge-warning'}`}>
                              {f.statut}
                            </span>
                            <p className="text-xs mt-1 font-mono">{formaterMontant(f.montant_ttc)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                    <p className="text-sm text-base-content/50">Aucune facture</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <div className="card-body text-center">
              <div className="avatar placeholder mx-auto">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">
                    {client.nom?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold mt-2">{client.nom_complet || client.nom}</h3>
              <p className="text-xs text-base-content/50 font-mono">{client.code}</p>
              <div className="divider my-2"></div>
              <div className="stats stats-vertical shadow-sm">
                <div className="stat py-2">
                  <div className="stat-title text-xs">Solde dû</div>
                  <div className="stat-value text-xl text-error">{formaterMontant(client.solde_du)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3">Actions rapides</h4>
              <div className="space-y-2">
                <Link to={`/contrats-clients/ajouter?client=${id}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <FileText className="w-4 h-4" /> Nouveau contrat
                </Link>
                <Link to={`/factures/ajouter?client=${id}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <Receipt className="w-4 h-4" /> Nouvelle facture
                </Link>
                <Link to={`/relances?client=${id}`} className="btn btn-ghost btn-sm justify-start w-full gap-2">
                  <TrendingUp className="w-4 h-4" /> Voir les relances
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal suppression */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le client</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <span className="font-bold">{client.nom_complet || client.nom}</span> ?
              </p>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={() => setShowModalSuppression(false)}>Annuler</button>
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

export default ClientDetail;