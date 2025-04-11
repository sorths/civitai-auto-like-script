// ==UserScript==
// @name         Civitai Auto Like
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically clicks like buttons on Civitai images (max 100 likes)
// @author       You
// @match        https://civitai.com/images
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 스크립트 실행 상태 관리
    let isScriptRunning = false;
    let errorLogs = [];
    const MAX_LIKES = 100; // 최대 좋아요 개수 제한
    let progressUI = null;
    let logUI = null;

    // 랜덤 딜레이 생성 함수 (최소 1초, 최대 3초)
    function getRandomDelay() {
        return Math.floor(Math.random() * 2000) + 1000; // 1000ms ~ 3000ms
    }

    // UI 요소 제거 함수
    function removeUIElements() {
        if (progressUI) {
            progressUI.remove();
            progressUI = null;
        }
        if (logUI) {
            logUI.remove();
            logUI = null;
        }
    }

    // 닫기 버튼 생성 함수
    function createCloseButton(onClick) {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0 5px;
            line-height: 1;
        `;
        closeButton.onclick = onClick;
        return closeButton;
    }

    // 로그 UI 생성
    function createLogUI() {
        const logDiv = document.createElement('div');
        logDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            z-index: 9999;
            min-width: 300px;
            max-height: 200px;
            overflow-y: auto;
        `;

        const logTitle = document.createElement('h3');
        logTitle.textContent = '에러 로그';
        logTitle.style.margin = '0 0 10px 0';
        logDiv.appendChild(logTitle);

        const logContent = document.createElement('div');
        logContent.id = 'error-log-content';
        logContent.style.cssText = `
            font-size: 12px;
            line-height: 1.4;
            color: #ff6b6b;
        `;
        logDiv.appendChild(logContent);

        // 닫기 버튼 추가
        const closeButton = createCloseButton(() => {
            logDiv.remove();
            logUI = null;
        });
        logDiv.appendChild(closeButton);

        document.body.appendChild(logDiv);
        logUI = logDiv;
        return logContent;
    }

    // 진행 상황을 보여주는 UI 생성
    function createProgressUI() {
        const progressDiv = document.createElement('div');
        progressDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            z-index: 9999;
            min-width: 200px;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Civitai Auto Like';
        title.style.margin = '0 0 10px 0';
        progressDiv.appendChild(title);

        const progressText = document.createElement('div');
        progressText.id = 'progress-text';
        progressText.style.marginBottom = '10px';
        progressDiv.appendChild(progressText);

        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            width: 100%;
            height: 10px;
            background: #333;
            border-radius: 5px;
            overflow: hidden;
        `;

        const progressBarInner = document.createElement('div');
        progressBarInner.id = 'progress-bar-inner';
        progressBarInner.style.cssText = `
            height: 100%;
            background: #4CAF50;
            width: 0%;
            transition: width 0.3s;
        `;
        progressBar.appendChild(progressBarInner);
        progressDiv.appendChild(progressBar);

        // 시작/중지 버튼 추가
        const controlButton = document.createElement('button');
        controlButton.textContent = '중지';
        controlButton.style.cssText = `
            margin-top: 10px;
            padding: 5px 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        controlButton.onclick = () => {
            if (isScriptRunning) {
                isScriptRunning = false;
                controlButton.textContent = '시작';
                controlButton.style.background = '#4CAF50';
            } else {
                isScriptRunning = true;
                controlButton.textContent = '중지';
                controlButton.style.background = '#ff6b6b';
                clickLikeButtons();
            }
        };
        progressDiv.appendChild(controlButton);

        // 닫기 버튼 추가
        const closeButton = createCloseButton(() => {
            progressDiv.remove();
            progressUI = null;
            if (isScriptRunning) {
                isScriptRunning = false;
                if (logUI) {
                    logUI.remove();
                    logUI = null;
                }
            }
        });
        progressDiv.appendChild(closeButton);

        document.body.appendChild(progressDiv);
        progressUI = progressDiv;
        return { progressText, progressBarInner };
    }

    // 에러 로그 추가
    function addErrorLog(message, error) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}: ${error?.message || error}`;
        errorLogs.push(logEntry);

        const logContent = document.getElementById('error-log-content');
        if (logContent) {
            const logElement = document.createElement('div');
            logElement.textContent = logEntry;
            logContent.appendChild(logElement);
            logContent.scrollTop = logContent.scrollHeight;
        }
    }

    // 스크롤을 내리면서 모든 이미지 로드
    function loadAllImages() {
        return new Promise((resolve, reject) => {
            let lastHeight = document.body.scrollHeight;
            let scrollCount = 0;
            const maxScrolls = 20;

            const scrollInterval = setInterval(() => {
                if (!isScriptRunning) {
                    clearInterval(scrollInterval);
                    reject(new Error('사용자에 의해 중지됨'));
                    return;
                }

                window.scrollTo(0, document.body.scrollHeight);
                scrollCount++;

                if (scrollCount >= maxScrolls) {
                    clearInterval(scrollInterval);
                    resolve();
                    return;
                }

                setTimeout(() => {
                    const newHeight = document.body.scrollHeight;
                    if (newHeight === lastHeight) {
                        clearInterval(scrollInterval);
                        resolve();
                    }
                    lastHeight = newHeight;
                }, getRandomDelay());
            }, getRandomDelay());
        });
    }

    // 좋아요 버튼 클릭 함수
    async function clickLikeButtons() {
        if (isScriptRunning) {
            addErrorLog('경고', '이미 실행 중인 스크립트가 있습니다.');
            return;
        }

        isScriptRunning = true;
        const { progressText, progressBarInner } = createProgressUI();
        const logContent = createLogUI();

        try {
            await loadAllImages();

            const likeButtons = document.querySelectorAll('span.mantine-qo1k2.flex.gap-1.mantine-Button-label');
            const totalButtons = likeButtons.length;
            let clickedCount = 0;
            let skippedCount = 0;

            progressText.textContent = `총 ${totalButtons}개의 이미지 중 0개 처리됨 (최대 ${MAX_LIKES}개 좋아요)`;

            for (const button of likeButtons) {
                if (!isScriptRunning) {
                    progressText.textContent = '사용자에 의해 중지됨';
                    break;
                }

                // 최대 좋아요 개수에 도달하면 중지
                if (clickedCount >= MAX_LIKES) {
                    progressText.textContent = `최대 좋아요 개수(${MAX_LIKES}개)에 도달했습니다.`;
                    addErrorLog('정보', `최대 좋아요 개수(${MAX_LIKES}개)에 도달하여 중지합니다.`);
                    break;
                }

                try {
                    // 버튼이 보이도록 스크롤
                    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

                    // 이미 좋아요를 눌렀는지 확인
                    const isAlreadyLiked = button.closest('button')?.classList.contains('mantine-Button-filled');

                    if (!isAlreadyLiked) {
                        // 버튼 클릭
                        button.click();
                        clickedCount++;
                    } else {
                        skippedCount++;
                    }

                    // 진행 상황 업데이트
                    const progress = ((clickedCount + skippedCount) / totalButtons) * 100;
                    progressBarInner.style.width = `${progress}%`;
                    progressText.textContent = `총 ${totalButtons}개의 이미지 중 ${clickedCount + skippedCount}개 처리됨 (좋아요: ${clickedCount}/${MAX_LIKES}, 건너뜀: ${skippedCount})`;

                    // 랜덤 딜레이 추가
                    await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
                } catch (e) {
                    addErrorLog('버튼 클릭 오류', e);
                }
            }

            if (isScriptRunning) {
                progressText.textContent = `완료! 총 ${totalButtons}개의 이미지 중 ${clickedCount}개 좋아요, ${skippedCount}개 건너뜀`;
                // 완료 후 3초 후에 UI 요소 제거
                setTimeout(removeUIElements, 3000);
            }
        } catch (e) {
            addErrorLog('스크립트 실행 오류', e);
            progressText.textContent = '오류 발생! 로그를 확인하세요.';
        } finally {
            isScriptRunning = false;
        }
    }

    // 페이지 로드 후 실행
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!isScriptRunning) {
                clickLikeButtons();
            }
        }, 3000);
    });
})();