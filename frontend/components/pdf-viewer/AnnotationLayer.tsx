'use client';

import React, { useState, useRef } from 'react';
import { useAnnotationStore } from '../../store/useAnnotationStore';

interface AnnotationLayerProps {
  docId: string;
  pageNumber: number;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ docId, pageNumber }) => {
  const { activeTool, activeColor, activeStrokeWidth, annotations, addAnnotation } =
    useAnnotationStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const svgRef = useRef<SVGSVGElement>(null);

  const pageAnnotations = annotations.filter(
    (a) => a.docId === docId && a.pageNumber === pageNumber && (a.type === 'freehand' || a.type === 'highlight')
  );

  const getCoordinates = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool !== 'pen' && activeTool !== 'highlight') return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    setCurrentPath(`M ${x} ${y}`);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    setCurrentPath((prev) => `${prev} L ${x} ${y}`);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 5) {
      addAnnotation({
        docId,
        pageNumber,
        type: activeTool === 'highlight' ? 'highlight' : 'freehand',
        svgPath: currentPath,
        color: activeColor,
        strokeWidth: activeTool === 'highlight' ? 18 : activeStrokeWidth
      });
    }
    setCurrentPath('');
  };

  const isInteractive = activeTool === 'pen' || activeTool === 'highlight';

  return (
    <svg
      ref={svgRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`absolute inset-0 w-full h-full z-10 ${
        isInteractive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Existing saved paths */}
      {pageAnnotations.map((ann) =>
        ann.svgPath ? (
          <path
            key={ann.id}
            d={ann.svgPath}
            stroke={ann.color || '#2563EB'}
            strokeWidth={ann.strokeWidth || 3}
            strokeOpacity={ann.type === 'highlight' ? 0.35 : 0.9}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null
      )}

      {/* Currently drawing path */}
      {isDrawing && currentPath && (
        <path
          d={currentPath}
          stroke={activeColor}
          strokeWidth={activeTool === 'highlight' ? 18 : activeStrokeWidth}
          strokeOpacity={activeTool === 'highlight' ? 0.35 : 0.9}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
