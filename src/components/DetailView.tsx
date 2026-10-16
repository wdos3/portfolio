import { useEffect, useRef } from 'react';
import { portfolio } from '../data/portfolio';
import type { ContactEntry, ProjectEntry } from '../data/portfolio';
import { entryHref } from '../routing';
import type { DetailSelection } from '../routing';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

function ContactContent({ entry }: { entry: ContactEntry }) {
  if (!entry.value) {
    return <div className="content-block"><p className="contact-value">Not added yet.</p><p>{entry.name} details will appear here when available.</p></div>;
  }
  return (
    <div className="content-block">
      <p className="contact-value">{entry.value}</p>
      {entry.type === 'email' && <div className="detail-actions">
        <a href={`mailto:${entry.value}`}>Write an email <span aria-hidden="true">↗</span></a>
        <CopyButton value={entry.value} label="Copy address" />
      </div>}
      {entry.type === 'external' && <a className="text-link" href={entry.value} target="_blank" rel="noopener noreferrer">Visit {entry.name} <span aria-hidden="true">↗</span></a>}
    </div>
  );
}

function ProjectContent({ project }: { project: ProjectEntry }) {
  return (
    <>
      {project.placeholder && <p className="draft-label">Sample project · editable draft</p>}
      <p className="detail-introduction">{project.description}</p>
      <dl className="project-facts">
        <div><dt>Technologies</dt><dd>{project.technologies.join(' · ') || 'Not added yet'}</dd></div>
        <div><dt>Development</dt><dd>{project.status}</dd></div>
      </dl>
      <div className="content-blocks project-story">
        <section className="content-block"><h4>Problem</h4><p>{project.problem ?? 'The problem being solved has not been added yet.'}</p></section>
        <section className="content-block"><h4>My contributions</h4>
          {project.contributions.length ? <ul>{project.contributions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Contributions have not been added yet.</p>}
        </section>
        <section className="content-block"><h4>Challenges</h4>
          {project.challenges.length ? <ul>{project.challenges.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Technical challenges have not been added yet.</p>}
        </section>
        <section className="content-block"><h4>Results</h4><p>{project.results ?? 'No results have been added.'}</p></section>
      </div>
      {project.extendedDescription && <p className="extended-description">{project.extendedDescription}</p>}
      <div className="detail-actions">
        {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">Source code <span aria-hidden="true">↗</span></a>}
        {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">Live demo <span aria-hidden="true">↗</span></a>}
        <CopyButton value={new URL(entryHref('work', project.category, project.id), window.location.href).href} label="Copy project link" />
      </div>
    </>
  );
}

export function DetailView({ selection, active, onClose }: { selection: DetailSelection; active: boolean; onClose: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { entry, project, section } = selection;
  const name = project?.name ?? entry.name;

  useEffect(() => {
    if (!active) return;
    scrollRef.current!.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
  }, [active, entry.id, project?.id]);

  return (
    <div className="detail-view" role="region" aria-labelledby={`${section.id}-detail-title`} inert={!active} onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }}>
      <button className="detail-return" onClick={onClose} aria-label="Return to wheels"><Icon name="back" /><span>Back to wheels</span></button>
      <div className="detail-scroll" ref={scrollRef} role="group" aria-label="Scrollable details" tabIndex={0}>
        <div className="detail-body" key={project?.id ?? entry.id}>
          {project && <a className="collection-return" href={entryHref(section.id, entry.id)}><Icon name="back" />{entry.name}</a>}
          <div className="detail-heading">
            <Icon name={project ? project.icon ?? 'folder' : entry.icon} />
            <h3 id={`${section.id}-detail-title`} ref={headingRef} tabIndex={-1}>{name}</h3>
          </div>
          {project ? <ProjectContent project={project} /> : <>
            {entry.kind === 'about' && <>
              {entry.placeholder && <p className="draft-label">Profile draft</p>}
              <p className="detail-introduction">{entry.introduction}</p>
              <div className="content-blocks">
                {entry.blocks.map((block) => <section className="content-block" key={block.title}>
                  <h4>{block.title}</h4>
                  {block.subtitle && <p className="block-subtitle">{block.subtitle}</p>}
                  {block.text && <p>{block.text}</p>}
                  {block.items && <ul className="inline-list">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                  {block.links && <div className="detail-actions">{block.links.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} <span aria-hidden="true">↗</span></a>
                  ))}</div>}
                </section>)}
              </div>
            </>}
            {entry.kind === 'contact' && <ContactContent entry={entry} />}
            {entry.kind === 'resume' && <>
              <p className="detail-introduction">{entry.description}</p>
              {entry.url ? <div className="detail-actions"><a href={entry.url} download={entry.fileName}>Download CV <Icon name="download" /></a></div>
                : <div className="content-block"><p>CV not added yet. A download will be available when a CV is provided.</p></div>}
            </>}
            {entry.kind === 'collection' && <>
              <p className="detail-introduction">{entry.description}</p>
              <ul className="work-list">
                {portfolio.projects.filter((item) => item.category === entry.id).map((item) => <li key={item.id}>
                  <a href={entryHref('work', entry.id, item.id)}>
                    <Icon name={item.icon ?? 'folder'} />
                    <span><strong>{item.name}</strong><span className="work-summary">{item.description}</span></span>
                    <span className="work-arrow" aria-hidden="true">↗</span>
                  </a>
                </li>)}
              </ul>
              {!portfolio.projects.some((item) => item.category === entry.id) && <p className="empty-content">No entries have been added yet.</p>}
            </>}
          </>}
        </div>
      </div>
    </div>
  );
}
