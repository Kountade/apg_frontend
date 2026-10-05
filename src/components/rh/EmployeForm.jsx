// pages/employes/EmployeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, User, Save, Edit, Loader2, AlertCircle,
  CheckCircle, Plus, Info, Building2, Briefcase, Mail,
  Phone, MapPin, Calendar, CreditCard, Users, Eye,
  DollarSign, UserCog, Hash, Cake, Globe
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const EmployeForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const employeId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    sexe: 'M',
    date_naissance: '',
    lieu_naissance: '',
    situation_matrimoniale: '',
    nationalite: 'Guinéenne',
    adresse: '',
    telephone: '',
    email: '',
    numero_cni: '',
    numero_cnss: '',
    poste: '',
    departement: '',
    superieur: '',
    date_embauche: new Date().toISOString().split('T')[0],
    type_contrat: 'CDI',
    salaire_base: '',
    statut: 'actif',
  });

  const [postes, setPostes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [employes, setEmployes] = useState([]);

  useEffect(() => {
    chargerDonneesReference();
    if (estEdition && employeId) {
      chargerEmploye(employeId);
    } else {
      // Pré-remplir le poste si passé en query string
      const posteParam = searchParams.get('poste');
      if (posteParam) {
        setFormData(prev => ({ ...prev, poste: posteParam }));
      }
    }
  }, [id]);

  const chargerDonneesReference = async () => {
    try {
      const [posRes, depRes, empRes] = await Promise.all([
        AxiosInstance.get('/postes/').catch(() => ({ data: [] })),
        AxiosInstance.get('/departements/').catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);
      setPostes(posRes.data.results || posRes.data || []);
      setDepartements(depRes.data.results || depRes.data || []);
      setEmployes(empRes.data.results || empRes.data || []);
    } catch (err) {
      console.error('Erreur chargement références:', err);
    }
  };

  const chargerEmploye = async (empId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/employes/${empId}/`);
      const data = response.data;
      setFormData({
        matricule: data.matricule || '',
        nom: data.nom || '',
        prenom: data.prenom || '',
        sexe: data.sexe || 'M',
        date_naissance: data.date_naissance || '',
        lieu_naissance: data.lieu_naissance || '',
        situation_matrimoniale: data.situation_matrimoniale || '',
        nationalite: data.nationalite || 'Guinéenne',
        adresse: data.adresse || '',
        telephone: data.telephone || '',
        email: data.email || '',
        numero_cni: data.numero_cni || '',
        numero_cnss: data.numero_cnss || '',
        poste: data.poste || '',
        departement: data.departement || '',
        superieur: data.superieur || '',
        date_embauche: data.date_embauche || '',
        type_contrat: data.type_contrat || 'CDI',
        salaire_base: data.salaire_base || '',
        statut: data.statut || 'actif',
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de l\'employé');
      if (err.response?.status === 404) {
        setErreur('Employé non trouvé');
      }
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };

      // Nettoyage
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (['poste', 'departement', 'superieur'].includes(key)) {
            dataToSend[key] = null;
          } else if (key === 'salaire_base') {
            dataToSend[key] = 0;
          } else {
            delete dataToSend[key];
          }
        }
      });

      if (estEdition && employeId) {
        await AxiosInstance.patch(`/employes/${employeId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/employes/${employeId}`), 1200);
      } else {
        await AxiosInstance.post('/employes/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/employes'), 1200);
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setErreur(errors.join(', '));
      } else {
        setErreur("Erreur lors de l'enregistrement");
      }
    } finally {
      setChargement(false);
    }
  };

  const posteSelectionne = postes.find(p => String(p.id) === String(formData.poste));
  const departementSelectionne = departements.find(d => String(d.id) === String(formData.departement));

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate(estEdition ? `/employes/${employeId}` : '/employes')}
            className="btn btn-ghost btn-sm btn-circle"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider font-medium mb-0.5">
              <Building2 className="w-3 h-3" />
              Ressources Humaines
              <span className="text-base-content/30">/</span>
              <span>Employés</span>
              <span className="text-base-content/30">/</span>
              <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {estEdition ? (
                <>
                  <Edit className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="truncate">Modifier — {formData.prenom} {formData.nom}</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                  Nouvel employé
                </>
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 shadow-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            {estEdition ? 'Employé modifié avec succès !' : 'Employé créé avec succès !'}
          </span>
        </div>
      )}

      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 shadow-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{erreur}</span>
        </div>
      )}

      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          <div className="lg:col-span-2 space-y-6">

            {/* Section 1 — Identité */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Identité</h2>
                  <span className="text-xs text-base-content/40 ml-auto">Informations personnelles</span>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Matricule
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                        <input
                          type="text"
                          name="matricule"
                          className="input input-bordered w-full pl-10 font-mono focus:input-primary"
                          value={formData.matricule}
                          onChange={handleChange}
                          required
                          placeholder="APG-001"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Sexe
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="sexe"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.sexe}
                        onChange={handleChange}
                        required
                      >
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Prénom
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="prenom"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.prenom}
                        onChange={handleChange}
                        required
                        placeholder="Prénom"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Nom
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        placeholder="Nom"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Cake className="w-3.5 h-3.5 text-base-content/40" />
                          Date de naissance
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_naissance"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.date_naissance}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-base-content/40" />
                          Lieu de naissance
                        </span>
                      </label>
                      <input
                        type="text"
                        name="lieu_naissance"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.lieu_naissance}
                        onChange={handleChange}
                        placeholder="Conakry"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Situation matrimoniale</span>
                      </label>
                      <select
                        name="situation_matrimoniale"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.situation_matrimoniale}
                        onChange={handleChange}
                      >
                        <option value="">— Non renseigné —</option>
                        <option value="Célibataire">Célibataire</option>
                        <option value="Marié(e)">Marié(e)</option>
                        <option value="Divorcé(e)">Divorcé(e)</option>
                        <option value="Veuf(ve)">Veuf(ve)</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-base-content/40" />
                          Nationalité
                        </span>
                      </label>
                      <input
                        type="text"
                        name="nationalite"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.nationalite}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 2 — Contact */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Coordonnées</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-base-content/40" />
                          Téléphone
                        </span>
                      </label>
                      <input
                        type="tel"
                        name="telephone"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.telephone}
                        onChange={handleChange}
                        placeholder="+224 622 00 00 00"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-base-content/40" />
                          Email
                        </span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="employe@apg.gn"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-base-content/40" />
                        Adresse
                      </span>
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      className="input input-bordered w-full focus:input-primary"
                      value={formData.adresse}
                      onChange={handleChange}
                      placeholder="Quartier, Ville, Pays"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-base-content/40" />
                          N° CNI
                        </span>
                      </label>
                      <input
                        type="text"
                        name="numero_cni"
                        className="input input-bordered w-full font-mono focus:input-primary"
                        value={formData.numero_cni}
                        onChange={handleChange}
                        placeholder="Numéro carte identité"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-base-content/40" />
                          N° CNSS
                        </span>
                      </label>
                      <input
                        type="text"
                        name="numero_cnss"
                        className="input input-bordered w-full font-mono focus:input-primary"
                        value={formData.numero_cnss}
                        onChange={handleChange}
                        placeholder="Numéro sécurité sociale"
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 3 — Affectation */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-warning" />
                  <h2 className="font-semibold text-sm">Affectation</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Poste
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="poste"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.poste}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner un poste —</option>
                        {postes.map((p) => (
                          <option key={p.id} value={p.id}>{p.nom}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Département
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="departement"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.departement}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner un département —</option>
                        {departements.map((d) => (
                          <option key={d.id} value={d.id}>{d.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <UserCog className="w-3.5 h-3.5 text-base-content/40" />
                        Supérieur hiérarchique
                      </span>
                    </label>
                    <select
                      name="superieur"
                      className="select select-bordered w-full focus:select-primary"
                      value={formData.superieur}
                      onChange={handleChange}
                    >
                      <option value="">— Aucun —</option>
                      {employes
                        .filter(e => !estEdition || String(e.id) !== String(employeId))
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.matricule ? `[${e.matricule}] ` : ''}{e.prenom} {e.nom}
                          </option>
                        ))}
                    </select>
                  </div>

                </div>
              </div>
            </div>

            {/* Section 4 — Contrat */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Contrat</h2>
                </div>

                <div className="p-5 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-base-content/40" />
                          Date d'embauche
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_embauche"
                        className="input input-bordered w-full focus:input-primary"
                        value={formData.date_embauche}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Type de contrat
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="type_contrat"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.type_contrat}
                        onChange={handleChange}
                        required
                      >
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="STAGE">Stage</option>
                        <option value="TEMPORAIRE">Temporaire</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-base-content/40" />
                          Salaire de base
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="salaire_base"
                          className="input input-bordered w-full pl-14 focus:input-primary"
                          value={formData.salaire_base}
                          onChange={handleChange}
                          min="0"
                          step="1000"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium flex items-center gap-1.5">
                          Statut
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="statut"
                        className="select select-bordered w-full focus:select-primary"
                        value={formData.statut}
                        onChange={handleChange}
                        required
                      >
                        <option value="actif">Actif</option>
                        <option value="suspendu">Suspendu</option>
                        <option value="parti">Parti</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu en direct</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">
                        {formData.prenom?.charAt(0)?.toUpperCase() || '?'}
                        {formData.nom?.charAt(0)?.toUpperCase() || ''}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {formData.prenom || 'Prénom'} {formData.nom || 'Nom'}
                      </p>
                      <p className="text-xs text-base-content/50 font-mono">
                        {formData.matricule || 'Matricule'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Poste :</span>
                      <span className="font-medium ml-auto truncate">
                        {posteSelectionne?.nom || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Département :</span>
                      <span className="font-medium ml-auto truncate">
                        {departementSelectionne?.nom || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Salaire :</span>
                      <span className="font-medium ml-auto">
                        {formData.salaire_base
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.salaire_base)) + ' GNF'
                          : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                      <span className="text-base-content/60">Tél :</span>
                      <span className="font-medium ml-auto truncate">
                        {formData.telephone || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-between">
                    <span className={`badge badge-sm ${
                      formData.statut === 'actif' ? 'badge-success' :
                      formData.statut === 'suspendu' ? 'badge-warning' : 'badge-ghost'
                    }`}>
                      {formData.statut === 'actif' ? 'Actif' :
                       formData.statut === 'suspendu' ? 'Suspendu' : 'Parti'}
                    </span>
                    <span className="badge badge-outline badge-sm">{formData.type_contrat}</span>
                  </div>
                </div>

                <p className="text-xs text-base-content/40 mt-3 text-center">
                  L'aperçu se met à jour en temps réel
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-between gap-4 px-6 py-3">

            <div className="hidden md:flex items-center gap-2 text-sm text-base-content/50">
              <AlertCircle className="w-4 h-4" />
              <span>Les champs marqués d'un <span className="text-error font-bold">*</span> sont obligatoires</span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate(estEdition ? `/employes/${employeId}` : '/employes')}
                className="btn btn-ghost gap-2"
                disabled={chargement}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 min-w-[160px]"
                disabled={chargement}
              >
                {chargement ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {estEdition ? 'Enregistrement...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {estEdition ? 'Enregistrer' : "Créer l'employé"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default EmployeForm;