// juego_capa_1.js
// Nivel 1 – Capa de Aplicación. Lógica del quiz interactivo.

// ---- Configuración global (leída del HTML) ----
const CFG = window.QUIZ_CONFIG || {};
const IMG_FIBRA = CFG.imgFibra || "";
const IMG_CAT6 = CFG.imgCat6 || "";
const IMG_CAT35 = CFG.imgCat35 || "";
const SAVE_RESULT_URL = CFG.saveResultUrl || "#";

// --------------------------------------------------------------------------------
// INICIALIZACIÓN DE PREGUNTAS: USAMOS DIRECTAMENTE LA VARIABLE DEL HTML
// Eliminamos el bloque 'questionPool' obsoleto para evitar conflictos.
// --------------------------------------------------------------------------------

// Inicializamos el array de preguntas. Usamos `window.QUIZ_QUESTIONS` si existe,
// y si no está definido intentamos usar `window.FULL_QUIZ_BANK` como fallback
// (esto ayuda si por algún motivo la asignación previa falló en el HTML).
let questions = [];
if (Array.isArray(window.QUIZ_QUESTIONS) && window.QUIZ_QUESTIONS.length > 0) {
  questions = window.QUIZ_QUESTIONS;
} else if (Array.isArray(window.FULL_QUIZ_BANK) && window.FULL_QUIZ_BANK.length > 0) {
  // Tomamos los primeros 10 (o menos) y normalizamos las propiedades necesarias
  questions = window.FULL_QUIZ_BANK.slice(0, 10).map((q, i) => ({ ...q, id: i + 1, checked: false, answer: null }));
} else {
  console.error('Error: No se encontraron preguntas para renderizar. Verifique FULL_QUIZ_BANK o QUIZ_QUESTIONS.');
}

// Si por alguna razón aún no hay preguntas (p. ej. la asignación inline falló),
// intentamos recuperar el bloque `window.FULL_QUIZ_BANK` buscando el script inline
// y evaluando su contenido como último recurso. Esto es solo un fallback de recuperación
// para mejorar la resiliencia en entornos donde la inclusión inline se rompió.
if ((!questions || questions.length === 0) && typeof document !== 'undefined') {
  try {
    const scripts = Array.from(document.getElementsByTagName('script'));
    for (const s of scripts) {
      const t = s.textContent || '';
      if (t.includes('window.FULL_QUIZ_BANK')) {
        const m = t.match(/window\.FULL_QUIZ_BANK\s*=\s*(\[[\s\S]*?\]);/);
        if (m && m[1]) {
          // Evaluar en contexto seguro (intento) — solo cuando no hay preguntas
          // eslint-disable-next-line no-eval
          const bank = eval(m[1]);
          if (Array.isArray(bank) && bank.length > 0) {
            questions = bank.slice(0, 10).map((q, i) => ({ ...q, id: i + 1, checked: false, answer: null }));
            console.info('Fallback: recuperado FULL_QUIZ_BANK desde script inline.');
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Fallback de FULL_QUIZ_BANK falló:', err);
  }
}

// --------- LÓGICA GENERAL DEL QUIZ ---------
let currentQuestionIndex = 0;
let finalScore = 0;

const questionsContainer = document.getElementById("questions-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const checkBtn = document.getElementById("check-btn");
const finishBtn = document.getElementById("finish-btn");
const scoreResults = document.getElementById("score-results");
const currentQNumber = document.getElementById("current-q-number");
const progressBar = document.getElementById("progress-bar");
const reviewList = document.getElementById("review-list");
// ---- botón Verificar ----
// ---- botón Verificar ----
checkBtn.addEventListener("click", () => {
    const q = questions[currentQuestionIndex];
    
    // -------------------------------------------------------------
    // 1. VALIDACIÓN ESTRICTA DE DRAG AND DROP (sin bypass de confirm)
    // -------------------------------------------------------------
    if (q.type === "drag_drop" || q.type === "drag_drop_image") {
        const totalItemsNeeded = (q.drag_items || []).length;
        const currentAnswers = q.answer ? Object.keys(q.answer).length : 0;
        
        if (currentAnswers < totalItemsNeeded) {
            // Detenemos la ejecución y mostramos la alerta estricta
            alert("¡Debes colocar todos los ítems en sus respectivas zonas antes de verificar!");
            return; 
        }
    } 
    
    // -------------------------------------------------------------
    // 2. VALIDACIÓN PARA OTROS TIPOS
    // -------------------------------------------------------------
    else if (q.type === "fill") {
        if (!q.answer || !q.answer.trim()) {
            alert("Completa el campo antes de verificar.");
            return;
        }
    } else if (q.type === "sequence") {
        if (!Array.isArray(q.answer) || !q.answer.length) {
            alert("Ordena al menos un elemento antes de verificar.");
            return;
        }
    } else if (!q.answer) {
        alert("Selecciona una opción para verificar.");
        return;
    }

    // -------------------------------------------------------------
    // 3. PROCESAMIENTO DE RESPUESTA (Solo si pasó las validaciones)
    // -------------------------------------------------------------
    if (!q.checked) {
        if (checkCurrentAnswer(q)) finalScore++;
        q.checked = true;
    }
    
    renderQuestion(currentQuestionIndex);
});
function normalizeVal(v) {
  if (v === null || v === undefined) return "";
  try {
    return String(v).trim().toLowerCase();
  } catch (e) {
    return String(v);
  }
}

// --- chequeo de respuesta según tipo ---
function checkCurrentAnswer(q) {
  if (q.type === "drag_drop" || q.type === "drag_drop_image") {
    const totalCorrectItems = Object.entries(q.correct_map).reduce(
      (count, [zoneFunc, protocol]) => {
        const given = q.answer && q.answer[zoneFunc];
        const isMatch = normalizeVal(given) === normalizeVal(protocol);
        // Aquí se asegura que la comparación use valores normalizados
        return count + (isMatch ? 1 : 0);
      },
      0
    );
    const isCorrect = totalCorrectItems === (q.drag_items || []).length;
    return isCorrect;
  } else if (q.type === "fill") {
    return normalizeVal(q.answer) === normalizeVal(q.correct_answer);
  } else if (q.type === "sequence") {
    if (!Array.isArray(q.answer)) return false;
    // Nota: Necesitas definir q.correct_sequence en tu banco si usas este tipo.
    // Asumimos que no usas este tipo por ahora, pero lo dejamos por si acaso.
    return false;
  } else {
    // mc / tf
    return normalizeVal(q.answer) === normalizeVal(q.correct_answer);
  }
}

function updateNavControls() {
  if (questions.length === 0) return;

  const q = questions[currentQuestionIndex];
  prevBtn.disabled = currentQuestionIndex === 0;

  if (currentQuestionIndex === questions.length - 1) {
    nextBtn.style.display = "none";
    finishBtn.style.display = q.checked ? "inline-block" : "none";
  } else {
    nextBtn.style.display = q.checked ? "inline-block" : "none";
    finishBtn.style.display = "none";
  }

  if (q.checked) {
    checkBtn.style.display = "none";
    nextBtn.disabled = false;
  } else {
    checkBtn.style.display = "inline-block";
    nextBtn.disabled = true;

    let isAnswered = false;
    if (q.type === "drag_drop" || q.type === "drag_drop_image") {
      // Para drag_drop_image, solo permitir verificar si TODOS están colocados
      isAnswered =
        q.answer && Object.keys(q.answer).length === q.drag_items.length;
    } else if (q.type === "fill") {
      isAnswered = !!(q.answer && q.answer.trim());
    } else if (q.type === "sequence") {
      isAnswered = Array.isArray(q.answer) && q.answer.length > 0;
    } else {
      isAnswered = !!q.answer;
    }
    checkBtn.disabled = !isAnswered;
  }
}
function renderQuestion(index) {
  if (questions.length === 0) {
    questionsContainer.innerHTML = `<p style="color:red; text-align:center;">Error: No se encontraron preguntas para renderizar. Verifique la variable QUIZ_QUESTIONS en el HTML.</p>`;
    return;
  }

  questionsContainer.innerHTML = "";
  const q = questions[index];
  let html = `<div class="question-module active" data-qid="${q.id}">`;

  let imageHtml = '';
  let questionText = q.text;

  // -------------------------------------------------------------------------
  // --> LÓGICA DE DETECCIÓN DE IMAGENES Y CONFIGURACIÓN DE URL
  // -------------------------------------------------------------------------

  const SMTP_TAG_REGEX = /\[IMG_SMTP_DIAGRAM\]/i;
  const DNS_TAG_REGEX = /\[IMG_DNS_DIAGRAM\]/i;
  const HTTP_TAG_REGEX = /\[IMG_HTTP_MESSAGE\]/i;

  let imageToRender = null;
  let imageMatch = null;

  // Priorizamos la detección de SMTP/Correp (asumo que es Q22)
  if (questionText.match(SMTP_TAG_REGEX)) {
    imageMatch = questionText.match(SMTP_TAG_REGEX);
    imageToRender = { url: CFG.imgCorreoDiagram, tag: SMTP_TAG_REGEX, alt: 'Diagrama de Flujo de Correo' };
  } else if (questionText.match(DNS_TAG_REGEX)) {
    imageMatch = questionText.match(DNS_TAG_REGEX);
    imageToRender = { url: CFG.imgDnsDiagram, tag: DNS_TAG_REGEX, alt: 'Diagrama de Resolución DNS' };
  } else if (questionText.match(HTTP_TAG_REGEX) || q.id === 28) {
    // Soporte para mostrar un mensaje HTTP en la pregunta 28
    imageMatch = questionText.match(HTTP_TAG_REGEX) || null;
    imageToRender = { url: CFG.imgHttpMensaje, tag: HTTP_TAG_REGEX, alt: 'Mensaje HTTP' };
  }

  const hasImageLogic = !!imageToRender;

  const isDnsSideBySide = !!imageToRender && imageToRender.tag === DNS_TAG_REGEX && q.type !== 'drag_drop_image';
  const isHttpImage = !!imageToRender && imageToRender.tag === HTTP_TAG_REGEX;

  if (hasImageLogic) {
    // Si la pregunta es DNS y queremos layout lado-a-lado, evitamos añadirla arriba.
    // Si la pregunta es HTTP (P28), la mostraremos después del título (se añade luego).
    if (q.type !== 'drag_drop_image' && !isDnsSideBySide && !isHttpImage) {
      imageHtml = `<div class="question-image-container" style="text-align: center; margin-bottom: 15px;">
                 <img src="${imageToRender.url}" alt="${imageToRender.alt}" 
                 style="max-width: 90%; height: auto; border: 1px solid #ccc; border-radius: 8px;">
               </div>`;
    }

    // 2. Eliminar la etiqueta de texto del cuerpo de la pregunta
    questionText = questionText.replace(imageMatch[0], '').trim();
  }
  // -------------------------------------------------------------------------
  // --> FIN LÓGICA DE IMAGENES
  // -------------------------------------------------------------------------


  // --- 1. Contenedor principal (siempre una columna) ---
  html += `<div class="question-body" style="width: 100%;">`;


  // --- 2. Añadir la imagen (si existe) ANTES del título/opciones
  html += imageHtml;


  // --- 3. Columna de Contenido (siempre 100% de ancho) ---
  html += `<div class="question-content-column" style="width: 100%; padding-right: 10px; box-sizing: border-box;">`;

  // Título de la pregunta (h4)
  html += `<h4 style="font-size: 1.3em; margin-top: 0;">${questionText}</h4>`;

  // Si es imagen HTTP,
  if (isHttpImage) {
    html += `<div class="question-image-container" style="text-align: center; margin-bottom: 15px;">
           <img src="${imageToRender.url}" alt="${imageToRender.alt}" 
           style="max-width: 90%; height: auto; border: 1px solid #ccc; border-radius: 8px;">
         </div>`;
  }

  if (imageToRender && imageToRender.tag === DNS_TAG_REGEX && q.type !== 'drag_drop_image') {
    const isDnsSideBySide = true;
    // Imagen a la izquierda, opciones a la derecha
    html += `<div style="display:flex; gap:20px; align-items:flex-start;">`;
    html += `<div style="flex:0 0 420px; max-width:420px;">`;
    html += `<img src="${imageToRender.url}" alt="${imageToRender.alt}" style="width:100%; height:auto; border:2px solid #0077B6; border-radius:10px; box-shadow: 0 4px 12px rgba(0,119,182,0.15);">`;
    html += `</div>`;
    html += `<div style="flex:1;">`;
    // Renderizamos las opciones (por ejemplo MC) al lado
    if (q.type === "drag_drop") {
      html += renderDragDrop(q);
    } else if (q.type === "fill") {
      html += renderFill(q);
    } else if (q.type === "sequence") {
      html += renderSequence(q);
    } else {
      html += renderOptions(q);
    }
    html += `</div>`; // cierra col de opciones
    html += `</div>`; // cierra fila lado-a-lado
  } else {
    // Comportamiento estándar
    if (q.type === "drag_drop_image") {
      html += renderDragDropOnImage(q); // D&D para SMTP/POP3 sobre imagen
    } else if (q.type === "drag_drop") {
      html += renderDragDrop(q); // D&D estándar (listas)
    } else if (q.type === "fill") {
      html += renderFill(q);
    } else if (q.type === "sequence") {
      html += renderSequence(q);
    } else {
      html += renderOptions(q);
    }
  }

  // Feedback y Pista
  html += `<div id="q-feedback-${q.id}" class="feedback-message" style="display:none; margin-top: 15px;"></div>`;
  if (q.hint_if_wrong) {
    html += `<div class="hint-container" style="display:flex; gap:16px; align-items:flex-start; margin-top:16px;">`;
    html += `<button type="button" class="btn-show-hint" onclick="showHint(${q.id})">💡 Mostrar pista</button>`;
    html += `<div id="hint-box-${q.id}" class="hint-box" style="display:none; flex:1;"></div>`;
    html += `</div>`;
  }
  html += `</div>`; // Cierra question-content-column

  html += `</div>`; // Cierra question-body

  html += `</div>`; // Cierra question-module

  questionsContainer.innerHTML = html;

  // --- Inicialización de Listeners y Estado ---
  if (q.type === "drag_drop_image" || q.type === "drag_drop") {
    setupDragDropListeners();
    restoreDragDropState(q);
  }

  applyQuestionState(q);

  if (currentQNumber) {
    currentQNumber.textContent = index + 1;
  }
  const progress = ((index + 1) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.textContent = `${Math.round(progress)}%`;

  updateNavControls();
}


// Función para mostrar/ocultar pista (toggle)
window.showHint = function (qid) {
  const hintBox = document.getElementById(`hint-box-${qid}`);
  if (!hintBox) return;

  if (hintBox.style.display === "block") {
    // Si está visible, ocultarla
    hintBox.style.display = "none";
  } else {
    // Si está oculta, mostrarla
    const q = questions.find(qq => qq.id === qid);
    if (!q || !q.hint_if_wrong) return;

    let hintText = String(q.hint_if_wrong || "").trim();
    hintText = hintText.replace(/^\s*Pista\s*[:\-–—]?\s*/i, "");

    hintBox.innerHTML = `
      <div class="hint-inner">
        <div class="hint-content">${hintText}</div>
      </div>`;
    hintBox.style.display = "block";
  }
}

// ---- renderizadores por tipo ----
function renderDragDrop(q) {
  let dragItemsHtml = "";
  q.drag_items.forEach(item => {
    dragItemsHtml += `<div class="draggable" draggable="true" data-protocol="${item.value}">${item.label}</div>`;
  });
  let ddHtml = `<div class="drag-container" id="drag-1">${dragItemsHtml}</div>`;
  ddHtml += `<div class="drop-container" id="drop-1">`;
  q.drop_zones.forEach(zone => {
    ddHtml += `<div class="dropzone" data-function="${zone.function}">${zone.label}</div>`;
  });
  ddHtml += `</div>`;
  return ddHtml;
}

// En juego_capa_1.js
function renderDragDropOnImage(q) {
  let ddHtml = '';

  // Contenedor principal para la imagen posicionada
  ddHtml += `<div class="drag-image-container" style="position: relative; max-width: 95%; margin: 20px auto;">`;

  // Imagen de fondo (la imagen sin etiquetas)
  // Usar imagen DNS para P29, SMTP para P22
  const imageUrl = q.id === 29 ? CFG.imgDnsDiagram : CFG.imgCorreoDiagram;
  ddHtml += `<img src="${imageUrl}" style="width: 100%; height: auto; display: block;" alt="Diagrama sin etiquetas">`;  // Drop Zones posicionadas absolutamente sobre la imagen
  q.drop_zones.forEach(zone => {
    // Las zonas estarán invisibles por defecto (sin borde ni etiqueta)
    // y se resaltarán cuando el usuario arrastre sobre ellas.
    ddHtml += `<div class="dropzone dropzone-image" data-function="${zone.function}"
            title="Soltar aquí"
            style="position: absolute; left: ${zone.x}; top: ${zone.y}; width: 12%; height: 10%; display: flex; align-items: center; justify-content: center;">
           </div>`;
  });

  ddHtml += `</div>`; // Cierra drag-image-container

  // Items arrastrables (los ponemos debajo para que el drag-drop estándar funcione)
  ddHtml += `<div class="drag-container" id="drag-1" style="margin-top: 20px; display: flex; justify-content: center; flex-wrap: wrap;">`;
  q.drag_items.forEach(item => {
    // Las etiquetas ya están definidas en el HTML, solo mostrarlas
    ddHtml += `<div class="draggable draggable-image" draggable="true" data-protocol="${item.value}"
                        style="margin: 5px; padding: 10px; border: 1px solid #0077B6; background-color: #E0F2F7; cursor: grab;">${item.label}</div>`;
  });
  ddHtml += `</div>`; return ddHtml;
}

function renderFill(q) {
  const val = q.answer || "";
  return `
    <div class="options-group" data-qtype="fill">
      <input type="text"
             id="fill-input-${q.id}"
             value="${val}"
             placeholder="${q.placeholder || ""}"
             class="fill-input">
      <div class="explanation" style="display:none; color:#0077B6; font-weight:500; font-size:0.9em; margin-top:10px;">
        ${q.explanation || ""}
      </div>
    </div>`;
}

function renderSequence(q) {
  let html = `<div class="options-group" data-qtype="sequence">`;
  html += `<p class="sequence-help">Arrastra los pasos hasta dejarlos en el orden correcto (de arriba hacia abajo).</p>`;
  html += `<div id="seq-list-${q.id}" class="seq-list">`;
  // NOTA: Si usas preguntas de secuencia, debes definir q.sequence_items en el banco.
  (q.sequence_items || []).forEach(item => {
    html += `<div class="sequence-item" draggable="true" data-key="${item.key}">${item.label}</div>`;
  });
  html += `</div>`;
  html += `<div class="explanation" style="display:none; color:#0077B6; font-weight:500; font-size:0.9em; margin-top:10px;">${q.explanation ||
    ""}</div>`;
  html += `</div>`;
  return html;
}

function renderOptions(q) {
  const options = q.options;
  let optHtml = `<div class="options-group" data-qtype="${q.type}" data-correct="${q.correct_answer}">`;
  options.forEach(opt => {
    const isSelected =
      normalizeVal(q.answer) === normalizeVal(opt) ? "selected" : "";
    optHtml += `<div class="option-btn ${isSelected}" data-value="${opt}"
                    onclick="selectOption(this, ${q.id})">${opt}</div>`;
  });
  optHtml += `<div class="explanation" style="display:none; color:#0077B6; font-weight:500; font-size:0.9em; margin-top:10px;">${q.explanation ||
    ""}</div>`;
  optHtml += `</div>`;
  return optHtml;
}

// ---- aplica estado visual al renderizar ----
function applyQuestionState(q) {
  const qElement = document.querySelector(`[data-qid="${q.id}"]`);
  const feedbackBox = document.getElementById(`q-feedback-${q.id}`);
  const isChecked = q.checked;

  if (!qElement) return;

  // --- Lógica para Drag and Drop (Estándar o sobre Imagen) ---
  if (q.type === "drag_drop" || q.type === "drag_drop_image") { // <-- Unificamos los tipos D&D
    if (isChecked) {
      // Selector de zona: usa .dropzone-image para D&D sobre Imagen, y .dropzone para D&D estándar
      const dropzoneSelector = q.type === "drag_drop_image" ? ".dropzone-image" : ".dropzone";

      // Deshabilitar arrastre y punteros
      qElement.querySelectorAll(".draggable").forEach(item => item.setAttribute("draggable", "false"));
      qElement.querySelectorAll(dropzoneSelector).forEach(zone => (zone.style.pointerEvents = "none"));

      const ddMap = q.correct_map;
      qElement.querySelectorAll(dropzoneSelector).forEach(zone => {
        const droppedItem = zone.querySelector(".draggable");
        const prevCorrect = zone.querySelector(".correct-answer");
        if (prevCorrect) prevCorrect.remove(); // Limpiar explicación anterior

        if (droppedItem) {
          const oldBadge = droppedItem.querySelector(".dd-badge");
          if (oldBadge) oldBadge.remove(); // Limpiar badge anterior

          // 1. Determinar si el elemento es correcto
          const isCorrect =
            droppedItem.dataset.protocol === ddMap[zone.dataset.function];
          droppedItem.classList.add(isCorrect ? "correct" : "incorrect"); // Colorear ítem

          // 2. Añadir el badge (✓ o ✖)
          const badge = document.createElement("span");
          badge.className =
            "dd-badge " + (isCorrect ? "dd-correct" : "dd-incorrect");
          badge.textContent = isCorrect ? "✓" : "✖";
          droppedItem.appendChild(badge);

          // 3. Mostrar la respuesta correcta debajo del dropzone si el usuario se equivocó
          if (!isCorrect) {
            const correctProtocol = ddMap[zone.dataset.function];
            const correctLabel = (q.drag_items || []).find(
              it => it.value === correctProtocol
            );
            const labelText = correctLabel ? correctLabel.label : correctProtocol;

            // Se crea un div para mostrar la respuesta correcta
            const correctEl = document.createElement("div");
            correctEl.className = "correct-answer";
            correctEl.textContent = "Correcto: " + labelText;

            // Para D&D sobre Imagen, la explicación se añade al elemento arrastrado, no a la zona.
            if (q.type === "drag_drop") {
              zone.appendChild(correctEl);
            } else {
              // Para el modo imagen, podemos añadir un tooltip o dejarlo solo con el badge. 
              // Por simplicidad visual en el diagrama, confiamos en el badge y el feedback general.
            }
          }
        }
      });
    }
  } else if (q.type === "fill") {
    // ... (resto del código sigue igual) ...
    const inp = qElement.querySelector(".fill-input");
    if (inp) {
      inp.value = q.answer || "";
      if (isChecked) {
        inp.disabled = true;
        if (checkCurrentAnswer(q)) {
          inp.style.borderColor = "#4CAF50";
        } else {
          inp.style.borderColor = "#dc3545";
        }
      }
    }
  } else if (q.type === "sequence") {
    const list = qElement.querySelector(".seq-list");
    if (isChecked && list) {
      list
        .querySelectorAll(".sequence-item")
        .forEach(item => item.setAttribute("draggable", "false"));
      list.style.borderColor = checkCurrentAnswer(q) ? "#4CAF50" : "#dc3545";
    }
  } else {
    // mc / tf
    const optionsGroup = qElement.querySelector(".options-group");
    if (!optionsGroup) return;
    optionsGroup.querySelectorAll(".option-btn").forEach(btn => {
      if (normalizeVal(q.answer) === normalizeVal(btn.dataset.value)) {
        btn.classList.add("selected");
      }
      if (isChecked) {
        btn.style.pointerEvents = "none";
        if (normalizeVal(btn.dataset.value) === normalizeVal(q.correct_answer)) {
          btn.classList.add("correct");
        } else if (
          normalizeVal(btn.dataset.value) === normalizeVal(q.answer)
        ) {
          btn.classList.add("incorrect");
        }
      }
    });
  }

  if (isChecked) {
    const isCorrect = checkCurrentAnswer(q);
    let explanation = q.explanation || "";
    if (q.type === "drag_drop") {
      explanation = isCorrect
        ? "¡Excelente! Todos los elementos están en su lugar."
        : "Los ítems en rojo están incorrectos. Revisa la correspondencia.";
    } else if (q.type === "drag_drop_image") {
      explanation = isCorrect
        ? "¡Excelente! Todos los protocolos están en su lugar correcto."
        : "Algunos protocolos no están en la posición correcta. Revisa cada uno.";
    }
    if (feedbackBox) {
      feedbackBox.style.display = "block";
      feedbackBox.className =
        "feedback-message " + (isCorrect ? "correct" : "incorrect");
      feedbackBox.innerHTML =
        (isCorrect ? "✅ ¡Respuesta correcta!" : "❌ Incorrecto.") +
        (explanation ? "<br><em>Explicación: " + explanation + "</em>" : "");
    }
  }
}

// ---- DRAG & DROP (mapas) ----
let draggedItem = null;

// En juego_capa_1.js, reemplaza la función setupDragDropListeners:

function setupDragDropListeners() {
  let currentQ = questions[currentQuestionIndex];
  let isImageMode = currentQ.type === 'drag_drop_image';

  document.querySelectorAll(".draggable").forEach(item => {
    item.addEventListener("dragstart", e => {
      draggedItem = e.target;
      e.dataTransfer.setData("text/plain", e.target.dataset.protocol);
      setTimeout(() => (e.target.style.opacity = 0.5), 0);
    });
    item.addEventListener("dragend", e => (e.target.style.opacity = 1));
  });

  // Modificamos para buscar la clase correcta de dropzone
  const dropzoneSelector = isImageMode ? ".dropzone-image" : ".dropzone";

  document.querySelectorAll(dropzoneSelector).forEach(zone => {
    zone.addEventListener("dragover", e => {
      e.preventDefault();
      zone.classList.add("hover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("hover"));

    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("hover");

      // 1. Manejo del Drag and Drop estándar (LISTA VERTICAL)
      if (!isImageMode) {
        const existingDraggable = zone.querySelector(".draggable");
        if (existingDraggable) {
          document.getElementById("drag-1").appendChild(existingDraggable);
        }
        if (draggedItem) {
          zone.appendChild(draggedItem);
        }
      }

      // 2. Manejo del Drag and Drop sobre Imagen (COORDINADAS ABSOLUTAS)
      if (isImageMode) {
        // Si ya hay un elemento, lo devuelve a la lista original
        if (zone.querySelector(".draggable")) {
          document.getElementById("drag-1").appendChild(zone.querySelector(".draggable"));
        }

        // Mueve el item arrastrado dentro del div de la zona de soltado
        if (draggedItem) {
          zone.appendChild(draggedItem);
        }
      }

      saveDragDropState();
      //checkBtn.disabled = false;
    });
  });

  // Permitir soltar de vuelta en el contenedor de arrastre (drag area)
  const dragContainers = document.querySelectorAll('.drag-container');
  dragContainers.forEach(dc => {
    dc.addEventListener('dragover', e => {
      e.preventDefault();
      dc.classList.add('hover');
    });
    dc.addEventListener('dragleave', () => dc.classList.remove('hover'));
    dc.addEventListener('drop', e => {
      e.preventDefault();
      dc.classList.remove('hover');
      if (draggedItem) {
        dc.appendChild(draggedItem);
        saveDragDropState();
      }
    });
  });
}

// En juego_capa_1.js, reemplaza la función saveDragDropState:

function saveDragDropState() {
    const ddAnswer = {};
    const currentQ = questions[currentQuestionIndex];
    
    // Determina qué selector de zona usar. Esto es clave para distinguir entre
    // las zonas de lista (.dropzone) y las zonas sobre la imagen (.dropzone-image).
    const dropzoneSelector = currentQ.type === 'drag_drop_image' ? ".dropzone-image" : ".dropzone"; 

    // Recorre todas las zonas de soltado visibles en la pantalla
    document.querySelectorAll(dropzoneSelector).forEach(zone => {
        const droppedItem = zone.querySelector(".draggable");
        if (droppedItem) {
            // CRÍTICO: Si la zona NO está vacía, guarda el mapeo: 
            // { function_key: item_value }
            ddAnswer[zone.dataset.function] = droppedItem.dataset.protocol;
        }
        // Si la zona está vacía, no se añade nada a ddAnswer, lo cual reduce el conteo.
    });
    
    // 1. Reemplaza completamente q.answer con el nuevo mapa. 
    // Esto es lo que actualiza la longitud de la respuesta.
    questions[currentQuestionIndex].answer = ddAnswer; 
    
    // 2. Llama a updateNavControls para recalcular el botón "Verificar".
    // Si Object.keys(ddAnswer).length es menor que el total, el botón se deshabilita.
    updateNavControls(); 
}

function restoreDragDropState(q) {
  const qElement = document.querySelector(`[data-qid="${q.id}"]`);
  if (!qElement) return;
  const dragContainer = qElement.querySelector(".drag-container");
  qElement.querySelectorAll(".dropzone .draggable").forEach(item => {
    dragContainer.appendChild(item);
  });
  for (const [zoneFunc, protocol] of Object.entries(q.answer || {})) {
    const zone = qElement.querySelector(
      `.dropzone[data-function="${zoneFunc}"]`
    );
    const item = qElement.querySelector(
      `.draggable[data-protocol="${protocol}"]`
    );
    if (zone && item) {
      zone.appendChild(item);
    }
  }
}

// ---- DRAG & DROP SEQUENCE ----
function setupSequenceListeners(q) {
  const list = document.getElementById(`seq-list-${q.id}`);
  if (!list) return;

  let dragged = null;
  list.querySelectorAll(".sequence-item").forEach(item => {
    item.addEventListener("dragstart", e => {
      dragged = item;
      e.dataTransfer.effectAllowed = "move";
    });

    item.addEventListener("dragover", e => {
      e.preventDefault();
      const bounding = item.getBoundingClientRect();
      const offset = bounding.y + bounding.height / 2;
      if (e.clientY - offset > 0) {
        item.style.borderBottom = "2px solid #0077B6";
        item.style.borderTop = "";
      } else {
        item.style.borderTop = "2px solid #0077B6";
        item.style.borderBottom = "";
      }
    });

    item.addEventListener("dragleave", () => {
      item.style.borderBottom = "";
      item.style.borderTop = "";
    });

    item.addEventListener("drop", e => {
      e.preventDefault();
      item.style.borderBottom = "";
      item.style.borderTop = "";
      const children = Array.from(list.children);
      const draggedIndex = children.indexOf(dragged);
      const targetIndex = children.indexOf(item);
      if (draggedIndex < 0 || targetIndex < 0) return;
      if (draggedIndex < targetIndex) {
        list.insertBefore(dragged, item.nextSibling);
      } else {
        list.insertBefore(dragged, item);
      }
      saveSequenceState(q);
    });
  });
}

function saveSequenceState(q) {
  const list = document.getElementById(`seq-list-${q.id}`);
  if (!list) return;
  const order = Array.from(list.querySelectorAll(".sequence-item")).map(
    it => it.dataset.key
  );
  q.answer = order;
  updateNavControls();
}

function restoreSequenceState(q) {
  if (!Array.isArray(q.answer) || !q.answer.length) return;
  const list = document.getElementById(`seq-list-${q.id}`);
  if (!list) return;
  const map = {};
  list.querySelectorAll(".sequence-item").forEach(it => {
    map[it.dataset.key] = it;
  });
  q.answer.forEach(key => {
    if (map[key]) list.appendChild(map[key]);
  });
}

// ---- selección para MC / TF ----
window.selectOption = function (btn, qid) {
  const q = questions.find(qq => qq.id === qid);
  if (!q || q.checked) return;
  const container = btn.closest(".options-group");
  container
    .querySelectorAll(".option-btn")
    .forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  q.answer = btn.dataset.value ? btn.dataset.value.trim() : btn.dataset.value;
  checkBtn.disabled = false;
};

// ---- botón Verificar ----
checkBtn.addEventListener("click", () => {
  const q = questions[currentQuestionIndex];

  if (q.type === "drag_drop" || q.type === "drag_drop_image") {
    if (
      !q.answer ||
      Object.keys(q.answer).length < (q.drag_items || []).length
    ) {
      if (
        !confirm(
          "No has colocado todos los ítems. ¿Deseas verificar con el estado actual?"
        )
      ) {
        return;
      }
    }
  } else if (q.type === "fill") {
    if (!q.answer || !q.answer.trim()) {
      alert("Completa el campo antes de verificar.");
      return;
    }
  } else if (q.type === "sequence") {
    if (!Array.isArray(q.answer) || !q.answer.length) {
      alert("Ordena al menos un elemento antes de verificar.");
      return;
    }
  } else if (!q.answer) {
    alert("Selecciona una opción para verificar.");
    return;
  }

  if (!q.checked) {
    if (checkCurrentAnswer(q)) finalScore++;
    q.checked = true;
  }
  renderQuestion(currentQuestionIndex);
});

// ---- navegación ----
nextBtn.addEventListener("click", () => {
  if (!questions[currentQuestionIndex].checked) {
    alert("Verifica tu respuesta antes de avanzar.");
    return;
  }
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion(currentQuestionIndex);
  }
});

prevBtn.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion(currentQuestionIndex);
  }
});

// ---- finalizar ----
finishBtn.addEventListener("click", e => {
  e.preventDefault();
  const lastQ = questions[questions.length - 1];
  if (!lastQ.checked) {
    if (checkCurrentAnswer(lastQ)) finalScore++;
    lastQ.checked = true;
  }

  reviewList.innerHTML = "";
  questions.forEach(q => {
    const isCorrect = checkCurrentAnswer(q);
    let userAnswerDisplay;
    if (q.type === "drag_drop") {
      userAnswerDisplay = `(Arrastradas: ${q.answer ? Object.keys(q.answer).length : 0
        }/${(q.drag_items || []).length})`;
    } else if (q.type === "sequence") {
      userAnswerDisplay =
        q.answer && q.answer.length ? q.answer.join(" → ") : "Sin ordenar";
    } else if (q.type === "fill") {
      userAnswerDisplay = q.answer || "No respondida";
    } else {
      userAnswerDisplay = q.answer || "No respondida";
    }

    let reviewHtml = `<div class="review-item ${isCorrect ? "correct-review" : "incorrect-review"
      }">`;
    reviewHtml += `<strong>P${q.id}. ${q.text.replace(/<[^>]+>/g, "")}</strong>`;
    reviewHtml += `<p class="user-answer">Tu respuesta: ${userAnswerDisplay}</p>`;

    if (!isCorrect) {
      if (q.explanation) {
        reviewHtml += `<p class="explanation-text">Explicación: ${q.explanation}</p>`;
      }
      if (q.hint_if_wrong) {
        reviewHtml += `<p class="hint-text"><strong>💡 Pista para estudiar:</strong> ${q.hint_if_wrong}</p>`;
      }
    }
    reviewHtml += `</div>`;
    reviewList.innerHTML += reviewHtml;
  });

  // rúbrica (sobre 10)
  const score = finalScore;
  let rubric = "";
  let icon = "🎯";
  let bgColor = "#28A745";
  let title = "";

  if (score >= 9) {
    rubric =
      "Fibra óptica (Excelente): Domina los conceptos de la Capa de Aplicación.";
    title = "¡Excelente trabajo!";
    icon = "🌟";
    bgColor = "#0f9d58";
  } else if (score >= 7) {
    rubric =
      "UTP Cat 6 (Bueno): Comprende la mayoría de los conceptos. Puede pulir algunos detalles.";
    title = "Muy buen desempeño";
    icon = "🎉";
    bgColor = "#029ad6";
  } else {
    rubric =
      "UTP Cat 3/5 (Necesita mejorar): Conviene repasar teoría y reintentar el nivel.";
    title = "Hay margen para mejorar";
    icon = "🔧";
    bgColor = "#ff6b6b";
  }

  const imgSrc = score >= 9 ? IMG_FIBRA : score >= 7 ? IMG_CAT6 : IMG_CAT35;
  let cardHtml = `
    <div class="rubric-card" role="region" aria-label="Resultado final">
      <div class="rubric-icon" style="background:${bgColor};">
        <img src="${imgSrc}" alt="icono"
             onerror="this.style.display='none'; this.parentNode.textContent='${icon}';">
      </div>
      <div class="rubric-body">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div>
            <div class="rubric-title">${title}
              <span class="rubric-score-badge">${score}/10</span>
            </div>
            <div class="rubric-text"><strong>Clasificación:</strong> ${rubric}</div>
          </div>
        </div>
        <div class="rubric-suggestion">
          Sugerencia: ${score >= 7
      ? "Podés pasar al siguiente nivel y revisar los ítems donde fallaste."
      : "Repasá el capítulo de Capa de Aplicación en Kurose y vuelve a intentar."
    }
        </div>
        <div class="rubric-cta">
          <button type="button" class="btn-retry" onclick="location.reload();">🔁 Reintentar</button>
          <a href="/perfil/estudiante/" class="btn-menu" role="button">🏠 Volver al Menú</a>
        </div>
      </div>
    </div>`;

  // umbral de desbloqueo (≥ 7/10)
  const shouldUnlock = score >= 7;
  if (shouldUnlock) {
    try {
      localStorage.setItem("unlocked_level_2", "true");
    } catch (e) { }
  }

  // envío al servidor
  (function sendResultsToServer() {
    try {
      const answersPayload = questions.map(q => ({
        id: q.id,
        type: q.type,
        answer: q.answer
      }));

      function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
      }
      const csrftoken = getCookie("csrftoken");

      fetch(SAVE_RESULT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken || ""
        },
        body: JSON.stringify({ score: score, level: 1, answers: answersPayload })
      }).catch(() => { });
    } catch (e) { }
  })();

  if (shouldUnlock) {
    cardHtml += `
      <div style="text-align:center; margin-top:14px;">
        <a href="/perfil/estudiante/" class="btn-go-profile">
          ➡️ Ir al Perfil — Nivel 2
        </a>
      </div>`;
  }

  document.getElementById("feedback-final").innerHTML = cardHtml;

  document.getElementById("questions-container").style.display = "none";
  document.querySelector(".nav-controls").style.display = "none";
  scoreResults.style.display = "block";
  document.getElementById("final-score").textContent = finalScore;
  document.getElementById("finish-btn").disabled = true;
});

// ---- inicialización ----
renderQuestion(currentQuestionIndex);