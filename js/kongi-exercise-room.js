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

  // 관절 리그 및 립싱크/시퀀스 상태
  neckSequenceTimeouts: [],
  lipSyncInterval: null,
  blinkInterval: null,
  isTalking: false,
  neckCycleCount: 0,

  // 8대 의자 체조 기본 마스터 동작 데이터
  masterSteps: {
    prep: {
      name: "준비운동 (천천히 깊게 호흡하기)",
      actionTitle: "🌸 1단계: 천천히 깊게 호흡하기",
      speech: "안녕하세요. 콩이예요. 의자에 등을 편안히 기대고, 코로 숨을 깊게 들이쉬어 볼까요?",
      guide: "코로 숨을 천천히 들이마셨다가, 1초 멈추고, 입으로 천천히 후~ 내쉽니다.",
      duration: 35,
      motionType: "breath"
    },
    neck: {
      name: "목 운동 (좌우 천천히 부드럽게 숙이기)",
      actionTitle: "🌸 2단계: 부드럽게 목 숙이기",
      speech: "이번에는 목을 부드럽게 움직여볼게요. 무리하지 말고 아프지 않은 만큼만 움직여주세요.",
      guide: "머리를 목 관절 중심으로 오른쪽으로 천천히 기울였다가, 가운데를 거쳐 왼쪽으로도 부드럽게 움직입니다.",
      duration: 40,
      motionType: "neck"
    },
    shoulder: {
      name: "어깨 운동 (양 어깨 으쓱으쓱 올렸다 내리기)",
      actionTitle: "🌸 3단계: 어깨 으쓱으쓱 올렸다 내리기",
      speech: "어깨를 귀 쪽으로 으쓱 올렸다가 툭 하고 내려놓으세요. 아주 잘하고 계세요.",
      guide: "양 어깨를 부드럽게 위로 올렸다가 편안하게 아래로 내려놓습니다.",
      duration: 40,
      motionType: "shoulder"
    },
    arm: {
      name: "팔 운동 (양팔 앞으로 뻗고 살포시 굽히기)",
      actionTitle: "🌸 4단계: 양팔을 앞으로 뻗고 당기기",
      speech: "천천히 팔을 앞으로 올려볼까요? 가슴 앞으로 쭉 뻗었다가 살며시 당겨주세요.",
      guide: "양팔을 가슴 앞으로 천천히 뻗었다가 부드럽게 가슴 쪽으로 끌어당깁니다.",
      duration: 40,
      motionType: "arm"
    },
    finger: {
      name: "손가락 운동 (주먹 쥐고 쫙 펴기)",
      actionTitle: "🌸 5단계: 손가락 주먹 쥐고 활짝 펴기",
      speech: "손가락을 주먹 쥐었다가 활짝 펴보세요. 손끝을 톡톡 마주치며 뇌를 깨워요.",
      guide: "양손 주먹을 살며시 쥐었다가 손바닥을 활짝 펴고, 손끝을 톡톡 부딪힙니다.",
      duration: 40,
      motionType: "finger"
    },
    knee: {
      name: "무릎 운동 (의자에 앉아 한쪽 무릎 살짝 들기)",
      actionTitle: "🌸 6단계: 의자에서 무릎 살짝 들기",
      speech: "의자를 가볍게 잡고 무릎을 살짝 들어 올려보세요. 힘들면 언제든 쉬어도 괜찮아요.",
      guide: "의자를 양손으로 꼭 잡고, 발을 바닥에서 5센티미터만 살짝 들어 올립니다.",
      duration: 40,
      motionType: "knee"
    },
    ankle: {
      name: "발목 운동 (발끝 들고 까딱까딱 움직이기)",
      actionTitle: "🌸 7단계: 발끝 들고 발목 까딱까딱",
      speech: "발뒤꿈치를 바닥에 대고 발끝을 까딱까딱 움직여볼까요? 다리가 시원해져요.",
      guide: "뒤꿈치를 바닥에 두고 발끝을 위로 살며시 당겼다 내립니다.",
      duration: 40,
      motionType: "ankle"
    },
    finish: {
      name: "마무리 호흡 (가슴 활짝 펴고 숨 고르기)",
      actionTitle: "🌸 8단계: 가슴 펴고 마무리 호흡하기",
      speech: "마지막으로 가슴을 활짝 펴고 깊게 숨을 쉬어보세요. 오늘도 정말 훌륭하게 해내셨어요!",
      guide: "양팔을 넓게 벌려 가슴을 펴고, 깊고 편안한 호흡으로 운동을 마무리합니다.",
      duration: 35,
      motionType: "finish"
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
      stepKeys: ['prep', 'neck', 'shoulder', 'arm', 'finger', 'finish']
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
  startBreathingExerciseMotion() {
    this.clearAllRigMotions();
    const svg = document.getElementById('kongiRigSvg');
    const torso = document.getElementById('torsoGroup');
    const leftArm = document.getElementById('leftArmGroup');
    const rightArm = document.getElementById('rightArmGroup');
    if (!svg || !torso) return;

    svg.classList.add('is-breathing-active');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    // 1. 인사 발화 (0s)
    this.speak("안녕하세요. 콩이예요.");

    // 2. 들이마시기 안내 발화 (2.2s)
    schedule(() => {
      if (this.isPaused) return;
      this.speak("의자에 등을 편안히 기대고, 코로 숨을 깊게 들이쉬어 볼까요?");
    }, 2200);

    // 단일 호흡 사이클 실행 함수 (들이마시기 3초 -> 멈추기 1초 -> 내쉬기 4초)
    const runBreathCycle = (cycleIndex, delayStartMs, isFirstCycle = false) => {
      schedule(() => {
        if (this.isPaused) return;

        // [동작 1] 코로 숨을 천천히 들이마실 때 (3초)
        // - 가슴과 배가 아주 살짝 부풀어 오름 (과장 금지)
        // - 양쪽 어깨가 아주 조금 올라감
        torso.style.transform = 'scale(1.025, 1.035)';
        if (leftArm && rightArm) {
          leftArm.style.transform = 'translateY(-7px) rotate(1.2deg)';
          rightArm.style.transform = 'translateY(-7px) rotate(-1.2deg)';
        }
        svg.setAttribute('data-mouth', 'smile');

        // 눈 자연스럽게 한 번 깜빡임 (들이마시는 중간 1.2초 지점)
        schedule(() => {
          if (this.isPaused) return;
          svg.classList.add('is-blinking');
          setTimeout(() => svg.classList.remove('is-blinking'), 160);
        }, 1200);

        // [동작 2] 1초 정도 편안하게 유지 (3.0초 ~ 4.0초)
        schedule(() => {
          if (this.isPaused) return;
          // 부풀어 오른 가슴과 올라간 어깨 1초간 유지
        }, 3000);

        // [동작 3] 입으로 천천히 숨을 내쉴 때 (4초, 4.0초 ~ 8.0초)
        schedule(() => {
          if (this.isPaused) return;

          // 첫 번째 사이클일 때 내쉬기 안내 음성 출력
          if (isFirstCycle) {
            this.speak("좋아요. 이제 입으로 천천히 후~ 내쉬어 볼게요.", () => {
              // 발화 직후 '후~' 입 모양으로 즉시 복귀
              if (svg) svg.setAttribute('data-mouth', 'exhale');
            });
          }

          // 입 모양이 자연스럽게 '후~' 모양으로 변함
          svg.setAttribute('data-mouth', 'exhale');

          // 가슴과 배가 천천히 원래 위치로 돌아옴
          torso.style.transform = 'scale(1, 1)';
          // 어깨도 천천히 내려옴
          if (leftArm && rightArm) {
            leftArm.style.transform = 'translateY(0) rotate(0deg)';
            rightArm.style.transform = 'translateY(0) rotate(0deg)';
          }
        }, 4000);

        // 내쉬기 완료 후 미소 복귀 (8.0초 지점)
        schedule(() => {
          if (this.isPaused) return;
          svg.setAttribute('data-mouth', 'smile');
        }, 8000);

      }, delayStartMs);
    };

    // 1회차 호흡 사이클 (6.8초 지점에서 시작)
    runBreathCycle(1, 6800, true);

    // 2회차 호흡 사이클 (16.0초 지점에서 시작)
    runBreathCycle(2, 16000, false);

    // 3회차 호흡 사이클 (25.0초 지점에서 시작)
    runBreathCycle(3, 25000, false);
  },

  // --------------------------------------------------------------------------
  // [2단계: 부드럽게 목 움직이기] 핵심 관절 시퀀서
  // --------------------------------------------------------------------------
  startNeckExerciseMotion() {
    this.clearAllRigMotions();
    const head = document.getElementById('kongiHeadGroup');
    const leftEar = document.getElementById('leftEarGroup');
    const rightEar = document.getElementById('rightEarGroup');
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
        // 시작 전 안내 음성
        this.speak("이번에는 목을 부드럽게 움직여볼게요.");
      }

      // 2. 스텝 (약 2.6초 후): 고개를 오른쪽으로 천천히 기울인다
      schedule(() => {
        if (this.isPaused) return;
        this.speak("오른쪽으로 천천히 기울여보세요.");
        // 목 관절 피벗(300, 215) 중심으로 아주 천천히 +13도 회전
        head.style.transform = 'rotate(13deg)';
        if (leftEar) leftEar.style.transform = 'rotate(-3deg)';
        if (rightEar) rightEar.style.transform = 'rotate(2deg)';
      }, 2600);

      // 3. 스텝 (약 6.6초 후): 약 2초간 편안하게 유지
      schedule(() => {
        if (this.isPaused) return;
        // 각도 그대로 유지 (+13deg), 편안하게 미소
      }, 6600);

      // 4. 스텝 (약 8.8초 후): 천천히 중앙으로 돌아온다
      schedule(() => {
        if (this.isPaused) return;
        this.speak("좋아요. 다시 가운데로 돌아올게요.");
        head.style.transform = 'rotate(0deg)';
        if (leftEar) leftEar.style.transform = 'rotate(0deg)';
        if (rightEar) rightEar.style.transform = 'rotate(0deg)';
      }, 8800);

      // 5. 스텝 (약 12.2초 후): 고개를 왼쪽으로 천천히 기울인다
      schedule(() => {
        if (this.isPaused) return;
        this.speak("이번에는 반대쪽이에요.");
        // 목 관절 피벗 중심으로 아주 천천히 -13도 회전
        head.style.transform = 'rotate(-13deg)';
        if (leftEar) leftEar.style.transform = 'rotate(-2deg)';
        if (rightEar) rightEar.style.transform = 'rotate(3deg)';
      }, 12200);

      // 6. 스텝 (약 16.2초 후): 약 2초간 편안하게 유지
      schedule(() => {
        if (this.isPaused) return;
        // 각도 그대로 유지 (-13deg)
      }, 16200);

      // 7. 스텝 (약 18.4초 후): 다시 중앙으로 돌아온다
      schedule(() => {
        if (this.isPaused) return;
        this.speak("무리하지 말고 아프지 않은 만큼만 움직여주세요.");
        head.style.transform = 'rotate(0deg)';
        if (leftEar) leftEar.style.transform = 'rotate(0deg)';
        if (rightEar) rightEar.style.transform = 'rotate(0deg)';
      }, 18400);

      // 약 22초 후 2회차 사이클 부드럽게 연결
      if (!isSecondCycle) {
        schedule(() => {
          if (!this.isPaused) runNeckCycle(true);
        }, 22500);
      }
    };

    runNeckCycle(false);
  },

  // 다른 단계별 신체 관절 실제 움직임 적용
  applyStepJointMotion(motionType) {
    this.clearAllRigMotions();
    const head = document.getElementById('kongiHeadGroup');
    const leftArm = document.getElementById('leftArmGroup');
    const rightArm = document.getElementById('rightArmGroup');
    const leftHand = document.getElementById('leftHandGroup');
    const rightHand = document.getElementById('rightHandGroup');
    const leftLeg = document.getElementById('leftLegGroup');

    const schedule = (fn, delayMs) => {
      const tid = setTimeout(() => {
        if (!this.isPaused) fn();
      }, delayMs);
      this.neckSequenceTimeouts.push(tid);
    };

    switch (motionType) {
      case 'breath':
      case 'prep':
        this.startBreathingExerciseMotion();
        break;

      case 'neck':
        this.startNeckExerciseMotion();
        break;

      case 'finish':
        // 가슴 및 어깨 안정 호흡 관절 모션
        const breatheStep = () => {
          if (leftArm && rightArm) {
            leftArm.style.transform = 'translateY(-6px) rotate(2deg)';
            rightArm.style.transform = 'translateY(-6px) rotate(-2deg)';
          }
          schedule(() => {
            if (leftArm && rightArm) {
              leftArm.style.transform = 'translateY(0) rotate(0deg)';
              rightArm.style.transform = 'translateY(0) rotate(0deg)';
            }
          }, 3000);
        };
        breatheStep();
        schedule(breatheStep, 6500);
        schedule(breatheStep, 13000);
        schedule(breatheStep, 19500);
        break;

      case 'shoulder':
        // 3단계: 어깨 으쓱으쓱 올렸다 내리기
        const shoulderStep = () => {
          if (leftArm && rightArm) {
            leftArm.style.transform = 'translateY(-14px) rotate(4deg)';
            rightArm.style.transform = 'translateY(-14px) rotate(-4deg)';
          }
          schedule(() => {
            if (leftArm && rightArm) {
              leftArm.style.transform = 'translateY(0) rotate(0deg)';
              rightArm.style.transform = 'translateY(0) rotate(0deg)';
            }
          }, 3200);
        };
        shoulderStep();
        schedule(shoulderStep, 7000);
        schedule(shoulderStep, 14000);
        schedule(shoulderStep, 21000);
        break;

      case 'arm':
        // 4단계: 팔 앞으로 뻗고 당기기
        const armStep = () => {
          if (leftArm && rightArm) {
            leftArm.style.transform = 'rotate(-10deg) scale(1.04)';
            rightArm.style.transform = 'rotate(10deg) scale(1.04)';
          }
          schedule(() => {
            if (leftArm && rightArm) {
              leftArm.style.transform = 'rotate(0deg) scale(1)';
              rightArm.style.transform = 'rotate(0deg) scale(1)';
            }
          }, 3500);
        };
        armStep();
        schedule(armStep, 7500);
        schedule(armStep, 15000);
        schedule(armStep, 22500);
        break;

      case 'finger':
        // 5단계: 손가락 및 손목 주먹 쥐고 펴기
        const fingerStep = () => {
          if (leftHand && rightHand) {
            leftHand.style.transform = 'rotate(10deg)';
            rightHand.style.transform = 'rotate(-10deg)';
          }
          schedule(() => {
            if (leftHand && rightHand) {
              leftHand.style.transform = 'rotate(-6deg)';
              rightHand.style.transform = 'rotate(6deg)';
            }
          }, 2000);
        };
        fingerStep();
        schedule(fingerStep, 4500);
        schedule(fingerStep, 9000);
        schedule(fingerStep, 13500);
        schedule(fingerStep, 18000);
        break;

      case 'knee':
        // 6단계: 의자에서 무릎 살짝 들기 (엉덩이는 의자에 완전히 고정)
        const kneeStep = () => {
          if (leftLeg) {
            leftLeg.style.transform = 'translateY(-10px) rotate(-3deg)';
          }
          schedule(() => {
            if (leftLeg) {
              leftLeg.style.transform = 'translateY(0) rotate(0deg)';
            }
          }, 3200);
        };
        kneeStep();
        schedule(kneeStep, 7000);
        schedule(kneeStep, 14000);
        schedule(kneeStep, 21000);
        break;

      case 'ankle':
        // 7단계: 발끝 들고 발목 까딱까딱
        const ankleStep = () => {
          if (leftLeg) leftLeg.style.transform = 'rotate(-2deg)';
          schedule(() => {
            if (leftLeg) leftLeg.style.transform = 'rotate(0deg)';
          }, 2200);
        };
        ankleStep();
        schedule(ankleStep, 4800);
        schedule(ankleStep, 9600);
        schedule(ankleStep, 14400);
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
    this.renderCurrentStep();
    this.startStepTimer();

    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // 실제 신체 관절 움직임 실행 (목 운동 2단계 또는 해당 동작 모션)
    this.applyStepJointMotion(step.motionType);

    // 1단계(호흡) 및 2단계(목 운동)의 경우 내부에서 세밀한 안내 음성을 순차적으로 발화하므로,
    // 다른 일반 단계인 경우에만 기본 step.speech 발화
    if (step.motionType !== 'neck' && step.motionType !== 'breath' && step.motionType !== 'prep') {
      this.speak(step.speech);
    }
  },

  // 단계 타이머 시작
  startStepTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.isPaused) return;

      this.stepSecondsRemaining--;
      this.totalElapsedSeconds++;
      this.updateTimerDisplay();

      // 중간 음성 격려 멘트 (목 운동 단계 외의 단계에서 15초 남았을 때 격려)
      const currentStep = this.steps[this.currentStepIndex];
      if (currentStep && currentStep.motionType !== 'neck' && this.stepSecondsRemaining === 15) {
        this.speak("아주 잘하고 계세요. 무리하지 마시고 편안하게 호흡하세요.");
      }

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

    if (this.isPaused) {
      // 잠깐 쉬기 상태
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
    this.clearAllRigMotions();
    this.stopLipSync();
    this.speak("운동을 종료합니다. 오늘 참여하신 내용을 안전하게 저장할게요.");
    this.finishExercise(false);
  },

  // 운동 종료 처리 및 기록 저장
  finishExercise(isFullyCompleted) {
    clearInterval(this.timerInterval);
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
