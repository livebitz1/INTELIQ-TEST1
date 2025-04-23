'use client';

import React from 'react';

const Card3D = () => {
  return (
    <div className="card3d-wrapper">
      <div className="card-3d">
        <div className="card-content">
          <img src="/logo.png" alt="Logo" className="card-icon" />
          <p>Dashboard</p>
        </div>
        <div className="card-content">
          <i className="icon">💰</i>
          <p>Balance</p>
        </div>
        <div className="card-content">
          <i className="icon">↗️</i>
          <p>Send</p>
        </div>
        <div className="card-content">
          <i className="icon">↘️</i>
          <p>Receive</p>
        </div>
        <div className="card-content">
          <i className="icon">🔄</i>
          <p>Swap</p>
        </div>
        <div className="card-content">
          <i className="icon">📊</i>
          <p>Analytics</p>
        </div>
        <div className="card-content">
          <i className="icon">⚙️</i>
          <p>Settings</p>
        </div>
        <div className="card-content">
          <i className="icon">🔐</i>
          <p>Security</p>
        </div>
        <div className="card-content">
          <i className="icon">👤</i>
          <p>Profile</p>
        </div>
        <div className="card-content">
          <i className="icon">❓</i>
          <p>Support</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes autoRun3d {
          from {
            transform: perspective(800px) rotateY(-360deg);
          }
          to {
            transform: perspective(800px) rotateY(0deg);
          }
        }

        @keyframes animateBrightness {
          10% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(0.1);
          }
          90% {
            filter: brightness(1);
          }
        }

        .card-3d {
          position: relative;
          width: 400px;
          height: 200px;
          transform-style: preserve-3d;
          transform: perspective(800px);
          animation: autoRun3d 20s linear infinite;
          will-change: transform;
        }

        .card-3d div {
          position: absolute;
          width: 80px;
          height: 112px;
          background-color: rgba(255, 255, 255, 0.9);
          border: solid 2px #e0e0e0;
          border-radius: 0.5rem;
          top: 50%;
          left: 50%;
          transform-origin: center center;
          animation: animateBrightness 20s linear infinite;
          transition-duration: 200ms;
          will-change: transform, filter;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(5px);
          overflow: hidden;          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          text-align: center;
        }

        .card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .card-content p {
          margin: 6px 0 0;
          font-size: 10px;
          font-weight: 500;
          color: #333;
          line-height: 1;
        }

        .card-icon {
          max-width: 40px;
          max-height: 40px;
          object-fit: contain;
        }

        .icon {
          font-size: 24px;
          margin-bottom: 4px;
          font-style: normal;
        }

        .card-3d:hover {
          animation-play-state: paused !important;
        }

        .card-3d:hover div {
          animation-play-state: paused !important;
        }

        .card-3d div:nth-child(1) {
          transform: translate(-50%, -50%) rotateY(0deg) translateZ(150px);
          animation-delay: -0s;
        }

        .card-3d div:nth-child(2) {
          transform: translate(-50%, -50%) rotateY(36deg) translateZ(150px);
          animation-delay: -2s;
        }

        .card-3d div:nth-child(3) {
          transform: translate(-50%, -50%) rotateY(72deg) translateZ(150px);
          animation-delay: -4s;
        }

        .card-3d div:nth-child(4) {
          transform: translate(-50%, -50%) rotateY(108deg) translateZ(150px);
          animation-delay: -6s;
        }

        .card-3d div:nth-child(5) {
          transform: translate(-50%, -50%) rotateY(144deg) translateZ(150px);
          animation-delay: -8s;
        }

        .card-3d div:nth-child(6) {
          transform: translate(-50%, -50%) rotateY(180deg) translateZ(150px);
          animation-delay: -10s;
        }

        .card-3d div:nth-child(7) {
          transform: translate(-50%, -50%) rotateY(216deg) translateZ(150px);
          animation-delay: -12s;
        }

        .card-3d div:nth-child(8) {
          transform: translate(-50%, -50%) rotateY(252deg) translateZ(150px);
          animation-delay: -14s;
        }

        .card-3d div:nth-child(9) {
          transform: translate(-50%, -50%) rotateY(288deg) translateZ(150px);
          animation-delay: -16s;
        }

        .card-3d div:nth-child(10) {
          transform: translate(-50%, -50%) rotateY(324deg) translateZ(150px);
          animation-delay: -18s;
        }
      `}</style>
    </div>
  );
};

export default Card3D;
