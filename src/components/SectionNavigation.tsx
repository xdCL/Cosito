import { useEffect, useRef, useState } from 'preact/hooks';

const sections = [
  ['imagen', 'Agrega tu imagen'],
  ['medidas', 'Medidas del proyecto'],
  ['papel', 'Papel'],
  ['resultado', 'Vista previa y PDF'],
  ['opciones', 'Opciones avanzadas'],
  ['montaje', 'Guía de montaje'],
] as const;

export function SectionNavigation() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  return (
    <div
      ref={root}
      class="section-navigation"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          setOpen(false);
          toggle.current?.focus();
        }
      }}
      onFocusOut={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
    >
      <button
        ref={toggle}
        class="section-toggle primary"
        type="button"
        aria-label={`${open ? 'Cerrar' : 'Abrir'} navegación de secciones`}
        aria-expanded={open}
        aria-controls="project-sections"
        onClick={(event) => {
          event.currentTarget.focus();
          setOpen((value) => !value);
        }}
      >
        <span class="hamburger" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Secciones
      </button>
      <nav
        id="project-sections"
        class="section-links"
        aria-label="Secciones del proyecto"
        hidden={!open}
      >
        <p>Vamos por partes</p>
        {sections.map(([id, label], index) => (
          <a
            key={id}
            href={`#${id}`}
            tabIndex={0}
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              const target = document.getElementById(id);
              if (!target) return;
              event.preventDefault();
              if (target instanceof HTMLDetailsElement) target.open = true;
              const focusTarget =
                target instanceof HTMLDetailsElement ? target.querySelector('summary') : target;
              focusTarget?.focus({ preventScroll: true });
              if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
              target.scrollIntoView({ block: 'start' });
              setOpen(false);
            }}
          >
            <span aria-hidden="true">{index + 1}</span>
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
