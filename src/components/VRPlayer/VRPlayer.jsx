import React, { useEffect } from 'react';
import 'aframe';
import { X } from 'lucide-react';
import './VRPlayer.css';

const VRPlayer = ({ media, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!media) return null;

  const isVR = media.MediaType === '360_VIDEO' || media.MediaType === '360_IMAGE';

  return (
    <div className="vr-player-modal">
      <div className="vr-player-backdrop" onClick={onClose}></div>
      <div className="vr-player-content">
        <div className="vr-player-header">
          <h3 className="vr-player-title">{media.Title || 'Media Viewer'}</h3>
          <button className="vr-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="vr-player-container">
          {isVR ? (
            <a-scene embedded className="aframe-scene">
              <a-assets>
                {media.MediaType === '360_VIDEO' ? (
                   <video id="vr-video" src={media.MediaUrl} crossOrigin="anonymous" autoPlay loop playsInline webkit-playsinline></video>
                ) : (
                   <img id="vr-image" src={media.MediaUrl} crossOrigin="anonymous" alt="360 View" />
                )}
              </a-assets>

              {media.MediaType === '360_VIDEO' ? (
                <a-videosphere src="#vr-video" rotation="0 -90 0"></a-videosphere>
              ) : (
                <a-sky src="#vr-image" rotation="0 -90 0"></a-sky>
              )}
              
              <a-entity camera look-controls></a-entity>
            </a-scene>
          ) : media.MediaType === 'VIDEO' ? (
            <video className="standard-video" src={media.MediaUrl} controls autoPlay></video>
          ) : (
            <img className="standard-image" src={media.MediaUrl} alt={media.Title} />
          )}
        </div>
      </div>
    </div>
  );
};

export default VRPlayer;
