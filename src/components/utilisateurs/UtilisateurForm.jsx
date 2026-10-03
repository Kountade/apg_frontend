// pages/utilisateurs/UtilisateurForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, Mail, Lock, User, Shield,
  Loader2, AlertCircle, CheckCircle, Phone,
  Calendar, MapPin, Save, Edit, UserCog,
  Users, Calculator, Package, Truck
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// LES 6 RÔLES APG
// ============================================================
const ROLES = [
  {
    value: 'pdg',
    label: 'PDG / Administrateur Général',
    description: 'Accès total à la plateforme',
    icon: Shield,
    color: 'error',
    permissions: [
      '✓ Accès total à tous les modules',
      '✓ Gestion des utilisateurs et des rôles',
      '✓ Validation finale des opérations',
      '✓ Tableau de bord général',
      '✓ Journal d\'audit complet',
    ]
  },
  {
    value: 'rh',
    label: 'Responsable RH',
    description: 'Personnel, présences, congés, paie',
    icon: Users,
    color: 'primary',
    permissions: [
      '✓ Dossiers du personnel',
      '✓ Gestion des contrats',
      '✓ Présences et absences',
      '✓ Validation des congés',
      '✓ Préparation de la paie',
    ]
  },
  {
    value: 'comptable',
    label: 'Responsable Comptabilité',
    description: 'Facturation, recouvrement, finances',
    icon: Calculator,
    color: 'warning',
    permissions: [
      '✓ Facturation et devis',
      '✓ Recouvrement et créances',
      '✓ Encaissements / décaissements',
      '✓ Suivi des clients',
      '✓ Rapports comptables',
    ]
  },
  {
    value: 'logistique',
    label: 'Responsable Logistique',
    description: 'Stocks, tricycles, carburant, maintenance',
    icon: Package,
    color: 'info',
    permissions: [
      '✓ Gestion des stocks',
      '✓ Tricycles et véhicules',
      '✓ Carburant et consommation',
      '✓ Maintenance et pièces',
      '✓ Rapports logistiques',
    ]
  },
  {
    value: 'superviseur',
    label: 'Superviseur Exploitation',
    description: 'Missions, équipes, terrain',
    icon: Truck,
    color: 'success',
    permissions: [
      '✓ Gestion des missions',
      '✓ Équipes et présences terrain',
      '✓ Activités réalisées',
      '✓ Incidents et rapports',
      '✓ Demandes de décaissement',
    ]
  },
  {
    value: 'employe',
    label: 'Employé / Agent',
    description: 'Accès limité (self-service)',
    icon: UserCog,
    color: 'neutral',
    permissions: [
      '✓ Consultation de son profil',
      '✓ Ses présences',
      '✓ Demande de congé',
      '✓ Consultation de ses fiches de paie',
      '✓ Ses notifications',
    ]
  }
];

const UtilisateurForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const userId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    username: '',
    role: 'employe',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    birthday: '',
    is_active: true
  });

  useEffect(() => {
    if (estEdition && userId) {
      chargerUtilisateur(userId);
    }
  }, [id]);

  const chargerUtilisateur = async (userId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/users/${userId}/`);
      const data = response.data;
      setFormData({
        email: data.email || '',
        password: '',
        password_confirm: '',
        username: data.username || '',
        role: data.role === 'admin' ? 'pdg' : (data.role || 'employe'),
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        address: data.address || '',
        birthday: data.birthday || '',
        is_active: data.is_active !== undefined ? data.is_active : true
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de l\'utilisateur');
      if (err.response?.status === 404) {
        setErreur('Utilisateur non trouvé');
      }
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };

      if (estEdition && !dataToSend.password) {
        delete dataToSend.password;
        delete dataToSend.password_confirm;
      }

      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          delete dataToSend[key];
        }
      });

      if (estEdition && userId) {
        await AxiosInstance.patch(`/users/${userId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => {
          navigate(`/utilisateurs/${userId}`);
        }, 1500);
      } else {
        await AxiosInstance.post('/users/', dataToSend);
        setSucces(true);
        setTimeout(() => {
          navigate('/utilisateurs');
        }, 1500);
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setErreur(errors.join(', '));
      } else {
        setErreur(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
      }
    } finally {
      setChargement(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === formData.role);
  const SelectedRoleIcon = selectedRole?.icon || UserCog;

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-0 py-0 m-0">

      {/* EN-TÊTE */}
      <div className="w-full flex items-center gap-4 px-4 py-2 border-b border-base-300 bg-base-100">
        <button
          onClick={() => navigate(estEdition && userId ? `/utilisateurs/${userId}` : '/utilisateurs')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          {estEdition ? (
            <>
              <Edit className="w-5 h-5 text-primary" />
              Modifier l'utilisateur
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5 text-primary" />
              Nouvel utilisateur
            </>
          )}
        </h1>
      </div>

      {/* MESSAGES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 shadow-none py-1.5">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">
            {estEdition ? 'Utilisateur modifié avec succès !' : 'Utilisateur créé avec succès !'}
          </span>
        </div>
      )}

      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 shadow-none py-1.5">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{erreur}</span>
        </div>
      )}

      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit} className="w-full">

        {/* ============================================================
            SECTION 1 : CONNEXION
            ⚡ Padding vertical minimal : py-2 au lieu de p-4
            ============================================================ */}
        <div className="w-full border-b border-base-300">
          <div className="w-full px-4 py-1.5 bg-base-200/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary" />
              Informations de connexion
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-base-300">

            {/* Email */}
            <div className="border-r border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Email professionnel *
                </span>
              </label>
              <input
                type="email"
                name="email"
                className="input input-bordered w-full"
                value={formData.email}
                onChange={handleChange}
                required={!estEdition}
                disabled={estEdition}
                placeholder="exemple@apg.gn"
              />
            </div>

            {/* Username */}
            <div className="border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Nom d'utilisateur
                </span>
              </label>
              <input
                type="text"
                name="username"
                className="input input-bordered w-full"
                value={formData.username}
                onChange={handleChange}
                placeholder="pseudo"
              />
            </div>

            {/* Password */}
            <div className="border-r border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  {estEdition ? 'Nouveau mot de passe' : 'Mot de passe *'}
                </span>
              </label>
              <input
                type="password"
                name="password"
                className="input input-bordered w-full"
                value={formData.password}
                onChange={handleChange}
                required={!estEdition}
                minLength="8"
                placeholder={estEdition ? 'Laisser vide' : '••••••••'}
              />
            </div>

            {/* Confirm */}
            <div className="border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  {estEdition ? 'Confirmer mot de passe' : 'Confirmation *'}
                </span>
              </label>
              <input
                type="password"
                name="password_confirm"
                className="input input-bordered w-full"
                value={formData.password_confirm}
                onChange={handleChange}
                required={!estEdition && formData.password}
                minLength="8"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 2 : INFORMATIONS PERSONNELLES
            ============================================================ */}
        <div className="w-full border-b border-base-300">
          <div className="w-full px-4 py-1.5 bg-base-200/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-primary" />
              Informations personnelles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-base-300">

            <div className="border-r border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium">Prénom</span>
              </label>
              <input
                type="text"
                name="first_name"
                className="input input-bordered w-full"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Prénom"
              />
            </div>

            <div className="border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium">Nom</span>
              </label>
              <input
                type="text"
                name="last_name"
                className="input input-bordered w-full"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Nom"
              />
            </div>

            <div className="border-r border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Téléphone
                </span>
              </label>
              <input
                type="tel"
                name="phone_number"
                className="input input-bordered w-full"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+224 622 00 00 00"
              />
            </div>

            <div className="border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Date de naissance
                </span>
              </label>
              <input
                type="date"
                name="birthday"
                className="input input-bordered w-full"
                value={formData.birthday}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2 border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Adresse
                </span>
              </label>
              <input
                type="text"
                name="address"
                className="input input-bordered w-full"
                value={formData.address}
                onChange={handleChange}
                placeholder="Quartier, Ville, Pays"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 3 : RÔLE — COMBOBOX
            ============================================================ */}
        <div className="w-full border-b border-base-300">
          <div className="w-full px-4 py-1.5 bg-base-200/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-2">
              <UserCog className="w-3.5 h-3.5 text-primary" />
              Rôle et permissions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-base-300">

            {/* Combobox rôle */}
            <div className="border-r border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <UserCog className="w-3.5 h-3.5 text-primary" />
                  Rôle *
                </span>
              </label>
              <select
                name="role"
                className="select select-bordered w-full"
                value={formData.role}
                onChange={handleChange}
                required
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div className="border-b border-base-300 px-3 py-2">
              <label className="label py-0 px-0 mb-1">
                <span className="label-text text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  Statut du compte
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer h-12">
                <input
                  type="checkbox"
                  name="is_active"
                  className="toggle toggle-primary"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span className="text-sm text-base-content/70">
                  {formData.is_active ? 'Actif' : 'Inactif'}
                </span>
              </label>
            </div>

            {/* Permissions du rôle */}
            {selectedRole && (
              <div className={`md:col-span-2 border-b border-base-300 px-3 py-2 bg-${selectedRole.color}/5 border-l-4 border-l-${selectedRole.color}`}>
                <div className="flex items-start gap-2">
                  <SelectedRoleIcon className={`h-4 w-4 text-${selectedRole.color} flex-shrink-0 mt-0.5`} />
                  <div className="text-xs flex-1">
                    <p className="font-medium mb-1">
                      Permissions du rôle {selectedRole.label} :
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-base-content/70">
                      {selectedRole.permissions.map((perm, idx) => (
                        <li key={idx}>{perm}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            SECTION 4 : BOUTONS
            ============================================================ */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-base-300">
          <button
            type="button"
            onClick={() => navigate(estEdition && userId ? `/utilisateurs/${userId}` : '/utilisateurs')}
            className="btn btn-ghost rounded-none border-r border-base-300 h-12 text-sm"
            disabled={chargement}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary rounded-none h-12 text-sm gap-2"
            disabled={chargement}
          >
            {chargement ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {estEdition ? 'Modification...' : 'Création...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {estEdition ? 'Modifier' : 'Créer'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UtilisateurForm;