import type { CastMember } from '../../types';

export function CastSlider({ cast, compact = false }: { cast: CastMember[]; compact?: boolean }) {
  return <div className={`cast-rail ${compact ? 'cast-rail-compact' : ''}`} aria-label="Oyuncu kadrosu">
    {cast.map(member => <article className="cast-person" key={member.id}>
      <span className="cast-avatar" aria-hidden="true"><span className="cast-initials">{member.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span>{member.avatarUrl && <img src={member.avatarUrl} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }}/>}</span>
      <b>{member.name}</b><small>{member.character}</small>
    </article>)}
  </div>;
}
