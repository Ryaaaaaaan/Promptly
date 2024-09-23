import type { MessageType } from '@/types';

export function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id) as T;
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element;
}

export function showMessage(message: string, type: MessageType = 'info'): void {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  const styles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--border-color)',
    zIndex: '1001',
    animation: 'slideIn 0.3s ease-out',
    fontSize: '0.9rem',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  };

  Object.assign(toast.style, styles);

  // Couleurs selon le type
  if (type === 'error') {
    toast.style.borderColor = '#ff3b30';
    toast.style.background = 'rgba(255, 59, 48, 0.1)';
  } else if (type === 'success') {
    toast.style.borderColor = '#30d158';
    toast.style.background = 'rgba(48, 209, 88, 0.1)';
  } else if (type === 'warning') {
    toast.style.borderColor = '#ff9500';
    toast.style.background = 'rgba(255, 149, 0, 0.1)';
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

export function scrollToElement(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
  element.scrollIntoView({
    behavior,
    block: 'center',
    inline: 'nearest'
  });
}

// Ajouter les animations CSS pour les toasts
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;

if (!document.head.querySelector('style[data-toast-styles]')) {
  toastStyles.setAttribute('data-toast-styles', 'true');
  document.head.appendChild(toastStyles);
}