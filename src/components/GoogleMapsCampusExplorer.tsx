import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Navigation,
  Layers,
  MapPin,
  AlertCircle,
  Compass,
  CheckCircle2,
  BookOpen,
  Users,
  ShieldCheck,
  Building2,
  Info
} from 'lucide-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  VERIFIED_CAMPUS_BLOCKS,
  NON_GEOGRAPHIC_CRD_BLOCK,
  getVerifiedBlockByNameOrId,
  CAMPUS_SURVEY_BOUNDARY,
  CAMPUS_PERIMETER_POLYGON,
  CAMPUS_RESTRICTION_BOUNDS
} from '../data/verifiedCampusBlocks';
import type { VerifiedCampusBlock } from '../data/verifiedCampusBlocks';
import {
  searchFaculty,
  FACULTY_MSRIT_DATA
} from '../data/facultyData';
import type { MSRITFacultyRecord } from '../data/facultyData';
import { getFacultyLiveStatus } from '../data/statusEngine';
import { useTimeContext } from '../context/TimeContext';
import { LIBRARIES, searchLibraries, getLibraryOccupancyDetails } from '../data/libraryData';

declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
  }
}

let isGoogleMapsLoaderConfigured = false;

interface GoogleMapsCampusExplorerProps {
  initialNodeId?: string | null;
}

type MapTypeOption = 'satellite' | 'hybrid' | 'roadmap';
export type MapErrorState = 'NONE' | 'MISSING_KEY' | 'REFERER_NOT_ALLOWED' | 'API_NOT_ENABLED' | 'LOAD_FAILED';

export interface PlacedBlockCard {
  block: VerifiedCampusBlock;
  anchorX: number;
  anchorY: number;
  cardX: number;
  cardY: number;
  width: number;
  height: number;
  edgeX: number;
  edgeY: number;
  needsLeaderLine: boolean;
  occupancyPercent: number;
}

/**
 * Geometric calculation of line-rectangle intersection:
 * Computes exact intersection point on the card bounding box facing the anchor point.
 */
function getCardEdgeIntersection(
  centerX: number,
  centerY: number,
  halfW: number,
  halfH: number,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const dx = targetX - centerX;
  const dy = targetY - centerY;

  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
    return { x: centerX, y: centerY + halfH };
  }

  const scaleX = Math.abs(dx) > 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale
  };
}

/**
 * Iterative Collision Avoidance Engine for Map Labels:
 * Takes projected pixel anchors from the Google Maps projection,
 * iteratively separates overlapping cards, enforces boundary padding,
 * and calculates connector lines from displaced cards to polygon center anchors.
 */
function computeCollisionFreeLabels(
  items: Array<{ block: VerifiedCampusBlock; anchorX: number; anchorY: number }>,
  containerWidth: number,
  containerHeight: number,
  getOccupancy: (block: VerifiedCampusBlock) => number
): PlacedBlockCard[] {
  if (containerWidth <= 0 || containerHeight <= 0 || items.length === 0) return [];

  const isMobile = containerWidth < 640;
  const cardWidth = isMobile ? 134 : 162;
  const cardHeight = isMobile ? 40 : 44;
  const halfW = cardWidth / 2;
  const halfH = cardHeight / 2;
  const minGapX = isMobile ? 10 : 14;
  const minGapY = isMobile ? 10 : 14;
  const padding = 16;

  // Initial cards at their polygon center anchors
  const cards = items.map((item) => ({
    block: item.block,
    anchorX: item.anchorX,
    anchorY: item.anchorY,
    x: item.anchorX,
    y: item.anchorY,
    width: cardWidth,
    height: cardHeight,
    occupancyPercent: getOccupancy(item.block)
  }));

  // Filter out cards that are far off the screen viewport
  const visibleCards = cards.filter(
    (c) =>
      c.anchorX >= -120 &&
      c.anchorX <= containerWidth + 120 &&
      c.anchorY >= -120 &&
      c.anchorY <= containerHeight + 120
  );

  // Iterative relaxation passes
  const iterations = 36;
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < visibleCards.length; i++) {
      for (let j = i + 1; j < visibleCards.length; j++) {
        const c1 = visibleCards[i];
        const c2 = visibleCards[j];

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;

        const targetDistX = cardWidth + minGapX;
        const targetDistY = cardHeight + minGapY;

        if (Math.abs(dx) < targetDistX && Math.abs(dy) < targetDistY) {
          const overlapX = targetDistX - Math.abs(dx);
          const overlapY = targetDistY - Math.abs(dy);

          if (overlapY < overlapX * 0.85) {
            const shift = (overlapY / 2) * 0.55;
            const sign = dy >= 0 ? 1 : -1;
            c1.y -= shift * sign;
            c2.y += shift * sign;
          } else {
            const shift = (overlapX / 2) * 0.55;
            const sign = dx >= 0 ? 1 : -1;
            c1.x -= shift * sign;
            c2.x += shift * sign;
          }
        }
      }
    }

    // Spring attraction to original anchor & clamping to viewport
    for (let i = 0; i < visibleCards.length; i++) {
      const c = visibleCards[i];
      c.x += (c.anchorX - c.x) * 0.08;
      c.y += (c.anchorY - c.y) * 0.08;

      c.x = Math.max(halfW + padding, Math.min(containerWidth - halfW - padding, c.x));
      c.y = Math.max(halfH + padding, Math.min(containerHeight - halfH - padding, c.y));
    }
  }

  // Calculate connector line intersections
  return visibleCards.map((c) => {
    const distToAnchor = Math.hypot(c.x - c.anchorX, c.y - c.anchorY);
    const needsLeaderLine = distToAnchor > 12;
    const edge = getCardEdgeIntersection(c.x, c.y, halfW, halfH, c.anchorX, c.anchorY);

    return {
      block: c.block,
      anchorX: c.anchorX,
      anchorY: c.anchorY,
      cardX: c.x,
      cardY: c.y,
      width: c.width,
      height: c.height,
      edgeX: edge.x,
      edgeY: edge.y,
      needsLeaderLine,
      occupancyPercent: c.occupancyPercent
    };
  });
}

export const GoogleMapsCampusExplorer: React.FC<GoogleMapsCampusExplorerProps> = ({
  initialNodeId
}) => {
  const [customApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('campus_pulse_gmaps_key') || '';
    }
    return '';
  });
  const [keyInput, setKeyInput] = useState<string>('');

  const rawApiKey = customApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const apiKey = typeof rawApiKey === 'string' ? rawApiKey.trim() : '';

  const isApiKeyConfigured = Boolean(
    apiKey &&
    apiKey !== '' &&
    apiKey !== 'YOUR_REAL_GOOGLE_MAPS_API_KEY' &&
    apiKey !== 'YOUR_ACTUAL_API_KEY' &&
    !apiKey.includes('Placeholder') &&
    !apiKey.includes('YOUR_ACTUAL_API_KEY')
  );

  const [mapError, setMapError] = useState<MapErrorState>(
    isApiKeyConfigured ? 'NONE' : 'MISSING_KEY'
  );

  const handleApplyKey = (newKey: string) => {
    const trimmed = newKey.trim();
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('campus_pulse_gmaps_key', trimmed);
      } else {
        localStorage.removeItem('campus_pulse_gmaps_key');
      }
      window.location.reload();
    }
  };

  // Map settings
  const [mapType, setMapType] = useState<MapTypeOption>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBlock, setActiveBlock] = useState<VerifiedCampusBlock | null>(null);
  const [isCrdSelected, setIsCrdSelected] = useState<boolean>(false);
  const [selectedFacultyMember, setSelectedFacultyMember] = useState<MSRITFacultyRecord | null>(null);
  const [placesSearchResults, setPlacesSearchResults] = useState<any[]>([]);

  // Projected non-overlapping labels
  const [projectedLabels, setProjectedLabels] = useState<PlacedBlockCard[]>([]);

  const { currentTime, simulatedTime } = useTimeContext();

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const overlayViewRef = useRef<any>(null);
  const polygonsRef = useRef<{ [key: string]: any }>({});
  const placesServiceRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const activeBlockRef = useRef<VerifiedCampusBlock | null>(activeBlock);
  const isCrdSelectedRef = useRef<boolean>(isCrdSelected);
  const handleSelectBlockRef = useRef<(block: VerifiedCampusBlock) => void>(() => {});

  useEffect(() => {
    activeBlockRef.current = activeBlock;
    isCrdSelectedRef.current = isCrdSelected;
  }, [activeBlock, isCrdSelected]);

  // Dynamic Occupancy Calculator for verified blocks
  const getBlockOccupancy = useCallback((block: VerifiedCampusBlock): number => {
    // Check if there is an associated library
    if (block.libraries && block.libraries.length > 0) {
      const libName = block.libraries[0];
      const lib = LIBRARIES.find((l) => l.name.toLowerCase().includes(libName.toLowerCase()) || libName.toLowerCase().includes(l.name.toLowerCase()));
      if (lib) {
        const details = getLibraryOccupancyDetails(lib, simulatedTime);
        return details.percentageEquivalent;
      }
    }
    // Time-based slight variation for active campus realism
    const hour = simulatedTime.enabled ? simulatedTime.hour : currentTime.getHours();
    if (hour < 8 || hour >= 20) return Math.min(15, Math.round(block.baseOccupancy * 0.2));
    if (hour >= 11 && hour <= 15) return Math.min(95, Math.round(block.baseOccupancy * 1.15));
    return block.baseOccupancy;
  }, [simulatedTime, currentTime]);

  // Recalculate projected pixel positions from Google Maps projection
  const updateProjectedLabels = useCallback(() => {
    if (!overlayViewRef.current || !mapContainerRef.current || !window.google?.maps?.LatLng) return;
    const projection = overlayViewRef.current.getProjection();
    if (!projection) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const items = VERIFIED_CAMPUS_BLOCKS.map((block) => {
      const latLng = new window.google.maps.LatLng(block.center.lat, block.center.lng);
      const pixel = projection.fromLatLngToContainerPixel(latLng);
      return {
        block,
        anchorX: pixel.x,
        anchorY: pixel.y
      };
    });

    const nonOverlapping = computeCollisionFreeLabels(items, rect.width, rect.height, getBlockOccupancy);
    setProjectedLabels(nonOverlapping);
  }, [getBlockOccupancy]);

  // 1. Google Maps Error Handling
  useEffect(() => {
    const prevGmAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      setMapError((current) => {
        if (current === 'NONE' || current === 'LOAD_FAILED') {
          return 'REFERER_NOT_ALLOWED';
        }
        return current;
      });
      if (typeof prevGmAuthFailure === 'function') {
        prevGmAuthFailure();
      }
    };

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const fullText = args
        .map((a) => {
          if (typeof a === 'string') return a;
          if (a instanceof Error) return a.message + ' ' + (a.stack || '');
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(' ');

      if (fullText.includes('RefererNotAllowedMapError') || fullText.includes('referer-not-allowed')) {
        setMapError('REFERER_NOT_ALLOWED');
      } else if (fullText.includes('ApiNotActivatedMapError') || fullText.includes('api-not-activated')) {
        setMapError('API_NOT_ENABLED');
      }

      originalConsoleError.apply(console, args);
    };

    return () => {
      window.gm_authFailure = prevGmAuthFailure;
      console.error = originalConsoleError;
    };
  }, []);

  // 2. Initialize Google Maps JS API and draw the exact 8 building polygons
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!isApiKeyConfigured) {
      setMapError('MISSING_KEY');
      return;
    }

    try {
      if (!isGoogleMapsLoaderConfigured && !window.google?.maps) {
        setOptions({
          key: apiKey,
          v: 'weekly'
        });
        isGoogleMapsLoaderConfigured = true;
      }

      Promise.all([
        importLibrary('maps'),
        importLibrary('places').catch(() => null)
      ])
        .then(([maps]) => {
          if (!mapContainerRef.current) return;
          const google = window.google;

          // A. Calculate Bounds from Official Campus Survey Restriction Coordinates
          const campusBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(CAMPUS_RESTRICTION_BOUNDS.south, CAMPUS_RESTRICTION_BOUNDS.west),
            new google.maps.LatLng(CAMPUS_RESTRICTION_BOUNDS.north, CAMPUS_RESTRICTION_BOUNDS.east)
          );

          // B. Instantiate Google Map with Strict Boundary Restriction
          const map = new maps.Map(mapContainerRef.current, {
            center: campusBounds.getCenter(),
            zoom: 18,
            minZoom: 17,
            maxZoom: 21,
            restriction: {
              latLngBounds: CAMPUS_RESTRICTION_BOUNDS,
              strictBounds: true,
            },
            mapTypeId: 'satellite',
            fullscreenControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi.school',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#DC2626' }]
              }
            ]
          });

          googleMapInstanceRef.current = map;
          infoWindowRef.current = new google.maps.InfoWindow();

          // C. Fit Bounds to encompass full campus boundary
          map.fitBounds(campusBounds, { top: 30, right: 30, bottom: 30, left: 30 });

          // Clamping center listener to strictly prevent panning beyond survey perimeter
          map.addListener('center_changed', () => {
            const center = map.getCenter();
            if (!center) return;
            const lat = center.lat();
            const lng = center.lng();
            let clampedLat = lat;
            let clampedLng = lng;
            if (lat > CAMPUS_RESTRICTION_BOUNDS.north) clampedLat = CAMPUS_RESTRICTION_BOUNDS.north;
            if (lat < CAMPUS_RESTRICTION_BOUNDS.south) clampedLat = CAMPUS_RESTRICTION_BOUNDS.south;
            if (lng > CAMPUS_RESTRICTION_BOUNDS.east) clampedLng = CAMPUS_RESTRICTION_BOUNDS.east;
            if (lng < CAMPUS_RESTRICTION_BOUNDS.west) clampedLng = CAMPUS_RESTRICTION_BOUNDS.west;
            if (clampedLat !== lat || clampedLng !== lng) {
              map.setCenter({ lat: clampedLat, lng: clampedLng });
            }
          });

          // Draw Official Survey Perimeter Polygon (TL -> TR -> BR -> BL -> TL)
          const campusPerimeter = new google.maps.Polygon({
            paths: CAMPUS_PERIMETER_POLYGON,
            strokeColor: '#DC2626',
            strokeOpacity: 0.95,
            strokeWeight: 2,
            fillColor: '#DC2626',
            fillOpacity: 0.03,
            clickable: false,
            zIndex: 5
          });
          campusPerimeter.setMap(map);

          // D. Create EXACT Building Polygons (TL -> TR -> BR -> BL -> TL)
          VERIFIED_CAMPUS_BLOCKS.forEach((block) => {
            const polygon = new google.maps.Polygon({
              paths: block.polygon,
              strokeColor: block.strokeColor,
              strokeOpacity: 0.95,
              strokeWeight: 2.5,
              fillColor: block.fillColor,
              fillOpacity: 0.35,
              clickable: true,
              zIndex: 10
            });

            polygon.setMap(map);

            // Hover interactions
            polygon.addListener('mouseover', () => {
              if (block.id !== activeBlockRef.current?.id) {
                polygon.setOptions({ fillOpacity: 0.55, strokeWeight: 3 });
              }
            });

            polygon.addListener('mouseout', () => {
              if (block.id !== activeBlockRef.current?.id) {
                polygon.setOptions({ fillOpacity: 0.35, strokeWeight: 2.5 });
              }
            });

            // Click interaction (toggle select / deselect)
            polygon.addListener('click', () => {
              if (handleSelectBlockRef.current) {
                handleSelectBlockRef.current(block);
              }
            });

            polygonsRef.current[block.id] = polygon;
          });

          // E. Setup Custom OverlayView for Dynamic Label Synchronization & Collision Avoidance
          class BuildingOverlayView extends google.maps.OverlayView {
            onAdd() {}
            draw() {
              updateProjectedLabels();
            }
            onRemove() {}
          }

          const overlay = new BuildingOverlayView();
          overlay.setMap(map);
          overlayViewRef.current = overlay;

          // Event listeners for recalculating labels during zoom/pan/drag
          map.addListener('bounds_changed', updateProjectedLabels);
          map.addListener('zoom_changed', updateProjectedLabels);
          map.addListener('idle', updateProjectedLabels);

          // PlacesService setup for search
          if (google.maps.places && google.maps.places.PlacesService) {
            placesServiceRef.current = new google.maps.places.PlacesService(map);
          }

          // Error box observation
          const observer = new MutationObserver(() => {
            const hasErrorBox = mapContainerRef.current?.querySelector('.gm-err-container, .gm-err-message');
            if (hasErrorBox) {
              setMapError((current) => (current === 'NONE' ? 'REFERER_NOT_ALLOWED' : current));
            }
          });
          observer.observe(mapContainerRef.current, { childList: true, subtree: true });
        })
        .catch((err: unknown) => {
          console.error('Failed to load Google Maps API:', err);
          const errString = String(err);
          if (errString.includes('RefererNotAllowedMapError')) {
            setMapError('REFERER_NOT_ALLOWED');
          } else if (errString.includes('ApiNotActivatedMapError')) {
            setMapError('API_NOT_ENABLED');
          } else {
            setMapError((current) => (current === 'NONE' ? 'LOAD_FAILED' : current));
          }
        });
    } catch (err: unknown) {
      console.error('Google Maps initialization error:', err);
      setMapError((current) => (current === 'NONE' ? 'LOAD_FAILED' : current));
    }
  }, [apiKey, isApiKeyConfigured]);

  // Window resize listener to recompute labels
  useEffect(() => {
    window.addEventListener('resize', updateProjectedLabels);
    return () => window.removeEventListener('resize', updateProjectedLabels);
  }, [updateProjectedLabels]);

  // Highlight active polygon when selection changes
  useEffect(() => {
    Object.entries(polygonsRef.current).forEach(([blockId, poly]) => {
      const block = VERIFIED_CAMPUS_BLOCKS.find((b) => b.id === blockId);
      if (!block) return;

      if (!isCrdSelected && activeBlock && block.id === activeBlock.id) {
        poly.setOptions({
          strokeColor: '#111111',
          strokeWeight: 4,
          fillOpacity: 0.65,
          zIndex: 25
        });
      } else {
        poly.setOptions({
          strokeColor: block.strokeColor,
          strokeWeight: 2.5,
          fillOpacity: 0.35,
          zIndex: 10
        });
      }
    });
  }, [activeBlock, isCrdSelected]);

  // Map type synchronization
  useEffect(() => {
    if (googleMapInstanceRef.current && window.google?.maps) {
      const gMaps = window.google.maps;
      switch (mapType) {
        case 'hybrid':
          googleMapInstanceRef.current.setMapTypeId(gMaps.MapTypeId.HYBRID);
          break;
        case 'roadmap':
          googleMapInstanceRef.current.setMapTypeId(gMaps.MapTypeId.ROADMAP);
          break;
        default:
          googleMapInstanceRef.current.setMapTypeId(gMaps.MapTypeId.SATELLITE);
          break;
      }
    }
  }, [mapType]);

  // Deselect all blocks and return to overall campus view
  const handleDeselectAll = useCallback(() => {
    setActiveBlock(null);
    setIsCrdSelected(false);
    setSelectedFacultyMember(null);

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    if (googleMapInstanceRef.current && window.google?.maps) {
      const campusBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(CAMPUS_RESTRICTION_BOUNDS.south, CAMPUS_RESTRICTION_BOUNDS.west),
        new window.google.maps.LatLng(CAMPUS_RESTRICTION_BOUNDS.north, CAMPUS_RESTRICTION_BOUNDS.east)
      );
      googleMapInstanceRef.current.fitBounds(campusBounds, { top: 30, right: 30, bottom: 30, left: 30 });
    }
  }, []);

  // Handle Selection of a Verified Campus Block with Toggle Deselect
  const handleSelectBlock = useCallback((block: VerifiedCampusBlock) => {
    if (activeBlockRef.current?.id === block.id && !isCrdSelectedRef.current) {
      // Already selected: Deselect and return to overall campus view
      handleDeselectAll();
      return;
    }

    setActiveBlock(block);
    setIsCrdSelected(false);
    setSelectedFacultyMember(null);

    if (googleMapInstanceRef.current && window.google?.maps) {
      const targetLatLng = new window.google.maps.LatLng(block.center.lat, block.center.lng);
      googleMapInstanceRef.current.panTo(targetLatLng);

      // Open InfoWindow on map
      const occ = getBlockOccupancy(block);
      const content = `
        <div style="font-family: monospace; padding: 6px; max-width: 280px; color: #111111;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; background: ${block.fillColor}; color: ${block.fillColor === '#FFFFFF' ? '#111' : '#fff'}; border: 1px solid #111;">
              ${block.colorName.toUpperCase()} BLOCK
            </span>
            <span style="font-size: 11px; font-weight: bold; color: #DC2626;">${occ}% OCCUPANCY</span>
          </div>
          <div style="font-weight: 800; font-size: 15px; text-transform: uppercase;">
            ${block.displayName}
          </div>
          <div style="font-size: 9px; color: #666; margin-top: 3px;">
            (Click block again to deselect & view overall campus)
          </div>
          ${block.libraries.length > 0 ? `
            <div style="margin-top: 6px; font-size: 10px; padding: 4px 6px; background: #FEF2F2; border-left: 3px solid #DC2626;">
              <strong>LIBRARY:</strong> ${block.libraries.join(', ')}
            </div>
          ` : ''}
          ${block.departments.length > 0 ? `
            <div style="margin-top: 4px; font-size: 10px; color: #555;">
              DEPARTMENTS: <strong>${block.departments.join(', ')}</strong>
            </div>
          ` : ''}
        </div>
      `;

      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.setPosition(targetLatLng);
        infoWindowRef.current.open(googleMapInstanceRef.current);
      }
    }
  }, [getBlockOccupancy, handleDeselectAll]);

  useEffect(() => {
    handleSelectBlockRef.current = handleSelectBlock;
  }, [handleSelectBlock]);

  // Handle external selection
  useEffect(() => {
    if (initialNodeId) {
      const block = getVerifiedBlockByNameOrId(initialNodeId);
      if (block) {
        handleSelectBlock(block);
      }
    }
  }, [initialNodeId, handleSelectBlock]);

  // Handle Selection of Non-Geographic CRD Block
  const handleSelectCrd = () => {
    if (isCrdSelected) {
      handleDeselectAll();
      return;
    }
    setIsCrdSelected(true);
    setActiveBlock(null);
    setSelectedFacultyMember(null);
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  };

  // Get Faculty associated with active block or entire campus
  const getAssociatedFaculty = (): MSRITFacultyRecord[] => {
    if (isCrdSelected) {
      return FACULTY_MSRIT_DATA.filter(
        (f: MSRITFacultyRecord) => f.department === 'CSE AIML' || f.department === 'CSE CY'
      );
    }

    if (!activeBlock) {
      return FACULTY_MSRIT_DATA;
    }

    if (activeBlock.id === 'lhc') {
      return FACULTY_MSRIT_DATA.filter((f: MSRITFacultyRecord) => {
        const d = f.department.toUpperCase();
        return (
          d === 'CSE' ||
          d === 'ISE' ||
          d === 'ECE' ||
          d === 'ET' ||
          d === 'EI' ||
          d === 'ME' ||
          d.includes('MEDICAL ELECTRONICS')
        );
      });
    }

    if (activeBlock.id === 'esb') {
      return FACULTY_MSRIT_DATA.filter((f: MSRITFacultyRecord) => {
        const d = f.department.toUpperCase();
        return d === 'CV' || d === 'CIVIL' || d === 'INDUSTRIAL' || d === 'BIOTECH';
      });
    }

    return [];
  };

  // Search Places / Faculty / Blocks
  useEffect(() => {
    if (!searchQuery.trim() || !placesServiceRef.current || !window.google?.maps) {
      setPlacesSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const center = VERIFIED_CAMPUS_BLOCKS[0].center;
      placesServiceRef.current.textSearch(
        {
          query: `${searchQuery} MSRIT Ramaiah Institute of Technology Bengaluru`,
          location: new window.google.maps.LatLng(center.lat, center.lng),
          radius: 800
        },
        (results: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPlacesSearchResults(results.slice(0, 3));
          } else {
            setPlacesSearchResults([]);
          }
        }
      );
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResultsFaculty = searchQuery.trim() ? searchFaculty(searchQuery) : [];
  const searchResultsLibraries = searchQuery.trim() ? searchLibraries(searchQuery) : [];
  const searchResultsBlocks = searchQuery.trim()
    ? VERIFIED_CAMPUS_BLOCKS.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.departments.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const overallCampusOccupancy = Math.round(
    VERIFIED_CAMPUS_BLOCKS.reduce((sum, b) => sum + getBlockOccupancy(b), 0) / VERIFIED_CAMPUS_BLOCKS.length
  );

  const associatedFaculty = getAssociatedFaculty();
  const currentBlockOccupancy = activeBlock ? getBlockOccupancy(activeBlock) : overallCampusOccupancy;

  // Associated library for active block
  const activeBlockLibrary = (activeBlock && activeBlock.libraries.length > 0)
    ? LIBRARIES.find((l) => l.name.toLowerCase().includes(activeBlock.libraries[0].toLowerCase()))
    : null;
  const activeLibDetails = activeBlockLibrary
    ? getLibraryOccupancyDetails(activeBlockLibrary, simulatedTime)
    : null;

  return (
    <section id="sec-map" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div id="sec-map-explore" className="max-w-[1700px] mx-auto space-y-10">
        
        {/* Section Header Breadcrumb */}
        <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#DC2626]" />
            <span>SECTION 04 // REAL GOOGLE MAPS GEOGRAPHIC CAMPUS EXPLORER</span>
          </div>
          <div className="flex items-center gap-2 text-[#111111] bg-white px-3 py-1.5 border border-[#111111]/15 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              EXACT 4-CORNER GEOMETRY // 8 VERIFIED CAMPUS BLOCKS // NO FAKE COORDINATES
            </span>
          </div>
        </div>

        {/* Section Title & Map Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <h2 className="text-4xl sm:text-6xl font-syne text-[#111111] font-extrabold uppercase tracking-tighter leading-none">
              CAMPUS
            </h2>
            <h2 className="text-4xl sm:text-6xl font-syne text-[#DC2626] font-extrabold uppercase tracking-tighter leading-none">
              BLOCK MAP.
            </h2>
            <p className="font-mono text-xs text-[#666660] mt-3">
              Real Google Maps JavaScript API satellite layer • Exact survey corner coordinates • Collision-free polygon label cards
            </p>
          </div>

          <div className="lg:col-span-5 space-y-3 font-mono text-xs lg:text-right">
            {/* Google Map Type Switcher */}
            <div className="flex items-center lg:justify-end gap-2">
              <Layers className="w-4 h-4 text-[#DC2626]" />
              <span className="text-[#666660] uppercase font-bold">MAP TYPE:</span>
              <div className="flex border border-[#111111]/20 bg-white">
                {(['satellite', 'hybrid', 'roadmap'] as MapTypeOption[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setMapType(t)}
                    className={`px-3 py-1 text-[11px] uppercase font-bold transition-all ${
                      mapType === t
                        ? 'bg-[#111111] text-white'
                        : 'text-[#666660] hover:text-[#DC2626]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#888880]">
              PROJECTION: Real WGS-84 Geographic Coordinates (Lat, Lng)
            </div>
          </div>
        </div>

        {/* Quick Selection Bar for Overall Campus + 8 Blocks + CRD Reference */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 font-mono text-xs border-b border-[#111111]/10 no-scrollbar">
            <span className="text-[#666660] font-bold uppercase shrink-0 pr-2">CAMPUS VIEW:</span>

            {/* Overall Campus View Button */}
            <button
              onClick={handleDeselectAll}
              title={!activeBlock && !isCrdSelected ? 'Overall campus view is active' : 'Click to deselect block and view overall campus'}
              className={`px-3 py-1.5 uppercase transition-all shrink-0 font-bold border flex items-center gap-2 ${
                !activeBlock && !isCrdSelected
                  ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                  : 'bg-white text-[#111111] border-[#111111]/20 hover:border-[#DC2626]'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${!activeBlock && !isCrdSelected ? 'text-red-400' : 'text-[#DC2626]'}`} />
              <span>OVERALL CAMPUS</span>
              <span className={`text-[10px] ${!activeBlock && !isCrdSelected ? 'text-[#FCA5A5]' : 'text-[#DC2626]'}`}>
                {overallCampusOccupancy}%
              </span>
            </button>

            {VERIFIED_CAMPUS_BLOCKS.map((block) => {
              const isSelected = !isCrdSelected && activeBlock?.id === block.id;
              const occ = getBlockOccupancy(block);
              return (
                <button
                  key={block.id}
                  onClick={() => handleSelectBlock(block)}
                  title={isSelected ? `Selected: ${block.displayName}. Click again to deselect.` : `Click to select ${block.displayName}`}
                  className={`px-3 py-1.5 uppercase transition-all shrink-0 font-bold border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#111111] text-white border-[#DC2626] shadow-xs ring-1 ring-[#DC2626]'
                      : 'bg-white text-[#111111] border-[#111111]/20 hover:border-[#DC2626]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-black/30"
                    style={{ backgroundColor: block.fillColor }}
                  />
                  <span>{block.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-[#FCA5A5]' : 'text-[#DC2626]'}`}>
                    {occ}%
                  </span>
                </button>
              );
            })}

            {/* Non-Geographic CRD Block Button */}
            <button
              onClick={handleSelectCrd}
              title={isCrdSelected ? 'CRD selected. Click again to deselect.' : 'Click to select CRD'}
              className={`px-3 py-1.5 uppercase transition-all shrink-0 font-bold border flex items-center gap-2 ${
                isCrdSelected
                  ? 'bg-[#111111] text-white border-[#DC2626] shadow-xs'
                  : 'bg-white text-[#666660] border-dashed border-[#111111]/40 hover:border-[#111111]'
              }`}
            >
              <span className="w-2 h-2 rounded-full border border-gray-400 bg-gray-300" />
              <span>CRD (NON-GEOGRAPHIC)</span>
            </button>
          </div>

          {/* Color Legend & Scheme */}
          <div className="flex items-center gap-4 overflow-x-auto text-[10px] font-mono text-[#666660] py-1 no-scrollbar">
            <span className="font-bold text-[#111111] uppercase shrink-0">CAMPUS PULSE COLOR SPECIFICATION:</span>
            <span className="inline-flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black/30" /> LHC → Yellow</span>
            <span className="inline-flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-black/30" /> DES → Orange</span>
            <span className="inline-flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-black/30" /> Apex → Cyan</span>
            <span className="inline-flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-black/30" /> Multipurpose → Purple</span>
            <span className="inline-flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-black/30" /> ESB → Red</span>
            <span className="inline-flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black/30" /> Quadrangle → Green</span>
            <span className="inline-flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-700" /> Architecture → White</span>
            <span className="inline-flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-black/30" /> Workshop → Slate</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="space-y-4 pt-2 border-t border-[#111111]/10 relative">
          <div className="relative w-full max-w-4xl">
            <Search className="w-5 h-5 text-[#666660] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty, departments, or campus blocks... (e.g. LHC, CSE, ESB Library, Dr. Yogish)"
              className="w-full bg-white border-2 border-[#111111]/20 pl-12 pr-4 py-3 text-sm font-mono text-[#111111] placeholder-[#666660] focus:outline-none focus:border-[#DC2626] transition-all shadow-xs uppercase"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPlacesSearchResults([]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#666660] hover:text-[#111111]"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 max-w-4xl bg-white border-2 border-[#111111] z-50 p-4 max-h-[380px] overflow-y-auto space-y-4 shadow-2xl font-mono text-xs">
              
              {/* Blocks Results */}
              {searchResultsBlocks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[#111111] font-bold uppercase text-[11px]">
                    CAMPUS BLOCKS ({searchResultsBlocks.length}):
                  </div>
                  <div className="space-y-1.5">
                    {searchResultsBlocks.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          handleSelectBlock(b);
                          setSearchQuery('');
                        }}
                        className="p-2.5 hover:bg-[#111111] hover:text-white cursor-pointer border border-[#111111]/10 flex justify-between items-center transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ backgroundColor: b.fillColor }} />
                          <strong className="uppercase text-xs">{b.name} — {b.displayName}</strong>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[#DC2626]">PAN MAP →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Libraries Results */}
              {searchResultsLibraries.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#111111]/10">
                  <div className="text-[#DC2626] font-bold uppercase text-[11px]">
                    CAMPUS LIBRARIES ({searchResultsLibraries.length}):
                  </div>
                  <div className="space-y-1.5">
                    {searchResultsLibraries.map((lib) => {
                      const libDetails = getLibraryOccupancyDetails(lib, simulatedTime);
                      const parentBlock = VERIFIED_CAMPUS_BLOCKS.find((b) =>
                        b.libraries.some((l) => l.toLowerCase().includes(lib.name.toLowerCase()) || lib.name.toLowerCase().includes(l.toLowerCase()))
                      );
                      return (
                        <div
                          key={lib.id}
                          onClick={() => {
                            if (parentBlock) handleSelectBlock(parentBlock);
                            setSearchQuery('');
                          }}
                          className="p-2.5 hover:bg-[#DC2626]/10 cursor-pointer border border-[#DC2626]/30 bg-red-50/20 flex justify-between items-center transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                              <strong className="text-[#111111] uppercase font-bold text-sm">{lib.name}</strong>
                              <span className="text-[10px] bg-[#111111] text-white px-1.5 py-0.5 font-mono">{lib.building} BLOCK</span>
                            </div>
                            <div className="text-[#666660] text-[11px] mt-0.5">
                              Primary: <strong className="text-[#111111]">{lib.primaryGroups.join(' • ')}</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-[#DC2626]">
                              {libDetails.isEveningPeriod ? `EST. EVENING: ${libDetails.displayOccupancy}` : !libDetails.isOpen ? 'CLOSED (0%)' : `EST. OCCUPANCY: ${libDetails.displayOccupancy}`}
                            </div>
                            <div className="text-[10px] text-[#111111] font-bold">PAN TO BLOCK →</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faculty Results */}
              {searchResultsFaculty.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#111111]/10">
                  <div className="text-[#DC2626] font-bold uppercase text-[11px]">
                    FACULTY RESULTS ({searchResultsFaculty.length}):
                  </div>
                  <div className="space-y-1.5">
                    {searchResultsFaculty.slice(0, 5).map((fac) => (
                      <div
                        key={fac.id}
                        onClick={() => {
                          const targetBlock = VERIFIED_CAMPUS_BLOCKS.find((b) =>
                            b.departments.some((d) => d.toUpperCase() === fac.department.toUpperCase())
                          ) || VERIFIED_CAMPUS_BLOCKS[0];
                          handleSelectBlock(targetBlock);
                          setSelectedFacultyMember(fac);
                          setSearchQuery('');
                        }}
                        className="p-2.5 hover:bg-[#DC2626]/10 cursor-pointer border border-[#111111]/10 flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-[#111111] uppercase block text-sm">{fac.name}</strong>
                          <span className="text-[#666660] text-[11px]">{fac.designation} • {fac.department}</span>
                        </div>
                        <div className="text-[#DC2626] font-bold text-right text-[11px]">
                          <div>CABIN: {fac.cabinLocation}</div>
                          <div className="text-[10px] text-[#111111]">SELECT BLOCK →</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Places Results */}
              {placesSearchResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#111111]/10">
                  <div className="text-emerald-700 font-bold uppercase text-[11px]">
                    GOOGLE PLACES ({placesSearchResults.length}):
                  </div>
                  <div className="space-y-1.5">
                    {placesSearchResults.map((place, idx) => (
                      <div
                        key={place.place_id || idx}
                        onClick={() => {
                          if (googleMapInstanceRef.current && place.geometry?.location) {
                            googleMapInstanceRef.current.panTo(place.geometry.location);
                            googleMapInstanceRef.current.setZoom(19);
                          }
                          setSearchQuery('');
                        }}
                        className="p-2.5 hover:bg-emerald-50 cursor-pointer border border-[#111111]/10 flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-[#111111] uppercase block text-xs">{place.name}</strong>
                          <span className="text-[#666660] text-[10px]">{place.formatted_address || 'Ramaiah Institute of Technology Campus'}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 shrink-0">VIEW ON GOOGLE MAP →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResultsBlocks.length === 0 && searchResultsLibraries.length === 0 && searchResultsFaculty.length === 0 && placesSearchResults.length === 0 && (
                <div className="text-[#666660] py-4 text-center">
                  NO RESULTS MATCHING "{searchQuery.toUpperCase()}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map and Building Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left 7 Cols: Google Maps Satellite Container with Collision-Free Overlays */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative min-h-[620px] bg-[#EAE8E1] border-2 border-[#111111]/20 overflow-hidden shadow-md">
              
              {/* Google Maps Base View */}
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

              {/* Error Overlays */}
              {mapError === 'MISSING_KEY' && (
                <div className="absolute inset-0 z-40 bg-[#F5F4EF]/95 p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-4 font-mono overflow-y-auto">
                  <AlertCircle className="w-12 h-12 text-[#DC2626] mb-1" />
                  <div className="text-xl sm:text-2xl font-syne font-bold text-[#111111] uppercase tracking-tight">
                    GOOGLE MAPS API KEY REQUIRED
                  </div>
                  <div className="text-xs text-[#666660] max-w-md space-y-2">
                    <p>
                      If you just added <code className="bg-[#111111]/10 px-1.5 py-0.5 text-[#DC2626] font-bold">VITE_GOOGLE_MAPS_API_KEY</code> to GitHub Secrets, a GitHub Actions rebuild has been triggered to update the deployment.
                    </p>
                    <p>
                      You can also activate Google Maps immediately in your browser by pasting your API key below:
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleApplyKey(keyInput);
                    }}
                    className="w-full max-w-sm flex gap-2 pt-1"
                  >
                    <input
                      type="text"
                      placeholder="Paste AIzaSy... API key"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white border-2 border-[#111111]/30 focus:border-[#DC2626] outline-none text-[#111111]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#111111] hover:bg-[#DC2626] text-white text-xs font-bold uppercase transition-colors shrink-0"
                    >
                      ACTIVATE
                    </button>
                  </form>

                  <p className="text-[10px] text-[#888880]">
                    Campus block selection, building telemetry, faculty directory, and room details remain fully functional below.
                  </p>
                </div>
              )}

              {mapError === 'REFERER_NOT_ALLOWED' && (
                <div className="absolute inset-0 z-40 bg-[#F5F4EF]/98 p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-4 font-mono overflow-y-auto">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-1">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-xl sm:text-2xl font-syne font-bold text-[#111111] uppercase tracking-tight">
                    Google Maps could not be loaded.
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-3 py-1 border border-rose-200 uppercase">
                    RefererNotAllowedMapError • HTTP Referrer Restriction
                  </div>
                  <div className="text-xs text-[#111111] max-w-lg text-left space-y-2 bg-white p-5 border border-[#111111]/15 shadow-xs">
                    <p>Your API key restricts allowed websites. Add the following to Google Cloud Console Website Restrictions:</p>
                    <code className="block bg-[#111111]/5 p-2 font-mono text-[11px] text-[#DC2626] font-bold">
                      https://techno-crat17.github.io/*<br />
                      http://localhost:5173/*
                    </code>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApplyKey('')}
                      className="px-4 py-2 border border-[#111111]/30 hover:border-[#DC2626] text-[11px] font-mono font-bold uppercase transition-all bg-white"
                    >
                      CHANGE / CLEAR KEY
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-5 py-2.5 bg-[#111111] hover:bg-[#DC2626] text-white text-xs font-mono font-bold uppercase transition-all shadow-xs"
                    >
                      RELOAD PAGE & RECHECK MAP
                    </button>
                  </div>
                </div>
              )}

              {mapError === 'API_NOT_ENABLED' && (
                <div className="absolute inset-0 z-40 bg-[#F5F4EF]/98 p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-4 font-mono overflow-y-auto">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-1">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-xl sm:text-2xl font-syne font-bold text-[#111111] uppercase tracking-tight">
                    Maps API Not Enabled
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-3 py-1 border border-rose-200 uppercase">
                    ApiNotActivatedMapError
                  </div>
                  <div className="text-xs text-[#666660] max-w-md space-y-2">
                    <p>
                      Enable the <strong>Maps JavaScript API</strong> in your Google Cloud Console project for this API key.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApplyKey('')}
                      className="px-4 py-2 border border-[#111111]/30 hover:border-[#DC2626] text-[11px] font-mono font-bold uppercase transition-all bg-white"
                    >
                      CHANGE / CLEAR KEY
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-5 py-2.5 bg-[#111111] hover:bg-[#DC2626] text-white text-xs font-mono font-bold uppercase transition-all shadow-xs"
                    >
                      RELOAD PAGE
                    </button>
                  </div>
                </div>
              )}

              {mapError === 'LOAD_FAILED' && (
                <div className="absolute inset-0 z-40 bg-[#F5F4EF]/98 p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-4 font-mono overflow-y-auto">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-1">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-xl sm:text-2xl font-syne font-bold text-[#111111] uppercase tracking-tight">
                    Map Layer Temporarily Unavailable
                  </div>
                  <div className="text-xs text-[#666660] max-w-md space-y-2">
                    <p>
                      The satellite map layer could not be connected. All campus telemetry, occupancy analytics, and faculty directories remain fully active.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApplyKey('')}
                      className="px-4 py-2 border border-[#111111]/30 hover:border-[#DC2626] text-[11px] font-mono font-bold uppercase transition-all bg-white"
                    >
                      CHANGE / CLEAR KEY
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-5 py-2.5 bg-[#111111] hover:bg-[#DC2626] text-white text-xs font-mono font-bold uppercase transition-all shadow-xs"
                    >
                      RETRY LOADING MAP
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Non-Overlapping Building Label Layer with Connector Lines */}
              <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
                {/* SVG Connector Leader Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {projectedLabels.map((card) => {
                    if (!card.needsLeaderLine) {
                      return (
                        <circle
                          key={`dot-${card.block.id}`}
                          cx={card.anchorX}
                          cy={card.anchorY}
                          r="3"
                          fill={card.block.strokeColor}
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      );
                    }
                    return (
                      <g key={`leader-${card.block.id}`}>
                        <circle
                          cx={card.anchorX}
                          cy={card.anchorY}
                          r="3.5"
                          fill={card.block.strokeColor}
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={card.anchorX}
                          y1={card.anchorY}
                          x2={card.edgeX}
                          y2={card.edgeY}
                          stroke={card.block.strokeColor}
                          strokeWidth="1.75"
                          strokeDasharray="3 3"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Building Label Cards */}
                {projectedLabels.map((card) => {
                  const isSelected = !isCrdSelected && activeBlock?.id === card.block.id;
                  return (
                    <div
                      key={`card-${card.block.id}`}
                      onClick={() => handleSelectBlock(card.block)}
                      className={`absolute pointer-events-auto cursor-pointer transition-transform duration-150 select-none ${
                        isSelected ? 'z-30 scale-105' : 'z-20 hover:scale-102 hover:z-25'
                      }`}
                      style={{
                        left: `${card.cardX}px`,
                        top: `${card.cardY}px`,
                        transform: 'translate(-50%, -50%)',
                        width: `${card.width}px`
                      }}
                      title={`${card.block.displayName} (${card.occupancyPercent}% Occupancy) - ${isSelected ? 'Click to deselect' : 'Click to select'}`}
                    >
                      <div
                        className={`px-2.5 py-1.5 border-2 shadow-md flex items-center justify-between gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#111111] text-white border-[#DC2626] ring-2 ring-[#DC2626]/30'
                            : 'bg-white/95 text-[#111111] border-[#111111]/80 hover:border-[#111111]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/30"
                            style={{ backgroundColor: card.block.fillColor }}
                          />
                          <span className="font-syne font-black text-[10px] uppercase tracking-tight truncate">
                            {card.block.name}
                          </span>
                        </div>
                        <div
                          className={`font-mono text-[10px] font-extrabold shrink-0 ${
                            isSelected ? 'text-[#FCA5A5]' : 'text-[#DC2626]'
                          }`}
                        >
                          {card.occupancyPercent}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Map Footer Info Overlay */}
              <div className="absolute bottom-3 left-4 right-4 p-3 bg-white/95 border border-[#111111]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#666660] z-30 shadow-xs">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#DC2626]" />
                  <span className="font-bold text-[#111111]">ACTIVE VIEW:</span>
                  <span className="text-[#DC2626] font-bold">
                    {isCrdSelected
                      ? 'CRD (NON-GEOGRAPHIC)'
                      : activeBlock
                      ? activeBlock.name
                      : 'OVERALL CAMPUS (ALL 8 BLOCKS)'}
                  </span>
                  {activeBlock ? (
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold uppercase border border-black/30"
                      style={{
                        backgroundColor: activeBlock.fillColor,
                        color: activeBlock.fillColor === '#FFFFFF' ? '#111' : '#fff'
                      }}
                    >
                      {activeBlock.colorName.toUpperCase()}
                    </span>
                  ) : !isCrdSelected && (
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      CAMPUS WIDE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#111111] font-bold">
                    {activeBlock ? `${associatedFaculty.length} FACULTY MAPPED` : `${FACULTY_MSRIT_DATA.length} TOTAL FACULTY`}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                    SURVEY BOUNDS LOCKED
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Right 5 Cols: Building Telemetry & Details Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 border-2 border-[#111111]/20 bg-white/70 space-y-6 shadow-xs font-mono">
              
              {/* Header Badge */}
              <div className="text-xs border-b border-[#111111]/10 pb-3 flex items-center justify-between">
                <span className="text-[#666660] uppercase tracking-widest">
                  {isCrdSelected
                    ? 'NON-GEOGRAPHIC CAMPUS BLOCK'
                    : activeBlock
                    ? 'VERIFIED CAMPUS BLOCK'
                    : 'OVERALL CAMPUS TELEMETRY'}
                </span>
                <span className="text-[#DC2626] font-bold uppercase">
                  {isCrdSelected
                    ? 'CRD'
                    : activeBlock
                    ? activeBlock.id
                    : '8 MONITORED BLOCKS'}
                </span>
              </div>

              {/* CRD Non-Geographic Block Presentation */}
              {isCrdSelected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-black/40 bg-gray-400" />
                    <h3 className="font-syne text-3xl font-extrabold text-[#111111] uppercase tracking-tight">
                      {NON_GEOGRAPHIC_CRD_BLOCK.name}
                    </h3>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>COORDINATE INTEGRITY GUARANTEE:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      CRD does NOT have verified 4-corner coordinates in the official survey dataset. In accordance with coordinate integrity rules, no fake coordinates are invented. CRD is preserved as a non-geographic reference block.
                    </p>
                  </div>

                  <div className="text-xs text-[#111111] space-y-1">
                    <div>HOUSES DEPARTMENTS: <strong>CSE AIML • CSE CY</strong></div>
                    <div>STATUS: <strong>NON-GEOGRAPHIC ACTIVE REFERENCE</strong></div>
                  </div>
                </div>
              ) : activeBlock ? (
                /* Verified Geographic Block Presentation */
                <div className="space-y-4">
                  
                  {/* Deselect shortcut */}
                  <div className="flex items-center justify-between border-b border-[#111111]/10 pb-2">
                    <div className="text-[10px] text-[#666660] uppercase font-bold">SINGLE BLOCK INSPECTION</div>
                    <button
                      onClick={handleDeselectAll}
                      className="text-[10px] font-bold text-[#DC2626] hover:underline flex items-center gap-1 uppercase"
                      title="Deselect block and return to overall campus view"
                    >
                      <span>DESELECT BLOCK</span> ✕
                    </button>
                  </div>

                  {/* Block Title & Color Spec */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40"
                        style={{ backgroundColor: activeBlock.fillColor }}
                      />
                      <h3 className="font-syne text-3xl font-extrabold text-[#111111] uppercase tracking-tight">
                        {activeBlock.name}
                      </h3>
                    </div>
                    <div className="text-sm text-[#111111] font-bold">
                      {activeBlock.displayName}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span
                        className="px-2 py-0.5 text-[10px] font-bold uppercase border"
                        style={{
                          backgroundColor: `${activeBlock.fillColor}20`,
                          borderColor: activeBlock.strokeColor,
                          color: activeBlock.strokeColor
                        }}
                      >
                        COLOR: {activeBlock.colorName.toUpperCase()}
                      </span>
                      <span className="text-xs text-[#DC2626] font-bold">
                        ESTIMATED OCCUPANCY: {currentBlockOccupancy}%
                      </span>
                    </div>
                  </div>

                  {/* Exact Corner Coordinates Telemetry */}
                  <div className="p-3.5 bg-gray-50 border border-[#111111]/15 space-y-2 text-[11px]">
                    <div className="font-bold text-[#111111] text-[10px] uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        EXACT VERIFIED CORNERS (TL → TR → BR → BL)
                      </span>
                      <span className="text-[#888]">4 POINTS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="p-1.5 bg-white border border-[#111111]/10">
                        <span className="text-[#DC2626] font-bold">TL: </span>
                        <span>{activeBlock.corners.TL.lat.toFixed(6)}, {activeBlock.corners.TL.lng.toFixed(6)}</span>
                      </div>
                      <div className="p-1.5 bg-white border border-[#111111]/10">
                        <span className="text-[#DC2626] font-bold">TR: </span>
                        <span>{activeBlock.corners.TR.lat.toFixed(6)}, {activeBlock.corners.TR.lng.toFixed(6)}</span>
                      </div>
                      <div className="p-1.5 bg-white border border-[#111111]/10">
                        <span className="text-[#DC2626] font-bold">BR: </span>
                        <span>{activeBlock.corners.BR.lat.toFixed(6)}, {activeBlock.corners.BR.lng.toFixed(6)}</span>
                      </div>
                      <div className="p-1.5 bg-white border border-[#111111]/10">
                        <span className="text-[#DC2626] font-bold">BL: </span>
                        <span>{activeBlock.corners.BL.lat.toFixed(6)}, {activeBlock.corners.BL.lng.toFixed(6)}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#666] pt-1 border-t border-[#111111]/10">
                      CENTER ANCHOR: <strong>{activeBlock.center.lat.toFixed(6)}° N, {activeBlock.center.lng.toFixed(6)}° E</strong>
                    </div>
                  </div>

                  {/* Associated Library Box if present */}
                  {activeBlockLibrary && activeLibDetails && (
                    <div className="p-4 border-2 border-[#DC2626] bg-[#DC2626]/5 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-[#DC2626]/20 pb-2">
                        <span className="text-[#DC2626] font-bold uppercase flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-[#DC2626]" />
                          <span>ASSOCIATED LIBRARY: {activeBlockLibrary.name}</span>
                        </span>
                        <span className="text-[#DC2626] font-bold text-sm">
                          {activeLibDetails.displayOccupancy}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#111111]/10 overflow-hidden border border-[#111111]/15">
                        <div
                          className="h-full bg-[#DC2626] transition-all duration-700"
                          style={{ width: `${activeLibDetails.percentageEquivalent}%` }}
                        />
                      </div>
                      <div className="space-y-1 text-[11px] text-[#666660]">
                        <div>PRIMARY USERS: <strong className="text-[#111111]">{activeBlockLibrary.primaryGroups.join(' • ')}</strong></div>
                        <div>STATUS: <strong className="text-[#111111]">{activeLibDetails.isOpen ? 'OPEN' : 'CLOSED (OPENS 09:00)'}</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Departments housed */}
                  {activeBlock.departments.length > 0 && (
                    <div className="p-3 bg-white border border-[#111111]/15 space-y-1.5 text-xs">
                      <div className="font-bold text-[#111111] text-[11px] uppercase flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span>DEPARTMENTS HOUSED:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeBlock.departments.map((dept) => (
                          <span
                            key={dept}
                            className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#111111]/5 border border-[#111111]/20 text-[#111111]"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-[#666660] font-light">
                    {activeBlock.description}
                  </p>

                </div>
              ) : (
                /* Overall Campus Presentation (Deselected State) */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/40 bg-[#DC2626]" />
                      <h3 className="font-syne text-2xl sm:text-3xl font-extrabold text-[#111111] uppercase tracking-tight">
                        RAMAIAH INSTITUTE OF TECHNOLOGY
                      </h3>
                    </div>
                    <div className="text-xs sm:text-sm text-[#111111] font-bold">
                      MAIN CAMPUS • OVERALL TELEMETRY & BOUNDARY
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#111111] text-white">
                        8 GEOGRAPHIC BLOCKS MONITORED
                      </span>
                      <span className="text-xs text-[#DC2626] font-bold">
                        CAMPUS-WIDE AVG OCCUPANCY: {overallCampusOccupancy}%
                      </span>
                    </div>
                  </div>

                  {/* Campus-wide occupancy bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-[#111111]/10 overflow-hidden border border-[#111111]/15">
                      <div
                        className="h-full bg-[#DC2626] transition-all duration-700"
                        style={{ width: `${overallCampusOccupancy}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#666660]">
                      <span>0% IDLE</span>
                      <span>ACTIVE LOAD: {overallCampusOccupancy}%</span>
                      <span>100% CAPACITY</span>
                    </div>
                  </div>

                  {/* Official Survey Perimeter Boundary Box */}
                  <div className="p-3.5 bg-gray-50 border-2 border-[#111111]/15 space-y-2 text-[11px]">
                    <div className="font-bold text-[#111111] text-[10px] uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        OFFICIAL CAMPUS PERIMETER BORDERS (SURVEY ENFORCED)
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 font-bold">
                        MAP LOCKED
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="p-2 bg-white border border-[#111111]/10">
                        <span className="text-[#DC2626] font-bold block">TL (TOP LEFT):</span>
                        <span className="font-bold text-[#111111]">{CAMPUS_SURVEY_BOUNDARY.TL.raw}</span>
                        <div className="text-[9px] text-[#888]">{CAMPUS_SURVEY_BOUNDARY.TL.lat.toFixed(6)}, {CAMPUS_SURVEY_BOUNDARY.TL.lng.toFixed(6)}</div>
                      </div>
                      <div className="p-2 bg-white border border-[#111111]/10">
                        <span className="text-[#DC2626] font-bold block">TR (TOP RIGHT):</span>
                        <span className="font-bold text-[#111111]">{CAMPUS_SURVEY_BOUNDARY.TR.raw}</span>
                        <div className="text-[9px] text-[#888]">{CAMPUS_SURVEY_BOUNDARY.TR.lat.toFixed(6)}, {CAMPUS_SURVEY_BOUNDARY.TR.lng.toFixed(6)}</div>
                      </div>
                      <div className="p-2 bg-white border border-[#111111]/10">
                        <span className="text-[#DC2626] font-bold block">BL (BOTTOM LEFT):</span>
                        <span className="font-bold text-[#111111]">{CAMPUS_SURVEY_BOUNDARY.BL.raw}</span>
                        <div className="text-[9px] text-[#888]">{CAMPUS_SURVEY_BOUNDARY.BL.lat.toFixed(6)}, {CAMPUS_SURVEY_BOUNDARY.BL.lng.toFixed(6)}</div>
                      </div>
                      <div className="p-2 bg-white border border-[#111111]/10">
                        <span className="text-[#DC2626] font-bold block">BR (BOTTOM RIGHT):</span>
                        <span className="font-bold text-[#111111]">{CAMPUS_SURVEY_BOUNDARY.BR.raw}</span>
                        <div className="text-[9px] text-[#888]">{CAMPUS_SURVEY_BOUNDARY.BR.lat.toFixed(6)}, {CAMPUS_SURVEY_BOUNDARY.BR.lng.toFixed(6)}</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#666660] pt-1 border-t border-[#111111]/10">
                      Map box is strictly bounded within these survey coordinates. Navigation and zoom cannot expand beyond this perimeter.
                    </p>
                  </div>

                  {/* 8 Campus Blocks Status Quick Selector */}
                  <div className="space-y-2">
                    <div className="font-bold text-[#111111] text-[11px] uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span>SELECT A BLOCK TO INSPECT:</span>
                      </span>
                      <span className="text-[10px] text-[#888]">CLICK TO FOCUS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {VERIFIED_CAMPUS_BLOCKS.map((b) => {
                        const occ = getBlockOccupancy(b);
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleSelectBlock(b)}
                            className="p-2 bg-white hover:bg-[#111111] hover:text-white cursor-pointer border border-[#111111]/15 transition-all group flex items-center justify-between"
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/30"
                                style={{ backgroundColor: b.fillColor }}
                              />
                              <span className="font-bold text-[11px] truncate uppercase">{b.name}</span>
                            </div>
                            <span className="text-[10px] text-[#DC2626] group-hover:text-[#FCA5A5] font-bold shrink-0">
                              {occ}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Major Campus Facilities Summary */}
                  <div className="p-3 bg-white border border-[#111111]/15 space-y-2 text-xs">
                    <div className="font-bold text-[#111111] text-[11px] uppercase flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>CAMPUS LIBRARIES ({LIBRARIES.length}):</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {LIBRARIES.map((lib) => {
                        const details = getLibraryOccupancyDetails(lib, simulatedTime);
                        return (
                          <div key={lib.id} className="flex items-center justify-between py-0.5 border-b border-[#111111]/5 last:border-none">
                            <span className="text-[#111111] font-bold">{lib.name} ({lib.building})</span>
                            <span className="text-[#DC2626] font-bold">
                              {details.isOpen ? details.displayOccupancy : 'CLOSED'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-[#666660] font-light">
                    Click any building polygon or label card on the map to inspect its floor plans, verified coordinates, departments, and active faculty roster. Click the selected building again to return to this overall view.
                  </p>
                </div>
              )}

              {/* Selected Faculty Member Card if active */}
              {selectedFacultyMember && (
                <div className="p-4 border-2 border-[#DC2626] bg-[#DC2626]/5 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#DC2626]/20 pb-2">
                    <span className="text-[#DC2626] font-bold uppercase">SELECTED FACULTY MEMBER</span>
                    <button onClick={() => setSelectedFacultyMember(null)} className="text-[10px] text-[#666660] hover:text-[#111111]">
                      DESELECT ✕
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    {selectedFacultyMember.avatarUrl && (
                      <img
                        src={selectedFacultyMember.avatarUrl}
                        alt={selectedFacultyMember.name}
                        className="w-12 h-12 border border-[#111111]/20 object-cover shrink-0"
                      />
                    )}
                    <div>
                      <div className="font-syne font-bold text-base text-[#111111] uppercase">
                        {selectedFacultyMember.name}
                      </div>
                      <div className="text-[#DC2626] font-bold text-xs">
                        {selectedFacultyMember.designation}
                      </div>
                      <div className="text-xs text-[#111111]">
                        {selectedFacultyMember.department}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const liveState = getFacultyLiveStatus(selectedFacultyMember, simulatedTime);
                    return (
                      <div className="space-y-1 text-[11px] text-[#666660] pt-2 border-t border-[#DC2626]/20">
                        <div>CABIN: <strong className="text-[#111111]">{selectedFacultyMember.cabinLocation}</strong></div>
                        <div>LIVE STATUS: <span className="text-[#DC2626] font-bold uppercase">{liveState.liveStatus}</span></div>
                        <div>LOCATION: <strong className="text-[#111111]">{liveState.liveLocation}</strong></div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Associated Faculty List */}
              <div className="space-y-3 pt-2">
                <div className="font-mono text-xs text-[#111111] uppercase font-bold border-b border-[#111111]/10 pb-2 flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>
                      {isCrdSelected
                        ? `FACULTY AT CRD (${associatedFaculty.length}):`
                        : activeBlock
                        ? `FACULTY AT ${activeBlock.name} (${associatedFaculty.length}):`
                        : `ALL CAMPUS FACULTY (${associatedFaculty.length}):`}
                    </span>
                  </span>
                  <span className="text-[#DC2626] text-[10px]">DYNAMIC ROSTER</span>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {associatedFaculty.length === 0 ? (
                    <div className="text-xs text-[#666660] py-3 text-center">
                      No faculty recorded for this block.
                    </div>
                  ) : (
                    associatedFaculty.map((fac) => {
                      const liveState = getFacultyLiveStatus(fac, simulatedTime);
                      const isSelected = selectedFacultyMember?.id === fac.id;
                      return (
                        <div
                          key={fac.id}
                          onClick={() => {
                            const targetBlock = VERIFIED_CAMPUS_BLOCKS.find((b) =>
                              b.departments.some((d) => d.toUpperCase() === fac.department.toUpperCase())
                            ) || VERIFIED_CAMPUS_BLOCKS[0];
                            handleSelectBlock(targetBlock);
                            setSelectedFacultyMember(fac);
                          }}
                          className={`p-2.5 border font-mono text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#DC2626] bg-[#DC2626]/10 text-[#111111] font-bold'
                              : 'border-[#111111]/15 bg-white/60 hover:border-[#111111] text-[#666660]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-[#111111] uppercase font-syne text-sm">{fac.name}</strong>
                            <span className="text-[10px] text-[#DC2626] bg-red-50 px-2 py-0.5 border border-red-200 uppercase font-bold">
                              ● {liveState.liveStatus}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#DC2626] mt-0.5 font-bold">
                            {fac.designation} • {fac.department}
                          </div>
                          <div className="text-[10px] text-[#666660] mt-0.5">
                            CABIN: {fac.cabinLocation}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {activeBlock ? (
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${activeBlock.center.lat},${activeBlock.center.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1 py-3 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <Navigation className="w-4 h-4 text-red-300" />
                    <span>GOOGLE MAPS DIRECTIONS TO {activeBlock.name} →</span>
                  </button>
                ) : !isCrdSelected ? (
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=13.031014,77.565194`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1 py-3 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <Navigation className="w-4 h-4 text-red-300" />
                    <span>GOOGLE MAPS DIRECTIONS TO MAIN GATE →</span>
                  </button>
                ) : null}
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
