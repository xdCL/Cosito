import { useEffect, useRef, useState } from 'preact/hooks';

/** Reserve the complete word and expose it once to assistive technology. */
export function TypewriterWord({ text, enabled }: { text: string; enabled: boolean }) {
  const host = useRef<HTMLSpanElement>(null);
  const [ink, setInk] = useState(text);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const letters = Array.from(text);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let length = letters.length;
    let erasing = true;
    const stop = () => {
      clearTimeout(timer);
      timer = undefined;
      length = letters.length;
      erasing = true;
      setInk(text);
      setRunning(false);
    };
    const tick = () => {
      length += erasing ? -1 : 1;
      setInk(letters.slice(0, length).join(''));
      let delay = erasing ? 110 + (length % 3) * 14 : 180 + (length % 3) * 22;
      if (length === 0) {
        erasing = false;
        delay = 550;
      } else if (length === letters.length) {
        erasing = true;
        delay = 4800;
      }
      timer = setTimeout(tick, delay);
    };
    const sync = () => {
      stop();
      if (enabled && visible && !document.hidden && !preference.matches) {
        setRunning(true);
        timer = setTimeout(tick, 4200);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    if (host.current) observer.observe(host.current);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [text, enabled]);
  return (
    <span class="typewriter" ref={host} data-running={running}>
      <span class="sr-only">{text}</span>
      <span class="typewriter-reserve" aria-hidden="true">
        {text}
      </span>
      <span class="typewriter-ink" aria-hidden="true">
        {ink}
      </span>
    </span>
  );
}
