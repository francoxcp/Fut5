import React from 'react'

export default function WhatsAppBubble({ phone = '+50670000000', message = 'Hola, tengo una consulta sobre reservas.' }){
  const encoded = encodeURIComponent(message)
  const href = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encoded}`
  return (
    <a className="whatsapp-bubble" href={href} target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp">
      <span className="wa-icon" aria-hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.52 3.48A11.85 11.85 0 0 0 12 0C5.373 0 .02 5.354 0 12c0 2.116.53 4.17 1.538 5.997L0 24l6.27-1.645A11.915 11.915 0 0 0 12 24c6.627 0 12-5.373 12-12 0-3.2-1.246-6.2-3.48-8.52z" fill="#25D366"/>
          <path d="M17.23 14.07c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.62.13-.19.27-.73.88-.9 1.06-.17.19-.34.22-.63.08-.29-.13-1.22-.45-2.32-1.43-.86-.78-1.44-1.74-1.61-2.03-.17-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.62-1.5-.85-2.07-.22-.54-.45-.47-.62-.48l-.53-.01c-.18 0-.46.06-.7.26-.24.19-.92.9-.92 2.2 0 1.31.94 2.58 1.07 2.76.13.17 1.84 2.86 4.46 3.9 2.62 1.05 2.62.7 3.09.66.47-.04 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.07-.12-.26-.18-.53-.31z" fill="#fff"/>
        </svg>
      </span>
    </a>
  )
}
