// pages/employes/EmployeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Edit, Trash2, Loader2, AlertCircle,
  Calendar, Clock, Building2, Briefcase, Phone, Mail,
  MapPin, CreditCard, Cake, Globe, DollarSign, Users,
  FileText, TrendingUp, UserCheck, Award, Hash,
  CalendarDays, ClipboardCheck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const EmployeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employe, setEmploye] = useState(null);
  const [contrats, setContrats] = useState([]);
  const [conges, setConges] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [ongletActif, setOngletActif] = useState('infos');

  useEffect(() => {
    chargerEmploye();
  }, [id]);

  const chargerEmploye = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/employes/${id}/`);
      setEmploye(response.data);

      // Charger contrats et congés en parallèle
      try {
        const [contratsRes, congesRes] = await Promise.all([
          AxiosInstance.get(`/employes/${id}/contrats/`).catch(() => ({ data: [] })),
          AxiosInstance.get(`/employes/${id}/conges/`).catch(() => ({ data: [] })),
        ]);
        setContrats(contratsRes.data.results || contratsRes.data || []);
        setConges(congesRes.data.results || congesRes.data || []);
      } catch (e) {
        // Silencieux
      }
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger l\'employé');
      if (err.response?.status === 404) {
        setErreur('Employé non trouvé');
      }
    } finally {
      setChargement(false);
    }
  };

  const supprimerEmploye = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/employes/${id}/`);
      navigate('/employes');
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setShowModalSuppression(false);
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formaterDateHeure = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <button onClick={chargerEmploye} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!employe) return null;

  const getBadgeStatut = () => {
    const configs = {
      actif: { label: 'Actif', cls: 'badge-success' },
      suspendu: { label: 'Suspendu', cls: 'badge-warning' },
      parti: { label: 'Parti', cls: 'badge-ghost' },
    };
    const cfg = configs[employe.statut] || { label: employe.statut, cls: 'badge-ghost' };
    return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
  };

  const getBadgeContrat = (type) => {
    const configs = {
      CDI: 'badge-primary',
      CDD: 'badge-info',
      STAGE: 'badge-warning',
      TEMPORAIRE: 'badge-ghost',
    };
    return <span className={`badge ${configs[type] || 'badge-ghost'} badge-outline`}>{type}</span>;
  };

  return (
    <div className="w-full p-6">

      {/* EN-TÊTE */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/employes')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <Link to="/employes" className="hover:text-primary">Employés</Link>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{employe.prenom} {employe.nom}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              {employe.prenom} {employe.nom}
            </h1>
            <p className="text-base-content/60 mt-1 flex items-center gap-3">
              <span className="font-mono">{employe.matricule}</span>
              {employe.poste_nom && <span>• {employe.poste_nom}</span>}
              {employe.departement_nom && <span>• {employe.departement_nom}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/employes/${id}/modifier`}
            className="btn btn-primary gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowModalSuppression(true)}
            className="btn btn-error gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Onglets */}
          <div className="tabs tabs-boxed bg-base-100 shadow-sm border border-base-300 p-1">
            <button
              className={`tab gap-2 ${ongletActif === 'infos' ? 'tab-active' : ''}`}
              onClick={() => setOngletActif('infos')}
            >
              <User className="w-4 h-4" />
              Informations
            </button>
            <button
              className={`tab gap-2 ${ongletActif === 'contrats' ? 'tab-active' : ''}`}
              onClick={() => setOngletActif('contrats')}
            >
              <FileText className="w-4 h-4" />
              Contrats
              {contrats.length > 0 && (
                <span className="badge badge-sm">{contrats.length}</span>
              )}
            </button>
            <button
              className={`tab gap-2 ${ongletActif === 'conges' ? 'tab-active' : ''}`}
              onClick={() => setOngletActif('conges')}
            >
              <CalendarDays className="w-4 h-4" />
              Congés
              {conges.length > 0 && (
                <span className="badge badge-sm">{conges.length}</span>
              )}
            </button>
          </div>

          {/* Onglet Informations */}
          {ongletActif === 'infos' && (
            <>
              {/* Informations personnelles */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">Informations personnelles</h2>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Matricule</label>
                        <p className="font-medium mt-1 font-mono flex items-center gap-2">
                          <Hash className="w-4 h-4 text-base-content/40" />
                          {employe.matricule}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Sexe</label>
                        <p className="font-medium mt-1">
                          {employe.sexe === 'M' ? 'Masculin' : employe.sexe === 'F' ? 'Féminin' : '—'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Date de naissance</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <Cake className="w-4 h-4 text-base-content/40" />
                          {formaterDate(employe.date_naissance)}
                          {employe.age && (
                            <span className="text-xs text-base-content/50">({employe.age} ans)</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Lieu de naissance</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-base-content/40" />
                          {employe.lieu_naissance || '—'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Situation matrimoniale</label>
                        <p className="font-medium mt-1">{employe.situation_matrimoniale || '—'}</p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Nationalité</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-base-content/40" />
                          {employe.nationalite || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-info" />
                    <h2 className="font-semibold text-sm">Coordonnées</h2>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Téléphone</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-base-content/40" />
                          {employe.telephone || '—'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Email</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-base-content/40" />
                          {employe.email || '—'}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Adresse</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-base-content/40" />
                          {employe.adresse || '—'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">N° CNI</label>
                        <p className="font-medium mt-1 font-mono flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-base-content/40" />
                          {employe.numero_cni || '—'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">N° CNSS</label>
                        <p className="font-medium mt-1 font-mono flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-base-content/40" />
                          {employe.numero_cnss || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affectation */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-warning" />
                    <h2 className="font-semibold text-sm">Affectation</h2>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Poste</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-base-content/40" />
                          {employe.poste_nom || '—'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Département</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-base-content/40" />
                          {employe.departement_nom || '—'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Supérieur hiérarchique</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-base-content/40" />
                          {employe.superieur_nom || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contrat */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    <h2 className="font-semibold text-sm">Contrat</h2>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Date d'embauche</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-base-content/40" />
                          {formaterDate(employe.date_embauche)}
                          {employe.anciennete_annees > 0 && (
                            <span className="text-xs text-base-content/50">
                              ({employe.anciennete_annees} an{employe.anciennete_annees > 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Type de contrat</label>
                        <p className="mt-1">{getBadgeContrat(employe.type_contrat)}</p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Salaire de base</label>
                        <p className="font-medium mt-1 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-success" />
                          {formaterMontant(employe.salaire_base)}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Statut</label>
                        <p className="mt-1">{getBadgeStatut()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations système */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-base-content/50" />
                    <h2 className="font-semibold text-sm">Informations système</h2>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Créé le</label>
                        <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-base-content/40" />
                          {formaterDateHeure(employe.created_at)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-base-content/40 uppercase tracking-wider">Modifié le</label>
                        <p className="font-medium mt-1 flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-base-content/40" />
                          {formaterDateHeure(employe.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Onglet Contrats */}
          {ongletActif === 'contrats' && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Contrats de l'employé</h2>
                  <span className="badge badge-info badge-sm ml-auto">{contrats.length}</span>
                </div>

                <div className="p-5">
                  {contrats.length > 0 ? (
                    <div className="space-y-3">
                      {contrats.map((contrat) => (
                        <div key={contrat.id} className="p-4 rounded-lg border border-base-300 hover:bg-base-200/30 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium font-mono">{contrat.numero}</p>
                              <p className="text-xs text-base-content/50 mt-0.5">
                                {formaterDate(contrat.date_debut)} → {contrat.date_fin ? formaterDate(contrat.date_fin) : 'En cours'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="badge badge-outline badge-sm">{contrat.type}</span>
                              <p className="text-xs text-base-content/50 mt-1">
                                {formaterMontant(contrat.salaire)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                      <p className="text-sm text-base-content/50">
                        Aucun contrat enregistré
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Congés */}
          {ongletActif === 'conges' && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Congés de l'employé</h2>
                  <span className="badge badge-primary badge-sm ml-auto">{conges.length}</span>
                </div>

                <div className="p-5">
                  {conges.length > 0 ? (
                    <div className="space-y-3">
                      {conges.map((conge) => (
                        <div key={conge.id} className="p-4 rounded-lg border border-base-300">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium font-mono">{conge.numero}</p>
                              <p className="text-xs text-base-content/50 mt-0.5">
                                {formaterDate(conge.date_debut)} → {formaterDate(conge.date_fin)}
                                <span className="ml-2">({conge.nombre_jours} jours)</span>
                              </p>
                            </div>
                            <span className={`badge badge-sm ${
                              conge.statut === 'valide' ? 'badge-success' :
                              conge.statut === 'refuse' ? 'badge-error' :
                              conge.statut === 'annule' ? 'badge-ghost' : 'badge-warning'
                            }`}>
                              {conge.statut}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarDays className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                      <p className="text-sm text-base-content/50">
                        Aucun congé enregistré
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Colonne latérale */}
        <div className="lg:col-span-1 space-y-6">

          {/* Carte profil */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <div className="card-body text-center">
              {employe.photo ? (
                <div className="avatar mx-auto">
                  <div className="w-24 h-24 rounded-full">
                    <img src={employe.photo} alt={employe.nom} />
                  </div>
                </div>
              ) : (
                <div className="avatar placeholder mx-auto">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {employe.prenom?.charAt(0)?.toUpperCase()}
                      {employe.nom?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-bold mt-2">{employe.prenom} {employe.nom}</h3>
              <p className="text-xs text-base-content/50 font-mono">{employe.matricule}</p>

              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {getBadgeStatut()}
                {getBadgeContrat(employe.type_contrat)}
              </div>

              <div className="divider my-2"></div>

              <div className="stats stats-vertical shadow-sm">
                <div className="stat py-2">
                  <div className="stat-title text-xs">Ancienneté</div>
                  <div className="stat-value text-xl text-primary">
                    {employe.anciennete_annees || 0}
                    <span className="text-sm"> an{employe.anciennete_annees > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <Link
                  to={`/presences?employe=${id}`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Voir les présences
                </Link>
                <Link
                  to={`/conges/ajouter?employe=${id}`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  Nouveau congé
                </Link>
                <Link
                  to={`/contrats/ajouter?employe=${id}`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Nouveau contrat
                </Link>
                <Link
                  to={`/employes/${id}/modifier`}
                  className="btn btn-ghost btn-sm justify-start w-full gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier la fiche
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal suppression */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'employé</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement l'employé{' '}
                <span className="font-bold">{employe.prenom} {employe.nom}</span> ?
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
                  onClick={supprimerEmploye}
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

export default EmployeDetail;