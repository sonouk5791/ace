/**
 * 기억정원 콩이 운동방 - 코어 인터랙션 및 어르신 안심 의자 체조 제어
 * - 5개 큰 카드 메뉴
 * - 8단계 의자 체조 시퀀스
 * - 오직 4개 조작 버튼 (이전 동작, 잠깐 쉬기, 다음 동작, 그만하기)
 * - 한국어 Web Speech 음성 안내
 * - 운동 참여 기록 저장 (날짜, 종류, 시간, 완료여부, 중단여부)
 */

const KongiExerciseRoom = {
  // 상태 변수
  currentProgramKey: null,
  currentProgramTitle: '',
  steps: [],
  currentStepIndex: 0,
  stepSecondsRemaining: 40,
  timerInterval: null,
  isPaused: false,
  totalElapsedSeconds: 0,
  voiceEnabled: true,
  startTime: null,
  displayMode: 'video', // 'video' 또는 'rig'

  // 관절 리그 및 립싱크/시퀀스 상태
  neckSequenceTimeouts: [],
  lipSyncInterval: null,
  blinkInterval: null,
  isTalking: false,
  neckCycleCount: 0,

  // 8대 의자 체조 기본 마스터 동작 데이터 (실제 관절 움직임 및 정품 영상 동기화)
  masterSteps: {
    prep: {
      name: "준비운동 (천천히 깊게 호흡하기)",
      actionTitle: "🌸 1단계: 천천히 깊게 호흡하기",
      speech: "안녕하세요. 콩이예요. 의자에 등을 편안히 기대고, 코로 숨을 깊게 들이쉬어 볼까요?",
      guide: "코로 숨을 천천히 들이마셨다가, 1초 멈추고, 입으로 천천히 후~ 내쉽니다.",
      duration: 35,
      motionType: "breath",
      videoRange: [0, 15]
    },
    neck: {
      name: "목 운동 (좌우 천천히 부드럽게 숙이기)",
      actionTitle: "🌸 2단계: 부드럽게 목 숙이기",
      speech: "이번에는 목을 부드럽게 움직여볼게요. 무리하지 말고 아프지 않은 만큼만 움직여주세요.",
      guide: "머리를 목 관절 중심으로 오른쪽으로 천천히 기울였다가, 가운데를 거쳐 왼쪽으로도 부드럽게 움직입니다.",
      duration: 40,
      motionType: "neck",
      videoRange: [15, 30]
    },
    shoulder: {
      name: "어깨 운동 (양 어깨 으쓱으쓱 올렸다 내리기)",
      actionTitle: "🌸 3단계: 어깨 으쓱으쓱 올렸다 내리기",
      speech: "어깨를 귀 쪽으로 으쓱 올렸다가 툭 하고 내려놓으세요. 아주 잘하고 계세요.",
      guide: "양 어깨를 부드럽게 위로 올렸다가 편안하게 아래로 내려놓습니다.",
      duration: 40,
      motionType: "shoulder",
      videoRange: [80, 105]
    },
    arm: {
      name: "팔 운동 (양팔 위로 올리기 및 좌우 뻗기)",
      actionTitle: "🌸 4단계: 양팔 위로 올리기 및 좌우 뻗기",
      speech: "천천히 팔을 위로 올려볼까요? 양팔을 위로 번쩍 올렸다가, 옆으로 넓게 벌려주세요.",
      guide: "어깨 관절을 중심으로 양팔을 천천히 위로 올렸다가, 가슴을 활짝 열며 좌우로 시원하게 벌립니다.",
      duration: 50,
      motionType: "arm",
      videoRange: [30, 80]
    },
    finger: {
      name: "손뼉 짝짝 마주치기 (손뼉 치기 & 손가락 펴기)",
      actionTitle: "🌸 5단계: 손뼉 짝짝 마주치고 손가락 펴기",
      speech: "신나게 손뼉을 짝짝 마주쳐볼까요? 짝짝! 두 손을 앞으로 쭉 밀어봅니다.",
      guide: "양손을 가슴 앞에서 모아 신나게 손뼉을 마주치고, 손가락을 활짝 펴서 앞으로 쭉 밉니다.",
      duration: 45,
      motionType: "finger",
      videoRange: [105, 130]
    },
    knee: {
      name: "무릎 운동 (의자에 앉아 한쪽 무릎 살짝 들기)",
      actionTitle: "🌸 6단계: 의자에서 무릎 살짝 들기",
      speech: "의자를 가볍게 잡고 무릎을 살짝 들어 올려보세요. 오른발 살짝, 왼발 살짝! 천천히 따라오세요.",
      guide: "의자를 양손으로 꼭 잡고 발바닥을 바닥에서 5센티미터만 살짝 들어 올립니다.",
      duration: 45,
      motionType: "knee",
      videoRange: [130, 155]
    },
    ankle: {
      name: "발목 운동 (발끝 들고 발목 까딱까딱)",
      actionTitle: "🌸 7단계: 발끝 들고 발목 까딱까딱",
      speech: "발뒤꿈치를 바닥에 대고 발끝을 까딱까딱 움직여볼까요? 다리와 발목이 시원해져요.",
      guide: "뒤꿈치를 바닥에 두고 발끝을 위로 살며시 당겼다 내리며 발목을 풀어줍니다.",
      duration: 40,
      motionType: "ankle",
      videoRange: [155, 170]
    },
    finish: {
      name: "마무리 호흡 (가슴 활짝 펴고 숨 고르기)",
      actionTitle: "🌸 8단계: 가슴 펴고 마무리 호흡하기",
      speech: "마지막으로 가슴을 활짝 펴고 크게 숨을 들이마시고, 후우 내쉽니다. 오늘도 정말 잘하셨어요!",
      guide: "양팔을 넓게 벌려 가슴을 펴고, 깊고 편안한 호흡으로 운동을 마무리합니다.",
      duration: 35,
      motionType: "finish",
      videoRange: [170, 180.2]
    }
  },

  // 5개 메뉴별 맞춤 동작 구성
  programs: {
    '5min': {
      title: "5분 가벼운 운동",
      stepKeys: ['prep', 'neck', 'shoulder', 'finish']
    },
    '10min': {
      title: "10분 아침 체조",
      stepKeys: ['prep', 'neck', 'shoulder', 'arm', 'finger', 'knee', 'ankle', 'finish']
    },
    '20min': {
      title: "20분 전신 운동",
      stepKeys: ['prep', 'neck', 'shoulder', 'arm', 'finger', 'knee', 'ankle', 'finish']
    },
    'finger': {
      title: "손가락 운동",
      stepKeys: ['prep', 'finger', 'arm', 'finger', 'finish']
    },
    'music': {
      title: "음악과 함께 운동",
      stepKeys: ['prep', 'shoulder', 'arm', 'finger', 'ankle', 'finish']
    }
  },

  // --------------------------------------------------------------------------
  // 관절 리그 및 표정 제어 (Joint Rig & Expression System)
  // --------------------------------------------------------------------------
  initRig() {
    this.startBlinkLoop();
  },

  // 자연스러운 눈 깜빡임 루프 (3.5초~5초마다 부드럽게 감겼다 뜸)
  startBlinkLoop() {
    if (this.blinkInterval) clearInterval(this.blinkInterval);
    const triggerBlink = () => {
      const svg = document.getElementById('kongiRigSvg');
      if (svg) {
        svg.classList.add('is-blinking');
        setTimeout(() => {
          svg.classList.remove('is-blinking');
        }, 160);
      }
      const nextDelay = 3200 + Math.random() * 2000;
      this.blinkInterval = setTimeout(triggerBlink, nextDelay);
    };
    this.blinkInterval = setTimeout(triggerBlink, 3000);
  },

  // 한국어 음성 발화 (TTS) 및 립싱크(입 모양) 실시간 동기화
  speak(text, onComplete) {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) {
      if (onComplete) onComplete();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.82; // 치매 및 어르신을 위한 느리고 편안한 발화 속도
      utterance.pitch = 1.06; // 따뜻하고 다정한 목소리 톤

      utterance.onstart = () => {
        this.startLipSync();
      };
      utterance.onend = () => {
        this.stopLipSync();
        if (onComplete) onComplete();
      };
      utterance.onerror = () => {
        this.stopLipSync();
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('음성 발화 예외:', e);
      this.stopLipSync();
      if (onComplete) onComplete();
    }
  },

  // 립싱크 시작 (말할 때 입 모양을 자연스럽게 오물오물 전환)
  startLipSync() {
    this.isTalking = true;
    const svg = document.getElementById('kongiRigSvg');
    if (!svg) return;
    if (this.lipSyncInterval) clearInterval(this.lipSyncInterval);

    let stateToggle = false;
    this.lipSyncInterval = setInterval(() => {
      if (!this.isTalking) {
        clearInterval(this.lipSyncInterval);
        return;
      }
      stateToggle = !stateToggle;
      svg.setAttribute('data-mouth', stateToggle ? 'talk-a' : 'talk-o');
    }, 140);
  },

  // 립싱크 종료 (항상 따뜻하고 편안한 미소 표정으로 복귀)
  stopLipSync() {
    this.isTalking = false;
    if (this.lipSyncInterval) clearInterval(this.lipSyncInterval);
    const svg = document.getElementById('kongiRigSvg');
    if (svg && svg.getAttribute('data-mouth') !== 'exhale') {
      svg.setAttribute('data-mouth', 'smile');
    }
  },

  // 모든 관절 애니메이션 타임아웃 정리 및 초기화
  clearAllRigMotions() {
    this.neckSequenceTimeouts.forEach(t => clearTimeout(t));
    this.neckSequenceTimeouts = [];

    const svg = document.getElementById('kongiRigSvg');
    const head = document.getElementById('kongiHeadGroup');
    const leftEar = document.getElementById('leftEarGroup');
    const rightEar = document.getElementById('rightEarGroup');
    const torso = document.getElementById('torsoGroup');
    const leftArm = document.getElementById('leftArmGroup');
    const rightArm = document.getElementById('rightArmGroup');
    const leftLeg = document.getElementById('leftLegGroup');
    const rightLeg = document.getElementById('rightLegGroup');

    if (svg) {
      svg.classList.remove('is-breathing-active');
      svg.setAttribute('data-mouth', 'smile');
    }
    if (head) head.style.transform = 'rotate(0deg)';
    if (leftEar) leftEar.style.transform = 'rotate(0deg)';
    if (rightEar) rightEar.style.transform = 'rotate(0deg)';
    if (torso) torso.style.transform = 'scale(1, 1)';
    if (leftArm) leftArm.style.transform = 'translateY(0) rotate(0deg)';
    if (rightArm) rightArm.style.transform = 'translateY(0) rotate(0deg)';
    if (leftLeg) leftLeg.style.transform = 'rotate(0deg)';
    if (rightLeg) rightLeg.style.transform = 'rotate(0deg)';
  },

  // --------------------------------------------------------------------------
  // [1단계: 천천히 깊게 호흡하기] 핵심 호흡 모션 시퀀서
  // - 캐릭터는 의자에 편안하게 착석 (의자/엉덩이 완전 고정)
  // 1. 코로 숨을 천천히 들이마실 때 (약 3초):
  //    - 가슴과 배가 아주 살짝 부풀어 오름 (과장 금지, scale 1.025~1.035)
  //    - 양쪽 어깨가 아주 조금 올라감 (translateY -7px)
  //    - 눈은 편안하게 뜨거나 자연스럽게 한 번 깜빡임
  // 2. 1초 정도 편안하게 유지
  // 3. 입으로 천천히 숨을 내쉴 때 (약 4초):
  //    - 입 모양이 자연스럽게 '후~' 모양(exhale)으로 변함
  //    - 가슴과 배가 천천히 원래 위치로 돌아옴 (scale 1, 1)
  //    - 어깨도 천천히 내려옴 (translateY 0)
  // 4. 이 동작을 2~3회 반복
  // 한국어 음성 3단계 안내 연동:
  // "안녕하세요. 콩이예요."
  // "의자에 등을 편안히 기대고, 코로 숨을 깊게 들이쉬어 볼까요?"
  // "좋아요. 이제 입으로 천천히 후~ 내쉬어 볼게요."
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // [1단계: 천천히 깊게 호흡하기] 화면 설명과 1:1 완벽 일치 정밀 호흡 시퀀서
  //
  // 화면 문구:
  // “안녕하세요. 콩이예요. 의자에 등을 편안히 기대고, 코로 숨을 깊게 들이쉬어 볼까요?”
  //
  // 실제 움직임:
  // 1. 콩이는 의자에 안정적으로 앉아 정면을 바라봅니다.
  // 2. 코로 숨을 들이마시는 3초 동안:
  //    - 가슴이 아주 천천히 살짝 앞으로 나옵니다.
  //    - 배가 아주 살짝 부풀어 오릅니다.
  //    - 양쪽 어깨가 아주 조금 올라갑니다.
  // 3. 1초간 움직임을 멈추고 편안하게 유지합니다.
  // 4. 입으로 4초 동안 천천히 “후~” 내쉽니다.
  // 5. 내쉬는 동안:
  //    - 가슴이 천천히 원래 위치로 돌아옵니다.
  //    - 배가 천천히 원래 크기로 돌아옵니다.
  //    - 어깨가 부드럽게 내려옵니다.
  //    - 입 모양이 ‘후~’ 모양으로 자연스럽게 변합니다.
  // 6. 위 동작을 2회 반복합니다.
  //
  // 가슴 + 배 + 어깨 + 입 네 부분이 함께 움직이며, 화면 설명 문구와 1:1로 일치합니다.
  // --------------------------------------------------------------------------
  startBreathingExerciseMotion() {
    this.clearAllRigMotions();
    const svg = document.getElementById('kongiRigSvg');
    const head = document.getElementById('kongiHeadGroup');
    const torso = document.getElementById('torsoGroup');
    const leftArm = document.getElementById('leftArmGroup');
    const rightArm = document.getElementById('rightArmGroup');
    const promptEl = document.getElementById('actionPromptText');
    const guideEl = document.getElementById('actionGuideText');

    if (!svg || !torso) return;

    svg.classList.add('is-breathing-active');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    // 0. 초기 상태: 의자에 안정적으로 앉아 정면 응시
    if (torso) {
      torso.style.transition = 'transform 0.5s ease-out';
      torso.style.transform = 'translateY(0) scale(1, 1)';
    }
    if (head) {
      head.style.transition = 'transform 0.5s ease-out';
      head.style.transform = 'translateY(0) rotate(0deg)';
    }
    if (leftArm) {
      leftArm.style.transition = 'transform 0.5s ease-out';
      leftArm.style.transform = 'translateY(0) rotate(0deg)';
    }
    if (rightArm) {
      rightArm.style.transition = 'transform 0.5s ease-out';
      rightArm.style.transform = 'translateY(0) rotate(0deg)';
    }
    svg.setAttribute('data-mouth', 'smile');

    // 1. 인사 안내 (0.0s): "안녕하세요. 콩이예요."
    if (promptEl) promptEl.textContent = '"안녕하세요. 콩이예요."';
    if (guideEl) guideEl.textContent = '의자에 등을 편안히 기대고 안정적으로 바르게 앉습니다.';
    this.speak("안녕하세요. 콩이예요.");

    // 2. 호흡 준비 안내 (2.2s): "의자에 등을 편안히 기대고, 코로 숨을 천천히 들이쉬어 볼까요?"
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"의자에 등을 편안히 기대고, 코로 숨을 천천히 들이쉬어 볼까요?"';
      if (guideEl) guideEl.textContent = '코로 숨을 천천히 깊게 들이마실 준비를 합니다.';
      this.speak("의자에 등을 편안히 기대고, 코로 숨을 천천히 들이쉬어 볼까요?");
    }, 2200);

    // 단일 호흡 사이클 실행 함수
    // 3초 들이마시기 -> 1초 멈추기 -> 4초 '후~' 내쉬기
    const executeBreathCycle = (baseTime, isFirstCycle) => {
      // (1) 코로 숨 들이마시기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = isFirstCycle ? '"코로 숨을 천천히 깊게 들이마셔 보세요."' : '"다시 한번 코로 숨을 깊게 들이마십니다."';
        if (guideEl) guideEl.textContent = '【숨 들이쉬기 (3초)】 가슴과 배가 살짝 부풀고, 양 어깨가 천천히 올라갑니다.';

        // 가슴, 배, 어깨, 머리 3초 전환
        if (torso) {
          torso.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          torso.style.transform = 'translateY(-5px) scale(1.028, 1.038)';
        }
        if (leftArm) {
          leftArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          leftArm.style.transform = 'translateY(-6px) rotate(1.2deg)';
        }
        if (rightArm) {
          rightArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          rightArm.style.transform = 'translateY(-6px) rotate(-1.2deg)';
        }
        if (head) {
          head.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          head.style.transform = 'translateY(-3px)';
        }
        svg.setAttribute('data-mouth', 'smile');

        // 눈 깜빡임 (들이마시는 중간 1.4초 지점)
        schedule(() => {
          if (this.isPaused) return;
          svg.classList.add('is-blinking');
          setTimeout(() => svg.classList.remove('is-blinking'), 160);
        }, 1400);
      }, baseTime);

      // (2) 1초간 멈추기 (1초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"숨을 가만히 1초간 멈추고 편안하게 유지해 보세요."';
        if (guideEl) guideEl.textContent = '【1초 멈추기 (1초)】 숨을 멈추고 가슴과 어깨를 편안하게 유지합니다.';
        // 1초 동안 가슴, 배, 어깨 그대로 유지
      }, baseTime + 3000);

      // (3) 입으로 4초 동안 천천히 "후~" 내쉬기
      schedule(() => {
        if (this.isPaused) return;
        if (isFirstCycle) {
          if (promptEl) promptEl.textContent = '"좋아요. 이제 입으로 천천히 후~ 내쉬어 볼게요."';
          this.speak("좋아요. 이제 입으로 천천히 후~ 내쉬어 볼게요.", () => {
            if (svg && !this.isPaused) svg.setAttribute('data-mouth', 'exhale');
          });
        } else {
          if (promptEl) promptEl.textContent = '"입으로 천천히 후~ 길게 내쉬어 줍니다."';
        }
        if (guideEl) guideEl.textContent = '【후~ 내쉬기 (4초)】 입 모양을 \'후~\' 모으며 가슴·배·어깨가 원래대로 내려옵니다.';

        // 입 모양을 '후~' 모양으로 전환
        svg.setAttribute('data-mouth', 'exhale');

        // 가슴, 배, 어깨, 머리 4초 동안 천천히 제자리 복귀
        if (torso) {
          torso.style.transition = 'transform 4.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          torso.style.transform = 'translateY(0) scale(1, 1)';
        }
        if (leftArm) {
          leftArm.style.transition = 'transform 4.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          leftArm.style.transform = 'translateY(0) rotate(0deg)';
        }
        if (rightArm) {
          rightArm.style.transition = 'transform 4.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          rightArm.style.transform = 'translateY(0) rotate(0deg)';
        }
        if (head) {
          head.style.transition = 'transform 4.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          head.style.transform = 'translateY(0)';
        }
      }, baseTime + 4000);

      // (4) 사이클 종료 및 미소 복귀
      schedule(() => {
        if (this.isPaused) return;
        svg.setAttribute('data-mouth', 'smile');
      }, baseTime + 8000);
    };

    // 1회차 호흡 사이클 (5.8s 시작 -> 13.8s 완료)
    executeBreathCycle(5800, true);

    // 1회차 완료 안내 (13.8s ~ 15.5s)
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"참 잘하셨어요. 한 번 더 천천히 해볼게요."';
      if (guideEl) guideEl.textContent = '잠시 편안하게 숨을 고르고 2번째 호흡을 준비합니다.';
    }, 13800);

    // 2회차 호흡 사이클 (15.5s 시작 -> 23.5s 완료)
    executeBreathCycle(15500, false);

    // 2회 완료 및 마무리 칭찬 (23.8s)
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"아주 잘하셨어요. 온몸이 한결 편안해지셨죠?"';
      if (guideEl) guideEl.textContent = '깊고 고른 호흡으로 마음과 몸이 편안해졌습니다.';
      this.speak("아주 잘하셨어요. 온몸이 한결 편안해지셨죠?");
    }, 23800);
  },

  // --------------------------------------------------------------------------
  // [2단계: 부드럽게 목 움직이기] 핵심 관절 시퀀서
  // --------------------------------------------------------------------------
  // [2단계: 부드럽게 목 움직이기] 핵심 관절 시퀀서
  // --------------------------------------------------------------------------
  startNeckExerciseMotion() {
    this.clearAllRigMotions();
    const head = document.getElementById('kongiHeadGroup');
    const leftEar = document.getElementById('leftEarGroup');
    const rightEar = document.getElementById('rightEarGroup');
    const promptEl = document.getElementById('actionPromptText');
    const guideEl = document.getElementById('actionGuideText');
    if (!head) return;

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    const runNeckCycle = (isSecondCycle = false) => {
      // 1. 시작 (0s): 정면을 바라본다
      head.style.transform = 'rotate(0deg)';
      if (leftEar) leftEar.style.transform = 'rotate(0deg)';
      if (rightEar) rightEar.style.transform = 'rotate(0deg)';

      if (!isSecondCycle) {
        if (promptEl) promptEl.textContent = '"이번에는 목을 부드럽게 움직여볼게요. 무리하지 마세요."';
        if (guideEl) guideEl.textContent = '【목 운동 준비】 머리와 목을 곧게 세우고 편안히 정면을 바라봅니다.';
        this.speak("이번에는 목을 부드럽게 움직여볼게요. 무리하지 말고 아프지 않은 만큼만 움직여주세요.");
      }

      // 2. 스텝 (약 2.8초 후): 고개를 오른쪽으로 천천히 기울인다
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"머리를 오른쪽으로 천천히 기울여보세요."';
        if (guideEl) guideEl.textContent = '【오른쪽으로 기울이기 (3초)】 머리만 오른쪽으로 10~15도 천천히 기울입니다. (몸통·어깨 고정)';
        this.speak("오른쪽으로 천천히 기울여보세요.");
        head.style.transform = 'rotate(13deg)';
        if (leftEar) leftEar.style.transform = 'rotate(-3deg)';
        if (rightEar) rightEar.style.transform = 'rotate(2deg)';
      }, 2800);

      // 3. 스텝 (약 6.2초 후): 약 2초간 편안하게 유지
      schedule(() => {
        if (this.isPaused) return;
        if (guideEl) guideEl.textContent = '【편안하게 2초 유지】 아프지 않은 만큼만 기울이고 편안하게 숨을 쉽니다.';
      }, 6200);

      // 4. 스텝 (약 8.6초 후): 천천히 중앙으로 돌아온다
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"좋아요. 다시 가운데로 천천히 돌아올게요."';
        if (guideEl) guideEl.textContent = '【가운데로 복귀】 고개를 천천히 제자리로 세웁니다.';
        this.speak("좋아요. 다시 가운데로 돌아올게요.");
        head.style.transform = 'rotate(0deg)';
        if (leftEar) leftEar.style.transform = 'rotate(0deg)';
        if (rightEar) rightEar.style.transform = 'rotate(0deg)';
      }, 8600);

      // 5. 스텝 (약 12.0초 후): 고개를 왼쪽으로 천천히 기울인다
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"이번에는 반대쪽 왼쪽으로 천천히 기울여볼까요?"';
        if (guideEl) guideEl.textContent = '【왼쪽으로 기울이기 (3초)】 머리만 왼쪽으로 10~15도 천천히 기울입니다. (몸통·어깨 고정)';
        this.speak("이번에는 반대쪽이에요. 왼쪽으로 천천히 기울여보세요.");
        head.style.transform = 'rotate(-13deg)';
        if (leftEar) leftEar.style.transform = 'rotate(-2deg)';
        if (rightEar) rightEar.style.transform = 'rotate(3deg)';
      }, 12000);

      // 6. 스텝 (약 15.6초 후): 약 2초간 편안하게 유지
      schedule(() => {
        if (this.isPaused) return;
        if (guideEl) guideEl.textContent = '【편안하게 2초 유지】 편안한 호흡과 함께 자세를 유지합니다.';
      }, 15600);

      // 7. 스텝 (약 18.0초 후): 다시 중앙으로 돌아온다
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"아주 잘하셨어요. 목이 한결 부드러워지셨죠?"';
        if (guideEl) guideEl.textContent = '【가운데로 복귀】 정면을 바라보며 목을 편안하게 풉니다.';
        this.speak("아주 잘하셨어요. 무리하지 말고 아프지 않은 만큼만 움직여주세요.");
        head.style.transform = 'rotate(0deg)';
        if (leftEar) leftEar.style.transform = 'rotate(0deg)';
        if (rightEar) rightEar.style.transform = 'rotate(0deg)';
      }, 18000);

      // 약 22초 후 2회차 사이클 부드럽게 연결
      if (!isSecondCycle) {
        schedule(() => {
          if (!this.isPaused) runNeckCycle(true);
        }, 22000);
      }
    };

    runNeckCycle(false);
  },

  // --------------------------------------------------------------------------
  // [3단계: 어깨 으쓱으쓱 올렸다 내리기] 핵심 관절 시퀀서
  // --------------------------------------------------------------------------
  startShoulderExerciseMotion() {
    this.clearAllRigMotions();
    const leftArm = document.getElementById('leftArmGroup');
    const rightArm = document.getElementById('rightArmGroup');
    const promptEl = document.getElementById('actionPromptText');
    const guideEl = document.getElementById('actionGuideText');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    if (promptEl) promptEl.textContent = '"어깨를 귀 쪽으로 으쓱 올렸다가 툭 하고 내려놓으세요."';
    if (guideEl) guideEl.textContent = '【어깨 운동 준비】 의자에 등을 편안히 기대고 양 어깨를 준비합니다.';
    this.speak("어깨를 귀 쪽으로 으쓱 올렸다가 툭 하고 내려놓으세요. 아주 잘하고 계세요.");

    const runShoulderCycle = (cycleCount) => {
      // 1. 어깨 으쓱 올리기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"숨을 들이쉬며 양 어깨를 귀 쪽으로 으쓱 올려보세요."';
        if (guideEl) guideEl.textContent = '【어깨 으쓱 올리기 (3초)】 숨을 들이쉬며 양 어깨를 귀 쪽으로 천천히 끌어올립니다.';
        if (leftArm && rightArm) {
          leftArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          rightArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          leftArm.style.transform = 'translateY(-14px) rotate(4deg)';
          rightArm.style.transform = 'translateY(-14px) rotate(-4deg)';
        }
      }, 3000 + (cycleCount * 7500));

      // 2. 1초 멈추기
      schedule(() => {
        if (this.isPaused) return;
        if (guideEl) guideEl.textContent = '【1초 멈추기 (1초)】 어깨를 올린 채 편안하게 1초간 멈춥니다.';
      }, 6000 + (cycleCount * 7500));

      // 3. 어깨 편안히 내리기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"이제 숨을 내쉬며 어깨를 툭 하고 편안하게 내려놓습니다."';
        if (guideEl) guideEl.textContent = '【어깨 편안히 내리기 (3초)】 어깨에 힘을 빼고 스르륵 제자리로 내립니다.';
        if (cycleCount === 0) {
          this.speak("좋아요. 이제 어깨를 편안하게 내려놓을게요.");
        }
        if (leftArm && rightArm) {
          leftArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          rightArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          leftArm.style.transform = 'translateY(0) rotate(0deg)';
          rightArm.style.transform = 'translateY(0) rotate(0deg)';
        }
      }, 7000 + (cycleCount * 7500));
    };

    runShoulderCycle(0);
    runShoulderCycle(1);
    runShoulderCycle(2);

    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"참 잘하셨어요! 굳어있던 어깨가 시원해지셨죠?"';
      if (guideEl) guideEl.textContent = '【어깨 풀기 완료】 양 어깨가 부드럽고 가벼워졌습니다.';
      this.speak("참 잘하셨어요. 굳어있던 어깨가 시원하게 풀렸어요.");
    }, 24500);
  },

  // --------------------------------------------------------------------------
  // [4단계: 양팔을 앞으로 뻗고 당기기] 핵심 관절 시퀀서 (사용자 명세 100% 일치)
  // --------------------------------------------------------------------------
  startArmExerciseMotion() {
    this.clearAllRigMotions();
    const leftArm = document.getElementById('leftArmGroup');
    const rightArm = document.getElementById('rightArmGroup');
    const promptEl = document.getElementById('actionPromptText');
    const guideEl = document.getElementById('actionGuideText');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    if (promptEl) promptEl.textContent = '"천천히 팔을 앞으로 올려볼까요? 가슴 앞으로 쭉 뻗었다가 살며시 당겨주세요."';
    if (guideEl) guideEl.textContent = '【팔 운동 준비】 의자에 바르게 앉아 양팔 운동을 준비합니다.';
    this.speak("천천히 팔을 앞으로 올려볼까요? 가슴 앞으로 쭉 뻗었다가 살며시 당겨주세요.");

    // 1. 양팔 앞으로 뻗기 (약 2.8초 후)
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"양팔을 가슴 앞으로 천천히 쭉 뻗어보세요."';
      if (guideEl) guideEl.textContent = '【양팔 앞으로 뻗기 (5초)】 어깨 관절을 중심으로 양팔을 가슴 앞으로 곧게 뻗습니다.';
      this.speak("양팔을 앞으로 쭉 뻗어보세요.");
      if (leftArm && rightArm) {
        leftArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
        rightArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
        leftArm.style.transform = 'translateY(-10px) rotate(-18deg) scale(1.05)';
        rightArm.style.transform = 'translateY(-10px) rotate(18deg) scale(1.05)';
      }
    }, 2800);

    // 2. 옆으로 벌리기 (약 7.8초 후)
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"좋아요. 이제 양팔을 옆으로 시원하게 벌려볼까요?"';
      if (guideEl) guideEl.textContent = '【양팔 옆으로 벌리기 (5초)】 가슴을 활짝 열며 양팔을 옆으로 넓게 벌립니다.';
      this.speak("좋아요. 이제 양팔을 옆으로 넓게 벌려볼까요?");
      if (leftArm && rightArm) {
        leftArm.style.transition = 'transform 3.2s cubic-bezier(0.25, 0.8, 0.25, 1)';
        rightArm.style.transition = 'transform 3.2s cubic-bezier(0.25, 0.8, 0.25, 1)';
        leftArm.style.transform = 'translateY(-6px) rotate(-38deg)';
        rightArm.style.transform = 'translateY(-6px) rotate(38deg)';
      }
    }, 7800);

    // 3. 천천히 위로 올리기 (약 13.0초 후)
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"팔을 위로 천천히 올려보세요. 가능한 만큼만 올리시면 돼요."';
      if (guideEl) guideEl.textContent = '【양팔 위로 천천히 올리기 (5초)】 무리하지 않고 편안한 높이까지 양팔을 올립니다.';
      this.speak("팔을 위로 천천히 올려보세요. 가능한 만큼만 올리시면 돼요.");
      if (leftArm && rightArm) {
        leftArm.style.transition = 'transform 3.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
        rightArm.style.transition = 'transform 3.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
        leftArm.style.transform = 'translateY(-24px) rotate(-55deg)';
        rightArm.style.transform = 'translateY(-24px) rotate(55deg)';
      }
    }, 13000);

    // 4. 박수 치기 (약 18.2초 후)
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"신나게 손뼉을 짝짝 마주쳐볼까요? 짝짝!"';
      if (guideEl) guideEl.textContent = '【손뼉 짝짝 마주치기 (4초)】 양손을 가슴 앞에서 모아 손뼉을 마주칩니다.';
      this.speak("신나게 손뼉을 짝짝 마주쳐볼까요? 짝짝!");
      if (leftArm && rightArm) {
        leftArm.style.transition = 'transform 1.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
        rightArm.style.transition = 'transform 1.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
        leftArm.style.transform = 'translateX(24px) rotate(22deg)';
        rightArm.style.transform = 'translateX(-24px) rotate(-22deg)';
      }
    }, 18200);

    // 5. 제자리 복귀 (약 22.5초 후)
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"참 잘하셨어요. 이제 팔을 편안히 무릎 위로 내려놓습니다."';
      if (guideEl) guideEl.textContent = '【편안하게 제자리로 (4초)】 팔의 긴장을 풀고 무릎 위에 부드럽게 올려놓습니다.';
      this.speak("참 잘하셨어요. 이제 팔을 편안히 무릎 위로 내려놓습니다.");
      if (leftArm && rightArm) {
        leftArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
        rightArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
        leftArm.style.transform = 'translateY(0) rotate(0deg) scale(1)';
        rightArm.style.transform = 'translateY(0) rotate(0deg) scale(1)';
      }
    }, 22500);
  },

  // --------------------------------------------------------------------------
  // [5단계: 손가락 주먹 쥐고 활짝 펴기] 핵심 관절 시퀀서
  // --------------------------------------------------------------------------
  startFingerExerciseMotion() {
    this.clearAllRigMotions();
    const leftArm = document.getElementById('leftArmGroup');
    const rightArm = document.getElementById('rightArmGroup');
    const promptEl = document.getElementById('actionPromptText');
    const guideEl = document.getElementById('actionGuideText');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    if (promptEl) promptEl.textContent = '"손가락을 주먹 쥐었다가 활짝 펴보세요. 손끝을 톡톡 마주치며 뇌를 깨워요."';
    if (guideEl) guideEl.textContent = '【손가락 운동 준비】 양손을 가슴 앞으로 살며시 올려 손가락을 준비합니다.';
    this.speak("손가락을 주먹 쥐었다가 활짝 펴보세요. 손끝을 톡톡 마주치며 뇌를 깨워요.");

    const runFingerCycle = (cycleCount) => {
      // 1. 주먹 쥐기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"양손 주먹을 살며시 쥐어보세요."';
        if (guideEl) guideEl.textContent = '【주먹 쥐기 (3초)】 손가락을 모아 살며시 주먹을 쥡니다.';
        if (cycleCount === 0) this.speak("주먹을 살며시 쥐어보세요.");
        if (leftArm && rightArm) {
          leftArm.style.transition = 'transform 1.8s ease';
          rightArm.style.transition = 'transform 1.8s ease';
          leftArm.style.transform = 'rotate(-8deg)';
          rightArm.style.transform = 'rotate(8deg)';
        }
      }, 3000 + (cycleCount * 7000));

      // 2. 활짝 펴기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"이제 손가락을 부채처럼 활짝 펴보세요."';
        if (guideEl) guideEl.textContent = '【손가락 활짝 펴기 (3초)】 손바닥과 열 손가락을 시원하게 활짝 폅니다.';
        if (cycleCount === 0) this.speak("손가락을 활짝 펴보세요.");
        if (leftArm && rightArm) {
          leftArm.style.transition = 'transform 1.8s ease';
          rightArm.style.transition = 'transform 1.8s ease';
          leftArm.style.transform = 'rotate(0deg)';
          rightArm.style.transform = 'rotate(0deg)';
        }
      }, 6000 + (cycleCount * 7000));
    };

    runFingerCycle(0);
    runFingerCycle(1);

    // 손끝 톡톡 마주치기
    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"손끝을 톡톡 마주치며 뇌를 깨워볼까요?"';
      if (guideEl) guideEl.textContent = '【손끝 톡톡 마주치기 (4초)】 열 손가락 끝을 마주치며 뇌 신경을 자극합니다.';
      this.speak("손끝을 톡톡 마주쳐볼까요? 머리가 맑아져요.");
    }, 18000);

    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"참 잘하셨어요! 손끝이 따뜻해지셨죠?"';
      if (guideEl) guideEl.textContent = '【손가락 운동 완료】 손가락과 손목의 혈액 순환이 원활해졌습니다.';
    }, 23500);
  },

  // --------------------------------------------------------------------------
  // [6단계: 의자에서 무릎 살짝 들기] 핵심 관절 시퀀서 (몸통·의자·엉덩이 100% 완전 고정)
  // --------------------------------------------------------------------------
  startKneeExerciseMotion() {
    this.clearAllRigMotions();
    const leftLeg = document.getElementById('leftLegGroup');
    const rightLeg = document.getElementById('rightLegGroup');
    const promptEl = document.getElementById('actionPromptText');
    const guideEl = document.getElementById('actionGuideText');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    if (promptEl) promptEl.textContent = '"의자를 양손으로 꼭 잡고 무릎을 살짝 들어 올려보세요. 힘들면 언제든 쉬어도 괜찮아요."';
    if (guideEl) guideEl.textContent = '【무릎 운동 준비】 엉덩이를 의자에 밀착하고 의자 양쪽을 안정적으로 잡습니다.';
    this.speak("의자를 양손으로 꼭 잡고 무릎을 살짝 들어 올려보세요. 힘들면 언제든 쉬어도 괜찮아요.");

    const runKneeCycle = (cycleCount) => {
      const base = 3500 + (cycleCount * 11000);

      // 1. 왼쪽 무릎 살짝 들기 (4초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"왼쪽 무릎을 살짝 들어 올려보세요."';
        if (guideEl) guideEl.textContent = '【왼쪽 무릎 살짝 들기 (4초)】 발바닥을 바닥에서 5cm만 살짝 들어 올립니다. (의자·엉덩이 고정)';
        if (cycleCount === 0) this.speak("왼쪽 무릎을 살짝 들어볼까요?");
        if (leftLeg) {
          leftLeg.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          leftLeg.style.transform = 'translateY(-16px) rotate(-3deg)';
        }
      }, base);

      // 2. 왼쪽 무릎 내리기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"왼쪽 발을 바닥에 가만히 내려놓습니다."';
        if (guideEl) guideEl.textContent = '【왼쪽 무릎 천천히 내리기 (3초)】 발을 바닥에 편안하게 내려놓습니다.';
        if (leftLeg) {
          leftLeg.style.transition = 'transform 2.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
          leftLeg.style.transform = 'translateY(0) rotate(0deg)';
        }
      }, base + 3500);

      // 3. 오른쪽 무릎 살짝 들기 (4초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"이번에는 오른쪽 무릎을 살짝 들어보세요."';
        if (guideEl) guideEl.textContent = '【오른쪽 무릎 살짝 들기 (4초)】 오른쪽 발을 바닥에서 살짝 들어 올립니다. (의자·엉덩이 고정)';
        if (cycleCount === 0) this.speak("이번에는 오른쪽 무릎을 살짝 들어보세요.");
        if (rightLeg) {
          rightLeg.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          rightLeg.style.transform = 'translateY(-16px) rotate(3deg)';
        }
      }, base + 6000);

      // 4. 오른쪽 무릎 내리기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"오른쪽 발을 바닥에 편안하게 내려놓습니다."';
        if (guideEl) guideEl.textContent = '【오른쪽 무릎 천천히 내리기 (3초)】 발을 바닥에 가만히 내려놓습니다.';
        if (rightLeg) {
          rightLeg.style.transition = 'transform 2.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
          rightLeg.style.transform = 'translateY(0) rotate(0deg)';
        }
      }, base + 9000);
    };

    runKneeCycle(0);
    runKneeCycle(1);

    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"참 잘하셨어요! 다리에 힘이 쑥쑥 생겨나요."';
      if (guideEl) guideEl.textContent = '【무릎 운동 완료】 허벅지와 다리 근육이 튼튼해졌습니다.';
      this.speak("참 잘하셨어요. 다리에 힘이 쑥쑥 생겨나요.");
    }, 26000);
  },

  // --------------------------------------------------------------------------
  // [7단계: 발끝 들고 발목 까딱까딱] 핵심 관절 시퀀서
  // --------------------------------------------------------------------------
  startAnkleExerciseMotion() {
    this.clearAllRigMotions();
    const leftLeg = document.getElementById('leftLegGroup');
    const rightLeg = document.getElementById('rightLegGroup');
    const promptEl = document.getElementById('actionPromptText');
    const guideEl = document.getElementById('actionGuideText');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    if (promptEl) promptEl.textContent = '"발뒤꿈치를 바닥에 대고 발끝을 까딱까딱 움직여볼까요? 다리가 시원해져요."';
    if (guideEl) guideEl.textContent = '【발목 운동 준비】 발뒤꿈치를 바닥에 편안히 고정합니다.';
    this.speak("발뒤꿈치를 바닥에 대고 발끝을 까딱까딱 움직여볼까요? 다리가 시원해져요.");

    const runAnkleCycle = (cycleCount) => {
      const base = 3000 + (cycleCount * 6500);

      // 1. 발끝 들기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"발끝을 위로 살며시 들어 올려보세요."';
        if (guideEl) guideEl.textContent = '【발끝 위로 들기 (3초)】 뒤꿈치를 바닥에 두고 발끝을 위로 살며시 당깁니다.';
        if (cycleCount === 0) this.speak("발끝을 위로 살며시 들어 올려보세요.");
        if (leftLeg && rightLeg) {
          leftLeg.style.transition = 'transform 2.0s ease';
          rightLeg.style.transition = 'transform 2.0s ease';
          leftLeg.style.transform = 'rotate(-2.5deg)';
          rightLeg.style.transform = 'rotate(2.5deg)';
        }
      }, base);

      // 2. 발끝 내리기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"이제 발바닥을 바닥에 편안하게 내려놓습니다."';
        if (guideEl) guideEl.textContent = '【발끝 까딱 내리기 (3초)】 발끝을 바닥으로 가만히 내립니다.';
        if (leftLeg && rightLeg) {
          leftLeg.style.transition = 'transform 2.0s ease';
          rightLeg.style.transition = 'transform 2.0s ease';
          leftLeg.style.transform = 'rotate(0deg)';
          rightLeg.style.transform = 'rotate(0deg)';
        }
      }, base + 3000);
    };

    runAnkleCycle(0);
    runAnkleCycle(1);
    runAnkleCycle(2);

    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"아주 잘하셨어요! 종아리와 발목이 시원해졌습니다."';
      if (guideEl) guideEl.textContent = '【발목 운동 완료】 다리 아래쪽 순환이 원활해졌습니다.';
    }, 23500);
  },

  // --------------------------------------------------------------------------
  // [8단계: 가슴 펴고 마무리 호흡하기] 핵심 관절 시퀀서
  // --------------------------------------------------------------------------
  startFinishExerciseMotion() {
    this.clearAllRigMotions();
    const torso = document.getElementById('torsoGroup');
    const leftArm = document.getElementById('leftArmGroup');
    const rightArm = document.getElementById('rightArmGroup');
    const head = document.getElementById('kongiHeadGroup');
    const svg = document.getElementById('kongiRigSvg');
    const promptEl = document.getElementById('actionPromptText');
    const guideEl = document.getElementById('actionGuideText');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    if (promptEl) promptEl.textContent = '"마지막으로 가슴을 활짝 펴고 깊게 숨을 쉬어보세요. 오늘도 정말 훌륭하게 해내셨어요!"';
    if (guideEl) guideEl.textContent = '【마무리 호흡 준비】 온몸의 긴장을 풀고 편안한 호흡을 준비합니다.';
    this.speak("마지막으로 가슴을 활짝 펴고 깊게 숨을 쉬어보세요. 오늘도 정말 훌륭하게 해내셨어요!");

    const executeFinishCycle = (baseTime, isFirst) => {
      // 1. 들이쉬기 (3초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = isFirst ? '"가슴을 활짝 펴고 코로 숨을 깊게 들이마십니다."' : '"다시 한번 깊고 시원하게 숨을 들이마십니다."';
        if (guideEl) guideEl.textContent = '【숨 들이쉬기 (3초)】 양팔을 살짝 벌려 가슴을 활짝 펴고 깊게 숨을 들이마십니다.';
        if (torso) {
          torso.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          torso.style.transform = 'translateY(-5px) scale(1.025, 1.035)';
        }
        if (leftArm && rightArm) {
          leftArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          rightArm.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          leftArm.style.transform = 'translateY(-6px) rotate(-10deg)';
          rightArm.style.transform = 'translateY(-6px) rotate(10deg)';
        }
        if (head) {
          head.style.transition = 'transform 3.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          head.style.transform = 'translateY(-3px)';
        }
        if (svg) svg.setAttribute('data-mouth', 'smile');
      }, baseTime);

      // 2. 1초 멈추기 (1초)
      schedule(() => {
        if (this.isPaused) return;
        if (guideEl) guideEl.textContent = '【1초 멈추기 (1초)】 가슴 가득 채운 숨을 편안하게 1초간 유지합니다.';
      }, baseTime + 3000);

      // 3. '후~' 내쉬기 (4초)
      schedule(() => {
        if (this.isPaused) return;
        if (promptEl) promptEl.textContent = '"입으로 천천히 후~ 길게 내쉬어 줍니다."';
        if (guideEl) guideEl.textContent = '【후~ 내쉬기 (4초)】 입 모양을 \'후~\' 모으며 온몸의 긴장을 완전히 풉니다.';
        if (isFirst) {
          this.speak("입으로 천천히 후~ 내쉬어 주세요.");
        }
        if (svg) svg.setAttribute('data-mouth', 'exhale');
        if (torso) {
          torso.style.transition = 'transform 4.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          torso.style.transform = 'translateY(0) scale(1, 1)';
        }
        if (leftArm && rightArm) {
          leftArm.style.transition = 'transform 4.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          rightArm.style.transition = 'transform 4.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          leftArm.style.transform = 'translateY(0) rotate(0deg)';
          rightArm.style.transform = 'translateY(0) rotate(0deg)';
        }
        if (head) {
          head.style.transition = 'transform 4.0s cubic-bezier(0.25, 0.8, 0.25, 1)';
          head.style.transform = 'translateY(0)';
        }
      }, baseTime + 4000);

      // 4. 미소 복귀
      schedule(() => {
        if (this.isPaused) return;
        if (svg) svg.setAttribute('data-mouth', 'smile');
      }, baseTime + 8000);
    };

    executeFinishCycle(3500, true);
    executeFinishCycle(12500, false);

    schedule(() => {
      if (this.isPaused) return;
      if (promptEl) promptEl.textContent = '"참 잘하셨어요! 오늘 운동을 아주 멋지게 완료하셨습니다."';
      if (guideEl) guideEl.textContent = '【운동 완료】 온몸이 가볍고 활기차게 깨어났습니다.';
      this.speak("정말 훌륭하게 해내셨어요. 온몸이 한결 가볍고 상쾌해지셨죠?");
    }, 21500);
  },

  // 다른 단계별 신체 관절 실제 움직임 적용 (모든 동작 정밀 시퀀서 라우팅)
  applyStepJointMotion(motionType) {
    switch (motionType) {
      case 'breath':
      case 'prep':
        this.startBreathingExerciseMotion();
        break;

      case 'neck':
        this.startNeckExerciseMotion();
        break;

      case 'shoulder':
        this.startShoulderExerciseMotion();
        break;

      case 'arm':
        this.startArmExerciseMotion();
        break;

      case 'finger':
        this.startFingerExerciseMotion();
        break;

      case 'knee':
        this.startKneeExerciseMotion();
        break;

      case 'ankle':
        this.startAnkleExerciseMotion();
        break;

      case 'finish':
        this.startFinishExerciseMotion();
        break;

      default:
        break;
    }
  },

  // --------------------------------------------------------------------------
  // 운동 프로그램 실행 및 타이머 제어
  // --------------------------------------------------------------------------
  startProgram(key) {
    const prog = this.programs[key];
    if (!prog) return;

    this.currentProgramKey = key;
    this.currentProgramTitle = prog.title;
    this.steps = prog.stepKeys.map(k => this.masterSteps[k]);
    this.currentStepIndex = 0;
    this.totalElapsedSeconds = 0;
    this.isPaused = false;
    this.startTime = new Date();

    // 화면 전환 (메뉴 숨김 -> 운동 진행 화면 표시)
    document.getElementById('viewMenuStage').style.display = 'none';
    const playStage = document.getElementById('viewPlayStage');
    playStage.classList.add('active');
    document.getElementById('viewFinishStage').classList.remove('active');

    // UI 정보 업데이트
    document.getElementById('currentProgramBadge').textContent = `🐶 콩이 — ${prog.title}`;
    
    // 리그 초기화 및 첫 동작 진입
    this.initRig();
    this.switchDisplayMode(this.displayMode || 'video');
    this.renderCurrentStep();
    this.startStepTimer();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // 화면 표시 모드 전환 (원본 비디오 vs 3D 관절 모션)
  switchDisplayMode(mode) {
    this.displayMode = mode;
    const video = document.getElementById('kongiMotionVideo');
    const rig = document.getElementById('kongiRigSvg');
    const btnVideo = document.getElementById('btnModeVideo');
    const btnRig = document.getElementById('btnModeRig');

    if (mode === 'video') {
      if (video) video.style.display = 'block';
      if (rig) rig.style.display = 'none';
      if (btnVideo) btnVideo.classList.add('active');
      if (btnRig) btnRig.classList.remove('active');
      if (video && !this.isPaused) {
        video.play().catch(() => {});
      }
    } else {
      if (video) {
        video.pause();
        video.style.display = 'none';
      }
      if (rig) rig.style.display = 'block';
      if (btnVideo) btnVideo.classList.remove('active');
      if (btnRig) btnRig.classList.add('active');
      
      const step = this.steps[this.currentStepIndex];
      if (step) {
        this.applyStepJointMotion(step.motionType);
      }
    }
  },

  // 현재 동작 렌더링
  renderCurrentStep() {
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    this.stepSecondsRemaining = step.duration;

    // 헤더 카운터 및 진행도
    const indicatorEl = document.getElementById('stepProgressIndicator');
    if (indicatorEl) {
      indicatorEl.textContent = `${this.currentStepIndex + 1} / ${this.steps.length} 동작`;
    }

    // 동작 명칭 및 말풍선
    document.getElementById('actionNameText').textContent = step.actionTitle;
    document.getElementById('actionPromptText').textContent = `"${step.speech}"`;
    document.getElementById('actionGuideText').textContent = step.guide;

    // 타이머 텍스트 업데이트
    this.updateTimerDisplay();

    // 정품 콩이 비디오 동기화 및 구간 반복
    const video = document.getElementById('kongiMotionVideo');
    if (video && step.videoRange) {
      video.currentTime = step.videoRange[0];
      if (!this.isPaused && this.displayMode === 'video') {
        video.play().catch(e => console.log('Autoplay policy caught, muted playback enabled', e));
      }
      video.ontimeupdate = () => {
        const curStep = this.steps[this.currentStepIndex];
        if (curStep && curStep.videoRange) {
          if (video.currentTime >= curStep.videoRange[1]) {
            video.currentTime = curStep.videoRange[0];
            if (!this.isPaused && this.displayMode === 'video') {
              video.play().catch(() => {});
            }
          }
        }
      };
    }

    // 실제 신체 관절 움직임 실행 (모든 동작이 1:1 정밀 시퀀서로 자막 및 순차 안내 음성을 제어)
    this.applyStepJointMotion(step.motionType);
  },

  // 단계 타이머 시작
  startStepTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.isPaused) return;

      this.stepSecondsRemaining--;
      this.totalElapsedSeconds++;
      this.updateTimerDisplay();

      // 단계 종료 시 다음 동작으로 자동 유도
      if (this.stepSecondsRemaining <= 0) {
        if (this.currentStepIndex < this.steps.length - 1) {
          this.nextStep();
        } else {
          // 전 동작 정상 완료
          this.finishExercise(true);
        }
      }
    }, 1000);
  },

  // 타이머 표시 포맷
  updateTimerDisplay() {
    const timerEl = document.getElementById('stepTimerDisplay');
    if (!timerEl) return;
    const mins = Math.floor(this.stepSecondsRemaining / 60);
    const secs = this.stepSecondsRemaining % 60;
    timerEl.textContent = `⏱️ ${mins > 0 ? mins + '분 ' : ''}${secs}초`;
  },

  // [이전 동작] 버튼 동작
  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.renderCurrentStep();
    } else {
      this.speak("첫 번째 동작입니다.");
    }
  },

  // [다음 동작] 버튼 동작
  nextStep() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.renderCurrentStep();
    } else {
      this.finishExercise(true);
    }
  },

  // [잠깐 쉬기 / 계속하기] 토글
  togglePause() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('btnPlayPause');
    const overlay = document.getElementById('pauseOverlay');
    const video = document.getElementById('kongiMotionVideo');

    if (this.isPaused) {
      // 잠깐 쉬기 상태
      if (video) video.pause();
      btn.innerHTML = '<span>▶</span><span>계속하기</span>';
      btn.style.background = 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)';
      if (overlay) overlay.classList.add('active');
      
      // 진행 중인 모든 시퀀스 타임아웃 중지
      this.neckSequenceTimeouts.forEach(t => clearTimeout(t));
      this.neckSequenceTimeouts = [];
      this.stopLipSync();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();

      this.speak("잠시 쉬어갑니다. 숨을 편안하게 고르세요. 몸이 불편하시면 언제든 그만하셔도 괜찮아요.");
    } else {
      // 다시 계속하기 상태
      if (video && this.displayMode === 'video') {
        video.play().catch(() => {});
      }
      btn.innerHTML = '<span>⏸</span><span>잠깐 쉬기</span>';
      btn.style.background = 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
      if (overlay) overlay.classList.remove('active');

      this.speak("다시 천천히 시작해 볼까요?", () => {
        const step = this.steps[this.currentStepIndex];
        if (step) {
          this.applyStepJointMotion(step.motionType);
        }
      });
    }
  },

  // [그만하기] 버튼 동작
  exitProgram() {
    const video = document.getElementById('kongiMotionVideo');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    this.clearAllRigMotions();
    this.stopLipSync();
    this.speak("운동을 종료합니다. 오늘 참여하신 내용을 안전하게 저장할게요.");
    this.finishExercise(false);
  },

  // 운동 종료 처리 및 기록 저장
  finishExercise(isFullyCompleted) {
    clearInterval(this.timerInterval);
    const video = document.getElementById('kongiMotionVideo');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    this.clearAllRigMotions();
    this.stopLipSync();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const elapsedMins = Math.floor(this.totalElapsedSeconds / 60);
    const elapsedSecs = this.totalElapsedSeconds % 60;
    const timeFormatted = `${elapsedMins > 0 ? elapsedMins + '분 ' : ''}${elapsedSecs}초`;

    const now = new Date();
    const dateFormatted = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${now.getHours()}시 ${now.getMinutes()}분`;

    // 저장 대상 데이터 객체
    const recordData = {
      participatedAt: dateFormatted,
      exerciseType: this.currentProgramTitle || "의자 건강 체조",
      participatedTime: timeFormatted,
      isCompleted: isFullyCompleted ? "완료" : "미완료",
      interruptedStatus: isFullyCompleted ? "정상 완료" : "중간 중단"
    };

    // 로컬 스토리지에 저장
    this.saveRecordToStorage(recordData);

    // 완료 화면 UI 렌더링
    document.getElementById('viewPlayStage').classList.remove('active');
    const finishStage = document.getElementById('viewFinishStage');
    finishStage.classList.add('active');


    // 리포트 테이블 채우기
    document.getElementById('reportDate').textContent = recordData.participatedAt;
    document.getElementById('reportType').textContent = recordData.exerciseType;
    document.getElementById('reportTime').textContent = recordData.participatedTime;
    document.getElementById('reportCompleted').textContent = recordData.isCompleted;
    document.getElementById('reportStatus').textContent = recordData.interruptedStatus;

    if (isFullyCompleted) {
      document.getElementById('finishStampIcon').textContent = '🌸';
      document.getElementById('finishMainTitle').textContent = '어르신, 오늘도 정말 훌륭하게 마치셨어요!';
      document.getElementById('finishMainDesc').textContent = '모든 의자 체조 동작을 완벽하게 따라 하셨습니다. 건강 꽃 도장을 드려요!';
      this.speak('어르신, 오늘도 정말 훌륭하게 마치셨어요! 모든 동작을 안전하게 완료하셨습니다.');
    } else {
      document.getElementById('finishStampIcon').textContent = '🌿';
      document.getElementById('finishMainTitle').textContent = '무리하지 않고 안전하게 쉬어가셨어요!';
      document.getElementById('finishMainDesc').textContent = '조금이라도 몸을 움직이신 것만으로도 건강에 큰 도움이 됩니다. 참 잘하셨어요!';
      this.speak('무리하지 않고 안전하게 쉬어가셨어요. 조금이라도 몸을 움직이신 것만으로도 아주 훌륭합니다.');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // 로컬 스토리지 저장
  saveRecordToStorage(record) {
    try {
      const records = JSON.parse(localStorage.getItem('kongi_exercise_records') || '[]');
      records.unshift(record);
      // 최근 30개까지 보관
      if (records.length > 30) records.pop();
      localStorage.setItem('kongi_exercise_records', JSON.stringify(records));
    } catch (e) {
      console.warn('기록 저장 실패:', e);
    }
  },

  // 다시 메뉴로 돌아가기
  returnToMenu() {
    clearInterval(this.timerInterval);
    const video = document.getElementById('kongiMotionVideo');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    document.getElementById('viewPlayStage').classList.remove('active');
    document.getElementById('viewFinishStage').classList.remove('active');
    document.getElementById('viewMenuStage').style.display = 'flex';
    this.speak("운동방 메인 메뉴입니다. 마음에 드는 운동을 골라보세요.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// DOM 로드 완료 후 바인딩
document.addEventListener('DOMContentLoaded', () => {
  // 5개 메뉴 카드 클릭 이벤트
  document.querySelectorAll('.kr-menu-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const progKey = card.getAttribute('data-program');
      if (progKey) {
        KongiExerciseRoom.startProgram(progKey);
      }
    });
  });

  // 화면 모드 토글 (체조 영상 vs 3D 관절 모션)
  const btnModeVid = document.getElementById('btnModeVideo');
  if (btnModeVid) {
    btnModeVid.addEventListener('click', () => KongiExerciseRoom.switchDisplayMode('video'));
  }
  const btnModeR = document.getElementById('btnModeRig');
  if (btnModeR) {
    btnModeR.addEventListener('click', () => KongiExerciseRoom.switchDisplayMode('rig'));
  }

  // 하단 4대 조작 버튼
  const btnPrev = document.getElementById('btnActionPrev');
  if (btnPrev) btnPrev.addEventListener('click', () => KongiExerciseRoom.prevStep());

  const btnPause = document.getElementById('btnPlayPause');
  if (btnPause) btnPause.addEventListener('click', () => KongiExerciseRoom.togglePause());

  const btnNext = document.getElementById('btnActionNext');
  if (btnNext) btnNext.addEventListener('click', () => KongiExerciseRoom.nextStep());

  const btnExit = document.getElementById('btnActionExit');
  if (btnExit) btnExit.addEventListener('click', () => KongiExerciseRoom.exitProgram());

  // 완료 화면 액션 버튼
  const btnRestart = document.getElementById('btnRestartMenu');
  if (btnRestart) btnRestart.addEventListener('click', () => KongiExerciseRoom.returnToMenu());

  // 상단 소리 토글 버튼
  const btnSound = document.getElementById('btnTopSound');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      KongiExerciseRoom.voiceEnabled = !KongiExerciseRoom.voiceEnabled;
      if (KongiExerciseRoom.voiceEnabled) {
        btnSound.classList.add('active');
        btnSound.innerHTML = '<span>🔊</span><span>소리 켜짐</span>';
        KongiExerciseRoom.speak("음성 안내가 켜졌습니다.");
      } else {
        btnSound.classList.remove('active');
        btnSound.innerHTML = '<span>🔈</span><span>소리 꺼짐</span>';
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }
    });
  }

  // 상단 글자 확대 버튼
  const btnFont = document.getElementById('btnTopFont');
  if (btnFont) {
    btnFont.addEventListener('click', () => {
      document.body.classList.toggle('font-zoomed');
      btnFont.classList.toggle('active');
      const isZoomed = document.body.classList.contains('font-zoomed');
      KongiExerciseRoom.speak(isZoomed ? "글자 크기를 아주 크게 확대했습니다." : "글자 크기를 기본 크기로 변경했습니다.");
    });
  }

  // 초기 안내 음성
  setTimeout(() => {
    if (KongiExerciseRoom.voiceEnabled) {
      KongiExerciseRoom.speak("콩이의 운동방에 오신 것을 환영합니다. 의자에 편안하게 앉아서 마음에 드는 운동을 골라보세요.");
    }
  }, 500);
});
