// src/components/alertes/AlertesRH.jsx
import React from 'react';
import { Users } from 'lucide-react';
import AlertesFiltrees from './AlertesFiltrees';

const AlertesRH = () => (
  <AlertesFiltrees
    endpoint="/alertes/rh/"
    titre="Alertes RH"
    sousTitre="Congés, contrats, présences"
    icone={Users}
    couleur="primary"
    moduleFiltre="rh"
  />
);

export default AlertesRH;