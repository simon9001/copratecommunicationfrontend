import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import './MediaCarousel.css';

const MediaCarousel = ({ items, onSelect }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="media-carousel-container">
      <button className="carousel-nav-btn left" onClick={() => scroll('left')}>
        <ChevronLeft size={24} />
      </button>
      
      <div className="carousel-track" ref={scrollRef}>
        {items.map((item, index) => (
          <div 
            key={item.MediaID || index} 
            className="carousel-item"
            onClick={() => onSelect(item)}
          >
            <img 
              src={item.ThumbnailUrl || item.MediaUrl} 
              alt={item.Title || 'Media'} 
              className="carousel-thumb"
            />
            {item.MediaType?.includes('VIDEO') && (
              <div className="play-overlay">
                <Play size={32} fill="white" />
              </div>
            )}
            <div className="carousel-item-title">{item.Title}</div>
          </div>
        ))}
      </div>

      <button className="carousel-nav-btn right" onClick={() => scroll('right')}>
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default MediaCarousel;
