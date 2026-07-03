import { SITE } from "../site.config";

export const metadata = {
  title: `Política de privacidad · ${SITE.name}`,
  description: `Política de privacidad de ${SITE.name}. Cómo recopilamos, usamos y protegemos tu información personal.`,
};

export default function PrivacyPolicy() {
  return (
    <main>
      <header className="page-head">
        <div className="tricolor-bar" aria-hidden="true" />
        <p className="kicker">Legal</p>
        <h1 className="h1">Política de privacidad</h1>
        <p className="lead">Última actualización: 3 de julio de 2026</p>
      </header>

      <section className="section prose legal-page">
        <h2 className="h3">1. Información que recopilamos</h2>
        <p>
          Al usar nuestro sitio web o realizar un pedido, podemos recopilar la
          siguiente información:
        </p>
        <ul>
          <li><strong>Información personal:</strong> nombre, correo electrónico, número de teléfono y dirección de entrega cuando realizas un pedido.</li>
          <li><strong>Información de cuenta:</strong> si inicias sesión con Google, recibimos tu nombre, correo electrónico y foto de perfil de tu cuenta de Google.</li>
          <li><strong>Información de pago:</strong> los pagos se procesan de forma segura a través de Square. Nunca almacenamos números de tarjeta de crédito ni datos financieros en nuestros servidores.</li>
          <li><strong>Datos de uso:</strong> información sobre cómo interactúas con nuestro sitio (páginas visitadas, dispositivo, navegador) a través de Vercel Analytics.</li>
        </ul>

        <h2 className="h3">2. Cómo usamos tu información</h2>
        <p>Usamos tu información para:</p>
        <ul>
          <li>Procesar y entregar tus pedidos.</li>
          <li>Enviar confirmaciones de pedido por correo electrónico.</li>
          <li>Comunicarnos contigo sobre tu pedido si es necesario.</li>
          <li>Mejorar nuestro sitio web y la experiencia del cliente.</li>
          <li>Enviarte ofertas y novedades solo si diste tu consentimiento explícito.</li>
        </ul>

        <h2 className="h3">3. Compartir información</h2>
        <p>
          No vendemos, alquilamos ni compartimos tu información personal con
          terceros para fines de marketing. Compartimos datos únicamente con:
        </p>
        <ul>
          <li><strong>Square:</strong> para procesar pagos de forma segura.</li>
          <li><strong>Supabase:</strong> para almacenar datos de pedidos de forma segura.</li>
          <li><strong>Resend:</strong> para enviar correos electrónicos transaccionales (confirmaciones de pedido).</li>
          <li><strong>Vercel:</strong> para el alojamiento y análisis del sitio web.</li>
        </ul>

        <h2 className="h3">4. Seguridad</h2>
        <p>
          Protegemos tu información con medidas de seguridad estándar de la
          industria, incluyendo cifrado HTTPS, tokens CSRF y Row Level Security
          en nuestra base de datos. Los pagos se procesan a través de la
          infraestructura certificada PCI-DSS de Square.
        </p>

        <h2 className="h3">5. Cookies</h2>
        <p>
          Usamos cookies esenciales para el funcionamiento del sitio (sesión de
          autenticación, carrito de compras). No usamos cookies de rastreo de
          terceros con fines publicitarios.
        </p>

        <h2 className="h3">6. Tus derechos</h2>
        <p>Tienes derecho a:</p>
        <ul>
          <li>Solicitar acceso a los datos personales que tenemos sobre ti.</li>
          <li>Solicitar la corrección o eliminación de tus datos.</li>
          <li>Cancelar la suscripción a correos de marketing en cualquier momento.</li>
          <li>Solicitar que dejemos de procesar tus datos personales.</li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, contáctanos al{" "}
          <a href={SITE.phoneHref}>{SITE.phone}</a>.
        </p>

        <h2 className="h3">7. Menores de edad</h2>
        <p>
          Nuestro sitio no está dirigido a menores de 13 años. No recopilamos
          intencionalmente información de menores de 13 años.
        </p>

        <h2 className="h3">8. Cambios a esta política</h2>
        <p>
          Podemos actualizar esta política periódicamente. Publicaremos los
          cambios en esta página con la fecha de la última actualización.
        </p>

        <h2 className="h3">9. Contacto</h2>
        <p>
          Si tienes preguntas sobre esta política de privacidad, contáctanos:
        </p>
        <ul>
          <li>Teléfono: <a href={SITE.phoneHref}>{SITE.phone}</a></li>
          <li>Dirección: 960 S First St, San Jose, CA 95110</li>
          <li>Instagram: <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">@elperri.food</a></li>
        </ul>
      </section>
    </main>
  );
}
