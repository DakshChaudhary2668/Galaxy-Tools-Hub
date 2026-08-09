'use client';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

// TODO: implement styling — L3 elevation, 8px radius, backdrop overlay
export function Modal({ open, onClose, children, title }: ModalProps) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal aria-labelledby={title ? 'modal-title' : undefined}>
      {title && <h2 id="modal-title">{title}</h2>}
      <button onClick={onClose} aria-label="Close">✕</button>
      {children}
    </div>
  );
}
