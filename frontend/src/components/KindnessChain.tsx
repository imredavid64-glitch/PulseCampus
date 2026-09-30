'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Pulse } from '@/lib/supabase';
import { schoolConfig } from '@/lib/school-config';

interface KindnessChain {
  id: string;
  helper_pulse_id: string;
  helped_pulse_id: string;
  chain_type: string;
  created_at: string;
  helper_pulse?: Pulse;
  helped_pulse?: Pulse;
}

interface KindnessChainLayerProps {
  chains: KindnessChain[];
  pulses: Pulse[];
}

export default function KindnessChainLayer({ chains, pulses }: KindnessChainLayerProps) {
  const map = useMap();
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();
  const [paths, setPaths] = useState<SVGPathElement[]>([]);

  const pulseMap = new Map(pulses.map(p => [p.id, p]));

  useEffect(() => {
    if (!map || !svgRef.current) return;

    const svg = svgRef.current;
    const container = map.getContainer();
    const overlayPane = map.getPanes().overlayPane;

    if (!overlayPane.contains(svg)) {
      overlayPane.appendChild(svg);
    }

    const updatePaths = () => {
      if (!map || !svgRef.current) return;

      const bounds = map.getBounds();
      const size = map.getSize();
      const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());

      svg.setAttribute('width', size.x.toString());
      svg.setAttribute('height', size.y.toString());
      svg.style.position = 'absolute';
      svg.style.left = `${-topLeft.x}px`;
      svg.style.top = `${-topLeft.y}px`;
      svg.style.pointerEvents = 'none';
      svg.style.zIndex = '400';

      const validChains = chains.filter(chain => {
        const helper = pulseMap.get(chain.helper_pulse_id);
        const helped = pulseMap.get(chain.helped_pulse_id);
        return helper && helped;
      });

      const newPaths: SVGPathElement[] = [];

      validChains.forEach((chain, index) => {
        const helper = pulseMap.get(chain.helper_pulse_id)!;
        const helped = pulseMap.get(chain.helped_pulse_id)!;

        const helperPoint = map.latLngToLayerPoint([helper.lat, helper.lng]);
        const helpedPoint = map.latLngToLayerPoint([helped.lat, helped.lng]);

        const dx = helpedPoint.x - helperPoint.x;
        const dy = helpedPoint.y - helperPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) return;

        const midX = helperPoint.x + dx * 0.5;
        const midY = helperPoint.y + dy * 0.5;
        const curveHeight = Math.min(distance * 0.3, 100);
        const controlY = midY - curveHeight;

        let path = svg.querySelector(`#chain-${chain.id}`) as SVGPathElement;
        
        if (!path) {
          path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.id = `chain-${chain.id}`;
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', '#f59e0b');
          path.setAttribute('stroke-width', '2.5');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-dasharray', '8,6');
          path.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4))');
          svg.appendChild(path);
        }

        const pathData = `M ${helperPoint.x} ${helperPoint.y} Q ${midX} ${controlY} ${helpedPoint.x} ${helpedPoint.y}`;
        path.setAttribute('d', pathData);

        const pathLength = path.getTotalLength();
        path.style.strokeDasharray = `${pathLength} ${pathLength}`;
        path.style.strokeDashoffset = pathLength.toString();
        path.style.transition = 'stroke-dashoffset 1.5s ease-out, opacity 0.3s ease-out';
        path.style.opacity = '0';

        requestAnimationFrame(() => {
          path.style.strokeDashoffset = '0';
          path.style.opacity = '0.8';
        });

        newPaths.push(path);
      });

      const existingPaths = svg.querySelectorAll('path[id^="chain-"]');
      existingPaths.forEach((el: Element) => {
        const path = el as SVGPathElement;
        const id = path.id.replace('chain-', '');
        if (!validChains.some(c => c.id === id)) {
          path.style.transition = 'opacity 0.5s ease-out';
          path.style.opacity = '0';
          setTimeout(() => path.remove(), 500);
        }
      });

      setPaths(newPaths);
    };

    updatePaths();

    map.on('moveend zoomend', updatePaths);
    map.on('zoom', updatePaths);

    return () => {
      map.off('moveend zoomend', updatePaths);
      map.off('zoom', updatePaths);
      if (svgRef.current && svgRef.current.parentNode) {
        svgRef.current.parentNode.removeChild(svgRef.current);
      }
    };
  }, [chains, pulses, map, pulseMap]);

  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" />;
}