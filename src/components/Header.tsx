import { APP_CONFIG } from '../config/app';
import { loadTheme, saveTheme, type Theme } from '../theme/theme';
import { useState } from 'preact/hooks';
import { SKINS, type Skin } from '../theme/skin';
export function Header({ skin, changeSkin }: { skin: Skin; changeSkin: (skin: Skin) => boolean }) {
  const [theme, setTheme] = useState(loadTheme);
  const [warning, setWarning] = useState('');
  return (
    <header class="site-header">
      <a
        class={`wordmark ${skin === 'los-leones' ? 'wordmark-school' : ''}`}
        href={import.meta.env.BASE_URL}
        aria-label={`${SKINS[skin].label}, inicio`}
      >
        {skin === 'los-leones' ? (
          <>
            <span class="school-caption">Escuela · el cosito</span>
            <span class="school-name">
              Los Leones
              <span class="logo-dot" aria-hidden="true" />
            </span>
          </>
        ) : (
          <>
            {APP_CONFIG.name}
            <span class="logo-dot" aria-hidden="true" />
          </>
        )}
      </a>
      <div class="header-tools">
        <details class="privacy">
          <summary>🔒 Procesamiento local</summary>
          <p>Tu imagen permanece en este dispositivo. No se sube ni se envía a ningún servidor.</p>
        </details>
        <label class="theme-control skin-control">
          Estilo
          <select
            aria-label="Estilo"
            value={skin}
            onChange={(e) => {
              const saved = changeSkin(e.currentTarget.value as Skin);
              setWarning(saved ? '' : 'El estilo cambió; no se pudo guardar.');
            }}
          >
            {Object.entries(SKINS).map(([id, brand]) => (
              <option key={id} value={id}>
                {brand.label}
              </option>
            ))}
          </select>
        </label>
        <label class="theme-control">
          Tema
          <select
            aria-label="Tema"
            value={theme}
            onChange={(e) => {
              const value = e.currentTarget.value as Theme;
              setTheme(value);
              document.documentElement.dataset.theme = value;
              setWarning(saveTheme(value) ? '' : 'El tema cambió; no se pudo guardar.');
            }}
          >
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
        {warning && <small role="status">{warning}</small>}
      </div>
    </header>
  );
}
