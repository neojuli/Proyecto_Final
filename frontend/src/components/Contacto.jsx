import { useState } from 'react';
import './Contacto.css';

const INICIAL = { nombre: '', correo: '', asunto: '', mensaje: '' };

export default function Contacto() {
  const [datos, setDatos] = useState(INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos(actual => ({ ...actual, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setExito('');
    setError('');
    try {
      const respuesta = await fetch('/api/contacto', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo enviar el mensaje.');
      setExito('¡Mensaje enviado! Gracias por escribirnos.');
      setDatos(INICIAL);
    } catch (err) {
      setError(err.message || 'Error de conexión. Inténtalo nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contacto-contenido">
      <div className="contacto-presentacion">
        <h3>¿Tienes alguna pregunta?</h3>
        <p>Escríbenos sobre nuestros sabores, pedidos o cualquier inquietud. Estaremos encantados de ayudarte.</p>
        <p className="contacto-aclaracion">Los mensajes se envían directamente a Gota de Nieve.</p>
      </div>
      <form className="contacto-formulario" onSubmit={enviar}>
        <div className="contacto-dos-columnas">
          <label>Nombre completo
            <input name="nombre" value={datos.nombre} onChange={cambiar} minLength={2} maxLength={100} required autoComplete="name" />
          </label>
          <label>Correo electrónico
            <input type="email" name="correo" value={datos.correo} onChange={cambiar} maxLength={150} required autoComplete="email" />
          </label>
        </div>
        <label>Asunto
          <input name="asunto" value={datos.asunto} onChange={cambiar} minLength={3} maxLength={120} required />
        </label>
        <label>Mensaje
          <textarea name="mensaje" value={datos.mensaje} onChange={cambiar} minLength={10} maxLength={2000} rows={5} required />
        </label>
        {error && <p role="alert" className="contacto-error">{error}</p>}
        {exito && <p role="status" className="contacto-exito">{exito}</p>}
        <button type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar mensaje'}</button>
      </form>
    </div>
  );
}
