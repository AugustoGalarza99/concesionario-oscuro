import { useState } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import "./preventaform.css"

export default function Preventa() {
  const [vehicleImage, setVehicleImage] = useState(null)

  const [data, setData] = useState({
    concesionario: "",
    asesor: "",
    emailVendedor: "",
    fecha: new Date().toISOString().split('T')[0],
    cliente: "",
    nacimiento: "",
    telefono: "",
    emailCliente: "",
    cuil: "",
    profesion: "",
    iva: "",
    domicilio: "",
    estadoCivil: "",
    modelo: "",
    puertas: "5",
    cilindrada: "",
    combustible: "Nafta",
    potencia: "",
    transmision: "Manual",
    color: "",
    vin: "",
    precio: 0,
    flete: "",
    bonificacion: 0,
    capital: 0,
    cuotas: "",
    tna: "", 
    gastosEntrega: 0,
    formularios: 0,
    gastoFinanciacion: 0
  })

  const update = (field, value) => setData({ ...data, [field]: value })
  const money = (v) => Number(v).toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 })
  const calcularCuota = (capital, tna, cuotas) => {
  capital = Number(capital)
  tna = Number(tna)
  cuotas = Number(cuotas)

  if (!capital || !tna || !cuotas) return 0

  const tasaMensual = (tna / 100) / 12

  const cuota =
    capital *
    (tasaMensual * Math.pow(1 + tasaMensual, cuotas)) /
    (Math.pow(1 + tasaMensual, cuotas) - 1)

  return cuota
}

  const subtotal = Number(data.precio) + Number(data.flete) - Number(data.bonificacion)
  const cuotaPromedio = calcularCuota(
    Number(data.capital),
    Number(data.tna),
    Number(data.cuotas)
  )

  const totalPagado = cuotaPromedio * Number(data.cuotas)
  const interesTotal = totalPagado - Number(data.capital)
  const saldoCancelar = subtotal - Number(data.capital) + Number(data.gastosEntrega) + Number(data.formularios) + Number(data.gastoFinanciacion)

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (file) setVehicleImage(URL.createObjectURL(file))
  }

  async function descargarPDF() {
    const element = document.getElementById("pdfArea");
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/jpeg", 0.8);
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    pdf.addImage(imgData, "JPEG", 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`Preventa_${data.cliente || 'Vehiculo'}.pdf`);
  }

  return (
    <div className="app-wrapper">
      <nav className="premium-navbar">
        <span className="badge">PREVENTA V2.6 - OPTIMIZADO</span>
        <button className="download-cta" onClick={descargarPDF}>GENERAR PDF</button>
      </nav>

      <div className="main-content">
        <aside className="editor-panel">
          <div className="editor-group">
            <h3>🏢 Operación y Asesor</h3>
            <input type="text" placeholder="Concesionario" value={data.concesionario} onChange={e => update("concesionario", e.target.value)} />
            <input type="text" placeholder="Asesor Comercial" value={data.asesor} onChange={e => update("asesor", e.target.value)} />
            <input type="date" value={data.fecha} onChange={e => update("fecha", e.target.value)} />
          </div>

          <div className="editor-group">
            <h3>👤 Cliente</h3>
            <input type="text" placeholder="Nombre Completo" value={data.cliente} onChange={e => update("cliente", e.target.value)} />
            <div className="row">
                <input type="text" placeholder="IVA" value={data.iva} onChange={e => update("iva", e.target.value)} />
                <input type="text" placeholder="Estado Civil" value={data.estadoCivil} onChange={e => update("estadoCivil", e.target.value)} />
            </div>
            <input type="text" placeholder="Teléfono" value={data.telefono} onChange={e => update("telefono", e.target.value)} />
            <input type="email" placeholder="Email" value={data.emailCliente} onChange={e => update("emailCliente", e.target.value)} />
            <input type="text" placeholder="CUIL/DNI" value={data.cuil} onChange={e => update("cuil", e.target.value)} />
          </div>

          <div className="editor-group">
            <h3>🚗 Vehículo</h3>

            <input
              type="text"
              placeholder="Modelo"
              value={data.modelo}
              onChange={e => update("modelo", e.target.value)}
            />

            <div className="grid-2col">

              <div className="input-with-label">
                <label>Puertas</label>
                <input
                  type="number"
                  value={data.puertas}
                  onChange={e => update("puertas", e.target.value)}
                />
              </div>

              <div className="input-with-label">
                <label>Cilindrada</label>
                <input
                  type="text"
                  value={data.cilindrada}
                  onChange={e => update("cilindrada", e.target.value)}
                />
              </div>

              <div className="input-with-label">
                <label>Combustible</label>
                <select
                  value={data.combustible}
                  onChange={e => update("combustible", e.target.value)}
                >
                  <option>Nafta</option>
                  <option>Diésel</option>
                  <option>Híbrido</option>
                  <option>Eléctrico</option>
                </select>
              </div>

              <div className="input-with-label">
                <label>Potencia (CV)</label>
                <input
                  type="number"
                  value={data.potencia}
                  onChange={e => update("potencia", e.target.value)}
                />
              </div>

              <div className="input-with-label">
                <label>Transmisión</label>
                <select
                  value={data.transmision}
                  onChange={e => update("transmision", e.target.value)}
                >
                  <option>Manual</option>
                  <option>Automática</option>
                  <option>CVT</option>
                </select>
              </div>

              <div className="input-with-label">
                <label>Color</label>
                <input
                  type="text"
                  value={data.color}
                  onChange={e => update("color", e.target.value)}
                />
              </div>

            </div>

            <input
              type="text"
              placeholder="VIN / Nº de chasis"
              value={data.vin}
              onChange={e => update("vin", e.target.value)}
            />

            <input type="file" className="custom-file" onChange={handleImage} />
          </div>

          <div className="editor-group">
            <h3>💰 Costos y Finanzas</h3>
            <div className="grid-2col">
                <div className="input-with-label"><label>Precio</label><input type="number" value={data.precio} onChange={e => update("precio", e.target.value)} /></div>
                <div className="input-with-label"><label>Bonif.</label><input type="number" value={data.bonificacion} onChange={e => update("bonificacion", e.target.value)} /></div>
                <div className="input-with-label"><label>Capital</label><input type="number" value={data.capital} onChange={e => update("capital", e.target.value)} /></div>
                <div className="input-with-label"><label>Formularios</label><input type="number" value={data.formularios} onChange={e => update("formularios", e.target.value)} /></div>
                <div className="input-with-label"><label>Financiac.</label><input type="number" value={data.gastoFinanciacion} onChange={e => update("gastoFinanciacion", e.target.value)} /></div>
                <div className="input-with-label"><label>Gastos Ent.</label><input type="number" value={data.gastosEntrega} onChange={e => update("gastosEntrega", e.target.value)} /></div>
            </div>
            <div className="row">
                <input type="number" placeholder="Cuotas" value={data.cuotas} onChange={e => update("cuotas", e.target.value)} />
                <input type="number" placeholder="TNA%" value={data.tna} onChange={e => update("tna", e.target.value)} />
            </div>
          </div>

        </aside>

        <main className="preview-area">
          <div id="pdfArea" className="pdf-sheet">
            <header className="pdf-header">
              <div className="logo-box">
                <img src="/logo.png" alt="LOGO" />
                <p className="concesionario-name">{data.concesionario}</p>
              </div>
              <div className="title-box">
                <h1>Solicitud de Venta</h1>
                <p className="pdf-date">Fecha: {data.fecha.split('-').reverse().join('/')}</p>
              </div>
            </header>

            <div className="pdf-body">
              <div className="section-header">DATOS DE OPERACIÓN</div>
              <div className="info-grid compact">
                <div className="info-col">
                  <p><span>Asesor:</span> {data.asesor}</p>
                  <p><span>Cliente:</span> {data.cliente}</p>
                  <p><span>Email:</span> {data.emailCliente}</p>
                </div>
                <div className="info-col">
                  <p><span>IVA:</span> {data.iva}</p>
                  <p><span>DNI / CUIL:</span> {data.cuil}</p>
                  <p><span>Teléfono:</span> {data.telefono}</p>
                </div>
              </div>

              <div className="vehicle-premium-card compact">
                <div className="v-header">{data.modelo || 'UNIDAD'}</div>
                <div className="v-content">
                  <div className="v-image-small">
                    {vehicleImage && <img src={vehicleImage} alt="Auto" />}
                  </div>
                  <div className="v-details">

                    <div className="v-spec">
                      <span>Puertas</span>
                      <strong>{data.puertas}</strong>
                    </div>

                    <div className="v-spec">
                      <span>Motor</span>
                      <strong>{data.cilindrada}</strong>
                    </div>

                    <div className="v-spec">
                      <span>Combustible</span>
                      <strong>{data.combustible}</strong>
                    </div>

                    <div className="v-spec">
                      <span>Potencia</span>
                      <strong>{data.potencia} CV</strong>
                    </div>

                    <div className="v-spec">
                      <span>Transmisión</span>
                      <strong>{data.transmision}</strong>
                    </div>

                    <div className="v-spec">
                      <span>Color</span>
                      <strong>{data.color}</strong>
                    </div>

                    <div className="v-spec v-spec-full">
                      <span>VIN</span>
                      <strong>{data.vin}</strong>
                    </div>

                  </div>
                </div>
              </div>

              <table className="price-table compact-table">
                <tbody>
                  <tr><td>Precio de Lista</td><td className="amount">{money(data.precio)}</td></tr>
                  <tr className="discount"><td>Bonificación</td><td className="amount">-{money(data.bonificacion)}</td></tr>
                  <tr className="subtotal"><td>Subtotal Unidad</td><td className="amount">{money(subtotal)}</td></tr>
                  <tr className="finance"><td>Capital a Financiar</td><td className="amount">-{money(data.capital)}</td></tr>
                  <tr><td>Formularios y Gastos Financiación</td><td className="amount">{money(Number(data.formularios) + Number(data.gastoFinanciacion))}</td></tr>
                  <tr><td>Gastos de Entrega</td><td className="amount">{money(data.gastosEntrega)}</td></tr>
                  <tr className="total-final">
                    <td>TOTAL A CANCELAR</td>
                    <td className="amount">{money(saldoCancelar)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="finance-footer-compact">
                <div className="f-item"><span>CUOTAS</span><strong>{data.cuotas}</strong></div>
                <div className="f-item"><span>PROMEDIO</span><strong>{money(cuotaPromedio)}</strong></div>
                <div className="f-item"><span>TNA</span><strong>{data.tna}%</strong></div>
              </div>

              <footer className="sign-area-fixed">
                <div className="sign-block"><div className="s-line"></div><p>Firma del Cliente</p></div>
                <div className="sign-block"><div className="s-line"></div><p>Autorización</p></div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}