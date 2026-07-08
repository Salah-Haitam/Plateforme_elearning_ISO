// Pied de page maritime.
export default function Footer() {
  return (
    <footer className="footer">
      <p>
        <strong>Marsa Maroc</strong> · Plateforme de formation aux normes ISO
      </p>
      <p className="muted" style={{ fontSize: 13 }}>
        Projet de fin d'année · {new Date().getFullYear()}
      </p>
    </footer>
  );
}
