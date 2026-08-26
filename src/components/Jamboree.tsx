import type { Dancer } from '../domain/roster';
import { jamboreePrompt } from '../domain/session';

type Props = {
  dancers: Dancer[];
  onJamOver: () => void;
};

/** Enough pieces to read as a burst, few enough to stay smooth on a tablet. */
const CONFETTI = Array.from({ length: 28 }, (_, i) => i);

export function Jamboree({ dancers, onJamOver }: Props) {
  const prompt = jamboreePrompt(dancers);

  return (
    <section className="jam" aria-live="assertive">
      <div className="jam__burst" aria-hidden="true">
        {CONFETTI.map((i) => {
          // Fan the pieces out evenly, then vary distance and timing so it reads
          // as a popper rather than a machine.
          const angle = (i / CONFETTI.length) * 360 + (i % 3) * 7;
          const distance = 42 + ((i * 37) % 46);
          const delay = ((i * 53) % 220) / 1000;
          return (
            <span
              key={i}
              className="jam__confetti"
              style={
                {
                  '--angle': `${angle}deg`,
                  '--distance': `${distance}%`,
                  '--delay': `${delay}s`,
                  '--piece': `var(--seg-${(i % 8) + 1})`,
                } as React.CSSProperties
              }
            />
          );
        })}
        <span className="jam__popper">🎉</span>
      </div>

      <p className="jam__label">
        {dancers.length > 1 ? `${dancers.length} birthdays` : 'Everything stops'}
      </p>
      <h2 className="jam__title">{prompt.name}</h2>
      <p className="jam__description">{prompt.description}</p>

      <button className="actions__primary jam__button" type="button" onClick={onJamOver}>
        Jam Over
      </button>
      <p className="actions__note">The session picks up exactly where it left off.</p>
    </section>
  );
}
