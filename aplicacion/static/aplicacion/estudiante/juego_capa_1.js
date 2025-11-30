// juego_capa_1.js
// Nivel 1 – Capa de Aplicación. 10 preguntas fijas sobre principios de aplicaciones de red.

// ---- Config global que viene del template ----
const CFG = window.QUIZ_CONFIG || {};
const IMG_FIBRA = CFG.imgFibra || "";
const IMG_CAT6 = CFG.imgCat6 || "";
const IMG_CAT35 = CFG.imgCat35 || "";
const SAVE_RESULT_URL = CFG.saveResultUrl || "#";

// --------- Las preguntas ahora vienen del HTML (window.QUIZ_QUESTIONS) ---------
// Se eliminó questionPool - las preguntas están en juego_capa_1.html
const questionPool = [ // DEPRECATED - usar window.QUIZ_QUESTIONS
    // P1 – Dónde corre realmente una aplicación de red
    {
        id: 1,
        type: 'mc',
        text: "P1. Estás desarrollando una nueva aplicación de chat tipo WhatsApp. ¿Cuál de estas afirmaciones describe mejor, según la teoría de \"Principios de las aplicaciones de red\", dónde vive la lógica de la aplicación?",
        options: [
            "Debe instalarse parte del código de la aplicación dentro de los routers del núcleo de la red.",
            "Los procesos de la aplicación se ejecutan en sistemas terminales y se comunican a través de la red.",
            "La aplicación se implementa solo en la capa de enlace de datos.",
            "Es obligatorio programar los switches para que entiendan los mensajes de la aplicación."
        ],
        correct_answer: "Los procesos de la aplicación se ejecutan en sistemas terminales y se comunican a través de la red.",
        explanation: "La comunicación de una aplicación de red ocurre entre procesos que se ejecutan en sistemas terminales. No es necesario modificar routers ni switches: ellos solo reenvían paquetes.",
        hint_if_wrong: "Pista: pensá qué dice la teoría sobre si hace falta o no escribir software en el núcleo de la red (routers / switches) para una app de red.",
        answer: null,
        checked: false,
        score_value: 1
    },

    // P2 – Drag & Drop arquitecturas (cliente-servidor / P2P / híbrida)
    {
        id: 2,
        type: 'drag_drop',
        text: "P2. Arrastrá cada situación a la arquitectura de aplicación que mejor la describe.",
        drag_items: [
            { value: 'streaming_datacenter', label: 'Plataforma de streaming con granja de servidores en un centro de datos.' },
            { value: 'p2p_files', label: 'Aplicación para compartir archivos entre miles de nodos que entran y salen dinámicamente.' },
            { value: 'chat_hibrido', label: 'App de mensajería que usa un servidor para login pero luego conecta pares directamente.' }
        ],
        drop_zones: [
            { function: 'cs', label: 'Arquitectura Cliente-Servidor clásica' },
            { function: 'p2p', label: 'Arquitectura P2P pura' },
            { function: 'hybrid', label: 'Arquitectura Híbrida (cliente-servidor + P2P)' }
        ],
        correct_map: {
            cs: 'streaming_datacenter',
            p2p: 'p2p_files',
            hybrid: 'chat_hibrido'
        },
        explanation: "Streaming típico usa un servidor (o cluster) bien ubicado → cliente-servidor. Compartición masiva entre pares → P2P. Sistemas que combinan servidor para coordinación y P2P para el intercambio de datos se consideran híbridos.",
        hint_if_wrong: "Pista: fijate si hay un \"punto fijo\" (servidor conocido siempre activo) o si los nodos se conectan entre sí de forma más simétrica.",
        answer: {},
        checked: false,
        score_value: 1
    },

    // P3 – Agente de usuario
    {
        id: 3,
        type: 'mc',
        text: "P3. En el contexto de la capa de aplicación, ¿qué es un agente de usuario?",
        options: [
            "Un router especial que filtra paquetes de capa de aplicación.",
            "El proceso de la capa de transporte que abre y cierra sockets.",
            "El software que se sitúa entre el usuario y la red, manejando la interfaz con el usuario y la comunicación con la red.",
            "Un protocolo que traduce nombres de host a direcciones IP."
        ],
        correct_answer: "El software que se sitúa entre el usuario y la red, manejando la interfaz con el usuario y la comunicación con la red.",
        explanation: "El agente de usuario es el software que ofrece la interfaz con el usuario \"arriba\" y con la red \"abajo\" (por ejemplo, un cliente de correo o un navegador).",
        hint_if_wrong: "Pista: pensá en ejemplos concretos: navegador, cliente de correo… ¿son protocolos o programas con los que el usuario interactúa?",
        answer: null,
        checked: false,
        score_value: 1
    },

    // P4 – Direccionamiento de procesos
    {
        id: 4,
        type: 'mc',
        text: "P4. Para identificar de forma única a un proceso de aplicación en Internet (por ejemplo, un servidor web específico), ¿qué par de valores se utiliza?",
        options: [
            "Dirección MAC y número de puerto.",
            "Dirección IP y número de puerto.",
            "Dirección IP y número de secuencia TCP.",
            "Dirección de correo electrónico y nombre de host."
        ],
        correct_answer: "Dirección IP y número de puerto.",
        explanation: "El direccionamiento de procesos en la capa de aplicación se hace típicamente con el par (dirección IP, número de puerto) asociado al socket.",
        hint_if_wrong: "Pista: pensá qué datos necesita la capa de transporte para entregar datos a un proceso y no solo a un host.",
        answer: null,
        checked: false,
        score_value: 1
    },

    // P5 – Elección de servicio de transporte (UDP vs TCP) desde la mirada de la app
    {
        id: 5,
        type: 'mc',
        text: "P5. Desde el punto de vista de la aplicación, ¿en qué caso tiene más sentido elegir UDP en lugar de TCP como servicio de transporte?",
        options: [
            "En la descarga de un archivo ISO de 4 GB que no puede tener errores.",
            "En una aplicación de voz en tiempo real que tolera algunas pérdidas pero necesita baja latencia.",
            "En un sistema bancario que registra transacciones críticas.",
            "En la transmisión de un acta digital firmada que debe llegar exactamente igual al destino."
        ],
        correct_answer: "En una aplicación de voz en tiempo real que tolera algunas pérdidas pero necesita baja latencia.",
        explanation: "Aplicaciones de tiempo real (como voz) suelen preferir UDP porque toleran pérdidas pero necesitan rapidez y baja sobrecarga; las otras situaciones requieren confiabilidad fuerte.",
        hint_if_wrong: "Pista: relacioná la elección TCP/UDP con si la aplicación tolera o no la pérdida de datos y qué tan estricta es la confiabilidad.",
        answer: null,
        checked: false,
        score_value: 1
    },

    // P6 – Diferencia aplicación de red vs protocolo de aplicación
    {
        id: 6,
        type: 'mc',
        text: "P6. ¿Cuál de estas opciones diferencia correctamente entre \"aplicación de red\" y \"protocolo de la capa de aplicación\"?",
        options: [
            "Son exactamente lo mismo: ambos términos se usan como sinónimos.",
            "La aplicación de red es todo el sistema (interfaces, lógica, datos); el protocolo de aplicación es solo la parte que define formato, orden y significado de los mensajes intercambiados.",
            "El protocolo de aplicación es más amplio que la aplicación de red, porque incluye también a los routers.",
            "La aplicación de red solo existe en el servidor, mientras que el protocolo solo existe en el cliente."
        ],
        correct_answer: "La aplicación de red es todo el sistema (interfaces, lógica, datos); el protocolo de aplicación es solo la parte que define formato, orden y significado de los mensajes intercambiados.",
        explanation: "El protocolo de la capa de aplicación es un componente dentro de una aplicación de red: define mensajes, sintaxis, semántica y reglas de envío/recepción. La aplicación incluye además interfaces, lógica, almacenamiento, etc.",
        hint_if_wrong: "Pista: pensá en la Web: HTML, navegador, servidor web, HTTP… ¿cuál parte es el protocolo y cuál es la aplicación completa?",
        answer: null,
        checked: false,
        score_value: 1
    },

    // P7 – Verdadero/Falso sobre dónde se ejecutan los protocolos de aplicación
    {
        id: 7,
        type: 'tf',
        text: "P7. V/F: Los protocolos de la capa de aplicación se ejecutan en los sistemas terminales y utilizan los servicios de transporte (TCP/UDP); no se implementan dentro de los routers.",
        options: ['Verdadero', 'Falso'],
        correct_answer: 'Verdadero',
        explanation: "Los protocolos de aplicación viven en los extremos (hosts) y se apoyan en los servicios de transporte (TCP/UDP). Los routers no ejecutan protocolos de aplicación.",
        hint_if_wrong: "Pista: repasá la diferencia entre el núcleo de la red (routers) y la lógica de las aplicaciones de usuario.",
        answer: null,
        checked: false,
        score_value: 1
    },

    // P8 – Drag & Drop aplicaciones ↔ protocolos de aplicación
    {
        id: 8,
        type: 'drag_drop',
        text: "P8. Arrastrá cada servicio de red a su protocolo de la capa de aplicación típico.",
        drag_items: [
            { value: 'web', label: 'Navegar por la Web (obtener páginas y recursos)' },
            { value: 'mail', label: 'Enviar correo electrónico entre servidores' },
            { value: 'file_transfer', label: 'Subir y bajar archivos entre cliente y servidor' },
            { value: 'name_resolution', label: 'Traducir www.unse.edu.ar a una dirección IP' }
        ],
        drop_zones: [
            { function: 'http', label: 'HTTP' },
            { function: 'smtp', label: 'SMTP' },
            { function: 'ftp', label: 'FTP' },
            { function: 'dns', label: 'DNS' }
        ],
        correct_map: {
            http: 'web',
            smtp: 'mail',
            ftp: 'file_transfer',
            dns: 'name_resolution'
        },
        explanation: "HTTP ↔ Web, SMTP ↔ envío de correo entre servidores, FTP ↔ transferencia de archivos, DNS ↔ traducción de nombres de host a direcciones IP.",
        hint_if_wrong: "Pista: asociá cada protocolo con la aplicación típica que viste en teoría (Web, correo, archivos, directorio de nombres).",
        answer: {},
        checked: false,
        score_value: 1
    },

    // P9 – Rol de DNS
    {
        id: 9,
        type: 'mc',
        text: "P9. ¿Cuál de las siguientes descripciones se ajusta mejor al rol de DNS en la capa de aplicación?",
        options: [
            "Es un protocolo de transporte que asegura entrega confiable de datos.",
            "Es un sistema de nombres centralizado que vive en un único servidor.",
            "Es una base de datos distribuida jerárquica + un protocolo de aplicación que permite consultar esa base para traducir nombres de host en direcciones IP.",
            "Es un protocolo que cifra el contenido de las páginas web."
        ],
        correct_answer: "Es una base de datos distribuida jerárquica + un protocolo de aplicación que permite consultar esa base para traducir nombres de host en direcciones IP.",
        explanation: "DNS funciona como servicio de directorio: una base de datos distribuida jerárquica y un protocolo de aplicación (sobre UDP, puerto 53) para traducir nombres a direcciones IP.",
        hint_if_wrong: "Pista: si en el enunciado aparece \"traducción nombre ↔ IP\" y \"base de datos distribuida\", estás muy cerca.",
        answer: null,
        checked: false,
        score_value: 1
    },

    // P10 – Sockets como interfaz
    {
        id: 10,
        type: 'mc',
        text: "P10. En el contexto de la programación de aplicaciones de red, ¿qué representa la interfaz de sockets?",
        options: [
            "Un tipo especial de router que abre conexiones.",
            "La interfaz entre el proceso de aplicación y el protocolo de transporte (TCP/UDP) en el host.",
            "Un protocolo de la capa de enlace que multiplexa tramas.",
            "Un archivo de configuración donde se guardan las direcciones IP de los servidores."
        ],
        correct_answer: "La interfaz entre el proceso de aplicación y el protocolo de transporte (TCP/UDP) en el host.",
        explanation: "El socket es el punto donde la aplicación se “conecta” al servicio de transporte del sistema operativo para enviar y recibir mensajes.",
        hint_if_wrong: "Pista: pensá en el socket como la \"puerta\" por donde la aplicación envía y recibe datos hacia la red.",
        answer: null,
        checked: false,
        score_value: 1
    }
];


// --------- Las preguntas vienen del HTML (window.QUIZ_QUESTIONS) ---------
if (!window.QUIZ_QUESTIONS || window.QUIZ_QUESTIONS.length === 0) {
  console.error('Error: No se encontraron preguntas en window.QUIZ_QUESTIONS');
}
const questions = window.QUIZ_QUESTIONS || [];

// --------- LÓGICA GENERAL DEL QUIZ ---------
let currentQuestionIndex = 0;
let finalScore = 0;

const questionsContainer = document.getElementById("questions-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const checkBtn = document.getElementById("check-btn");
const finishBtn = document.getElementById("finish-btn");
const scoreResults = document.getElementById("score-results");
const currentQNumber = document.getElementById("current-q-number"); // está oculto en el HTML
const progressBar = document.getElementById("progress-bar");
const reviewList = document.getElementById("review-list");

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
  if (q.type === "drag_drop") {
    const totalCorrectItems = Object.entries(q.correct_map).reduce(
      (count, [zoneFunc, protocol]) => {
        const given = q.answer && q.answer[zoneFunc];
        return count + (normalizeVal(given) === normalizeVal(protocol) ? 1 : 0);
      },
      0
    );
    return totalCorrectItems === (q.drag_items || []).length;
  } else if (q.type === "fill") {
    return normalizeVal(q.answer) === normalizeVal(q.correct_answer);
  } else if (q.type === "sequence") {
    if (!Array.isArray(q.answer)) return false;
    if (q.answer.length !== q.correct_sequence.length) return false;
    for (let i = 0; i < q.correct_sequence.length; i++) {
      if (q.answer[i] !== q.correct_sequence[i]) return false;
    }
    return true;
  } else {
    // mc / tf
    return normalizeVal(q.answer) === normalizeVal(q.correct_answer);
  }
}

function updateNavControls() {
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
    if (q.type === "drag_drop") {
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
  questionsContainer.innerHTML = "";
  const q = questions[index];
  let html = `<div class="question-module active" data-qid="${q.id}">`;
  html += `<h4 style="font-size: 1.3em;">${q.text}</h4>`;

  if (q.type === "drag_drop") {
    html += renderDragDrop(q);
  } else if (q.type === "fill") {
    html += renderFill(q);
  } else if (q.type === "sequence") {
    html += renderSequence(q);
  } else {
    html += renderOptions(q);
  }

  html += `<div id="q-feedback-${q.id}" class="feedback-message" style="display:none;"></div>`;
  html += `</div>`;
  questionsContainer.innerHTML = html;

  if (q.type === "drag_drop") {
    setupDragDropListeners();
    restoreDragDropState(q);
  } else if (q.type === "fill") {
    const inp = document.getElementById(`fill-input-${q.id}`);
    if (inp) {
      inp.value = q.answer || "";
      inp.addEventListener("input", () => {
        q.answer = inp.value;
        updateNavControls();
      });
    }
  } else if (q.type === "sequence") {
    setupSequenceListeners(q);
    restoreSequenceState(q);
  }

  applyQuestionState(q);

  if (currentQNumber) {
    currentQNumber.textContent = index + 1; // el span está oculto, el alumno no lo ve
  }
  const progress = ((index + 1) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.textContent = `${Math.round(progress)}%`;

  updateNavControls();
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

  if (q.type === "drag_drop") {
    if (isChecked) {
      qElement
        .querySelectorAll(".draggable")
        .forEach(item => item.setAttribute("draggable", "false"));
      qElement
        .querySelectorAll(".dropzone")
        .forEach(zone => (zone.style.pointerEvents = "none"));

      const ddMap = q.correct_map;
      qElement.querySelectorAll(".dropzone").forEach(zone => {
        const droppedItem = zone.querySelector(".draggable");
        const prevCorrect = zone.querySelector(".correct-answer");
        if (prevCorrect) prevCorrect.remove();
        if (droppedItem) {
          const oldBadge = droppedItem.querySelector(".dd-badge");
          if (oldBadge) oldBadge.remove();

          const isCorrect =
            droppedItem.dataset.protocol === ddMap[zone.dataset.function];
          droppedItem.classList.add(isCorrect ? "correct" : "incorrect");

          const badge = document.createElement("span");
          badge.className =
            "dd-badge " + (isCorrect ? "dd-correct" : "dd-incorrect");
          badge.textContent = isCorrect ? "✓" : "✖";
          droppedItem.appendChild(badge);

          if (!isCorrect) {
            const correctProtocol = ddMap[zone.dataset.function];
            const correctLabel = (q.drag_items || []).find(
              it => it.value === correctProtocol
            );
            const labelText = correctLabel ? correctLabel.label : correctProtocol;
            const correctEl = document.createElement("div");
            correctEl.className = "correct-answer";
            correctEl.textContent = "Correcto: " + labelText;
            zone.appendChild(correctEl);
          }
        }
      });
    }
  } else if (q.type === "fill") {
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
    }
    feedbackBox.style.display = "block";
    feedbackBox.className =
      "feedback-message " + (isCorrect ? "correct" : "incorrect");
    feedbackBox.innerHTML =
      (isCorrect ? "✅ ¡Respuesta correcta!" : "❌ Incorrecto.") +
      (explanation ? "<br><em>Explicación: " + explanation + "</em>" : "");
  }
}

// ---- DRAG & DROP (mapas) ----
let draggedItem = null;

function setupDragDropListeners() {
  document.querySelectorAll(".draggable").forEach(item => {
    item.addEventListener("dragstart", e => {
      draggedItem = e.target;
      e.dataTransfer.setData("text/plain", e.target.dataset.protocol);
      setTimeout(() => (e.target.style.opacity = 0.5), 0);
    });
    item.addEventListener("dragend", e => (e.target.style.opacity = 1));
  });

  document.querySelectorAll(".dropzone").forEach(zone => {
    zone.addEventListener("dragover", e => {
      e.preventDefault();
      zone.classList.add("hover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("hover"));
    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("hover");
      const existingDraggable = zone.querySelector(".draggable");
      if (existingDraggable) {
        document.getElementById("drag-1").appendChild(existingDraggable);
      }
      if (draggedItem) {
        zone.appendChild(draggedItem);
      }
      saveDragDropState();
      checkBtn.disabled = false;
    });
  });
}

function saveDragDropState() {
  const ddAnswer = {};
  document.querySelectorAll(".dropzone").forEach(zone => {
    const droppedItem = zone.querySelector(".draggable");
    if (droppedItem) {
      ddAnswer[zone.dataset.function] = droppedItem.dataset.protocol;
    }
  });
  questions[currentQuestionIndex].answer = ddAnswer;
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
window.selectOption = function(btn, qid) {
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

  if (q.type === "drag_drop") {
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
      userAnswerDisplay = `(Arrastradas: ${
        q.answer ? Object.keys(q.answer).length : 0
      }/${(q.drag_items || []).length})`;
    } else if (q.type === "sequence") {
      userAnswerDisplay =
        q.answer && q.answer.length ? q.answer.join(" → ") : "Sin ordenar";
    } else if (q.type === "fill") {
      userAnswerDisplay = q.answer || "No respondida";
    } else {
      userAnswerDisplay = q.answer || "No respondida";
    }

    let reviewHtml = `<div class="review-item ${
      isCorrect ? "correct-review" : "incorrect-review"
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
          Sugerencia: ${
            score >= 7
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
    } catch (e) {}
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
      }).catch(() => {});
    } catch (e) {}
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
