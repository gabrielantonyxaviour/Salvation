'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Project, MapFilter, PROJECT_CATEGORY_COLORS } from '@/types/project';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapComponentProps {
  projects: Project[];
  selectedProject?: Project | null;
  onProjectSelect: (project: Project | null) => void;
  filters: MapFilter;
}

export default function MapComponent({
  projects,
  selectedProject,
  onProjectSelect,
  filters
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [20, 5], // Centered on Africa
      zoom: 3.2,
      pitch: 30,
      bearing: 0,
      antialias: true
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Enable 3D terrain
    map.current.on('load', () => {
      if (!map.current) return;

      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });

      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Add sky layer for better 3D effect
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Filter projects based on filters
  const filteredProjects = projects.filter((project) => {
    const categoryMatch = filters.categories.length === 0 ||
                         filters.categories.includes(project.category);
    const countryMatch = filters.countries.length === 0 ||
                        filters.countries.includes(project.location.country);
    const statusMatch = filters.statuses.length === 0 ||
                       filters.statuses.includes(project.status);

    return categoryMatch && countryMatch && statusMatch;
  });

  // Update markers when projects or filters change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for filtered projects
    filteredProjects.forEach((project) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.position = 'relative';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s ease';

      // Create pin shape
      const pin = document.createElement('div');
      pin.style.backgroundColor = PROJECT_CATEGORY_COLORS[project.category];
      pin.style.width = '100%';
      pin.style.height = '100%';
      pin.style.borderRadius = '50% 50% 50% 0';
      pin.style.border = '3px solid white';
      pin.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      pin.style.transform = 'rotate(-45deg)';
      pin.style.position = 'absolute';
      pin.style.left = '0';
      pin.style.top = '0';

      el.appendChild(pin);

      // Add pulsing animation for active/funding projects
      if (project.status === 'active' || project.status === 'funding') {
        el.style.animation = 'pulse 2s infinite';
      }

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        if (pin) {
          pin.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.5)';
        }
        el.style.zIndex = '1000';
      });

      el.addEventListener('mouseleave', () => {
        if (pin) {
          pin.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }
        el.style.zIndex = '1';
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([project.location.coordinates[1], project.location.coordinates[0]]) // [lng, lat]
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="map-popup">
              <h4 style="font-weight: 600; margin-bottom: 4px;">${project.name}</h4>
              <p style="font-size: 12px; color: #666;">${project.location.region}, ${project.location.country}</p>
            </div>`
          )
        )
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onProjectSelect(project);

        // Fly to the selected project
        map.current?.flyTo({
          center: [project.location.coordinates[1], project.location.coordinates[0]],
          zoom: 8,
          duration: 1500,
          essential: true
        });
      });

      markers.current.push(marker);
    });
  }, [filteredProjects, mapLoaded, onProjectSelect]);

  // Highlight selected project
  useEffect(() => {
    if (!selectedProject || !map.current) return;

    markers.current.forEach((marker, index) => {
      const project = filteredProjects[index];
      if (!project) return;

      const el = marker.getElement();
      const pin = el.querySelector('div') as HTMLDivElement;

      if (project.id === selectedProject.id) {
        el.style.width = '40px';
        el.style.height = '40px';
        if (pin) {
          pin.style.border = '4px solid #f97316';
        }
        el.style.zIndex = '999';
      } else {
        el.style.width = '30px';
        el.style.height = '30px';
        if (pin) {
          pin.style.border = '3px solid white';
        }
        el.style.zIndex = '1';
      }
    });
  }, [selectedProject, filteredProjects]);

  return (
    <>
      <div
        ref={mapContainer}
        className="w-full h-full"
      />
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(249, 115, 22, 0);
          }
        }

        .mapboxgl-popup-content {
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 0 8px;
        }

        .custom-marker {
          position: relative;
        }
      `}</style>
    </>
  );
}
