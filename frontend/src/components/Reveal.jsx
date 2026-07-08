// Composant utilitaire : anime l'apparition de son contenu quand il entre
// dans le champ de vision (défilement). S'appuie sur IntersectionObserver.
import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // on n'anime qu'une fois
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}
