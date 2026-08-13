import React, { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import './VRPlayer.css'

const VRPlayer = ({ media, onClose }) => {
  const [aframeLoaded, setAframeLoaded] = useState(() => typeof window !== 'undefined' && !!window.AFRAME)

  const isVR = media?.MediaType === '360_VIDEO' || media?.MediaType === '360_IMAGE'

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    if (isVR && !window.AFRAME) {
      const existingScript = document.getElementById('aframe-script')
      if (existingScript) {
        existingScript.addEventListener('load', () => setAframeLoaded(true))
      } else {
        const script = document.createElement('script')
        script.id = 'aframe-script'
        script.src = 'https://aframe.io/releases/1.6.0/aframe.min.js'
        script.onload = () => setAframeLoaded(true)
        document.head.appendChild(script)
      }
    }
  }, [isVR])

  if (!media) return null

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
            aframeLoaded ? (
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', gap: '12px' }}>
                <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading 360° VR Engine...</span>
              </div>
            )
          ) : media.MediaType === 'VIDEO' ? (
            <video className="standard-video" src={media.MediaUrl} controls autoPlay></video>
          ) : (
            <img className="standard-image" src={media.MediaUrl} alt={media.Title} />
          )}
        </div>
      </div>
    </div>
  )
}

export default VRPlayer
