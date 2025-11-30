// juego_capa_3.js
// Nivel 3 – Capa de Red. 10 preguntas fijas sobre principios de la capa de red.

// ---- Config global que viene del template ----
const CFG = window.QUIZ_CONFIG || {};
const IMG_FIBRA = CFG.imgFibra || "";
const IMG_CAT6 = CFG.imgCat6 || "";
const IMG_CAT35 = CFG.imgCat35 || "";
const SAVE_RESULT_URL = CFG.saveResultUrl || "#";

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
const currentQNumber = document.getElementById("current-q-number");
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

function generateHint(q) {
  if (q.hint) return q.hint;

  switch (q.type) {
    case "drag_drop":
      return "Revisa qué protocolo se relaciona con cada función. Considera el propósito principal de cada protocolo de la Capa de Red.";
    case "fill":
      return `Piensa en el término clave que completa la frase. La respuesta es una palabra corta.`;
    case "sequence":
      return "Analiza el flujo lógico de los eventos. ¿Cuál es el primer paso? ¿Cuál le sigue?";
    case "mc":
    case "tf":
      return "Revisa los conceptos fundamentales relacionados con la pregunta. Intenta descartar las opciones claramente incorrectas.";
    default:
      return "Revisa el material de estudio para esta pregunta.";
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
    currentQNumber.textContent = index + 1;
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
      reviewHtml += `<p class="hint-text">💡 Pista: ${generateHint(q)}</p>`;
      if (q.explanation) {
        reviewHtml += `<p class="explanation-text">Explicación: ${q.explanation}</p>`;
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
      "Fibra óptica (Excelente): Domina los conceptos de la Capa de Red.";
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
              : "Repasá el capítulo de Capa de Red y vuelve a intentar."
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
      localStorage.setItem("unlocked_level_4", "true");
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
        body: JSON.stringify({ score: score, level: 3, answers: answersPayload })
      }).catch(() => {});
    } catch (e) {}
  })();

  if (shouldUnlock) {
    cardHtml += `
      <div style="text-align:center; margin-top:14px;">
        <a href="/perfil/estudiante/" class="btn-go-profile">
          ➡️ Ir al Perfil — Nivel 4
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

