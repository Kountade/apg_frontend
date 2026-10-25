// src/components/alertes/AlertesVehicules.jsx
import React from 'react';
import { Truck } from 'lucide-react';
import AlertesFiltrees from './AlertesFiltrees';

const AlertesVehicules = () => (
  <AlertesFiltrees
    endpoint="/alertes/vehicules/"
    titre="Alertes Véhicules"
    sousTitre="Assurances, permis, maintenance"
    icone={Truck}
    couleur="secondary"
    moduleFiltre="vehicules"
  />
);

export default AlertesVehicules;