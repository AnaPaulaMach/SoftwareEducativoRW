// juego_capa_5.js
// Nivel 5 – Capa Física. Banco de preguntas (se muestran 10 al azar).

// ---- Config global que viene del template ----
const CFG = window.QUIZ_CONFIG || {};
const IMG_FIBRA = CFG.imgFibra || "";
const IMG_CAT6 = CFG.imgCat6 || "";
const IMG_CAT35 = CFG.imgCat35 || "";
const SAVE_RESULT_URL = CFG.saveResultUrl || "#";

// --------- Seleccionar 10 preguntas aleatorias del banco ---------
const BANK_QUESTIONS = window.QUIZ_QUESTIONS || [];

if (!BANK_QUESTIONS || BANK_QUESTIONS.length === 0) {
  console.error("Error: No se encontraron preguntas de banco para el Nivel 5.");
}

function pickRandomQuestions(bank, count) {
  const copy = [...bank];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

const questions = pickRandomQuestions(BANK_QUESTIONS, 20);
window.QUIZ_QUESTIONS = questions;

// --------- LÓGICA GENERAL DEL QUIZ (basada en juego_capa_2.js) ---------
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
    case "sequence":
      return "Fijate el orden lógico de los elementos: ¿qué va primero y qué va después?";
    case "mc":
    case "tf":
      return "Intentá descartar opciones que claramente no encajan con la definición.";
    default:
      return "Revisa la teoría de la Capa Física para ayudarte con esta pregunta.";
  }
}

// --- chequeo de respuesta según tipo ---
function checkCurrentAnswer(q) {
  if (q.type === "sequence") {
    if (!Array.isArray(q.answer) || !Array.isArray(q.correct_answer)) return false;
    return JSON.stringify(q.answer) === JSON.stringify(q.correct_answer);
  }

  // MC / TF / otros de respuesta simple
  return normalizeVal(q.answer) === normalizeVal(q.correct_answer);
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
    if (q.type === "sequence") {
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
  
  // Badge para "Situación hipotética"
  if (q.situacion_hipotetica) {
    html += `<div style="display: inline-block; background: #E3F2FD; color: #1976D2; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600; margin-bottom: 10px;">📋 Situación hipotética</div>`;
  }
  
  html += `<h4 style="font-size: 1.3em;">${q.text}</h4>`;

  if (q.type === "sequence") {
    html += renderSequence(q);
  } else {
    html += renderOptions(q);
  }

  html += `<div id="q-feedback-${q.id}" class="feedback-message" style="display:none;"></div>`;
  html += `</div>`;
  questionsContainer.innerHTML = html;

  if (q.type === "sequence") {
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

function renderSequence(q) {
  let html = `<div class="options-group" data-qtype="sequence">`;
  html += `<p class="sequence-help">
            Arrastrá los elementos hasta dejarlos en el orden correcto (de arriba hacia abajo).
          </p>`;
  html += `<div id="seq-list-${q.id}" class="seq-list seq-list-pins">`;

  (q.sequence_items || []).forEach(item => {
    const extraClass = item.css_class || "";
    html += `
      <div class="sequence-item ${extraClass}" draggable="true" data-key="${item.key}">
          <span class="pin-label">${item.label}</span>
      </div>`;
  });

  html += `</div>`;
  html += `</div>`;
  return html;
}


function renderOptions(q) {
  const options = q.options || [];

  let optHtml = `<div class="options-group" data-qtype="${q.type}">`;

  options.forEach(opt => {
    const selected = normalizeVal(q.answer) === normalizeVal(opt.value);
    optHtml += `
      <div class="option-btn ${selected ? "selected" : ""}"
           data-value="${opt.value}"
           onclick="selectOptionNivel5(this, ${q.id})">
           ${opt.label}
      </div>`;
  });

  optHtml += `</div>`;
  return optHtml;
}

// ---- aplica estado visual al renderizar ----
function applyQuestionState(q) {
  const qElement = document.querySelector(`[data-qid="${q.id}"]`);
  const feedbackBox = document.getElementById(`q-feedback-${q.id}`);
  const isChecked = q.checked;

  if (!qElement) return;

  if (q.type === "sequence") {
    const list = qElement.querySelector(".seq-list");
    if (isChecked && list) {
      list
        .querySelectorAll(".sequence-item")
        .forEach(item => item.setAttribute("draggable", "false"));
      list.style.borderColor = checkCurrentAnswer(q) ? "#4CAF50" : "#dc3545";
    }
  } else {
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
        } else if (normalizeVal(btn.dataset.value) === normalizeVal(q.answer)) {
          btn.classList.add("incorrect");
        }
      }
    });
  }

  // Feedback inmediato con pista SOLO cuando responde mal
  if (isChecked) {
    const isCorrect = checkCurrentAnswer(q);
    feedbackBox.style.display = "block";
    feedbackBox.className =
      "feedback-message " + (isCorrect ? "correct" : "incorrect");
    let baseMsg = isCorrect
      ? (q.correct_msg || "✅ ¡Respuesta correcta!")
      : (q.incorrect_msg || "❌ Respuesta incorrecta.");

    if (!isCorrect) {
      const hintText = generateHint(q);
      baseMsg += `<br><span class="hint-inline">💡 Pista: ${hintText}</span>`;
    }

    feedbackBox.innerHTML = baseMsg;
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
window.selectOptionNivel5 = function (btn, qid) {
  const q = questions.find(x => x.id === qid);
  if (!q || q.checked) return;

  const val = btn.dataset.value;
  q.answer = val;

  const group = btn.parentElement;
  group.querySelectorAll(".option-btn").forEach(el =>
    el.classList.remove("selected")
  );
  btn.classList.add("selected");

  checkBtn.disabled = !q.answer;
};

// ---- botón Verificar ----
checkBtn.addEventListener("click", () => {
  const q = questions[currentQuestionIndex];

  if (q.type === "sequence") {
    if (!Array.isArray(q.answer) || !q.answer.length) {
      alert("Ordená los elementos antes de verificar.");
      return;
    }
  } else if (!q.answer) {
    alert("Seleccioná una opción para verificar.");
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
    alert("Verificá tu respuesta antes de avanzar.");
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
    if (q.type === "sequence") {
      userAnswerDisplay =
        q.answer && q.answer.length
          ? q.answer
              .map(key => {
                const item = (q.sequence_items || []).find(it => it.key === key);
                return item ? item.label : key;
              })
              .join(" → ")
          : "Sin ordenar";
    } else {
      const selectedOpt =
        (q.options || []).find(
          o => normalizeVal(o.value) === normalizeVal(q.answer)
        ) || null;
      userAnswerDisplay = selectedOpt ? selectedOpt.label : (q.answer || "No respondida");
    }

    let reviewHtml = `<div class="review-item ${
      isCorrect ? "correct-review" : "incorrect-review"
    }">`;
    reviewHtml += `<strong>P${q.id}. ${q.text.replace(/<[^>]+>/g, "")}</strong>`;
    reviewHtml += `<p class="user-answer">Tu respuesta: ${userAnswerDisplay}</p>`;

    if (!isCorrect) {
      const hintText = generateHint(q);
      reviewHtml += `<p class="hint-text">💡 Pista: ${hintText}</p>`;
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
      "Fibra óptica (Excelente): Dominás los conceptos de la Capa Física.";
    title = "¡Excelente trabajo!";
    icon = "🌟";
    bgColor = "#0f9d58";
  } else if (score >= 7) {
    rubric =
      "Cable coaxial / UTP de alta categoría (Bueno): Tenés una muy buena base, solo faltan algunos detalles.";
    title = "Muy buen desempeño";
    icon = "🎉";
    bgColor = "#029ad6";
  } else {
    rubric =
      "UTP básico (Necesita mejorar): Conviene repasar la teoría de medios y dispositivos de Capa Física.";
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
              ? "Podés pasar al siguiente nivel y revisar las preguntas donde tuviste errores."
              : "Repasá el capítulo de Capa Física y volvé a intentar el nivel."
          }
        </div>
        <div class="rubric-cta">
          <button type="button" class="btn-retry" onclick="location.reload();">🔁 Reintentar</button>
          <a href="/perfil/estudiante/" class="btn-menu" role="button">🏠 Volver al Menú</a>
        </div>
      </div>
    </div>`;

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

  document.getElementById("feedback-final").innerHTML = cardHtml;

  document.getElementById("questions-container").style.display = "none";
  document.querySelector(".nav-controls").style.display = "none";
  scoreResults.style.display = "block";
  document.getElementById("final-score").textContent = finalScore;
  document.getElementById("finish-btn").disabled = true;
});

// ---- inicialización ----
renderQuestion(currentQuestionIndex);

