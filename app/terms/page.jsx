import { SITE } from "../site.config";

export const metadata = {
  title: `Términos de servicio · ${SITE.name}`,
  description: `Términos y condiciones de uso de ${SITE.name}.`,
};

export default function TermsOfService() {
  return (
    <main>
      <header className="page-head">
        <div className="tricolor-bar" aria-hidden="true" />
        <p className="kicker">Legal</p>
        <h1 className="h1">Términos de servicio</h1>
        <p className="lead">Última actualización: 3 de julio de 2026</p>
      </header>

      <section className="section prose legal-page">
        <h2 className="h3">1. Aceptación de los términos</h2>
        <p>
          Al acceder y usar el sitio web de {SITE.name} ({SITE.website}),
          aceptas estos términos de servicio. Si no estás de acuerdo, por favor
          no uses nuestro sitio.
        </p>

        <h2 className="h3">2. Uso del sitio</h2>
        <p>
          Este sitio web te permite explorar nuestro menú, realizar pedidos en
          línea y comunicarte con nosotros. Te comprometes a usar el sitio de
          forma legal y respetuosa, y a no:
        </p>
        <ul>
          <li>Intentar acceder a áreas restringidas del sitio sin autorización.</li>
          <li>Interferir con el funcionamiento del sitio.</li>
          <li>Proporcionar información falsa al realizar pedidos.</li>
          <li>Usar el sitio para actividades ilegales o no autorizadas.</li>
        </ul>

        <h2 className="h3">3. Pedidos y pagos</h2>
        <ul>
          <li>Los precios están en dólares estadounidenses (USD) y no incluyen impuestos salvo que se indique lo contrario.</li>
          <li>Los precios pueden cambiar sin previo aviso. El precio vigente es el que aparece en el momento de confirmar tu pedido.</li>
          <li>Los pagos en línea se procesan de forma segura a través de Square.</li>
          <li>Nos reservamos el derecho de rechazar o cancelar pedidos por cualquier motivo, incluyendo errores en precios o disponibilidad de productos.</li>
        </ul>

        <h2 className="h3">4. Disponibilidad del menú</h2>
        <p>
          Los artículos del menú están sujetos a disponibilidad. Hacemos nuestro
          mejor esfuerzo para mantener el menú en línea actualizado, pero algunos
          artículos pueden no estar disponibles en todo momento.
        </p>

        <h2 className="h3">5. Recogida y entrega</h2>
        <ul>
          <li>Los pedidos para recoger deben recogerse en la ubicación y horario indicados.</li>
          <li>Los tiempos de preparación son estimados y pueden variar según la demanda.</li>
          <li>Para entregas a domicilio, la zona de cobertura y tiempos pueden variar.</li>
        </ul>

        <h2 className="h3">6. Cuentas de usuario</h2>
        <p>
          Puedes iniciar sesión con tu cuenta de Google para agilizar el proceso
          de pedido. Al hacerlo, aceptas que accedemos a tu nombre, correo
          electrónico y foto de perfil. Eres responsable de mantener la
          seguridad de tu cuenta.
        </p>

        <h2 className="h3">7. Propiedad intelectual</h2>
        <p>
          Todo el contenido del sitio — incluyendo textos, imágenes, logotipos,
          diseños y código — es propiedad de {SITE.name} y está protegido por
          las leyes de propiedad intelectual. No puedes copiar, modificar ni
          distribuir nuestro contenido sin autorización.
        </p>

        <h2 className="h3">8. Limitación de responsabilidad</h2>
        <p>
          {SITE.name} no será responsable por daños indirectos, incidentales o
          consecuentes derivados del uso del sitio o de nuestros productos. El
          sitio se proporciona &quot;tal como está&quot; sin garantías de ningún
          tipo.
        </p>

        <h2 className="h3">9. Alergias e información nutricional</h2>
        <p>
          Nuestros productos pueden contener alérgenos comunes (gluten, lácteos,
          huevo, soya, frutos secos, entre otros). Si tienes alergias
          alimentarias, contáctanos antes de ordenar al{" "}
          <a href={SITE.phoneHref}>{SITE.phone}</a>.
        </p>

        <h2 className="h3">10. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos términos en cualquier
          momento. Los cambios entran en vigor al publicarse en esta página.
          El uso continuado del sitio después de los cambios constituye la
          aceptación de los nuevos términos.
        </p>

        <h2 className="h3">11. Ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes del estado de California,
          Estados Unidos. Cualquier disputa se resolverá en los tribunales
          del condado de Santa Clara, California.
        </p>

        <h2 className="h3">12. Contacto</h2>
        <p>
          Si tienes preguntas sobre estos términos, contáctanos:
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
