import React from "react";
import "./Instrucciones.css";

function Instrucciones() {
  return (
    <div className="instructions-page">
      <div className="instructions-container">
        <h1 className="instructions-title">📘 Guía de uso del Sistema</h1>
        <p className="instructions-intro">
          Bienvenido al panel de gestión del concesionario. En esta sección vas a
          aprender, paso a paso, cómo usar todas las funciones del sistema: Carga de vehiculos, 
          gestion de vehiculos, modificaciones, ventas, carga de banners, ordenamiento, gestion de leads,
          entre todas las funciones que ofrece el sistema.
        </p>

        {/* =========================
            SECCIÓN 1
        ========================= */}
        <section className="instructions-section">
          <h2>1️⃣ Home, productos, clientes y carousel de Banners</h2>
          <p>
            El <strong>Home</strong> muestra:
          </p>
          <ul>
            <li>✔ Una imagen fija (modo por defecto)</li>
            <li>✔ Un carousel de banners (si el admin sube imágenes)</li>
            <li>✔ Productos destacados marcados en el gestor de vehiculos</li>
            <li>✔ Clientes que confiaron en la marca si desea subir (En caso que no quiera subir avisar para eliminar esa seccion)</li>
          </ul>
          
        </section>

        <section className="instructions-section">
          <h2>1️⃣ Vehiculos</h2>
          <p>
            En <strong>Vehiculos</strong> muestra:
          </p>
          <ul>
            <li>✔ Toda la lista de vehiculos cargada en el gestor de vehiculos con una breve descripcion</li>
            <li>✔ Al ingresar a un vehiculo en especifico se vera toda la informacion brindada junto con el boton de contacto</li>
          </ul>
          
        </section>

        <section className="instructions-section">
          <h2>1️⃣ Financiacion y Contacto</h2>
          <p>
            En <strong>Financiacion Y Contacto</strong> muestra:
          </p>
          <ul>
            <li>✔ En estas dos secciones se mostrara informacion sobre el concesionario</li>
            <li>✔ Ambas pesatañas seran configuradas a pedido del concesionario con la informacion que brinde</li>
          </ul>
          
        </section>

        {/* =========================
            SECCIÓN 2
        ========================= */}
        <section className="instructions-section">
          <h2>2️⃣ Vehiculos (Admin y Vendedores)</h2>
          <p>
            En la sección <strong>Vehiculos</strong> podés:
          </p>
          <ul>
            <li>Cargar vehiculos</li>
            <li>Editar vehiculos</li>
            <li>Crear categorias y sub categorias</li>
          </ul>
          <p>
            El sistema muestra automaticamente los vehiculos en la seccion Home si estan destacados y vehiculos todos los vehiculos disponibles:
          </p>
          <ul>
            <li>➜ En el listado de vehiculos veras la informacion de cada vehiuclo, tenes la posibilidad de editar o eliminarlos.</li>
            <li>➜ En el boton de nuevo vehiculo podras agregar un vehiculo nuevo vinculandolo con una patente previamente cargado en ingreso / egreso</li>
            <li>➜ En el boton de categoria podras crear las nuevas categorias y sub categorias. Ejemplo <strong>Categoria: Pegueot</strong> - <strong>Subcategoria: 207</strong></li>
          </ul>
          
        </section>

        {/* =========================
            SECCIÓN 2
        ========================= */}
        <section className="instructions-section">
          <h2>2️⃣ Gestión de Banners (Admin)</h2>
          <p>
            En la sección <strong>Banners</strong> podés:
          </p>
          <ul>
            <li>📤 Subir nuevas imágenes</li>
            <li>🗑 Eliminar banners existentes</li>
            <li>🔀 Reordenarlos arrastrando y soltando</li>
          </ul>
          <p>
            El sistema detecta automáticamente si hay banners configurados:
          </p>
          <ul>
            <li>
              ➜ Si <strong>NO hay banners</strong>: se muestra el fondo fijo con
              texto.
            </li>
            <li>
              ➜ Si <strong>SÍ hay banners</strong>: se oculta el fondo fijo y se
              muestra el carousel.
            </li>
          </ul>
          <p>
            Esto evita que se pisen elementos visuales y mantiene una experiencia
            limpia y profesional.
          </p>
          
        </section>

        {/* =========================
            SECCIÓN 3
        ========================= */}
        <section className="instructions-section">
          <h2>3️⃣ Registrar Ventas </h2>
          <p>
            En la sección <strong>Registrar venta</strong> deberas:
          </p>
          <ul>
            <li>Restritrar las ventas realizadas, cada vendedor registrara su venta realizada ingresando la patente 
            para dejar registrada la venta, nombre, apellido del comprador, precio de venta, telefono, formas de pago y datos extras
            que se necesiten guardar, todo esto quedara alojado en la base de datos y a disposicion del administrador en el dashboard </li>
          </ul>
        </section>

        {/* =========================
            SECCIÓN 4
        ========================= */}
        <section className="instructions-section">
          <h2>4️⃣ Referencias</h2>
          <p>
            En la seccion de <strong>Referencias</strong> podras:
          </p>
          <ul>
            <li> Cargar clientes nuevos a modo de mostrar en tu pagina los ultimos clientes si asi deseas, sera solo a modo visual (NO SE REGISTRA NADA EN BASE DE DATOS)
              en caso de no querer subir clientes solicitar a Dromux la eliminacion momentanea de dicha seccion, la misma se puede habilitar cuando desee.
            </li>
          </ul>
        </section>

        <section className="instructions-section">
          <h2>4️⃣ Dashboard</h2>
          <p>
            En la seccion de <strong>Dashboard</strong> podras:
          </p>
          <ul>
            <li> Esta es la seccion estrella para el dueño del concesionario, podra ver todos los movimientos, ingresos / egresos, agregar gastos, ver rentabilidad,
              stock sin rotacion, stock actual, entre muchas funciones mas. Por consultas o mejoras para el dashboard comunicarse con el soporte de Dromux.
            </li>
          </ul>
        </section>

        <section className="instructions-section">
          <h2>4️⃣ Ingresos y Egresos</h2>
          <p>
            En la seccion de <strong>Ingresos y Egresos</strong> deberas:
          </p>
          <ul>
            <li> Cargar los nuevos vehiculos con los datos solicitados, marca, modelo, año </li>
            <li> Patente (en caso de no tener patente asignada por ser un 0km poner una patente
              variable por ejemplo A-DEFINIR-1) de esta manera se puede vincular una patente al vehiculo que previamente sera subido a la pagina, antes de realizar la venta
              se debera editar la patente por la original para dejar el registro de la venta junto con su patente.
            </li> 
            <li>Se debe ingresar precio al que se recibio / compro el auto para
              luego tener el balance y en caso de ser un usado dejar nombre, apellido y telefono del dueño.
            </li>
          </ul>
        </section>

        <section className="instructions-section">
          <h2>4️⃣ Leads</h2>
          <p>
            En la seccion de <strong>Leads</strong> podras:
          </p>
          <ul>
            <li> Registrar nuevos posibles clientes y consultas para que nada se te pase por alto </li>
            <br></br>
            <li>Esta seccion le sera de mucha ayuda a los vendedores para tener un seguimiento de clientes potenciales para revisar cada dia
              Saber en que estado esta cada cliente, etc.
            </li>
          </ul>
        </section>

        {/* =========================
            SECCIÓN 5
        ========================= */}
        <section className="instructions-section">
          <h2>5️⃣ Buenas Prácticas</h2>
          <ul>
            <li>🖼 Usar imágenes de buena resolución (ideal 1600x900 o más)</li>
            <li>📦 No subir demasiados banners innecesarios</li>
            <li>🔄 Reordenar banners según prioridad comercial</li>
            <li>👀 Revisar el home después de cada cambio</li>
          </ul>
        </section>

        <div className="instructions-footer">
          <p>
            🚀 Con esto, tu concesionario tiene un sistema moderno, rápido y fácil
            de administrar.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Instrucciones;
