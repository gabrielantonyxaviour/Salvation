'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Project } from '@/types/project';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface HeatMapWidgetProps {
  projects: Project[];
}

export default function HeatMapWidget({ projects }: HeatMapWidgetProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const router = useRouter();
  const rotationRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [20, 5], // Centered on Africa
      zoom: 2.8,
      pitch: 45,
      bearing: 0,
      interactive: false,
      antialias: true
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add terrain
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });

      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });

      // Add sky layer
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 5
        }
      });

      // Create heat map data from projects
      const features = projects.map(project => ({
        type: 'Feature' as const,
        properties: {
          intensity: Math.random() * 0.5 + 0.5
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [project.location.coordinates[1], project.location.coordinates[0]] // [lng, lat]
        }
      }));

      // Add heat map source
      map.current.addSource('projects-heat', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      // Add heat map layer with orange theme
      map.current.addLayer({
        id: 'projects-heat-layer',
        type: 'heatmap',
        source: 'projects-heat',
        maxzoom: 15,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            1, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.8,
            15, 3
          ],
          // Orange color ramp matching the Salvation theme
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 0, 0)',
            0.2, 'rgba(249, 115, 22, 0.2)', // orange-500
            0.4, 'rgba(249, 115, 22, 0.4)',
            0.6, 'rgba(249, 115, 22, 0.6)',
            0.8, 'rgba(251, 146, 60, 0.8)', // orange-400
            1, 'rgba(234, 88, 12, 1)' // orange-600
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 20,
            15, 50
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            15, 0.8
          ]
        }
      });

      // Add glowing circle layer
      map.current.addLayer({
        id: 'projects-point',
        type: 'circle',
        source: 'projects-heat',
        minzoom: 7,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 2,
            15, 8
          ],
          'circle-color': '#f97316', // orange-500
          'circle-opacity': 0.8,
          'circle-blur': 1
        }
      });

      setMapLoaded(true);
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.current?.remove();
      map.current = null;
    };
  }, [projects]);

  // Auto-rotation effect
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const rotateCamera = () => {
      if (!map.current) return;

      rotationRef.current = (rotationRef.current + 0.3) % 360;
      map.current.setBearing(rotationRef.current);
      animationRef.current = requestAnimationFrame(rotateCamera);
    };

    const timeout = setTimeout(() => {
      rotateCamera();
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mapLoaded]);

  const uniqueCountries = new Set(projects.map(p => p.location.country)).size;

  return (
    <div
      className="relative w-full h-[500px] md:h-[600px] cursor-pointer group overflow-hidden rounded-2xl"
      onClick={() => router.push('/map')}
    >
      <div ref={mapContainer} className="w-full h-full" />

      {/* Overlay with text */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
              Infrastructure Across Africa
            </h3>
            <p className="text-xl md:text-2xl mb-6 text-white/90 drop-shadow-md">
              {projects.length} active projects across {uniqueCountries} countries
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30 transition-all pointer-events-auto group-hover:scale-110 group-hover:shadow-orange-500/50">
              <span className="text-white font-medium">
                Explore Impact Map
              </span>
              <svg
                className="w-5 h-5 text-white transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Dark gradient overlay for better text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)'
        }}
      />
    </div>
  );
}
