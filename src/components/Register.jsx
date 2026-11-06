// src/components/Register.jsx - Version APG avec les 10 rôles (select)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  UserPlus, Mail, Lock, Phone, MapPin, Calendar,
  UserCog, Shield, Users, Calculator, Package,
  Truck, UserCheck, ArrowRight
} from 'lucide-react';
import MyTextField from './forms/MyTextField';
import MyPassField from './forms/MyPassField';
import MyMessage from './Message';
import AxiosInstance from './AxiosInstance';
import logo from '../assets/logo.svg';

// ============================================================
// LES 10 RÔLES APG
// group = pour organiser le <select> avec <optgroup>
// ============================================================
const ROLES = [
  // ----- DIRECTION -----
  {
    value: 'pdg',
    label: 'PDG / Administrateur Général',
    description: 'Accès total à la plateforme',
    icon: Shield,
    color: 'error',
    group: 'Direction',
  },

  // ----- RESPONSABLES -----
  {
    value: 'rh',
    label: 'Responsable RH',
    description: 'Personnel, présences, congés, paie',
    icon: Users,
    color: 'primary',
    group: 'Responsables',
  },
  {
    value: 'comptable',
    label: 'Responsable Comptabilité',
    description: 'Facturation, recouvrement, finances',
    icon: Calculator,
    color: 'warning',
    group: 'Responsables',
  },
  {
    value: 'logistique',
    label: 'Responsable Logistique',
    description: 'Stocks, tricycles, carburant, maintenance',
    icon: Package,
    color: 'info',
    group: 'Responsables',
  },
  {
    value: 'superviseur',
    label: 'Superviseur Exploitation',
    description: 'Missions, équipes, terrain',
    icon: Truck,
    color: 'success',
    group: 'Responsables',
  },

  // ----- ASSISTANTS (NOUVEAUX) -----
  {
    value: 'assistant_rh',
    label: 'Assistant RH',
    description: 'Personnel (lecture et création, sans validation)',
    icon: Users,
    color: 'primary',
    group: 'Assistants',
  },
  {
    value: 'assistant_comptable',
    label: 'Assistant Comptable',
    description: 'Comptabilité (sans validation ni paiement)',
    icon: Calculator,
    color: 'warning',
    group: 'Assistants',
  },
  {
    value: 'assistant_logistique',
    label: 'Assistant Logistique',
    description: 'Stocks (création sans validation)',
    icon: Package,
    color: 'info',
    group: 'Assistants',
  },
  {
    value: 'assistant_superviseur',
    label: 'Assistant Superviseur',
    description: 'Exploitation (sans création de mission)',
    icon: Truck,
    color: 'success',
    group: 'Assistants',
  },

  // ----- EMPLOYÉ -----
  {
    value: 'employe',
    label: 'Employé / Agent',
    description: 'Accès limité (self-service)',
    icon: UserCheck,
    color: 'neutral',
    group: 'Employé',
  },
];

// Ordre des groupes dans le <select>
const GROUP_ORDER = ['Direction', 'Responsables', 'Assistants', 'Employé'];

const Register = () => {
  const navigate = useNavigate();

  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================
  // SCHÉMA DE VALIDATION — 10 rôles
  // ============================================================
  const schema = yup.object({
    email: yup.string()
      .email('Email invalide')
      .required('Email requis')
      .max(200, 'Email trop long'),
    password: yup.string()
      .required('Mot de passe requis')
      .min(8, '8 caractères minimum')
      .matches(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .matches(/[0-9]/, 'Doit contenir au moins un chiffre'),
    password2: yup.string()
      .required('Confirmation requise')
      .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas'),
    role: yup.string()
      .required('Rôle requis')
      .oneOf(
        [
          'pdg',
          'rh', 'comptable', 'logistique', 'superviseur',
          'assistant_rh', 'assistant_comptable',
          'assistant_logistique', 'assistant_superviseur',
          'employe',
        ],
        'Rôle invalide'
      ),
    first_name: yup.string().max(200, 'Trop long').optional(),
    last_name: yup.string().max(200, 'Trop long').optional(),
    username: yup.string().max(200, 'Trop long').optional(),
    phone_number: yup.string()
      .matches(/^[0-9+\-\s]{8,20}$/, 'Format de téléphone invalide')
      .optional(),
    address: yup.string().optional(),
    birthday: yup.date()
      .nullable()
      .optional()
      .max(new Date(), 'Date de naissance invalide'),
  });

  const { handleSubmit, control, watch, register, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'employe',
      first_name: '',
      last_name: '',
      username: '',
      phone_number: '',
      address: '',
      birthday: null,
    },
  });

  const watchedRole = watch('role');
  const selectedRole = ROLES.find(r => r.value === watchedRole);

  // Groupes pour le <select>
  const groupedRoles = GROUP_ORDER.map(group => ({
    group,
    roles: ROLES.filter(r => r.group === group),
  })).filter(g => g.roles.length > 0);

  // ============================================================
  // SOUMISSION
  // ============================================================
  const submission = (data) => {
    setIsLoading(true);
    setShowMessage(false);

    const { password2, ...submitData } = data;

    // Nettoyer les champs vides
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '' || submitData[key] === null) {
        delete submitData[key];
      }
    });

    console.log('📝 Données d\'inscription:', submitData);

    AxiosInstance.post(`register/`, submitData)
      .then(() => {
        const roleInfo = ROLES.find(r => r.value === data.role);
        const roleLabel = roleInfo?.label || data.role;

        setMessageText(`✅ Inscription réussie ! Compte ${roleLabel} créé avec succès.`);
        setMessageType('success');
        setShowMessage(true);

        setTimeout(() => navigate('/'), 3000);
      })
      .catch((error) => {
        console.error('❌ Erreur inscription:', error);
        let errorMessage = 'Échec de l\'inscription';

        if (error.response?.data?.email) {
          errorMessage = Array.isArray(error.response.data.email)
            ? error.response.data.email[0]
            : 'Cet email est déjà utilisé';
        } else if (error.response?.data?.phone_number) {
          errorMessage = Array.isArray(error.response.data.phone_number)
            ? error.response.data.phone_number[0]
            : 'Numéro de téléphone invalide';
        } else if (error.response?.data?.password) {
          errorMessage = Array.isArray(error.response.data.password)
            ? error.response.data.password[0]
            : 'Mot de passe invalide';
        } else if (error.response?.data?.role) {
          errorMessage = Array.isArray(error.response.data.role)
            ? error.response.data.role[0]
            : 'Rôle invalide';
        } else if (error.response?.data?.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (error.request) {
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else {
          errorMessage = error.message || 'Une erreur est survenue';
        }

        setMessageText(errorMessage);
        setMessageType('error');
        setShowMessage(true);
      })
      .finally(() => setIsLoading(false));
  };

  // Rendu des permissions par rôle (info-bulle sous le select)
  const renderRolePermissions = (role) => {
    switch (role) {
      case 'pdg':
        return [
          'Accès total à tous les modules',
          'Gestion des utilisateurs et des rôles',
          'Validation finale des opérations',
          'Tableau de bord général',
          'Journal d\'audit complet',
        ];
      case 'rh':
        return [
          'Dossiers du personnel',
          'Gestion des contrats',
          'Présences et absences',
          'Validation des congés',
          'Préparation et validation de la paie',
        ];
      case 'comptable':
        return [
          'Facturation et devis',
          'Recouvrement et créances',
          'Encaissements / décaissements',
          'Suivi des clients',
          'Validation des factures et paiements',
        ];
      case 'logistique':
        return [
          'Gestion des stocks (entrées/sorties)',
          'Tricycles et véhicules',
          'Carburant et consommation',
          'Maintenance et pièces',
          'Validation des mouvements et inventaires',
        ];
      case 'superviseur':
        return [
          'Gestion des missions',
          'Équipes et présences terrain',
          'Activités réalisées',
          'Incidents et rapports',
          'Validation des rapports terrain',
        ];
      case 'assistant_rh':
        return [
          'Lecture des dossiers personnel',
          'Création présences / congés',
          'Consultation de la paie (lecture)',
          '❌ Pas de validation de congés',
          '❌ Pas de validation de paie',
        ];
      case 'assistant_comptable':
        return [
          'Lecture factures / clients',
          'Création factures et paiements',
          'Consultation finances',
          '❌ Pas de validation de factures',
          '❌ Pas d\'exécution de paiement',
        ];
      case 'assistant_logistique':
        return [
          'Lecture stocks / tricycles / carburant',
          'Création mouvements de stock',
          'Création affectations',
          '❌ Pas de validation d\'inventaire',
          '❌ Pas de validation de décaissement',
        ];
      case 'assistant_superviseur':
        return [
          'Lecture missions / équipes',
          'Création présences / activités / incidents',
          '❌ Pas de création de mission',
          '❌ Pas de validation des missions',
        ];
      case 'employe':
        return [
          'Consultation de son profil',
          'Ses présences',
          'Demande de congé',
          'Consultation de ses fiches de paie',
          'Ses notifications',
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4 relative">
      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Message de notification */}
      {showMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <MyMessage
            text={messageText}
            color={messageType === 'success' ? 'var(--color-success)' : 'var(--color-error)'}
          />
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto relative z-10">
        <div className="card bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body p-6">
            {/* En-tête */}
            <div className="text-center mb-6">
              <div className="inline-flex justify-center items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <img
                    src={logo}
                    alt="Logo APG Assainissement"
                    className="h-10 w-10 object-contain"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-base-content">APG ASSAINISSEMENT</h1>
              <div className="h-0.5 w-12 bg-primary mx-auto my-2"></div>
              <p className="text-sm text-base-content/60">Création de compte professionnel</p>
            </div>

            <form onSubmit={handleSubmit(submission)}>
              {/* Email */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2 text-base-content">
                    <Mail className="h-4 w-4 text-primary" />
                    Email professionnel
                    <span className="text-error">*</span>
                  </span>
                </label>
                <MyTextField
                  name="email"
                  control={control}
                  type="email"
                  placeholder="contact@apg-assainissement.com"
                  disabled={isLoading}
                />
              </div>

              {/* Mots de passe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <Lock className="h-4 w-4 text-primary" />
                      Mot de passe
                      <span className="text-error">*</span>
                    </span>
                  </label>
                  <MyPassField
                    name="password"
                    control={control}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/40 text-xs">
                      Min. 8 caractères, 1 majuscule, 1 chiffre
                    </span>
                  </label>
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <Lock className="h-4 w-4 text-primary" />
                      Confirmation
                      <span className="text-error">*</span>
                    </span>
                  </label>
                  <MyPassField
                    name="password2"
                    control={control}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Coordonnées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium text-base-content">Prénom</span>
                  </label>
                  <MyTextField
                    name="first_name"
                    control={control}
                    type="text"
                    placeholder="Prénom"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium text-base-content">Nom</span>
                  </label>
                  <MyTextField
                    name="last_name"
                    control={control}
                    type="text"
                    placeholder="Nom"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium text-base-content">Nom d'utilisateur</span>
                  </label>
                  <MyTextField
                    name="username"
                    control={control}
                    type="text"
                    placeholder="Pseudo"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <Phone className="h-4 w-4 text-primary" />
                      Téléphone
                    </span>
                  </label>
                  <MyTextField
                    name="phone_number"
                    control={control}
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <MapPin className="h-4 w-4 text-primary" />
                      Adresse
                    </span>
                  </label>
                  <MyTextField
                    name="address"
                    control={control}
                    type="text"
                    placeholder="Quartier, Ville, Pays"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <Calendar className="h-4 w-4 text-primary" />
                      Date de naissance
                    </span>
                  </label>
                  <MyTextField
                    name="birthday"
                    control={control}
                    type="date"
                    placeholder="JJ/MM/AAAA"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="divider text-base-content/40 text-xs">
                INFORMATIONS PROFESSIONNELLES
              </div>

              {/* ============================================================ */}
              {/* RÔLE — LISTE DE SÉLECTION DÉROULANTE */}
              {/* ============================================================ */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2 text-base-content">
                    <UserCog className="h-4 w-4 text-primary" />
                    Rôle
                    <span className="text-error">*</span>
                  </span>
                </label>

                <select
                  {...register('role')}
                  disabled={isLoading}
                  className={`
                    select select-bordered w-full
                    ${errors.role ? 'select-error' : ''}
                  `}
                >
                  {groupedRoles.map(({ group, roles }) => (
                    <optgroup key={group} label={group}>
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {/* Description du rôle sélectionné */}
                {selectedRole && (
                  <label className="label">
                    <span className="label-text-alt text-base-content/60 text-xs">
                      {selectedRole.description}
                    </span>
                  </label>
                )}

                {errors.role && (
                  <label className="label">
                    <span className="label-text-alt text-error text-xs">
                      {errors.role.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Panneau d'information sur le rôle sélectionné */}
              {selectedRole && (
                <div className={`alert bg-${selectedRole.color}/10 border border-${selectedRole.color}/30 mb-4`}>
                  <div className="flex items-start gap-2">
                    {selectedRole.icon && (
                      <selectedRole.icon className={`h-4 w-4 mt-0.5 text-${selectedRole.color}`} />
                    )}
                    <div className="text-sm">
                      <p className="font-medium">
                        Permissions du rôle {selectedRole.label} :
                      </p>
                      <ul className="text-xs mt-1 space-y-0.5 text-base-content/70">
                        {renderRolePermissions(selectedRole.value).map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn bg-primary text-primary-content border-primary hover:bg-primary/90 flex-1"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      S'inscrire
                    </>
                  )}
                </button>
              </div>

              <div className="divider text-base-content/40 text-xs">OU</div>

              <div className="text-center">
                <Link
                  to="/"
                  className="text-sm text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 transition-all"
                >
                  Déjà un compte ?
                  <span className="font-semibold">Se connecter</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <p className="text-center text-xs text-base-content/40 mt-4">
                En créant un compte, vous acceptez nos conditions d'utilisation
              </p>
            </form>

            <div className="text-center pt-4 mt-4 border-t border-base-200">
              <p className="text-xs text-base-content/40">
                © 2025 APG Assainissement - Gestion des Déchets Domestiques
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Register;