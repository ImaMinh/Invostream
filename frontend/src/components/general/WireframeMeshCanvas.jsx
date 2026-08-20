import React, { useEffect, useRef } from 'react';

/**
 * Sharp Wireframe Mesh Canvas Component with vh Scaling
 */
const WireframeMeshCanvas = ({ isScrolled, heightVh = 25 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || window.innerWidth;
      const cssH = rect.height || window.innerHeight;

      // 1. Physical Hardware Buffer Dimensions
      const physW = Math.round(cssW * dpr);
      const physH = Math.round(cssH * dpr);
      canvas.width = physW;
      canvas.height = physH;

      // 2. Direct 1:1 Physical Pixel Context Matrix (zero CSS scaling artifacts)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, physW, physH);

      // 3. Vertical Mesh Height scaling relative to Viewport Height (vh)
      const physMeshH = (physH * heightVh) / 100;

      // 4. Responsive Grid Density
      const isMobile = cssW < 640;
      const cols = Math.max(10, Math.floor(cssW / (isMobile ? 30 : 48)));
      const rows = isMobile ? 4 : 5;
      const physDotRadius = Math.round((isMobile ? 1.5 : 2.0) * dpr);

      // 5. Calculate Direct Integer Physical Device Pixel Coordinates:
      const lineXs = new Float64Array(cols);
      const dotXs = new Float64Array(cols);
      for (let c = 0; c < cols; c++) {
        const pX = Math.round((c * (physW - 1)) / (cols - 1));
        lineXs[c] = pX + 0.5;
        dotXs[c] = pX;
      }

      const lineYs = new Float64Array(rows);
      const dotYs = new Float64Array(rows);
      for (let r = 0; r < rows; r++) {
        const pY = Math.round((r * (physMeshH - 1)) / (rows - 1));
        lineYs[r] = pY + 0.5;
        dotYs[r] = pY;
      }

      // 6. Direct 1 Physical Pixel Stroke Width
      ctx.lineWidth = 1;

      // Get theme colors dynamically
      const cs = getComputedStyle(canvas);
      const strokeColor = cs.getPropertyValue('--mesh-stroke').trim() 
        || (isScrolled ? 'rgba(30, 41, 59, 0.35)' : 'rgba(255, 255, 255, 0.45)');
      const dotColor = cs.getPropertyValue('--mesh-dot').trim() 
        || (isScrolled ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)');

      // 7. Draw Sharp Wireframe Grid Lines (100% Solid Opacity Per Line)
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();
      const xMin = lineXs[0], xMax = lineXs[cols - 1];
      const yMin = lineYs[0], yMax = lineYs[rows - 1];

      for (let r = 0; r < rows; r++) {
        ctx.moveTo(xMin, lineYs[r]);
        ctx.lineTo(xMax, lineYs[r]);
      }
      for (let c = 0; c < cols; c++) {
        ctx.moveTo(lineXs[c], yMin);
        ctx.lineTo(lineXs[c], yMax);
      }
      ctx.stroke();

      // 8. Draw Crisp Grid Dots
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const y = dotYs[r];
        for (let c = 0; c < cols; c++) {
          const x = dotXs[c];
          ctx.moveTo(x + physDotRadius, y);
          ctx.arc(x, y, physDotRadius, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isScrolled, heightVh]);

  // Mask gradient dynamically scales with the heightVh prop
  const maskGradient = `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) ${heightVh * 0.6}vh, rgba(0,0,0,0) ${heightVh}vh)`;

  return (
    <canvas 
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none opacity-90 w-full h-full"
      style={{
        maskImage: maskGradient,
        WebkitMaskImage: maskGradient
      }}
    />
  );
};

export default WireframeMeshCanvas;
