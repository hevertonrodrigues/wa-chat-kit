import type { ChatMessage } from '../../core/types';
import type { ChatLabels } from '../../core/i18n';
import { FormattedText } from '../FormattedText';

export function TextBody({ message }: { message: ChatMessage }) {
  return <p className="wck-text">{message.text ? <FormattedText text={message.text} /> : null}</p>;
}

export function LocationBody({ message, labels }: { message: ChatMessage; labels: ChatLabels }) {
  const location = message.location;
  if (!location) return <p className="wck-text wck-unsupported">{labels.unsupported}</p>;
  const href = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  return (
    <div className="wck-location">
      <span aria-hidden>📍</span>
      <div>
        {location.name && <p className="wck-location-name">{location.name}</p>}
        {location.address && <p className="wck-location-address">{location.address}</p>}
        <a href={href} target="_blank" rel="noopener noreferrer">
          {labels.viewLocation}
        </a>
      </div>
    </div>
  );
}

export function ContactsBody({ message, labels }: { message: ChatMessage; labels: ChatLabels }) {
  const contacts = message.contacts ?? [];
  return (
    <div className="wck-contacts">
      {contacts.map((contact, index) => (
        <div key={index} className="wck-contact-card">
          <span className="wck-contact-avatar" aria-hidden>
            👤
          </span>
          <div>
            <p className="wck-contact-name">{contact.name || labels.contactCard}</p>
            {contact.phones.map((phone) => (
              <p key={phone} className="wck-contact-phone">
                {phone}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TemplateBody({ message, labels }: { message: ChatMessage; labels: ChatLabels }) {
  return (
    <div className="wck-template">
      <span className="wck-badge">{labels.templateBadge}</span>
      {message.template?.name && <p className="wck-template-name">{message.template.name}</p>}
      {message.text && (
        <p className="wck-text">
          <FormattedText text={message.text} />
        </p>
      )}
    </div>
  );
}

/** Interactive prompts render their options; inbound replies show the tapped title. */
export function InteractiveBody({ message, labels }: { message: ChatMessage; labels: ChatLabels }) {
  const interactive = message.interactive;
  return (
    <div className="wck-interactive">
      {message.direction === 'out' && <span className="wck-badge">{labels.interactiveBadge}</span>}
      {(interactive?.text ?? message.text) && (
        <p className="wck-text">
          <FormattedText text={interactive?.text ?? message.text ?? ''} />
        </p>
      )}
      {interactive?.options && interactive.options.length > 0 && (
        <div className="wck-interactive-options" role="list">
          {interactive.options.map((option) => (
            <span key={option.id} role="listitem" className="wck-interactive-option">
              {option.title}
            </span>
          ))}
        </div>
      )}
      {message.direction === 'in' && interactive?.selectedTitle && (
        <p className="wck-interactive-selected">☑ {interactive.selectedTitle}</p>
      )}
    </div>
  );
}

export function UnsupportedBody({ labels }: { labels: ChatLabels }) {
  return <p className="wck-text wck-unsupported">{labels.unsupported}</p>;
}
