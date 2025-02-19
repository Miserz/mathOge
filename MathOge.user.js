// ==UserScript==
// @name         MathOge
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Enhanced testing interface with answer validation and time editing
// @author       Miserz_
// @match        https://math-oge.sdamgia.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function updateScore() {
        let correctCount = 0;
        let geometryCorrect = 0;
        const container = document.querySelector('div.test_results');

        if(container) {
            container.querySelectorAll('div:first-child tr.res_row').forEach(row => {
                const cells = row.querySelectorAll('td');
                if(cells.length >= 4) {
                    const targetCell = cells[2];
                    const userAnswer = targetCell.textContent.trim();
                    const correctAnswer = targetCell.dataset.correctAnswer;
                    const taskLink = row.querySelector('td:first-child a');

                    if(taskLink) {
                        const taskNumber = parseInt(taskLink.getAttribute('href').replace('#prob', ''), 10);
                        const isGeometryTask = taskNumber >= 15 && taskNumber <= 19;

                        if(userAnswer && userAnswer === correctAnswer) {
                            correctCount++;
                            if(isGeometryTask) geometryCorrect++;
                        }
                    }
                }
            });
        }

        const scoreElement = document.querySelector('.tr_b_score');
        const scorePoint = document.querySelector('.res_table + div p');
        const resultPoint = document.querySelector("body > div.wrapper > div.sgia-main-content > center:nth-child(9) > div");

        if(scoreElement) scoreElement.textContent = correctCount;

        if(scorePoint) {
            scorePoint.innerHTML = `Ре&shy;ше&shy;но ${correctCount} из 25  за&shy;да&shy;ний, на&shy;брано ${correctCount}  пер&shy;вич&shy;ных баллов.`;
        }

        if(resultPoint) {
            let grade = '2';
            if(correctCount >= 8 && geometryCorrect >= 2) {
                grade = correctCount <= 14 ? '3' : '4';
            }
            resultPoint.innerHTML = `Ваша оцен&shy;ка ${grade}`;
        }
    }

    function handleCellInput(e) {
        const cell = e.target;
        const correctAnswer = cell.dataset.correctAnswer;
        const userAnswer = cell.textContent.trim();

        if(userAnswer === '') {
            cell.style.backgroundColor = '';
        } else {
            const isCorrect = userAnswer === correctAnswer;
            cell.style.backgroundColor = isCorrect ? '#c0ffc0' : '#ffc0c0';
        }

        updateScore();
    }

    function makeCellsEditable() {
        const container = document.querySelector('div.test_results');
        if(!container) return;

        container.querySelectorAll('div:first-child tr.res_row').forEach(row => {
            const cells = row.querySelectorAll('td');
            if(cells.length < 4) return;

            const targetCell = cells[2];
            const lastCell = cells[3];

            targetCell.dataset.correctAnswer = lastCell.textContent.trim();

            if(targetCell.textContent.trim()) {
                const isCorrect = targetCell.textContent.trim() === targetCell.dataset.correctAnswer;
                targetCell.style.backgroundColor = isCorrect ? '#c0ffc0' : '#ffc0c0';
            }

            targetCell.contentEditable = true;
            targetCell.addEventListener('input', handleCellInput);
            targetCell.addEventListener('blur', handleCellInput);

            targetCell.style.cursor = 'text';
            targetCell.style.minWidth = '100px';

            lastCell.style.cursor = 'pointer';
            lastCell.addEventListener('click', () => {
                const currentAnswer = targetCell.textContent.trim();
                const correctAnswer = lastCell.textContent.trim();

                if(currentAnswer === '') {
                    targetCell.textContent = correctAnswer;
                } else {
                    targetCell.textContent = '';
                }

                handleCellInput({ target: targetCell });
            });
        });
    }

    function showAllAnswers() {
        const container = document.querySelector('div.test_results');
        if(!container) return;

        container.querySelectorAll('div:first-child tr.res_row').forEach(row => {
            const cells = row.querySelectorAll('td');
            if(cells.length < 4) return;

            const targetCell = cells[2];
            const correctAnswer = cells[3].textContent.trim();

            if(targetCell.textContent.trim() === '') {
                targetCell.textContent = correctAnswer;
                targetCell.style.backgroundColor = '#c0ffc0';
            }
        });

        updateScore();
    }

    function addControlButton() {
        const showAnswersBtn = document.querySelector("body > div.wrapper > div.sgia-main-content > center:nth-child(15) > table > tbody > tr > td:nth-child(1)");
        if (!showAnswersBtn) return;

        showAnswersBtn.style.cursor = 'pointer';
        showAnswersBtn.addEventListener('click', showAllAnswers);
    }

    function createTimeEditor() {
        const centerBlock = document.querySelector('div.sgia-main-content center');
        if(!centerBlock) return;

        const timeText = Array.from(centerBlock.childNodes).find(node =>
            node.nodeType === Node.TEXT_NODE &&
            node.textContent.includes('Сдана')
        );

        if(!timeText) return;

        const timeRegex = /(\d{2}:\d{2})(?=\s\()/;
        const newHtml = timeText.textContent.replace(timeRegex,
            `<span class="time-editable" style="cursor: pointer">$1</span>`
        );

        const wrapper = document.createElement('span');
        wrapper.innerHTML = newHtml;
        timeText.replaceWith(wrapper);

        const editableSpan = wrapper.querySelector('.time-editable');
        if(!editableSpan) return;

        editableSpan.addEventListener('click', function(e) {
            const currentTime = this.textContent;
            const input = document.createElement('input');

            input.type = 'text';
            input.value = currentTime;
            input.style.cssText = `
                width: 70px;
                text-align: center;
                font-family: monospace;
                border: 1px solid #666;
                padding: 2px;
            `;

            input.addEventListener('keydown', function(evt) {
                if(evt.key === 'Enter') this.blur();
                if(evt.key === 'Escape') {
                    this.value = currentTime;
                    this.blur();
                }
            });

            input.addEventListener('blur', function() {
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                if(timeRegex.test(this.value)) {
                    editableSpan.textContent = this.value;
                }
                wrapper.replaceChild(editableSpan, this);
            });

            this.replaceWith(input);
            input.focus();
            input.select();
        });
    }

    function init() {
        makeCellsEditable();
        addControlButton();
        createTimeEditor();
        updateScore();
    }

    window.addEventListener('load', init);
})();