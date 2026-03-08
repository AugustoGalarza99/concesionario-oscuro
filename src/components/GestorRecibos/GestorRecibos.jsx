import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import { useAuth } from "../../context/AuthContext";

import { Save, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

import "./GestorRecibos.css";

export default function GestorRecibos() {

const { dealershipId } = useDealership();
const { isAdmin } = useAuth();

const [activeTab,setActiveTab] = useState("builder");

/* CONFIG */

const [title,setTitle] = useState("RECIBO DE PAGO");
const [dealershipName,setDealershipName] = useState("");

const [sectionMain,setSectionMain] = useState("");
const [sectionSmall,setSectionSmall] = useState("");

const [extraSchema,setExtraSchema] = useState([]);

const [sellerLabel,setSellerLabel] = useState("Firma vendedor");
const [buyerLabel,setBuyerLabel] = useState("Firma cliente");

const [fields,setFields] = useState({});

/* LOAD */

useEffect(()=>{

if(!dealershipId) return;

load();

},[dealershipId]);

const load = async ()=>{

const {data,error} = await supabase
.from("recibos_builder")
.select("*")
.eq("dealership_id",dealershipId)
.single();

if(error && error.code !== "PGRST116"){
console.error(error);
return;
}

if(data){

setTitle(data.title || "RECIBO DE PAGO");
setDealershipName(data.dealership_name || "Nombre del Concesionario");

setSectionMain(data.section_main || "");
setSectionSmall(data.section_small || "");

setExtraSchema(data.extra_schema || []);

setSellerLabel(data.seller_label || "Firma vendedor");
setBuyerLabel(data.buyer_label || "Firma cliente");

}

};

/* SAVE */

const saveConfig = async ()=>{

if(!isAdmin){
toast.error("Solo administrador");
return;
}

const {error} = await supabase
.from("recibos_builder")
.upsert({

dealership_id:dealershipId,

dealership_name:dealershipName,

title,

section_main:sectionMain,
section_small:sectionSmall,

extra_schema:extraSchema,

seller_label:sellerLabel,
buyer_label:buyerLabel,

updated_at:new Date().toISOString()

},{onConflict:"dealership_id"});

if(error){
toast.error("Error guardando");
return;
}

toast.success("Configuración guardada");

};

/* BUILDER EXTRA FIELDS */

const addExtraField = ()=>{

setExtraSchema([
...extraSchema,
{ key: Date.now().toString(), label:"" }
]);

};

const updateExtraField = (index,value)=>{

const copy=[...extraSchema];
copy[index].label=value;

setExtraSchema(copy);

};

const removeExtraField = (index)=>{

const copy=[...extraSchema];
copy.splice(index,1);

setExtraSchema(copy);

};

/* FORM */

const handleField=(key,value)=>{

setFields(prev=>({
...prev,
[key]:value
}));

};

/* VARIABLES */

const extractFields=(text)=>{

const matches=text.match(/{(.*?)}/g)||[];

return matches.map(m=>m.replace("{","").replace("}",""));

};

const mainFields=extractFields(sectionMain);

/* GENERAR TEXTO */

const buildMainText=()=>{

let text=sectionMain;

mainFields.forEach(field=>{

text=text.replace(
`{${field}}`,
fields[field] || ""
);

});

return text;

};

/* NUMERO RECIBO */

const getNextReceiptNumber=async()=>{

const {data,error}=await supabase
.from("recibos_builder")
.select("current_number")
.eq("dealership_id",dealershipId)
.single();

if(error){
toast.error("Error obteniendo número");
return 1;
}

const number=data.current_number || 1;

await supabase
.from("recibos_builder")
.update({current_number:number+1})
.eq("dealership_id",dealershipId);

return number;

};

/* PDF */

const generatePDF=async()=>{

const pdf=new jsPDF("p","mm","a4");

const pageWidth=pdf.internal.pageSize.width;

/* LOGO */

try{

const img=new Image();
img.src="/logo.png";

await new Promise(res=>img.onload=res);

const ratio=img.width/img.height;

const h=18;
const w=h*ratio;

pdf.addImage(img,"PNG",14,12,w,h);

}catch{}

/* HEADER */

const today=new Date().toLocaleDateString();

pdf.setFont("helvetica","bold");
pdf.setFontSize(18);

pdf.text(
dealershipName,
pageWidth/2,
20,
{align:"center"}
);

pdf.setFontSize(10);

pdf.text(
`Fecha: ${today}`,
pageWidth-40,
20
);

pdf.line(14,28,pageWidth-14,28);

/* NUMERO */

const number=await getNextReceiptNumber();
const numero=number.toString().padStart(6,"0");

pdf.setFontSize(14);

pdf.text(
`${title} N° ${numero}`,
14,
40
);

/* TEXTO PRINCIPAL */

pdf.setFont("helvetica","normal");
pdf.setFontSize(11);

pdf.text(
pdf.splitTextToSize(buildMainText(),180),
14,
55
);

/* DATOS EXTRA */

let y=90;

extraSchema.forEach(field=>{

pdf.setFont("helvetica","bold");

pdf.text(
field.label+":",
14,
y
);

pdf.setFont("helvetica","normal");

pdf.text(
fields[field.key] || "",
45,
y
);

pdf.setDrawColor(200);
pdf.line(14,y+1,180,y+1);

y+=7;

});

/* LETRA CHICA */

y+=10;

pdf.setFontSize(9);

pdf.text(
pdf.splitTextToSize(sectionSmall,180),
14,
y
);

/* FIRMAS */

const pageHeight=pdf.internal.pageSize.height;

const signY=pageHeight-30;

pdf.line(30,signY,90,signY);
pdf.line(120,signY,180,signY);

pdf.setFontSize(10);

pdf.text(
sellerLabel,
60,
signY+5,
{align:"center"}
);

pdf.text(
buyerLabel,
150,
signY+5,
{align:"center"}
);

pdf.save(`recibo_${numero}.pdf`);

};

/* UI */

return(

<div className="reciboContainer">

<div className="tabs">

<button onClick={()=>setActiveTab("builder")}>
Constructor
</button>

<button onClick={()=>setActiveTab("form")}>
Nuevo recibo
</button>

</div>

{activeTab==="builder" && (

<div className="builderPanel">

<h2>Constructor de recibos</h2>

<label>Nombre concesionario</label>

<input
value={dealershipName}
onChange={(e)=>setDealershipName(e.target.value)}
/>

<label>Título recibo</label>

<input
value={title}
onChange={(e)=>setTitle(e.target.value)}
/>

<label>Texto principal</label>

<textarea
value={sectionMain}
onChange={(e)=>setSectionMain(e.target.value)}
/>

<p className="hint">
Usar variables con llaves:
{"{cliente}"} {"{monto}"} {"{concepto}"}
</p>

<label>Datos adicionales</label>

{extraSchema.map((field,i)=>(

<div key={field.key} className="extraField">

<input
placeholder="Nombre campo"
value={field.label}
onChange={(e)=>updateExtraField(i,e.target.value)}
/>

<button onClick={()=>removeExtraField(i)}>
<Trash2 size={16}/>
</button>

</div>

))}

<button className="addField" onClick={addExtraField}>
<Plus size={16}/> Agregar campo
</button>

<label>Letra chica</label>

<textarea
value={sectionSmall}
onChange={(e)=>setSectionSmall(e.target.value)}
/>

<button className="saveBtn" onClick={saveConfig}>
<Save/> Guardar
</button>

</div>

)}

{activeTab==="form" && (

<div className="formPanel">

{mainFields.map(field=>(

<div key={field}>

<label>{field}</label>

<input
onChange={(e)=>handleField(field,e.target.value)}
/>

</div>

))}

{extraSchema.map(field=>(

<div key={field.key}>

<label>{field.label}</label>

<input
onChange={(e)=>handleField(field.key,e.target.value)}
/>

</div>

))}

<button className="pdfButton" onClick={generatePDF}>
<FileText/> Generar PDF
</button>

</div>

)}

</div>

);

}