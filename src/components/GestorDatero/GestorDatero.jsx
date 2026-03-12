import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import { useAuth } from "../../context/AuthContext";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./GestorDatero.css";

export default function GestorDatero() {
  const { dealershipId } = useDealership();
  const { isAdmin } = useAuth();

  const [schema, setSchema] = useState({ sections: [] });
  const [values, setValues] = useState({});

  const [headerText, setHeaderText] = useState("");
  const [headerColor, setHeaderColor] = useState("#111111");

  const [sellerLabel, setSellerLabel] = useState("Firma vendedor");
  const [buyerLabel, setBuyerLabel] = useState("Firma comprador");

  const [activeTab, setActiveTab] = useState("builder");

  const [fontSize, setFontSize] = useState(9);
  const [cellPadding, setCellPadding] = useState(2);
  const [sectionSpacing, setSectionSpacing] = useState(8);

  /* LOAD */

  useEffect(() => {
  if (!dealershipId) return;

  const load = async () => {

    const { data, error } = await supabase
      .from("dateros")
      .select("*")
      .eq("dealership_id", dealershipId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      return;
    }

    if (data) {
      setSchema(data.schema || { sections: [] });
      setHeaderText(data.header_text || "");
      setHeaderColor(data.header_color || "#111");
      setSellerLabel(data.seller_label || "Firma vendedor");
      setBuyerLabel(data.buyer_label || "Firma comprador");
      setFontSize(data.font_size || 9);
      setCellPadding(data.cell_padding || 2);
      setSectionSpacing(data.section_spacing || 8);
    }
  };

  load();
}, [dealershipId]);

  /* SAVE */

  const saveSchema = async () => {
    if (!isAdmin) {
      toast.error("Solo administrador puede editar");
      return;
    }

    const { error } = await supabase
      .from("dateros")
      .upsert(
      {
        dealership_id: dealershipId,
        schema,
        header_text: headerText,
        header_color: headerColor,
        seller_label: sellerLabel,
        buyer_label: buyerLabel,
        font_size: fontSize,
        cell_padding: cellPadding,
        section_spacing: sectionSpacing,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "dealership_id"
      }
      )

    if (error) {
      toast.error("Error guardando datero");
      return;
    }

    toast.success("Datero guardado");
  };

  /* BUILDER */

  const addSection = () => {
    setSchema((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: "Nueva sección",
          color: "#000000",
          fields: [],
        },
      ],
    }));
  };

  const addField = (sectionIndex) => {
    const newSchema = { ...schema };

    newSchema.sections[sectionIndex].fields.push({
      label: "Campo",
      type: "text",
      required: false,
    });

    setSchema(newSchema);
  };

  const updateField = (s, f, key, value) => {
    const newSchema = { ...schema };
    newSchema.sections[s].fields[f][key] = value;
    setSchema(newSchema);
  };

  const removeField = (s, f) => {
    const newSchema = { ...schema };
    newSchema.sections[s].fields.splice(f, 1);
    setSchema(newSchema);
  };

  const updateSection = (index, key, value) => {
    const newSchema = { ...schema };
    newSchema.sections[index][key] = value;
    setSchema(newSchema);
  };

  /* FORM VALUES */

  const handleValue = (sectionIndex, fieldIndex, value) => {
    const key = `${sectionIndex}_${fieldIndex}`;

    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* PDF GENERATOR */

const generatePDF = async () => {

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.width;

  let startY = 20;

  /* =========================
     LOGO
  ========================= */

  let logoHeight = 18;

  try {

    const img = new Image();
    img.src = "/logo.png";

    await new Promise(resolve => {
      img.onload = resolve;
    });

    const ratio = img.width / img.height;

    const logoWidth = logoHeight * ratio;

    pdf.addImage(
      img,
      "PNG",
      14,
      12,
      logoWidth,
      logoHeight
    );

  } catch {}

  /* =========================
     TITULO CENTRADO
  ========================= */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);

  const title = headerText || "DATERO";

  const textWidth = pdf.getTextWidth(title);

  pdf.text(
    title,
    (pageWidth - textWidth) / 2,
    20
  );

  /* =========================
     FECHA DERECHA
  ========================= */

  const today = new Date();

  const fecha = today.toLocaleDateString();

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  pdf.text(
    `Fecha: ${fecha}`,
    pageWidth - 40,
    20
  );

  /* =========================
     LINEA HEADER
  ========================= */

  pdf.setDrawColor(180);
  pdf.line(14, 28, pageWidth - 14, 28);

  startY = 35;

  /* =========================
     SECCIONES
  ========================= */

  schema.sections.forEach((section, sIndex) => {

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    pdf.setTextColor(section.color || "#1f5ed6");

    pdf.text(
      section.title.toUpperCase(),
      14,
      startY
    );

    /* linea elegante debajo del titulo */

    pdf.setDrawColor(210);
    pdf.line(14, startY + 1, pageWidth - 14, startY + 1);

    /* espacio mínimo seguro debajo del título */
    startY += 6;

    const rows = section.fields.map((field, fIndex) => [
      field.label,
      values[`${sIndex}_${fIndex}`] || ""
    ]);

    autoTable(pdf, {

      startY: startY,

      body: rows,

      theme: "grid",

      styles: {
        fontSize: fontSize,
        cellPadding: cellPadding
      },

      headStyles: {
        fillColor: [255,255,255]
      },

      bodyStyles: {
        lineWidth: 0.2
      },

      columnStyles: {
        0: {
          cellWidth: 75,
          fontStyle: "bold"
        },
        1: {
          cellWidth: 105
        }
      },

      margin: { left: 14, right: 14 }

    });

    startY = pdf.lastAutoTable.finalY + sectionSpacing;

  });

  /* =========================
     FIRMAS
  ========================= */

  const pageHeight = pdf.internal.pageSize.height;

  const signatureY = pageHeight - 25;

  pdf.line(30, signatureY, 90, signatureY);
  pdf.line(120, signatureY, 180, signatureY);

  pdf.setFontSize(9);

  pdf.text(
    sellerLabel,
    60,
    signatureY + 5,
    { align: "center" }
  );

  pdf.text(
    buyerLabel,
    150,
    signatureY + 5,
    { align: "center" }
  );

    pdf.save("datero.pdf");

  };

  const removeSection = (sectionIndex) => {
    const newSchema = { ...schema };

    newSchema.sections.splice(sectionIndex, 1);

    setSchema(newSchema);
  };

  const moveSection = (index, direction) => {

    const newSections = [...schema.sections];

    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setSchema({ ...schema, sections: newSections });

  };

  return (
    <div className="dat-dateroContainer">
      <div className="dat-tabs">
        <button onClick={() => setActiveTab("builder")}>Creador</button>
        <button onClick={() => setActiveTab("form")}>Formulario</button>
      </div>

      {activeTab === "builder" && (
        <div className="dat-builderPanel">
          <div className="dat-headerConfig">
            <div>
              <label>Texto encabezado</label>
              <input
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
              />
            </div>

            <div>
              <label>Color encabezado</label>
              <input
                type="color"
                value={headerColor}
                onChange={(e) => setHeaderColor(e.target.value)}
              />
            </div>

            <div>
              <label>Firma vendedor</label>
              <input
                value={sellerLabel}
                onChange={(e) => setSellerLabel(e.target.value)}
              />
            </div>

            <div>
              <label>Firma comprador</label>
              <input
                value={buyerLabel}
                onChange={(e) => setBuyerLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="dat-pdfConfigPanel">

            <div className="dat-pdfConfigTitle">
              Configuración del PDF
            </div>

            <div className="dat-pdfConfigGrid">

              <div className="dat-pdfConfigItem">
                <label>Tamaño fuente</label>
                <input
                  type="number"
                  min="7"
                  max="14"
                  value={fontSize}
                  onChange={(e)=>setFontSize(Number(e.target.value))}
                />
                <span className="dat-pdfConfigHint">
                  Tamaño del texto en el PDF
                </span>
              </div>

              <div className="dat-pdfConfigItem">
                <label>Alto de celda</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={cellPadding}
                  onChange={(e)=>setCellPadding(Number(e.target.value))}
                />
                <span className="dat-pdfConfigHint">
                  Espacio interno de cada fila
                </span>
              </div>

              <div className="dat-pdfConfigItem">
                <label>Espacio entre secciones</label>
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={sectionSpacing}
                  onChange={(e)=>setSectionSpacing(Number(e.target.value))}
                />
                <span className="dat-pdfConfigHint">
                  Separación entre bloques
                </span>
              </div>

            </div>

          </div>

          {schema.sections.map((section, sIndex) => (
            <div className="dat-sectionBuilder" key={sIndex}>
              <div className="dat-sectionHeader">
                <input
                  className="dat-sectionTitle"
                  value={section.title}
                  onChange={(e) =>
                    updateSection(sIndex, "title", e.target.value)
                  }
                />

                <input
                  type="color"
                  value={section.color}
                  onChange={(e) =>
                    updateSection(sIndex, "color", e.target.value)
                  }
                />

                <Trash2
                  size={18}
                  className="dat-deleteSection"
                  onClick={() => removeSection(sIndex)}
                />

                <ArrowUp size={16} onClick={() => moveSection(sIndex,-1)} />
                <ArrowDown size={16} onClick={() => moveSection(sIndex,1)} />
              </div>

              {section.fields.map((field, fIndex) => (
                <div className="dat-fieldBuilder" key={fIndex}>
                  <input
                    value={field.label}
                    onChange={(e) =>
                      updateField(sIndex, fIndex, "label", e.target.value)
                    }
                  />

                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(sIndex, fIndex, "type", e.target.value)
                    }
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Fecha</option>
                  </select>

                  <label>
                    Obligatorio
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(
                          sIndex,
                          fIndex,
                          "required",
                          e.target.checked
                        )
                      }
                    />
                  </label>

                  <Trash2
                    size={16}
                    onClick={() => removeField(sIndex, fIndex)}
                  />
                </div>
              ))}

              <button
                className="dat-addFieldBtn"
                onClick={() => addField(sIndex)}
              >
                <Plus size={16} /> Campo
              </button>
            </div>
          ))}

          <button className="dat-addSectionBtn" onClick={addSection}>
            <Plus /> Nueva sección
          </button>

          <button className="dat-saveBtnD" onClick={saveSchema}>
            <Save /> Guardar
          </button>
        </div>
      )}

      {activeTab === "form" && (
        <div className="dat-formPanel">
          {schema.sections.map((section, i) => (
            <div key={i} className="dat-sectionForm">
              <h2 style={{ color: section.color }}>{section.title}</h2>

              {section.fields.map((field, f) => (
                <div key={f} className="dat-fieldForm">
                  <label>
                    {field.label}
                    {field.required && "*"}
                  </label>

                  <input
                    type={field.type}
                    onChange={(e) =>
                      handleValue(i, f, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          ))}

          <button className="dat-pdfButton" onClick={generatePDF}>
            <FileText /> Generar PDF
          </button>
        </div>
      )}
    </div>
  );
}