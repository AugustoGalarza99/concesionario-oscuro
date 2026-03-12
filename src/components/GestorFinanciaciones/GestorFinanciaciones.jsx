import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import { useAuth } from "../../context/AuthContext";

import { Plus, Trash2, Save, FileText } from "lucide-react";
import { toast } from "sonner";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./GestorFinanciaciones.css";

export default function GestorFinanciaciones(){

const { dealershipId } = useDealership()
const { isAdmin } = useAuth()

const [activeTab,setActiveTab]=useState("builder")

const [banks,setBanks]=useState([])
const [selectedBank,setSelectedBank]=useState(null)

const [newBank,setNewBank]=useState({
nombre:"",
cft_anual:"",
})

const [seller,setSeller] = useState("")
const [phone,setPhone] = useState("")
const [address,setAddress] = useState("")

/* CONFIG */

const [title,setTitle]=useState("")
const [dealershipName,setDealershipName]=useState("")

const [sectionMain,setSectionMain]=useState("")
const [sectionSmall,setSectionSmall]=useState("")

const [extraSchema,setExtraSchema]=useState([])

const [sellerLabel,setSellerLabel]=useState("Firma vendedor")
const [buyerLabel,setBuyerLabel]=useState("Firma cliente")

/* FORM */

const [fields,setFields]=useState({})
const [capital,setCapital]=useState("")
const [cuotas,setCuotas]=useState("")

const [pdfPreview,setPdfPreview] = useState(null)

/* LOAD */

useEffect(()=>{
if(!dealershipId) return
load()
loadBanks()
},[dealershipId])

async function load(){

const {data}=await supabase
.from("financiacion_builder")
.select("*")
.eq("dealership_id",dealershipId)
.single()

if(data){

setTitle(data.title||"PRESUPUESTO")
setDealershipName(data.dealership_name||"")

setSectionMain(data.section_main||"")
setSectionSmall(data.section_small||"")

setExtraSchema(data.extra_schema||[])

}

}

async function loadBanks(){

const {data}=await supabase
.from("financiacion_bancos")
.select("*")
.eq("dealership_id",dealershipId)

if(data) setBanks(data)

}

/* SAVE CONFIG */

async function saveConfig(){

if(!isAdmin) return

await supabase
.from("financiacion_builder")
.upsert({

dealership_id:dealershipId,
title,
dealership_name:dealershipName,
section_main:sectionMain,
section_small:sectionSmall,
extra_schema:extraSchema,

updated_at:new Date().toISOString()

},{onConflict:"dealership_id"})

toast.success("Configuración guardada")

}

/* BANK CRUD */

async function addBank(){

if(!newBank.nombre) return

await supabase
.from("financiacion_bancos")
.insert({
dealership_id:dealershipId,
...newBank
})

setNewBank({
nombre:"",
cft_anual:"",
})

loadBanks()

}

async function deleteBank(id){

await supabase
.from("financiacion_bancos")
.delete()
.eq("id",id)

loadBanks()

}

/* CALCULO FINANCIERO */

function calcularCuota(capital,cft,cuotas){

capital=Number(capital)
cft=Number(cft)
cuotas=Number(cuotas)

if(!capital||!cft||!cuotas) return 0

const tasa=(cft/100)/12

return capital*(tasa*Math.pow(1+tasa,cuotas))/
(Math.pow(1+tasa,cuotas)-1)

}

/* AMORTIZACION */

function generarTabla(capital,cft,cuotas){

const tasa=(cft/100)/12
let saldo=capital
const cuota=calcularCuota(capital,cft,cuotas)

let tabla=[]

for(let i=1;i<=cuotas;i++){

const interes=saldo*tasa
const amort=cuota-interes

saldo-=amort

tabla.push([
i,
interes.toFixed(0),
amort.toFixed(0),
saldo.toFixed(0)
])

}

return tabla

}

/* VARIABLES TEXTO */

function buildMainText(){

let text=sectionMain

const vars={

cliente:fields.cliente||"",
vehiculo:fields.vehiculo||"",
banco:selectedBank?.nombre||"",
monto:capital,
cuotas,
cuota:calcularCuota(capital,selectedBank?.cft_anual||0,cuotas).toFixed(0),
cft:selectedBank?.cft_anual||"",
fecha:new Date().toLocaleDateString(),

vendedor:seller,
telefono:phone,
direccion:address

}

Object.keys(vars).forEach(key=>{
text=text.replaceAll(`{${key}}`,vars[key])
})

return text

}

async function buildPDF(){

if(!selectedBank) return null

const cuota=calcularCuota(capital,selectedBank.cft_anual,cuotas)

const pdf=new jsPDF()

const pageWidth=pdf.internal.pageSize.width

/* LOGO */

try{

const img=new Image()
img.src="/logo.png"

await new Promise(res=>img.onload=res)

const ratio=img.width/img.height

const h=16
const w=h*ratio

pdf.addImage(img,"PNG",14,10,w,h)

}catch{}

/* TITULO */

pdf.setFont("helvetica","bold")
pdf.setFontSize(18)

pdf.text(title,pageWidth/2,20,{align:"center"})

pdf.setFontSize(11)

pdf.text(dealershipName,pageWidth/2,27,{align:"center"})

pdf.setFontSize(10)

pdf.text(
`Fecha: ${new Date().toLocaleDateString()}`,
pageWidth-40,
20
)

pdf.line(14,32,pageWidth-14,32)

/* BLOQUE CLIENTE */

let y=45

pdf.setFont("helvetica","bold")

pdf.text("DATOS CONCESIONARIO",14,y)
pdf.text("DATOS CLIENTE",110,y)

y+=6

pdf.setFont("helvetica","normal")

pdf.text(`Vendedor: ${seller}`,14,y)
pdf.text(`Cliente: ${fields.cliente||""}`,110,y)

y+=6

pdf.text(`Teléfono: ${phone}`,14,y)
pdf.text(`Vehículo: ${fields.vehiculo||""}`,110,y)

y+=6

pdf.text(`Dirección: ${address}`,14,y)
pdf.text(`Banco: ${selectedBank?.nombre||""}`,110,y)

y+=8

pdf.line(14,y,pageWidth-14,y)

y+=10

/* TEXTO */

pdf.setFontSize(10)

pdf.text(
pdf.splitTextToSize(buildMainText(),180),
14,
y
)

y+=25

/* TABLA FINANCIACION */

autoTable(pdf,{
startY:y,

head:[["Concepto","Detalle"]],

body:[

["Monto financiado",`$${capital}`],
["Cuotas",cuotas],
["CFT anual",`${selectedBank.cft_anual}%`],
["Valor cuota estimada",`$${cuota.toFixed(0)}`]

]

})

y = pdf.lastAutoTable.finalY + 10

pdf.setFontSize(9)

pdf.text(
pdf.splitTextToSize(sectionSmall || "",180),
14,
y
)

/* FIRMAS */

const pageHeight=pdf.internal.pageSize.height

const signY=pageHeight-25

pdf.line(30,signY,90,signY)
pdf.line(120,signY,180,signY)

pdf.setFontSize(10)

pdf.text(sellerLabel,60,signY+5,{align:"center"})
pdf.text(buyerLabel,150,signY+5,{align:"center"})

return pdf

}

/* PDF */

async function generatePDF(){

const pdf = await buildPDF()

if(!pdf) return

pdf.save("presupuesto_financiacion.pdf")

}

async function previewPDF(){

const pdf = await buildPDF()

if(!pdf) return

const blob = pdf.output("blob")

const url = URL.createObjectURL(blob)

setPdfPreview(url)

}

/* UI */

return(

<div id="fin-financiacionesModule" className="finpro-container">

<div className="finpro-tabs">

<button onClick={()=>setActiveTab("builder")}>
Constructor
</button>

<button onClick={()=>setActiveTab("form")}>
Simulador
</button>

</div>

{activeTab==="builder" && (

<div className="finpro-builder">

<h2>Constructor de presupuesto</h2>

<label>Nombre concesionario</label>

<input
value={dealershipName}
onChange={e=>setDealershipName(e.target.value)}
placeholder="Nombre del concesionario"
/>

<label>Título</label>

<input
value={title}
onChange={e=>setTitle(e.target.value)}
placeholder="Titulo del presupuesto"
/>

<label>Texto principal</label>

<textarea
value={sectionMain}
onChange={e=>setSectionMain(e.target.value)}
placeholder="Descargo y/o aclaraciones del presupuesto"
/>

<label>Bancos</label>

<div className="bankAdder">

<input
placeholder="Banco"
value={newBank.nombre}
onChange={e=>setNewBank({...newBank,nombre:e.target.value})}
/>

<input
placeholder="CFT %"
value={newBank.cft_anual}
onChange={e=>setNewBank({...newBank,cft_anual:e.target.value})}
/>

<button onClick={addBank}>
<Plus size={16}/>
</button>

</div>

{banks.map(bank=>(
<div key={bank.id} className="bankRow">

<span>{bank.nombre}</span>

<span>{bank.cft_anual}%</span>

<button onClick={()=>deleteBank(bank.id)}>
<Trash2 size={16}/>
</button>

</div>
))}

<button className="saveBtn" onClick={saveConfig}>
<Save/> Guardar
</button>

</div>

)}

{activeTab==="form" && (

<div className="finpro-form">
    <input
placeholder="Nombre vendedor"
onChange={e=>setSeller(e.target.value)}
/>

<input
placeholder="Teléfono"
onChange={e=>setPhone(e.target.value)}
/>

<input
placeholder="Dirección concesionario"
onChange={e=>setAddress(e.target.value)}
/>

<input
placeholder="Cliente"
onChange={e=>setFields({...fields,cliente:e.target.value})}
/>

<input
placeholder="Vehículo"
onChange={e=>setFields({...fields,vehiculo:e.target.value})}
/>

<select
onChange={e=>{

const bank=banks.find(b=>b.id===e.target.value)

setSelectedBank(bank)

}}
>

<option>Seleccionar banco</option>

{banks.map(b=>(
<option key={b.id} value={b.id}>
{b.nombre} - CFT {b.cft_anual}%
</option>
))}

</select>

<input
placeholder="Monto a financiar"
onChange={e=>setCapital(e.target.value)}
/>

<input
placeholder="Cuotas"
onChange={e=>setCuotas(e.target.value)}
/>

{selectedBank && (

<div className="resultBox">

Cuota estimada

<strong>

${calcularCuota(capital,selectedBank.cft_anual,cuotas).toFixed(0)}

</strong>

</div>

)}

<div style={{display:"flex",gap:"10px"}}>

<button onClick={previewPDF}>
Preview
</button>

<button onClick={generatePDF}>
<FileText/> Descargar PDF
</button>

</div>

</div>

)}

{pdfPreview && (

<div className="pdfPreview">

<iframe
src={pdfPreview}
title="preview"
width="100%"
height="600"
/>

</div>

)}

</div>

)

}