// pages/formations/Formations.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Building2, Users, Calendar, TrendingUp, Award, Target,
  CheckCircle, Clock, DollarSign, Download, Printer,
  GraduationCap, User, MapPin, BarChart3, Briefcase,
  UserCheck, Layers, ChevronDown, Sparkles
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Formations = () => {
  const navigate = useNavigate();
  const [formations, setFormations] = useState([]);
  const [formationsFiltrees, setFormationsFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('all'); // 'all' | 'a_venir' | 'en_cours' | 'terminees'
  const [filtreAnnee, setFiltreAnnee] = useState(new Date().getFullYear());
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(10);
  const [formationSelectionnee, setFormationSelectionnee] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [succes, setSucces] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');

  useEffect(() => {
    chargerDonnees();
  }, [filtreAnnee]);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get('/formations/');
      const data = res.data.results || res.data || [];
      setFormations(data);
      setFormationsFiltrees(data);
      setTotalPages(Math.ceil(data.length / elementsParPage));
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les formations');
      }
    } finally {
      setChargement(false);
    }
  };

  const getStatutPeriode = (formation) => {
    const aujourd = new Date();
    const debut = new Date(formation.date_debut);
    const fin = new Date(formation.date_fin);
    if (fin < aujourd) return 'terminee';
    if (debut <= aujourd && aujourd <= fin) return 'en_cours';
    return 'a_venir';
  };

  useEffect(() => {
    let filtre = formations;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(f =>
        f.titre?.toLowerCase().includes(terme) ||
        f.formateur?.toLowerCase().includes(terme) ||
        f.lieu?.toLowerCase().includes(terme) ||
        f.description?.toLowerCase().includes(terme)
      );
    }

    if (filtrePeriode !== 'all') {
      filtre = filtre.filter(f => getStatutPeriode(f) === filtrePeriode);
    }

    if (filtreAnnee) {
      filtre = filtre.filter(f => {
        if (!f.date_debut) return false;
        return f.date_debut.startsWith(String(filtreAnnee));
      });
    }

    setFormationsFiltrees(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtrePeriode, filtreAnnee, formations]);

  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    return formationsFiltrees.slice(debut, debut + elementsParPage);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) setPageActuelle(page);
  };

  const supprimerFormation = async () => {
    if (!formationSelectionnee) return;
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/formations/${formationSelectionnee.id}/`);
      setFormations(formations.filter(f => f.id !== formationSelectionnee.id));
      setShowModalSuppression(false);
      setFormationSelectionnee(null);
      setMessageSucces('Formation supprimée avec succès');
      setSucces(true);
      setTimeout(() => setSucces(false), 2500);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formaterMontant = (montant) => {
    if (!montant || montant === '0') return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(montant)) + ' GNF';
  };

  const getBadgePeriode = (formation) => {
    const statut = getStatutPeriode(formation);
    const configs = {
      a_venir: { label: 'À venir', cls: 'badge-info', icon: Clock },
      en_cours: { label: 'En cours', cls: 'badge-warning', icon: Sparkles },
      terminee: { label: 'Terminée', cls: 'badge-success', icon: CheckCircle },
    };
    const cfg = configs[statut];
    const Icon = cfg.icon;
    return (
      <span className={`badge ${cfg.cls} badge-sm gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
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
        <button onClick={chargerDonnees} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  // Statistiques
  const aujourd = new Date();
  const stats = {
    total: formations.length,
    aVenir: formations.filter(f => getStatutPeriode(f) === 'a_venir').length,
    enCours: formations.filter(f => getStatutPeriode(f) === 'en_cours').length,
    terminees: formations.filter(f => getStatutPeriode(f) === 'terminee').length,
    totalParticipants: formations.reduce((acc, f) => {
      const nb = Array.isArray(f.participants) ? f.participants.length : (f.nombre_participants || 0);
      return acc + nb;
    }, 0),
    coutTotal: formations.reduce((acc, f) => acc + Number(f.cout || 0), 0),
  };

  return (
    <div className="w-full p-6">

      {/* Toast succès */}
      {succes && (
        <div className="fixed top-4 right-4 z-50 alert alert-success shadow-lg max-w-md">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{messageSucces}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Formations</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Formations
          </h1>
          <p className="text-base-content/60 mt-1">
            {formationsFiltrees.length} formation{formationsFiltrees.length > 1 ? 's' : ''} trouvée{formationsFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={chargerDonnees}
            className="btn btn-ghost btn-sm gap-2"
            disabled={chargementAction}
          >
            <RefreshCw className={`w-4 h-4 ${chargementAction ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          <Link to="/formations/ajouter" className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle formation
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">À venir</p>
              <p className="text-lg font-bold text-info">{stats.aVenir}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">En cours</p>
              <p className="text-lg font-bold text-warning">{stats.enCours}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Terminées</p>
              <p className="text-lg font-bold text-success">{stats.terminees}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-3 flex-row items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Participants</p>
              <p className="text-lg font-bold text-info">{stats.totalParticipants}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 shadow-sm border border-warning/20">
          <div className="card-body p-3">
            <p className="text-[10px] text-base-content/50 uppercase tracking-wider">Coût total</p>
            <p className="text-sm font-bold text-warning">
              {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(stats.coutTotal)} GNF
            </p>
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
                  placeholder="Rechercher une formation, un formateur..."
                  className="input input-bordered input-sm w-full pl-10 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtrePeriode}
              onChange={(e) => setFiltrePeriode(e.target.value)}
            >
              <option value="all">Toutes les périodes</option>
              <option value="a_venir">À venir</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminées</option>
            </select>

            <select
              className="select select-bordered select-sm focus:select-primary"
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltrePeriode('all');
                setFiltreAnnee(new Date().getFullYear());
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {formationsFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <BookOpen className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucune formation trouvée</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtrePeriode !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par créer une formation'}
          </p>
          <Link to="/formations/ajouter" className="btn btn-primary mt-4">
            Nouvelle formation
          </Link>
        </div>
      ) : (
        <>
          {/* Vue cartes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {getElementsPageActuelle().map((formation) => {
              const statut = getStatutPeriode(formation);
              const nbParticipants = Array.isArray(formation.participants)
                ? formation.participants.length
                : (formation.nombre_participants || 0);

              return (
                <div
                  key={formation.id}
                  className={`card bg-base-100 shadow-sm border-2 transition-all hover:shadow-md ${
                    statut === 'en_cours' ? 'border-warning/40' :
                    statut === 'a_venir' ? 'border-info/30' :
                    'border-base-300'
                  }`}
                >
                  <div className="card-body p-4">

                    {/* En-tête */}
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        statut === 'en_cours' ? 'bg-warning/10 text-warning' :
                        statut === 'a_venir' ? 'bg-info/10 text-info' :
                        'bg-success/10 text-success'
                      }`}>
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/formations/${formation.id}`}
                          className="font-bold text-base hover:text-primary transition-colors line-clamp-2"
                        >
                          {formation.titre}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {getBadgePeriode(formation)}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {formation.description && (
                      <p className="text-xs text-base-content/60 line-clamp-2 mt-2">
                        {formation.description}
                      </p>
                    )}

                    {/* Infos rapides */}
                    <div className="divider my-2"></div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <span className="text-base-content/60">Formateur :</span>
                        <span className="font-medium ml-auto truncate">
                          {formation.formateur || '—'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <span className="text-base-content/60">Dates :</span>
                        <span className="font-medium ml-auto truncate">
                          {formaterDate(formation.date_debut)} → {formaterDate(formation.date_fin)}
                        </span>
                      </div>

                      {formation.lieu && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                          <span className="text-base-content/60">Lieu :</span>
                          <span className="font-medium ml-auto truncate">
                            {formation.lieu}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <span className="text-base-content/60">Participants :</span>
                        <span className="font-medium ml-auto">
                          {nbParticipants}
                        </span>
                      </div>

                      {formation.cout > 0 && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                          <span className="text-base-content/60">Coût :</span>
                          <span className="font-medium ml-auto text-warning">
                            {formaterMontant(formation.cout)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 mt-3 pt-3 border-t border-base-200">
                      <Link
                        to={`/formations/${formation.id}`}
                        className="btn btn-ghost btn-xs flex-1 gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir
                      </Link>
                      <Link
                        to={`/formations/${formation.id}/modifier`}
                        className="btn btn-ghost btn-xs flex-1 gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Modifier
                      </Link>
                      <button
                        onClick={() => {
                          setFormationSelectionnee(formation);
                          setShowModalSuppression(true);
                        }}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à{' '}
                {Math.min(pageActuelle * elementsParPage, formationsFiltrees.length)} sur{' '}
                {formationsFiltrees.length} formations
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => allerPage(pageActuelle - 1)}
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
                      onClick={() => allerPage(numPage)}
                    >
                      {numPage}
                    </button>
                  );
                })}
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => allerPage(pageActuelle + 1)}
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
      {showModalSuppression && formationSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer la formation</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer la formation{' '}
                <span className="font-bold">{formationSelectionnee.titre}</span> ?
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
                  onClick={supprimerFormation}
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

export default Formations;