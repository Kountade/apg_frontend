// pages/organigramme/Organigramme.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Network, Loader2, AlertCircle, RefreshCw, Search,
  Building2, Briefcase, User, Users, ChevronDown, ChevronRight,
  Phone, Mail, UserCheck, Crown, Eye, ZoomIn, ZoomOut,
  Maximize2, LayoutGrid, GitBranch, Download, Filter,
  TrendingUp, DollarSign, Layers
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Organigramme = () => {
  const navigate = useNavigate();
  const [employes, setEmployes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [vueMode, setVueMode] = useState('hierarchie'); // 'hierarchie' | 'departements'
  const [filtreDepartement, setFiltreDepartement] = useState('all');
  const [zoom, setZoom] = useState(1);
  const [noeudsOuverts, setNoeudsOuverts] = useState({});

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [empRes, depRes] = await Promise.all([
        AxiosInstance.get('/employes/'),
        AxiosInstance.get('/departements/').catch(() => ({ data: [] })),
      ]);

      const empData = empRes.data.results || empRes.data || [];
      const depData = depRes.data.results || depRes.data || [];

      setEmployes(empData.filter(e => e.statut === 'actif'));
      setDepartements(depData);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger les données');
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // CONSTRUCTION DE L'ARBRE HIÉRARCHIQUE
  // ============================================================
  const arbreHierarchique = useMemo(() => {
    if (!employes.length) return [];

    // Map employé par id
    const mapEmployes = new Map();
    employes.forEach(emp => {
      mapEmployes.set(emp.id, { ...emp, children: [] });
    });

    // Construire les liens parent/enfant
    const racines = [];
    employes.forEach(emp => {
      const node = mapEmployes.get(emp.id);
      if (emp.superieur && mapEmployes.has(emp.superieur)) {
        mapEmployes.get(emp.superieur).children.push(node);
      } else {
        racines.push(node);
      }
    });

    return racines;
  }, [employes]);

  // ============================================================
  // GROUPEMENT PAR DÉPARTEMENT
  // ============================================================
  const parDepartement = useMemo(() => {
    const groupes = {};

    // Départements officiels
    departements.forEach(dep => {
      groupes[dep.id] = {
        id: dep.id,
        nom: dep.nom,
        code: dep.code,
        description: dep.description,
        responsable: null,
        employes: [],
      };
    });

    // Répartition des employés
    employes.forEach(emp => {
      const depId = emp.departement;
      if (depId && groupes[depId]) {
        groupes[depId].employes.push(emp);
        // Le premier employé marqué comme supérieur est le responsable
        if (emp.superieur === null || emp.superieur === undefined) {
          if (!groupes[depId].responsable) {
            groupes[depId].responsable = emp;
          }
        }
      }
    });

    return Object.values(groupes).sort((a, b) => b.employes.length - a.employes.length);
  }, [employes, departements]);

  // Filtrage par recherche
  const matchRecherche = (emp) => {
    if (!recherche) return true;
    const terme = recherche.toLowerCase();
    return (
      emp.nom?.toLowerCase().includes(terme) ||
      emp.prenom?.toLowerCase().includes(terme) ||
      emp.matricule?.toLowerCase().includes(terme) ||
      emp.poste_nom?.toLowerCase().includes(terme)
    );
  };

  const toggleNoeud = (id) => {
    setNoeudsOuverts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const estOuvert = (id) => {
    return noeudsOuverts[id] !== false; // ouvert par défaut
  };

  // ============================================================
  // COMPOSANT NOEUD EMPLOYÉ (vue hiérarchique)
  // ============================================================
  const NoeudEmploye = ({ employe, niveau = 0, estDernier = false }) => {
    if (!matchRecherche(employe) && recherche) return null;

    const aDesEnfants = employe.children && employe.children.length > 0;
    const ouvert = estOuvert(employe.id);
    const estTopLevel = niveau === 0;

    return (
      <div className="relative">
        {/* Ligne de connexion verticale (parents → enfants) */}
        {aDesEnfants && ouvert && (
          <div className="absolute left-5 top-16 bottom-0 w-px bg-base-300" />
        )}

        {/* Carte employé */}
        <div className={`relative mb-3 ${niveau > 0 ? 'ml-8' : ''}`}>
          {/* Ligne horizontale de connexion */}
          {niveau > 0 && (
            <div className="absolute -left-8 top-6 w-8 h-px bg-base-300" />
          )}

          <div className={`card bg-base-100 shadow-sm border-2 transition-all hover:shadow-md ${
            estTopLevel ? 'border-primary/30' : 'border-base-300'
          }`}>
            <div className="card-body p-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`avatar placeholder flex-shrink-0 ${estTopLevel ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100 rounded-full' : ''}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    estTopLevel ? 'bg-primary text-primary-content' : 'bg-primary/10 text-primary'
                  }`}>
                    {employe.photo ? (
                      <img src={employe.photo} alt={employe.nom} className="rounded-full" />
                    ) : (
                      <span className="text-sm font-bold">
                        {employe.prenom?.charAt(0)?.toUpperCase()}
                        {employe.nom?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/employes/${employe.id}`}
                      className="font-semibold text-sm truncate hover:text-primary transition-colors"
                    >
                      {employe.prenom} {employe.nom}
                    </Link>
                    {estTopLevel && (
                      <Crown className="w-3.5 h-3.5 text-warning flex-shrink-0" title="Direction" />
                    )}
                  </div>
                  <p className="text-xs text-base-content/60 truncate">
                    {employe.poste_nom || '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-mono text-base-content/40">
                      {employe.matricule}
                    </span>
                    {employe.departement_nom && (
                      <span className="badge badge-ghost badge-xs gap-0.5">
                        <Building2 className="w-2.5 h-2.5" />
                        {employe.departement_nom}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {aDesEnfants && (
                    <button
                      onClick={() => toggleNoeud(employe.id)}
                      className="btn btn-ghost btn-xs btn-circle"
                      title={ouvert ? 'Réduire' : 'Développer'}
                    >
                      {ouvert ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <Link
                    to={`/employes/${employe.id}`}
                    className="btn btn-ghost btn-xs btn-circle"
                    title="Voir la fiche"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Compteur subordonnés */}
              {aDesEnfants && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-base-200 mt-1">
                  <Users className="w-3 h-3 text-base-content/40" />
                  <span className="text-xs text-base-content/50">
                    {employe.children.length} subordonné{employe.children.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enfants */}
        {aDesEnfants && ouvert && (
          <div className="ml-4">
            {employe.children.map((enfant, idx) => (
              <NoeudEmploye
                key={enfant.id}
                employe={enfant}
                niveau={niveau + 1}
                estDernier={idx === employe.children.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // COMPOSANT CARTE DÉPARTEMENT (vue par département)
  // ============================================================
  const CarteDepartement = ({ dep }) => {
    const employesFiltres = dep.employes.filter(matchRecherche);
    if (recherche && employesFiltres.length === 0) return null;

    return (
      <div className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-all">
        <div className="card-body p-0">
          {/* En-tête département */}
          <div className="px-5 py-4 border-b border-base-300 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/departements/${dep.id}`}
                    className="font-bold text-base truncate hover:text-primary transition-colors"
                  >
                    {dep.nom}
                  </Link>
                  {dep.code && (
                    <span className="badge badge-ghost badge-xs font-mono">{dep.code}</span>
                  )}
                </div>
                <p className="text-xs text-base-content/50 mt-0.5">
                  {dep.employes.length} employé{dep.employes.length > 1 ? 's' : ''}
                </p>
              </div>
              <Link
                to={`/departements/${dep.id}`}
                className="btn btn-ghost btn-xs btn-circle"
                title="Voir le département"
              >
                <Eye className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Responsable */}
          {dep.responsable && (
            <div className="px-5 py-3 border-b border-base-200 bg-warning/5">
              <div className="flex items-center gap-2 text-xs text-warning font-medium mb-2">
                <Crown className="w-3.5 h-3.5" />
                Responsable
              </div>
              <Link
                to={`/employes/${dep.responsable.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-warning">
                    {dep.responsable.prenom?.charAt(0)?.toUpperCase()}
                    {dep.responsable.nom?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {dep.responsable.prenom} {dep.responsable.nom}
                  </p>
                  <p className="text-xs text-base-content/50 truncate">
                    {dep.responsable.poste_nom || '—'}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Liste employés */}
          <div className="p-3 max-h-[400px] overflow-y-auto">
            {employesFiltres.length > 0 ? (
              <div className="space-y-1">
                {employesFiltres
                  .filter(e => e.id !== dep.responsable?.id)
                  .map((emp) => (
                    <Link
                      key={emp.id}
                      to={`/employes/${emp.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {emp.prenom?.charAt(0)?.toUpperCase()}
                          {emp.nom?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {emp.prenom} {emp.nom}
                        </p>
                        <p className="text-xs text-base-content/50 truncate">
                          {emp.poste_nom || '—'}
                        </p>
                      </div>
                      {emp.matricule && (
                        <span className="text-[10px] font-mono text-base-content/40 flex-shrink-0">
                          {emp.matricule}
                        </span>
                      )}
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-base-content/20 mx-auto mb-2" />
                <p className="text-xs text-base-content/40">
                  {recherche ? 'Aucun résultat' : 'Aucun employé'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // STATISTIQUES
  // ============================================================
  const stats = useMemo(() => {
    const totalEmployes = employes.length;
    const totalDepartements = departements.length;
    const totalResponsables = arbreHierarchique.length;
    const sansSuperieur = employes.filter(e => !e.superieur).length;

    return {
      totalEmployes,
      totalDepartements,
      totalResponsables,
      sansSuperieur,
    };
  }, [employes, departements, arbreHierarchique]);

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

  return (
    <div className="w-full p-6">

      {/* ============================================ */}
      {/* EN-TÊTE                                       */}
      {/* ============================================ */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-1">
            <Building2 className="w-3 h-3" />
            Ressources Humaines
            <span className="text-base-content/30">/</span>
            <span className="text-primary">Organigramme</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Network className="w-8 h-8 text-primary" />
            Organigramme
          </h1>
          <p className="text-base-content/60 mt-1">
            Vue hiérarchique et organisationnelle de l'entreprise APG
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerDonnees} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATISTIQUES                                  */}
      {/* ============================================ */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Employés actifs</p>
              <p className="text-xl font-bold">{stats.totalEmployes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Départements</p>
              <p className="text-xl font-bold text-info">{stats.totalDepartements}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Dirigeants</p>
              <p className="text-xl font-bold text-warning">{stats.totalResponsables}</p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Sans supérieur</p>
              <p className="text-xl font-bold text-success">{stats.sansSuperieur}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CONTRÔLES                                     */}
      {/* ============================================ */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Recherche */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un employé, un poste..."
                  className="input input-bordered input-sm w-full pl-9 focus:input-primary"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            {/* Mode de vue */}
            <div className="join">
              <button
                onClick={() => setVueMode('hierarchie')}
                className={`btn btn-sm join-item gap-2 ${
                  vueMode === 'hierarchie' ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                Hiérarchie
              </button>
              <button
                onClick={() => setVueMode('departements')}
                className={`btn btn-sm join-item gap-2 ${
                  vueMode === 'departements' ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Départements
              </button>
            </div>

            {/* Filtre département */}
            {vueMode === 'hierarchie' && (
              <select
                className="select select-bordered select-sm focus:select-primary"
                value={filtreDepartement}
                onChange={(e) => setFiltreDepartement(e.target.value)}
              >
                <option value="all">Tous les départements</option>
                {departements.map((dep) => (
                  <option key={dep.id} value={dep.id}>{dep.nom}</option>
                ))}
              </select>
            )}

            {/* Zoom (uniquement vue hiérarchie) */}
            {vueMode === 'hierarchie' && (
              <div className="join">
                <button
                  onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
                  className="btn btn-sm join-item"
                  title="Réduire"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="btn btn-sm join-item min-w-[60px] text-xs"
                  title="Réinitialiser"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                  className="btn btn-sm join-item"
                  title="Agrandir"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CONTENU                                       */}
      {/* ============================================ */}

      {/* Vue hiérarchique */}
      {vueMode === 'hierarchie' && (
        <>
          {arbreHierarchique.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
              <Network className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <p className="text-xl text-base-content/60">Aucune hiérarchie définie</p>
              <p className="text-sm text-base-content/40 mt-2">
                Ajoutez un supérieur hiérarchique à vos employés pour construire l'organigramme
              </p>
            </div>
          ) : (
            <div
              className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 overflow-auto"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s ease',
              }}
            >
              {filtreDepartement !== 'all' ? (
                // Filtre par département
                <div className="space-y-3">
                  {arbreHierarchique
                    .filter(r => String(r.departement) === String(filtreDepartement))
                    .map((racine) => (
                      <NoeudEmploye key={racine.id} employe={racine} niveau={0} />
                    ))}
                </div>
              ) : (
                // Vue complète
                <div className="space-y-3">
                  {arbreHierarchique.map((racine) => (
                    <NoeudEmploye key={racine.id} employe={racine} niveau={0} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Vue par départements */}
      {vueMode === 'departements' && (
        <>
          {parDepartement.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-xl shadow-sm border border-base-300">
              <Building2 className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <p className="text-xl text-base-content/60">Aucun département</p>
              <Link to="/departements/ajouter" className="btn btn-primary mt-4">
                Créer un département
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {parDepartement.map((dep) => (
                <CarteDepartement key={dep.id} dep={dep} />
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Organigramme;