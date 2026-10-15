import { useEffect, useRef, useState } from 'react';
import type { PortfolioEntry, PortfolioSection, ContactEntry } from '../data/portfolio';
import { Icon } from './Icon';

export interface DetailSelection {
  section: PortfolioSection;
  entry: PortfolioEntry;
}

function ContactContent({ entry }: { entry: ContactEntry }) {
  const [copyStatus, setCopyStatus] = useState('Copy address');
  if (!entry.value) {
    return (
      <div className="content-block">
        <p className="contact-value">{entry.name === 'Location' ? 'City, country' : 'Not added yet.'}</p>
        <p>{entry.name === 'Location' ? 'Location details will appear here when available.' : `A ${entry.name === 'Email' ? 'contact address' : `${entry.name} profile`} will appear here when available.`}</p>
      </div>
    );
  }
  return (
    <div className="content-block">
      <p className="contact-value">{entry.value}</p>
      {entry.type === 'email' && (
        <div className="detail-actions">
          <a href={`mailto:${entry.value}`}>Write an email <span aria-hidden="true">↗</span></a>
          <button onClick={async () => {
            try {
              await navigator.clipboard.writeText(entry.value!);
              setCopyStatus('Copied');
            } catch {
              setCopyStatus('Unable to copy. Select the address above.');
            }
          }}>{copyStatus}</button>
          <span className="sr-only" role="status">{copyStatus === 'Copy address' ? '' : copyStatus}</span>
        </div>
      )}
      {entry.type === 'external' && <a className="text-link" href={entry.value} target="_blank" rel="noopener noreferrer">Visit {entry.name} <span aria-hidden="true">↗</span></a>}
    </div>
  );
}

export function DetailView({ selection, onClose }: { selection: DetailSelection; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeAnimation = useRef<Animation | null>(null);
  const [closing, setClosing] = useState(false);
  const { entry, section } = selection;

  useEffect(() => {
    const dialog = dialogRef.current!;
    if (!openerRef.current) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    dialog.showModal();
    return () => {
      closeAnimation.current?.cancel();
      openerRef.current?.focus({ preventScroll: true });
    };
  }, []);

  function requestClose() {
    const dialog = dialogRef.current!;
    if (closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.close();
      return;
    }
    setClosing(true);
    const current = getComputedStyle(dialog);
    const animation = dialog.animate(
      [{ opacity: current.opacity, transform: current.transform }, { opacity: 0, transform: 'translate3d(0, 8px, 0) scale(0.985)' }],
      { duration: 180, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
    );
    closeAnimation.current = animation;
    void animation.finished.then(
      () => dialog.close(),
      (error: unknown) => {
        // Unmounting cancels an in-progress animation; other failures are unexpected.
        if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
      },
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className={`detail-view${closing ? ' detail-view--closing' : ''}`}
      aria-labelledby="detail-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="detail-topline">
        <p>{section.title}</p>
        <button className="close-detail" onClick={requestClose} aria-label="Close details" autoFocus>
          <Icon name="close" />
        </button>
      </div>
      <div className="detail-body">
        <div className="detail-heading">
          <Icon name={entry.icon ?? 'folder'} />
          <h2 id="detail-title">{entry.name}</h2>
        </div>
        {entry.kind !== 'contact' && entry.placeholder && <p className="draft-label">{entry.kind === 'project' ? 'Sample project' : 'Profile draft'}</p>}
        {entry.kind === 'about' && (
          <>
            <p className="detail-introduction">{entry.introduction}</p>
            <div className="content-blocks">
              {entry.blocks.map((block) => (
                <section className="content-block" key={block.title}>
                  <h3>{block.title}</h3>
                  {block.subtitle && <p className="block-subtitle">{block.subtitle}</p>}
                  {block.text && <p>{block.text}</p>}
                  {block.items && <ul className="inline-list">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                </section>
              ))}
            </div>
          </>
        )}
        {entry.kind === 'contact' && <ContactContent entry={entry} />}
        {entry.kind === 'project' && (
          <>
            <p className="detail-introduction">{entry.description}</p>
            <dl className="project-facts">
              <div><dt>Built with</dt><dd>{entry.technologies.join(' · ') || 'To be added'}</dd></div>
              <div><dt>Status</dt><dd>{entry.status}</dd></div>
            </dl>
            {entry.extendedDescription && <p className="extended-description">{entry.extendedDescription}</p>}
            {(entry.repositoryUrl || entry.demoUrl) && (
              <div className="detail-actions">
                {entry.repositoryUrl && <a href={entry.repositoryUrl} target="_blank" rel="noopener noreferrer">GitHub repository <span aria-hidden="true">↗</span></a>}
                {entry.demoUrl && <a href={entry.demoUrl} target="_blank" rel="noopener noreferrer">Live demo <span aria-hidden="true">↗</span></a>}
              </div>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
