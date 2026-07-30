import React, { useState, useEffect } from "react";
import { Code, Laptop, Bot, Target, Brain, Database, Cloud, Network, Cpu, Terminal, Shield, Activity } from "lucide-react";
import "./FloatingTechBackground.css";

const highDensityElements = [
  { Icon: Code, x: 8, y: 12, size: 44, color: "#2dd4bf", parallax: 18, anim: 1, mobile: true },
  { Icon: Laptop, x: 86, y: 16, size: 48, color: "#a855f7", parallax: -22, anim: 2, mobile: false },
  { Icon: Bot, x: 84, y: 76, size: 50, color: "#3b82f6", parallax: 26, anim: 3, mobile: true },
  { Icon: Target, x: 12, y: 84, size: 40, color: "#8b5cf6", parallax: -18, anim: 4, mobile: false },
  { Icon: Brain, x: 46, y: 10, size: 52, color: "#6366f1", parallax: 15, anim: 5, mobile: true },
  { Icon: Database, x: 92, y: 48, size: 46, color: "#0ea5e9", parallax: -20, anim: 1, mobile: true },
  { Icon: Cloud, x: 50, y: 88, size: 42, color: "#06b6d4", parallax: 12, anim: 2, mobile: false },
  { Icon: Network, x: 6, y: 46, size: 48, color: "#14b8a6", parallax: 24, anim: 3, mobile: true },
  { Icon: Cpu, x: 74, y: 44, size: 46, color: "#60a5fa", parallax: -16, anim: 4, mobile: true },
  { Icon: Terminal, x: 24, y: 34, size: 38, color: "#64748b", parallax: 18, anim: 5, mobile: false },
  { Icon: Shield, x: 30, y: 72, size: 42, color: "#10b981", parallax: -14, anim: 1, mobile: true },
  { Icon: Activity, x: 64, y: 64, size: 38, color: "#2dd4bf", parallax: 20, anim: 2, mobile: false },
];

const lowDensityElements = [
  { Icon: Brain, x: 14, y: 18, size: 46, color: "#8b5cf6", parallax: 18, anim: 1, mobile: true },
  { Icon: Bot, x: 86, y: 78, size: 44, color: "#3b82f6", parallax: -22, anim: 2, mobile: true },
  { Icon: Code, x: 16, y: 75, size: 40, color: "#2dd4bf", parallax: 20, anim: 3, mobile: true },
  { Icon: Cpu, x: 84, y: 22, size: 42, color: "#06b6d4", parallax: -16, anim: 4, mobile: false },
  { Icon: Shield, x: 8, y: 46, size: 38, color: "#10b981", parallax: 14, anim: 5, mobile: false },
  { Icon: Database, x: 92, y: 46, size: 40, color: "#a855f7", parallax: -15, anim: 1, mobile: true },
];

export default function FloatingTechBackground({ density = "high" }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const elements = density === "high" ? highDensityElements : lowDensityElements;

  return (
    <div className="floating-bg-container">
      {elements.map((el, i) => {
        const IconComponent = el.Icon;
        const parallaxX = mousePos.x * el.parallax;
        const parallaxY = mousePos.y * el.parallax;

        return (
          <div
            key={i}
            className={`floating-capsule-wrapper ${el.mobile ? "" : "mobile-hidden"}`}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
              transition: "transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
          >
            <div
              className={`floating-capsule float-anim-${el.anim}`}
              style={{
                width: `${el.size + 16}px`,
                height: `${el.size + 16}px`,
                "--glow-color": el.color,
                color: el.color,
              }}
            >
              <IconComponent size={el.size - 12} strokeWidth={1.5} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
