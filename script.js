
document.addEventListener('DOMContentLoaded', () => {
  const totalClassesInput      = document.getElementById('total-classes');
  const classesAttendedInput   = document.getElementById('classes-attended');
  const remainingClassesInput  = document.getElementById('remaining-classes');
  const classesPerWeekInput    = document.getElementById('classes-per-week');
  const startDateInput         = document.getElementById('start-date');
  const endDateInput           = document.getElementById('end-date');
  const calculateBtn           = document.getElementById('calculate-btn');

  const percentageDisplay      = document.getElementById('percentage-display');
  const statusBadge            = document.getElementById('status-badge');
  const progressFill           = document.getElementById('progress-fill');
  const canSkipCount           = document.getElementById('can-skip-count');
  const mandatoryCount         = document.getElementById('mandatory-count');
  const insightText            = document.getElementById('insight-text');
  const warningBox             = document.getElementById('warning-box');
  const warningText            = document.getElementById('warning-text');

  const projectedDisplay       = document.getElementById('projected-display');
  const projectedFill          = document.getElementById('projected-fill');
  const projectedCurrentLabel  = document.getElementById('projected-current-label');
  const projectedSubtitle      = document.getElementById('projected-subtitle');

  const toggleContainer = document.querySelector('.bg-surface-container-low.p-1.rounded-full.flex');
  const manualBtn       = toggleContainer.children[0];
  const autoBtn         = toggleContainer.children[1];

  const remainingField = remainingClassesInput.closest('.space-y-2');
  const dateFieldsGrid = startDateInput.closest('.grid');

  let mode = 'manual';

  dateFieldsGrid.style.display = 'none';

  const ACTIVE_CLASS   = 'flex-1 py-2 px-4 rounded-full text-sm font-semibold bg-surface-container-lowest text-primary shadow-sm transition-all';
  const INACTIVE_CLASS = 'flex-1 py-2 px-4 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-all';

  manualBtn.addEventListener('click', () => {
    mode = 'manual';
    manualBtn.className = ACTIVE_CLASS;
    autoBtn.className   = INACTIVE_CLASS;
    remainingField.style.display = '';
    remainingClassesInput.disabled = false;
    dateFieldsGrid.style.display = 'none';
  });

  autoBtn.addEventListener('click', () => {
    mode = 'automatic';
    autoBtn.className   = ACTIVE_CLASS;
    manualBtn.className = INACTIVE_CLASS;
    remainingField.style.display = 'none';
    dateFieldsGrid.style.display = '';
  });

  calculateBtn.addEventListener('click', calculate);
  document.querySelectorAll('input[type="number"], input[type="date"]').forEach(input => {
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') calculate(); });
  });

  function calculate() {
    const totalClasses    = parseInt(totalClassesInput.value);
    const classesAttended = parseInt(classesAttendedInput.value);

    if (isNaN(totalClasses) || isNaN(classesAttended) || totalClasses <= 0) {
      shakeButton();
      highlightInvalid(totalClassesInput, isNaN(totalClasses) || totalClasses <= 0);
      highlightInvalid(classesAttendedInput, isNaN(classesAttended));
      return;
    }
    if (classesAttended > totalClasses) {
      shakeButton();
      highlightInvalid(classesAttendedInput, true);
      return;
    }
    if (classesAttended < 0) {
      shakeButton();
      highlightInvalid(classesAttendedInput, true);
      return;
    }

    clearHighlights();

    let remainingClasses = 0;

    if (mode === 'manual') {
      remainingClasses = parseInt(remainingClassesInput.value) || 0;
    } else {
      const classesPerWeek = parseInt(classesPerWeekInput.value) || 0;
      const endDate        = new Date(endDateInput.value);
      const today          = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(endDate.getTime()) || classesPerWeek <= 0) {
        shakeButton();
        highlightInvalid(classesPerWeekInput, classesPerWeek <= 0);
        highlightInvalid(endDateInput, isNaN(endDate.getTime()));
        return;
      }

      const msPerWeek  = 7 * 24 * 60 * 60 * 1000;
      const weeksLeft  = Math.max(0, (endDate - today) / msPerWeek);
      remainingClasses = Math.round(weeksLeft * classesPerWeek);
    }

    const THRESHOLD         = 0.75;
    const currentPercentage = (classesAttended / totalClasses) * 100;
    const totalFuture       = totalClasses + remainingClasses;

    const maxPossiblePct = totalFuture > 0
      ? ((classesAttended + remainingClasses) / totalFuture) * 100
      : currentPercentage;

    const canSkip = Math.max(0, Math.floor(
      classesAttended + remainingClasses - THRESHOLD * totalFuture
    ));

    const needToReach = Math.ceil(THRESHOLD * totalFuture - classesAttended);
    const mustAttend  = Math.max(0, Math.min(remainingClasses, needToReach));

    const isRecoverable = maxPossiblePct >= 75;
    const displayPct    = Math.round(currentPercentage);

    const resultsArea = percentageDisplay.closest('.space-y-4');
    resultsArea.classList.remove('result-animate');
    void resultsArea.offsetWidth;
    resultsArea.classList.add('result-animate');

    percentageDisplay.innerHTML = `${displayPct}<span class="text-3xl font-bold opacity-40 ml-1">%</span>`;

    progressFill.style.width = `${Math.min(100, displayPct)}%`;

    if (currentPercentage >= 75) {
      statusBadge.className = 'flex items-center justify-center gap-2 text-emerald-600 font-semibold text-sm';
      statusBadge.innerHTML = '<span class="material-symbols-outlined text-sm" style="font-variation-settings: \'FILL\' 1;">check_circle</span> Safe Standing';
      progressFill.className = 'h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out';
    } else if (currentPercentage >= 65) {
      statusBadge.className = 'flex items-center justify-center gap-2 text-amber-600 font-semibold text-sm';
      statusBadge.innerHTML = '<span class="material-symbols-outlined text-sm" style="font-variation-settings: \'FILL\' 1;">warning</span> Warning Zone';
      progressFill.className = 'h-full bg-amber-500 rounded-full transition-all duration-700 ease-out';
    } else {
      statusBadge.className = 'flex items-center justify-center gap-2 text-red-600 font-semibold text-sm';
      statusBadge.innerHTML = '<span class="material-symbols-outlined text-sm" style="font-variation-settings: \'FILL\' 1;">error</span> Critical';
      progressFill.className = 'h-full bg-red-500 rounded-full transition-all duration-700 ease-out';
    }

    canSkipCount.textContent  = String(canSkip).padStart(2, '0');
    mandatoryCount.textContent = String(mustAttend).padStart(2, '0');

    const projectedPct = Math.round(maxPossiblePct);
    projectedDisplay.innerHTML = `${projectedPct}<span class="text-3xl font-bold opacity-40 ml-1">%</span>`;
    projectedFill.style.width  = `${Math.min(100, projectedPct)}%`;
    projectedCurrentLabel.textContent = `Current: ${displayPct}%`;

    if (remainingClasses === 0) {
      projectedSubtitle.textContent = 'No remaining classes';
    } else if (projectedPct >= 75) {
      projectedSubtitle.textContent = `If you attend all ${remainingClasses} remaining classes`;
    } else {
      projectedSubtitle.textContent = `Even with perfect attendance (${remainingClasses} classes)`;
    }

    const delta      = Math.round(Math.abs(currentPercentage - 75));
    const aboveBelow = currentPercentage >= 75 ? `${delta}% above` : `${delta}% below`;

    if (!isRecoverable && remainingClasses > 0) {
      insightText.textContent = `Your attendance is ${aboveBelow} the 75% threshold. Even attending all ${remainingClasses} remaining classes, the maximum achievable is ${Math.round(maxPossiblePct)}%. Recovery is not possible this semester.`;
      warningBox.style.display = 'flex';
      warningText.textContent = `Critical: It is no longer possible to reach 75% attendance even with 100% future attendance. Maximum achievable: ${Math.round(maxPossiblePct)}%.`;
    } else if (currentPercentage >= 75) {
      warningBox.style.display = 'none';
      if (remainingClasses > 0 && canSkip > 0) {
        insightText.textContent = `You are currently ${aboveBelow} your 75% threshold. You can safely skip up to ${canSkip} of your ${remainingClasses} remaining classes and still maintain safe standing.`;
      } else if (remainingClasses > 0) {
        insightText.textContent = `You are exactly at or near the 75% threshold. You cannot skip any more classes without dropping below safe standing.`;
      } else {
        insightText.textContent = `Your final attendance stands at ${displayPct}%. You are ${aboveBelow} the 75% threshold. Well done!`;
      }
    } else {
      if (remainingClasses > 0) {
        insightText.textContent = `You are currently ${aboveBelow} the 75% threshold. You must attend at least ${mustAttend} of your ${remainingClasses} remaining classes to reach safe standing.`;
        if (currentPercentage < 65) {
          warningBox.style.display = 'flex';
          warningText.textContent = `Your attendance is critically low at ${displayPct}%. You need to attend ${mustAttend} consecutive classes to recover.`;
        } else {
          warningBox.style.display = 'none';
        }
      } else {
        insightText.textContent = `Your final attendance is ${displayPct}%, which is ${aboveBelow} the 75% threshold. No remaining classes are available to improve your standing.`;
        warningBox.style.display = 'flex';
        warningText.textContent = `Your attendance has fallen below the required 75% with no remaining classes to recover.`;
      }
    }
  }

  function shakeButton() {
    calculateBtn.classList.add('animate-shake');
    setTimeout(() => calculateBtn.classList.remove('animate-shake'), 500);
  }

  function highlightInvalid(el, isInvalid) {
    if (isInvalid) {
      el.classList.add('ring-2', 'ring-red-400');
    }
  }

  function clearHighlights() {
    document.querySelectorAll('.ring-red-400').forEach(el => {
      el.classList.remove('ring-2', 'ring-red-400');
    });
  }
});
