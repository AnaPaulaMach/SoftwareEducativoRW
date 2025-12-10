// juego_capa_5.js
// Nivel 5 – Capa Física. 

// ---- Config global que viene del template ----
const CFG = window.QUIZ_CONFIG || {};
const IMG_FIBRA = CFG.imgFibra || "";
const IMG_CAT6 = CFG.imgCat6 || "";
const IMG_CAT35 = CFG.imgCat35 || "";
const SAVE_RESULT_URL = CFG.saveResultUrl || "#";

// --------- Las preguntas vienen del HTML (window.QUIZ_QUESTIONS) ---------
if (!window.QUIZ_QUESTIONS || window.QUIZ_QUESTIONS.length === 0) {
  console.error("Error: No se encontraron preguntas en window.QUIZ_QUESTIONS");
}

// Función para seleccionar preguntas aleatorias (similar al nivel 2)
function getRandomQuestions(bank, amount) {
  // Mezclar usando algoritmo Fisher-Yates para mejor distribución aleatoria
  const shuffled = [...bank];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, amount);
}

// Cambiar aquí el número de preguntas a mostrar: 10 o 20
const NUM_QUESTIONS = 10; // Cambia a 10 si quieres mostrar solo 10 preguntas

// Seleccionar preguntas aleatorias del banco
const questions = getRandomQuestions(window.QUIZ_QUESTIONS || [], NUM_QUESTIONS);

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
const totalQuestionsSpan = document.getElementById("total-questions");
const progressBar = document.getElementById("progress-bar");
const reviewList = document.getElementById("review-list");

// Actualizar el número total de preguntas en el HTML
if (totalQuestionsSpan) {
  totalQuestionsSpan.textContent = questions.length;
}

function normalizeVal(v) {
  if (v === null || v === undefined) return "";
  try {
    return String(v).trim().toLowerCase();
  } catch (e) {
    return String(v);
  }
}

// Usa la pista específica si existe, si no genera una genérica
function generateHint(q) {
  if (q.pista && String(q.pista).trim() !== "") return String(q.pista).trim();
  // También acepta 'hint' para compatibilidad con preguntas antiguas
  if (q.hint && String(q.hint).trim() !== "") return String(q.hint).trim();

  switch (q.type) {
    case "drag_drop":
      return "Revisa qué concepto se relaciona con cada descripción. Piensa en el rol que cumple en la capa física.";
    case "fill":
      return "Piensa en el término clave del concepto de capa física.";
    case "sequence":
      return "Ordena los pasos de forma lógica, desde el origen hacia el destino o desde la entrada hacia la salida.";
    case "mc":
    case "tf":
      return "Descarta primero las opciones que claramente no pertenecen a la capa física o confunden con otras capas.";
    default:
      return "Repasa el capítulo de Capa Física en la teoría.";
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
    return totalCorrectItems === Object.keys(q.correct_map).length;
  } else if (q.type === "fill") {
    return normalizeVal(q.answer) === normalizeVal(q.correct_answer);
  } else if (q.type === "sequence") {
    if (!Array.isArray(q.answer)) return false;
    // Soporta tanto correct_sequence como correct_answer (array) para compatibilidad
    const correctSeq = q.correct_sequence || q.correct_answer || [];
    if (q.answer.length !== correctSeq.length) return false;
    for (let i = 0; i < correctSeq.length; i++) {
      if (q.answer[i] !== correctSeq[i]) return false;
    }
    return true;
  } else {
    // mc / tf - soporta formato antiguo (objeto con value) y nuevo (string directo)
    const userAnswer = q.answer;
    const correctAnswer = q.correct_answer;
    
    // Si la respuesta del usuario es un objeto, extraer el value
    let userVal = userAnswer;
    if (typeof userAnswer === 'object' && userAnswer !== null && userAnswer.value) {
      userVal = userAnswer.value;
    }
    
    // Si la respuesta correcta es un objeto, extraer el value
    let correctVal = correctAnswer;
    if (typeof correctAnswer === 'object' && correctAnswer !== null && correctAnswer.value) {
      correctVal = correctAnswer.value;
    }
    
    return normalizeVal(userVal) === normalizeVal(correctVal);
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
      isAnswered = q.answer && Object.keys(q.answer).length > 0;
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

// ---- render de la pregunta actual ----
function renderQuestion(index) {
  questionsContainer.innerHTML = "";
  const q = questions[index];

  let html = `<div class="question-module active" data-qid="${q.id}">`;
  
  // Badge para "Situación hipotética" (compatibilidad con formato antiguo)
  if (q.situacion_hipotetica) {
    html += `<div style="display: inline-block; background: #E3F2FD; color: #1976D2; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600; margin-bottom: 10px;">📋 Situación hipotética</div>`;
  }
  
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

  html += `<div id="q-feedback-${q.id}" class="feedback-message" style="display:none; margin-top: 15px;"></div>`;
  // Feedback y Pista (igual que nivel 1 y 4)
  const hasHint = (q.pista && String(q.pista).trim() !== "") || (q.hint && String(q.hint).trim() !== "");
  if (hasHint) {
    html += `<div class="hint-container" style="display:flex; gap:16px; align-items:flex-start; margin-top:16px;">`;
    html += `<button type="button" class="btn-show-hint" onclick="showHint(${q.id})">💡 Mostrar pista</button>`;
    html += `<div id="hint-box-${q.id}" class="hint-box" style="display:none; flex:1;"></div>`;
    html += `</div>`;
  }

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
    currentQNumber.textContent = index + 1;
  }
  const progress = ((index + 1) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.textContent = `${Math.round(progress)}%`;

  updateNavControls();
}

// ---- renderizadores por tipo ----
function renderDragDrop(q) {
  let dragItemsHtml = q.drag_items.map(item => 
    `<div class="draggable" draggable="true" data-protocol="${item.value}">${item.label}</div>`
  ).join("");

  let ddHtml = `<div class="drag-container" id="drag-1">${dragItemsHtml}</div>`;
  ddHtml += `<div class="drop-container">`;

  // Organizar dropzones en filas de 2 (igual que nivel 2 y 4)
  for (let i = 0; i < q.drop_zones.length; i += 2) {
    ddHtml += `<div class="drop-row">`;

    for (let j = 0; j < 2; j++) {
      const dz = q.drop_zones[i + j];
      if (!dz) continue;

      ddHtml += `<div class="dropzone drop-transporte drop-active" data-function="${dz.function}">${dz.label}</div>`;
    }

    ddHtml += `</div>`;
  }

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
  html += `<div id="seq-list-${q.id}" class="seq-list ${q.sequence_items && q.sequence_items[0] && q.sequence_items[0].css_class ? 'seq-list-pins' : ''}">`;
  (q.sequence_items || []).forEach(item => {
    const extraClass = item.css_class || "";
    html += `<div class="sequence-item ${extraClass}" draggable="true" data-key="${item.key}">${item.label}</div>`;
  });
  html += `</div>`;
  html += `<div class="explanation" style="display:none; color:#0077B6; font-weight:500; font-size:0.9em; margin-top:10px;">${
    q.explanation || ""
  }</div>`;
  html += `</div>`;
  return html;
}

function renderOptions(q) {
  const options = q.options || [];
  let optHtml = `<div class="options-group" data-qtype="${q.type}" data-correct="${q.correct_answer}">`;
  
  options.forEach(opt => {
    // Soporta formato antiguo (objeto con value y label) y nuevo (string directo)
    const optValue = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
    const optLabel = (typeof opt === 'object' && opt !== null) ? opt.label : opt;
    
    // Normalizar respuesta del usuario para comparar
    let userAnswer = q.answer;
    if (typeof userAnswer === 'object' && userAnswer !== null && userAnswer.value) {
      userAnswer = userAnswer.value;
    }
    
    const isSelected = normalizeVal(userAnswer) === normalizeVal(optValue) ? "selected" : "";
    optHtml += `<div class="option-btn ${isSelected}" data-value="${optValue}"
                    onclick="selectOption(this, ${q.id})">${optLabel}</div>`;
  });
  
  optHtml += `<div class="explanation" style="display:none; color:#0077B6; font-weight:500; font-size:0.9em; margin-top:10px;">${
    q.explanation || ""
  }</div>`;
  optHtml += `</div>`;
  return optHtml;
}

// ---- aplica estado visual al renderizar ----
function applyQuestionState(q) {
  const qElement = document.querySelector(`[data-qid="${q.id}"]`);
  const feedbackBox = document.getElementById(`q-feedback-${q.id}`);
  const isChecked = q.checked;
  const questionIsCorrect = isChecked ? checkCurrentAnswer(q) : null;

  if (!qElement) return;

  if (q.type === "drag_drop") {
    if (isChecked) {
      qElement
        .querySelectorAll(".draggable")
        .forEach(item => item.setAttribute("draggable", "false"));
      qElement
        .querySelectorAll(".dropzone.drop-active")
        .forEach(zone => (zone.style.pointerEvents = "none"));

      const ddMap = q.correct_map;
      qElement.querySelectorAll(".dropzone.drop-active").forEach(zone => {
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
        }
      });
    }
  } else if (q.type === "fill") {
    const inp = qElement.querySelector(".fill-input");
    if (inp) {
      inp.value = q.answer || "";
      if (isChecked) {
        inp.disabled = true;
        inp.style.borderColor = checkCurrentAnswer(q) ? "#4CAF50" : "#dc3545";
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
      // Normalizar respuesta del usuario
      let userAnswer = q.answer;
      if (typeof userAnswer === 'object' && userAnswer !== null && userAnswer.value) {
        userAnswer = userAnswer.value;
      }
      
      if (normalizeVal(userAnswer) === normalizeVal(btn.dataset.value)) {
        btn.classList.add("selected");
      }
      if (isChecked) {
        btn.style.pointerEvents = "none";
        
        // Normalizar respuesta correcta
        let correctAnswer = q.correct_answer;
        if (typeof correctAnswer === 'object' && correctAnswer !== null && correctAnswer.value) {
          correctAnswer = correctAnswer.value;
        }
        
        if (questionIsCorrect && normalizeVal(btn.dataset.value) === normalizeVal(correctAnswer)) {
          btn.classList.add("correct");
        } else if (
          normalizeVal(btn.dataset.value) === normalizeVal(userAnswer)
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

  document.querySelectorAll(".dropzone.drop-active").forEach(zone => {
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
      updateNavControls();
    });
  });
}

function saveDragDropState() {
  const ddAnswer = {};
  document.querySelectorAll(".dropzone.drop-active").forEach(zone => {
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
  qElement.querySelectorAll(".dropzone.drop-active .draggable").forEach(item => {
    dragContainer.appendChild(item);
  });
  for (const [zoneFunc, protocol] of Object.entries(q.answer || {})) {
    const zone = qElement.querySelector(
      `.dropzone.drop-active[data-function="${zoneFunc}"]`
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
  updateNavControls();
};

// ---- botón Verificar ----
checkBtn.addEventListener("click", () => {
  const q = questions[currentQuestionIndex];

  if (q.type === "drag_drop") {
    if (!q.answer || Object.keys(q.answer).length === 0) {
      alert("Arrastrá al menos un ítem antes de verificar.");
      return;
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
      }/${Object.keys(q.correct_map || {}).length})`;
    } else if (q.type === "sequence") {
      userAnswerDisplay =
        q.answer && q.answer.length
          ? q.answer
              .map(key => {
                const item = (q.sequence_items || []).find(
                  it => it.key === key
                );
                return item ? item.label : key;
              })
              .join(" → ")
          : "Sin ordenar";
    } else if (q.type === "fill") {
      userAnswerDisplay = q.answer || "No respondida";
    } else {
      // Soporta formato antiguo (objeto) y nuevo (string)
      const selectedOpt = (q.options || []).find(
        o => {
          const optValue = (typeof o === 'object' && o !== null) ? o.value : o;
          let userAnswer = q.answer;
          if (typeof userAnswer === 'object' && userAnswer !== null && userAnswer.value) {
            userAnswer = userAnswer.value;
          }
          return normalizeVal(optValue) === normalizeVal(userAnswer);
        }
      ) || null;
      userAnswerDisplay = selectedOpt 
        ? ((typeof selectedOpt === 'object' && selectedOpt !== null) ? selectedOpt.label : selectedOpt)
        : (q.answer || "No respondida");
    }

    let reviewHtml = `<div class="review-item ${
      isCorrect ? "correct-review" : "incorrect-review"
    }">`;
    reviewHtml += `<strong>P${q.id}. ${q.text.replace(
      /<[^>]+>/g,
      ""
    )}</strong>`;
    reviewHtml += `<p class="user-answer">Tu respuesta: ${userAnswerDisplay}</p>`;

    if (!isCorrect) {
      const hintText = generateHint(q);
      if (hintText) {
        reviewHtml += `<p class="hint-text">💡 Pista: ${hintText}</p>`;
      }
      if (q.explanation) {
        reviewHtml += `<p class="explanation-text">Explicación: ${q.explanation}</p>`;
      }
    }
    reviewHtml += `</div>`;
    reviewList.innerHTML += reviewHtml;
  });

  // rúbrica
  const score = finalScore;
  let rubric = "";
  let icon = "🎯";
  let bgColor = "#28A745";
  let title = "";

  if (score >= 9) {
    rubric = "Fibra óptica (Excelente): Domina los conceptos de la Capa Física.";
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
              <span class="rubric-score-badge">${score}/${questions.length}</span>
            </div>
            <div class="rubric-text"><strong>Clasificación:</strong> ${rubric}</div>
          </div>
        </div>
        <div class="rubric-suggestion">
          Sugerencia: ${
            score >= 7
              ? "Podés pasar al siguiente nivel y revisar los ítems donde fallaste."
              : "Repasá el capítulo de Capa Física y vuelve a intentar."
          }
        </div>
        <div class="rubric-cta">
          <button type="button" class="btn-retry" onclick="location.reload();">🔁 Reintentar</button>
          <a href="/perfil/estudiante/" class="btn-menu" role="button">🏠 Volver al Menú</a>
        </div>
      </div>
    </div>`;

  // umbral de desbloqueo: siempre 7 puntos (basado en 10 preguntas)
  // Esto aplica independientemente de si el nivel tiene 10 o 20 preguntas
  const shouldUnlock = score >= 7;
  if (shouldUnlock) {
    try {
      localStorage.setItem("unlocked_level_final", "true");
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
        body: JSON.stringify({ score: score, level: 5, answers: answersPayload })
      }).catch(() => {});
    } catch (e) {}
  })();

  if (shouldUnlock) {
    cardHtml += `
      <div style="text-align:center; margin-top:14px;">
        <a href="/perfil/estudiante/" class="btn-go-profile">
          ➡️ Ir al Perfil — Nivel Final
        </a>
      </div>`;
  }

  document.getElementById("feedback-final").innerHTML = cardHtml;

  document.getElementById("questions-container").style.display = "none";
  document.querySelector(".nav-controls").style.display = "none";
  scoreResults.style.display = "block";
  document.getElementById("final-score").textContent = finalScore;
  const finalTotalEl = document.getElementById("final-total");
  if (finalTotalEl) {
    finalTotalEl.textContent = questions.length;
  }
  document.getElementById("finish-btn").disabled = true;
});

// ---- inicialización ----
renderQuestion(currentQuestionIndex);

// Función para mostrar/ocultar pista (igual que nivel 1 y 4)
window.showHint = function (qid) {
  const hintBox = document.getElementById(`hint-box-${qid}`);
  if (!hintBox) return;

  if (hintBox.style.display === "block") {
    // Si está visible, ocultarla
    hintBox.style.display = "none";
  } else {
    // Si está oculta, mostrarla
    const q = questions.find(qq => qq.id === qid);
    if (!q || (!q.pista && !q.hint)) return;

    let hintText = String(q.pista || q.hint || "").trim();
    hintText = hintText.replace(/^\s*Pista\s*[:\-–—]?\s*/i, "");

    hintBox.innerHTML = `
      <div class="hint-inner">
        <div class="hint-content">${hintText}</div>
      </div>`;
    hintBox.style.display = "block";
  }
};
