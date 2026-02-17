import React, { useEffect, useState } from "react";
import "./LogoLoader.css";

const LogoLoader = ({ isVisible }) => {


  return (
    <div className={`premium-loader ${!isVisible ? "fade-out" : ""}`}>
      <div className="loader-content">

        <div className="logo-wrapper">
          <img src="/dromux-blanco.png" alt="Dromux" className="loader-logo" />
          <div className="logo-glow" />
        </div>

        <h2 className="loader-title">
          Potenciando concesionarios digitales
        </h2>

        <p className="loader-subtitle">
          Publicá, gestioná y vendé más vehículos con Dromux
        </p>

        <div className="progress-bar">
          <div className="progress-fill" />
        </div>

      </div>
    </div>
  );
};

export default LogoLoader;
