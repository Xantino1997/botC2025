'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Home() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchQr = async () => {
    try {
      const res = await axios.get('https://botcback2025.onrender.com/api/qr');
      if (res.data.qr) {
        setQr(res.data.qr);
      } else {
        setQr(null);
      }
    } catch (error) {
      console.error('Error al obtener el QR:', error);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await axios.get('https://botcback2025.onrender.com/api/status');
      setStatus(res.data.status);

      const alreadyShown = localStorage.getItem('alertShown') === 'true';
      if (res.data.status === 'activo' && !alreadyShown) {
        Swal.fire({
          title: 'Conexión exitosa',
          text: 'El bot está conectado a WhatsApp',
          icon: 'success',
          timer: 2500,
          showConfirmButton: false
        });
        localStorage.setItem('alertShown', 'true');
      }

      if (res.data.status !== 'activo') {
        localStorage.setItem('alertShown', 'false');
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
    }
  };

  const fetchUserCount = async () => {
    try {
      const res = await axios.get('https://botcback2025.onrender.com/api/users');
      setUserCount(res.data.count || 0);
    } catch (error) {
      console.error('Error al obtener el número de usuarios:', error);
    }
  };

  const handleSessionToggle = async () => {
    setLoading(true);
    try {
      if (status === 'activo') {
        // Cerrar sesión
        await axios.get('https://botcback2025.onrender.com/api/logout');
        Swal.fire('Sesión cerrada', 'El bot se desconectó.', 'info');
      } else {
        // Forzar reconexión: recargar la app (backend ya se inicializa solo)
        await axios.get('https://botcback2025.onrender.com/api/qr');
        Swal.fire('Intentando iniciar sesión...', 'Escaneá el QR si aparece.', 'info');
      }
      await checkStatus();
      await fetchQr();
    } catch (error) {
      console.error('Error al manejar sesión:', error);
      Swal.fire('Error', 'Ocurrió un error al cambiar la sesión.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQr();
    checkStatus();
    fetchUserCount();
    const interval = setInterval(() => {
      fetchQr();
      checkStatus();
      fetchUserCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Escaneá el código QR</h1>

      {qr && (
        <div>
          <img src={qr} alt="Código QR" style={{ width: 300, height: 300 }} />
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        border: '1px solid #ccc',
        borderRadius: '10px',
        display: 'inline-block',
        fontSize: '1.2rem'
      }}>
        <span
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: status === 'activo' ? 'green' : 'red',
            marginRight: '8px',
            verticalAlign: 'middle'
          }}
        ></span>
        {status === 'activo'
          ? <>🤖 Estoy atendiendo a <strong>{userCount}</strong> persona{userCount !== 1 && 's'}</>
          : <>🤖 Bot fuera de servicio</>
        }
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={handleSessionToggle}
          disabled={loading}
          style={{
            backgroundColor: status === 'activo' ? 'red' : 'green',
            color: 'white',
            padding: '0.6rem 1.2rem',
            fontSize: '1rem',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {status === 'activo' ? 'Cerrar sesión' : 'Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}
